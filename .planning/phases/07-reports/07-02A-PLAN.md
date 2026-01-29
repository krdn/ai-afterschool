---
phase: 07-reports
plan: 02A
type: execute
wave: 2
depends_on: [07-01]
files_modified:
  - src/lib/pdf/templates/styles.ts
  - src/lib/pdf/templates/sections/header.tsx
  - src/lib/pdf/templates/sections/footer.tsx
autonomous: true

must_haves:
  truths:
    - "PDF 문서의 타이틀과 생성일시가 명확하게 표시된다"
    - "PDF 문서의 각 페이지 하단에 생성일과 페이지 번호가 표시된다"
    - "PDF 문서에 참고 자료임을 알리는 면책 조항이 포함되어 있다"
    - "모든 텍스트가 한글 폰트로 올바르게 렌더링된다"
  artifacts:
    - path: "src/lib/pdf/templates/styles.ts"
      provides: "공통 PDF 스타일 정의 (폰트, 색상, 여백)"
      min_lines: 30
    - path: "src/lib/pdf/templates/sections/header.tsx"
      provides: "보고서 헤더 (타이틀, 부제, 생성일시)"
      min_lines: 15
    - path: "src/lib/pdf/templates/sections/footer.tsx"
      provides: "보고서 푸터 (페이지 번호, 면책 조항)"
      min_lines: 10
  key_links:
    - from: "src/lib/pdf/templates/sections/header.tsx"
      to: "src/lib/pdf/templates/styles.ts"
      via: "import { styles }"
      pattern: "from ['\"]\\.\\/styles['\"]"
    - from: "src/lib/pdf/templates/sections/footer.tsx"
      to: "src/lib/pdf/templates/styles.ts"
      via: "import { styles }"
      pattern: "from ['\"]\\.\\/styles['\"]"
    - from: "src/lib/pdf/templates/styles.ts"
      to: "src/lib/pdf/fonts.ts"
      via: "import { fonts }"
      pattern: "from ['\"]@/lib/pdf/fonts['\"]"
---

<objective>
PDF 기본 스타일 및 레이아웃 구성 - 헤더, 푸터, 공통 스타일

Purpose: 모든 PDF 템플릿에서 사용할 공통 스타일 시스템과 기본 레이아웃 요소(헤더, 푸터)를 생성합니다. 전문적인 보고서 형식을 제공합니다.
Output: 공통 스타일 모듈(styles.ts), 헤더 섹션(header.tsx), 푸터 섹션(footer.tsx)
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
@src/lib/pdf/fonts.ts
</context>

<tasks>

<task type="auto">
  <name>Create shared PDF styles module</name>
  <files>src/lib/pdf/templates/styles.ts</files>
  <action>
    Create src/lib/pdf/templates/styles.ts with shared styling:

    ```typescript
    import { StyleSheet } from '@react-pdf/renderer'
    import { fonts } from '../fonts'

    export const styles = StyleSheet.create({
      page: {
        padding: 40,
        fontFamily: fonts.sans,
        fontSize: 10,
        lineHeight: 1.5,
        backgroundColor: '#FFFFFF',
      },

      // Headers
      title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#1F2937',
      },
      subtitle: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 30,
      },

      // Sections
      section: {
        marginVertical: 20,
      },
      sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#1F2937',
        borderBottom: '2 solid #3B82F6',
        paddingBottom: 6,
      },
      subsection: {
        marginBottom: 12,
      },
      subsectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 6,
        color: '#374151',
      },

      // Content
      content: {
        fontSize: 10,
        lineHeight: 1.6,
        color: '#4B5563',
        textAlign: 'justify',
      },
      label: {
        fontSize: 9,
        color: '#6B7280',
        marginBottom: 2,
      },
      value: {
        fontSize: 11,
        color: '#1F2937',
        marginBottom: 8,
      },

      // Tables
      table: {
        width: '100%',
        marginBottom: 10,
      },
      tableRow: {
        flexDirection: 'row',
        borderBottom: '1 solid #E5E7EB',
      },
      tableCell: {
        flex: 1,
        padding: 6,
        fontSize: 9,
      },
      tableHeader: {
        backgroundColor: '#F9FAFB',
        fontWeight: 'bold',
        color: '#374151',
      },

      // Tags/Badges
      tag: {
        display: 'inline-block',
        paddingHorizontal: 6,
        paddingVertical: 2,
        backgroundColor: '#DBEAFE',
        color: '#1E40AF',
        borderRadius: 3,
        fontSize: 8,
        marginRight: 4,
        marginBottom: 4,
      },

      // Footer
      footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        fontSize: 8,
        color: '#9CA3AF',
        borderTop: '1 solid #E5E7EB',
        paddingTop: 10,
      },

      // Utilities
      mb4: { marginBottom: 4 },
      mb8: { marginBottom: 8 },
      mb12: { marginBottom: 12 },
      textCenter: { textAlign: 'center' },
      textRight: { textAlign: 'right' },
    })

    // Color palette
    export const colors = {
      primary: '#3B82F6',
      gray: {
        50: '#F9FAFB',
        100: '#F3F4F6',
        200: '#E5E7EB',
        300: '#D1D5DB',
        400: '#9CA3AF',
        500: '#6B7280',
        600: '#4B5563',
        700: '#374151',
        800: '#1F2937',
        900: '#111827',
      },
    }
    ```

    Why separate styles: Follows project pattern, enables consistent theming across all sections, matches Tailwind colors used in web UI.
  </action>
  <verify>
    cat src/lib/pdf/templates/styles.ts | grep -E "(StyleSheet\.create|export.*styles|export.*colors)"
  </verify>
  <done>
    styles.ts exists with StyleSheet.create and exports styles/colors objects
  </done>
