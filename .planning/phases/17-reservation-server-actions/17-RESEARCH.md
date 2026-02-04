# Phase 17: Reservation Server Actions - Research

**Researched:** 2026-02-04
**Domain:** Next.js Server Actions, Prisma Transactions, Booking System Patterns
**Confidence:** HIGH

## Summary

Phase 17 implements reservation business logic using Next.js 15 Server Actions with Prisma 7 transactions. The core challenge is preventing double-booking race conditions while maintaining clean separation of concerns. Based on research of booking system patterns and Prisma transaction capabilities, the recommended approach uses **optimistic concurrency control with database transactions** for time slot validation.

The codebase already has established patterns in `src/lib/actions/performance.ts` and `src/lib/validations/` that should be followed for consistency. The reservation system requires careful handling of state transitions (SCHEDULED → COMPLETED/CANCELLED/NO_SHOW) with automatic CounselingSession creation on completion.

**Primary recommendation:** Use Prisma interactive transactions with read-modify-write pattern for reservation operations, Zod schemas in `src/lib/validations/reservations.ts`, and action functions in `src/lib/actions/reservations.ts` following the established `{ success, error?, data? }` response pattern.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.5.10 | Server Actions runtime | Built-in server-side mutation handling with progressive enhancement |
| Prisma | 7.3.0 | Database transactions | Transaction API with isolation level control for race condition prevention |
| Zod | 4.3.6 | Schema validation | Type-safe validation with `safeParse()` for server actions |
| @prisma/client | 7.3.0 | ORM | Type-safe database queries with transaction support |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-hook-form | 7.71.1 | Client-side form | Optional client validation (server validation is mandatory) |
| @hookform/resolvers | 5.2.2 | Zod integration | When using client-side form validation with react-hook-form |
| date-fns | 4.1.0 | Date manipulation | Time slot calculations and date formatting |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Optimistic locking | Pessimistic locking (SELECT FOR UPDATE) | Pessimistic locking has better integrity but worse performance under high concurrency and requires careful deadlock prevention |
| Zod | joi, yup | Zod is TypeScript-first and already used in codebase for consistency |
| Prisma transactions | Raw SQL transactions | Prisma provides type safety and simpler API; raw SQL needed only for complex cases |

**Installation:**
No new packages required — all dependencies already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/lib/
├── actions/
│   ├── performance.ts        # Existing pattern reference
│   └── reservations.ts        # NEW: Reservation server actions
├── db/
│   ├── performance.ts         # Existing DB layer reference
│   └── reservations.ts        # NEW: Reservation database queries
└── validations/
    ├── counseling.ts          # Existing pattern reference
    └── reservations.ts        # NEW: Reservation Zod schemas
```

### Pattern 1: Server Action Structure (Established Pattern)
**What:** File-level `"use server"` directive with action functions accepting `(prevState, formData)` signature for forms
**When to use:** All mutation operations from client components
**Example:**
```typescript
// Source: src/lib/actions/performance.ts (verified in codebase)
"use server"

import { revalidatePath } from "next/cache"
import { verifySession } from "@/lib/dal"
import { getRBACPrisma } from "@/lib/db/rbac"

export async function recordGradeAction(
  prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  const session = await verifySession()
  if (!session) {
    return { error: "인증이 필요합니다." }
  }

  // Validation
  const studentId = formData.get("studentId") as string
  if (!studentId) {
    return { error: "필수 항목을 모두 입력해주세요." }
  }

  // RBAC check
  if (session.role === "TEACHER") {
    const rbacDb = getRBACPrisma(session)
    const student = await rbacDb.student.findFirst({
      where: { id: studentId },
      select: { id: true },
    })
    if (!student) {
      return { error: "해당 학생에 대한 권한이 없습니다." }
    }
  }

  try {
    await createGradeHistory({ /* data */ })
    revalidatePath(`/students/${studentId}`)
    return { success: true }
  } catch (error) {
    console.error("성적 기록 실패:", error)
    return { error: "성적 기록에 실패했습니다." }
  }
}
```

### Pattern 2: Zod Validation (Established Pattern)
**What:** Separate validation schemas in `src/lib/validations/` with Korean error messages
**When to use:** All input validation for server actions
**Example:**
```typescript
// Source: src/lib/validations/counseling.ts (verified in codebase)
import { z } from "zod"

