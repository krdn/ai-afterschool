import dynamic from 'next/dynamic'
import { db } from '@/lib/db'

interface ReportButtonProps {
  studentId: string
}

// Dynamic import to avoid 'use client' in server component
const ReportButtonClient = dynamic(
  () => import('./report-button-client').then(mod => ({ default: mod.ReportButtonClient })),
  { ssr: false }
)

export async function ReportButton({ studentId }: ReportButtonProps) {
  // Fetch initial status server-side
  const report = await db.reportPDF.findUnique({
    where: { studentId },
  })

  const status = (report?.status as 'none' | 'generating' | 'complete' | 'failed') || 'none'
  const fileUrl = report?.fileUrl || null

  return (
    <ReportButtonClient
      studentId={studentId}
      initialStatus={status}
      initialFileUrl={fileUrl}
    />
  )
}
