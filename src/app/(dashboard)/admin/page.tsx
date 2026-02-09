import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/dal'
import { getRBACPrisma } from '@/lib/db/rbac'
import { AdminTabsWrapper, AdminTabsContent } from '@/components/admin/admin-tabs-wrapper'

// LLM 설정 관련
import { getAllLLMConfigs, getAllFeatureConfigs, getAllBudgetConfigs } from '@/lib/ai/config'
import { getBudgetSummary } from '@/lib/ai/smart-routing'
import { PROVIDER_CONFIGS, type ProviderName } from '@/lib/ai/providers'
import { ProviderCard } from '@/app/(dashboard)/admin/llm-settings/provider-card'
import { FeatureMapping } from '@/app/(dashboard)/admin/llm-settings/feature-mapping'
import { BudgetSettings } from '@/app/(dashboard)/admin/llm-settings/budget-settings'
import { ProviderSelect } from '@/app/(dashboard)/admin/llm-settings/provider-select'

// LLM 사용량 관련
import { getCurrentPeriodCost } from '@/lib/ai/usage-tracker'
import { getUsageStatsByProvider, getUsageStatsByFeature } from '@/lib/ai/usage-tracker'
import { db } from '@/lib/db'
import { UsageCharts, type DailyUsageData, type ProviderUsageData, type FeatureUsageData } from '@/app/(dashboard)/admin/llm-usage/usage-charts'
import { CostAlerts, CostSummaryCards } from '@/app/(dashboard)/admin/llm-usage/cost-alerts'

// 새로운 탭 컴포넌트
import { StatusTab } from '@/components/admin/tabs/status-tab'
import { LogsTab } from '@/components/admin/tabs/logs-tab'
import { DatabaseTab } from '@/components/admin/tabs/database-tab'
import { AuditTab } from '@/components/admin/tabs/audit-tab'

// 사주 프롬프트 관리
import { SajuPromptsTab } from '@/components/admin/tabs/saju-prompts-tab'
import { getAllPresets } from '@/lib/db/saju-prompt-preset'

export const metadata = {
  title: '관리자 | AI AfterSchool',
  description: '시스템 관리 대시보드',
}

interface LLMConfigData {
  provider: string
  isEnabled: boolean
  isValidated: boolean
  validatedAt: Date | null
  apiKeyMasked: string | null
  baseUrl: string | null
  defaultModel: string | null
}

// 30일 일별 사용량 조회
async function getDailyUsageData(): Promise<DailyUsageData[]> {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)

  try {
    const dailyData = await db.$queryRawUnsafe<{
      date: Date
      requests: bigint
      inputTokens: bigint
      outputTokens: bigint
      costUsd: number
      totalResponseTimeMs: bigint
    }[]>(`
      SELECT
        DATE("createdAt") as date,
        COUNT(*) as requests,
        COALESCE(SUM("inputTokens"), 0) as "inputTokens",
        COALESCE(SUM("outputTokens"), 0) as "outputTokens",
        COALESCE(SUM("costUsd"), 0) as "costUsd",
        COALESCE(SUM("responseTimeMs"), 0) as "totalResponseTimeMs"
      FROM "LLMUsage"
      WHERE "createdAt" >= '${startDate.toISOString()}'
        AND "createdAt" <= '${endDate.toISOString()}'
      GROUP BY DATE("createdAt")
      ORDER BY DATE("createdAt") ASC
    `)

    return dailyData.map((row) => ({
      date: row.date.toISOString().split('T')[0],
      requests: Number(row.requests),
      inputTokens: Number(row.inputTokens),
      outputTokens: Number(row.outputTokens),
      costUsd: Number(row.costUsd) || 0,
      avgResponseTimeMs: Number(row.requests) > 0
        ? Number(row.totalResponseTimeMs) / Number(row.requests)
        : 0,
    }))
  } catch (error) {
    console.error('Failed to fetch daily usage data:', error)
    return []
  }
}

// 제공자별 사용량 조회
async function getProviderUsageData(): Promise<ProviderUsageData[]> {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)

  try {
    const stats = await getUsageStatsByProvider({ startDate, endDate })

    const providers: ProviderName[] = ['anthropic', 'openai', 'google', 'ollama']
    return providers.map((provider) => ({
      provider,
      totalRequests: stats[provider]?.totalRequests || 0,
      totalCostUsd: stats[provider]?.totalCostUsd || 0,
      successRate: stats[provider]?.successRate || 1,
    }))
  } catch (error) {
    console.error('Failed to fetch provider usage data:', error)
    return []
  }
}

