---
phase: 07-reports
plan: 02C
type: execute
wave: 4
depends_on: [07-02B]
files_modified:
  - src/lib/pdf/templates/consultation-report.tsx
autonomous: true

must_haves:
  truths:
    - "PDF 문서가 헤더, 학생 정보, 성향 분석 결과, AI 제안, 푸터 순서로 구성된다"
    - "모든 섹션 컴포넌트가 메인 문서에 import되어 사용된다"
    - "PDF 문서가 A4 크기로 렌더링되고 적절한 여백이 적용된다"
    - "메인 문서 컴포넌트가 @react-pdf/renderer의 Document와 Page를 사용한다"
  artifacts:
    - path: "src/lib/pdf/templates/consultation-report.tsx"
      provides: "메인 상담 보고서 PDF 문서 (모든 섹션 통합)"
      min_lines: 30
      exports: ["ConsultationReport", "ConsultationReportData"]
  key_links:
    - from: "src/lib/pdf/templates/consultation-report.tsx"
      to: "src/lib/pdf/templates/sections/*.tsx"
      via: "import statements"
      pattern: "from ['\"]\\.\\/sections\\/"
    - from: "src/lib/pdf/templates/consultation-report.tsx"
      to: "@react-pdf/renderer"
      via: "import Document, Page"
      pattern: "from ['\"]@react-pdf/renderer['\"]"
    - from: "src/lib/pdf/templates/consultation-report.tsx"
      to: "src/lib/pdf/templates/styles.ts"
      via: "import { styles }"
      pattern: "from ['\"]\\.\\/styles['\"]"
---

<objective>
PDF 메인 문서 통합 - 모든 섹션을 결합한 상담 보고서

Purpose: 모든 PDF 섹션 컴포넌트를 하나의 완전한 상담 보고서 문서로 통합합니다. @react-pdf/renderer의 Document/Page 구조를 따릅니다.
Output: 메인 상담 보고서 문서 컴포넌트(consultation-report.tsx)
</objective>

<execution_context>
@/home/gon/.claude/get-shit-done/workflows/execute-plan.md
@/home/gon/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/07-reports/07-RESEARCH.md
@.planning/phases/07-reports/07-01-SUMMARY.md
@.planning/phases/07-reports/07-02A-SUMMARY.md
@.planning/phases/07-reports/07-02B-SUMMARY.md
@src/lib/pdf/templates/styles.ts
@src/lib/pdf/templates/sections/*.tsx
</context>

<tasks>

<task type="auto">
  <name>Create main consultation report document component</name>
  <files>src/lib/pdf/templates/consultation-report.tsx</files>
  <action>
    Create src/lib/pdf/templates/consultation-report.tsx:

    ```typescript
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
    ```

    Why main document: Orchestrates all sections, follows @react-pdf/renderer Document/Page structure, matches research pattern.
  </action>
  <verify>
    cat src/lib/pdf/templates/consultation-report.tsx | grep -E "(export.*ConsultationReport|import.*Header|import.*StudentInfo|import.*AnalysisResults|import.*AIRecommendations|import.*Footer)"
  </verify>
  <done>
    consultation-report.tsx exists with ConsultationReport component importing all 5 sections
  </done>
</task>

</tasks>

<verification>
After all tasks complete, verify:

1. src/lib/pdf/templates/consultation-report.tsx exists
2. ConsultationReport imports all 5 section components (Header, StudentInfo, AnalysisResults, AIRecommendations, Footer)
3. ConsultationReport uses @react-pdf/renderer Document and Page components
4. ConsultationReport exports ConsultationReportData type
5. TypeScript compilation passes: `npx tsc --noEmit`
</verification>

<success_criteria>
1. `grep "import.*from.*sections/" src/lib/pdf/templates/consultation-report.tsx` returns 5 matches
2. `grep "export.*ConsultationReport" src/lib/pdf/templates/consultation-report.tsx` returns match
3. `grep "Document.*Page" src/lib/pdf/templates/consultation-report.tsx` returns match
4. `npx tsc --noEmit` completes without errors
</success_criteria>

<output>
After completion, create `.planning/phases/07-reports/07-02C-SUMMARY.md` with:
- Complete PDF template structure overview
- All section components integrated
- ConsultationReportData type definition
- Ready for use in API routes and Server Actions
</output>
