'use server';

import { revalidatePath } from 'next/cache';
import { verifySession } from '@/lib/dal';
import {
  getAllLLMConfigs,
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

export async function testProviderAction(provider: ProviderName, apiKey: string) {
  await requireDirector();

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/llm/test-provider`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey }),
      }
    );

    const result = await response.json();
    
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

export async function getOllamaModelsAction() {
  await requireDirector();
  const { getOllamaModels } = await import('@/lib/ai/providers/ollama');
  const models = await getOllamaModels();
  return models.map((m) => ({ name: m.name, size: m.size }));
}
