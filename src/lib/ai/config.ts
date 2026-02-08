import { db } from '@/lib/db';
import { encryptApiKey, decryptApiKey, maskApiKey } from './encryption';
import { PROVIDER_CONFIGS, type ProviderName, type FeatureType } from './providers';

interface LLMConfigInput {
  provider: ProviderName;
  apiKey?: string;
  isEnabled: boolean;
  baseUrl?: string;
  defaultModel?: string;
}

export async function getAllLLMConfigs() {
  const configs = await db.lLMConfig.findMany({
    orderBy: { provider: 'asc' },
  });

  return configs.map((config) => ({
    ...config,
    apiKeyMasked: config.apiKeyEncrypted 
      ? maskApiKey(decryptApiKey(config.apiKeyEncrypted)) 
      : null,
    apiKeyEncrypted: undefined,
    providerConfig: PROVIDER_CONFIGS[config.provider as ProviderName],
  }));
}

export async function getLLMConfig(provider: ProviderName) {
  const config = await db.lLMConfig.findUnique({
    where: { provider },
  });

  if (!config) {
    return null;
  }

  return {
    ...config,
    apiKey: config.apiKeyEncrypted ? decryptApiKey(config.apiKeyEncrypted) : null,
    providerConfig: PROVIDER_CONFIGS[provider],
  };
}

export async function saveLLMConfig(input: LLMConfigInput) {
  const { provider, apiKey, isEnabled, baseUrl, defaultModel } = input;
  const providerConfig = PROVIDER_CONFIGS[provider];

  const data = {
    provider,
    displayName: providerConfig.displayName,
    apiKeyEncrypted: apiKey ? encryptApiKey(apiKey) : null,
    isEnabled,
    isValidated: false,
    validatedAt: null,
    baseUrl: baseUrl || null,
    defaultModel: defaultModel || providerConfig.defaultModel,
  };

  return db.lLMConfig.upsert({
    where: { provider },
    create: data,
    update: data,
  });
}

export async function markLLMConfigValidated(provider: ProviderName, isValid: boolean) {
  return db.lLMConfig.update({
    where: { provider },
    data: {
      isValidated: isValid,
      validatedAt: isValid ? new Date() : null,
    },
  });
}

export async function getEnabledProviders(): Promise<ProviderName[]> {
  const configs = await db.lLMConfig.findMany({
    where: { isEnabled: true, isValidated: true },
    select: { provider: true },
  });

  const providers = configs.map((c) => c.provider as ProviderName);

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
