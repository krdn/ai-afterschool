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
import { TeamsTab } from '@/components/admin/tabs/teams-tab'
import { getTeams } from '@/lib/actions/teams'
import { pool } from '@/lib/db'
import { existsSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

// AI 프롬프트 관리 (통합)
import { AnalysisPromptsTab } from '@/components/admin/tabs/analysis-prompts-tab'
import { getAllPresetsByType, seedBuiltInPresets, type AnalysisType } from '@/lib/db/analysis-prompt-preset'
import { getBuiltInSeedData as getSajuSeedData } from '@/lib/ai/saju-prompts'
import { getBuiltInSeedData as getFaceSeedData } from '@/lib/ai/face-prompts'
import { getBuiltInSeedData as getPalmSeedData } from '@/lib/ai/palm-prompts'
import { getBuiltInSeedData as getMbtiSeedData } from '@/lib/ai/mbti-prompts'
import { getBuiltInSeedData as getVarkSeedData } from '@/lib/ai/vark-prompts'
import { getBuiltInSeedData as getNameSeedData } from '@/lib/ai/name-prompts'
import { getBuiltInSeedData as getZodiacSeedData } from '@/lib/ai/zodiac-prompts'

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

    const providers: ProviderName[] = ['ollama', 'anthropic', 'openai', 'google', 'deepseek', 'mistral', 'cohere', 'xai', 'zhipu', 'moonshot']
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

// Health check 직접 수행 (self-referencing fetch 방지)
type HealthStatus = 'healthy' | 'unhealthy' | 'unknown'

interface HealthCheckItem {
  status: HealthStatus
  message?: string
  responseTime?: number
  connectionPool?: { total: number; idle: number; waiting: number }
}

async function getHealthData() {
  const startTime = Date.now()
  const result: {
    status: string
    uptime: number
    version?: string
    headers: { 'X-Response-Time': string }
    checks: {
      database: HealthCheckItem
      storage: HealthCheckItem
      backup?: HealthCheckItem
    }
  } = {
    status: 'healthy',
    uptime: process.uptime(),
    headers: { 'X-Response-Time': '0' },
    checks: {
      database: { status: 'unknown', message: '' },
      storage: { status: 'unknown', message: '' },
    },
  }

  // DB 체크
  try {
    const dbStart = Date.now()
    await db.$queryRaw`SELECT 1`
    const dbTime = Date.now() - dbStart
    const poolInfo = { total: pool.totalCount, idle: pool.idleCount, waiting: pool.waitingCount }
    result.checks.database = {
      status: 'healthy' as HealthStatus,
      message: dbTime > 1000 ? `Database connection successful (slow: ${dbTime}ms)` : 'Database connection successful',
      responseTime: dbTime,
      connectionPool: poolInfo,
    }
    if (dbTime > 1000) result.status = 'degraded'
  } catch (error) {
    result.checks.database = {
      status: 'unhealthy' as HealthStatus,
      message: error instanceof Error ? error.message : 'Database connection failed',
      responseTime: 0,
      connectionPool: pool
        ? { total: pool.totalCount, idle: pool.idleCount, waiting: pool.waitingCount }
        : { total: 0, idle: 0, waiting: 0 },
    }
    result.status = 'unhealthy'
  }

  // 스토리지 체크
  try {
    const storageStart = Date.now()
    const storageType = process.env.PDF_STORAGE_TYPE || 'local'
    if (storageType === 's3') {
      const endpoint = process.env.MINIO_ENDPOINT
      if (endpoint && process.env.MINIO_ACCESS_KEY && process.env.MINIO_SECRET_KEY) {
        result.checks.storage = { status: 'healthy' as HealthStatus, message: `S3 storage configured (${endpoint})`, responseTime: Date.now() - storageStart }
      } else {
        result.checks.storage = { status: 'unhealthy' as HealthStatus, message: 'S3 storage incomplete configuration', responseTime: 0 }
        result.status = 'unhealthy'
      }
    } else {
      const storagePath = process.env.PDF_STORAGE_PATH || './public/reports'
      if (existsSync(storagePath)) {
        result.checks.storage = { status: 'healthy' as HealthStatus, message: `Local storage accessible (${storagePath})`, responseTime: Date.now() - storageStart }
      } else {
        result.checks.storage = { status: 'unhealthy' as HealthStatus, message: `Storage directory not found: ${storagePath}`, responseTime: 0 }
        result.status = 'unhealthy'
      }
    }
  } catch (error) {
    result.checks.storage = { status: 'unhealthy' as HealthStatus, message: error instanceof Error ? error.message : 'Storage check failed', responseTime: 0 }
    result.status = 'unhealthy'
  }

  // 백업 체크
  try {
    const backupDir = process.env.BACKUP_DIR || './backups'
    const dbName = process.env.POSTGRES_DB || 'ai_afterschool'
    if (existsSync(backupDir)) {
      const files = readdirSync(backupDir).filter(f => f.startsWith(`${dbName}-`) && f.endsWith('.sql.gz'))
      if (files.length > 0) {
        const latestFile = files
          .map(f => ({ name: f, mtime: statSync(join(backupDir, f)).mtime.getTime() }))
          .sort((a, b) => b.mtime - a.mtime)[0]
        const hoursSince = (Date.now() - latestFile.mtime) / (1000 * 60 * 60)
        const size = statSync(join(backupDir, latestFile.name)).size
        result.checks.backup = {
          status: (hoursSince <= 48 ? 'healthy' : 'unhealthy') as HealthStatus,
          message: `Last backup: ${latestFile.name} (${hoursSince.toFixed(1)}h ago, ${(size / 1024).toFixed(1)}KB)`,
        }
      } else {
        result.checks.backup = { status: 'unhealthy' as HealthStatus, message: 'No backup files found' }
      }
    } else {
      result.checks.backup = { status: 'healthy' as HealthStatus, message: 'Backup directory not configured' }
    }
  } catch {
    result.checks.backup = { status: 'unknown' as HealthStatus, message: 'Backup check failed' }
  }

  result.headers['X-Response-Time'] = String(Date.now() - startTime)
  return result
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
    teams,
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
    getTeams(),
  ])

  // AI 프롬프트 seed 및 조회
  await Promise.all([
    seedBuiltInPresets(getSajuSeedData()),
    seedBuiltInPresets(getFaceSeedData()),
    seedBuiltInPresets(getPalmSeedData()),
    seedBuiltInPresets(getMbtiSeedData()),
    seedBuiltInPresets(getVarkSeedData()),
    seedBuiltInPresets(getNameSeedData()),
    seedBuiltInPresets(getZodiacSeedData()),
  ])

  const analysisPromptPresets = {
    saju: await getAllPresetsByType('saju'),
    face: await getAllPresetsByType('face'),
    palm: await getAllPresetsByType('palm'),
    mbti: await getAllPresetsByType('mbti'),
    vark: await getAllPresetsByType('vark'),
    name: await getAllPresetsByType('name'),
    zodiac: await getAllPresetsByType('zodiac'),
  }

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

  // Health 데이터 직접 수집 (self-referencing fetch 방지)
  const healthData = await getHealthData()

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

        {/* AI 프롬프트 관리 탭 (통합) */}
        <AdminTabsContent value="ai-prompts">
          <AnalysisPromptsTab initialPresets={analysisPromptPresets} />
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

        {/* 팀 관리 탭 */}
        <AdminTabsContent value="teams">
          <TeamsTab initialTeams={teams} userRole={session.role} />
        </AdminTabsContent>
      </AdminTabsWrapper>
    </div>
  )
}
