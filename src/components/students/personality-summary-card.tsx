import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Circle, Sparkles } from "lucide-react"
import {
  getUnifiedPersonalityData,
  getPersonalitySummary,
} from "@/lib/db/personality-summary"

type PersonalitySummaryCardProps = {
  studentId: string
  teacherId: string
}

/**
 * 통합 성향 요약 카드 컴포넌트 (Server Component)
 * 학생의 모든 분석 완료 상태를 한눈에 보여주고 AI 통합 분석 생성 진입점 제공
 */
export async function PersonalitySummaryCard({
  studentId,
  teacherId,
}: PersonalitySummaryCardProps) {
  // 통합 데이터 조회
  const data = await getUnifiedPersonalityData(studentId, teacherId)
  const summary = await getPersonalitySummary(studentId)

  if (!data) {
    return null
  }

  // 분석 완료 상태 계산
  const sajuAvailable = !!data.saju.calculatedAt
  const nameAvailable = !!data.name.calculatedAt
  const mbtiAvailable = !!data.mbti.calculatedAt
  const faceAvailable = !!data.face.analyzedAt
  const palmAvailable = !!data.palm.analyzedAt

  const availableCount =
    [sajuAvailable, nameAvailable, mbtiAvailable, faceAvailable, palmAvailable].filter(
      Boolean
    ).length

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          통합 성향 분석
        </CardTitle>
        <div className="text-sm text-gray-500">
          {availableCount}/5 완료
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 분석 상태 그리드 */}
        <div className="grid grid-cols-5 gap-2">
          <AnalysisStatus label="사주" available={sajuAvailable} />
          <AnalysisStatus label="성명" available={nameAvailable} />
          <AnalysisStatus label="MBTI" available={mbtiAvailable} />
          <AnalysisStatus label="관상" available={faceAvailable} />
          <AnalysisStatus label="손금" available={palmAvailable} />
        </div>

        {/* 상태별 조건부 렌더링 */}
        {summary?.coreTraits ? (
          // 요약 완료 상태
          <div className="rounded-md bg-blue-50 p-4 border border-blue-200">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">핵심 성향</h4>
            <p className="text-sm text-blue-800 leading-relaxed whitespace-pre-wrap">
              {summary.coreTraits}
            </p>
          </div>
        ) : availableCount >= 3 ? (
          // 생성 가능 상태
          <div className="rounded-md bg-gray-50 p-4 text-center">
            <p className="text-sm text-gray-700 mb-3">
              충분한 데이터가 모였어요. AI 분석을 시작할까요?
            </p>
            <GenerateActionButton studentId={studentId} />
          </div>
        ) : (
          // 데이터 부족 상태
          <div className="rounded-md bg-gray-50 p-4 flex items-center gap-3">
            <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <p className="text-sm text-gray-600">
              최소 3개 이상의 분석이 필요해요.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// 클라이언트 컴포넌트 분리
// ============================================================================

import { Button } from "@/components/ui/button"
import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { generateLearningStrategy } from "@/lib/actions/personality-integration"

/**
 * AI 통합 분석 생성 버튼 (Client Component)
 */
export function GenerateActionButton({ studentId }: { studentId: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleClick = () => {
    startTransition(async () => {
      const result = await generateLearningStrategy(studentId)

      if (result.success) {
        toast.success(result.message || "AI 분석을 시작했습니다.")
        // 페이지 새로고침으로 상태 업데이트 반영
        router.refresh()
      } else {
        toast.error(result.error || "AI 분석 시작에 실패했습니다.")
      }
    })
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isPending}
      className="bg-blue-600 hover:bg-blue-700"
    >
      {isPending ? "생성 중..." : "AI 통합 분석 생성"}
    </Button>
  )
}

// ============================================================================
// 분석 상태 컴포넌트
// ============================================================================
function AnalysisStatus({
  label,
  available,
}: {
  label: string
  available: boolean
}) {
  return (
    <div
      className={`flex flex-col items-center gap-1 p-2 rounded-md border ${
        available
          ? "bg-green-50 border-green-200"
          : "bg-gray-50 border-gray-200"
      }`}
    >
      {available ? (
        <CheckCircle2 className="w-4 h-4 text-green-600" />
      ) : (
        <Circle className="w-4 h-4 text-gray-400" />
      )}
      <span className="text-xs text-gray-600">{label}</span>
    </div>
  )
}
