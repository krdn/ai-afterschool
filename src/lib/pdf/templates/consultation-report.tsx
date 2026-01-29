import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from '@react-pdf/renderer'
import { Header } from './sections/header'
import { StudentInfo } from './sections/student-info'
import { AnalysisResults } from './sections/analysis-results'
import { AIRecommendations } from './sections/ai-recommendations'
import { Footer } from './sections/footer'
import { styles } from './styles'

// React types for props
interface ConsultationReportProps {
  student: {
    name: string
    birthDate: Date
    school: string
    grade: number
    targetUniversity?: string | null
    targetMajor?: string | null
    bloodType?: string | null
  }
  analyses: {
    saju: {
      result: unknown
      interpretation: string | null
      calculatedAt: Date | null
    } | null
    name: {
      result: unknown
      interpretation: string | null
      calculatedAt: Date | null
    } | null
    mbti: {
      mbtiType: string
      percentages: Record<string, number>
      calculatedAt: Date
    } | null
    face: {
      result: unknown
      status: string
      errorMessage: string | null
    } | null
    palm: {
      result: unknown
      status: string
      errorMessage: string | null
    } | null
  }
  personalitySummary: {
    coreTraits: string | null
    learningStrategy: unknown | null
    careerGuidance: unknown | null
    status: string
  } | null
  generatedAt: Date
}

export function ConsultationReport({
  student,
  analyses,
  personalitySummary,
  generatedAt,
}: ConsultationReportProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <Header generatedAt={generatedAt} />

        {/* Student Information */}
        <StudentInfo
          name={student.name}
          birthDate={student.birthDate}
          school={student.school}
          grade={student.grade}
          targetUniversity={student.targetUniversity}
          targetMajor={student.targetMajor}
          bloodType={student.bloodType}
        />

        {/* Analysis Results */}
        <AnalysisResults
          saju={analyses.saju}
          name={analyses.name}
          mbti={analyses.mbti}
          face={analyses.face}
          palm={analyses.palm}
        />

        {/* AI Recommendations */}
        <AIRecommendations personalitySummary={personalitySummary} />

        {/* Footer */}
        <Footer generatedAt={generatedAt} pageNumber={1} totalPages={1} />
      </Page>
    </Document>
  )
}

// Export type for use in API routes
export type ConsultationReportData = ConsultationReportProps
