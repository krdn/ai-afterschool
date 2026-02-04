"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { verifySession } from "@/lib/dal"
import { db } from "@/lib/db"
import { getUnifiedPersonalityData, upsertPersonalitySummary } from "@/lib/db/personality-summary"
import { getCompatibilityResult } from "@/lib/db/compatibility-result"
import { generateWithProvider, FailoverError } from "@/lib/ai/router"
import { buildCounselingSummaryPrompt, buildPersonalitySummaryPrompt } from "@/lib/ai/counseling-prompts"

// Validation schemas
const studentIdSchema = z.string().cuid()
const sessionIdSchema = z.string().cuid()

/**
 * 학생 AI 지원 데이터 반환 타입
 */
export type AISupportData = {
  studentName: string
  personalitySummary: string | null
  compatibility: {
    overallScore: number
    breakdown: Record<string, number>
    reasons: string[]
  } | null
  canCalculateCompatibility: boolean
  hasAnalysisData: boolean
}

/**
 * 학생 AI 지원 데이터 조회 Server Action
 *
 * 상담 화면에서 학생의 성향 요약과 궁합 점수를 조회합니다.
 * - 성향 요약: PersonalitySummary.coreTraits 필드
 * - 궁합 점수: CompatibilityResult 테이블
 *
 * @param studentId - 학생 ID
 * @returns AI 지원 데이터 또는 에러
 */
export async function getStudentAISupportDataAction(studentId: string): Promise<{
  success: boolean
  data?: AISupportData
  error?: string
}> {
  // 1. 인증 확인
  const session = await verifySession()
  if (!session?.userId) {
    return { success: false, error: "인증되지 않았습니다." }
  }

  // 2. 입력 검증
  const parseResult = studentIdSchema.safeParse(studentId)
  if (!parseResult.success) {
    return { success: false, error: "유효하지 않은 학생 ID입니다." }
  }

  // 3. 학생 조회 (teacherId로 권한 확인)
  const student = await db.student.findFirst({
    where: {
      id: studentId,
      teacherId: session.userId,
    },
    select: {
      id: true,
      name: true,
      personalitySummary: {
        select: {
          coreTraits: true,
          status: true,
        },
      },
    },
  })

  if (!student) {
    return { success: false, error: "학생을 찾을 수 없거나 접근 권한이 없습니다." }
  }

  // 4. 궁합 점수 조회
  const compatibilityResult = await getCompatibilityResult(session.userId, studentId)

  // 5. 성향 데이터 존재 여부 확인
  const personalityData = await getUnifiedPersonalityData(studentId, session.userId)

  // 최소 1개 이상의 분석이 있는지 확인
  const hasAnalysisData = personalityData ? [
    personalityData.saju.calculatedAt,
    personalityData.name.calculatedAt,
    personalityData.mbti.calculatedAt,
    personalityData.face.analyzedAt,
    personalityData.palm.analyzedAt,
  ].some(Boolean) : false

  // 6. 궁합 계산 가능 여부 (성향 데이터가 있고 궁합 결과가 없는 경우)
  const canCalculateCompatibility = hasAnalysisData && !compatibilityResult

  // 7. 반환 데이터 구성
  const data: AISupportData = {
    studentName: student.name,
    personalitySummary: student.personalitySummary?.coreTraits ?? null,
    compatibility: compatibilityResult
      ? {
          overallScore: compatibilityResult.overallScore,
          breakdown: compatibilityResult.breakdown as Record<string, number>,
          reasons: (compatibilityResult.reasons as string[]) ?? [],
        }
      : null,
    canCalculateCompatibility,
    hasAnalysisData,
  }

  return { success: true, data }
}
