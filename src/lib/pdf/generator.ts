import { renderToBuffer, renderToFile } from '@react-pdf/renderer'
import type { DocumentProps } from '@react-pdf/renderer'
import fs from 'fs/promises'
import path from 'path'

/**
 * Render React PDF component to buffer (for streaming response)
 */
export async function pdfToBuffer(
  component: React.ReactElement<DocumentProps>
): Promise<Buffer> {
  return await renderToBuffer(component)
}

/**
 * Render React PDF component to file (for caching/storage)
 */
export async function pdfToFile(
  component: React.ReactElement<DocumentProps>,
  outputPath: string
): Promise<void> {
  // Ensure directory exists
  const dir = path.dirname(outputPath)
  await fs.mkdir(dir, { recursive: true })

  // Render to file
  await renderToFile(component, outputPath)
}

/**
 * Generate PDF filename for student report
 */
export function generateReportFilename(
  studentId: string,
  studentName: string,
  timestamp: number = Date.now()
): string {
  const sanitizedName = studentName.replace(/[^a-zA-Z0-9가-힣]/g, '_')
  return `report-${studentId}-${sanitizedName}-${timestamp}.pdf`
}

/**
 * Get PDF storage path from environment or default
 */
export function getPdfStoragePath(): string {
  return process.env.PDF_STORAGE_PATH || './public/reports'
}
