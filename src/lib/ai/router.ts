import { generateText, streamText, type LanguageModelUsage } from 'ai';
import type { ModelMessage } from '@ai-sdk/provider-utils';
import { getProvider, type ProviderName, type FeatureType, PROVIDER_CONFIGS } from './providers';
import { getLLMConfig, getFeatureConfig, getEnabledProviders } from './config';
import { trackUsage, trackFailure } from './usage-tracker';
import {
  FailoverError,
  isRetryableError,
} from './failover';
import {
  optimizeProviderOrder,
  checkAllBudgetThresholds,
  filterByBudget,
  getSmartRoutingDecision,
  type BudgetAlert,
} from './smart-routing';

export { FailoverError } from './failover';
export { optimizeProviderOrder, checkAllBudgetThresholds, getSmartRoutingDecision } from './smart-routing';
export type { BudgetAlert } from './smart-routing';

interface GenerateOptions {
  prompt: string;
  featureType: FeatureType;
  teacherId?: string;
  maxOutputTokens?: number;
  temperature?: number;
  system?: string;
}

/**
 * Vision 분석 옵션 - 이미지를 포함한 요청
 */
interface VisionGenerateOptions {
  featureType: FeatureType;
  teacherId?: string;
  maxOutputTokens?: number;
  temperature?: number;
  system?: string;
  /** base64 인코딩된 이미지 데이터 */
  imageBase64: string;
  /** 이미지 MIME 타입 (예: 'image/jpeg', 'image/png') */
  mimeType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
  /** 이미지와 함께 보낼 프롬프트 */
  prompt: string;
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

/**
 * 스마트 라우팅 사용 여부 (환경 변수로 제어)
 * 기본값: true (비용 최적화 활성화)
 */
const USE_SMART_ROUTING = process.env.LLM_SMART_ROUTING !== 'false';

/**
 * 제공자 순서를 결정합니다.
 *
 * 스마트 라우팅이 활성화된 경우:
 * 1. 예산 내 제공자만 필터링
 * 2. 비용 기반으로 정렬 (Ollama > Google > OpenAI > Anthropic)
 *
 * 스마트 라우팅 비활성화 시:
 * 기존 방식 (기능별 설정의 primaryProvider + fallbackOrder)
 */
async function getProviderOrder(featureType: FeatureType): Promise<ProviderName[]> {
  const featureConfig = await getFeatureConfig(featureType);
  let enabledProviders = await getEnabledProviders();

  if (enabledProviders.length === 0) {
    throw new Error('No enabled providers available');
  }

  // 스마트 라우팅: 예산 필터링 + 비용 최적화
  if (USE_SMART_ROUTING) {
    // 예산 초과 시 무료 제공자만 허용
    enabledProviders = await filterByBudget(enabledProviders);

    // 비용 기반 정렬
    const optimizedOrder = optimizeProviderOrder(enabledProviders, featureType);

    // 예산 임계값 체크 (비동기 알림 트리거)
    checkAllBudgetThresholds().then((alerts) => {
      if (alerts.length > 0) {
        console.warn('[Smart Routing] Budget alerts:', alerts);
        // TODO: 실제 알림 시스템 연동 (이메일, Slack 등)
      }
    }).catch((err) => {
      console.error('[Smart Routing] Failed to check budget thresholds:', err);
    });

    if (optimizedOrder.length === 0) {
      throw new Error('No providers available within budget');
    }

    return optimizedOrder;
  }

  // 레거시 방식: 기능별 설정 기반
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

/**
 * Vision 지원 제공자 필터링
 * 이미지 분석이 필요한 경우, Vision을 지원하는 제공자만 반환
 */
async function getVisionProviderOrder(featureType: FeatureType): Promise<ProviderName[]> {
  const allProviders = await getProviderOrder(featureType);

  // Vision을 지원하는 제공자만 필터링
  const visionProviders = allProviders.filter(
    (provider) => PROVIDER_CONFIGS[provider].supportsVision
  );

  if (visionProviders.length === 0) {
    throw new Error(
      `No vision-capable providers available for feature "${featureType}". ` +
      `Vision is supported by: ${Object.entries(PROVIDER_CONFIGS)
        .filter(([, config]) => config.supportsVision)
        .map(([name]) => name)
        .join(', ')}`
    );
  }

  return visionProviders;
}

/**
 * Vision 기반 텍스트 생성 (이미지 분석)
 *
 * 이미지를 분석하고 텍스트 응답을 생성합니다.
 * Vision을 지원하는 제공자에서만 실행되며, 실패 시 자동으로 다음 제공자로 폴백합니다.
 *
 * @param options - Vision 분석 옵션
 * @returns GenerateResult with analysis text
 * @throws FailoverError when all vision-capable providers fail
 *
 * @example
 * ```ts
 * const result = await generateWithVision({
 *   featureType: 'face_analysis',
 *   imageBase64: base64Data,
 *   mimeType: 'image/jpeg',
 *   prompt: FACE_READING_PROMPT,
 *   teacherId: session.userId,
 * });
 * ```
 */
export async function generateWithVision(
  options: VisionGenerateOptions
): Promise<GenerateResult> {
  const {
    featureType,
    teacherId,
    maxOutputTokens = 2048,
    temperature,
    system,
    imageBase64,
    mimeType,
    prompt,
  } = options;

  const providerOrder = await getVisionProviderOrder(featureType);
  const featureConfig = await getFeatureConfig(featureType);

  let lastError: Error | null = null;
  let failoverFrom: ProviderName | undefined;

  for (let i = 0; i < providerOrder.length; i++) {
    const provider = providerOrder[i];
    const isFailover = i > 0;

    if (isFailover) {
      failoverFrom = providerOrder[i - 1];
      console.warn(
        `[LLM Router] Vision failover: ${failoverFrom} -> ${provider} for ${featureType}`
      );
    }

    const startTime = Date.now();

    try {
      const isReady = await setupProviderEnv(provider);
      if (!isReady) {
        console.warn(`Provider ${provider} not ready for vision, skipping...`);
        continue;
      }

      const config = await getLLMConfig(provider);
      const modelId = featureConfig.modelOverride || config?.defaultModel || undefined;

      const model = getProvider(provider, modelId);

      // Vercel AI SDK messages format with image
      const messages: ModelMessage[] = [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              image: `data:${mimeType};base64,${imageBase64}`,
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ];

      const result = await generateText({
        model,
        messages,
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

      console.error(`[LLM Router] Vision provider ${provider} failed:`, errorMessage);

      await trackFailure({
        provider,
        modelId: featureConfig.modelOverride || 'default',
        featureType,
        teacherId,
        errorMessage,
        responseTimeMs,
      });

      lastError = error instanceof Error ? error : new Error(String(error));

      // Non-retryable errors should stop the failover chain
      if (!isRetryableError(lastError)) {
        console.warn(
          `[LLM Router] Vision error is not retryable, stopping: ${lastError.message}`
        );
        break;
      }
    }
  }

  throw new FailoverError(featureType, [
    {
      provider: providerOrder[providerOrder.length - 1] || 'unknown' as ProviderName,
      error: lastError || new Error('Unknown error'),
      timestamp: new Date(),
      durationMs: 0,
    },
  ]);
}

/**
 * 특정 Vision 제공자로 이미지 분석
 *
 * 지정된 제공자로만 분석을 시도하며, 폴백하지 않습니다.
 *
 * @param provider - 사용할 제공자
 * @param options - Vision 분석 옵션
 * @returns GenerateResult with analysis text
 * @throws Error when provider fails or doesn't support vision
 */
export async function generateVisionWithSpecificProvider(
  provider: ProviderName,
  options: Omit<VisionGenerateOptions, 'featureType'> & { featureType?: FeatureType }
): Promise<GenerateResult> {
  const {
    featureType = 'face_analysis',
    teacherId,
    maxOutputTokens = 2048,
    temperature,
    system,
    imageBase64,
    mimeType,
    prompt,
  } = options;

  // Vision 지원 확인
  if (!PROVIDER_CONFIGS[provider].supportsVision) {
    throw new Error(
      `Provider ${provider} does not support vision. ` +
      `Use one of: ${Object.entries(PROVIDER_CONFIGS)
        .filter(([, config]) => config.supportsVision)
        .map(([name]) => name)
        .join(', ')}`
    );
  }

  const startTime = Date.now();

  const isReady = await setupProviderEnv(provider);
  if (!isReady) {
    throw new Error(`Provider ${provider} is not configured or enabled`);
  }

  const config = await getLLMConfig(provider);
  const modelId = config?.defaultModel || undefined;

  const model = getProvider(provider, modelId);

  const messages: ModelMessage[] = [
    {
      role: 'user',
      content: [
        {
          type: 'image',
          image: `data:${mimeType};base64,${imageBase64}`,
        },
        {
          type: 'text',
          text: prompt,
        },
      ],
    },
  ];

  const result = await generateText({
    model,
    messages,
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
