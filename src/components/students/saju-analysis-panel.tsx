"use client"

import { useState, useTransition } from "react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { Loader2, RefreshCw, History } from "lucide-react"
import { runSajuAnalysisAction } from "../../app/(dashboard)/students/[id]/saju/actions"
import type { SajuResult } from "@/lib/analysis/saju"
import type { ProviderName } from "@/lib/ai/providers/types"
import { getPromptOptions, type AnalysisPromptMeta } from "@/lib/ai/saju-prompts"
import { ProviderSelector } from "@/components/students/provider-selector"
import { PromptSelector } from "@/components/students/prompt-selector"
import { SajuHelpDialog } from "@/components/students/saju-help-dialog"
import { SajuHistoryPanel } from "@/components/students/saju-history-panel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

type SajuAnalysisPanelProps = {
  student: {
    id: string
    name: string
    birthDate: Date | string
    birthTimeHour: number | null
    birthTimeMinute: number | null
  }
  analysis: {
    result: unknown
    interpretation: string | null
    calculatedAt: Date | string
  } | null
  enabledProviders?: ProviderName[]
  onAnalysisComplete?: () => void
}

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value)
}

const HANJA_MAP: Record<string, string> = {
  갑: "甲", 을: "乙", 병: "丙", 정: "丁", 무: "戊",
  기: "己", 경: "庚", 신: "辛", 임: "壬", 계: "癸",
  자: "子", 축: "丑", 인: "寅", 묘: "卯", 진: "辰", 사: "巳",
  오: "午", 미: "未", 유: "酉", 술: "戌", 해: "亥",
}

const BRANCH_HANJA: Record<string, string> = {
  자: "子", 축: "丑", 인: "寅", 묘: "卯", 진: "辰", 사: "巳",
  오: "午", 미: "未", 신: "申", 유: "酉", 술: "戌", 해: "亥",
}

function hanjaLabel(stem: string, branch: string) {
  const stemHanja = HANJA_MAP[stem] ?? stem
  const branchHanja = BRANCH_HANJA[branch] ?? branch
  return `${stemHanja}${branchHanja}(${stem}${branch})`
}

function formatBirthTime(hour: number | null, minute: number | null) {
  if (hour === null) {
    return "미상"
  }
  const safeMinute = minute ?? 0
  return `${String(hour).padStart(2, "0")}:${String(safeMinute).padStart(2, "0")}`
}

