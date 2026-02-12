"use server"

import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"
import { db } from "@/lib/db"
import { verifySession } from "@/lib/dal"
import { calculateSaju, generateSajuInterpretation } from "@/lib/analysis/saju"
import {
  calculateNameNumerology,
  generateNameInterpretation,
} from "@/lib/analysis/name-numerology"
import { scoreMbti } from "@/lib/analysis/mbti-scoring"
import { upsertTeacherSajuAnalysis } from "@/lib/db/teacher-saju-analysis"
import { upsertTeacherNameAnalysis } from "@/lib/db/teacher-name-analysis"
import { upsertTeacherMbtiAnalysis } from "@/lib/db/teacher-mbti-analysis"
import { getTeacherMbtiAnalysis } from "@/lib/db/teacher-mbti-analysis"
import { getTeacherNameAnalysis } from "@/lib/db/teacher-name-analysis"
import { generateWithProvider, generateWithSpecificProvider } from "@/lib/ai/router"
import { MBTI_INTERPRETATION_PROMPT } from "@/lib/ai/prompts"
import { getMbtiPrompt, type MbtiPromptId } from "@/lib/ai/mbti-prompts"
import { getNamePrompt, type NamePromptId } from "@/lib/ai/name-prompts"
import { getPromptDefinition, type AnalysisPromptId } from "@/lib/ai/saju-prompts"
import { getPresetByKey } from "@/lib/db/saju-prompt-preset"
import type { ProviderName } from "@/lib/ai/providers/types"
import questions from "@/data/mbti/questions.json"
import descriptions from "@/data/mbti/descriptions.json"

/**
 * 선생님 사주 분석 실행
 *
 * Teacher.birthDate와 birthTime으로 사주를 계산하고 DB에 저장합니다.
 * 기존 calculateSaju 순수 함수를 재사용합니다.
 */
function humanizeLLMError(raw: string): string {
  if (raw.includes('quota') || raw.includes('rate') || raw.includes('RESOURCE_EXHAUSTED'))
    return 'API 사용량 한도를 초과했습니다. 요금제를 확인하세요.'
  if (raw.includes('401') || raw.includes('Unauthorized') || raw.includes('API_KEY_INVALID'))
    return 'API 키가 유효하지 않습니다. 설정을 확인하세요.'
  if (raw.includes('not configured') || raw.includes('not enabled'))
    return '해당 LLM 제공자가 설정되지 않았습니다. 관리자 설정을 확인하세요.'
  return 'LLM 호출 중 오류가 발생했습니다. 잠시 후 다시 시도하세요.'
}

