"use server"

import { revalidatePath } from "next/cache"
import { after } from "next/server"
import { anthropic } from "@/lib/ai/claude"
import { FACE_READING_PROMPT } from "@/lib/ai/prompts"
import { verifySession } from "@/lib/dal"
import { db } from "@/lib/db"
import { upsertTeacherFaceAnalysis } from "@/lib/db/teacher-face-analysis"

/**
 * 선생님 관상 분석 실행 (AI 이미지 분석)
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

      // Claude Vision API 호출
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64Image
              }
            },
            {
              type: 'text',
              text: FACE_READING_PROMPT
            }
          ]
        }]
      })

      // JSON 응답 파싱
      const content = response.content[0]
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude')
      }

      const result = JSON.parse(content.text)

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

      // 에러 상태 저장
      await upsertTeacherFaceAnalysis({
        teacherId,
        imageUrl,
        result: null,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : '알 수 없는 에러'
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
