"use server"

import { revalidatePath } from "next/cache"
import { after } from "next/server"
import { generateWithVision, FailoverError } from "@/lib/ai/router"
import { FACE_READING_PROMPT, PALM_READING_PROMPT } from "@/lib/ai/prompts"
import { verifySession } from "@/lib/dal"
import { db } from "@/lib/db"
import { upsertFaceAnalysis } from "@/lib/db/face-analysis"
import { upsertPalmAnalysis } from "@/lib/db/palm-analysis"

/**
 * 학생 관상 분석 (통합 LLM 라우터 사용)
 *
 * Vision을 지원하는 제공자에서 자동 폴백됩니다.
 * (anthropic, openai, google 순)
 */
export async function analyzeFaceImage(studentId: string, imageUrl: string) {
  const session = await verifySession()

  // 학생 접근 권한 확인
  const student = await db.student.findFirst({
    where: { id: studentId, teacherId: session.userId }
  })

  if (!student) {
    return { success: false, error: "학생을 찾을 수 없어요." }
  }

  // 즉시 응답하고 백그라운드에서 분석 실행
  after(async () => {
    try {
      // Cloudinary에서 이미지 다운로드
      const imageResponse = await fetch(imageUrl)
      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())
      const base64Image = imageBuffer.toString('base64')

      // 통합 라우터를 통한 Vision API 호출 (자동 폴백)
      const response = await generateWithVision({
        featureType: 'face_analysis',
        teacherId: session.userId,
        imageBase64: base64Image,
        mimeType: 'image/jpeg',
        prompt: FACE_READING_PROMPT,
        maxOutputTokens: 2048,
      })

      // JSON 응답 파싱
      const result = JSON.parse(response.text)

      // 폴백 발생 시 로깅
      if (response.wasFailover) {
        console.info(
          `[Face Analysis] Failover occurred: ${response.failoverFrom} -> ${response.provider}`
        )
      }

      // DB에 저장
      await upsertFaceAnalysis({
        studentId,
        imageUrl,
        result,
        status: 'complete'
      })

      revalidatePath(`/students/${studentId}`)

    } catch (error) {
      console.error('Face analysis error:', error)

      // FailoverError인 경우 상세 로깅
      if (error instanceof FailoverError) {
        console.error(
          `[Face Analysis] All providers failed (${error.totalAttempts} attempts):`,
          error.errors.map(e => `${e.provider}: ${e.error.message}`).join('; ')
        )
      }

      // 에러 상태 저장
      await upsertFaceAnalysis({
        studentId,
        imageUrl,
        result: null,
        status: 'failed',
        errorMessage: error instanceof FailoverError
          ? error.userMessage
          : error instanceof Error ? error.message : '알 수 없는 에러'
      })

      revalidatePath(`/students/${studentId}`)
    }
  })

  return {
    success: true,
    message: "분석을 시작했어요. 잠시 후 결과가 표시됩니다."
  }
}

/**
 * 학생 손금 분석 (통합 LLM 라우터 사용)
 *
 * Vision을 지원하는 제공자에서 자동 폴백됩니다.
 */
export async function analyzePalmImage(
  studentId: string,
  imageUrl: string,
  hand: 'left' | 'right'
) {
  const session = await verifySession()

  const student = await db.student.findFirst({
    where: { id: studentId, teacherId: session.userId }
  })

  if (!student) {
    return { success: false, error: "학생을 찾을 수 없어요." }
  }

  after(async () => {
    try {
      const imageResponse = await fetch(imageUrl)
      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())
      const base64Image = imageBuffer.toString('base64')

      // 통합 라우터를 통한 Vision API 호출 (자동 폴백)
      const response = await generateWithVision({
        featureType: 'palm_analysis',
        teacherId: session.userId,
        imageBase64: base64Image,
        mimeType: 'image/jpeg',
        prompt: PALM_READING_PROMPT,
        maxOutputTokens: 2048,
      })

      const result = JSON.parse(response.text)

      // 폴백 발생 시 로깅
      if (response.wasFailover) {
        console.info(
          `[Palm Analysis] Failover occurred: ${response.failoverFrom} -> ${response.provider}`
        )
      }

      await upsertPalmAnalysis({
        studentId,
        hand,
        imageUrl,
        result,
        status: 'complete'
      })

      revalidatePath(`/students/${studentId}`)

    } catch (error) {
      console.error('Palm analysis error:', error)

      // FailoverError인 경우 상세 로깅
      if (error instanceof FailoverError) {
        console.error(
          `[Palm Analysis] All providers failed (${error.totalAttempts} attempts):`,
          error.errors.map(e => `${e.provider}: ${e.error.message}`).join('; ')
        )
      }

      await upsertPalmAnalysis({
        studentId,
        hand,
        imageUrl,
        result: null,
        status: 'failed',
        errorMessage: error instanceof FailoverError
          ? error.userMessage
          : error instanceof Error ? error.message : '알 수 없는 에러'
      })

      revalidatePath(`/students/${studentId}`)
    }
  })

  return {
    success: true,
    message: "분석을 시작했어요. 잠시 후 결과가 표시됩니다."
  }
}

/**
 * 학생 관상 분석 결과 조회
 */
export async function getFaceAnalysis(studentId: string) {
  const session = await verifySession()

  const analysis = await db.faceAnalysis.findUnique({
    where: { studentId },
    include: {
      student: {
        select: { teacherId: true }
      }
    }
  })

  if (!analysis || analysis.student.teacherId !== session.userId) {
    return null
  }

  return analysis
}

/**
 * 학생 손금 분석 결과 조회
 */
export async function getPalmAnalysis(studentId: string) {
  const session = await verifySession()

  const analysis = await db.palmAnalysis.findUnique({
    where: { studentId },
    include: {
      student: {
        select: { teacherId: true }
      }
    }
  })

  if (!analysis || analysis.student.teacherId !== session.userId) {
    return null
  }

  return analysis
}
