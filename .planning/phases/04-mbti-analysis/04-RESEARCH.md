# Phase 4: MBTI Analysis - Research

**Researched:** 2026-01-29
**Domain:** Survey-based personality assessment with draft saving and scoring
**Confidence:** HIGH

## Summary

Phase 4 implements a 60-question MBTI survey system where teachers answer on behalf of students. The system requires robust draft saving (DB-backed), progress tracking, client-side validation, and automatic scoring to calculate MBTI type and dimension percentages.

Research confirms that react-hook-form with custom autosave hooks combined with Prisma storage provides the most maintainable approach for this use case. The scoring algorithm follows standard MBTI methodology: count responses per dimension, calculate percentages, and determine the dominant pole (E/I, S/N, T/F, J/P).

**Primary recommendation:** Build a single-page form using react-hook-form, implement debounced autosave to Prisma, use Zod for validation, and calculate MBTI scores client-side before final submission.

## Standard Stack

The established libraries/tools for survey forms with draft saving in Next.js:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-hook-form | ^7.71.1 | Form state management | Already in project, excellent performance, built-in validation |
| Zod | ^4.3.6 | Schema validation | Already in project, type-safe validation for Next.js |
| Prisma | ^7.3.0 | Database ORM | Already in project, type-safe DB operations |
| Next.js Server Actions | 15.5.10 | Form submission | Built into Next.js 15, serverless-friendly |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| use-debounce | ^10.x | Debounce autosave | Prevent excessive DB writes during typing |
| date-fns | ^4.1.0 | Timestamp formatting | Already in project, display "last saved" times |
| Radix UI Progress | latest | Progress bar UI | Already using Radix components in project |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-hook-form | SurveyJS | SurveyJS is feature-rich but adds 200KB+ bundle size and learning curve; overkill for fixed 60-question form |
| Prisma draft table | localStorage only | localStorage alone risks data loss; hybrid approach (localStorage + DB) is safest |
| Custom validation | React Bootstrap validation | Already using Radix UI + Tailwind, Bootstrap would add style conflicts |

**Installation:**
```bash
npm install use-debounce
# All other dependencies already installed
```

## Architecture Patterns

### Recommended Database Schema
```prisma
// Add to existing schema.prisma

model MbtiSurveyDraft {
  id         String   @id @default(cuid())
  studentId  String   @unique
  responses  Json     // { "1": 3, "2": 5, ... } question_id: answer_value
  progress   Int      @default(0) // Number of answered questions
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  student    Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@index([studentId])
}

model MbtiAnalysis {
  id             String   @id @default(cuid())
  studentId      String   @unique
  responses      Json     // Full response data { "1": 3, "2": 5, ... }
  result         Json     // { e: 12, i: 3, s: 8, n: 7, t: 10, f: 5, j: 11, p: 4 }
  mbtiType       String   // "ENTJ"
  percentages    Json     // { E: 80, I: 20, S: 53, N: 47, T: 67, F: 33, J: 73, P: 27 }
  interpretation String?  // Long-form Korean description
  version        Int      @default(1)
  calculatedAt   DateTime
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  student        Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
}
```

### Recommended Project Structure
```
src/
├── app/(dashboard)/students/[id]/mbti/
│   ├── page.tsx                 # Survey form page
│   ├── actions.ts               # Server actions (save draft, submit)
│   └── results/page.tsx         # Results display page
├── lib/
│   ├── actions/mbti-survey.ts   # Core server actions
│   ├── analysis/mbti-scoring.ts # Scoring algorithm
│   └── hooks/use-mbti-autosave.ts # Autosave hook
├── components/mbti/
│   ├── survey-form.tsx          # Main form component
│   ├── question-group.tsx       # Dimension group (E/I, S/N, etc.)
│   ├── progress-indicator.tsx   # Progress bar + percent
│   ├── results-display.tsx      # Type + percentages + description
│   └── keyboard-shortcuts.tsx   # 1-5 key handler
└── data/mbti/
    ├── questions.json           # 60 questions in Korean
    └── descriptions.json        # Type descriptions, strengths, careers
```

### Pattern 1: Autosave with Debounce
**What:** Save form draft to DB every 2-3 seconds after user stops typing
**When to use:** Long forms where users may interrupt and resume later
**Example:**
```typescript
// Source: https://github.com/damyantjain/use-form-auto-save
import { useEffect } from 'react'
import { useDebounce } from 'use-debounce'
import { useFormContext } from 'react-hook-form'

export function useMbtiAutosave(studentId: string, onSave: (data: any) => Promise<void>) {
  const { watch } = useFormContext()
  const formData = watch()
  const [debouncedData] = useDebounce(formData, 2000) // 2 second debounce

  useEffect(() => {
    if (Object.keys(debouncedData).length > 0) {
      onSave(debouncedData).catch(console.error)
    }
  }, [debouncedData, onSave])
}
```

