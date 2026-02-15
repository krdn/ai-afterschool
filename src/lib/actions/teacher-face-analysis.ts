"use server"

import { revalidatePath } from "next/cache"
import { after } from "next/server"
import { generateWithVision, FailoverError } from "@/lib/ai/universal-router"
import { FACE_READING_PROMPT } from "@/lib/ai/prompts"
import { verifySession } from "@/lib/dal"
import { db } from "@/lib/db"
import { upsertTeacherFaceAnalysis } from "@/lib/db/teacher-face-analysis"
import { extractJsonFromLLM } from "@/lib/utils/extract-json"

/**
 * 선생님 관상 분석 실행 (통합 LLM 라우터 사용)
 *
 * Vision을 지원하는 제공자에서 자동 폴백됩니다.
 * (anthropic, openai, google 순)
 */
export async function runTeacherFaceAnalysis(teacherId: string, imageUrl: string) {
  const session = await verifySession()

  // 선생님 접근 권한 확인 (본인 또는 DIRECTOR만 가능)
  const teacher = await db.teacher.findFirst({
    where: {
      id: teacherId,
      OR: [
        { id: session.userId }, // 본인
        { id: teacherId } // DIRECTOR는 verifySession에서 확인됨
      ]
    }
  })

  if (!teacher && session.role !== 'DIRECTOR') {
    return { success: false, error: "선생님을 찾을 수 없어요." }
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

      // JSON 응답 파싱 (마크다운 코드블록 등 LLM 응답 형식 대응)
      const result = extractJsonFromLLM(response.text)

      // 폴백 발생 시 로깅
      if (response.wasFailover) {
        console.info(
          `[Teacher Face Analysis] Failover occurred: ${response.failoverFrom} -> ${response.provider}`
        )
      }

      // DB에 저장
      await upsertTeacherFaceAnalysis({
        teacherId,
        imageUrl,
        result,
        status: 'complete'
      })

      revalidatePath(`/teachers/${teacherId}`)

    } catch (error) {
      console.error('Teacher face analysis error:', error)

      // FailoverError인 경우 상세 로깅
      if (error instanceof FailoverError) {
        console.error(
          `[Teacher Face Analysis] All providers failed (${error.totalAttempts} attempts):`,
          error.errors.map(e => `${e.provider}: ${e.error.message}`).join('; ')
        )
      }

      // 에러 상태 저장
      await upsertTeacherFaceAnalysis({
        teacherId,
        imageUrl,
        result: null,
        status: 'failed',
        errorMessage: error instanceof FailoverError
          ? error.userMessage
          : error instanceof Error ? error.message : '알 수 없는 에러'
      })

      revalidatePath(`/teachers/${teacherId}`)
    }
  })

  return {
    success: true,
    message: "분석을 시작했어요. 잠시 후 결과가 표시됩니다."
  }
}

/**
 * 선생님 관상 분석 결과 조회
 */
export async function getTeacherFaceAnalysisAction(teacherId: string) {
  const session = await verifySession()

  const analysis = await db.teacherFaceAnalysis.findUnique({
    where: { teacherId },
    include: {
      teacher: {
        select: { id: true }
      }
    }
  })

  // 본인 또는 DIRECTOR만 조회 가능
  if (!analysis || (analysis.teacherId !== session.userId && session.role !== 'DIRECTOR')) {
    return null
  }

  return analysis
}
