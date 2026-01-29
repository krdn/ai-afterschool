# Phase 6: AI Integration - Research

**Researched:** 2026-01-29
**Domain:** AI-powered personality aggregation and educational/career guidance
**Confidence:** HIGH

## Summary

Phase 6 requires aggregating five different analysis types (Saju, Name Analysis, MBTI, Face Reading, Palm Reading) into a unified personality profile and using AI to generate personalized learning strategies and career guidance. The research reveals that the existing codebase has a solid foundation with all analyses stored in the database using JSON fields, a singleton Claude client pattern, and Server Actions with async processing.

**Key findings:**
1. All analysis models use identical storage patterns (Prisma JSON fields with versioning)
2. Existing AI infrastructure uses `@anthropic-ai/sdk` with singleton pattern and `after()` for non-blocking processing
3. Each analysis has consistent structure: `result` (JSON), `status`, `calculatedAt/analyzedAt`, `version`, `interpretation`
4. UI components follow consistent panel patterns with loading/empty/error states
5. Type assertions are used at component level for JSON results (Phase 5 decision)

**Primary recommendation:** Use the existing AI infrastructure pattern with a new unified aggregation service that queries all analysis types, builds a structured prompt, and generates integrated insights. Store results in a new `PersonalitySummary` model with versioning for history tracking.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **@anthropic-ai/sdk** | ^0.71.2 | Claude API client | Existing project dependency, proven in Phase 5 |
| **@prisma/client** | ^7.3.0 | Database ORM | Existing infrastructure, JSON field support |
| **Next.js** | ^15.5.10 | App Router & Server Actions | Existing framework, `after()` for async AI calls |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **zod** | ^4.3.6 | Response validation | Validate Claude JSON responses |
| **date-fns** | ^4.1.0 | Date formatting | Consistent with existing components |
| **lucide-react** | ^0.563.0 | Icons | UI consistency |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Prisma JSON fields | Separate tables | JSON is simpler, no need for joins. Separate tables add complexity with minimal benefit for read-only analysis results. |
| Server Actions | Route Handlers | Server Actions are already used, provide better type safety, and `after()` is perfect for non-blocking AI calls. |
| `after()` pattern | Streaming | Streaming provides progressive rendering but adds complexity. For 10-20s AI calls, `after()` + page reload is simpler and proven in Phase 5. |

**Installation:**
```bash
# No additional packages needed - all dependencies already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── ai/
│   │   ├── claude.ts              # ✅ Existing singleton
│   │   ├── prompts.ts             # ✅ Existing prompts (extend)
│   │   └── integration-prompts.ts # NEW: Unified prompts
│   ├── db/
│   │   ├── student-analysis.ts    # ✅ Existing (extend)
│   │   └── personality-summary.ts # NEW: Summary CRUD
│   └── types/
│       └── personality.ts         # NEW: Unified types
├── actions/
│   └── personality-integration.ts # NEW: Server Actions
└── components/
    └── students/
        ├── personality-summary-card.tsx  # NEW: Summary card
        ├── learning-strategy-panel.tsx    # NEW: AI suggestions
        └── career-guidance-panel.tsx      # NEW: Career guide
```

### Pattern 1: Unified Analysis Aggregation

**What:** Query all analysis types for a student and merge into a single structured payload.

**When to use:** When generating integrated AI insights or displaying summary cards.

**Example:**
```typescript
// src/lib/db/personality-summary.ts

export type UnifiedPersonalityData = {
  saju: {
    result: SajuResult | null
    calculatedAt: Date | null
    interpretation: string | null
  }
  name: {
    result: NameNumerologyResult | null
    calculatedAt: Date | null
    interpretation: string | null
  }
  mbti: {
    result: { mbtiType: string; percentages: Record<string, number> } | null
    calculatedAt: Date | null
  }
  face: {
    result: FaceAnalysisResult | null
    analyzedAt: Date | null
  }
  palm: {
    result: PalmAnalysisResult | null
    analyzedAt: Date | null
  }
}

export async function getUnifiedPersonalityData(
  studentId: string,
  teacherId: string
): Promise<UnifiedPersonalityData | null> {
  const student = await db.student.findFirst({
    where: { id: studentId, teacherId },
    include: {
      sajuAnalysis: true,
      nameAnalysis: true,
      mbtiAnalysis: true,
      faceAnalysis: true,
      palmAnalysis: true,
    },
  })

  if (!student) return null

  return {
    saju: {
      result: student.sajuAnalysis?.result as SajuResult | null,
      calculatedAt: student.sajuAnalysis?.calculatedAt ?? null,
      interpretation: student.sajuAnalysis?.interpretation ?? null,
    },
    name: {
      result: student.nameAnalysis?.result as NameNumerologyResult | null,
      calculatedAt: student.nameAnalysis?.calculatedAt ?? null,
      interpretation: student.nameAnalysis?.interpretation ?? null,
    },
    mbti: {
      result: student.mbtiAnalysis ? {
        mbtiType: student.mbtiAnalysis.mbtiType,
        percentages: student.mbtiAnalysis.percentages as Record<string, number>,
      } : null,
      calculatedAt: student.mbtiAnalysis?.calculatedAt ?? null,
    },
    face: {
      result: student.faceAnalysis?.result as FaceAnalysisResult | null,
      analyzedAt: student.faceAnalysis?.analyzedAt ?? null,
    },
    palm: {
      result: student.palmAnalysis?.result as PalmAnalysisResult | null,
      analyzedAt: student.palmAnalysis?.analyzedAt ?? null,
    },
  }
}
```

