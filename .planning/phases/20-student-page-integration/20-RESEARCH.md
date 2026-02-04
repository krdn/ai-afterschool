# Phase 20: Student Page Integration - Research

**Researched:** 2026-02-04
**Domain:** Next.js App Router, React Server Components, Prisma ORM
**Confidence:** HIGH

## Summary

Phase 20 requires integrating counseling history and reservation display into the existing student detail page. The current student page uses a **section-based layout** (not tabs), while the counseling page uses **client-side Tabs** component. Research reveals:

1. **Student page structure**: Server Component with sequential sections (StudentDetail, SajuAnalysisPanel, NameAnalysisPanel, etc.) - no tab navigation exists
2. **CounselingPageTabs pattern**: Client component using shadcn/ui Tabs with useState-based navigation (no URL parameters)
3. **Existing components**: CounselingHistoryList, CounselingSessionCard are ready to use with proper TypeScript types
4. **No Alert component exists**: Codebase uses custom div patterns with Tailwind (bg-blue-50, bg-amber-50, etc.) - shadcn/ui Alert needs to be added
5. **Data fetching**: getCounselingSessions() exists in lib/db/performance.ts for querying by student

**Primary recommendation:** Add a "상담" section at the end of student page with upcoming reservation alert (top of section) and CounselingHistoryList below, using existing empty state patterns. No tab conversion needed for student page.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15 (App Router) | React framework with Server Components | Current project architecture |
| Prisma | Latest | ORM with RBAC extensions | Existing DB layer with getRBACPrisma() |
| shadcn/ui Tabs | Custom | Client-side tab navigation | Used in CounselingPageTabs |
| react-day-picker | v9 | Date display (already in use) | For reservation date formatting |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | Latest | Date formatting with Korean locale | format(date, "M월 d일 E요일 HH:mm", { locale: ko }) |
| sonner | Latest | Toast notifications | toast.success/error patterns |
| lucide-react | Latest | Icons (AlertTriangle, Calendar, etc.) | For empty states and alerts |

### shadcn/ui Components Status
| Component | Status | Notes |
|-----------|--------|-------|
| Tabs | ✅ EXISTS | Custom implementation in components/ui/tabs.tsx |
| Card | ✅ EXISTS | Used throughout |
| Badge | ✅ EXISTS | With custom variants (scheduled, completed, cancelled, noShow) |
| Button | ✅ EXISTS | All variants |
| AlertDialog | ✅ EXISTS | For confirmation dialogs |
| Alert | ❌ NOT EXISTS | **Needs to be added** via shadcn CLI |

**Installation (if needed):**
```bash
npx shadcn@latest add alert  # For upcoming reservation display
```

## Architecture Patterns

### Student Page Structure (Current)

**Location:** `src/app/(dashboard)/students/[id]/page.tsx`

**Pattern:** Server Component with sequential sections

```typescript
// Current structure - NO tabs
export default async function StudentPage({ params }) {
  const student = await db.student.findFirst({...})

  return (
    <div className="space-y-6">
      <StudentDetail student={student} />          {/* Section 1 */}
      <SajuAnalysisPanel student={student} />      {/* Section 2 */}
      <NameAnalysisPanel student={student} />      {/* Section 3 */}
      <MbtiAnalysisPanel studentId={student.id} /> {/* Section 4 */}
      <FaceAnalysisPanel />                        {/* Section 5 */}
      <PalmAnalysisPanel />                        {/* Section 6 */}
      <section>통합 성향 분석</section>            {/* Section 7 */}
      <section>AI 맞춤형 제안</section>            {/* Section 8 */}
      <div>상담 보고서</div>                       {/* Section 9 */}
    </div>
  )
}
```

**Key insight:** Student page does NOT use tabs. Each section is a full-width component. Phase 20 should add a new "상담" section at the end.

### CounselingPageTabs Pattern (For Reference)

**Location:** `src/components/counseling/CounselingPageTabs.tsx`