export const counselingSchema = z.object({
  studentId: z.string().min(1, "학생을 선택해주세요"),
  sessionDate: z.string().min(1, "상담일을 입력해주세요"),
  duration: z
    .number()
    .min(5, "상담 시간은 최소 5분 이상이어야 합니다")
    .max(180, "상담 시간은 최대 180분 이하여야 합니다"),
  type: z.enum(["ACADEMIC", "CAREER", "PSYCHOLOGICAL", "BEHAVIORAL"], {
    message: "상담 유형을 선택해주세요",
  }),
})

export type CounselingFormData = z.infer<typeof counselingSchema>
```

### Pattern 3: Database Layer Functions (Established Pattern)
**What:** Separate database operations in `src/lib/db/` with typed payloads
**When to use:** All database interactions, imported by server actions
**Example:**
```typescript
// Source: src/lib/db/performance.ts (verified in codebase)
import { db } from "@/lib/db"
import type { CounselingType } from "@prisma/client"

type CounselingSessionPayload = {
  studentId: string
  teacherId: string
  sessionDate: Date
  duration: number
  type: CounselingType
  summary: string
  followUpRequired?: boolean
  followUpDate?: Date | null
  satisfactionScore?: number | null
}

export async function createCounselingSession(payload: CounselingSessionPayload) {
  const data = {
    studentId: payload.studentId,
    teacherId: payload.teacherId,
    sessionDate: payload.sessionDate,
    duration: payload.duration,
    type: payload.type,
    summary: payload.summary,
    followUpRequired: payload.followUpRequired ?? false,
    followUpDate: payload.followUpDate ?? null,
    satisfactionScore: payload.satisfactionScore ?? null,
  }

  return db.counselingSession.create({ data })
}
```

### Pattern 4: Transaction for Reservation with Conflict Check
**What:** Interactive transaction for read-modify-write operations preventing double-booking
**When to use:** Creating/updating reservations where time slot conflicts must be checked
**Example:**
```typescript
// Source: Prisma official docs + booking system patterns research
import { db } from "@/lib/db"

export async function createReservationWithConflictCheck(
  payload: ReservationPayload
) {
  return await db.$transaction(async (tx) => {
    // 1. Check for conflicting reservations
    const conflicts = await tx.parentCounselingReservation.findFirst({
      where: {
        teacherId: payload.teacherId,
        scheduledAt: payload.scheduledAt,
        status: {
          in: ["SCHEDULED", "COMPLETED"], // Exclude CANCELLED
        },
      },
    })

    if (conflicts) {
      throw new Error("해당 시간에 이미 예약이 있습니다")
    }

    // 2. Create reservation
    return tx.parentCounselingReservation.create({
      data: payload,
    })
  })
}
```

### Pattern 5: State Transition with Automatic Session Creation
**What:** Transaction combining status update with CounselingSession creation
**When to use:** Transitioning reservation to COMPLETED status
**Example:**
```typescript
// Source: Derived from Prisma transaction patterns + CONTEXT.md requirements
export async function completeReservation(
  reservationId: string,
  sessionData: { summary?: string }
) {
  return await db.$transaction(async (tx) => {
    // 1. Get reservation
    const reservation = await tx.parentCounselingReservation.findUnique({
      where: { id: reservationId },
    })

    if (!reservation) {
      throw new Error("예약을 찾을 수 없습니다")
    }

    if (reservation.status !== "SCHEDULED") {
      throw new Error("이미 완료된 예약은 수정할 수 없습니다")
    }

    // 2. Create CounselingSession
    const session = await tx.counselingSession.create({
      data: {
        studentId: reservation.studentId,
        teacherId: reservation.teacherId,
        sessionDate: reservation.scheduledAt,
        duration: 30, // Default from 30-minute slots
        type: "ACADEMIC", // Default or from reservation.topic
        summary: sessionData.summary || "",
      },
    })

    // 3. Update reservation
    return tx.parentCounselingReservation.update({
      where: { id: reservationId },
      data: {
        status: "COMPLETED",
        counselingSessionId: session.id,
      },
    })
  })
}
```

### Anti-Patterns to Avoid
- **No validation before DB operations:** Always validate with Zod before database queries
- **Exposing detailed errors to client:** Return generic messages for security/permission errors
- **Separate check and create operations:** Use transactions to prevent race conditions
- **Ignoring RBAC in actions:** Always check session and apply `getRBACPrisma()` for TEACHER role
- **Missing revalidatePath:** Always revalidate affected pages after mutations

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Time slot conflict detection | Manual date comparison loops | Prisma where clause with date range | Database-level query is atomic and prevents race conditions |
| Status transition validation | if/else chains | TypeScript discriminated unions + guard functions | Type-safe state machine prevents invalid transitions |
| Form data parsing | Manual FormData.get() casting | Zod schema with .safeParse() | Type-safe validation with user-friendly error messages |
| Permission checks | Custom logic in each action | `getRBACPrisma()` + `verifySession()` | Reuses Phase 11 RBAC infrastructure consistently |
| Optimistic locking | Custom version field logic | Prisma transaction with conflict check | Simpler than version fields for this use case |

**Key insight:** Booking systems have complex edge cases (concurrent access, timezone handling, partial overlaps). Use established transaction patterns rather than building custom locking mechanisms.

## Common Pitfalls

### Pitfall 1: Race Conditions in Double-Booking Prevention
**What goes wrong:** Two concurrent requests check for conflicts, both see no conflict, both create reservations for the same slot
**Why it happens:** Separate SELECT and INSERT operations without transaction isolation
**How to avoid:** Use Prisma interactive transactions (`db.$transaction()`) to make conflict check + creation atomic
**Warning signs:** Duplicate bookings appear in database during high concurrency

**Solution:**
```typescript
// BAD: Race condition possible
const existing = await db.reservation.findFirst({ where: { slot } })
if (existing) throw new Error("Already booked")
await db.reservation.create({ data })