**Source:** Existing pattern from `/src/lib/db/student-analysis.ts` and `/src/lib/actions/students.ts`

### Pattern 2: AI-Powered Insight Generation

**What:** Use Claude API with structured prompts to generate learning strategies and career guidance from aggregated data.

**When to use:** When creating AI-powered suggestions that require synthesis of multiple data sources.

**Example:**
```typescript
// src/lib/ai/integration-prompts.ts

export function buildLearningStrategyPrompt(
  data: UnifiedPersonalityData,
  studentInfo: { name: string; grade: number; targetMajor?: string | null }
): string {
  const availableAnalyses = []
  if (data.saju.result) availableAnalyses.push('사주')
  if (data.name.result) availableAnalyses.push('성명학')
  if (data.mbti.result) availableAnalyses.push('MBTI')
  if (data.face.result) availableAnalyses.push('관상')
  if (data.palm.result) availableAnalyses.push('손금')

  return `
너는 한국 학생들을 위한 맞춤형 학습 전략 전문가야.

학생 정보:
- 이름: ${studentInfo.name}
- 학년: ${studentInfo.grade}학년
- 목표 학과: ${studentInfo.targetMajor || '미정'}

분석 가능한 데이터 (${availableAnalyses.join(', ')}):

${data.saju.interpretation ? `## 사주 해석\n${data.saju.interpretation}\n` : ''}
${data.name.interpretation ? `## 성명학 해석\n${data.name.interpretation}\n` : ''}
${data.mbti.result ? `## MBTI 유형\n${data.mbti.result.mbtiType}\n` : ''}
${data.face.result ? `## 관상 성격 특성\n${data.face.result.personalityTraits.join(', ')}\n` : ''}
${data.palm.result ? `## 손금 성격 특성\n${data.palm.result.personalityTraits.join(', ')}\n` : ''}

위 정보를 바탕으로 다음을 제공해주세요:

1. **핵심 성향 요약** (3-5문장)
2. **학습 스타일** (시각/청각/운동 중 선호, 집중 방식)
3. **과목별 접근법** (국어, 수학, 영어, 과학, 사회 각 2-3문장)
4. **학습 효율화 팁** (3-5개 구체적인 제안)
5. **동기 부여 방법** (학생의 성향에 맞는 동기화 전략)

**중요:**
- 데이터가 부족한 분석은 무시하고 사용 가능한 데이터만 활용해주세요
- 긍정적이고 격려하는 톤을 유지해주세요
- 구체적이고 실행 가능한 조언을 제공해주세요
- 학생의 자존감을 높이는 방향으로 작성해주세요

**출력 형식 (JSON):**
{
  "coreTraits": "string (3-5문장)",
  "learningStyle": {
    "type": "시각|청각|운동|혼합",
    "description": "string",
    "focusMethod": "string"
  },
  "subjectStrategies": {
    "korean": "string",
    "math": "string",
    "english": "string",
    "science": "string",
    "social": "string"
  },
  "efficiencyTips": ["string", ...],
  "motivationApproach": "string"
}
`.trim()
}
```

