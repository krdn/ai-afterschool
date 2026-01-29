import React from 'react'
import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/dal'
import { db } from '@/lib/db'
import { getStudentReportPDF } from '@/lib/db/reports'
import { ConsultationReport } from '@/lib/pdf/templates/consultation-report'
import { pdfToBuffer } from '@/lib/pdf/generator'
import { readFile } from 'fs/promises'
import path from 'path'

/**
 * GET /api/students/[id]/report
 * Stream PDF as response (use existing or generate on-demand)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params

    // 1. Authentication
    const session = await verifySession()
    if (!session?.userId) {
      return NextResponse.json(
        { error: '인증되지 않았습니다.' },
        { status: 401 }
      )
    }

    // 2. Verify student ownership
    const student = await db.student.findFirst({
      where: {
        id: studentId,
        teacherId: session.userId,
      },
    })

    if (!student) {
      return NextResponse.json(
        { error: '학생을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 3. Check for cached PDF
    const report = await getStudentReportPDF(studentId)

    if (report?.status === 'complete' && report.fileUrl) {
      // Serve cached PDF
      const storagePath = process.env.PDF_STORAGE_PATH || './public/reports'
      const filename = path.basename(report.fileUrl)
      const filepath = path.join(storagePath, filename)

      try {
        const pdfBuffer = await readFile(filepath)

        return new NextResponse(pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="report-${student.name}.pdf"`,
            'Content-Length': pdfBuffer.length.toString(),
            'Cache-Control': 'public, max-age=3600',
          },
        })
      } catch (fileError) {
        // File doesn't exist, regenerate
        console.error('Cached PDF file missing:', fileError)
      }
    }

    // 4. Generate PDF on-demand (synchronous for API response)
    const reportData = await fetchReportData(studentId, session.userId)
    if (!reportData) {
      return NextResponse.json(
        { error: '보고서 데이터를 가져올 수 없습니다.' },
        { status: 500 }
      )
    }

    // Render PDF to buffer
    const pdfBuffer = await pdfToBuffer(
      React.createElement(ConsultationReport, reportData) as React.ReactElement
    )

    // Return PDF
    return new NextResponse(Buffer.from(pdfBuffer) as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="report-${student.name}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-cache', // Don't cache on-demand generation
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'PDF 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * Fetch all data needed for consultation report (duplicate from actions.ts)
 * TODO: Extract to shared function in lib/db/reports.ts to avoid duplication
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