**Pattern:** Client Component with useState navigation

```typescript
"use client"

type TabType = "history" | "reservations" | "calendar"

export function CounselingPageTabs({ initialTab, sessions, session, children }) {
  const [activeTab, setActiveTab] = useState<TabType>(/*...*/)
  const [reservations, setReservations] = useState<ReservationWithRelations[]>([])

  // Load reservations on mount
  useEffect(() => {
    const loadReservations = async () => {
      const result = await getReservationsAction({ status: undefined })
      if (result.success && result.data) {
        setReservations(result.data)
      }
    }
    loadReservations()
  }, [])

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)}>
      <TabsList>
        <TabsTrigger value="history">상담 기록</TabsTrigger>
        <TabsTrigger value="reservations">예약 관리</TabsTrigger>
        <TabsTrigger value="calendar">캘린더</TabsTrigger>
      </TabsList>

      <TabsContent value="history">{children}</TabsContent>
      <TabsContent value="reservations">{/* reservation list/form */}</TabsContent>
      <TabsContent value="calendar">{/* calendar view */}</TabsContent>
    </Tabs>
  )
}
```

**Key differences from student page:**
- Client component ("use client")
- useState for tab state (no URL params)
- useEffect for data fetching
- Renders children in history tab

**Decision:** Student page should NOT be converted to tabs. Add counseling as a new section instead.

### CounselingHistoryList Pattern

**Location:** `src/components/counseling/CounselingHistoryList.tsx`

**Props:**
```typescript
interface CounselingHistoryListProps {
  sessions: CounselingSessionWithRelations[]
}

type CounselingSessionWithRelations = CounselingSession & {
  student: Student
  teacher: Teacher
}
```

**Features:**
- Groups sessions by month (Korean format: "2025년 2월")
- Renders CounselingSessionCard for each session
- Empty state: "아직 상담 기록이 없습니다"
- No filtering built-in (filter before passing)

### CounselingSessionCard Pattern

**Location:** `src/components/counseling/CounselingSessionCard.tsx`

**Display:**
- Header: relative time (e.g., "오늘", "어제", "3일 전") + type badge
- Body: teacher name + duration + summary (truncated to 100 chars)
- Footer: follow-up indicator (amber) + satisfaction stars (yellow)

**Type badges:**
- ACADEMIC: "학업" (bg-blue-100 text-blue-800)
- CAREER: "진로" (bg-green-100 text-green-800)
- PSYCHOLOGICAL: "심리" (bg-purple-100 text-purple-800)
- BEHAVIORAL: "행동" (bg-orange-100 text-orange-800)

### Reservation Display Pattern

**Location:** `src/components/counseling/ReservationCard.tsx`

**Props:**
```typescript
export type ReservationWithRelations = ParentCounselingReservation & {
  student: { id: string; name: string; school: string | null; grade: number | null }
  parent: { id: string; name: string; phone: string; email: string | null; relation: string }
  teacher: { id: string; name: string }
}
```

**Display:**
- Date/time: format(date, "M월 d일 E요일 HH:mm", { locale: ko })
- Status badge (scheduled/completed/cancelled/noShow variants)
- Student name + parent relation
- Topic
- Status change buttons (SCHEDULED only)

### Data Fetching Patterns

**Counseling sessions:**
```typescript
// lib/db/performance.ts
export async function getCounselingSessions(studentId: string) {
  return db.counselingSession.findMany({
    where: { studentId },
    include: { student: true, teacher: true },
    orderBy: { sessionDate: "desc" },
  })
}
```

**Reservations:**
```typescript
// lib/actions/reservations.ts
export async function getReservationsAction(params: {
  studentId?: string
  dateFrom?: string
  dateTo?: string
  status?: ReservationStatus
}) {
  // Returns { success: boolean; data?: ReservationWithRelations[] }
}
```

**Upcoming reservation for student:**
```typescript
// Need to add this function
const upcomingReservation = await getReservationsAction({
  studentId: student.id,
  status: "SCHEDULED",
  // Filter: scheduledAt >= now
  // Sort: scheduledAt ASC
  // Take: 1
})
```