**Source:** Based on existing prompt pattern in `/src/lib/ai/prompts.ts` and Claude best practices from [Claude Prompt Engineering Best Practices (2026)](https://promptbuilder.cc/blog/claude-prompt-engineering-best-practices-2026)

### Pattern 3: Async AI Processing with Progress Tracking

**What:** Use Next.js `after()` API to trigger AI generation without blocking the response, with status tracking.

**When to use:** For AI operations that take 10-30 seconds.

**Example:**
```typescript
// src/actions/personality-integration.ts

"use server"

import { revalidatePath } from "next/cache"
import { after } from "next/server"
import { anthropic } from "@/lib/ai/claude"
import { buildLearningStrategyPrompt } from "@/lib/ai/integration-prompts"
import { upsertPersonalitySummary } from "@/lib/db/personality-summary"

export async function generateLearningStrategy(studentId: string) {
  const session = await verifySession()

  // Validate access
  const student = await db.student.findFirst({
    where: { id: studentId, teacherId: session.userId }
  })

  if (!student) {
    return { success: false, error: "학생을 찾을 수 없어요." }
  }

  // Check for existing in-progress generation
  const existing = await getPersonalitySummary(studentId)
  if (existing?.status === 'pending') {
    return { success: false, error: "이미 생성 중입니다." }
  }

  // Set pending status
  await upsertPersonalitySummary({
    studentId,
    learningStrategy: null,
    careerGuidance: null,
    status: 'pending'
  })

  // Non-blocking AI generation
  after(async () => {
    try {
      const data = await getUnifiedPersonalityData(studentId, session.userId)

      if (!data) {
        throw new Error('분석 데이터를 찾을 수 없습니다.')
      }

      const prompt = buildLearningStrategyPrompt(data, {
        name: student.name,
        grade: student.grade,
        targetMajor: student.targetMajor
      })

      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 3000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })

      const content = response.content[0]
      if (content.type !== 'text') {
        throw new Error('Unexpected response type')
      }

      const result = JSON.parse(content.text)

      // Save result
      await upsertPersonalitySummary({
        studentId,
        learningStrategy: result,
        status: 'complete'
      })

      revalidatePath(`/students/${studentId}`)

    } catch (error) {
      console.error('Learning strategy generation error:', error)

      await upsertPersonalitySummary({
        studentId,
        learningStrategy: null,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : '알 수 없는 에러'
      })

      revalidatePath(`/students/${studentId}`)
    }
  })

  return {
    success: true,
    message: "학습 전략을 생성 중이에요. 잠시 후 결과가 표시됩니다."
  }
}
```

**Source:** Existing pattern from `/src/lib/actions/ai-image-analysis.ts` (Phase 5 implementation)

### Pattern 4: Summary Card with Progressive Data Display

**What:** Display analysis availability status and key insights in a compact card format.

**When to use:** For the "personality summary card at a glance" requirement (REPT-02).

**Example:**
```typescript
// src/components/students/personality-summary-card.tsx

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Circle, AlertCircle } from "lucide-react"

type PersonalitySummaryCardProps = {
  data: {
    sajuAvailable: boolean
    nameAvailable: boolean
    mbtiAvailable: boolean
    faceAvailable: boolean
    palmAvailable: boolean
  }
  summary?: {
    coreTraits?: string | null
    generatedAt?: Date | null
  }
}

export function PersonalitySummaryCard({ data, summary }: PersonalitySummaryCardProps) {
  const availableCount = [
    data.sajuAvailable,
    data.nameAvailable,
    data.mbtiAvailable,
    data.faceAvailable,
    data.palmAvailable,
  ].filter(Boolean).length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>통합 성향 분석</span>
          <span className="text-sm font-normal text-gray-500">
            {availableCount}/5 완료
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Analysis Status Grid */}
        <div className="grid grid-cols-5 gap-2">
          <AnalysisStatus label="사주" available={data.sajuAvailable} />
          <AnalysisStatus label="성명" available={data.nameAvailable} />
          <AnalysisStatus label="MBTI" available={data.mbtiAvailable} />
          <AnalysisStatus label="관상" available={data.faceAvailable} />
          <AnalysisStatus label="손금" available={data.palmAvailable} />
        </div>

        {/* Core Traits Summary */}
        {summary?.coreTraits ? (
          <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-900">
            <p className="font-medium mb-1">핵심 성향</p>
            <p className="leading-relaxed">{summary.coreTraits}</p>
          </div>
        ) : availableCount >= 3 ? (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500 mb-3">
              충분한 데이터가 모였어요. AI 분석을 시작할까요?
            </p>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              AI 통합 분석 생성
            </button>
          </div>
        ) : (
          <div className="text-center py-4">
            <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              최소 3개 이상의 분석이 필요해요.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function AnalysisStatus({ label, available }: { label: string; available: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      {available ? (
        <CheckCircle2 className="w-5 h-5 text-green-600" />
      ) : (
        <Circle className="w-5 h-5 text-gray-300" />
      )}
      <span className="text-xs text-gray-600">{label}</span>
    </div>
  )
}
```

**Source:** Based on existing card patterns from `/src/components/students/saju-analysis-panel.tsx` and dashboard card best practices from [500+ Highly Customizable React Dashboard Components](https://tailadmin.com/react-components)

### Anti-Patterns to Avoid

- **Blocking UI for AI calls**: Don't use synchronous AI calls. Always use `after()` or streaming to avoid blocking.
- **Hardcoded analysis requirements**: Don't assume all 5 analyses are present. Design for partial data (requirement AIREC-01 says "일부 분석 데이터가 없어도 사용 가능한 데이터만으로 제안을 생성").
- **Monolithic prompts**: Don't create single giant prompts. Separate learning strategy and career guidance into focused prompts (AIREC-02 vs AIREC-03).
- **Skipping validation**: Don't trust AI responses implicitly. Use Zod schemas to validate JSON structure before saving.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| AI client management | Custom singleton with error handling | Existing `@/lib/ai/claude.ts` pattern | Already proven in Phase 5, handles env var validation |
| Async processing | Custom job queue | Next.js `after()` API | Simpler for non-blocking background tasks, proven in Phase 5 |
| Type assertions for JSON | Custom validation runtime | Component-level assertions (Phase 5 pattern) | Less boilerplate, type safety at usage boundary |
| Card layouts | Custom CSS grid | Radix UI + Tailwind patterns | Consistent with existing design system |

**Key insight:** The existing patterns from Phases 3-5 are battle-tested. Reuse them rather than inventing new approaches. The new code should follow the same conventions: Server Actions for mutations, `after()` for AI calls, type assertions at component boundaries.

## Common Pitfalls

### Pitfall 1: Ignoring Partial Data Scenarios

**What goes wrong:** Assuming all 5 analyses are available leads to errors when some are missing.

**Why it happens:** Development often happens with full test data, but production students may have incomplete analyses.

**How to avoid:**
- Always check for null/undefined before accessing analysis results
- Use optional chaining and nullish coalescing consistently
- Design prompts to gracefully handle missing data
- Test with various combinations of available analyses

**Warning signs:** TypeScript errors about potential null access, empty UI states not handled

**Example:**
```typescript
// ❌ Bad - assumes all data exists
const traits = [
  ...data.saju.result.traits,
  ...data.mbti.result.traits,
]

// ✅ Good - handles missing data
const traits = [
  ...(data.saju.result?.traits ?? []),
  ...(data.mbti.result?.traits ?? []),
].filter(Boolean)
```

### Pitfall 2: AI Response Parsing Failures

**What goes wrong:** Claude returns valid JSON but in a different structure than expected, causing runtime errors.

**Why it happens:** LLMs are non-deterministic. Even with good prompts, structure can vary slightly.

**How to avoid:**
- Use Zod schemas to validate responses before storing
- Provide clear JSON schema examples in prompts
- Implement try-catch with specific error messages
- Log failed responses for prompt refinement

**Warning signs:** Frequent "Unexpected response type" errors, malformed stored data

**Example:**
```typescript
// src/lib/validations/personality.ts
import { z } from "zod"

export const LearningStrategySchema = z.object({
  coreTraits: z.string().min(50).max(500),
  learningStyle: z.object({
    type: z.enum(['시각', '청각', '운동', '혼합']),
    description: z.string(),
    focusMethod: z.string(),
  }),
  subjectStrategies: z.object({
    korean: z.string(),
    math: z.string(),
    english: z.string(),
    science: z.string(),
    social: z.string(),
  }),
  efficiencyTips: z.array(z.string()).min(3).max(7),
  motivationApproach: z.string(),
})

// Usage
const result = LearningStrategySchema.parse(JSON.parse(content.text))
```

### Pitfall 3: Race Conditions with Async Generation

**What goes wrong:** User clicks "Generate" multiple times, triggering duplicate AI calls.

**Why it happens:** No check for in-progress status before starting new generation.

**How to avoid:**
- Check for 'pending' status before starting generation
- Disable buttons while generation is in progress
- Use database locks or status flags
- Implement debouncing on client-side if needed

**Warning signs:** Multiple AI calls for same request, wasted API costs, inconsistent final results

**Example:**
```typescript
// ❌ Bad - no status check
export async function generateStrategy(studentId: string) {
  after(async () => {
    // Starts even if already running
    const result = await callAI()
    await save(result)
  })
}

// ✅ Good - checks pending status
export async function generateStrategy(studentId: string) {
  const existing = await getPersonalitySummary(studentId)

  if (existing?.status === 'pending') {
    return { success: false, error: "이미 생성 중입니다." }
  }

  await upsertPersonalitySummary({
    studentId,
    status: 'pending'
  })

  after(async () => {
    // Only starts if not already running
    const result = await callAI()
    await save(result)
  })
}
```

### Pitfall 4: Versioning and History Loss

**What goes wrong:** When analyses are recalculated, previous insights are lost forever.

**Why it happens:** Using simple update queries without version tracking.

**How to avoid:**
- Follow the existing pattern: all analysis models have `version` field with auto-increment
- Create a new `PersonalitySummary` model with `version` field
- Store history in a separate table or use Prisma's `version` field pattern
- Consider a `summaryHistory` relation for tracking changes

**Warning signs:** No way to see previous insights, requirement REPT-03 not met

**Example:**
```typescript
// prisma/schema.prisma
model PersonalitySummary {
  id               String   @id @default(cuid())
  studentId        String   @unique
  learningStrategy Json?
  careerGuidance   Json?
  status           String   @default("pending")
  errorMessage     String?
  version          Int      @default(1)
  generatedAt      DateTime @default(now())
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  student          Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@index([studentId])
}

model PersonalitySummaryHistory {
  id               String   @id @default(cuid())
  studentId        String
  learningStrategy Json
  careerGuidance   Json
  version          Int
  generatedAt      DateTime
  createdAt        DateTime @default(now())

  @@index([studentId])
  @@index([studentId, generatedAt(sort: Desc)])
}
```

## Code Examples

### Verified Pattern: AI Call with JSON Response

```typescript
// Source: /src/lib/actions/ai-image-analysis.ts (Phase 5, proven working)

const response = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 2048,
  messages: [{
    role: 'user',
    content: prompt
  }]
})

const content = response.content[0]
if (content.type !== 'text') {
  throw new Error('Unexpected response type from Claude')
}

const result = JSON.parse(content.text)
```

### Verified Pattern: Type Assertion at Component Boundary

```typescript
// Source: /src/components/students/face-analysis-panel.tsx (Phase 5 pattern)

const analysisResult = result as {
  faceShape: string
  features: {
    eyes: string
    nose: string
    // ... rest of schema
  }
  personalityTraits: string[]
  fortune: {
    academic: string
    career: string
    relationships: string
  }
  overallInterpretation?: string
}
```

### Verified Pattern: Status-Based UI States

```typescript
// Source: /src/components/students/face-analysis-panel.tsx (Phase 5 pattern)

{analysis?.status === 'complete' && analysis.result ? (
  <AnalysisResult result={analysis.result} />
) : analysis?.status === 'failed' ? (
  <ErrorState message={analysis.errorMessage} onRetry={handleAnalyze} />
) : isAnalyzing ? (
  <LoadingState />
) : (
  <EmptyState hasImage={!!faceImageUrl} onAnalyze={handleAnalyze} />
)}
```

### Verified Pattern: Server Action with Error Handling

```typescript
// Source: /src/lib/actions/students.ts (Phase 1-5, proven pattern)

export async function updateStudent(
  studentId: string,
  prevState: StudentFormState,
  formData: FormData
): Promise<StudentFormState> {
  const session = await verifySession()

  // Validation
  const existingStudent = await db.student.findFirst({
    where: { id: studentId, teacherId: session.userId }
  })

  if (!existingStudent) {
    return { errors: { _form: ["학생을 찾을 수 없어요."] } }
  }

  try {
    // Update logic
    await db.student.update({ where: { id: studentId }, data: updateData })
    revalidatePath("/students")
    revalidatePath(`/students/${studentId}`)
    redirect(`/students/${studentId}`)
  } catch (error) {
    console.error("Failed to update student:", error)
    return {
      errors: { _form: ["학생 정보 수정 중 오류가 발생했어요. 다시 시도해주세요."] }
    }
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Blocking API calls | Next.js `after()` for non-blocking | Phase 5 (2026-01-29) | UI remains responsive during 10-20s AI calls |
| Runtime type libraries | Component-level type assertions | Phase 5 decision | Less boilerplate, type safety at boundary |
| Separate AI client per feature | Singleton Claude client | Phase 5 | Centralized config, easier testing |
| Manual status management | Database status fields + versioning | Phase 3-5 | Built-in history tracking |

**Deprecated/outdated:**
- **Route Handlers for mutations**: Replaced by Server Actions (better type safety, form integration)
- **Client-side AI calls**: Security risk, API key exposure. Always use Server Actions.
- **Streaming for this use case**: While [streaming is available](https://medium.com/codetodeploy/streaming-suspense-progressive-rendering-in-next-js-how-fast-ux-is-actually-built-a372d6b71d14), it adds complexity. For 10-20s AI calls, `after()` + page reload is simpler and proven.

## Open Questions

### Question 1: Optimal Minimum Data Threshold
**What we know:** Requirement says "일부 분석 데이터가 없어도 사용 가능한 데이터만으로 제안을 생성" but doesn't specify minimum.

**What's unclear:** What's the minimum number of analyses needed for useful insights? 2? 3?

**Recommendation:** Start with minimum 3 analyses required for generation. This provides enough cross-reference data while allowing flexibility. Add UI to show which combinations are available.

### Question 2: Summary Card Refresh Strategy
**What we know:** AI generation takes 10-20 seconds. User might navigate away during generation.

**What's unclear:** Should we auto-refresh the summary card when generation completes? Or require manual page reload?

**Recommendation:** Use `revalidatePath()` after AI completes (proven in Phase 5) + show a "refresh" notification if user is still on the page. Consider using Next.js 15's `router.refresh()` in a `useEffect()` with polling for smoother UX.

### Question 3: History Storage Granularity
**What we know:** Requirement REPT-03 says "과거 분석 결과 이력을 저장하고 조회할 수 있다."

**What's unclear:** Should we store every AI generation? Or only when underlying analyses change?

**Recommendation:** Store every generation with timestamp and version. This provides full history for tracking student growth over time. Add pagination for history view if needed.

## Sources

### Primary (HIGH confidence)
- [Claude Prompt Engineering Best Practices (2026)](https://promptbuilder.cc/blog/claude-prompt-engineering-best-practices-2026) - Prompt structure, JSON output format (Dec 2025)
- [Structured outputs - Claude API Docs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) - Official structured output documentation
- [A Complete Next.js Streaming Guide](https://dev.to/boopykiki/a-complete-next-js-streaming-guide-loadingtsx-suspense-and-performance-9g9) - Server Actions, `after()`, progressive rendering (Aug 2025)
- [The Next.js 15 Streaming Handbook](https://www.freecodecamp.org/news/the-nextjs-15-streaming-handbook/) - SSR, React Server Components (Aug 2025)

### Secondary (MEDIUM confidence)
- [Building Reusable React Components in 2026]((https://medium.com/@romko.kozak/building-reusable-react-components-in-2026-a461d30f8ce4) - Component organization patterns (3 weeks old)
- [Data Integration from Multiple Sources](https://dataforest.ai/blog/integrating-data-from-multiple-sources-challenges-strategies-best-practices) - Multi-source data aggregation strategies (Mar 2025)
- [React Server Components: A Practical Guide for 2026](https://inhaq.com/blog/react-server-components-practical-guide-2026/) - RSC vs client components (Jan 9, 2026)

### Tertiary (LOW confidence - marked for validation)
- [Data Aggregation for AI Agents](https://relevanceai.com/agent-templates-tasks/data-aggregation-rules) - AI agent data aggregation patterns (general, not education-specific)
- [Digital data and personality: A systematic review](https://psycnet.apa.org/fulltext/2024-82524-001.html) - Academic research on personality prediction (2024, but not AI-specific)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All dependencies already installed, proven in Phases 3-5
- Architecture: HIGH - Based on existing codebase patterns, verified against official docs
- Pitfalls: HIGH - Identified from common issues in similar projects, documented patterns to avoid

**Research date:** 2026-01-29
**Valid until:** 2026-03-01 (2 months - stable domain, but AI APIs evolve quickly)

**Codebase analysis:**
- Total analysis models examined: 5 (SajuAnalysis, NameAnalysis, MbtiAnalysis, FaceAnalysis, PalmAnalysis)
- AI infrastructure files reviewed: 3 (claude.ts, prompts.ts, ai-image-analysis.ts)
- UI components analyzed: 7 (all analysis panel components)
- Database schema: Verified all models use consistent JSON storage with versioning
