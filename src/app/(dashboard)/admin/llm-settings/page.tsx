import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/dal';
import { getAllLLMConfigs, getAllFeatureConfigs, getAllBudgetConfigs } from '@/lib/ai/config';
import { getBudgetSummary } from '@/lib/ai/smart-routing';
import { PROVIDER_CONFIGS, type ProviderName } from '@/lib/ai/providers';
import { ProviderCard } from './provider-card';
import { FeatureMapping } from './feature-mapping';
import { BudgetSettings } from './budget-settings';
import { ProviderSelect } from './provider-select';

export const metadata = {
  title: 'LLM 설정 | AI AfterSchool',
  description: 'LLM 제공자 설정 및 기능별 매핑',
};

interface LLMConfigData {
  provider: string;
  isEnabled: boolean;
  isValidated: boolean;
  validatedAt: Date | null;
  apiKeyMasked: string | null;
  baseUrl: string | null;
  defaultModel: string | null;
}

export default async function LLMSettingsPage() {
  const session = await verifySession();
  if (!session || session.role !== 'DIRECTOR') {
    redirect('/dashboard');
  }

  const llmConfigs = await getAllLLMConfigs();
  const featureConfigs = await getAllFeatureConfigs();
  const budgetConfigs = await getAllBudgetConfigs();
  const usageSummary = await getBudgetSummary();

  const enabledProviders = llmConfigs
    .filter((c: LLMConfigData) => c.isEnabled && c.isValidated)
    .map((c: LLMConfigData) => c.provider as ProviderName);

  // Ollama는 내장 제공자 — API 키 불필요, 항상 사용 가능
  if (!enabledProviders.includes('ollama')) {
    enabledProviders.push('ollama');
  }

  // 현재 기본 제공자: 가장 많은 기능에서 primaryProvider로 설정된 제공자
  const providerCounts = new Map<string, number>();
  featureConfigs.forEach((c: { primaryProvider: string }) => {
    providerCounts.set(c.primaryProvider, (providerCounts.get(c.primaryProvider) || 0) + 1);
  });
  let currentDefault: ProviderName | null = null;
  if (providerCounts.size > 0) {
    currentDefault = [...providerCounts.entries()]
      .sort((a, b) => b[1] - a[1])[0][0] as ProviderName;
  }

  const configMap = new Map<string, LLMConfigData>(
    llmConfigs.map((c: LLMConfigData) => [c.provider, c])
  );

  return (
    <div className="container py-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">LLM 설정</h1>
        <p className="text-muted-foreground">
          AI 분석에 사용할 LLM 제공자를 설정합니다.
        </p>
      </div>

      {/* 기본 제공자 선택 섹션 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">기본 제공자</h2>
          {enabledProviders.length > 0 && (
            <div data-testid="current-provider" className="text-sm text-muted-foreground">
              현재 활성: {enabledProviders.length}개 제공자
            </div>
          )}
        </div>
        <ProviderSelect enabledProviders={enabledProviders} currentDefault={currentDefault} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">제공자 설정</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {(Object.entries(PROVIDER_CONFIGS) as [ProviderName, typeof PROVIDER_CONFIGS[ProviderName]][]).map(
            ([provider, config]) => {
              const saved = configMap.get(provider);
              return (
                <ProviderCard
                  key={provider}
                  provider={provider}
                  config={config}
                  savedConfig={saved ? {
                    isEnabled: saved.isEnabled,
                    isValidated: saved.isValidated,
                    validatedAt: saved.validatedAt,
                    apiKeyMasked: saved.apiKeyMasked,
                    baseUrl: saved.baseUrl,
                    defaultModel: saved.defaultModel,
                  } : undefined}
                />
              );
            }
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">기능별 매핑</h2>
        {enabledProviders.length === 0 ? (
          <div className="bg-muted p-4 rounded-lg text-center">
            <p className="text-muted-foreground">
              먼저 최소 1개의 제공자를 활성화하고 API 키를 검증해주세요.
            </p>
          </div>
        ) : (
          <FeatureMapping
            enabledProviders={enabledProviders}
            savedConfigs={featureConfigs.map((c: { featureType: string; primaryProvider: string; fallbackOrder: unknown }) => ({
              featureType: c.featureType,
              primaryProvider: c.primaryProvider,
              fallbackOrder: c.fallbackOrder as ProviderName[],
            }))}
          />
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">예산 관리</h2>
        <BudgetSettings
          initialData={budgetConfigs.map((c) => ({
            period: c.period,
            budgetUsd: c.budgetUsd,
            alertAt80: c.alertAt80,
            alertAt100: c.alertAt100,
          }))}
          usageSummary={usageSummary.map((s) => ({
            period: s.period,
            currentCost: s.currentCost,
            percentUsed: s.percentUsed,
          }))}
        />
      </section>
    </div>
  );
}
