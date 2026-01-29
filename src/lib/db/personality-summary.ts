import { Prisma } from "@prisma/client"
import { db } from "@/lib/db"

/**
 * 통합 성향 데이터 타입
 * 5개 분석(사주, 성명, MBTI, 관상, 손금)의 결과를 통합하여 반환
 */
export type UnifiedPersonalityData = {
  saju: {
    result: unknown | null
    calculatedAt: Date | null
    interpretation: string | null
  }
  name: {
    result: unknown | null
    calculatedAt: Date | null
    interpretation: string | null
  }
  mbti: {
    result: {
      mbtiType: string
      percentages: Record<string, number>
    } | null
    calculatedAt: Date | null
  }
  face: {
    result: unknown | null
    analyzedAt: Date | null
  }
  palm: {
    result: unknown | null
    analyzedAt: Date | null
  }
}

/**
 * 학생의 모든 성향 분석 데이터를 통합하여 조회
 * 일부 분석이 누락되어도 에러 없이 null 값을 포함하여 반환
 *
 * @param studentId - 학생 ID
 * @param teacherId - 교사 ID (보안 검증용)
 * @returns 통합 성향 데이터 또는 null (학생을 찾지 못한 경우)
 */
export async function getUnifiedPersonalityData(
  studentId: string,
  teacherId: string
): Promise<UnifiedPersonalityData | null> {
  const student = await db.student.findFirst({
    where: {
      id: studentId,
      teacherId,
    },
    include: {
      sajuAnalysis: true,
      nameAnalysis: true,
      mbtiAnalysis: true,
      faceAnalysis: true,
      palmAnalysis: true,
    },
  })

  if (!student) return null

  return {
    saju: {
      result: student.sajuAnalysis?.result ?? null,
      calculatedAt: student.sajuAnalysis?.calculatedAt ?? null,
      interpretation: student.sajuAnalysis?.interpretation ?? null,
    },
    name: {
      result: student.nameAnalysis?.result ?? null,
      calculatedAt: student.nameAnalysis?.calculatedAt ?? null,
      interpretation: student.nameAnalysis?.interpretation ?? null,
    },
    mbti: {
      result: student.mbtiAnalysis
        ? {
            mbtiType: student.mbtiAnalysis.mbtiType,
            percentages: student.mbtiAnalysis.percentages as Record<string, number>,
          }
        : null,
      calculatedAt: student.mbtiAnalysis?.calculatedAt ?? null,
    },
    face: {
      result: student.faceAnalysis?.result ?? null,
      analyzedAt: student.faceAnalysis?.analyzedAt ?? null,
    },
    palm: {
      result: student.palmAnalysis?.result ?? null,
      analyzedAt: student.palmAnalysis?.analyzedAt ?? null,
    },
  }
}

/**
 * 학생의 AI 통합 분석 요약을 조회
 *
 * @param studentId - 학생 ID
 * @returns PersonalitySummary 또는 null
 */
export async function getPersonalitySummary(
  studentId: string
) {
  return db.personalitySummary.findUnique({
    where: { studentId },
  })
}

/**
 * 학생의 AI 통합 분석 이력을 조회
 * 최신 순으로 정렬되어 반환
 *
 * @param studentId - 학생 ID
 * @returns PersonalitySummaryHistory 목록 (빈 배열 가능)
 */
export async function getPersonalitySummaryHistory(
  studentId: string
) {
  return db.personalitySummaryHistory.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
  })
}
