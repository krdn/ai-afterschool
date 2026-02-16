"use client"

import { useState } from "react"
import Link from "next/link"
import { BookOpen, Pencil } from "lucide-react"
import { VarkResultsDisplay } from "@/components/vark/results-display"
import { generateVarkLLMInterpretation } from "@/lib/actions/student/vark-survey"
import type { ProviderName } from "@/lib/ai/providers/types"
import type { GenericPromptMeta } from "@/components/students/prompt-selector"
import {
  AnalysisErrorBanner,
  AIInterpretationControls,
  AnalysisEmptyState,
} from "@/components/common/analysis-panel"

type VarkAnalysis = {
  varkType: string
  scores: Record<string, number>
  percentages: Record<string, number>
  interpretation: string | null
  calculatedAt: Date
} | null

type Props = {
  studentId: string
  studentName: string
  analysis: VarkAnalysis
  enabledProviders?: ProviderName[]
  promptOptions?: GenericPromptMeta[]
  onDataChange?: () => void
}

export function VarkAnalysisPanel({ studentId, studentName, analysis, enabledProviders = [], promptOptions = [], onDataChange }: Props) {
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleLLMInterpretation = async (provider: string, promptId: string) => {
    setIsGeneratingAI(true)
    setErrorMessage(null)
    try {
      await generateVarkLLMInterpretation(studentId, provider, promptId)
      onDataChange?.()
    } catch (error) {
      setErrorMessage(`AI 해석에 실패했습니다. (${error instanceof Error ? error.message : "알 수 없는 오류"})`)
    } finally {
      setIsGeneratingAI(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-100 rounded-lg">
            <BookOpen className="w-5 h-5 text-teal-600" />
          </div>
          <h2 className="text-lg font-semibold">VARK 학습유형 검사</h2>
        </div>
        {analysis && (
          <Link
            href={`/students/${studentId}/vark`}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 px-2 py-1 hover:bg-gray-100 rounded-lg transition-colors"
            title="설문 재검사"
          >
            <Pencil className="w-4 h-4" />
            <span className="hidden sm:inline">재검사</span>
          </Link>
        )}
      </div>

      <div className="p-6 space-y-6">
        {errorMessage && (
          <AnalysisErrorBanner
            message={errorMessage}
            onDismiss={() => setErrorMessage(null)}
          />
        )}

        {/* AI 해석 설정 */}
        {analysis && (
          <AIInterpretationControls
            enabledProviders={enabledProviders}
            promptOptions={promptOptions}
            isGenerating={isGeneratingAI}
            onGenerate={handleLLMInterpretation}
          />
        )}

        {/* VARK 결과 표시 */}
        {analysis ? (
          <VarkResultsDisplay
            analysis={{
              varkType: analysis.varkType,
              scores: analysis.scores,
              percentages: analysis.percentages,
              interpretation: analysis.interpretation,
              calculatedAt: analysis.calculatedAt,
            }}
          />
        ) : (
          <AnalysisEmptyState
            icon={BookOpen}
            message="아직 VARK 학습유형 검사를 하지 않았습니다."
          >
            <Link
              href={`/students/${studentId}/vark`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              <BookOpen className="w-4 h-4" />
              검사 시작
            </Link>
          </AnalysisEmptyState>
        )}
      </div>
    </div>
  )
}
