# Phase 12: Teacher Analysis & Team Data Access - Research

**Researched:** 2026-01-30
**Domain:** Teacher analysis system, module reuse, UI patterns
**Confidence:** HIGH

## Summary

This phase focuses on implementing teacher personality analysis (MBTI, saju, name analysis, face reading, palm reading) by **reusing existing student analysis modules**. The research reveals extensive reusable infrastructure:

1. **Analysis libraries are pure functions** - `src/lib/analysis/saju.ts`, `name-numerology.ts`, `mbti-scoring.ts` contain business logic independent of student/teacher context
2. **Prisma schema patterns are mirror-able** - Student analysis tables (SajuAnalysis, NameAnalysis, MbtiAnalysis, FaceAnalysis, PalmAnalysis) provide exact templates for TeacherAnalysis
3. **UI components are context-agnostic** - Analysis panels (SajuAnalysisPanel, MbtiAnalysisPanel, etc.) accept typed props and can work with teacher data
4. **AI image analysis is reusable** - `analyzeFaceImage` and `analyzePalmImage` actions work with any imageUrl parameter
5. **Authentication patterns are established** - Phase 11 implemented RBAC with role-based session management

**Primary recommendation:** Create teacher-specific Prisma models (TeacherSajuAnalysis, TeacherMbtiAnalysis, etc.) but reuse all calculation libraries, UI components, and API action patterns. Only the data layer and teacher-specific validation need new code.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **Prisma** | Latest | ORM for teacher analysis tables | Existing Student models provide exact schema pattern |
| **Next.js Server Actions** | 15 | API endpoints for teacher analysis | Same pattern as student analysis (`runSajuAnalysis`, `analyzeFaceImage`) |
| **React Server Components** | Latest | Teacher profile page layout | Matches student detail page structure |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **Recharts** | Latest | Visualization (if needed) | Student MBTI charts use Recharts - reuse for teachers |
| **date-fns** | Latest | Date formatting | Already used in student panels |
| **shadcn/ui** | Latest | UI components | Cards, buttons, badges already in student panels |

### Analysis Libraries (REUSE - No Installation Needed)
| Library | Location | Purpose | Reuse Strategy |
|---------|----------|---------|----------------|
| **Saju calculator** | `src/lib/analysis/saju.ts` | 사주 분석 계산 | Pure function - call with teacher.birthDate |
| **Name numerology** | `src/lib/analysis/name-numerology.ts` | 성명학 분석 | Pure function - call with teacher.name |
| **MBTI scoring** | `src/lib/analysis/mbti-scoring.ts` | MBTI 점수 계산 | Pure function - reuse 60-question survey logic |
| **Hanja strokes** | `src/lib/analysis/hanja-strokes.ts` | 한자 획수 조회 | Reuse for teacher name hanja selection |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Reuse existing libraries | Duplicate logic for teachers | **Don't duplicate** - libraries are pure functions with no student coupling |
| Separate TeacherAnalysis table | Share Student table | **Separated is better** - clear domain boundaries, different lifecycle/permissions |

**Installation:**
```bash
# No new packages needed - all libraries already installed
# Prisma schema changes require migration:
npx prisma migrate dev --name teacher_analysis
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── db/
│   │   ├── teacher-analysis.ts      # NEW: TeacherAnalysis CRUD
│   │   ├── teacher-saju-analysis.ts # NEW: Mirror of student-analysis.ts
│   │   ├── teacher-name-analysis.ts # NEW: Mirror of student-analysis.ts
│   │   └── teacher-mbti-analysis.ts  # NEW: Mirror of mbti-analysis.ts
│   ├── actions/
│   │   └── teacher-analysis.ts       # NEW: Server actions (runTeacherSajuAnalysis)
│   └── analysis/
│       ├── saju.ts                    # REUSE: No changes needed
│       ├── name-numerology.ts         # REUSE: No changes needed
│       └── mbti-scoring.ts            # REUSE: No changes needed
├── components/
│   ├── teachers/
│   │   ├── teacher-saju-panel.tsx     # NEW: Copy from SajuAnalysisPanel
│   │   ├── teacher-mbti-panel.tsx     # NEW: Copy from MbtiAnalysisPanel
│   │   ├── teacher-face-panel.tsx     # NEW: Copy from FaceAnalysisPanel
│   │   ├── teacher-palm-panel.tsx     # NEW: Copy from PalmAnalysisPanel
│   │   └── teacher-analysis-status.tsx # NEW: Show completion status
│   └── mbti/
│       └── results-display.tsx        # REUSE: Accepts MbtiAnalysisData, no student coupling
└── app/
    └── (dashboard)/
        └── teachers/
            └── [id]/
                └── page.tsx           # NEW: Teacher profile with analysis panels
```

