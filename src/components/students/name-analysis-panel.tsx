"use client"

import { useState, useTransition } from "react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { runNameAnalysisAction } from "../../app/(dashboard)/students/[id]/name/actions"
import type { NameNumerologyResult } from "@/lib/analysis/name-numerology"
import {
  coerceHanjaSelections,
  getStrokeCount,
  normalizeHanjaSelections,
  selectionsToHanjaName,
} from "@/lib/analysis/hanja-strokes"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type NameAnalysisPanelProps = {
  student: {
    id: string
    name: string
    nameHanja?: unknown
  }
  analysis: {
    result: unknown
    interpretation: string | null
    calculatedAt: Date | string
  } | null
}

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value)
}

export function NameAnalysisPanel({ student, analysis }: NameAnalysisPanelProps) {
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const selections = normalizeHanjaSelections(
    student.name,
    coerceHanjaSelections(student.nameHanja)
  )
  const hanjaName = selectionsToHanjaName(selections)
  const canAnalyze = selections.length > 0 && selections.every((s) => s.hanja)
  const result = analysis?.result as NameNumerologyResult | undefined

  const calculatedAt = analysis?.calculatedAt
    ? toDate(analysis.calculatedAt)
    : null

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>성명학 분석</CardTitle>
        <div className="text-xs text-gray-500">
          {calculatedAt
            ? `최근 계산: ${format(calculatedAt, "yyyy.MM.dd HH:mm", {
                locale: ko,
              })}`
            : "아직 분석되지 않았어요."}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-600">1. 한자 선택</h3>
          <div className="rounded-md bg-gray-50 p-4 text-sm text-gray-700">
            <p>학생: {student.name}</p>
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
                      ? `${getStrokeCount(selection.hanja) ?? "?"}획`
                      : "획수 없음"}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <Button
            type="button"
            disabled={isPending || !canAnalyze}
            onClick={() => {
              startTransition(async () => {
                setErrorMessage(null)
                try {
                  await runNameAnalysisAction(student.id)
                } catch (error) {
                  console.error("Failed to run name analysis", error)
                  setErrorMessage(
                    "성명학 분석 실행에 실패했어요. 한자 선택을 확인해주세요."
                  )
                }
              })
            }}
          >
            {isPending ? "분석 중..." : "성명학 분석 실행"}
          </Button>
          {!canAnalyze ? (
            <p className="text-xs text-amber-600">
              모든 글자에 한자를 선택해야 분석을 실행할 수 있습니다.
            </p>
          ) : null}
          {errorMessage ? (
            <p className="text-sm text-red-600">{errorMessage}</p>
          ) : null}
        </div>

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
      </CardContent>
    </Card>
  )
}