### Pattern 2: Progress Tracking
**What:** Count answered questions and display percentage bar
**When to use:** Multi-question surveys to show completion status
**Example:**
```typescript
// Source: Material Tailwind progress bar pattern
function calculateProgress(responses: Record<string, number>, totalQuestions: number) {
  const answeredCount = Object.keys(responses).length
  const percentage = Math.round((answeredCount / totalQuestions) * 100)
  return { answeredCount, totalQuestions, percentage }
}

// In component:
const { answeredCount, totalQuestions, percentage } = calculateProgress(responses, 60)
return (
  <div className="space-y-2">
    <div className="flex justify-between text-sm">
      <span>진행률</span>
      <span>{answeredCount}/{totalQuestions} ({percentage}%)</span>
    </div>
    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
      <div
        className="h-full bg-blue-600 transition-all duration-300"
        style={{ width: `${percentage}%` }}
      />
    </div>
  </div>
)
```

### Pattern 3: MBTI Scoring Algorithm
**What:** Calculate dimension scores and determine MBTI type
**When to use:** After all 60 questions are answered (15 per dimension)
**Example:**
```typescript
// Source: MBTI scoring methodology (Medium article)
type DimensionScores = {
  e: number, i: number,
  s: number, n: number,
  t: number, f: number,
  j: number, p: number
}

function scoreMbti(responses: Record<string, number>): {
  scores: DimensionScores
  mbtiType: string
  percentages: Record<string, number>
} {
  // Map question IDs to dimensions (1-15: E/I, 16-30: S/N, 31-45: T/F, 46-60: J/P)
  const dimensionMap = {
    e: Array.from({length: 15}, (_, i) => i + 1).filter(n => n % 2 === 1), // Odd questions
    i: Array.from({length: 15}, (_, i) => i + 1).filter(n => n % 2 === 0), // Even questions
    // ... similar for s/n, t/f, j/p
  }

  // Sum scores per dimension (1-5 scale)
  const scores: DimensionScores = {
    e: 0, i: 0, s: 0, n: 0, t: 0, f: 0, j: 0, p: 0
  }

  for (const [qid, score] of Object.entries(responses)) {
    const id = parseInt(qid)
    // Add score to appropriate dimension based on mapping
    // E.g., if Q1 maps to E, add score to scores.e
  }

  // Calculate percentages
  const eTotal = scores.e + scores.i
  const sTotal = scores.s + scores.n
  const tTotal = scores.t + scores.f
  const jTotal = scores.j + scores.p

  const percentages = {
    E: Math.round((scores.e / eTotal) * 100),
    I: Math.round((scores.i / eTotal) * 100),
    S: Math.round((scores.s / sTotal) * 100),
    N: Math.round((scores.n / sTotal) * 100),
    T: Math.round((scores.t / tTotal) * 100),
    F: Math.round((scores.f / tTotal) * 100),
    J: Math.round((scores.j / jTotal) * 100),
    P: Math.round((scores.p / jTotal) * 100),
  }

  // Determine type (higher score wins)
  const mbtiType = [
    scores.e >= scores.i ? 'E' : 'I',
    scores.s >= scores.n ? 'S' : 'N',
    scores.t >= scores.f ? 'T' : 'F',
    scores.j >= scores.p ? 'J' : 'P',
  ].join('')

  return { scores, mbtiType, percentages }
}
```

### Pattern 4: Unsaved Changes Warning
**What:** Warn user before leaving page with unsaved changes
**When to use:** Forms with manual save or significant data loss risk
**Example:**
```typescript
// Source: https://dev.to/juanmtorrijos/how-to-add-the-changes-you-made-may-not-be-saved-warning
import { useEffect } from 'react'
import { useFormState } from 'react-hook-form'

export function useUnsavedChangesWarning(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = '' // Chrome requires returnValue to be set
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [enabled])
}

// In component:
const { isDirty } = useFormState()
useUnsavedChangesWarning(isDirty)
```

