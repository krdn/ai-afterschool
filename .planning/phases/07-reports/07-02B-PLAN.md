---
phase: 07-reports
plan: 02B
type: execute
wave: 3
depends_on: [07-02A]
files_modified:
  - src/lib/pdf/templates/sections/student-info.tsx
  - src/lib/pdf/templates/sections/analysis-results.tsx
  - src/lib/pdf/templates/sections/ai-recommendations.tsx
autonomous: true

must_haves:
  truths:
    - "학생의 기본 정보(이름, 생년월일, 학교, 학년 등)가 표로 정리되어 표시된다"
    - "완료된 성향 분석 결과(MBTI, 사주, 성명학, 관상, 손금)가 각각 개별 섹션으로 표시된다"
    - "AI가 생성한 학습 전략 가이드가 요약과 과목별 접근법으로 표시된다"
    - "AI가 생성한 진로 가이드가 추천 학과와 추천 직업으로 표시된다"
    - "아직 분석이 완료되지 않은 항목은 표시되지 않는다"
  artifacts:
    - path: "src/lib/pdf/templates/sections/student-info.tsx"
      provides: "학생 기본 정보 섹션 (이름, 생년월일, 학교, 학년, 목표 대학/학과)"
      min_lines: 20
    - path: "src/lib/pdf/templates/sections/analysis-results.tsx"
      provides: "성향 분석 결과 섹션 (MBTI, 사주, 성명학, 관상, 손금)"
      min_lines: 40
    - path: "src/lib/pdf/templates/sections/ai-recommendations.tsx"
      provides: "AI 맞춤형 제안 섹션 (학습 전략, 진로 가이드)"
      min_lines: 30
  key_links:
    - from: "src/lib/pdf/templates/sections/student-info.tsx"
      to: "src/lib/pdf/templates/styles.ts"
      via: "import { styles }"
      pattern: "from ['\"]\\.\\/styles['\"]"
    - from: "src/lib/pdf/templates/sections/analysis-results.tsx"
      to: "src/lib/pdf/templates/styles.ts"
      via: "import { styles }"
      pattern: "from ['\"]\\.\\/styles['\"]"
    - from: "src/lib/pdf/templates/sections/ai-recommendations.tsx"
      to: "src/lib/pdf/templates/styles.ts"
      via: "import { styles }"
      pattern: "from ['\"]\\.\\/styles['\"]"
    - from: "src/lib/pdf/templates/sections/*.tsx"
      to: "@react-pdf/renderer"
      via: "import View, Text"
      pattern: "from ['\"]@react-pdf/renderer['\"]"
---

<objective>
PDF 콘텐츠 섹션 컴포넌트 생성 - 학생 정보, 성향 분석 결과, AI 제안

Purpose: PDF 보고서의 주요 콘텐츠 섹션을 생성합니다. 학생 기본 정보, 모든 성향 분석 결과, AI 생성 맞춤형 제안을 포함합니다.
Output: 학생 정보 섹션(student-info.tsx), 성향 분석 결과 섹션(analysis-results.tsx), AI 제안 섹션(ai-recommendations.tsx)
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
@src/lib/pdf/templates/styles.ts
@src/components/students/personality-summary-card.tsx
@src/components/students/learning-strategy-panel.tsx
@src/components/students/career-guidance-panel.tsx
</context>

<tasks>

