"use client"

import Link from "next/link"
import { Brain, Pencil } from "lucide-react"
import { MbtiResultsDisplay } from "@/components/mbti/results-display"

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
          <Link
            href={`/students/${studentId}/mbti`}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <Pencil className="w-4 h-4" />
            수정
          </Link>
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
            <Link
              href={`/students/${studentId}/mbti`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Brain className="w-4 h-4" />
              MBTI 검사 시작
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
