"use server"

import { revalidatePath } from "next/cache"
import { after } from "next/server"
import { anthropic } from "@/lib/ai/claude"
import { FACE_READING_PROMPT, PALM_READING_PROMPT } from "@/lib/ai/prompts"
import { verifySession } from "@/lib/dal"
import { db } from "@/lib/db"
import { upsertFaceAnalysis } from "@/lib/db/face-analysis"
import { upsertPalmAnalysis } from "@/lib/db/palm-analysis"

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
      await upsertFaceAnalysis({
        studentId,
        imageUrl,
        result,
        status: 'complete'
      })

      revalidatePath(`/students/${studentId}`)

    } catch (error) {
      console.error('Face analysis error:', error)

      // 에러 상태 저장
      await upsertFaceAnalysis({
        studentId,
        imageUrl,
        result: null,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : '알 수 없는 에러'
      })

      revalidatePath(`/students/${studentId}`)
    }
  })

  return {
    success: true,
    message: "분석을 시작했어요. 잠시 후 결과가 표시됩니다."
  }
}

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

      const content = response.content[0]
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude')
      }

      const result = JSON.parse(content.text)

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

      await upsertPalmAnalysis({
        studentId,
        hand,
        imageUrl,
        result: null,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : '알 수 없는 에러'
      })

      revalidatePath(`/students/${studentId}`)
    }
  })

  return {
    success: true,
    message: "분석을 시작했어요. 잠시 후 결과가 표시됩니다."
  }
}

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