### Pattern 1: Prisma Schema Mirroring
**What:** Create Teacher*Analysis models identical to Student*Analysis models
**When to use:** Database layer for teacher analysis data
**Example:**
```prisma
// Current Student models (reference)
model SajuAnalysis {
  id             String   @id @default(cuid())
  studentId      String   @unique
  inputSnapshot  Json
  result         Json
  interpretation String?
  status         String   @default("complete")
  version        Int      @default(1)
  calculatedAt   DateTime
  student        Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
}

// NEW: Teacher models (mirror)
model TeacherSajuAnalysis {
  id             String   @id @default(cuid())
  teacherId      String   @unique
  inputSnapshot  Json
  result         Json
  interpretation String?
  status         String   @default("complete")
  version        Int      @default(1)
  calculatedAt   DateTime
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  teacher        Teacher  @relation(fields: [teacherId], references: [id], onDelete: Cascade)
}

model TeacherMbtiAnalysis {
  id           String   @id @default(cuid())
  teacherId    String   @unique
  responses    Json
  scores       Json
  mbtiType     String
  percentages  Json
  interpretation String?
  version      Int      @default(1)
  calculatedAt DateTime
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  teacher      Teacher  @relation(fields: [teacherId], references: [id], onDelete: Cascade)
}

model TeacherNameAnalysis {
  id             String   @id @default(cuid())
  teacherId      String   @unique
  inputSnapshot  Json
  result         Json
  interpretation String?
  status         String   @default("complete")
  version        Int      @default(1)
  calculatedAt   DateTime
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  teacher        Teacher  @relation(fields: [teacherId], references: [id], onDelete: Cascade)
}

model TeacherFaceAnalysis {
  id           String   @id @default(cuid())
  teacherId    String   @unique
  imageUrl     String
  result       Json
  status       String   @default("complete")
  errorMessage String?
  version      Int      @default(1)
  analyzedAt   DateTime
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  teacher      Teacher  @relation(fields: [teacherId], references: [id], onDelete: Cascade)
}

model TeacherPalmAnalysis {
  id           String   @id @default(cuid())
  teacherId    String   @unique
  hand         String
  imageUrl     String
  result       Json
  status       String   @default("complete")
  errorMessage String?
  version      Int      @default(1)
  analyzedAt   DateTime
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  teacher      Teacher  @relation(fields: [teacherId], references: [id], onDelete: Cascade)
}

// Update Teacher model with relations
model Teacher {
  // ... existing fields
  teacherSajuAnalysis    TeacherSajuAnalysis?
  teacherMbtiAnalysis    TeacherMbtiAnalysis?
  teacherNameAnalysis    TeacherNameAnalysis?
  teacherFaceAnalysis    TeacherFaceAnalysis?
  teacherPalmAnalysis    TeacherPalmAnalysis?
}
```

**Source:** `/mnt/data/projects/ai/ai-afterschool/prisma/schema.prisma` lines 84-137

