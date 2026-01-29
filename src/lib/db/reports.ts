import { db } from '@/lib/db'

/**
 * Get cached PDF for student (if exists and data version matches)
 */
export async function getStudentReportPDF(studentId: string) {
  return await db.reportPDF.findUnique({
    where: { studentId },
  })
}

/**
 * Check if PDF needs regeneration (data version mismatch or stale status)
 */
export async function shouldRegeneratePDF(
  studentId: string,
  currentDataVersion: number
): Promise<boolean> {
  const report = await getStudentReportPDF(studentId)

  // No PDF exists
  if (!report) return true

  // PDF generation failed - should retry
  if (report.status === 'failed') return true

  // PDF is marked as stale
  if (report.status === 'stale') return true

  // Data version changed (PersonalitySummary updated)
  if (report.dataVersion !== currentDataVersion) return true

  // PDF is current
  return false
}

/**
 * Save or update PDF record with status
 */
export async function saveReportPDF(params: {
  studentId: string
  status: 'generating' | 'complete' | 'failed' | 'stale'
  fileUrl?: string
  dataVersion?: number
  errorMessage?: string
  generatedAt?: Date
}) {
  const { studentId, status, fileUrl, dataVersion, errorMessage, generatedAt } = params

  return await db.reportPDF.upsert({
    where: { studentId },
    create: {
      studentId,
      status,
      fileUrl,
      dataVersion,
      errorMessage,
      generatedAt,
    },
    update: {
      status,
      fileUrl,
      dataVersion,
      errorMessage,
      generatedAt,
      updatedAt: new Date(),
    },
  })
}

/**
 * Mark PDF as generating (prevent duplicate generation)
 */
export async function markPDFGenerating(studentId: string) {
  return await saveReportPDF({
    studentId,
    status: 'generating',
  })
}

/**
 * Mark PDF as complete with file URL
 */
export async function markPDFComplete(
  studentId: string,
  fileUrl: string,
  dataVersion: number
) {
  return await saveReportPDF({
    studentId,
    status: 'complete',
    fileUrl,
    dataVersion,
    generatedAt: new Date(),
  })
}

/**
 * Mark PDF as failed with error message
 */
export async function markPDFFailed(
  studentId: string,
  errorMessage: string
) {
  return await saveReportPDF({
    studentId,
    status: 'failed',
    errorMessage,
  })
}

/**
 * Invalidate PDF (trigger regeneration on next request)
 */
export async function invalidateStudentReport(studentId: string) {
  return await saveReportPDF({
    studentId,
    status: 'stale',
  })
}