### Empty State Pattern

**Location:** `src/components/students/empty-state.tsx`

```typescript
<EmptyState
  icon={GraduationCap}
  title="아직 등록된 학생이 없어요"
  description="학생을 등록하고 학습 관리를 시작해보세요."
  actionLabel="첫 학생 등록하기"
  actionHref="/students/new"
/>
```

**Alternative (in CounselingHistoryList):**
```typescript
<div className="text-center py-12">
  <p className="text-gray-500">아직 상담 기록이 없습니다</p>
</div>
```

### Alert Pattern (Not Yet Added)

**Status:** shadcn/ui Alert component does NOT exist in codebase.

**Workaround patterns currently used:**
```typescript
// Custom div with Tailwind classes
<div className="p-3 rounded-md bg-blue-50 text-blue-600 text-sm">
  {message}
</div>

// For warnings
<div className="p-4 rounded-lg bg-amber-50 text-amber-700">
  {/* content */}
</div>
```

**Recommended installation:**
```bash
npx shadcn@latest add alert
```

**Usage pattern (after installation):**
```typescript
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Calendar } from "lucide-react"

<Alert>
  <Calendar className="h-4 w-4" />
  <AlertTitle>다음 상담 예약</AlertTitle>
  <AlertDescription>
    {format(reservation.scheduledAt, "M월 d일 E요일 HH:mm", { locale: ko })}
  </AlertDescription>
</Alert>
```

### Modal/Dialog Pattern

**Location:** `src/components/counseling/ReservationCard.tsx`

**Pattern:** AlertDialog for confirmations

```typescript
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const [dialogOpen, setDialogOpen] = useState(false)

<AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>{title}</AlertDialogTitle>
      <AlertDialogDescription>{description}</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>취소</AlertDialogCancel>
      <AlertDialogAction onClick={handleConfirm}>확인</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**For Phase 20:** Use similar pattern for session detail modal (not AlertDialog, but Dialog component needs to be added or use existing AlertDialog pattern).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date formatting | Custom Korean date functions | date-fns with locale | Handles edge cases, leap seconds, timezones |
| Alert component | Custom div with bg-blue-50 | shadcn/ui Alert (add via CLI) | Consistent styling, accessibility |
| Type badges | Custom badge rendering | Badge component with variants | Already defined in project |
| Tab state | URL query params | useState (client component) | CounselingPageTabs pattern |
| Empty states | Multiple empty state variants | EmptyState component or simple div | Existing patterns work |

**Key insight:** The project already has established patterns. Reuse CounselingHistoryList, CounselingSessionCard, and ReservationCard patterns rather than building new UI.

## Common Pitfalls

### Pitfall 1: Converting Student Page to Tabs

**What goes wrong:** Student page is a Server Component with 9 sequential sections. Converting to tabs breaks the existing flow and requires major refactoring.

**Why it happens:** Developer sees CounselingPageTabs pattern and assumes all "tab-like" content should use it.

**How to avoid:** Add counseling as a new section at the end, not as a tab. Student page != counseling page.

**Warning signs:** Wrapping multiple sections in Tabs component, breaking section-based layout.

### Pitfall 2: Missing Alert Component

**What goes wrong:** Trying to import Alert from @/components/ui/alert but it doesn't exist.

**Why it happens:** Context says "use shadcn/ui Alert pattern" but component hasn't been installed yet.

**How to avoid:** Run `npx shadcn@latest add alert` first, OR use existing custom div pattern as fallback.

**Warning signs:** Import error for Alert component, "module not found".

### Pitfall 3: Wrong Data Fetching in Server Component

**What goes wrong:** Using useState/useEffect in Server Component (causes "use client" error).

**Why it happens:** Mixing client and server component patterns.

**How to avoid:** Student page is Server Component - fetch all data at page level, pass to components. OR make counseling section a Client Component.

**Warning signs:** "useState cannot be called in Server Component" error.

### Pitfall 4: Not Handling Empty Reservation State

**What goes wrong:** Upcoming reservation section crashes when no reservations exist.

**Why it happens:** Assuming `upcomingReservation.data[0]` always exists.

**How to avoid:** Always check `data?.length > 0` before rendering.

**Warning signs:** Cannot read properties of undefined, null reference errors.

### Pitfall 5: Timezone Issues with Reservation Dates

**What goes wrong:** Reservation shows wrong date/time due to timezone offset.

**Why it happens:** JavaScript Date object timezone handling, database UTC vs local time.

**How to avoid:** Use existing isSameDay pattern from Phase 19, use date-fns with explicit locale.

**Warning signs:** Dates showing "previous day" or "wrong time", tests failing on date comparisons.

## Code Examples

### Adding Counseling Section to Student Page

**Location:** `src/app/(dashboard)/students/[id]/page.tsx`

```typescript
// Add imports
import { CounselingSection } from "@/components/counseling/CounselingSection"