// GOOD: Atomic transaction
await db.$transaction(async (tx) => {
  const existing = await tx.reservation.findFirst({ where: { slot } })
  if (existing) throw new Error("Already booked")
  return tx.reservation.create({ data })
})
```

### Pitfall 2: Invalid State Transitions
**What goes wrong:** Reservation transitions from COMPLETED back to SCHEDULED, or CANCELLED to COMPLETED
**Why it happens:** No validation of current state before updating status
**How to avoid:** Check current status in WHERE clause when updating, validate allowed transitions
**Warning signs:** Data inconsistency where completed reservations get modified

**Solution:**
```typescript
// BAD: No current state validation
await db.reservation.update({
  where: { id },
  data: { status: "COMPLETED" }
})

// GOOD: Validate current state
const updated = await db.reservation.updateMany({
  where: {
    id,
    status: "SCHEDULED" // Only update if currently SCHEDULED
  },
  data: { status: "COMPLETED" }
})

if (updated.count === 0) {
  throw new Error("이미 완료된 예약은 수정할 수 없습니다")
}
```

### Pitfall 3: Missing Validation Before Database Operations
**What goes wrong:** Invalid data reaches database, causing Prisma errors with cryptic messages
**Why it happens:** Skipping Zod validation or using it only on client side
**How to avoid:** Always use `schema.safeParse()` in server actions before any database calls
**Warning signs:** Prisma P2000/P2003 errors appearing in production logs

**Solution:**
```typescript
// BAD: Direct database call
export async function createReservation(formData: FormData) {
  const data = {
    scheduledAt: new Date(formData.get("scheduledAt") as string),
    // ...
  }
  await db.reservation.create({ data }) // May fail with cryptic Prisma error
}

// GOOD: Zod validation first
export async function createReservation(
  prevState: State,
  formData: FormData
) {
  const result = reservationSchema.safeParse({
    scheduledAt: formData.get("scheduledAt"),
    // ...
  })

  if (!result.success) {
    return {
      error: "입력값이 올바르지 않습니다",
      fieldErrors: result.error.flatten().fieldErrors
    }
  }

  // Now safe to use result.data
  await db.reservation.create({ data: result.data })
}
```

### Pitfall 4: Forgetting revalidatePath After Mutations
**What goes wrong:** UI shows stale data after successful mutation
**Why it happens:** Next.js caches page data, doesn't auto-refresh after mutations
**How to avoid:** Call `revalidatePath()` or `revalidateTag()` in every successful mutation action
**Warning signs:** Users need to manually refresh browser to see changes

**Solution:**
```typescript
// Source: Next.js official docs
import { revalidatePath } from "next/cache"

export async function createReservation(...) {
  // ... mutation logic

  revalidatePath(`/reservations`) // Refresh reservation list
  revalidatePath(`/students/${studentId}`) // Refresh student detail page

  return { success: true }
}
```

### Pitfall 5: Time Zone Handling with Date Objects
**What goes wrong:** Reservation time shifts by hours due to UTC/local timezone conversion
**Why it happens:** JavaScript Date stores UTC internally, database might store differently
**How to avoid:** Use date-fns for consistent parsing, store ISO strings in database
**Warning signs:** Times displayed are N hours off from what user selected

**Solution:**
```typescript
// Source: Research findings + date-fns library
import { parseISO, formatISO } from "date-fns"