### Anti-Patterns to Avoid
- **Saving on every keystroke:** Use debouncing (2-3 seconds) to avoid DB hammering
- **localStorage only:** Add DB persistence for reliability (hybrid approach best)
- **Global state for 60 questions:** react-hook-form handles local state efficiently
- **Custom validation logic:** Use Zod schemas that match Prisma models
- **Manual progress calculation in JSX:** Compute once, memoize with useMemo

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form state management | Custom useState for 60 fields | react-hook-form | Handles validation, dirty tracking, performance optimizations automatically |
| Debouncing autosave | Custom setTimeout/clearTimeout | use-debounce library | Edge cases (component unmount, rapid changes) already handled |
| Progress bar animation | Custom CSS keyframes | Tailwind width transition | Smooth transitions with `transition-all duration-300` |
| Keyboard shortcuts | Document event listeners | Radix UI or custom hook with proper cleanup | Accessibility, focus management, event delegation complexities |
| Validation error display | Manual error state per field | react-hook-form errors + Zod | Type-safe, automatic error mapping |
| MBTI type descriptions | Hardcoded strings in components | JSON data file | Maintainability, i18n-ready, reusable |

**Key insight:** Survey forms involve complex state interactions (validation, dirty tracking, autosave timing, progress updates). Libraries like react-hook-form encapsulate years of edge-case handling. Custom solutions will miss scenarios like: form reset after submit, validation during autosave, concurrent user input during save, browser back button handling.

## Common Pitfalls