### Pattern 2: Server Actions for Teacher Analysis
**What:** Create teacher-specific Server Actions following student pattern
**When to use:** API endpoints for teacher analysis operations
**Example:**
```typescript
// src/lib/actions/teacher-analysis.ts (NEW)
"use server"

import { revalidatePath } from "next/cache"
import { verifySession } from "@/lib/dal"
import { db } from "@/lib/db"
import {
  calculateSaju,
  generateSajuInterpretation,
} from "@/lib/analysis/saju"  // REUSE
import {
  calculateNameNumerology,
  generateNameInterpretation,
} from "@/lib/analysis/name-numerology"  // REUSE

// Mirror of runSajuAnalysis but for teachers
export async function runTeacherSajuAnalysis(teacherId: string) {
  const session = await verifySession()

  // Only own account access
  if (session.userId !== teacherId) {
    throw new Error("본인의 분석만 실행할 수 있어요.")
  }

  const teacher = await db.teacher.findUnique({
    where: { id: teacherId },
    select: {
      id: true,
      birthDate: true,  // Need to add birthDate to Teacher model
      birthTimeHour: true,  // Optional: add if supporting birth time
      birthTimeMinute: true,
    },
  })

  if (!teacher) {
    throw new Error("선생님을 찾을 수 없어요.")
  }

  // REUSE: Same calculation logic as student
  const result = calculateSaju({
    birthDate: teacher.birthDate,
    time: teacher.birthTimeHour ? {
      hour: teacher.birthTimeHour,
      minute: teacher.birthTimeMinute ?? 0,
    } : null,
    longitude: 127.0,
  })
  const interpretation = generateSajuInterpretation(result)

  const inputSnapshot = {
    birthDate: teacher.birthDate.toISOString(),
    timeKnown: Boolean(teacher.birthTimeHour),
    time: teacher.birthTimeHour ? {
      hour: teacher.birthTimeHour,
      minute: teacher.birthTimeMinute ?? 0,
    } : null,
    longitude: 127.0,
  }

  // Save to TeacherSajuAnalysis (mirrors upsertSajuAnalysis)
  await db.teacherSajuAnalysis.upsert({
    where: { teacherId },
    create: {
      teacherId,
      inputSnapshot,
      result,
      interpretation,
      calculatedAt: new Date(),
    },
    update: {
      inputSnapshot,
      result,
      interpretation,
      calculatedAt: new Date(),
    },
  })

  revalidatePath(`/teachers/${teacherId}`)
  return { result, interpretation }
}
```

**Source:** `/mnt/data/projects/ai/ai-afterschool/src/lib/actions/calculation-analysis.ts` lines 96-144

### Pattern 3: Reusable Analysis Panels with Type Adaptation
**What:** Copy student panel components and adapt types for teachers
**When to use:** UI components for displaying teacher analysis
**Example:**
```typescript
// src/components/teachers/teacher-saju-panel.tsx (NEW)
"use client"

import { useState, useTransition } from "react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { runTeacherSajuAnalysis } from "@/lib/actions/teacher-analysis"
import type { SajuResult } from "@/lib/analysis/saju"  // REUSE type
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type TeacherSajuAnalysisPanelProps = {
  teacher: {
    id: string
    name: string
    birthDate: Date | string
    birthTimeHour: number | null
    birthTimeMinute: number | null
  }
  analysis: {
    result: unknown
    interpretation: string | null
    calculatedAt: Date | string
  } | null
}

// Component is nearly identical to SajuAnalysisPanel
// Only props and action call differ
export function TeacherSajuAnalysisPanel({ teacher, analysis }: TeacherSajuAnalysisPanelProps) {
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const result = analysis?.result as SajuResult | undefined

  return (
    <Card>
      <CardHeader>
        <CardTitle>사주 분석</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Same structure as student panel */}
        <Button
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              try {
                await runTeacherSajuAnalysis(teacher.id)
              } catch (error) {
                setErrorMessage("사주 분석 실행에 실패했어요.")
              }
            })
          }}
        >
          {isPending ? "분석 중..." : "사주 분석 실행"}
        </Button>

        {result && (
          <div className="grid gap-3 rounded-md border p-4 text-sm">
            {/* Display saju pillars - same as student */}
            <div>Saju result display...</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

**Source:** `/mnt/data/projects/ai/ai-afterschool/src/components/students/saju-analysis-panel.tsx` lines 1-157

### Pattern 4: Teacher Profile Page (Mirrors Student Detail)
**What:** Single-page scroll layout with all analysis panels
**When to use:** Main teacher profile view
**Example:**
```typescript
// src/app/(dashboard)/teachers/[id]/page.tsx (NEW)
import { notFound } from "next/navigation"
import { verifySession } from "@/lib/dal"
import { db } from "@/lib/db"
import { TeacherSajuAnalysisPanel } from "@/components/teachers/teacher-saju-panel"
import { TeacherMbtiAnalysisPanel } from "@/components/teachers/teacher-mbti-panel"
import { TeacherFaceAnalysisPanel } from "@/components/teachers/teacher-face-panel"
import { TeacherPalmAnalysisPanel } from "@/components/teachers/teacher-palm-panel"

