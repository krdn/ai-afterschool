"use client"

import { useState, useTransition } from "react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { runSajuAnalysisAction } from "../../app/(dashboard)/students/[id]/saju/actions"
import type { SajuResult } from "@/lib/analysis/saju"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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

export function SajuAnalysisPanel({ student, analysis }: SajuAnalysisPanelProps) {
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const result = analysis?.result as SajuResult | undefined

  const calculatedAt = analysis?.calculatedAt
    ? toDate(analysis.calculatedAt)
    : null

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>사주 분석</CardTitle>
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
          <Button
            type="button"
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                setErrorMessage(null)
                try {
                  await runSajuAnalysisAction(student.id)
                } catch (error) {
                  console.error("Failed to run saju analysis", error)
                  setErrorMessage("사주 분석 실행에 실패했어요. 다시 시도해주세요.")
                }
              })
            }}
          >
            {isPending ? "분석 중..." : "사주 분석 실행"}
          </Button>
          {errorMessage ? (
            <p className="text-sm text-red-600">{errorMessage}</p>
          ) : null}
        </div>

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
      </CardContent>
    </Card>
  )
}