<task type="auto">
  <name>Create student info section component</name>
  <files>src/lib/pdf/templates/sections/student-info.tsx</files>
  <action>
    Create src/lib/pdf/templates/sections/student-info.tsx:

    ```typescript
    import { View, Text } from '@react-pdf/renderer'
    import { styles } from '../styles'

    interface StudentInfoProps {
      name: string
      birthDate: Date
      school: string
      grade: number
      targetUniversity?: string | null
      targetMajor?: string | null
      bloodType?: string | null
    }

    export function StudentInfo({
      name,
      birthDate,
      school,
      grade,
      targetUniversity,
      targetMajor,
      bloodType,
    }: StudentInfoProps) {
      const formatBirthDate = (date: Date) => {
        return new Date(date).toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      }

      const gradeNames: Record<number, string> = {
        1: '중1',
        2: '중2',
        3: '중3',
        4: '고1',
        5: '고2',
        6: '고3',
      }

      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>학생 기본 정보</Text>

          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <View style={styles.tableCell}>
                <Text>항목</Text>
              </View>
              <View style={styles.tableCell}>
                <Text>내용</Text>
              </View>
            </View>

            <View style={styles.tableRow}>
              <View style={styles.tableCell}>
                <Text>이름</Text>
              </View>
              <View style={styles.tableCell}>
                <Text>{name}</Text>
              </View>
            </View>

            <View style={styles.tableRow}>
              <View style={styles.tableCell}>
                <Text>생년월일</Text>
              </View>
              <View style={styles.tableCell}>
                <Text>{formatBirthDate(birthDate)}</Text>
              </View>
            </View>

            <View style={styles.tableRow}>
              <View style={styles.tableCell}>
                <Text>학교</Text>
              </View>
              <View style={styles.tableCell}>
                <Text>{school}</Text>
              </View>
            </View>

            <View style={styles.tableRow}>
              <View style={styles.tableCell}>
                <Text>학년</Text>
              </View>
              <View style={styles.tableCell}>
                <Text>{gradeNames[grade] || `${grade}학년`}</Text>
              </View>
            </View>

            {targetUniversity && (
              <View style={styles.tableRow}>
                <View style={styles.tableCell}>
                  <Text>목표 대학</Text>
                </View>
                <View style={styles.tableCell}>
                  <Text>{targetUniversity}</Text>
                </View>
              </View>
            )}

            {targetMajor && (
              <View style={styles.tableRow}>
                <View style={styles.tableCell}>
                  <Text>목표 학과</Text>
                </View>
                <View style={styles.tableCell}>
                  <Text>{targetMajor}</Text>
                </View>
              </View>
            )}

            {bloodType && (
              <View style={styles.tableRow}>
                <View style={styles.tableCell}>
                  <Text>혈액형</Text>
                </View>
                <View style={styles.tableCell}>
                  <Text>{bloodType}형</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      )
    }
    ```

    Why table layout: Professional appearance, easy to scan, matches consultation report format.
  </action>
  <verify>
    cat src/lib/pdf/templates/sections/student-info.tsx | grep -E "(export.*StudentInfo|View.*style.*table)"
  </verify>
  <done>
    student-info.tsx exists with StudentInfo component displaying all student fields
  </done>
</task>

