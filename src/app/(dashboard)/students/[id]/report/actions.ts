'use server'

import React from 'react'
import type { DocumentProps } from '@react-pdf/renderer'
import { after } from 'next/server'
import { verifySession } from '@/lib/dal'
import { db } from '@/lib/db'
import {
  getStudentReportPDF,
  shouldRegeneratePDF,
  markPDFGenerating,
  markPDFComplete,
  markPDFFailed,
} from '@/lib/db/reports'
import { getPersonalitySummary } from '@/lib/db/personality-summary'
import { ConsultationReport } from '@/lib/pdf/templates/consultation-report'
import { pdfToFile, generateReportFilename, getPdfStoragePath } from '@/lib/pdf/generator'
import path from 'path'
import { revalidatePath } from 'next/cache'

/**
 * Generate consultation report PDF asynchronously
 * Follows Phase 6's after() pattern for non-blocking generation
 */
export async function generateConsultationReport(studentId: string) {
  // 1. Teacher authentication
  const session = await verifySession()
  if (!session?.userId) {
    return { success: false, error: '인증되지 않았습니다.' }
  }

  // 2. Verify student ownership
  const student = await db.student.findFirst({
    where: {
      id: studentId,
      teacherId: session.userId,
    },
  })

  if (!student) {
    return { success: false, error: '학생을 찾을 수 없습니다.' }
  }

  // 3. Check if already generating (prevent duplicate)
  const existingReport = await getStudentReportPDF(studentId)
  if (existingReport?.status === 'generating') {
    return { success: false, error: '이미 생성 중입니다.' }
  }

  // 4. Get current data version for cache invalidation
  const summary = await getPersonalitySummary(studentId)
  const currentDataVersion = summary?.version || 1

  // 5. Check if regeneration is needed
  const needsRegeneration = await shouldRegeneratePDF(
    studentId,
    currentDataVersion
  )

  if (!needsRegeneration && existingReport?.status === 'complete') {
    return {
      success: true,
      message: '이미 최신 보고서가 있습니다.',
      cached: true,
      fileUrl: existingReport.fileUrl,
    }
  }

  // 6. Mark as generating
  await markPDFGenerating(studentId)

  // 7. Generate PDF in background using after() pattern
  after(async () => {
    try {
      // Fetch all data needed for report
      const reportData = await fetchReportData(studentId, session.userId)
      if (!reportData) {
        throw new Error('보고서 데이터를 가져올 수 없습니다.')
      }

      // Generate PDF file
      const filename = generateReportFilename(
        studentId,
        student.name,
        Date.now()
      )
      const storagePath = getPdfStoragePath()
      const filepath = path.join(storagePath, filename)

      await pdfToFile(React.createElement(ConsultationReport, reportData) as React.ReactElement<DocumentProps>, filepath)

      // Mark as complete
      const relativeUrl = `/reports/${filename}`
      await markPDFComplete(studentId, relativeUrl, currentDataVersion)

      // Revalidate path to refresh UI
      revalidatePath(`/students/${studentId}`)
    } catch (error) {
      // Mark as failed
      await markPDFFailed(
        studentId,
        error instanceof Error ? error.message : '알 수 없는 오류'
      )

      // Revalidate path to show error state
      revalidatePath(`/students/${studentId}`)
    }
  })

  return {
    success: true,
    message: 'PDF 생성을 시작했습니다. 완료되면 알림을 드릴게요.',
    cached: false,
  }
}

/**
 * Get PDF generation status
 */
export async function getReportStatus(studentId: string) {
  const session = await verifySession()
  if (!session?.userId) {
    return { error: '인증되지 않았습니다.' }
  }

  const report = await getStudentReportPDF(studentId)

  return {
    status: report?.status || 'none',
    fileUrl: report?.fileUrl || null,
    errorMessage: report?.errorMessage || null,
    generatedAt: report?.generatedAt || null,
  }
}

/**
 * Fetch all data needed for consultation report
 */
async function fetchReportData(studentId: string, teacherId: string) {
  const student = await db.student.findFirst({
    where: {
      id: studentId,
      teacherId,
    },
    include: {
      images: true,
      sajuAnalysis: true,
      nameAnalysis: true,
      mbtiAnalysis: true,
      faceAnalysis: true,
      palmAnalysis: true,
      personalitySummary: true,
    },
  })

  if (!student) return null

  return {
    student: {
      name: student.name,
      birthDate: student.birthDate,
      school: student.school,
      grade: student.grade,
      targetUniversity: student.targetUniversity,
      targetMajor: student.targetMajor,
      bloodType: student.bloodType,
    },
    analyses: {
      saju: student.sajuAnalysis
        ? {
            result: student.sajuAnalysis.result,
            interpretation: student.sajuAnalysis.interpretation,
            calculatedAt: student.sajuAnalysis.calculatedAt,
          }
        : null,
      name: student.nameAnalysis
        ? {
            result: student.nameAnalysis.result,
            interpretation: student.nameAnalysis.interpretation,
            calculatedAt: student.nameAnalysis.calculatedAt,
          }
        : null,
      mbti: student.mbtiAnalysis
        ? {
            mbtiType: student.mbtiAnalysis.mbtiType,
            percentages: student.mbtiAnalysis.percentages as Record<string, number>,
            calculatedAt: student.mbtiAnalysis.calculatedAt,
          }
        : null,
      face: student.faceAnalysis
        ? {
            result: student.faceAnalysis.result,
            status: student.faceAnalysis.status,
            errorMessage: student.faceAnalysis.errorMessage,
          }
        : null,
      palm: student.palmAnalysis
        ? {
            result: student.palmAnalysis.result,
            status: student.palmAnalysis.status,
            errorMessage: student.palmAnalysis.errorMessage,
          }
        : null,
    },
    personalitySummary: student.personalitySummary
      ? {
          coreTraits: student.personalitySummary.coreTraits,
          learningStrategy: student.personalitySummary.learningStrategy,
          careerGuidance: student.personalitySummary.careerGuidance,
          status: student.personalitySummary.status,
        }
      : null,
    generatedAt: new Date(),
  }
}
