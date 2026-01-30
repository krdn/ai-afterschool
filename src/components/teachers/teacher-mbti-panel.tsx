"use client"

import { useState } from "react"
import { Brain, Edit3 } from "lucide-react"
import { MbtiResultsDisplay } from "@/components/mbti/results-display"
import { runTeacherMbtiAnalysis } from "@/lib/actions/teacher-analysis"
import { useRouter } from "next/navigation"

type TeacherMbtiAnalysis = {
  mbtiType: string
  percentages: Record<string, number>
  calculatedAt: Date
} | null

type Props = {
  teacherId: string
  teacherName: string
  analysis: TeacherMbtiAnalysis
}

export function TeacherMbtiPanel({ teacherId, teacherName, analysis }: Props) {
  const [showDirectInput, setShowDirectInput] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleAnalysisStart = async () => {
    setIsAnalyzing(true)
    setError(null)

    try {
      // TODO: 실제 설문 폼 페이지 구현 후 /teachers/${id}/mbti 링크로 대체
      // 현재는 모의 응답으로 테스트
      const mockResponses: Record<string, number> = {}
      for (let i = 1; i <= 60; i++) {
        // 모의 응답: 랜덤 점수 (1-5)
        mockResponses[String(i)] = Math.floor(Math.random() * 5) + 1
      }

      await runTeacherMbtiAnalysis(teacherId, mockResponses)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "분석 실행에 실패했어요")
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Brain className="w-5 h-5 text-purple-600" />
          </div>
          <h2 className="text-lg font-semibold">MBTI 성향 분석</h2>
        </div>
        {analysis && (
          <button
            onClick={() => setShowDirectInput(true)}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 px-2 py-1 hover:bg-gray-100 rounded-lg transition-colors"
            title="MBTI 유형 직접 입력"
          >
            <Edit3 className="w-4 h-4" />
            <span className="hidden sm:inline">직접 입력</span>
          </button>
        )}
      </div>

      <div className="p-6">
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
            {error && (
              <p className="text-sm text-red-600 mb-4">{error}</p>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleAnalysisStart}
                disabled={isAnalyzing}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Brain className="w-4 h-4" />
                {isAnalyzing ? "분석 중..." : "분석 시작"}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              참고: 현재 모의 응답으로 테스트 중입니다. 실제 설문 폼은 다음 plan에서 구현 예정입니다.
            </p>
          </div>
        )}
      </div>

      {/* 직접 입력 모달 - TODO: 나중에 구현 */}
      {showDirectInput && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">MBTI 직접 입력</h3>
            <p className="text-sm text-gray-600 mb-4">
              이 기능은 다음 plan에서 구현될 예정입니다.
            </p>
            <button
              onClick={() => setShowDirectInput(false)}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
