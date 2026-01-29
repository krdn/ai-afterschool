"use server"

import { revalidatePath } from "next/cache"
import { after } from "next/server"
import { anthropic } from "@/lib/ai/claude"
import { buildLearningStrategyPrompt, buildCareerGuidancePrompt } from "@/lib/ai/integration-prompts"
import { verifySession } from "@/lib/dal"
import { db } from "@/lib/db"
import { getUnifiedPersonalityData, upsertPersonalitySummary } from "@/lib/db/personality-summary"
import { LearningStrategySchema, CareerGuidanceSchema } from "@/lib/validations/personality"

/**
 * 학습 전략 AI 생성 Server Action
 * 통합 성향 데이터를 기반으로 맞춤형 학습 전략을 생성
 */
export async function generateLearningStrategy(studentId: string) {
  const session = await verifySession()

  // 학생 접근 권한 확인
  const student = await db.student.findFirst({
    where: { id: studentId, teacherId: session.userId }
  })

  if (!student) {
    return { success: false, error: "학생을 찾을 수 없어요." }
  }

  // 기존 진행 중인 생성 확인
  const existing = await getPersonalitySummaryWithAuth(studentId, session.userId)
  if (existing?.status === 'pending') {
    return { success: false, error: "이미 생성 중입니다." }
  }

  // 최소 3개 분석 확인
  const unifiedData = await getUnifiedPersonalityData(studentId, session.userId)
  if (!unifiedData) {
    return { success: false, error: "분석 데이터를 찾을 수 없어요." }
  }

  const availableCount = [
    unifiedData.saju.result,
    unifiedData.name.result,
    unifiedData.mbti.result,
    unifiedData.face.result,
    unifiedData.palm.result,
  ].filter(Boolean).length

  if (availableCount < 3) {
    return { success: false, error: "최소 3개 이상의 분석이 필요해요." }
  }

  // pending 상태로 저장
  await upsertPersonalitySummary({
    studentId,
    learningStrategy: null,
    careerGuidance: existing?.careerGuidance ?? null,
    status: 'pending',
    generatedAt: new Date()
  })

  // 비동기 AI 생성
  after(async () => {
    try {
      const prompt = buildLearningStrategyPrompt(unifiedData, {
        name: student.name,
        grade: student.grade,
        targetMajor: student.targetMajor
      })

      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 3000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })

      const content = response.content[0]
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude')
      }

      const result = JSON.parse(content.text)

      // Zod 스키마 검증
      const validatedResult = LearningStrategySchema.parse(result)

      // 결과 저장
      await upsertPersonalitySummary({
        studentId,
        coreTraits: validatedResult.coreTraits,
        learningStrategy: validatedResult,
        careerGuidance: existing?.careerGuidance ?? null,
        status: 'complete',
        generatedAt: new Date()
      })

      revalidatePath(`/students/${studentId}`)

    } catch (error) {
      console.error('Learning strategy generation error:', error)

      await upsertPersonalitySummary({
        studentId,
        learningStrategy: null,
        careerGuidance: existing?.careerGuidance ?? null,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : '알 수 없는 에러'
      })

      revalidatePath(`/students/${studentId}`)
    }
  })

  return {
    success: true,
    message: "학습 전략을 생성 중이에요. 잠시 후 결과가 표시됩니다."
  }
}

/**
 * 진로 가이드 AI 생성 Server Action
 * 통합 성향 데이터를 기반으로 맞춤형 진로 가이드를 생성
 */
export async function generateCareerGuidance(studentId: string) {
  const session = await verifySession()

  // 학생 접근 권한 확인
  const student = await db.student.findFirst({
    where: { id: studentId, teacherId: session.userId }
  })

  if (!student) {
    return { success: false, error: "학생을 찾을 수 없어요." }
  }

  // 기존 진행 중인 생성 확인
  const existing = await getPersonalitySummaryWithAuth(studentId, session.userId)
  if (existing?.status === 'pending') {
    return { success: false, error: "이미 생성 중입니다." }
  }

  // 최소 3개 분석 확인
  const unifiedData = await getUnifiedPersonalityData(studentId, session.userId)
  if (!unifiedData) {
    return { success: false, error: "분석 데이터를 찾을 수 없어요." }
  }

  const availableCount = [
    unifiedData.saju.result,
    unifiedData.name.result,
    unifiedData.mbti.result,
    unifiedData.face.result,
    unifiedData.palm.result,
  ].filter(Boolean).length

  if (availableCount < 3) {
    return { success: false, error: "최소 3개 이상의 분석이 필요해요." }
  }

  // pending 상태로 저장
  await upsertPersonalitySummary({
    studentId,
    learningStrategy: existing?.learningStrategy ?? null,
    careerGuidance: null,
    status: 'pending',
    generatedAt: new Date()
  })

  // 비동기 AI 생성
  after(async () => {
    try {
      const prompt = buildCareerGuidancePrompt(unifiedData, {
        name: student.name,
        grade: student.grade,
        targetMajor: student.targetMajor
      })

      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 3000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })

      const content = response.content[0]
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude')
      }

      const result = JSON.parse(content.text)

      // Zod 스키마 검증
      const validatedResult = CareerGuidanceSchema.parse(result)

      // 결과 저장
      await upsertPersonalitySummary({
        studentId,
        coreTraits: validatedResult.coreTraits,
        learningStrategy: existing?.learningStrategy ?? null,
        careerGuidance: validatedResult,
        status: 'complete',
        generatedAt: new Date()
      })

      revalidatePath(`/students/${studentId}`)

    } catch (error) {
      console.error('Career guidance generation error:', error)

      await upsertPersonalitySummary({
        studentId,
        learningStrategy: existing?.learningStrategy ?? null,
        careerGuidance: null,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : '알 수 없는 에러'
      })

      revalidatePath(`/students/${studentId}`)
    }
  })

  return {
    success: true,
    message: "진로 가이드를 생성 중이에요. 잠시 후 결과가 표시됩니다."
  }
}

/**
 * 인증이 포함된 PersonalitySummary 조회 헬퍼 함수
 */
async function getPersonalitySummaryWithAuth(studentId: string, teacherId: string) {
  const summary = await db.personalitySummary.findUnique({
    where: { studentId },
    include: {
      student: {
        select: { teacherId: true }
      }
    }
  })

  if (!summary || summary.student.teacherId !== teacherId) {
    return null
  }

  return summary
}
