"use client"

import { useState, useTransition } from "react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { Calendar, RefreshCw } from "lucide-react"
import { runTeacherSajuAnalysis } from "@/lib/actions/teacher-analysis"
import { useRouter } from "next/navigation"
import type { SajuResult } from "@/lib/analysis/saju"

type TeacherSajuAnalysis = {
  result: SajuResult
  interpretation: string | null
  calculatedAt: Date
} | null

type Props = {
  teacherId: string
  teacherName: string
  analysis: TeacherSajuAnalysis
  teacherBirthDate?: Date | null
  teacherBirthTimeHour?: number | null
  teacherBirthTimeMinute?: number | null
}

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value)
}

function formatBirthTime(hour: number | null, minute: number | null) {
  if (hour === null) {
    return "미상"
  }
  const safeMinute = minute ?? 0
  return `${String(hour).padStart(2, "0")}:${String(safeMinute).padStart(2, "0")}`
}

export function TeacherSajuPanel({
  teacherId,
  teacherName,
  analysis,
  teacherBirthDate,
  teacherBirthTimeHour,
  teacherBirthTimeMinute
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const router = useRouter()
  const result = analysis?.result

  const calculatedAt = analysis?.calculatedAt
    ? toDate(analysis.calculatedAt)
    : null

  const canAnalyze = Boolean(teacherBirthDate)

  const handleRunAnalysis = () => {
    startTransition(async () => {
      setErrorMessage(null)
      try {
        await runTeacherSajuAnalysis(teacherId)
        router.refresh()
      } catch (error) {
        console.error("Failed to run saju analysis", error)
        setErrorMessage(error instanceof Error ? error.message : "사주 분석 실행에 실패했어요. 다시 시도해주세요.")
      }
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Calendar className="w-5 h-5 text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold">사주 성향 분석</h2>
        </div>
        <div className="text-xs text-gray-500">
          {calculatedAt
            ? `최근 계산: ${format(calculatedAt, "yyyy.MM.dd HH:mm", {
                locale: ko,
              })}`
            : "아직 분석되지 않았어요."}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* 기본 정보 및 실행 버튼 */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-600">1. 기본 정보</h3>
          <div className="rounded-md bg-gray-50 p-4 text-sm text-gray-700">
            <p>선생님: {teacherName}</p>
            {teacherBirthDate ? (
              <>
                <p>
                  생년월일: {format(toDate(teacherBirthDate), "yyyy년 M월 d일", {
                    locale: ko,
                  })}
                </p>
                <p>
                  출생 시간: {formatBirthTime(teacherBirthTimeHour ?? null, teacherBirthTimeMinute ?? null)}
                  {teacherBirthTimeHour === null ? " (시주 계산 제외)" : ""}
                </p>
              </>
            ) : (
              <p className="text-amber-600">생년월일 정보가 없어 분석을 실행할 수 없어요.</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRunAnalysis}
              disabled={isPending || !canAnalyze}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  분석 중...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  {analysis ? "재분석" : "사주 분석 시작"}
                </>
              )}
            </button>
          </div>
          {!canAnalyze && (
            <p className="text-xs text-amber-600">
              생년월일 정보를 먼저 입력해주세요. (선생님 정보 수정)
            </p>
          )}
          {errorMessage && (
            <p className="text-sm text-red-600">{errorMessage}</p>
          )}
        </div>

        {/* 사주 구조 */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-600">2. 사주 구조</h3>
          {result ? (
            <div className="grid gap-3 rounded-md border border-gray-200 bg-white p-4 text-sm">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-gray-500">연주</p>
                  <p className="font-medium">
                    {result.pillars.year.stem}
                    {result.pillars.year.branch}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">월주</p>
                  <p className="font-medium">
                    {result.pillars.month.stem}
                    {result.pillars.month.branch}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">일주</p>
                  <p className="font-medium">
                    {result.pillars.day.stem}
                    {result.pillars.day.branch}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">시주</p>
                  <p className="font-medium">
                    {result.pillars.hour
                      ? `${result.pillars.hour.stem}${result.pillars.hour.branch}`
                      : "미상"}
                  </p>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                절기: {result.meta.solarTerm} · 오행 균형: 목 {result.elements.목} / 화 {result.elements.화} / 토 {result.elements.토} / 금 {result.elements.금} / 수 {result.elements.수}
              </div>
            </div>
          ) : (
            <div className="rounded-md bg-gray-50 p-4 text-sm text-gray-500">
              아직 계산된 사주 구조가 없습니다.
            </div>
          )}
        </div>

        {/* 해석 */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-600">3. 해석</h3>
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
      </div>
    </div>
  )
}
