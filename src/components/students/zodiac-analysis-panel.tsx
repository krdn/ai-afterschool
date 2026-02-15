"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { runZodiacAnalysis, generateZodiacLLMInterpretation } from "@/lib/actions/zodiac-analysis"
import type { ProviderName } from "@/lib/ai/providers/types"
import type { GenericPromptMeta } from "@/components/students/prompt-selector"
import { Button } from "@/components/ui/button"
import ReactMarkdown from "react-markdown"
import {
  AnalysisErrorBanner,
  AIInterpretationControls,
  AnalysisEmptyState,
} from "@/components/common/analysis-panel"

type ZodiacAnalysisData = {
  zodiacSign: string
  zodiacName: string
  element: string
  traits: unknown
  interpretation: string | null
  calculatedAt: Date | string
} | null

type Props = {
  studentId: string
  analysis: ZodiacAnalysisData
  enabledProviders?: ProviderName[]
  promptOptions?: GenericPromptMeta[]
  onDataChange?: () => void
}

export function ZodiacAnalysisPanel({ studentId, analysis, enabledProviders = [], promptOptions = [], onDataChange }: Props) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    setErrorMessage(null)
    try {
      await runZodiacAnalysis(studentId)
      onDataChange?.()
    } catch (error) {
      setErrorMessage(`별자리 분석에 실패했습니다. (${error instanceof Error ? error.message : "알 수 없는 오류"})`)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleLLMInterpretation = async (provider: string, promptId: string) => {
    setIsGeneratingAI(true)
    setErrorMessage(null)
    try {
      await generateZodiacLLMInterpretation(studentId, provider, promptId)
      onDataChange?.()
    } catch (error) {
      setErrorMessage(`AI 해석에 실패했습니다. (${error instanceof Error ? error.message : "알 수 없는 오류"})`)
    } finally {
      setIsGeneratingAI(false)
    }
  }

  const traits = analysis?.traits as { symbol?: string; elementName?: string; rulingPlanet?: string; dateRange?: string } | undefined

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Star className="w-5 h-5 text-indigo-600" />
          </div>
          <h2 className="text-lg font-semibold">별자리 운세</h2>
        </div>
        {!analysis && (
          <Button onClick={handleAnalyze} disabled={isAnalyzing}>
            {isAnalyzing ? "분석 중..." : "별자리 분석"}
          </Button>
        )}
      </div>

      <div className="p-6 space-y-6">
        {errorMessage && (
          <AnalysisErrorBanner
            message={errorMessage}
            onDismiss={() => setErrorMessage(null)}
          />
        )}

        {analysis ? (
          <>
            {/* 별자리 요약 카드 */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-4xl">{traits?.symbol ?? "⭐"}</span>
                <div>
                  <h3 className="text-xl font-bold text-indigo-800">{analysis.zodiacName}</h3>
                  <p className="text-sm text-indigo-600">
                    {traits?.elementName} · {traits?.rulingPlanet} · {traits?.dateRange}
                  </p>
                </div>
              </div>
              <Button onClick={handleAnalyze} variant="outline" size="sm" disabled={isAnalyzing}>
                {isAnalyzing ? "재분석 중..." : "재분석"}
              </Button>
            </div>

            {/* AI 해석 설정 */}
            <AIInterpretationControls
              enabledProviders={enabledProviders}
              promptOptions={promptOptions}
              isGenerating={isGeneratingAI}
              onGenerate={handleLLMInterpretation}
            />

            {/* 해석 결과 표시 */}
            {analysis.interpretation && (
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{analysis.interpretation}</ReactMarkdown>
              </div>
            )}
          </>
        ) : (
          <AnalysisEmptyState
            icon={Star}
            message="아직 별자리 분석이 없습니다."
            actionLabel="별자리 분석 시작"
            onAction={handleAnalyze}
            isLoading={isAnalyzing}
          />
        )}
      </div>
    </div>
  )
}
