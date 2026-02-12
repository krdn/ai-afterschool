/**
 * Universal Router
 * 
 * Universal LLM Hub를 사용하는 새로운 라우터입니다.
 * 기존 router.ts의 인터페이스를 유지하면서 남부 구현을 교체합니다.
 */

import { generateText, streamText, type LanguageModelUsage } from 'ai';
import type { ModelMessage } from '@ai-sdk/provider-utils';
import { db } from '@/lib/db';
import { FeatureResolver } from './feature-resolver';
import { getProviderRegistry } from './provider-registry';
import { getAdapter } from './adapters';
import { trackUsage, trackFailure } from './usage-tracker';
import { FailoverError, isRetryableError } from './failover';
import { decryptApiKey } from './encryption';

// Prisma 모델은 마이그레이션 후 생성됨 - 임시 타입 정의
type Provider = {
  id: string;
  name: string;
  providerType: string;
  baseUrl: string | null;
  apiKeyEncrypted: string | null;
  authType: string;
  customAuthHeader: string | null;
  capabilities: string[];
  costTier: string;
  qualityTier: string;
  isEnabled: boolean;
  isValidated: boolean;
  validatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type Model = {
  id: string;
  providerId: string;
  modelId: string;
  displayName: string;
  contextWindow: number | null;
  supportsVision: boolean;
  supportsTools: boolean;
  defaultParams: unknown;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// =============================================================================
// 기존 인터페이스 (router.ts와 동일)
// =============================================================================

export interface GenerateOptions {
  prompt: string;
  featureType: string;
  teacherId?: string;
  maxOutputTokens?: number;
  temperature?: number;
  system?: string;
}

/**
 * Vision 분석 옵션 - 이미지를 포함한 요청
 */
export interface VisionGenerateOptions {
  featureType: string;
  teacherId?: string;
  maxOutputTokens?: number;
  temperature?: number;
  system?: string;
  /** base64 인코딩된 이미지 데이터 */
  imageBase64: string;
  /** 이미지 MIME 타입 (예: 'image/jpeg', 'image/png') */
  mimeType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
  /** 이미지와 함께 별낼 프롬프트 */
  prompt: string;
}

export interface GenerateResult {
  text: string;
  usage: LanguageModelUsage;
  provider: string;
  model: string;
  wasFailover: boolean;
  failoverFrom?: string;
}

export interface StreamResult {
  stream: ReturnType<typeof streamText>;
  provider: string;
  model: string;
}

// =============================================================================
// 남부 구현 - Universal LLM Hub
// =============================================================================

// 싱글톤 FeatureResolver 인스턴스
let featureResolverInstance: FeatureResolver | null = null;

function getFeatureResolver(): FeatureResolver {
  if (!featureResolverInstance) {
    featureResolverInstance = new FeatureResolver(db);
  }
  return featureResolverInstance;
}

/**
 * 제공자 환경 설정
 * API 키를 환경 변수에 설정합니다.
 */
async function setupProviderEnv(provider: Provider): Promise<boolean> {
  // Ollama는 내장 제공자 — API 키 불필요
  if (provider.providerType === 'ollama') {
    if (provider.baseUrl) {
      process.env.OLLAMA_BASE_URL = provider.baseUrl;
    }
    return true;
  }

  if (!provider.isEnabled) {
    return false;
  }

  if (!provider.apiKeyEncrypted) {
    return false;
  }

  const apiKey = decryptApiKey(provider.apiKeyEncrypted);

  switch (provider.providerType) {
    case 'anthropic':
      process.env.ANTHROPIC_API_KEY = apiKey;
      break;
    case 'openai':
      process.env.OPENAI_API_KEY = apiKey;
      break;
    case 'google':
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = apiKey;
      break;
    case 'deepseek':
      process.env.DEEPSEEK_API_KEY = apiKey;
      break;
    case 'mistral':
      process.env.MISTRAL_API_KEY = apiKey;
      break;
    case 'cohere':
      process.env.COHERE_API_KEY = apiKey;
      break;
    case 'xai':
      process.env.XAI_API_KEY = apiKey;
      break;
    case 'zhipu':
      process.env.ZHIPU_API_KEY = apiKey;
      break;
    case 'moonshot':
      process.env.MOONSHOT_API_KEY = apiKey;
      break;
  }

  return true;
}

/**
 * 모델 ID로부터 LanguageModel을 생성합니다.
 */
function createLanguageModel(provider: Provider, model: Model) {
  const adapter = getAdapter(provider.providerType as import('./types').ProviderType);
  
  // API 키 설정
  if (provider.apiKeyEncrypted) {
    adapter.setApiKey(decryptApiKey(provider.apiKeyEncrypted));
  }
  
  // Base URL 설정
  if (provider.baseUrl) {
    adapter.setBaseUrl(provider.baseUrl);
  }

  return adapter.createModel(model.modelId, provider as import('./types').ProviderConfig);
}

// =============================================================================
// Public API - 기존 함수들과 동일한 시그니처
// =============================================================================

/**
 * FeatureResolver를 통해 제공자 순서를 결정합니다.
 */
async function getProviderOrder(
  featureType: string,
  needsVision?: boolean
): Promise<Array<{ provider: Provider; model: Model }>> {
  const resolver = getFeatureResolver();
  const results = await resolver.resolveWithFallback(featureType, { needsVision });

  if (results.length === 0) {
    throw new Error(`No providers available for feature "${featureType}"`);
  }

  // 타입 변환: FeatureResolver의 결과를 Provider/Model 타입으로 변환
  return results.map((r) => ({
    provider: r.provider as unknown as Provider,
    model: r.model as unknown as Model,
  }));
}

/**
 * 텍스트를 생성합니다.
 */
export async function generateWithProvider(options: GenerateOptions): Promise<GenerateResult> {
  const { prompt, featureType, teacherId, maxOutputTokens, temperature, system } = options;
  
  const providerOrder = await getProviderOrder(featureType);

  let lastError: Error | null = null;
  let failoverFrom: string | undefined;

  for (let i = 0; i < providerOrder.length; i++) {
    const { provider, model } = providerOrder[i];
    const isFailover = i > 0;
    
    if (isFailover) {
      failoverFrom = providerOrder[i - 1].provider.providerType;
    }

    const startTime = Date.now();

    try {
      const isReady = await setupProviderEnv(provider);
      if (!isReady) {
        console.warn(`Provider ${provider.providerType} not ready, skipping...`);
        continue;
      }

      const languageModel = createLanguageModel(provider, model);

      const result = await generateText({
        model: languageModel,
        prompt,
        system,
        maxOutputTokens,
        temperature,
        maxRetries: 0,
      });

      const responseTimeMs = Date.now() - startTime;

      await trackUsage({
        provider: provider.providerType as import('./providers/types').ProviderName,
        modelId: model.modelId,
        featureType: featureType as import('./providers/types').FeatureType,
        teacherId,
        inputTokens: result.usage?.inputTokens || 0,
        outputTokens: result.usage?.outputTokens || 0,
        responseTimeMs,
        success: true,
        failoverFrom: isFailover ? (failoverFrom as import('./providers/types').ProviderName) : undefined,
      });

      return {
        text: result.text,
        usage: result.usage,
        provider: provider.providerType,
        model: model.modelId,
        wasFailover: isFailover,
        failoverFrom: isFailover ? (failoverFrom as import('./providers/types').ProviderName) : undefined,
      };
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      console.error(`Provider ${provider.providerType} failed:`, errorMessage);

      await trackFailure({
        provider: provider.providerType as import('./providers/types').ProviderName,
        modelId: model.modelId,
        featureType: featureType as import('./providers/types').FeatureType,
        teacherId,
        errorMessage,
        responseTimeMs,
      });

      lastError = error instanceof Error ? error : new Error(String(error));

      // 재시도 불가능한 에러는 폴 백 체인 중단
      if (!isRetryableError(lastError)) {
        console.warn(`[Universal Router] Error is not retryable, stopping failover chain: ${lastError.message}`);
        break;
      }
    }
  }

  throw new Error(
    `All providers failed for feature "${featureType}". Last error: ${lastError?.message || 'Unknown error'}`
  );
}

/**
 * 텍스트를 스트리밍합니다.
 */
export async function streamWithProvider(options: GenerateOptions): Promise<StreamResult> {
  const { prompt, featureType, teacherId, maxOutputTokens, temperature, system } = options;
  
  const providerOrder = await getProviderOrder(featureType);

  let lastError: Error | null = null;

  for (const { provider, model } of providerOrder) {
    const startTime = Date.now();

    try {
      const isReady = await setupProviderEnv(provider);
      if (!isReady) {
        continue;
      }

      const languageModel = createLanguageModel(provider, model);

      const result = streamText({
        model: languageModel,
        prompt,
        system,
        maxOutputTokens,
        temperature,
        maxRetries: 0,
        onFinish: async ({ usage }) => {
          const responseTimeMs = Date.now() - startTime;
          await trackUsage({
            provider: provider.providerType as import('./providers/types').ProviderName,
            modelId: model.modelId,
            featureType: featureType as import('./providers/types').FeatureType,
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
        provider: provider.providerType,
        model: model.modelId,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Provider ${provider.providerType} failed:`, lastError.message);
    }
  }

  throw new Error(
    `All providers failed for feature "${featureType}". Last error: ${lastError?.message || 'Unknown error'}`
  );
}

/**
 * 특정 제공자로 텍스트를 생성합니다.
 */
export async function generateWithSpecificProvider(
  providerType: string,
  options: Omit<GenerateOptions, 'featureType'> & { featureType?: string }
): Promise<GenerateResult> {
  const { prompt, featureType = 'learning_analysis', teacherId, maxOutputTokens, temperature, system } = options;
  
  const registry = getProviderRegistry(db);
  const providers = await registry.list({ enabledOnly: true });
  const provider = providers.find(p => (p as unknown as Provider).providerType === providerType);

  if (!provider) {
    throw new Error(`Provider ${providerType} is not configured or enabled`);
  }

  const typedProvider = provider as unknown as Provider;
  const model = provider.models.find(m => m.isDefault) || provider.models[0];
  if (!model) {
    throw new Error(`No models available for provider ${providerType}`);
  }

  const startTime = Date.now();

  const isReady = await setupProviderEnv(typedProvider);
  if (!isReady) {
    throw new Error(`Provider ${providerType} is not configured or enabled`);
  }

  const languageModel = createLanguageModel(typedProvider, model as unknown as Model);

  const result = await generateText({
    model: languageModel,
    prompt,
    system,
    maxOutputTokens,
    temperature,
    maxRetries: 2,
  });

  const responseTimeMs = Date.now() - startTime;

  await trackUsage({
    provider: typedProvider.providerType as import('./providers/types').ProviderName,
    modelId: model.modelId,
    featureType: featureType as import('./providers/types').FeatureType,
    teacherId,
    inputTokens: result.usage?.inputTokens || 0,
    outputTokens: result.usage?.outputTokens || 0,
    responseTimeMs,
    success: true,
  });

  return {
    text: result.text,
    usage: result.usage,
    provider: typedProvider.providerType,
    model: model.modelId,
    wasFailover: false,
  };
}

/**
 * Vision 기반 텍스트 생성 (이미지 분석)
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

  const providerOrder = await getProviderOrder(featureType, true);

  let lastError: Error | null = null;
  let failoverFrom: string | undefined;

  for (let i = 0; i < providerOrder.length; i++) {
    const { provider, model } = providerOrder[i];
    const isFailover = i > 0;

    if (isFailover) {
      failoverFrom = providerOrder[i - 1].provider.providerType;
      console.warn(
        `[Universal Router] Vision failover: ${failoverFrom} -> ${provider.providerType} for ${featureType}`
      );
    }

    const startTime = Date.now();

    try {
      const isReady = await setupProviderEnv(provider);
      if (!isReady) {
        console.warn(`Provider ${provider.providerType} not ready for vision, skipping...`);
        continue;
      }

      // Vision 지원 확인
      if (!model.supportsVision) {
        console.warn(`Model ${model.modelId} does not support vision, skipping...`);
        continue;
      }

      const languageModel = createLanguageModel(provider, model);

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
        model: languageModel,
        messages,
        system,
        maxOutputTokens,
        temperature,
        maxRetries: 0,
      });

      const responseTimeMs = Date.now() - startTime;

      await trackUsage({
        provider: provider.providerType as import('./providers/types').ProviderName,
        modelId: model.modelId,
        featureType: featureType as import('./providers/types').FeatureType,
        teacherId,
        inputTokens: result.usage?.inputTokens || 0,
        outputTokens: result.usage?.outputTokens || 0,
        responseTimeMs,
        success: true,
        failoverFrom: isFailover ? (failoverFrom as import('./providers/types').ProviderName) : undefined,
      });

      return {
        text: result.text,
        usage: result.usage,
        provider: provider.providerType,
        model: model.modelId,
        wasFailover: isFailover,
        failoverFrom: isFailover ? (failoverFrom as import('./providers/types').ProviderName) : undefined,
      };
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      console.error(`[Universal Router] Vision provider ${provider.providerType} failed:`, errorMessage);

      await trackFailure({
        provider: provider.providerType as import('./providers/types').ProviderName,
        modelId: model.modelId,
        featureType: featureType as import('./providers/types').FeatureType,
        teacherId,
        errorMessage,
        responseTimeMs,
      });

      lastError = error instanceof Error ? error : new Error(String(error));

      // 재시도 불가능한 에러는 폴 백 체인 중단
      if (!isRetryableError(lastError)) {
        console.warn(
          `[Universal Router] Vision error is not retryable, stopping: ${lastError.message}`
        );
        break;
      }
    }
  }

  throw new FailoverError(featureType as import('./providers/types').FeatureType, [
    {
      provider: providerOrder[providerOrder.length - 1]?.provider.providerType as import('./providers/types').ProviderName || 'unknown',
      error: lastError || new Error('Unknown error'),
      timestamp: new Date(),
      durationMs: 0,
    },
  ]);
}

/**
 * 특정 Vision 제공자로 이미지 분석
 */
export async function generateVisionWithSpecificProvider(
  providerType: string,
  options: Omit<VisionGenerateOptions, 'featureType'> & { featureType?: string }
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

  const registry = getProviderRegistry(db);
  const providers = await registry.list({ enabledOnly: true });
  const provider = providers.find(p => (p as unknown as Provider).providerType === providerType);

  if (!provider) {
    throw new Error(`Provider ${providerType} is not configured or enabled`);
  }

  const typedProvider = provider as unknown as Provider;

  // Vision 지원 모델 찾기
  const model = provider.models.find(m => m.supportsVision && m.isDefault) || 
                provider.models.find(m => m.supportsVision);

  if (!model) {
    throw new Error(`Provider ${providerType} does not have a vision-capable model`);
  }

  const startTime = Date.now();

  const isReady = await setupProviderEnv(typedProvider);
  if (!isReady) {
    throw new Error(`Provider ${providerType} is not configured or enabled`);
  }

  const languageModel = createLanguageModel(typedProvider, model as unknown as Model);

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
    model: languageModel,
    messages,
    system,
    maxOutputTokens,
    temperature,
    maxRetries: 2,
  });

  const responseTimeMs = Date.now() - startTime;

  await trackUsage({
    provider: typedProvider.providerType as import('./providers/types').ProviderName,
    modelId: model.modelId,
    featureType: featureType as import('./providers/types').FeatureType,
    teacherId,
    inputTokens: result.usage?.inputTokens || 0,
    outputTokens: result.usage?.outputTokens || 0,
    responseTimeMs,
    success: true,
  });

  return {
    text: result.text,
    usage: result.usage,
    provider: typedProvider.providerType,
    model: model.modelId,
    wasFailover: false,
  };
}

// =============================================================================
// Re-exports (기존과 동일한 인터페이스 유지)
// =============================================================================

export { FailoverError } from './failover';
