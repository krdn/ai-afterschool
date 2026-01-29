"use server"

import { revalidatePath } from "next/cache"
import { after } from "next/server"
import { verifySession } from "@/lib/dal"
import { db } from "@/lib/db"
import {
  getUnifiedPersonalityData,
  getPersonalitySummary,
  upsertPersonalitySummary,
} from "@/lib/db/personality-summary"
import { anthropic } from "@/lib/ai/claude"
import { buildLearningStrategyPrompt, buildCareerGuidancePrompt } from "@/lib/ai/integration-prompts"
import { LearningStrategySchema, CareerGuidanceSchema } from "@/lib/validations/personality"

/**
 * AI 기반 학습 전략 생성 Server Action
 * 최소 3개 이상의 분석이 완료된 경우에만 실행 가능
 *
 * @param studentId - 학생 ID
 * @returns 성공/실패 메시지
 */
export async function generateLearningStrategy(studentId: string) {
  // 1. 교사 인증
  const session = await verifySession()
  if (!session?.userId) {
    return { success: false, error: "인증되지 않았습니다." }
  }

  // 2. 학생 소속 검증
  const student = await db.student.findFirst({
    where: {
      id: studentId,
      teacherId: session.userId,
    },
  })

  if (!student) {
    return { success: false, error: "학생을 찾을 수 없습니다." }
  }

  // 3. 통합 데이터 조회
  const data = await getUnifiedPersonalityData(studentId, session.userId)
  if (!data) {
    return { success: false, error: "성향 데이터를 찾을 수 없습니다." }
  }

  // 4. 최소 3개 분석 확인
  const availableCount = [
    data.saju.calculatedAt,
    data.name.calculatedAt,
    data.mbti.calculatedAt,
    data.face.analyzedAt,
    data.palm.analyzedAt,
  ].filter(Boolean).length

  if (availableCount < 3) {
    return { success: false, error: "최소 3개 이상의 분석이 필요합니다." }
  }

  // 5. 기존 생성 중인 작업 확인
  const existing = await getPersonalitySummary(studentId)

  if (existing?.status === "pending") {
    return { success: false, error: "이미 생성 중입니다." }
  }

  // 6. pending 상태로 저장
  await upsertPersonalitySummary({
    studentId,
    status: "pending",
    coreTraits: null,
    learningStrategy: null,
    careerGuidance: null,
  })

  // 7. 비동기 AI 호출
  after(async () => {
    try {
      // 프롬프트 생성
      const prompt = buildLearningStrategyPrompt(data, {
        name: student.name,
        grade: student.grade,
        targetMajor: student.targetMajor,
      })

      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 3000,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      })

      // 응답 텍스트 추출
      const content = response.content[0]
      if (content.type !== "text") {
        throw new Error("Unexpected response type from Claude")
      }

      // JSON 파싱
      const result = JSON.parse(content.text)

      // Zod 스키마 검증
      const validatedResult = LearningStrategySchema.parse(result)

      // 8. 결과 저장
      await upsertPersonalitySummary({
        studentId,
        status: "complete",
        coreTraits: validatedResult.coreTraits,
        learningStrategy: validatedResult as any,
        careerGuidance: null,
      })

      // 9. 페이지 갱신
      revalidatePath(`/students/${studentId}`)
    } catch (error) {
      console.error("Failed to generate learning strategy:", error)

      // 에러 저장
      await upsertPersonalitySummary({
        studentId,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "알 수 없는 오류",
      })

      revalidatePath(`/students/${studentId}`)
    }
  })

  return {
    success: true,
    message: "AI 분석을 시작했습니다. 완료되면 자동으로 표시됩니다.",
  }
}

/**
 * AI 기반 진로 가이드 생성 Server Action
 * 최소 3개 이상의 분석이 완료된 경우에만 실행 가능
 *
 * @param studentId - 학생 ID
 * @returns 성공/실패 메시지
 */
export async function generateCareerGuidance(studentId: string) {
  // 1. 교사 인증
  const session = await verifySession()
  if (!session?.userId) {
    return { success: false, error: "인증되지 않았습니다." }
  }

  // 2. 학생 소속 검증
  const student = await db.student.findFirst({
    where: {
      id: studentId,
      teacherId: session.userId,
    },
  })

  if (!student) {
    return { success: false, error: "학생을 찾을 수 없습니다." }
  }

  // 3. 통합 데이터 조회
  const data = await getUnifiedPersonalityData(studentId, session.userId)
  if (!data) {
    return { success: false, error: "성향 데이터를 찾을 수 없습니다." }
  }

  // 4. 최소 3개 분석 확인
  const availableCount = [
    data.saju.calculatedAt,
    data.name.calculatedAt,
    data.mbti.calculatedAt,
    data.face.analyzedAt,
    data.palm.analyzedAt,
  ].filter(Boolean).length

  if (availableCount < 3) {
    return { success: false, error: "최소 3개 이상의 분석이 필요합니다." }
  }

  // 5. 기존 생성 중인 작업 확인
  const existing = await getPersonalitySummary(studentId)

  if (existing?.status === "pending") {
    return { success: false, error: "이미 생성 중입니다." }
  }

  // 6. pending 상태로 저장
  await upsertPersonalitySummary({
    studentId,
    status: "pending",
  })

  // 7. 비동기 AI 호출
  after(async () => {
    try {
      // 프롬프트 생성
      const prompt = buildCareerGuidancePrompt(data, {
        name: student.name,
        grade: student.grade,
        targetMajor: student.targetMajor,
      })

      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 3000,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      })

      // 응답 텍스트 추출
      const content = response.content[0]
      if (content.type !== "text") {
        throw new Error("Unexpected response type from Claude")
      }

      // JSON 파싱
      const result = JSON.parse(content.text)

      // Zod 스키마 검증
      const validatedResult = CareerGuidanceSchema.parse(result)

      // 8. 결과 저장
      await upsertPersonalitySummary({
        studentId,
        status: "complete",
        coreTraits: validatedResult.coreTraits,
        learningStrategy: null,
        careerGuidance: validatedResult as any,
      })

      // 9. 페이지 갱신
      revalidatePath(`/students/${studentId}`)
    } catch (error) {
      console.error("Failed to generate career guidance:", error)

      // 에러 저장
      await upsertPersonalitySummary({
        studentId,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "알 수 없는 오류",
      })

      revalidatePath(`/students/${studentId}`)
    }
  })

  return {
    success: true,
    message: "AI 분석을 시작했습니다. 완료되면 자동으로 표시됩니다.",
  }
}

/**
 * 학생의 AI 통합 분석 요약 조회
 *
 * @param studentId - 학생 ID
 * @returns PersonalitySummary 또는 null
 */
export async function getPersonalitySummaryAction(studentId: string) {
  const session = await verifySession()

  // 학생 소속 검증
  const student = await db.student.findFirst({
    where: { id: studentId, teacherId: session.userId }
  })

  if (!student) {
    return null
  }

  return getPersonalitySummary(studentId)
}