export async function runTeacherSajuAnalysis(
  teacherId: string,
  provider?: string,
  promptId?: string,
  additionalRequest?: string
) {
  const session = await verifySession()
  if (!session) throw new Error("Unauthorized")

  const teacher = await db.teacher.findUnique({
    where: { id: teacherId },
    select: {
      id: true,
      name: true,
      birthDate: true,
      birthTimeHour: true,
      birthTimeMinute: true,
    },
  })

  if (!teacher) throw new Error("Teacher not found")
  if (!teacher.birthDate) throw new Error("생일 정보가 없어 사주 분석을 실행할 수 없어요.")

  const time =
    teacher.birthTimeHour === null
      ? null
      : {
          hour: teacher.birthTimeHour,
          minute: teacher.birthTimeMinute ?? 0,
        }

  const sajuResult = calculateSaju({
    birthDate: teacher.birthDate,
    time,
    longitude: 127.0,
  })

  const resolvedPromptId = promptId || 'default'

  // 해석: 내장 알고리즘 vs LLM
  let interpretation: string
  let llmFailed = false
  let llmError: string | undefined
  let usedProvider = '내장 알고리즘'
  let usedModel: string | undefined

  if (!provider || provider === 'built-in') {
    interpretation = generateSajuInterpretation(sajuResult)
  } else {
    try {
      const birthDateStr = teacher.birthDate.toISOString().split('T')[0]
      const birthTimeStr = teacher.birthTimeHour !== null
        ? `${String(teacher.birthTimeHour).padStart(2, '0')}:${String(teacher.birthTimeMinute ?? 0).padStart(2, '0')}`
        : '미상'

      // DB 프리셋 우선, 없으면 코드 기본값 사용
      const dbPreset = await getPresetByKey(resolvedPromptId)
      let prompt: string
      const teacherInfo = {
        birthDate: birthDateStr,
        birthTime: birthTimeStr,
      }
      if (dbPreset?.isActive && dbPreset.promptTemplate) {
        // 선생님 프롬프트: 학생 정보 대신 선생님 정보를 넣어 빌드
        const { buildPromptFromTemplate } = await import("@/lib/ai/saju-prompts")
        prompt = buildPromptFromTemplate(dbPreset.promptTemplate, sajuResult, teacherInfo as never, additionalRequest)
      } else {
        const promptDef = getPromptDefinition(resolvedPromptId as AnalysisPromptId)
        prompt = promptDef.buildPrompt(sajuResult, teacherInfo as never, additionalRequest)
      }

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
      console.error('[Teacher Saju Analysis] LLM failed, falling back to built-in:', errorMsg)
      interpretation = generateSajuInterpretation(sajuResult)
      llmFailed = true
      llmError = humanizeLLMError(errorMsg)
    }
  }

  const inputSnapshot = {
    birthDate: teacher.birthDate.toISOString(),
    timeKnown: Boolean(time),
    time,
    longitude: 127.0,
    promptId: resolvedPromptId,
  }

  await upsertTeacherSajuAnalysis(teacherId, {
    inputSnapshot,
    result: sajuResult,
    interpretation,
    status: "complete",
    version: 1,
    calculatedAt: new Date(),
    usedProvider,
    usedModel,
  })

  revalidatePath(`/teachers/${teacherId}`)

  return {
    success: true,
    result: sajuResult,
    interpretation,
    llmFailed,
    llmError,
    usedProvider,
    usedModel,
  }
}

/**
 * 선생님 성명학 분석 실행
 *
 * Teacher.name과 nameHanja로 성명학을 계산하고 DB에 저장합니다.
 * 기존 calculateNameNumerology 순수 함수를 재사용합니다.
 */
/**
 * 선생님 성명학 분석 실행 (한자 기반 수리 or 한글 기본)
 */
export async function runTeacherNameAnalysis(teacherId: string) {
  const session = await verifySession()
  if (!session) throw new Error("Unauthorized")

  const teacher = await db.teacher.findUnique({
    where: { id: teacherId },
    select: {
      id: true,
      name: true,
      nameHanja: true,
      birthDate: true,
    },
  })

  if (!teacher) throw new Error("Teacher not found")

  const hanjaName = teacher.nameHanja
    ? (teacher.nameHanja as { full?: string })?.full ?? teacher.nameHanja
    : null

  const numerologyOutcome = calculateNameNumerology({
    name: teacher.name,
    hanjaName,
  })

  let interpretation: string
  let result: Record<string, unknown>

  if (numerologyOutcome.status === "ok") {
    const numResult = numerologyOutcome.result
    interpretation = generateNameInterpretation(numResult)
    result = { hasHanja: true, numerology: numResult }
  } else {
    interpretation = `## ${teacher.name} 이름풀이\n\n한자 정보가 등록되지 않아 성명학 수리 분석은 생략되었습니다.\nAI 해석을 통해 이름의 음운과 의미를 분석해보세요.`
    result = { hasHanja: false, reason: numerologyOutcome.status }
  }

  const inputSnapshot = {
    name: teacher.name,
    nameHanja: hanjaName,
    birthDate: teacher.birthDate?.toISOString(),
  }

  await upsertTeacherNameAnalysis(teacherId, {
    inputSnapshot: inputSnapshot as Prisma.JsonValue,
    result: result as Prisma.JsonValue,
    interpretation,
    status: "complete",
    version: 1,
    calculatedAt: new Date(),
  })

  revalidatePath(`/teachers/${teacherId}`)

  return { success: true, result, interpretation }
}