export default async function TeacherPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await verifySession()

  // Only allow viewing own profile or admins viewing others
  const isOwnProfile = session.userId === id
  const canView = session.role === 'DIRECTOR' || session.role === 'TEAM_LEADER' || isOwnProfile

  if (!canView) {
    return <div>권한이 없습니다.</div>
  }

  const teacher = await db.teacher.findUnique({
    where: { id },
    include: {
      teacherSajuAnalysis: true,
      teacherMbtiAnalysis: true,
      teacherNameAnalysis: true,
      teacherFaceAnalysis: true,
      teacherPalmAnalysis: true,
    },
  })

  if (!teacher) {
    notFound()
  }

  const faceImageUrl = teacher.teacherFaceAnalysis?.imageUrl || null
  const palmImageUrl = teacher.teacherPalmAnalysis?.imageUrl || null

  return (
    <div className="space-y-6">
      {/* Teacher header card */}
      <div className="rounded-lg border bg-white p-6">
        <h1 className="text-2xl font-bold">{teacher.name}</h1>
        <p className="text-gray-500">
          {teacher.role} · {teacher.team?.name || '팀 없음'}
        </p>
      </div>

      {/* Analysis panels - same structure as student page */}
      <TeacherSajuAnalysisPanel
        teacher={teacher}
        analysis={teacher.teacherSajuAnalysis}
      />
      <TeacherNameAnalysisPanel
        teacher={teacher}
        analysis={teacher.teacherNameAnalysis}
      />
      <TeacherMbtiAnalysisPanel
        teacherId={teacher.id}
        teacherName={teacher.name}
        analysis={teacher.teacherMbtiAnalysis}
      />
      {faceImageUrl && (
        <TeacherFaceAnalysisPanel
          teacherId={teacher.id}
          analysis={teacher.teacherFaceAnalysis}
          faceImageUrl={faceImageUrl}
        />
      )}
      {palmImageUrl && (
        <TeacherPalmAnalysisPanel
          teacherId={teacher.id}
          analysis={teacher.teacherPalmAnalysis}
          palmImageUrl={palmImageUrl}
        />
      )}
    </div>
  )
}
```

**Source:** `/mnt/data/projects/ai/ai-afterschool/src/app/(dashboard)/students/[id]/page.tsx` lines 1-129

### Anti-Patterns to Avoid
- **Duplicating analysis logic:** Don't copy `calculateSaju()` or `scoreMbti()` - they're pure functions
- **Creating new visualization libraries:** Reuse `DimensionBar`, `MbtiResultsDisplay` - they accept typed props
- **Separate authentication flow:** Teacher analysis uses same `verifySession()` as student operations
- **Ignoring RBAC:** Teacher profile viewing must respect Phase 11 RBAC rules

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| MBTI scoring | Custom score calculation | `src/lib/analysis/mbti-scoring.ts` | Handles 60 questions, percentages, edge cases |
| Saju pillars | Calculate ganji manually | `src/lib/analysis/saju.ts` | DST correction, solar terms, longitude adjustment |
| Name strokes | Manual stroke lookup | `src/lib/analysis/hanja-strokes.ts` | 3000+ hanja database already built |
| MBTI visualization | Custom chart library | `src/components/mbti/dimension-bar.tsx` | Recharts integration, responsive design |
| Image upload | Direct Cloudinary API | `src/lib/actions/student-images.ts` | Resize, validation, error handling already there |
| Analysis status | Custom badge logic | `src/components/students/student-analysis-status.tsx` | Handles stale detection, date formatting |

**Key insight:** The student analysis system already abstracted business logic into pure functions. These functions have no coupling to Student models and can be called with teacher data directly. Building teacher-specific versions would duplicate 2000+ lines of tested code.

## Common Pitfalls

### Pitfall 1: Forgetting to Add Teacher Model Relations
**What goes wrong:** Prisma schema updated but Teacher model missing relations
**Why it happens:** Focus on creating Teacher*Analysis models, forget to update Teacher model
**How to avoid:** Add all five relations to Teacher model in same migration
**Warning signs:** Prisma compile errors, `teacher.teacherSajuAnalysis` returns undefined

```prisma
// MUST add to Teacher model:
model Teacher {
  // ... existing fields
  teacherSajuAnalysis    TeacherSajuAnalysis?
  teacherMbtiAnalysis    TeacherMbtiAnalysis?
  teacherNameAnalysis    TeacherNameAnalysis?
  teacherFaceAnalysis    TeacherFaceAnalysis?
  teacherPalmAnalysis    TeacherPalmAnalysis?
}
```

### Pitfall 2: Breaking Pure Function Assumption
**What goes wrong:** Adding teacher-specific logic to `calculateSaju()` or similar
**Why it happens:** Wanting to customize interpretation for teachers
**How to avoid:** Keep library functions pure, add teacher-specific interpretation in action layer
**Warning signs:** Modifying files in `src/lib/analysis/` for teacher feature

```typescript
// BAD: Modifying library for teacher
export function calculateSaju(input: SajuInput, isTeacher: boolean) {
  // Don't do this
}

