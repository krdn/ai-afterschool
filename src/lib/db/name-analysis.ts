import { Prisma } from "@prisma/client"
import { db } from "@/lib/db"

/**
 * 이름 분석 결과 조회
 */
export async function getNameAnalysis(studentId: string) {
  return db.nameAnalysis.findUnique({
    where: { studentId },
  })
}

/**
 * 이름 분석 결과 저장/업데이트
 */
export async function upsertNameAnalysis(
  studentId: string,
  data: {
    inputSnapshot: Prisma.InputJsonValue
    result: Prisma.InputJsonValue
    interpretation?: string | null
    version?: number
    calculatedAt?: Date
  }
) {
  const calculatedAt = data.calculatedAt ?? new Date()
  const version = data.version ?? 1

  return db.nameAnalysis.upsert({
    where: { studentId },
    update: {
      inputSnapshot: data.inputSnapshot,
      result: data.result,
      interpretation: data.interpretation ?? null,
      version,
      calculatedAt,
    },
    create: {
      studentId,
      inputSnapshot: data.inputSnapshot,
      result: data.result,
      interpretation: data.interpretation ?? null,
      version,
      calculatedAt,
    },
  })
}