/**
 * 선생님 MBTI 분석 실행
 *
 * MBTI 설문 응답으로 점수를 계산하고 DB에 저장합니다.
 * 기존 scoreMbti 순수 함수를 재사용합니다.
 *
 * @param teacherId - 선생님 ID
 * @param responses - 설문 응답 ({"1": 3, "2": 5, ...})
 */
export async function runTeacherMbtiAnalysis(
  teacherId: string,
  responses: Record<string, number>
) {
  const session = await verifySession()
  if (!session) throw new Error("Unauthorized")

  // 60문항 모두 응답했는지 검증
  const answeredCount = Object.keys(responses).length
  if (answeredCount < 60) {
    throw new Error("모든 문항에 응답해주세요.")
  }

  // MBTI 점수 계산 (기존 라이브러리 재사용)
  const mbtiResult = scoreMbti(responses, questions)

  // 유형 설명 로드
  const typeDescription = descriptions[mbtiResult.mbtiType as keyof typeof descriptions]

  if (!typeDescription) {
    throw new Error(`MBTI 유형 설명을 찾을 수 없어요: ${mbtiResult.mbtiType}`)
  }

  // 해석 텍스트 생성
  const interpretation = `## ${typeDescription.name}

${typeDescription.summary}

### 주요 강점
${typeDescription.strengths.map((s) => `- ${s}`).join("\n")}

### 주의할 점
${typeDescription.weaknesses.map((w) => `- ${w}`).join("\n")}

### 학습 스타일
${typeDescription.learningStyle}

### 추천 직업
${typeDescription.careers.join(", ")}

### 대표 인물
${typeDescription.famousPeople.join(", ")}
`

  // DB 저장
  await upsertTeacherMbtiAnalysis(teacherId, {
    responses,
    scores: mbtiResult.scores,
    mbtiType: mbtiResult.mbtiType,
    percentages: mbtiResult.percentages,
    interpretation,
    version: 1,
    calculatedAt: new Date(),
  })

  revalidatePath(`/teachers/${teacherId}`)

  return {
    success: true,
    result: {
      mbtiType: mbtiResult.mbtiType,
      percentages: mbtiResult.percentages,
      interpretation,
    },
  }
}

/**
 * 선생님 MBTI 직접 입력 (설문 없이 유형과 백분율 직접 저장)
 */
export async function saveTeacherMbtiDirectInput(
  teacherId: string,
  data: {
    mbtiType: string
    percentages: {
      E: number; I: number
      S: number; N: number
      T: number; F: number
      J: number; P: number
    }
  }
) {
  const session = await verifySession()
  if (!session) throw new Error("Unauthorized")

  const typeDescription = descriptions[data.mbtiType as keyof typeof descriptions]
  if (!typeDescription) {
    throw new Error(`MBTI 유형 설명을 찾을 수 없어요: ${data.mbtiType}`)
  }

  const interpretation = `## ${typeDescription.name}

${typeDescription.summary}

### 주요 강점
${typeDescription.strengths.map((s) => `- ${s}`).join("\n")}

### 주의할 점
${typeDescription.weaknesses.map((w) => `- ${w}`).join("\n")}

### 학습 스타일
${typeDescription.learningStyle}

### 추천 직업
${typeDescription.careers.join(", ")}

### 대표 인물
${typeDescription.famousPeople.join(", ")}
`

  const scores = { e: 0, i: 0, s: 0, n: 0, t: 0, f: 0, j: 0, p: 0 }

  await upsertTeacherMbtiAnalysis(teacherId, {
    responses: {},
    scores,
    mbtiType: data.mbtiType,
    percentages: data.percentages,
    interpretation,
    version: 1,
    calculatedAt: new Date(),
  })

  revalidatePath(`/teachers/${teacherId}`)

  return {
    success: true,
    result: {
      mbtiType: data.mbtiType,
      percentages: data.percentages,
      interpretation,
    },
  }
}

/**
 * 선생님 MBTI LLM 해석
 */
