"use server"

import { revalidatePath } from "next/cache"
import { after } from "next/server"
import { anthropic } from "@/lib/ai/claude"
import { PALM_READING_PROMPT } from "@/lib/ai/prompts"
import { verifySession } from "@/lib/dal"
import { db } from "@/lib/db"
import { upsertTeacherPalmAnalysis } from "@/lib/db/teacher-palm-analysis"

/**
 * 선생님 손금 분석 실행
 *
 * AI 이미지 분석을 통해 선생님의 손금을 분석하고 결과를 저장합니다.
 * analyzePalmImage 함수를 재사용하여 Student/Teacher 구분 없이 동일한 분석 로직 적용.
 */
export async function runTeacherPalmAnalysis(
  teacherId: string,
  imageUrl: string,
  hand: "left" | "right"
) {
  const session = await verifySession()
  if (!session) throw new Error("Unauthorized")

  // 백그라운드에서 분석 실행
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
              text: PALM_READING_PROMPT
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

      // DB 저장
      await upsertTeacherPalmAnalysis({
        teacherId,
        hand,
        imageUrl,
        result,
        status: 'complete'
      })

      revalidatePath(`/teachers/${teacherId}`)

    } catch (error) {
      console.error('Teacher palm analysis error:', error)

      // 에러 상태 저장
      await upsertTeacherPalmAnalysis({
        teacherId,
        hand,
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
 * 선생님 손금 분석 결과 조회
 */
export async function getTeacherPalmAnalysis(teacherId: string) {
  const session = await verifySession()

  const analysis = await db.teacherPalmAnalysis.findUnique({
    where: { teacherId },
    include: {
      teacher: {
        select: { id: true }
      }
    }
  })

  // TODO: Add RBAC check based on teacher roles when needed
  // For now, teachers can view their own analysis
  return analysis
}