<task type="auto">
  <name>Create analysis results section component</name>
  <files>src/lib/pdf/templates/sections/analysis-results.tsx</files>
  <action>
    Create src/lib/pdf/templates/sections/analysis-results.tsx:

    ```typescript
    import { View, Text } from '@react-pdf/renderer'
    import { styles } from '../styles'

    interface AnalysisResultsProps {
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

    export function AnalysisResults({
      saju,
      name,
      mbti,
      face,
      palm,
    }: AnalysisResultsProps) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>성향 분석 결과</Text>

          {/* MBTI Analysis */}
          {mbti && (
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>MBTI 성격 유형</Text>
              <View style={styles.tag}>
                <Text>{mbti.mbtiType}</Text>
              </View>
              {mbti.percentages && (
                <View style={styles.mb8}>
                  <Text style={styles.label}>
                    E: {mbti.percentages.EI?.toFixed(0) || 50}% | I:{' '}
                    {100 - (mbti.percentages.EI || 50)}%
                  </Text>
                  <Text style={styles.label}>
                    S: {mbti.percentages.SN?.toFixed(0) || 50}% | N:{' '}
                    {100 - (mbti.percentages.SN || 50)}%
                  </Text>
                  <Text style={styles.label}>
                    T: {mbti.percentages.TF?.toFixed(0) || 50}% | F:{' '}
                    {100 - (mbti.percentages.TF || 50)}%
                  </Text>
                  <Text style={styles.label}>
                    J: {mbti.percentages.JP?.toFixed(0) || 50}% | P:{' '}
                    {100 - (mbti.percentages.JP || 50)}%
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Saju Analysis */}
          {saju?.calculatedAt && (
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>사주팔자 분석</Text>
              {saju.interpretation && (
                <Text style={styles.content}>{saju.interpretation}</Text>
              )}
            </View>
          )}

          {/* Name Analysis */}
          {name?.calculatedAt && (
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>성명학 분석</Text>
              {name.interpretation && (
                <Text style={styles.content}>{name.interpretation}</Text>
              )}
            </View>
          )}

          {/* Face Analysis */}
          {face?.status === 'complete' && face.result && (
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>관상 분석</Text>
              <Text style={styles.label}>
                (참고용 엔터테인먼트 해석)
              </Text>
              <Text style={styles.content}>
                {typeof face.result === 'string'
                  ? face.result
                  : JSON.stringify(face.result, null, 2)}
              </Text>
            </View>
          )}

          {/* Palm Analysis */}
          {palm?.status === 'complete' && palm.result && (
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>손금 분석</Text>
              <Text style={styles.label}>
                (참고용 엔터테인먼트 해석)
              </Text>
              <Text style={styles.content}>
                {typeof palm.result === 'string'
                  ? palm.result
                  : JSON.stringify(palm.result, null, 2)}
              </Text>
            </View>
          )}

          {/* No Analysis Warning */}
          {!mbti && !saju?.calculatedAt && !name?.calculatedAt && !face && !palm && (
            <View style={styles.subsection}>
              <Text style={styles.content}>
                아직 완료된 성향 분석이 없습니다.
              </Text>
            </View>
          )}
        </View>
      )
    }
    ```

    Why optional rendering: Matches Phase 6 pattern of partial data handling, shows available analyses only.
  </action>
  <verify>
    cat src/lib/pdf/templates/sections/analysis-results.tsx | grep -E "(export.*AnalysisResults|mbti.*saju.*name.*face.*palm)"
  </verify>
  <done>
    analysis-results.tsx exists with AnalysisResults component handling all 5 analysis types
  </done>
</task>