export function SajuAnalysisPanel({ student, analysis, enabledProviders = [], onAnalysisComplete }: SajuAnalysisPanelProps) {
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedProvider, setSelectedProvider] = useState('built-in')
  const [selectedPromptId, setSelectedPromptId] = useState<string>('default')
  const [additionalRequest, setAdditionalRequest] = useState('')
  const [providerLabel, setProviderLabel] = useState<string | null>(null)
  const [promptLabel, setPromptLabel] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const promptOptions = getPromptOptions()
  const result = analysis?.result as SajuResult | undefined
  const isLLM = selectedProvider !== 'built-in'

  const handleRunAnalysis = () => {
    startTransition(async () => {
      setErrorMessage(null)
      setProviderLabel(null)
      setPromptLabel(null)
      try {
        const promptId = isLLM ? selectedPromptId : 'default'
        const extra = isLLM ? additionalRequest.trim() || undefined : undefined
        const res = await runSajuAnalysisAction(student.id, selectedProvider, promptId, extra)
        if (res.llmFailed) {
          setErrorMessage(`내장 알고리즘으로 대체 해석했습니다. ${res.llmError || 'LLM 설정을 확인해주세요.'}`)
          setProviderLabel('내장 알고리즘')
        } else {
          const model = res.usedModel && res.usedModel !== 'default' ? ` (${res.usedModel})` : ''
          setProviderLabel(`${res.usedProvider}${model}`)
        }
        if (promptId !== 'default') {
          const meta = promptOptions.find((p) => p.id === promptId)
          if (meta) setPromptLabel(meta.name)
        }
        onAnalysisComplete?.()
      } catch (error) {
        console.error("Failed to run saju analysis", error)
        setErrorMessage(`사주 분석에 실패했습니다. (원인: ${error instanceof Error ? error.message : '알 수 없는 오류'}) 다시 시도해주세요.`)
      }
    })
  }

  const calculatedAt = analysis?.calculatedAt
    ? toDate(analysis.calculatedAt)
    : null

  return (
    <Card data-testid="saju-tab">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <CardTitle>사주 분석</CardTitle>
          <SajuHelpDialog />
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => setShowHistory(!showHistory)}
          >
            <History className="h-4 w-4" />
            이력
          </Button>
          <div className="text-xs text-gray-500">
            {calculatedAt
              ? `최근 계산: ${format(calculatedAt, "yyyy.MM.dd HH:mm", {
                  locale: ko,
                })}`
              : "아직 분석되지 않았어요."}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 이력 패널 */}
        {showHistory && (
          <SajuHistoryPanel studentId={student.id} />
        )}

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-600">1. 기본 정보</h3>
          <div className="rounded-md bg-gray-50 p-4 text-sm text-gray-700">
            <p>학생: {student.name}</p>
            <p>
              생년월일: {format(toDate(student.birthDate), "yyyy년 M월 d일", {
                locale: ko,
              })}
            </p>
            <p>
              출생 시간: {formatBirthTime(student.birthTimeHour, student.birthTimeMinute)}
              {student.birthTimeHour === null ? " (시주 계산 제외)" : ""}
            </p>
          </div>

          {/* 분석 설정 영역 */}
          <div className="rounded-md border border-gray-200 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
              <ProviderSelector
                selectedProvider={selectedProvider}
                onProviderChange={setSelectedProvider}
                availableProviders={enabledProviders}
                showBuiltIn
                disabled={isPending}
              />
              {isLLM && (
                <PromptSelector
                  selectedPromptId={selectedPromptId}
                  onPromptChange={setSelectedPromptId}
                  promptOptions={promptOptions}
                  disabled={isPending}
                  showInfoCard
                />
              )}
            </div>

            {/* 추가 요청/특이사항 (LLM 선택 시만) */}
            {isLLM && (
              <div className="space-y-1">
                <label className="text-xs text-gray-500">
                  추가 요청 / 특이사항 (선택)
                </label>
                <Textarea
                  placeholder="예: 최근 수학 성적이 급락했습니다. 수학 학습에 대한 조언을 중점적으로 부탁드립니다."
                  value={additionalRequest}
                  onChange={(e) => setAdditionalRequest(e.target.value)}
                  disabled={isPending}
                  rows={2}
                  className="text-sm resize-none"
                  maxLength={500}
                />
                <p className="text-[10px] text-gray-400 text-right">
                  {additionalRequest.length}/500
                </p>
              </div>
            )}

            <Button
              type="button"
              disabled={isPending}
              data-testid="saju-analyze-button"
              onClick={handleRunAnalysis}
              className="w-full sm:w-auto"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  분석 중...
                </>
              ) : (
                "사주 분석 실행"
              )}
            </Button>
          </div>

          {errorMessage ? (
            <div data-testid="analysis-error" className="flex items-center justify-between gap-4 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{errorMessage}</p>
              <Button
                onClick={handleRunAnalysis}
                disabled={isPending}
                variant="outline"
                size="sm"
                data-testid="retry-button"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    재시도 중...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-1" />
                    다시 시도
                  </>
                )}
              </Button>
            </div>
          ) : null}
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-600">2. 사주 구조</h3>
          {result ? (
            <div data-testid="saju-result" className="grid gap-3 rounded-md border border-gray-200 bg-white p-4 text-sm">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-gray-500">연주</p>
                  <p data-testid="year-pillar" className="font-medium">
                    {hanjaLabel(result.pillars.year.stem, result.pillars.year.branch)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">월주</p>
                  <p data-testid="month-pillar" className="font-medium">
                    {hanjaLabel(result.pillars.month.stem, result.pillars.month.branch)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">일주</p>
                  <p data-testid="day-pillar" className="font-medium">
                    {hanjaLabel(result.pillars.day.stem, result.pillars.day.branch)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">시주</p>
                  <p data-testid="hour-pillar" className="font-medium">
                    {result.pillars.hour
                      ? hanjaLabel(result.pillars.hour.stem, result.pillars.hour.branch)
                      : "미상"}
                  </p>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                절기: {result.meta.solarTerm} · <span data-testid="ohang-analysis">오행 균형: 목 {result.elements.목} / 화 {result.elements.화} / 토 {result.elements.토} / 금 {result.elements.금} / 수 {result.elements.수}</span>
              </div>
            </div>
          ) : (
            <div className="rounded-md bg-gray-50 p-4 text-sm text-gray-500">
              아직 계산된 사주 구조가 없습니다.
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-600">3. 해석</h3>
            {providerLabel && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                {providerLabel}
              </span>
            )}
            {promptLabel && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-200">
                {promptLabel}
              </span>
            )}
          </div>
          {analysis?.interpretation ? (
            <div className="rounded-md border border-gray-200 bg-white p-4 text-sm leading-6 text-gray-700 whitespace-pre-wrap">
              {analysis.interpretation}
            </div>
          ) : (
            <div className="rounded-md bg-gray-50 p-4 text-sm text-gray-500">
              사주 해석이 아직 생성되지 않았어요.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
