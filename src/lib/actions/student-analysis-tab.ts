'use server'

import { db } from "@/lib/db"
import { getFaceAnalysisByStudentId } from "@/lib/db/face-analysis"
import { getPalmAnalysisByStudentId } from "@/lib/db/palm-analysis"
import { getMbtiAnalysis } from "@/lib/db/mbti-analysis"

export type StudentAnalysisData = {
  student: {
    id: string
    name: string
    birthDate: Date | string
    birthTimeHour: number | null
    birthTimeMinute: number | null
    sajuAnalysis: {
      result: unknown
      interpretation: string | null
      calculatedAt: Date | string
    } | null
    images: Array<{
      type: string
      originalUrl: string
      resizedUrl: string
    }> | null
  } | null
  faceAnalysis: {
    id: string
    status: string
    result: unknown
    imageUrl: string
    errorMessage: string | null
  } | null
  palmAnalysis: {
    id: string
    status: string
    result: unknown
    imageUrl: string
    hand: string
    errorMessage: string | null
  } | null
  mbtiAnalysis: {
    mbtiType: string
    percentages: Record<string, number>
    calculatedAt: Date
  } | null
}

export async function getStudentAnalysisData(studentId: string): Promise<StudentAnalysisData> {
  try {
    // Fetch student data
    const student = await db.student.findUnique({
      where: { id: studentId },
      include: {
        sajuAnalysis: true,
        images: true
      }
    })

    if (!student) {
      return {
        student: null,
        faceAnalysis: null,
        palmAnalysis: null,
        mbtiAnalysis: null
      }
    }

    // Fetch face analysis
    const faceAnalysis = await getFaceAnalysisByStudentId(studentId)

    // Fetch palm analysis
    const palmAnalysis = await getPalmAnalysisByStudentId(studentId)

    // Fetch MBTI analysis
    const mbtiAnalysis = await getMbtiAnalysis(studentId)

    return {
      student: {
        id: student.id,
        name: student.name,
        birthDate: student.birthDate,
        birthTimeHour: student.birthTimeHour,
        birthTimeMinute: student.birthTimeMinute,
        sajuAnalysis: student.sajuAnalysis,
        images: student.images
      },
      faceAnalysis,
      palmAnalysis,
      mbtiAnalysis: mbtiAnalysis ? {
        mbtiType: mbtiAnalysis.mbtiType,
        percentages: mbtiAnalysis.percentages as Record<string, number>,
        calculatedAt: mbtiAnalysis.calculatedAt
      } : null
    }
  } catch (error) {
    console.error("Failed to load analysis data:", error)
    return {
      student: null,
      faceAnalysis: null,
      palmAnalysis: null,
      mbtiAnalysis: null
    }
  }
}
