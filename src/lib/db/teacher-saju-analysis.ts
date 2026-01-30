import { Prisma } from "@prisma/client"
import { db } from "@/lib/db"

type AnalysisPayload = {
  inputSnapshot: Prisma.JsonValue
  result: Prisma.JsonValue
  interpretation?: string | null
  status?: string
  version?: number
  calculatedAt?: Date
}

/**
 * 선생님 사주 분석 결과 생성/업데이트
 */
export async function upsertTeacherSajuAnalysis(
  teacherId: string,
  payload: AnalysisPayload
) {
  const calculatedAt = payload.calculatedAt ?? new Date()
  const data = {
    inputSnapshot: payload.inputSnapshot as Prisma.InputJsonValue,
    result: payload.result as Prisma.InputJsonValue,
    interpretation: payload.interpretation ?? null,
    status: payload.status ?? "complete",
    version: payload.version ?? 1,
    calculatedAt,
  }

  return db.teacherSajuAnalysis.upsert({
    where: { teacherId },
    update: data,
    create: {
      teacherId,
      ...data,
    },
  })
}

/**
 * 선생님 사주 분석 결과 조회
 */
export async function getTeacherSajuAnalysis(teacherId: string) {
  return db.teacherSajuAnalysis.findUnique({
    where: { teacherId },
  })
}
