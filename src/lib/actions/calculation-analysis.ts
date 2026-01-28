"use server"

import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"
import { db } from "@/lib/db"
import { verifySession } from "@/lib/dal"
import {
  calculateSaju,
  generateSajuInterpretation,
} from "@/lib/analysis/saju"
import {
  clearStudentRecalculationNeeded,
  getStudentCalculationStatus,
  markStudentRecalculationNeeded,
  upsertNameAnalysis,
  upsertSajuAnalysis,
} from "@/lib/db/student-analysis"

type AnalysisInput = Prisma.JsonValue
type AnalysisResult = Prisma.JsonValue

async function ensureStudentAccess(studentId: string, teacherId: string) {
  const student = await db.student.findFirst({
    where: {
      id: studentId,
      teacherId,
    },
    select: { id: true },
  })

  if (!student) {
    throw new Error("학생을 찾을 수 없어요.")
  }
}

export async function getCalculationStatus(studentId: string) {
  const session = await verifySession()
  return getStudentCalculationStatus(studentId, session.userId)
}

export async function saveSajuAnalysis(
  studentId: string,
  inputSnapshot: AnalysisInput,
  result: AnalysisResult,
  interpretation?: string | null
) {
  const session = await verifySession()
  await ensureStudentAccess(studentId, session.userId)

  await upsertSajuAnalysis(studentId, {
    inputSnapshot,
    result,
    interpretation,
  })

  await clearStudentRecalculationNeeded(studentId, session.userId)
  revalidatePath(`/students/${studentId}`)
}

export async function saveNameAnalysis(
  studentId: string,
  inputSnapshot: AnalysisInput,
  result: AnalysisResult,
  interpretation?: string | null
) {
  const session = await verifySession()
  await ensureStudentAccess(studentId, session.userId)

  await upsertNameAnalysis(studentId, {
    inputSnapshot,
    result,
    interpretation,
  })

  await clearStudentRecalculationNeeded(studentId, session.userId)
  revalidatePath(`/students/${studentId}`)
}

export async function markRecalculationNeeded(
  studentId: string,
  reason: string
) {
  const session = await verifySession()
  await markStudentRecalculationNeeded(studentId, session.userId, reason)
  revalidatePath(`/students/${studentId}`)
}

export async function runSajuAnalysis(studentId: string) {
  const session = await verifySession()

  const student = await db.student.findFirst({
    where: {
      id: studentId,
      teacherId: session.userId,
    },
    select: {
      id: true,
      birthDate: true,
    },
  })

  if (!student) {
    throw new Error("학생을 찾을 수 없어요.")
  }

  const inputSnapshot = {
    birthDate: student.birthDate.toISOString(),
    timeKnown: false,
    longitude: 127.0,
  }

  const result = calculateSaju({
    birthDate: student.birthDate,
    time: null,
    longitude: 127.0,
  })
  const interpretation = generateSajuInterpretation(result)

  await saveSajuAnalysis(studentId, inputSnapshot, result, interpretation)

  return {
    result,
    interpretation,
  }
}
