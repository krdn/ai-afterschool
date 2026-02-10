"use client"

import { useState, useTransition } from "react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { User, RefreshCw } from "lucide-react"
import { runTeacherNameAnalysis } from "@/lib/actions/teacher-analysis"
import { useRouter } from "next/navigation"
import type { NameNumerologyResult } from "@/lib/analysis/name-numerology"
import {
  coerceHanjaSelections,
  getStrokeInfo,
  normalizeHanjaSelections,
  selectionsToHanjaName,
} from "@/lib/analysis/hanja-strokes"

type TeacherNameAnalysis = {
  result: NameNumerologyResult
  interpretation: string | null
  calculatedAt: Date
} | null

type Props = {
  teacherId: string
  teacherName: string
  analysis: TeacherNameAnalysis
  teacherNameHanja?: string | null
}

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value)
}

export function TeacherNamePanel({
  teacherId,
  teacherName,
  analysis,
  teacherNameHanja
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const router = useRouter()

  const selections = normalizeHanjaSelections(
    teacherName,
    coerceHanjaSelections(teacherNameHanja)
  )
  const hanjaName = selectionsToHanjaName(selections)
  const canAnalyze = selections.length > 0 && selections.every((s) => s.hanja)
  const result = analysis?.result

  const calculatedAt = analysis?.calculatedAt
    ? toDate(analysis.calculatedAt)
    : null

  const handleRunAnalysis = () => {
    startTransition(async () => {
      setErrorMessage(null)
      try {
        await runTeacherNameAnalysis(teacherId)
        router.refresh()
      } catch (error) {
        console.error("Failed to run name analysis", error)
        setErrorMessage(error instanceof Error ? error.message : "성명학 분석 실행에 실패했어요. 한자 선택을 확인해주세요.")
      }
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold">성명학 분석</h2>
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
        {/* 한자 선택 및 실행 버튼 */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-600">1. 한자 선택</h3>
          <div className="rounded-md bg-gray-50 p-4 text-sm text-gray-700">
            <p>선생님: {teacherName}</p>
            <p>선택 한자: {hanjaName ?? "미선택"}</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {selections.map((selection, index) => (
                <div
                  key={`${selection.syllable}-${index}`}
                  className="flex items-center justify-between rounded-md bg-white px-3 py-2"
                >
                  <span>
                    {selection.syllable} → {selection.hanja ?? "-"}
                  </span>
                  <span className="text-xs text-gray-500">
                    {selection.hanja
                      ? (() => {
                          const info = getStrokeInfo(selection.hanja)
                          if (!info) return "?획"
                          return info.estimated
                            ? `~${info.strokes}획`
                            : `${info.strokes}획`
                        })()
                      : "획수 없음"}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRunAnalysis}
              disabled={isPending || !canAnalyze}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  분석 중...
                </>
              ) : (
                <>
                  <User className="w-4 h-4" />
                  {analysis ? "재분석" : "성명학 분석 시작"}
                </>
              )}
            </button>
          </div>
          {!canAnalyze ? (
            <p className="text-xs text-amber-600">
              한자 정보를 먼저 입력해주세요. (선생님 정보 수정에서 nameHanja 필드 필요)
            </p>
          ) : null}
          {errorMessage && (
            <p className="text-sm text-red-600">{errorMessage}</p>
          )}
        </div>

        {/* 수리 격국 */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-600">2. 수리 격국</h3>
          {result ? (
            <div className="grid gap-3 rounded-md border border-gray-200 bg-white p-4 text-sm">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-gray-500">원격</p>
                  <p className="font-medium">{result.grids.won}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">형격</p>
                  <p className="font-medium">{result.grids.hyung}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">이격</p>
                  <p className="font-medium">{result.grids.yi}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">정격</p>
                  <p className="font-medium">{result.grids.jeong}</p>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                총 획수: {result.strokes.total}획 · 성: {result.strokes.surname}획 · 이름: {result.strokes.givenName}획
              </div>
            </div>
          ) : (
            <div className="rounded-md bg-gray-50 p-4 text-sm text-gray-500">
              아직 계산된 성명학 결과가 없습니다.
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
              성명학 해석이 아직 생성되지 않았어요.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
