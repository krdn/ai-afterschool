import { Prisma } from "@prisma/client"
import { db } from "@/lib/db"

export type CalculationStatus = {
  studentId: string
  sajuCalculatedAt: Date | null
  nameCalculatedAt: Date | null
  latestCalculatedAt: Date | null
  needsRecalculation: boolean
  recalculationReason: string | null
  recalculationAt: Date | null
}

type AnalysisPayload = {
  inputSnapshot: Prisma.JsonValue
  result: Prisma.JsonValue
  interpretation?: string | null
  status?: string
  version?: number
  calculatedAt?: Date
}

function resolveLatestCalculatedAt(
  sajuCalculatedAt: Date | null,
  nameCalculatedAt: Date | null
) {
  if (!sajuCalculatedAt && !nameCalculatedAt) return null
  if (sajuCalculatedAt && nameCalculatedAt) {
    return sajuCalculatedAt > nameCalculatedAt
      ? sajuCalculatedAt
      : nameCalculatedAt
  }
  return sajuCalculatedAt ?? nameCalculatedAt
}

export async function getStudentCalculationStatus(
  studentId: string,
  teacherId: string | null
): Promise<CalculationStatus | null> {
  const where: { id: string; teacherId?: string } = { id: studentId }
  if (teacherId) where.teacherId = teacherId

  const student = await db.student.findFirst({
    where,
    include: {
      sajuAnalysis: true,
      nameAnalysis: true,
    },
  })

  if (!student) return null

  const sajuCalculatedAt = student.sajuAnalysis?.calculatedAt ?? null
  const nameCalculatedAt = student.nameAnalysis?.calculatedAt ?? null

  return {
    studentId: student.id,
    sajuCalculatedAt,
    nameCalculatedAt,
    latestCalculatedAt: resolveLatestCalculatedAt(
      sajuCalculatedAt,
      nameCalculatedAt
    ),
    needsRecalculation: student.calculationRecalculationNeeded,
    recalculationReason: student.calculationRecalculationReason,
    recalculationAt: student.calculationRecalculationAt,
  }
}

export async function upsertSajuAnalysis(
  studentId: string,
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

  return db.sajuAnalysis.upsert({
    where: { studentId },
    update: data,
    create: {
      studentId,
      ...data,
    },
  })
}

export async function upsertNameAnalysis(
  studentId: string,
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

  return db.nameAnalysis.upsert({
    where: { studentId },
    update: data,
    create: {
      studentId,
      ...data,
    },
  })
}

export async function markStudentRecalculationNeeded(
  studentId: string,
  teacherId: string | null,
  reason: string
) {
  const where: { id: string; teacherId?: string } = { id: studentId }
  if (teacherId) where.teacherId = teacherId

  const result = await db.student.updateMany({
    where,
    data: {
      calculationRecalculationNeeded: true,
      calculationRecalculationReason: reason,
      calculationRecalculationAt: new Date(),
    },
  })

  if (result.count === 0) {
    throw new Error("학생을 찾을 수 없어요.")
  }
}

// ---------------------------------------------------------------------------
// 사주 분석 이력
// ---------------------------------------------------------------------------

export type SajuHistoryPayload = {
  studentId: string
  promptId: string
  additionalRequest?: string | null
  result: Prisma.InputJsonValue
  interpretation?: string | null
  usedProvider: string
  usedModel?: string | null
  calculatedAt?: Date
}

export async function createSajuHistory(payload: SajuHistoryPayload) {
  return db.sajuAnalysisHistory.create({
    data: {
      studentId: payload.studentId,
      promptId: payload.promptId,
      additionalRequest: payload.additionalRequest ?? null,
      result: payload.result,
      interpretation: payload.interpretation ?? null,
      usedProvider: payload.usedProvider,
      usedModel: payload.usedModel ?? null,
      calculatedAt: payload.calculatedAt ?? new Date(),
    },
  })
}

export async function getSajuHistoryList(studentId: string) {
  return db.sajuAnalysisHistory.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      promptId: true,
      additionalRequest: true,
      usedProvider: true,
      usedModel: true,
      calculatedAt: true,
      createdAt: true,
      interpretation: true,
    },
  })
}

export async function getSajuHistoryDetail(historyId: string) {
  return db.sajuAnalysisHistory.findUnique({
    where: { id: historyId },
  })
}

export async function clearStudentRecalculationNeeded(
  studentId: string,
  teacherId: string | null
) {
  const where: { id: string; teacherId?: string } = { id: studentId }
  if (teacherId) where.teacherId = teacherId

  const result = await db.student.updateMany({
    where,
    data: {
      calculationRecalculationNeeded: false,
      calculationRecalculationReason: null,
      calculationRecalculationAt: null,
    },
  })

  if (result.count === 0) {
    throw new Error("학생을 찾을 수 없어요.")
  }
}
