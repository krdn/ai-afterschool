import { db } from '@/lib/db';
import { encryptApiKey, decryptApiKey, maskApiKey } from './encryption';
import { PROVIDER_CONFIGS, type ProviderName, type FeatureType } from './providers';
import { providerTypeToName, type ProviderType } from './types';

interface LLMConfigInput {
  provider: ProviderName;
  apiKey?: string;
  isEnabled: boolean;
  baseUrl?: string;
  defaultModel?: string;
}

/**
 * providers 테이블에서 모든 제공자를 조회하여 레거시 LLMConfig 형태로 반환합니다.
 */
export async function getAllLLMConfigs() {
  const providers = await db.provider.findMany({
    include: { models: true },
    orderBy: { createdAt: 'asc' },
  });

  return providers.map((p) => {
    const providerName = p.providerType as ProviderName;
    const defaultModel = p.models.find((m) => m.isDefault)?.modelId
      ?? p.models[0]?.modelId
      ?? null;

    return {
      id: p.id,
      provider: providerName,
      displayName: p.name,
      isEnabled: p.isEnabled,
      isValidated: p.isValidated,
      validatedAt: p.validatedAt,
      baseUrl: p.baseUrl,
      defaultModel,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      apiKeyMasked: p.apiKeyEncrypted
        ? maskApiKey(decryptApiKey(p.apiKeyEncrypted))
        : null,
      apiKeyEncrypted: undefined,
      providerConfig: PROVIDER_CONFIGS[providerName],
    };
  });
}

/**
 * providers 테이블에서 특정 providerType을 조회하여 레거시 LLMConfig 형태로 반환합니다.
 */
export async function getLLMConfig(provider: ProviderName) {
  const p = await db.provider.findFirst({
    where: { providerType: provider },
    include: { models: true },
  });

  if (!p) {
    return null;
  }

  const defaultModel = p.models.find((m) => m.isDefault)?.modelId
    ?? p.models[0]?.modelId
    ?? null;

  return {
    id: p.id,
    provider: p.providerType as ProviderName,
    displayName: p.name,
    isEnabled: p.isEnabled,
    isValidated: p.isValidated,
    validatedAt: p.validatedAt,
    baseUrl: p.baseUrl,
    defaultModel,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    apiKey: p.apiKeyEncrypted ? decryptApiKey(p.apiKeyEncrypted) : null,
    providerConfig: PROVIDER_CONFIGS[provider],
  };
}

/**
 * providers 테이블에 제공자를 저장(upsert)합니다.
 */
export async function saveLLMConfig(input: LLMConfigInput) {
  const { provider, apiKey, isEnabled, baseUrl, defaultModel } = input;
  const providerConfig = PROVIDER_CONFIGS[provider];

  // 기존 provider 레코드 조회
  const existing = await db.provider.findFirst({
    where: { providerType: provider },
  });

  if (existing) {
    // 업데이트
    const updateData: Record<string, unknown> = {
      name: providerConfig.displayName,
      isEnabled,
      baseUrl: baseUrl || null,
    };

    if (apiKey) {
      updateData.apiKeyEncrypted = encryptApiKey(apiKey);
      updateData.isValidated = false;
      updateData.validatedAt = null;
    }

    return db.provider.update({
      where: { id: existing.id },
      data: updateData,
    });
  }

  // 새로 생성
  return db.provider.create({
    data: {
      name: providerConfig.displayName,
      providerType: provider,
      isEnabled,
      baseUrl: baseUrl || null,
      apiKeyEncrypted: apiKey ? encryptApiKey(apiKey) : null,
      authType: provider === 'ollama' ? 'none' : 'api_key',
      capabilities: providerConfig.supportsVision ? ['text', 'vision'] : ['text'],
      costTier: 'standard',
      qualityTier: 'medium',
      isValidated: false,
    },
  });
}

/**
 * providers 테이블에서 제공자의 검증 상태를 업데이트합니다.
 */
export async function markLLMConfigValidated(provider: ProviderName, isValid: boolean) {
  const existing = await db.provider.findFirst({
    where: { providerType: provider },
  });

  if (!existing) {
    throw new Error(`Provider not found: ${provider}`);
  }

  return db.provider.update({
    where: { id: existing.id },
    data: {
      isValidated: isValid,
      validatedAt: isValid ? new Date() : null,
    },
  });
}

export async function getEnabledProviders(): Promise<ProviderName[]> {
  // Universal LLM Hub의 Provider 테이블에서 활성화된 제공자 조회
  const hubProviders = await db.provider.findMany({
    where: { isEnabled: true },
    select: { providerType: true },
  });

  // providerType → ProviderName 변환 (중복 제거)
  const providers = [
    ...new Set(
      hubProviders
        .map((p) => providerTypeToName(p.providerType as ProviderType))
        .filter((name): name is ProviderName => name !== null)
    ),
  ];

  // Ollama는 내장 제공자 — API 키 불필요, 항상 사용 가능
  if (!providers.includes('ollama')) {
    providers.push('ollama');
  }

  return providers;
}

interface FeatureConfigInput {
  featureType: FeatureType;
  primaryProvider: ProviderName;
  fallbackOrder: ProviderName[];
  modelOverride?: string;
}

export async function getFeatureConfig(featureType: FeatureType) {
  const config = await db.lLMFeatureConfig.findUnique({
    where: { featureType },
  });

  if (!config) {
    return {
      featureType,
      primaryProvider: 'ollama' as ProviderName,
      fallbackOrder: ['anthropic', 'openai', 'google'] as ProviderName[],
      modelOverride: null,
    };
  }

  return {
    ...config,
    fallbackOrder: config.fallbackOrder as ProviderName[],
  };
}

export async function getAllFeatureConfigs() {
  return db.lLMFeatureConfig.findMany({
    orderBy: { featureType: 'asc' },
  });
}

export async function saveFeatureConfig(input: FeatureConfigInput) {
  const { featureType, primaryProvider, fallbackOrder, modelOverride } = input;

  return db.lLMFeatureConfig.upsert({
    where: { featureType },
    create: {
      featureType,
      primaryProvider,
      fallbackOrder,
      modelOverride,
    },
    update: {
      primaryProvider,
      fallbackOrder,
      modelOverride,
    },
  });
}

type BudgetPeriod = 'daily' | 'weekly' | 'monthly';

interface BudgetInput {
  period: BudgetPeriod;
  budgetUsd: number;
  alertAt80?: boolean;
  alertAt100?: boolean;
}

export async function getBudgetConfig(period: BudgetPeriod) {
  return db.lLMBudget.findUnique({
    where: { period },
  });
}

export async function getAllBudgetConfigs() {
  return db.lLMBudget.findMany({
    orderBy: { period: 'asc' },
  });
}

export async function saveBudgetConfig(input: BudgetInput) {
  const { period, budgetUsd, alertAt80 = true, alertAt100 = true } = input;

  return db.lLMBudget.upsert({
    where: { period },
    create: {
      period,
      budgetUsd,
      alertAt80,
      alertAt100,
    },
    update: {
      budgetUsd,
      alertAt80,
      alertAt100,
    },
  });
}