// GOOD: Keep library pure, customize interpretation elsewhere
const result = calculateSaju(input)  // Pure function
const interpretation = isTeacher
  ? generateTeacherSajuInterpretation(result)  // New function
  : generateSajuInterpretation(result)  // Existing function
```

### Pitfall 3: Inconsistent RBAC Enforcement
**What goes wrong:** Teachers can view other teachers' analysis results
**Why it happens:** Reusing student actions without updating access control
**How to avoid:** Create teacher-specific actions that check `session.userId === teacherId`
**Warning signs:** Using student actions directly with teacher ID

### Pitfall 4: Missing Teacher Data Fields
**What goes wrong:** Saju/Name analysis requires `birthDate` or `nameHanja` but Teacher model lacks them
**Why it happens:** Student-specific fields not considered for teachers
**How to avoid:** Add required fields to Teacher model before implementing analysis
**Warning signs:** TypeScript errors accessing `teacher.birthDate`

```typescript
// Teacher model needs these fields for analysis:
model Teacher {
  // ... existing
  birthDate      DateTime?    // NEW: Required for saju
  birthTimeHour  Int?         // NEW: Optional, for time-based saju
  birthTimeMinute Int?        // NEW: Optional
  nameHanja      Json?        // NEW: Required for name analysis
}
```

### Pitfall 5: Copy-Paste Errors in Component Adaptation
**What goes wrong:** Copied student panel still references `student.id` instead of `teacher.id`
**Why it happens:** Mechanical copy-paste without careful rename
**How to avoid:** Use IDE rename refactoring, test each panel individually
**Warning signs:** Runtime errors "Cannot read property 'id' of undefined"

## Code Examples

Verified patterns from existing codebase:

### Running Saju Analysis (Server Action Pattern)
```typescript
// Source: /mnt/data/projects/ai/ai-afterschool/src/lib/actions/calculation-analysis.ts
export async function runSajuAnalysis(studentId: string) {
  const session = await verifySession()

  const student = await db.student.findFirst({
    where: { id: studentId, teacherId: session.userId },
    select: { id: true, birthDate: true, birthTimeHour: true, birthTimeMinute: true },
  })

  if (!student) {
    throw new Error("학생을 찾을 수 없어요.")
  }

  const result = calculateSaju({
    birthDate: student.birthDate,
    time: student.birthTimeHour === null ? null : {
      hour: student.birthTimeHour,
      minute: student.birthTimeMinute ?? 0,
    },
    longitude: 127.0,
  })

  const interpretation = generateSajuInterpretation(result)

  await saveSajuAnalysis(studentId, inputSnapshot, result, interpretation)

  return { result, interpretation }
}
```

### Analysis Panel Component Structure
```typescript
// Source: /mnt/data/projects/ai/ai-afterschool/src/components/students/saju-analysis-panel.tsx
export function SajuAnalysisPanel({ student, analysis }: SajuAnalysisPanelProps) {
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const result = analysis?.result as SajuResult | undefined

  return (
    <Card>
      <CardHeader>
        <CardTitle>사주 분석</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-600">1. 기본 정보</h3>
          <div className="rounded-md bg-gray-50 p-4 text-sm text-gray-700">
            <p>학생: {student.name}</p>
            <p>생년월일: {format(toDate(student.birthDate), "yyyy년 M월 d일")}</p>
          </div>
          <Button
            disabled={isPending}
            onClick={() => startTransition(async () => {
              await runSajuAnalysisAction(student.id)
            })}
          >
            {isPending ? "분석 중..." : "사주 분석 실행"}
          </Button>
        </div>

        {result && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-600">2. 사주 구조</h3>
            <div className="grid gap-3 rounded-md border p-4 text-sm">
              {/* Display pillars */}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

### Profile Page Data Fetching Pattern
```typescript
// Source: /mnt/data/projects/ai/ai-afterschool/src/app/(dashboard)/students/[id]/page.tsx
const student = await db.student.findFirst({
  where: { id, teacherId: session.userId },
  include: {
    images: true,
    sajuAnalysis: true,
    nameAnalysis: true,
    mbtiAnalysis: true,
    faceAnalysis: true,
    palmAnalysis: true,
    personalitySummary: true,
  },
})
```

### MBTI Results Display (Reusable Component)
```typescript
// Source: /mnt/data/projects/ai/ai-afterschool/src/components/mbti/results-display.tsx
export function MbtiResultsDisplay({ analysis }: { analysis: MbtiAnalysisData }) {
  const { mbtiType, percentages } = analysis
  const typeInfo = descriptions[mbtiType as keyof typeof descriptions]

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-4 rounded-2xl">
          <span className="text-4xl font-bold tracking-wider">{mbtiType}</span>
          <span className="text-lg font-medium">{typeInfo.name}</span>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
        <h3 className="font-semibold text-gray-700 mb-3">차원별 성향</h3>
        <DimensionBar
          leftLabel="외향"
          rightLabel="내향"
          leftCode="E"
          rightCode="I"
          leftPercent={percentages.E}
          rightPercent={percentages.I}
          dominant={percentages.E > percentages.I ? "left" : "right"}
        />
        {/* More dimension bars */}
      </div>
    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Mixed student/teacher concerns | Separated Teacher*Analysis models | Phase 12 (planned) | Clear domain boundaries, independent lifecycle |
| Duplicated analysis logic | Pure function libraries | Phase 3 | ~2000 lines of reusable code |
| Client-side filtering only | Server-side RBAC (Phase 11) | Phase 11 | Row-level security via PostgreSQL RLS |
| Manual status tracking | `StudentAnalysisStatus` component | Phase 3 | Reusable pattern for teachers |

**Current stack (as of 2026-01-30):**
- **Next.js 15** with App Router and Server Actions
- **Prisma** with PostgreSQL (RLS policies enabled)
- **shadcn/ui** for consistent component styling
- **Recharts** for data visualization
- **Anthropic Claude** for AI image analysis

**Deprecated/outdated:**
- **Client-side-only filtering:** Superseded by RLS policies in Phase 11
- **Mixed analysis models:** Student-only approach being extended to teachers

## Open Questions

1. **Teacher birthDate field**
   - What we know: Teacher model currently lacks `birthDate` field needed for saju analysis
   - What's unclear: Should birth date be required or optional for teachers?
   - Recommendation: Make optional (nullable), add validation that saju requires birth date

2. **Teacher MBTI survey flow**
   - What we know: Students use 60-question survey at `/students/[id]/mbti`
   - What's unclear: Should teachers use same 60-question survey or shorter version?
   - Recommendation: Reuse same survey for consistency, but allow "direct input" shortcut

3. **Analysis completion tracking**
   - What we know: Students have `calculationRecalculationNeeded` flag
   - What's unclear: Do teachers need recalculation tracking? (Inputs likely won't change)
   - Recommendation: Simpler approach - just track completion status without recalculation logic

4. **Team visibility of teacher analysis**
   - What we know: Phase 11 decisions say "basic info + analysis completion status" is public
   - What's unclear: Should analysis results be visible to other team leaders?
   - Recommendation: Implement per decision - only completion status visible, results require admin access

## Sources

### Primary (HIGH confidence)
- `/mnt/data/projects/ai/ai-afterschool/prisma/schema.prisma` - Complete database schema with Student*Analysis models
- `/mnt/data/projects/ai/ai-afterschool/src/lib/analysis/saju.ts` - Pure saju calculation logic (401 lines)
- `/mnt/data/projects/ai/ai-afterschool/src/lib/analysis/name-numerology.ts` - Pure name numerology logic (250 lines)
- `/mnt/data/projects/ai/ai-afterschool/src/lib/analysis/mbti-scoring.ts` - MBTI scoring engine (145 lines)
- `/mnt/data/projects/ai/ai-afterschool/src/lib/actions/calculation-analysis.ts` - Student analysis Server Actions pattern
- `/mnt/data/projects/ai/ai-afterschool/src/components/students/saju-analysis-panel.tsx` - Saju panel UI structure
- `/mnt/data/projects/ai/ai-afterschool/src/components/students/mbti-analysis-panel.tsx` - MBTI panel UI structure
- `/mnt/data/projects/ai/ai-afterschool/src/components/students/face-analysis-panel.tsx` - Face panel UI structure
- `/mnt/data/projects/ai/ai-afterschool/src/components/students/palm-analysis-panel.tsx` - Palm panel UI structure
- `/mnt/data/projects/ai/ai-afterschool/src/components/mbti/results-display.tsx` - Reusable MBTI visualization
- `/mnt/data/projects/ai/ai-afterschool/src/components/mbti/dimension-bar.tsx` - Reusable dimension bar chart

### Secondary (MEDIUM confidence)
- `/mnt/data/projects/ai/ai-afterschool/src/lib/db/student-analysis.ts` - Analysis CRUD patterns
- `/mnt/data/projects/ai/ai-afterschool/src/lib/db/face-analysis.ts` - Face analysis upsert pattern
- `/mnt/data/projects/ai/ai-afterschool/src/lib/db/palm-analysis.ts` - Palm analysis upsert pattern
- `/mnt/data/projects/ai/ai-afterschool/src/lib/actions/ai-image-analysis.ts` - AI image analysis actions (reuse for teachers)
- `/mnt/data/projects/ai/ai-afterschool/src/lib/actions/teachers.ts` - Teacher CRUD actions (RBAC pattern)
- `/mnt/data/projects/ai/ai-afterschool/src/lib/dal.ts` - Session verification and RBAC integration
- `/mnt/data/projects/ai/ai-afterschool/src/app/(dashboard)/students/[id]/page.tsx` - Student profile page structure

### Tertiary (LOW confidence)
- None - all research based on direct code analysis

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use, verified from package.json and imports
- Architecture: HIGH - Direct code analysis of 20+ files confirmed reusability
- Pitfalls: HIGH - Based on common patterns seen in Phase 11 implementation

**Research date:** 2026-01-30
**Valid until:** 30 days (stable codebase, existing patterns)

**Key findings summary:**
1. **2000+ lines of pure analysis logic** can be reused without modification
2. **5 Prisma models** need to be created (mirrors of Student*Analysis)
3. **5 UI components** need to be adapted (copy-paste with type changes)
4. **5 Server Actions** need to be created (mirrors of student actions)
5. **Teacher model** needs 4 new fields (birthDate, birthTimeHour, birthTimeMinute, nameHanja)
