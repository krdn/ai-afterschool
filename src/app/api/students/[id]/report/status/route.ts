import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/dal'
import { getStudentReportPDF } from '@/lib/db/reports'

/**
 * GET /api/students/[id]/report/status
 * Return PDF generation status for polling
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params

    // Authentication
    const session = await verifySession()
    if (!session?.userId) {
      return NextResponse.json(
        { error: '인증되지 않았습니다.' },
        { status: 401 }
      )
    }

    // Get report status
    const report = await getStudentReportPDF(studentId)

    return NextResponse.json({
      status: report?.status || 'none',
      fileUrl: report?.fileUrl || null,
      errorMessage: report?.errorMessage || null,
      generatedAt: report?.generatedAt || null,
    })
  } catch (error) {
    console.error('Status check error:', error)
    return NextResponse.json(
      { error: '상태 조회 실패' },
      { status: 500 }
    )
  }
}
