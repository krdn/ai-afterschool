import { generateText, streamText, type LanguageModelUsage } from 'ai';
import { getProvider, type ProviderName, type FeatureType } from './providers';
import { getLLMConfig, getFeatureConfig, getEnabledProviders } from './config';
import { trackUsage, trackFailure } from './usage-tracker';

interface GenerateOptions {
  prompt: string;
  featureType: FeatureType;
  teacherId?: string;
  maxOutputTokens?: number;
  temperature?: number;
  system?: string;
}

interface GenerateResult {
  text: string;
  usage: LanguageModelUsage;
  provider: ProviderName;
  model: string;
  wasFailover: boolean;
  failoverFrom?: ProviderName;
}

async function setupProviderEnv(provider: ProviderName): Promise<boolean> {
  const config = await getLLMConfig(provider);
  
  if (!config || !config.isEnabled) {
    return false;
  }

  if (provider === 'ollama') {
    if (config.baseUrl) {
      process.env.OLLAMA_BASE_URL = config.baseUrl;
    }
    return true;
  }

  if (!config.apiKey) {
    return false;
  }

  switch (provider) {
    case 'anthropic':
      process.env.ANTHROPIC_API_KEY = config.apiKey;
      break;
    case 'openai':
      process.env.OPENAI_API_KEY = config.apiKey;
      break;
    case 'google':
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = config.apiKey;
      break;
  }

  return true;
}

async function getProviderOrder(featureType: FeatureType): Promise<ProviderName[]> {
  const featureConfig = await getFeatureConfig(featureType);
  const enabledProviders = await getEnabledProviders();

  const primaryEnabled = enabledProviders.includes(featureConfig.primaryProvider as ProviderName);
  const fallbackFiltered = (featureConfig.fallbackOrder as ProviderName[]).filter(
    (p) => enabledProviders.includes(p)
  );

  const order: ProviderName[] = [];
  if (primaryEnabled) {
    order.push(featureConfig.primaryProvider as ProviderName);
  }
  order.push(...fallbackFiltered.filter((p) => p !== featureConfig.primaryProvider));

  if (order.length === 0) {
    throw new Error('No enabled providers available');
  }

  return order;
}

export async function generateWithProvider(options: GenerateOptions): Promise<GenerateResult> {
  const { prompt, featureType, teacherId, maxOutputTokens, temperature, system } = options;
  const providerOrder = await getProviderOrder(featureType);
  const featureConfig = await getFeatureConfig(featureType);

  let lastError: Error | null = null;
  let failoverFrom: ProviderName | undefined;

  for (let i = 0; i < providerOrder.length; i++) {
    const provider = providerOrder[i];
    const isFailover = i > 0;
    
    if (isFailover) {
      failoverFrom = providerOrder[i - 1];
    }

    const startTime = Date.now();

    try {
      const isReady = await setupProviderEnv(provider);
      if (!isReady) {
        console.warn(`Provider ${provider} not ready, skipping...`);
        continue;
      }

      const config = await getLLMConfig(provider);
      const modelId = featureConfig.modelOverride || config?.defaultModel || undefined;

      const model = getProvider(provider, modelId);
      const result = await generateText({
        model,
        prompt,
        system,
        maxOutputTokens,
        temperature,
        maxRetries: 0,
      });

      const responseTimeMs = Date.now() - startTime;

      await trackUsage({
        provider,
        modelId: modelId || 'default',
        featureType,
        teacherId,
        inputTokens: result.usage?.inputTokens || 0,
        outputTokens: result.usage?.outputTokens || 0,
        responseTimeMs,
        success: true,
        failoverFrom: isFailover ? failoverFrom : undefined,
      });

      return {
        text: result.text,
        usage: result.usage,
        provider,
        model: modelId || 'default',
        wasFailover: isFailover,
        failoverFrom: isFailover ? failoverFrom : undefined,
      };
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.error(`Provider ${provider} failed:`, errorMessage);
      
      await trackFailure({
        provider,
        modelId: featureConfig.modelOverride || 'default',
        featureType,
        teacherId,
        errorMessage,
        responseTimeMs,
      });

      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw new Error(
    `All providers failed. Last error: ${lastError?.message || 'Unknown error'}`
  );
}

export async function streamWithProvider(options: GenerateOptions) {
  const { prompt, featureType, teacherId, maxOutputTokens, temperature, system } = options;
  const providerOrder = await getProviderOrder(featureType);
  const featureConfig = await getFeatureConfig(featureType);

  let lastError: Error | null = null;

  for (const provider of providerOrder) {
    const startTime = Date.now();

    try {
      const isReady = await setupProviderEnv(provider);
      if (!isReady) {
        continue;
      }

      const config = await getLLMConfig(provider);
      const modelId = featureConfig.modelOverride || config?.defaultModel || undefined;

      const model = getProvider(provider, modelId);
      const result = streamText({
        model,
        prompt,
        system,
        maxOutputTokens,
        temperature,
        maxRetries: 0,
        onFinish: async ({ usage }) => {
          const responseTimeMs = Date.now() - startTime;
          await trackUsage({
            provider,
            modelId: modelId || 'default',
            featureType,
            teacherId,
            inputTokens: usage?.inputTokens || 0,
            outputTokens: usage?.outputTokens || 0,
            responseTimeMs,
            success: true,
          });
        },
      });

      return {
        stream: result,
        provider,
        model: modelId || 'default',
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Provider ${provider} failed:`, lastError.message);
    }
  }

  throw new Error(
    `All providers failed. Last error: ${lastError?.message || 'Unknown error'}`
  );
}

export async function generateWithSpecificProvider(
  provider: ProviderName,
  options: Omit<GenerateOptions, 'featureType'> & { featureType?: FeatureType }
): Promise<GenerateResult> {
  const { prompt, featureType = 'learning_analysis', teacherId, maxOutputTokens, temperature, system } = options;
  const startTime = Date.now();

  const isReady = await setupProviderEnv(provider);
  if (!isReady) {
    throw new Error(`Provider ${provider} is not configured or enabled`);
  }

  const config = await getLLMConfig(provider);
  const modelId = config?.defaultModel || undefined;

  const model = getProvider(provider, modelId);
  const result = await generateText({
    model,
    prompt,
    system,
    maxOutputTokens,
    temperature,
    maxRetries: 2,
  });

  const responseTimeMs = Date.now() - startTime;

  await trackUsage({
    provider,
    modelId: modelId || 'default',
    featureType,
    teacherId,
    inputTokens: result.usage?.inputTokens || 0,
    outputTokens: result.usage?.outputTokens || 0,
    responseTimeMs,
    success: true,
  });

  return {
    text: result.text,
    usage: result.usage,
    provider,
    model: modelId || 'default',
    wasFailover: false,
  };
}
