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
  calculateNameNumerology,
  generateNameInterpretation,
} from "@/lib/analysis/name-numerology"
import {
  coerceHanjaSelections,
  selectionsToHanjaName,
} from "@/lib/analysis/hanja-strokes"
import {
  clearStudentRecalculationNeeded,
  getStudentCalculationStatus,
  markStudentRecalculationNeeded,
  upsertNameAnalysis,
  upsertSajuAnalysis,
} from "@/lib/db/student-analysis"
import { generateWithProvider, generateWithSpecificProvider } from "@/lib/ai/router"
import { SAJU_INTERPRETATION_PROMPT } from "@/lib/ai/prompts"
import type { ProviderName } from "@/lib/ai/providers/types"

type AnalysisInput = Prisma.JsonValue
type AnalysisResult = Prisma.JsonValue

async function ensureStudentAccess(studentId: string, session: { userId: string; role: string }) {
  const where: { id: string; teacherId?: string } = { id: studentId }
  if (session.role === 'TEACHER') {
    where.teacherId = session.userId
  }

  const student = await db.student.findFirst({
    where,
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
  await ensureStudentAccess(studentId, session)

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
  await ensureStudentAccess(studentId, session)

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

export async function runSajuAnalysis(studentId: string, provider?: string) {
  const session = await verifySession()

  const where: { id: string; teacherId?: string } = { id: studentId }
  if (session.role === 'TEACHER') {
    where.teacherId = session.userId
  }

  const student = await db.student.findFirst({
    where,
    select: {
      id: true,
      birthDate: true,
      birthTimeHour: true,
      birthTimeMinute: true,
    },
  })

  if (!student) {
    throw new Error("학생을 찾을 수 없어요.")
  }

  const time =
    student.birthTimeHour === null
      ? null
      : {
          hour: student.birthTimeHour,
          minute: student.birthTimeMinute ?? 0,
        }
  const timeKnown = Boolean(time)
  const inputSnapshot = {
    birthDate: student.birthDate.toISOString(),
    timeKnown,
    time,
    longitude: 127.0,
  }

  // 사주 계산은 항상 알고리즘
  const result = calculateSaju({
    birthDate: student.birthDate,
    time,
    longitude: 127.0,
  })

  // 해석만 내장/LLM 분기
  let interpretation: string
  let llmFailed = false
  if (!provider || provider === 'built-in') {
    interpretation = generateSajuInterpretation(result)
  } else {
    try {
      const prompt = SAJU_INTERPRETATION_PROMPT(result)
      const llmResult = provider === 'auto'
        ? await generateWithProvider({
            featureType: 'saju_analysis',
            prompt,
            teacherId: session.userId,
            maxOutputTokens: 2048,
          })
        : await generateWithSpecificProvider(provider as ProviderName, {
            featureType: 'saju_analysis',
            prompt,
            teacherId: session.userId,
            maxOutputTokens: 2048,
          })
      interpretation = llmResult.text
    } catch (error) {
      console.error('[Saju Analysis] LLM failed, falling back to built-in:', error)
      interpretation = generateSajuInterpretation(result)
      llmFailed = true
    }
  }

  await saveSajuAnalysis(studentId, inputSnapshot, result, interpretation)

  return {
    result,
    interpretation,
    llmFailed,
  }
}

export async function runNameAnalysis(studentId: string) {
  const session = await verifySession()

  const nameWhere: { id: string; teacherId?: string } = { id: studentId }
  if (session.role === 'TEACHER') {
    nameWhere.teacherId = session.userId
  }

  const student = await db.student.findFirst({
    where: nameWhere,
    select: {
      id: true,
      name: true,
      nameHanja: true,
    },
  })

  if (!student) {
    throw new Error("학생을 찾을 수 없어요.")
  }

  const selections = coerceHanjaSelections(student.nameHanja)
  const hanjaName = selectionsToHanjaName(selections)
  const outcome = calculateNameNumerology({
    name: student.name,
    hanjaName,
  })

  if (outcome.status !== "ok") {
    throw new Error(outcome.message)
  }

  const inputSnapshot = {
    name: student.name,
    nameHanja: selections,
    hanjaName,
  }

  const interpretation = generateNameInterpretation(outcome.result)

  await saveNameAnalysis(studentId, inputSnapshot, outcome.result, interpretation)

  return {
    result: outcome.result,
    interpretation,
  }
}
