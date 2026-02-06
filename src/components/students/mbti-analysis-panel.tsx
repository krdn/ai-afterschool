"use client"

import { useState } from "react"
import Link from "next/link"
import { Brain, Pencil, Edit3, RefreshCw, Loader2, AlertCircle } from "lucide-react"
import { MbtiResultsDisplay } from "@/components/mbti/results-display"
import { MbtiDirectInputModal } from "@/components/students/mbti-direct-input-modal"
import { saveMbtiDirectInput } from "@/lib/actions/mbti-survey"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

type MbtiAnalysis = {
  mbtiType: string
  percentages: Record<string, number>
  calculatedAt: Date
} | null

type Props = {
  studentId: string
  studentName: string
  analysis: MbtiAnalysis
}

export function MbtiAnalysisPanel({ studentId, studentName, analysis }: Props) {
  const [showDirectInput, setShowDirectInput] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const router = useRouter()

  const handleDirectInputSave = async (data: {
    mbtiType: string
    percentages: {
      E: number; I: number
      S: number; N: number
      T: number; F: number
      J: number; P: number
    }
  }) => {
    setIsSaving(true)
    setErrorMessage(null)
    try {
      const result = await saveMbtiDirectInput(studentId, data)
      if (result.success) {
        setShowDirectInput(false)
        router.refresh() // 페이지 새로고침
      } else {
        setErrorMessage(`MBTI 분석에 실패했습니다. (원인: ${result.error || '알 수 없는 오류'}) 다시 시도해주세요.`)
      }
    } catch (error) {
      setErrorMessage(`MBTI 분석에 실패했습니다. (원인: ${error instanceof Error ? error.message : '알 수 없는 오류'}) 다시 시도해주세요.`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Brain className="w-5 h-5 text-purple-600" />
          </div>
          <h2 data-testid="mbti-tab" className="text-lg font-semibold">MBTI 성향 분석</h2>
        </div>
        {analysis && (
          <div className="flex items-center gap-2">
            {/* 직접 입력 버튼 */}
            <button
              onClick={() => setShowDirectInput(true)}
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 px-2 py-1 hover:bg-gray-100 rounded-lg transition-colors"
              title="MBTI 유형 직접 입력"
            >
              <Edit3 className="w-4 h-4" />
              <span className="hidden sm:inline">직접 입력</span>
            </button>
            {/* 설문 수정 버튼 */}
            <Link
              href={`/students/${studentId}/mbti`}
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 px-2 py-1 hover:bg-gray-100 rounded-lg transition-colors"
              title="설문 재검사"
            >
              <Pencil className="w-4 h-4" />
              <span className="hidden sm:inline">재검사</span>
            </Link>
          </div>
        )}
      </div>

      <div className="p-6">
        {errorMessage && (
          <div data-testid="analysis-error" className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{errorMessage}</p>
                <Button
                  onClick={() => setErrorMessage(null)}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  data-testid="retry-button"
                >
                  닫기
                </Button>
              </div>
            </div>
          </div>
        )}
        {analysis ? (
          <MbtiResultsDisplay
            analysis={{
              mbtiType: analysis.mbtiType,
              percentages: analysis.percentages as {
                E: number; I: number
                S: number; N: number
                T: number; F: number
                J: number; P: number
              },
              calculatedAt: analysis.calculatedAt
            }}
          />
        ) : (
          <div className="text-center py-8">
            <Brain className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">
              아직 MBTI 분석이 없습니다.
            </p>
            <div className="flex gap-3 justify-center">
              {/* 직접 입력 버튼 (분석 없을 때) */}
              <button
                onClick={() => setShowDirectInput(true)}
                className="inline-flex items-center gap-2 px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                직접 입력
              </button>
              {/* 설문 시작 버튼 */}
              <Link
                href={`/students/${studentId}/mbti`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Brain className="w-4 h-4" />
                설문 시작
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* 직접 입력 모달 */}
      {showDirectInput && (
        <MbtiDirectInputModal
          studentId={studentId}
          studentName={studentName}
          existingData={analysis ? {
            mbtiType: analysis.mbtiType,
            percentages: analysis.percentages as {
              E: number; I: number
              S: number; N: number
              T: number; F: number
              J: number; P: number
            }
          } : undefined}
          onSave={handleDirectInputSave}
          onCancel={() => {
            setShowDirectInput(false)
            setErrorMessage(null)
          }}
          isSaving={isSaving}
        />
      )}
    </div>
  )
}