</task>

<task type="auto">
  <name>Create header section component</name>
  <files>src/lib/pdf/templates/sections/header.tsx</files>
  <action>
    Create src/lib/pdf/templates/sections/header.tsx:

    ```typescript
    import { View, Text } from '@react-pdf/renderer'
    import { styles } from '../styles'

    interface HeaderProps {
      generatedAt: Date
    }

    export function Header({ generatedAt }: HeaderProps) {
      const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      }

      return (
        <View fixed>
          <Text style={styles.title}>AI 입시 상담 종합 보고서</Text>
          <Text style={styles.subtitle}>
            학생 성향 분석 및 맞춤형 학습/진로 가이드
          </Text>
          <View style={{ marginTop: 20 }}>
            <Text style={styles.label}>생성일시</Text>
            <Text style={styles.value}>{formatDate(generatedAt)}</Text>
          </View>
        </View>
      )
    }
    ```

    Why header: Professional report appearance, clearly identifies document purpose and generation time.
  </action>
  <verify>
    cat src/lib/pdf/templates/sections/header.tsx | grep -E "(export.*Header|Text.*style)"
  </verify>
  <done>
    header.tsx exists with Header component using styles
  </done>
</task>

<task type="auto">
  <name>Create footer section component</name>
  <files>src/lib/pdf/templates/sections/footer.tsx</files>
  <action>
    Create src/lib/pdf/templates/sections/footer.tsx:

    ```typescript
    import { View, Text } from '@react-pdf/renderer'
    import { styles } from '../styles'

    interface FooterProps {
      generatedAt: Date
      pageNumber?: number
      totalPages?: number
    }

    export function Footer({
      generatedAt,
      pageNumber = 1,
      totalPages = 1,
    }: FooterProps) {
      const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      }

      return (
        <View style={styles.footer} fixed>
          <Text>
            생성일: {formatDate(generatedAt)} | 페이지 {pageNumber} /
            {totalPages}
          </Text>
          <Text style={{ marginTop: 4 }}>
            ※ 본 보고서는 학생의 성향 분석을 기반으로 AI가 생성한 참고 자료입니다.
          </Text>
          <Text>
            ※ 최종적인 진로 결정은 학생과 학부모의 충분한 상담 후 결정해 주십시오.
          </Text>
        </View>
      )
    }
    ```

    Why footer: Professional consultation report requires disclaimers and pagination, clearly positions report as reference material.
  </action>
  <verify>
    cat src/lib/pdf/templates/sections/footer.tsx | grep -E "(export.*Footer|Text.*style.*footer)"
  </verify>
  <done>
    footer.tsx exists with Footer component
  </done>
</task>

</tasks>

<verification>
After all tasks complete, verify:

1. src/lib/pdf/templates/styles.ts exists with StyleSheet.create
2. src/lib/pdf/templates/sections/header.tsx exists with Header component
3. src/lib/pdf/templates/sections/footer.tsx exists with Footer component
4. All components import and use styles from styles.ts
5. All components import fonts from fonts.ts
6. TypeScript compilation passes: `npx tsc --noEmit`
</verification>

<success_criteria>
1. `grep "StyleSheet.create" src/lib/pdf/templates/styles.ts` returns match
2. `grep "export.*Header" src/lib/pdf/templates/sections/header.tsx` returns match
3. `grep "export.*Footer" src/lib/pdf/templates/sections/footer.tsx` returns match
4. `npx tsc --noEmit` completes without errors
</success_criteria>

<output>
After completion, create `.planning/phases/07-reports/07-02A-SUMMARY.md` with:
- Style system documentation (fonts, colors, spacing)
- Header and footer component structure
- Korean font rendering confirmation
</output>
