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
  teacherId: string
): Promise<CalculationStatus | null> {
  const student = await db.student.findFirst({
    where: {
      id: studentId,
      teacherId,
    },
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
  teacherId: string,
  reason: string
) {
  const result = await db.student.updateMany({
    where: {
      id: studentId,
      teacherId,
    },
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

export async function clearStudentRecalculationNeeded(
  studentId: string,
  teacherId: string
) {
  const result = await db.student.updateMany({
    where: {
      id: studentId,
      teacherId,
    },
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
