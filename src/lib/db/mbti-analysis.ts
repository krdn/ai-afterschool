import { Prisma } from "@prisma/client"
import { db } from "@/lib/db"

/**
 * MBTI 설문 임시 저장 조회
 */
export async function getMbtiDraft(studentId: string) {
  return db.mbtiSurveyDraft.findUnique({
    where: { studentId },
  })
}

/**
 * MBTI 설문 임시 저장 생성/업데이트
 */
export async function upsertMbtiDraft(
  studentId: string,
  responses: Prisma.InputJsonValue,
  progress: number
) {
  return db.mbtiSurveyDraft.upsert({
    where: { studentId },
    update: {
      responses,
      progress,
    },
    create: {
      studentId,
      responses,
      progress,
    },
  })
}

/**
 * MBTI 설문 임시 저장 삭제
 */
export async function deleteMbtiDraft(studentId: string) {
  return db.mbtiSurveyDraft.delete({
    where: { studentId },
  })
}

/**
 * MBTI 분석 결과 저장/업데이트
 */
export async function upsertMbtiAnalysis(
  studentId: string,
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

  return db.mbtiAnalysis.upsert({
    where: { studentId },
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
      studentId,
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
 * MBTI 분석 결과 조회
 */
export async function getMbtiAnalysis(studentId: string) {
  return db.mbtiAnalysis.findUnique({
    where: { studentId },
  })
}
