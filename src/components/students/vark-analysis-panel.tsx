"use client"

import { useState } from "react"
import Link from "next/link"
import { BookOpen, Pencil, Sparkles, AlertCircle } from "lucide-react"
import { VarkResultsDisplay } from "@/components/vark/results-display"
import { generateVarkLLMInterpretation } from "@/lib/actions/vark-survey"
import type { ProviderName } from "@/lib/ai/providers/types"
import { ProviderSelector } from "@/components/students/provider-selector"
import { PromptSelector } from "@/components/students/prompt-selector"
import type { GenericPromptMeta } from "@/components/students/prompt-selector"
import { Button } from "@/components/ui/button"

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
  const [selectedProvider, setSelectedProvider] = useState("auto")
  const [selectedPromptId, setSelectedPromptId] = useState("default")

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
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{errorMessage}</p>
                <Button onClick={() => setErrorMessage(null)} variant="outline" size="sm" className="mt-2">
                  닫기
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* AI 해석 설정 */}
        {analysis && (
          <div className="rounded-md border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
              <ProviderSelector
                selectedProvider={selectedProvider}
                onProviderChange={setSelectedProvider}
                availableProviders={enabledProviders}
                disabled={isGeneratingAI}
              />
              {promptOptions.length > 0 && (
                <PromptSelector
                  selectedPromptId={selectedPromptId}
                  onPromptChange={setSelectedPromptId}
                  promptOptions={promptOptions}
                  disabled={isGeneratingAI}
                />
              )}
              <Button
                onClick={async () => {
                  setIsGeneratingAI(true)
                  setErrorMessage(null)
                  try {
                    await generateVarkLLMInterpretation(studentId, selectedProvider, selectedPromptId)
                    onDataChange?.()
                  } catch (error) {
                    setErrorMessage(`AI 해석에 실패했습니다. (${error instanceof Error ? error.message : "알 수 없는 오류"})`)
                  } finally {
                    setIsGeneratingAI(false)
                  }
                }}
                disabled={isGeneratingAI}
                className="w-full sm:w-auto"
              >
                <Sparkles className="w-4 h-4 mr-1" />
                {isGeneratingAI ? "AI 해석 중..." : "AI로 해석하기"}
              </Button>
            </div>
          </div>
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
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">
              아직 VARK 학습유형 검사를 하지 않았습니다.
            </p>
            <Link
              href={`/students/${studentId}/vark`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              <BookOpen className="w-4 h-4" />
              검사 시작
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
