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
import { getPromptDefinition, type AnalysisPromptId, type StudentInfo } from "@/lib/ai/saju-prompts"
import type { ProviderName } from "@/lib/ai/providers/types"

type AnalysisInput = Prisma.JsonValue
type AnalysisResult = Prisma.JsonValue

function humanizeLLMError(raw: string): string {
  if (raw.includes('quota') || raw.includes('rate') || raw.includes('RESOURCE_EXHAUSTED'))
    return 'API 사용량 한도를 초과했습니다. 요금제를 확인하세요.'
  if (raw.includes('401') || raw.includes('Unauthorized') || raw.includes('API_KEY_INVALID'))
    return 'API 키가 유효하지 않습니다. 설정을 확인하세요.'
  if (raw.includes('ECONNREFUSED') || raw.includes('fetch failed'))
    return 'LLM 서버에 연결할 수 없습니다. 서버 상태를 확인하세요.'
  if (raw.includes('timeout') || raw.includes('abort'))
    return 'LLM 서버 응답 시간이 초과되었습니다. 잠시 후 다시 시도하세요.'
  if (raw.includes('Method Not Allowed'))
    return 'LLM 서버 설정이 올바르지 않습니다. 관리자에게 문의하세요.'
  if (raw.includes('not configured') || raw.includes('not enabled'))
    return '해당 LLM 제공자가 설정되지 않았습니다. 관리자 설정을 확인하세요.'
  return 'LLM 호출 중 오류가 발생했습니다. 잠시 후 다시 시도하세요.'
}

function ownerTeacherId(session: { userId: string; role: string }): string | null {
  return session.role === 'TEACHER' ? session.userId : null
}

async function ensureStudentAccess(studentId: string, session: { userId: string; role: string }) {
  const where: { id: string; teacherId?: string } = { id: studentId }
  const tid = ownerTeacherId(session)
  if (tid) where.teacherId = tid

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
  return getStudentCalculationStatus(studentId, ownerTeacherId(session))
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

  await clearStudentRecalculationNeeded(studentId, ownerTeacherId(session))
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

  await clearStudentRecalculationNeeded(studentId, ownerTeacherId(session))
  revalidatePath(`/students/${studentId}`)
}

export async function markRecalculationNeeded(
  studentId: string,
  reason: string
) {
  const session = await verifySession()
  await markStudentRecalculationNeeded(studentId, ownerTeacherId(session), reason)
  revalidatePath(`/students/${studentId}`)
}

export async function runSajuAnalysis(studentId: string, provider?: string, promptId?: string) {
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
      grade: true,
      school: true,
      targetMajor: true,
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
  const resolvedPromptId: AnalysisPromptId =
    (promptId as AnalysisPromptId) || 'default'

  const inputSnapshot = {
    birthDate: student.birthDate.toISOString(),
    timeKnown,
    time,
    longitude: 127.0,
    promptId: resolvedPromptId,
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
  let llmError: string | undefined
  let usedProvider = '내장 알고리즘'
  let usedModel: string | undefined
  if (!provider || provider === 'built-in') {
    interpretation = generateSajuInterpretation(result)
  } else {
    try {
      const promptDef = getPromptDefinition(resolvedPromptId)
      const birthDateStr = student.birthDate.toISOString().split('T')[0]
      const birthTimeStr = student.birthTimeHour !== null
        ? `${String(student.birthTimeHour).padStart(2, '0')}:${String(student.birthTimeMinute ?? 0).padStart(2, '0')}`
        : '미상'
      const studentInfoForPrompt: StudentInfo = {
        birthDate: birthDateStr,
        birthTime: birthTimeStr,
        grade: student.grade,
        school: student.school,
        targetMajor: student.targetMajor ?? undefined,
      }
      const prompt = promptDef.buildPrompt(result, studentInfoForPrompt)
      const maxTokens = resolvedPromptId === 'default' ? 2048 : 4096
      const llmResult = provider === 'auto'
        ? await generateWithProvider({
            featureType: 'saju_analysis',
            prompt,
            teacherId: session.userId,
            maxOutputTokens: maxTokens,
          })
        : await generateWithSpecificProvider(provider as ProviderName, {
            featureType: 'saju_analysis',
            prompt,
            teacherId: session.userId,
            maxOutputTokens: maxTokens,
          })
      interpretation = llmResult.text
      usedProvider = llmResult.provider
      usedModel = llmResult.model
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.error('[Saju Analysis] LLM failed, falling back to built-in:', errorMsg)
      interpretation = generateSajuInterpretation(result)
      llmFailed = true
      llmError = humanizeLLMError(errorMsg)
    }
  }

  await saveSajuAnalysis(studentId, inputSnapshot, result, interpretation)

  return {
    result,
    interpretation,
    llmFailed,
    llmError,
    usedProvider,
    usedModel,
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