// BAD: new Date() may shift timezone
const date = new Date(formData.get("scheduledAt") as string)

// GOOD: Parse and store as ISO string
const dateStr = formData.get("scheduledAt") as string
const scheduledAt = parseISO(dateStr) // Consistent parsing
```

## Code Examples

Verified patterns from official sources and codebase:

### Example 1: Complete Reservation Action Structure
```typescript
// Source: Derived from src/lib/actions/performance.ts pattern
"use server"

import { revalidatePath } from "next/cache"
import { verifySession } from "@/lib/dal"
import { getRBACPrisma } from "@/lib/db/rbac"
import { createReservationWithConflictCheck } from "@/lib/db/reservations"
import { reservationCreateSchema } from "@/lib/validations/reservations"

export async function createReservationAction(
  prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  // 1. Auth check
  const session = await verifySession()
  if (!session) {
    return { error: "인증이 필요합니다." }
  }

  // 2. Parse and validate
  const result = reservationCreateSchema.safeParse({
    scheduledAt: formData.get("scheduledAt"),
    studentId: formData.get("studentId"),
    parentId: formData.get("parentId"),
    topic: formData.get("topic"),
  })

  if (!result.success) {
    return {
      error: "입력값이 올바르지 않습니다.",
      fieldErrors: result.error.flatten().fieldErrors,
    }
  }

  // 3. RBAC check for TEACHER role
  if (session.role === "TEACHER") {
    const rbacDb = getRBACPrisma(session)
    const student = await rbacDb.student.findFirst({
      where: { id: result.data.studentId },
      select: { id: true },
    })
    if (!student) {
      return { error: "접근 권한이 없습니다." }
    }
  }

  // 4. Create with transaction (prevents race conditions)
  try {
    await createReservationWithConflictCheck({
      ...result.data,
      teacherId: session.userId,
      status: "SCHEDULED",
    })

    revalidatePath("/reservations")
    revalidatePath(`/students/${result.data.studentId}`)
    return { success: true }
  } catch (error) {
    console.error("예약 생성 실패:", error)
    // Don't expose error details to client
    if (error instanceof Error && error.message.includes("이미 예약이 있습니다")) {
      return { error: error.message }
    }
    return { error: "예약 생성에 실패했습니다." }
  }
}
```

### Example 2: Zod Validation Schema with Refinements
```typescript
// Source: Derived from src/lib/validations/counseling.ts pattern
import { z } from "zod"

// Time validation: must be in 30-minute increments (HH:00 or HH:30)
const timeSlotSchema = z.string().refine(
  (val) => {
    const date = new Date(val)
    const minutes = date.getMinutes()
    return minutes === 0 || minutes === 30
  },
  "예약은 30분 단위로만 가능합니다 (예: 10:00, 10:30)"
)

export const reservationCreateSchema = z.object({
  scheduledAt: timeSlotSchema,
  studentId: z.string().min(1, "학생을 선택해주세요"),
  parentId: z.string().min(1, "학부모를 선택해주세요"),
  topic: z.string().min(1, "상담 주제를 입력해주세요"),
})

export const reservationUpdateSchema = reservationCreateSchema.partial()

// State transition validation
export const statusTransitionSchema = z.object({
  reservationId: z.string(),
  newStatus: z.enum(["COMPLETED", "CANCELLED", "NO_SHOW"]),
})

