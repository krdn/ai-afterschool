'use server';

import { revalidatePath } from 'next/cache';
import { verifySession } from '@/lib/dal';
import {
  getAllLLMConfigs,
  getLLMConfig,
  saveLLMConfig,
  markLLMConfigValidated,
  getAllFeatureConfigs,
  saveFeatureConfig,
  getAllBudgetConfigs,
  saveBudgetConfig,
} from '@/lib/ai/config';
import { getBudgetSummary } from '@/lib/ai/smart-routing';
import type { ProviderName, FeatureType } from '@/lib/ai/providers';

async function requireDirector() {
  const session = await verifySession();
  if (!session || session.role !== 'DIRECTOR') {
    throw new Error('Unauthorized: DIRECTOR role required');
  }
  return session;
}

export async function getLLMConfigsAction() {
  await requireDirector();
  return getAllLLMConfigs();
}

export async function saveLLMConfigAction(input: {
  provider: ProviderName;
  apiKey?: string;
  isEnabled: boolean;
  baseUrl?: string;
  defaultModel?: string;
}) {
  await requireDirector();
  
  const result = await saveLLMConfig(input);
  revalidatePath('/admin/llm-settings');
  
  return { success: true, config: result };
}

export async function testProviderAction(provider: ProviderName, apiKey?: string) {
  await requireDirector();

  try {
    // apiKey가 없으면 DB에 저장된 키를 사용
    let effectiveApiKey = apiKey;
    if (!effectiveApiKey && provider !== 'ollama') {
      const config = await getLLMConfig(provider);
      effectiveApiKey = config?.apiKey ?? undefined;
    }

    const { testProviderConnection } = await import('@/lib/ai/test-provider');
    const result = await testProviderConnection(provider, effectiveApiKey);

    if (result.valid) {
      await markLLMConfigValidated(provider, true);
    }

    return result;
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function getFeatureConfigsAction() {
  await requireDirector();
  return getAllFeatureConfigs();
}

export async function saveFeatureConfigAction(input: {
  featureType: FeatureType;
  primaryProvider: ProviderName;
  fallbackOrder: ProviderName[];
  modelOverride?: string;
}) {
  await requireDirector();
  
  const result = await saveFeatureConfig(input);
  revalidatePath('/admin/llm-settings');
  
  return { success: true, config: result };
}

export async function getBudgetConfigsAction() {
  await requireDirector();
  return getAllBudgetConfigs();
}

export async function saveBudgetConfigAction(input: {
  period: 'daily' | 'weekly' | 'monthly';
  budgetUsd: number;
  alertAt80?: boolean;
  alertAt100?: boolean;
}) {
  await requireDirector();

  const result = await saveBudgetConfig(input);
  revalidatePath('/admin/llm-settings');

  return { success: true, config: result };
}

export async function getBudgetSummaryAction() {
  await requireDirector();
  return getBudgetSummary();
}

export async function setDefaultProviderAction(provider: ProviderName) {
  await requireDirector();

  const { PROVIDER_CONFIGS } = await import('@/lib/ai/providers');
  const allFeatures: FeatureType[] = [
    'learning_analysis', 'counseling_suggest', 'report_generate',
    'face_analysis', 'palm_analysis', 'personality_summary',
    'saju_analysis', 'mbti_analysis', 'vark_analysis', 'name_analysis', 'zodiac_analysis',
  ];

  const visionFeatures: FeatureType[] = ['face_analysis', 'palm_analysis'];
  const supportsVision = PROVIDER_CONFIGS[provider].supportsVision;

  const allProviders: ProviderName[] = ['ollama', 'anthropic', 'openai', 'google', 'deepseek', 'mistral', 'cohere', 'xai'];
  const fallback = allProviders.filter((p) => p !== provider);

  for (const feature of allFeatures) {
    // vision 기능인데 선택된 제공자가 vision 미지원이면 건너뜀
    if (visionFeatures.includes(feature) && !supportsVision) {
      continue;
    }
    await saveFeatureConfig({
      featureType: feature,
      primaryProvider: provider,
      fallbackOrder: fallback,
    });
  }

  revalidatePath('/admin/llm-settings');
  return { success: true, provider };
}

export async function getOllamaModelsAction() {
  await requireDirector();
  const { getOllamaModels } = await import('@/lib/ai/providers/ollama');
  const models = await getOllamaModels();
  return models.map((m) => ({ name: m.name, size: m.size }));
}