// In page component, fetch counseling data
const counselingSessions = await db.counselingSession.findMany({
  where: { studentId: student.id },
  include: { student: true, teacher: true },
  orderBy: { sessionDate: "desc" },
})

// Get upcoming reservation
const upcomingReservation = await db.parentCounselingReservation.findFirst({
  where: {
    studentId: student.id,
    teacherId: session.userId,
    status: "SCHEDULED",
    scheduledAt: { gte: new Date() },
  },
  include: { student: true, parent: true, teacher: true },
  orderBy: { scheduledAt: "asc" },
})

// Add section at the end
<CounselingSection
  sessions={counselingSessions}
  upcomingReservation={upcomingReservation}
/>
```

### CounselingSection Component (New)

**Location:** `src/components/counseling/CounselingSection.tsx` (to be created)

```typescript
import { CounselingHistoryList } from "./CounselingHistoryList"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Calendar } from "lucide-react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"

interface CounselingSectionProps {
  sessions: Array<CounselingSession & { student: Student; teacher: Teacher }>
  upcomingReservation: ReservationWithRelations | null
}

export function CounselingSection({ sessions, upcomingReservation }: CounselingSectionProps) {
  return (
    <section>
      <h2 className="text-2xl font-bold mb-4">상담 이력</h2>

      {/* Upcoming reservation alert */}
      {upcomingReservation ? (
        <Alert className="mb-4">
          <Calendar className="h-4 w-4" />
          <AlertTitle>다음 상담 예약</AlertTitle>
          <AlertDescription>
            {format(new Date(upcomingReservation.scheduledAt), "M월 d일 E요일 HH:mm", { locale: ko })}에
            {upcomingReservation.parent.name} ({upcomingReservation.parent.relation})와
            "{upcomingReservation.topic}" 주제로 상담이 예정되어 있습니다.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="mb-4">
          <AlertTitle>예정된 상담 없음</AlertTitle>
          <AlertDescription>
            현재 예약된 상담이 없습니다.
          </AlertDescription>
        </Alert>
      )}

      {/* Counseling history list */}
      <CounselingHistoryList sessions={sessions} />
    </section>
  )
}
```

### Session Detail Modal Pattern

**Location:** `src/components/counseling/CounselingSessionModal.tsx` (to be created)

```typescript
"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"  // Needs to be added via shadcn