export type ReservationCreateInput = z.infer<typeof reservationCreateSchema>
export type StatusTransitionInput = z.infer<typeof statusTransitionSchema>
```

### Example 3: State Transition with Validation
```typescript
// Source: Derived from Prisma transaction patterns + CONTEXT.md requirements
export async function transitionReservationStatus(
  reservationId: string,
  newStatus: "COMPLETED" | "CANCELLED" | "NO_SHOW",
  sessionData?: { summary: string }
) {
  return await db.$transaction(async (tx) => {
    // 1. Get current reservation
    const reservation = await tx.parentCounselingReservation.findUnique({
      where: { id: reservationId },
      select: {
        id: true,
        status: true,
        studentId: true,
        teacherId: true,
        scheduledAt: true,
      },
    })

    if (!reservation) {
      throw new Error("예약을 찾을 수 없습니다")
    }

    // 2. Validate transition
    if (reservation.status !== "SCHEDULED") {
      throw new Error("이미 완료된 예약은 수정할 수 없습니다")
    }

    // 3. Handle COMPLETED differently (creates session)
    if (newStatus === "COMPLETED") {
      const session = await tx.counselingSession.create({
        data: {
          studentId: reservation.studentId,
          teacherId: reservation.teacherId,
          sessionDate: reservation.scheduledAt,
          duration: 30,
          type: "ACADEMIC",
          summary: sessionData?.summary || "",
        },
      })

      return tx.parentCounselingReservation.update({
        where: { id: reservationId },
        data: {
          status: "COMPLETED",
          counselingSessionId: session.id,
        },
      })
    }

    // 4. Handle CANCELLED / NO_SHOW
    return tx.parentCounselingReservation.update({
      where: { id: reservationId },
      data: { status: newStatus },
    })
  })
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual FormData parsing | Zod schema validation | Next.js 13+ | Type safety, automatic error formatting |
| Separate API routes | Server Actions | Next.js 13+ (stable in 15) | Simpler code, progressive enhancement |
| Pessimistic locking (SELECT FOR UPDATE) | Optimistic concurrency control | Prisma 2.0+ | Better performance under high concurrency |
| Custom error objects | `safeParse()` with `flatten()` | Zod 3.0+ | Consistent error format for forms |
| Sequential checks + creates | Interactive transactions | Prisma 2.12+ | Prevents race conditions atomically |

**Deprecated/outdated:**
- **getServerSideProps for mutations:** Use Server Actions instead
- **API routes for form handling:** Server Actions replace this pattern in Next.js 15
- **useFormState hook:** Replaced by `useActionState` in React 19

## Open Questions

1. **Time zone storage strategy**
   - What we know: JavaScript Date stores UTC, database needs consistent format
   - What's unclear: Whether to store as DateTime or separate date + time fields
   - Recommendation: Store as single DateTime in UTC, convert for display using date-fns

2. **Notification system integration**
   - What we know: CONTEXT.md specifies "내부 기록 전용: 외부 알림 없이 시스템에만 기록"
   - What's unclear: Future notification requirements for Phase 18
   - Recommendation: Design actions to be easily extended with notification hooks

3. **Concurrent update handling during status transitions**
   - What we know: Prisma transactions prevent double-booking but may not prevent concurrent status updates on same reservation
   - What's unclear: Whether optimistic locking (version field) needed for status updates
   - Recommendation: Start with transaction-based approach, add version field only if concurrent update issues arise

## Sources

### Primary (HIGH confidence)
- Next.js Official Docs - Server Actions: https://nextjs.org/docs/app/getting-started/updating-data
- Prisma Official Docs - Transactions: https://www.prisma.io/docs/orm/prisma-client/queries/transactions
- Zod Official Docs - Error Formatting: https://zod.dev/error-formatting
- Codebase - src/lib/actions/performance.ts (verified pattern)
- Codebase - src/lib/validations/counseling.ts (verified pattern)
- Codebase - src/lib/db/performance.ts (verified pattern)

### Secondary (MEDIUM confidence)
- [DEV: Next.js Server Actions Complete Guide 2026](https://dev.to/marufrahmanlive/nextjs-server-actions-complete-guide-with-examples-for-2026-2do0)
- [Medium: 10 Prisma Transaction Patterns That Avoid Deadlocks](https://medium.com/@connect.hashblock/10-prisma-transaction-patterns-that-avoid-deadlocks-4f52a174760b)
- [DEV: How To Build a High-Concurrency Ticket Booking System With Prisma](https://dev.to/zenstack/how-to-build-a-high-concurrency-ticket-booking-system-with-prisma-184n)
- [ITNEXT: Solving Double Booking at Scale](https://itnext.io/solving-double-booking-at-scale-system-design-patterns-from-top-tech-companies-4c5a3311d8ea)

### Tertiary (LOW confidence)
- WebSearch findings on state machine patterns in TypeScript (general patterns, not specific to this use case)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified in package.json, versions confirmed
- Architecture: HIGH - Patterns verified in existing codebase (performance.ts, counseling.ts)
- Pitfalls: HIGH - Based on official Prisma transaction docs + verified booking system patterns
- Code examples: HIGH - Derived from verified codebase patterns + official documentation

**Research date:** 2026-02-04
**Valid until:** 2026-03-04 (30 days - stable patterns, but Next.js updates frequently)