<task type="auto">
  <name>Create AI recommendations section component</name>
  <files>src/lib/pdf/templates/sections/ai-recommendations.tsx</files>
  <action>
    Create src/lib/pdf/templates/sections/ai-recommendations.tsx:

    ```typescript
    import { View, Text } from '@react-pdf/renderer'
    import { styles } from '../styles'

    interface AIRecommendationsProps {
      personalitySummary: {
        coreTraits: string | null
        learningStrategy: unknown | null
        careerGuidance: unknown | null
        status: string
      } | null
    }

    export function AIRecommendations({
      personalitySummary,
    }: AIRecommendationsProps) {
      if (!personalitySummary || personalitySummary.status === 'none') {
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI 맞춤형 제안</Text>
            <Text style={styles.content}>
              AI 제안을 생성하려면 최소 3개 이상의 성향 분석이 필요합니다.
            </Text>
          </View>
        )
      }

      if (personalitySummary.status === 'pending') {
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI 맞춤형 제안</Text>
            <Text style={styles.content}>
              AI 제안 생성 중입니다...
            </Text>
          </View>
        )
      }

      const learningStrategy = personalitySummary.learningStrategy as
        | {
            summary?: string
            learningStyle?: string
            subjectApproaches?: Array<{
              subject: string
              approach: string
            }>
          }
        | undefined

      const careerGuidance = personalitySummary.careerGuidance as
        | {
            summary?: string
            recommendedMajors?: Array<{
              major: string
              reason: string
            }>
            recommendedCareers?: Array<{
              career: string
              reason: string
            }>
          }
        | undefined

      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI 맞춤형 제안</Text>

          {/* Core Traits Summary */}
          {personalitySummary.coreTraits && (
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>성향 요약</Text>
              <Text style={styles.content}>
                {personalitySummary.coreTraits}
              </Text>
            </View>
          )}

          {/* Learning Strategy */}
          {learningStrategy && (
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>학습 전략 가이드</Text>
              {learningStrategy.summary && (
                <Text style={styles.content}>{learningStrategy.summary}</Text>
              )}
              {learningStrategy.learningStyle && (
                <View style={styles.mb8}>
                  <Text style={styles.label}>학습 스타일</Text>
                  <Text style={styles.content}>
                    {learningStrategy.learningStyle}
                  </Text>
                </View>
              )}
              {learningStrategy.subjectApproaches &&
                learningStrategy.subjectApproaches.length > 0 && (
                  <View style={styles.mb8}>
                    <Text style={styles.label}>과목별 접근법</Text>
                    {learningStrategy.subjectApproaches.map((item, idx) => (
                      <View key={idx} style={styles.mb4}>
                        <Text style={styles.subsectionTitle}>
                          • {item.subject}
                        </Text>
                        <Text style={styles.content}>{item.approach}</Text>
                      </View>
                    ))}
                  </View>
                )}
            </View>
          )}

          {/* Career Guidance */}
          {careerGuidance && (
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>진로 가이드</Text>
              {careerGuidance.summary && (
                <Text style={styles.content}>{careerGuidance.summary}</Text>
              )}
              {careerGuidance.recommendedMajors &&
                careerGuidance.recommendedMajors.length > 0 && (
                  <View style={styles.mb8}>
                    <Text style={styles.label}>추천 학과</Text>
                    {careerGuidance.recommendedMajors.map((item, idx) => (
                      <View key={idx} style={styles.mb4}>
                        <Text style={styles.subsectionTitle}>
                          • {item.major}
                        </Text>
                        <Text style={styles.content}>{item.reason}</Text>
                      </View>
                    ))}
                  </View>
                )}
              {careerGuidance.recommendedCareers &&
                careerGuidance.recommendedCareers.length > 0 && (
                  <View style={styles.mb8}>
                    <Text style={styles.label}>추천 직업</Text>
                    {careerGuidance.recommendedCareers.map((item, idx) => (
                      <View key={idx} style={styles.mb4}>
                        <Text style={styles.subsectionTitle}>
                          • {item.career}
                        </Text>
                        <Text style={styles.content}>{item.reason}</Text>
                      </View>
                    ))}
                  </View>
                )}
            </View>
          )}
        </View>
      )
    }
    ```

    Why type assertions: AI results stored as JSON in database, need component-level type assertions (Phase 6 pattern).
  </action>
  <verify>
    cat src/lib/pdf/templates/sections/ai-recommendations.tsx | grep -E "(export.*AIRecommendations|learningStrategy|careerGuidance)"
  </verify>
  <done>
    ai-recommendations.tsx exists with AIRecommendations component
  </done>
</task>

</tasks>

<verification>
After all tasks complete, verify:

1. src/lib/pdf/templates/sections/student-info.tsx exists with StudentInfo component
2. src/lib/pdf/templates/sections/analysis-results.tsx exists with AnalysisResults component
3. src/lib/pdf/templates/sections/ai-recommendations.tsx exists with AIRecommendations component
4. All components import and use styles from styles.ts
5. All components use @react-pdf/renderer primitives (View, Text)
6. TypeScript compilation passes: `npx tsc --noEmit`
</verification>

<success_criteria>
1. `grep "export.*StudentInfo" src/lib/pdf/templates/sections/student-info.tsx` returns match
2. `grep "export.*AnalysisResults" src/lib/pdf/templates/sections/analysis-results.tsx` returns match
3. `grep "export.*AIRecommendations" src/lib/pdf/templates/sections/ai-recommendations.tsx` returns match
4. `npx tsc --noEmit` completes without errors
</success_criteria>

<output>
After completion, create `.planning/phases/07-reports/07-02B-SUMMARY.md` with:
- Content section component structure
- Conditional rendering logic for partial data
- TypeScript type definitions
</output>
