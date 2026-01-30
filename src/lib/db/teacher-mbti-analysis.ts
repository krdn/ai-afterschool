import { Prisma } from "@prisma/client"
import { db } from "@/lib/db"

/**
 * 선생님 MBTI 분석 결과 생성/업데이트
 */
export async function upsertTeacherMbtiAnalysis(
  teacherId: string,
  data: {
    responses: Prisma.InputJsonValue
    scores: Prisma.InputJsonValue
    mbtiType: string
    percentages: Prisma.InputJsonValue
    interpretation?: string | null
    version?: number
    calculatedAt?: Date
  }
) {
  const calculatedAt = data.calculatedAt ?? new Date()
  const version = data.version ?? 1

  return db.teacherMbtiAnalysis.upsert({
    where: { teacherId },
    update: {
      responses: data.responses,
      scores: data.scores,
      mbtiType: data.mbtiType,
      percentages: data.percentages,
      interpretation: data.interpretation ?? null,
      version,
      calculatedAt,
    },
    create: {
      teacherId,
      responses: data.responses,
      scores: data.scores,
      mbtiType: data.mbtiType,
      percentages: data.percentages,
      interpretation: data.interpretation ?? null,
      version,
      calculatedAt,
    },
  })
}

/**
 * 선생님 MBTI 분석 결과 조회
 */
export async function getTeacherMbtiAnalysis(teacherId: string) {
  return db.teacherMbtiAnalysis.findUnique({
    where: { teacherId },
  })
}