### Pitfall 1: Autosave During Validation Errors
**What goes wrong:** Saving invalid/incomplete data to database during intermediate states
**Why it happens:** Autosave triggers on debounce without checking validation status
**How to avoid:**
- Accept drafts with any completion level (don't validate on autosave)
- Only validate on final submit
- Store responses as JSON object; missing keys = unanswered
**Warning signs:** "Draft saved" message appears but data looks incomplete on reload

### Pitfall 2: Race Conditions Between Autosave and Submit
**What goes wrong:** User clicks submit while autosave is still pending, causing duplicate saves or data loss
**Why it happens:** Debounced autosave and submit action run concurrently
**How to avoid:**
```typescript
const [isSaving, setIsSaving] = useState(false)

async function handleSubmit(data: FormData) {
  setIsSaving(true)
  // Cancel any pending autosave
  cancelDebounce()
  // Perform final save
  await submitSurvey(data)
  setIsSaving(false)
}
```
**Warning signs:** Users report "survey submitted twice" or final answers differ from submitted answers

### Pitfall 3: Progress Calculation Including Unanswered Questions
**What goes wrong:** Progress shows 100% when only some questions answered due to default values
**Why it happens:** react-hook-form registers all fields, defaulting to undefined/null
**How to avoid:**
- Only count keys present in responses object: `Object.keys(responses).length`
- Don't use defaultValues for survey questions
- Filter out null/undefined values when calculating progress
**Warning signs:** Progress bar reaches 100% immediately on page load

### Pitfall 4: Lost Keyboard Shortcuts Due to Input Focus
**What goes wrong:** Pressing 1-5 keys types into focused input instead of selecting answer
**Why it happens:** Radio buttons are wrapped in labels/divs that consume keyboard events
**How to avoid:**
- Use `keydown` on form container, not individual inputs
- Check `e.target.tagName` to ensure not typing in text field
- Implement focus management: after keyboard selection, focus next question group
**Warning signs:** Users complain "keyboard shortcuts don't work"

### Pitfall 5: MBTI Scoring Misalignment
**What goes wrong:** Questions not mapped correctly to dimensions, resulting in wrong MBTI type
**Why it happens:** Hardcoded question-to-dimension mapping gets out of sync with questions.json
**How to avoid:**
- Store dimension metadata in questions.json: `{ id: 1, dimension: 'E', text: '...' }`
- Generate scoring map from questions data, not hardcoded arrays
- Write unit tests for scoring with known inputs/outputs
**Warning signs:** Same answers produce different MBTI types across sessions

### Pitfall 6: beforeunload Not Working for SPA Navigation
**What goes wrong:** Warning dialog doesn't appear when navigating to another page within app
**Why it happens:** Next.js client-side navigation doesn't trigger beforeunload event
**How to avoid:**
- Use Next.js router events for in-app navigation warnings
- Only use beforeunload for browser tab close/refresh
- For this phase: The context specifies "페이지 이동 시 '작성 중인 내용이 저장됩니다' 확인 창" - since autosave is enabled, show informational message ("저장됨") rather than blocking warning
**Warning signs:** Users report lost data after clicking sidebar links

## Code Examples

Verified patterns from official sources:

### Server Action: Save Draft
```typescript
// Source: Next.js 15 Server Actions documentation
"use server"

import { db } from "@/lib/db"
import { verifySession } from "@/lib/dal"
import { revalidatePath } from "next/cache"

export async function saveMbtiDraft(
  studentId: string,
  responses: Record<string, number>
) {
  const session = await verifySession()

  // Ensure teacher owns this student
  const student = await db.student.findFirst({
    where: { id: studentId, teacherId: session.userId },
    select: { id: true }
  })

  if (!student) {
    throw new Error("학생을 찾을 수 없어요.")
  }

  const progress = Object.keys(responses).length

  await db.mbtiSurveyDraft.upsert({
    where: { studentId },
    create: {
      studentId,
      responses,
      progress,
    },
    update: {
      responses,
      progress,
      updatedAt: new Date(),
    },
  })

  return { success: true, progress }
}
```

### Client Component: Survey Form
```typescript
// Source: Next.js form patterns + react-hook-form best practices
"use client"

import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMbtiAutosave } from "@/lib/hooks/use-mbti-autosave"
import { saveMbtiDraft } from "./actions"

const surveySchema = z.object({
  responses: z.record(z.string(), z.number().min(1).max(5))
})

type SurveyData = z.infer<typeof surveySchema>

export function MbtiSurveyForm({
  studentId,
  initialDraft
}: {
  studentId: string
  initialDraft?: Record<string, number>
}) {
  const methods = useForm<SurveyData>({
    resolver: zodResolver(surveySchema),
    defaultValues: {
      responses: initialDraft || {}
    }
  })

  // Autosave draft every 2 seconds
  useMbtiAutosave(studentId, async (data) => {
    await saveMbtiDraft(studentId, data.responses)
  })

  const onSubmit = async (data: SurveyData) => {
    // Calculate scores and save final analysis
    await submitMbtiSurvey(studentId, data.responses)
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        {/* Question groups */}
        <ProgressIndicator responses={methods.watch('responses')} total={60} />
        <QuestionGroup dimension="E/I" questions={questions.slice(0, 15)} />
        {/* ... more groups */}
        <button type="submit" disabled={methods.formState.isSubmitting}>
          제출
        </button>
      </form>
    </FormProvider>
  )
}
```

### Validation: Highlight Unanswered Required Questions
```typescript
// Source: React form validation patterns + Tailwind CSS
import { useFormContext } from "react-hook-form"

export function QuestionItem({
  questionId,
  questionText
}: {
  questionId: number
  questionText: string
}) {
  const { watch, setValue, formState } = useFormContext()
  const responses = watch('responses')
  const answered = responses?.[questionId] !== undefined
  const showError = formState.isSubmitted && !answered

  return (
    <div className={`p-4 rounded-lg border ${
      showError ? 'border-red-500 bg-red-50' : 'border-gray-200'
    }`}>
      <p className="mb-3">{questionText}</p>
      {showError && (
        <p className="text-sm text-red-600 mb-2">이 문항에 답해주세요.</p>
      )}
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(value => (
          <label key={value} className="cursor-pointer">
            <input
              type="radio"
              name={`q-${questionId}`}
              value={value}
              checked={responses?.[questionId] === value}
              onChange={() => setValue(`responses.${questionId}`, value, { shouldDirty: true })}
              className="sr-only peer"
            />
            <div className="w-10 h-10 flex items-center justify-center rounded-full border-2 peer-checked:border-blue-600 peer-checked:bg-blue-100">
              {value}
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}
```

### Keyboard Shortcuts: 1-5 Keys
```typescript
// Source: React keyboard event handling patterns
import { useEffect } from "react"
import { useFormContext } from "react-hook-form"

export function KeyboardShortcuts({ currentQuestionId }: { currentQuestionId: number }) {
  const { setValue } = useFormContext()

  useEffect(() => {
    function handleKeyPress(e: KeyboardEvent) {
      // Ignore if typing in input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      const key = parseInt(e.key)
      if (key >= 1 && key <= 5) {
        setValue(`responses.${currentQuestionId}`, key, { shouldDirty: true })
        e.preventDefault()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentQuestionId, setValue])

  return null
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| localStorage-only drafts | Hybrid localStorage + DB | 2024-2025 | Better reliability, cross-device support |
| Multi-page surveys (page per question) | Single-page with scroll | 2023-2024 | Better UX, simpler state management |
| Custom form state (useState) | react-hook-form | 2022-2023 | Performance, validation, dirty tracking |
| Manual debouncing (setTimeout) | use-debounce library | 2023-2024 | Cleaner code, fewer edge case bugs |
| SurveyJS for all surveys | react-hook-form for simple forms | 2024-2025 | Bundle size reduction for fixed surveys |

**Deprecated/outdated:**
- **React Router v5 Prompt component:** React Router v6 uses `unstable_useBlocker` (still experimental); for Next.js use beforeunload + router events
- **window.onbeforeunload assignment:** Modern approach uses addEventListener for better cleanup
- **Formik:** react-hook-form is now the community standard (better performance, smaller bundle)

## Open Questions

Things that couldn't be fully resolved:

1. **Official MBTI Korean questions availability**
   - What we know: Official MBTI Form M exists in Korean through Assesta (Korean distributor)
   - What's unclear: Questions are copyrighted and not publicly available
   - Recommendation:
     - Option A: License official questions from Assesta
     - Option B: Use validated open-source alternatives (16Personalities questions)
     - Option C: Create custom questions based on MBTI dimensions (note in UI: "MBTI 기반 성향 검사")
   - **For planning:** Assume questions.json will exist with 60 items, defer sourcing to implementation

2. **MBTI result interpretation depth**
   - What we know: Context specifies showing type description, strengths, weaknesses, learning styles, careers, famous people
   - What's unclear: Source for comprehensive Korean descriptions
   - Recommendation: Use 16personalities.com Korean content as baseline, supplement with local sources
   - **For planning:** Create descriptions.json structure with all required fields

3. **Cross-device draft sync**
   - What we know: Drafts stored in DB (server-side)
   - What's unclear: Does this need real-time sync if teacher switches devices mid-survey?
   - Recommendation: Not needed for v1; single-device session is primary use case
   - **For planning:** Design supports it (DB-backed), no special sync logic required

4. **MBTI validity/reliability concerns**
   - What we know: MBTI has limited psychometric validity compared to Big Five
   - What's unclear: Should UI include disclaimers about test limitations?
   - Recommendation: Add brief disclaimer: "참고용 성향 검사 결과입니다. 전문적인 심리 평가는 자격을 갖춘 전문가와 상담하세요."
   - **For planning:** Include disclaimer text in results display

## Sources

### Primary (HIGH confidence)
- [Next.js 15 Forms Guide](https://nextjs.org/docs/app/guides/forms) - Server Actions, validation, form state
- [react-hook-form Documentation](https://react-hook-form.com/) - Form state management patterns
- Project codebase Phase 3 (`calculation-analysis.ts`, `schema.prisma`) - Existing analysis storage patterns

### Secondary (MEDIUM confidence)
- [SurveyJS Save and Restore Progress](https://surveyjs.io/form-library/documentation/how-to-save-and-restore-incomplete-survey) - Draft saving patterns
- [use-form-auto-save GitHub](https://github.com/damyantjain/use-form-auto-save) - Autosave implementation
- [Material Tailwind Progress Bar](https://www.material-tailwind.com/docs/react/progress-bar) - Progress UI components
- [MBTI Scoring Methodology](https://asaddigital1.medium.com/story-behind-mbtis-result-calculation-formula-to-mbti-af264e543bc5) - Scoring algorithm details
- [React Unsaved Changes Warning](https://dev.to/juanmtorrijos/how-to-add-the-changes-you-made-may-not-be-saved-warning) - beforeunload patterns

### Tertiary (LOW confidence)
- [16Personalities](https://www.16personalities.com/) - MBTI type descriptions (not official MBTI)
- [MBTI Korea Technical Brief](https://www.themyersbriggs.com/-/media/Myers-Briggs/Files/Manual-Supplements/MBTI-Global-Manual-Tech-Brief-KOR.pdf) - Official Korean MBTI info (questions not included)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in project or widely adopted
- Architecture: HIGH - Patterns follow existing Phase 3 structure, Next.js 15 best practices
- MBTI scoring algorithm: MEDIUM - Algorithm methodology verified, but question-to-dimension mapping needs validation
- MBTI question content: LOW - Official questions are proprietary, need to determine source
- Draft saving patterns: HIGH - Multiple sources confirm DB + localStorage hybrid approach

**Research date:** 2026-01-29
**Valid until:** 2026-03-29 (60 days - stable domain, unlikely to change rapidly)

**Key assumptions for planning:**
1. questions.json will contain 60 items with metadata (id, dimension, text, description)
2. descriptions.json will contain all 16 MBTI type descriptions with required fields
3. Scoring follows standard MBTI methodology (sum scores per pole, higher wins)
4. Teachers complete survey in single session (cross-device sync not required)
5. Draft data can be partial/incomplete (no validation until submit)