export async function generateTeacherMbtiLLMInterpretation(
  teacherId: string,
  provider?: string,
  promptId?: string
) {
  const session = await verifySession()
  if (!session) throw new Error("Unauthorized")

  const analysis = await getTeacherMbtiAnalysis(teacherId)
  if (!analysis) {
    throw new Error("MBTI 분석 결과가 없습니다. 먼저 MBTI 유형을 입력해주세요.")
  }

  const percentages = analysis.percentages as Record<string, number>

  let prompt: string
  if (promptId && promptId !== 'default') {
    const mbtiPromptDef = getMbtiPrompt(promptId as MbtiPromptId)
    prompt = mbtiPromptDef
      ? mbtiPromptDef.buildPrompt(analysis.mbtiType, percentages)
      : MBTI_INTERPRETATION_PROMPT(analysis.mbtiType, percentages)
  } else {
    prompt = MBTI_INTERPRETATION_PROMPT(analysis.mbtiType, percentages)
  }

  const llmResult = (!provider || provider === 'auto')
    ? await generateWithProvider({
        featureType: 'mbti_analysis',
        prompt,
        teacherId: session.userId,
        maxOutputTokens: 2048,
      })
    : await generateWithSpecificProvider(provider as ProviderName, {
        featureType: 'mbti_analysis',
        prompt,
        teacherId: session.userId,
        maxOutputTokens: 2048,
      })

  await db.teacherMbtiAnalysis.update({
    where: { teacherId },
    data: { interpretation: llmResult.text },
  })

  revalidatePath(`/teachers/${teacherId}`)

  return { success: true, interpretation: llmResult.text }
}

/**
 * 선생님 이름풀이 LLM 해석
 */
export async function generateTeacherNameLLMInterpretation(
  teacherId: string,
  provider?: string,
  promptId?: string
) {
  const session = await verifySession()
  if (!session) throw new Error("Unauthorized")

  const analysis = await getTeacherNameAnalysis(teacherId)
  if (!analysis) {
    throw new Error("이름 분석 결과가 없습니다. 먼저 분석을 실행해주세요.")
  }

  const teacher = await db.teacher.findUnique({
    where: { id: teacherId },
    select: { name: true, nameHanja: true, birthDate: true },
  })

  if (!teacher) throw new Error("선생님을 찾을 수 없습니다.")

  const hanjaName = teacher.nameHanja
    ? (teacher.nameHanja as { full?: string })?.full ?? null
    : null

  const result = analysis.result as { hasHanja?: boolean; numerology?: unknown }
  const numerologyText = result.numerology ? analysis.interpretation ?? "" : ""

  let prompt: string
  const namePromptDef = promptId ? getNamePrompt(promptId as NamePromptId) : null
  if (namePromptDef) {
    prompt = namePromptDef.buildPrompt(teacher.name, {
      birthDate: teacher.birthDate?.toISOString().split("T")[0] ?? "",
      hanjaName: hanjaName ?? undefined,
      numerologyResult: numerologyText || undefined,
    })
  } else {
    const defaultPrompt = getNamePrompt("default")!
    prompt = defaultPrompt.buildPrompt(teacher.name, {
      birthDate: teacher.birthDate?.toISOString().split("T")[0] ?? "",
      hanjaName: hanjaName ?? undefined,
      numerologyResult: numerologyText || undefined,
    })
  }

  const llmResult = (!provider || provider === "auto")
    ? await generateWithProvider({
        featureType: "name_analysis",
        prompt,
        teacherId: session.userId,
        maxOutputTokens: 2048,
      })
    : await generateWithSpecificProvider(provider as ProviderName, {
        featureType: "name_analysis",
        prompt,
        teacherId: session.userId,
        maxOutputTokens: 2048,
      })

  await db.teacherNameAnalysis.update({
    where: { teacherId },
    data: { interpretation: llmResult.text },
  })

  revalidatePath(`/teachers/${teacherId}`)

  return { success: true, interpretation: llmResult.text }
}

/**
 * 선생님 사주 해석 쉽게 풀이 (텍스트 기반이므로 학생용과 동일한 함수 재사용)
 */
export async function simplifyTeacherInterpretation(
  interpretation: string,
  provider: string
): Promise<{ text: string; usedProvider: string; usedModel?: string }> {
  const { simplifyInterpretation } = await import("@/lib/actions/calculation-analysis")
  return simplifyInterpretation(interpretation, provider)
}