// 기능별 사용량 조회
async function getFeatureUsageData(): Promise<FeatureUsageData[]> {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)

  try {
    const stats = await getUsageStatsByFeature({ startDate, endDate })

    const features = [
      'learning_analysis',
      'counseling_suggest',
      'report_generate',
      'face_analysis',
      'palm_analysis',
      'personality_summary',
    ] as const
    return features.map((featureType) => ({
      featureType,
      totalRequests: stats[featureType]?.totalRequests || 0,
      totalCostUsd: stats[featureType]?.totalCostUsd || 0,
    }))
  } catch (error) {
    console.error('Failed to fetch feature usage data:', error)
    return []
  }
}

export default async function AdminPage() {
  const session = await verifySession()
  // Allow both DIRECTOR and TEAM_LEADER roles to access Admin page
  if (!session || (session.role !== 'DIRECTOR' && session.role !== 'TEAM_LEADER')) {
    redirect('/dashboard')
  }

  // 병렬로 모든 데이터 조회
  const [
    llmConfigs,
    featureConfigs,
    budgetConfigs,
    usageSummary,
    dailyCost,
    weeklyCost,
    monthlyCost,
    dailyUsageData,
    providerUsageData,
    featureUsageData,
    sajuPromptPresets,
  ] = await Promise.all([
    getAllLLMConfigs(),
    getAllFeatureConfigs(),
    getAllBudgetConfigs(),
    getBudgetSummary(),
    getCurrentPeriodCost('daily'),
    getCurrentPeriodCost('weekly'),
    getCurrentPeriodCost('monthly'),
    getDailyUsageData(),
    getProviderUsageData(),
    getFeatureUsageData(),
    getAllPresets(),
  ])

  const enabledProviders = llmConfigs
    .filter((c: LLMConfigData) => c.isEnabled && c.isValidated)
    .map((c: LLMConfigData) => c.provider as ProviderName)

  // Ollama는 내장 제공자 — 항상 사용 가능
  if (!enabledProviders.includes('ollama')) {
    enabledProviders.push('ollama')
  }

  // 현재 기본 제공자 파악
  const providerCounts = new Map<string, number>()
  featureConfigs.forEach((c: { primaryProvider: string }) => {
    providerCounts.set(c.primaryProvider, (providerCounts.get(c.primaryProvider) || 0) + 1)
  })
  let currentDefault: ProviderName | null = null
  if (providerCounts.size > 0) {
    currentDefault = [...providerCounts.entries()]
      .sort((a, b) => b[1] - a[1])[0][0] as ProviderName
  }

  const configMap = new Map<string, LLMConfigData>(
    llmConfigs.map((c: LLMConfigData) => [c.provider, c])
  )

  // Health API에서 데이터 가져오기
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const healthData = await fetch(`${baseUrl}/api/health`, {
    cache: 'no-store',
  }).then((res) => res.json()).catch(() => ({
    status: 'unknown',
    uptime: 0,
    checks: { database: { status: 'unknown' }, storage: { status: 'unknown' } },
  }))

  return (
    <div className="container py-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">관리자 대시보드</h1>
        <p className="text-muted-foreground">
          시스템 설정, 모니터링, 로그를 관리합니다.
        </p>
      </div>

      <AdminTabsWrapper defaultValue="llm-settings">

        {/* LLM 설정 탭 */}
        <AdminTabsContent value="llm-settings">
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
                  const saved = configMap.get(provider)
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
                  )
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
        </AdminTabsContent>

        {/* 토큰 사용량 탭 */}
        <AdminTabsContent value="llm-usage">
          <CostSummaryCards
            dailyCost={dailyCost}
            weeklyCost={weeklyCost}
            monthlyCost={monthlyCost}
          />
          <UsageCharts
            dailyData={dailyUsageData}
            providerData={providerUsageData}
            featureData={featureUsageData}
          />
          <CostAlerts initialData={usageSummary} />
        </AdminTabsContent>

        {/* 사주 프롬프트 관리 탭 */}
        <AdminTabsContent value="saju-prompts">
          <SajuPromptsTab initialPresets={sajuPromptPresets} />
        </AdminTabsContent>

        {/* 시스템 상태 탭 */}
        <AdminTabsContent value="system-status">
          <StatusTab healthData={healthData} />
        </AdminTabsContent>

        {/* 시스템 로그 탭 */}
        <AdminTabsContent value="system-logs">
          <LogsTab />
        </AdminTabsContent>

        {/* 데이터베이스 탭 */}
        <AdminTabsContent value="database">
          <DatabaseTab />
        </AdminTabsContent>

        {/* 감사 로그 탭 */}
        <AdminTabsContent value="audit-logs">
          <AuditTab />
        </AdminTabsContent>
      </AdminTabsWrapper>
    </div>
  )
}