interface CounselingSessionModalProps {
  session: CounselingSessionWithRelations
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CounselingSessionModal({ session, open, onOpenChange }: CounselingSessionModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>상담 상세</DialogTitle>
          <DialogDescription>
            {format(new Date(session.sessionDate), "yyyy년 M월 d일", { locale: ko })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Session details */}
          <div>
            <span className="text-sm font-medium">상담 유형:</span>
            <span className="ml-2">{getTypeLabel(session.type)}</span>
          </div>

          <div>
            <span className="text-sm font-medium">상담 시간:</span>
            <span className="ml-2">{session.duration}분</span>
          </div>

          <div>
            <span className="text-sm font-medium">상담 내용:</span>
            <p className="mt-2 text-sm">{session.summary}</p>
          </div>

          {session.followUpRequired && (
            <div>
              <span className="text-sm font-medium">후속 조치:</span>
              <span className="ml-2">
                {session.followUpDate
                  ? format(new Date(session.followUpDate), "yyyy년 M월 d일", { locale: ko })
                  : "예정됨"}
              </span>
            </div>
          )}

          {session.satisfactionScore && (
            <div>
              <span className="text-sm font-medium">만족도:</span>
              <span className="ml-2">{session.satisfactionScore} / 5</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| URL-based tabs | useState tabs (client component) | Phase 18 | Simpler state management, no URL pollution |
| Server-side filtering | Client-side filtering with dateFilter prop | Phase 19 | Faster UI, no page refresh needed |
| Custom calendar | react-day-picker v9 | Phase 18 | Better UX, Korean locale support |

**Deprecated/outdated:**
- URL query params for tab state (replaced by useState in CounselingPageTabs)
- Manual date formatting (replaced by date-fns with locale)

## Open Questions

1. **Alert component installation**
   - What we know: shadcn/ui Alert doesn't exist in codebase
   - What's unclear: Should we add Alert component or use existing custom div pattern?
   - Recommendation: Add Alert component via `npx shadcn@latest add alert` for consistency with shadcn patterns

2. **Dialog component availability**
   - What we know: AlertDialog exists, but Dialog (for details modal) may not
   - What's unclear: Is Dialog component available in shadcn/ui?
   - Recommendation: Check with `npx shadcn@latest add dialog` if needed

3. **Session detail modal requirement**
   - What we know: Context says "상세 모달로 상담 내용 표시" (show counseling details in modal)
   - What's unclear: Is this required for Phase 20 or can we defer?
   - Recommendation: Start with basic CounselingHistoryList display, add modal as enhancement if time permits

## Sources

### Primary (HIGH confidence)
- **src/app/(dashboard)/students/[id]/page.tsx** - Student page structure (Server Component with sections)
- **src/components/counseling/CounselingPageTabs.tsx** - Client-side Tabs pattern reference
- **src/components/counseling/CounselingHistoryList.tsx** - Ready-to-use history list component
- **src/components/counseling/CounselingSessionCard.tsx** - Session card display pattern
- **src/components/counseling/ReservationCard.tsx** - Reservation card with status handling
- **src/components/ui/tabs.tsx** - Custom shadcn/ui Tabs implementation
- **src/lib/db/performance.ts** - getCounselingSessions() data access function
- **src/lib/actions/reservations.ts** - getReservationsAction() for upcoming reservations
- **prisma/schema.prisma** - CounselingSession and ParentCounselingReservation models

### Secondary (MEDIUM confidence)
- **src/components/students/empty-state.tsx** - Empty state component pattern
- **src/components/students/student-detail.tsx** - Student detail section pattern
- **src/app/(dashboard)/counseling/page.tsx** - Counseling page with filter UI
- **src/components/ui/alert-dialog.tsx** - AlertDialog pattern for modals

### Tertiary (LOW confidence)
- None - all findings verified from codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - verified from package.json and codebase
- Architecture: HIGH - analyzed existing page/component structures
- Pitfalls: HIGH - identified from existing code patterns and common issues

**Research date:** 2026-02-04
**Valid until:** 30 days (stable architecture, unlikely to change)

**Key findings for planner:**
1. Student page uses sections, NOT tabs - add counseling as new section
2. CounselingHistoryList is ready to use - pass sessions as prop
3. Alert component needs to be added via shadcn CLI
4. Upcoming reservation query needs to filter by status=SCHEDULED and date>=now
5. Modal pattern exists (AlertDialog) but Dialog component may need installation
6. All data fetching functions exist (getCounselingSessions, getReservationsAction)
