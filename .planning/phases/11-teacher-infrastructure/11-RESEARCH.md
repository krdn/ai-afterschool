# Phase 11: Teacher Infrastructure & Access Control - Research

**Researched:** 2026-01-30
**Domain:** Prisma ORM with PostgreSQL RLS, Team-based RBAC, Next.js 15 App Router
**Confidence:** HIGH

## Summary

Phase 11은 선생님 관리를 위한 데이터베이스 스키마 확장, 팀 기반 RBAC(Role-Based Access Control), PostgreSQL Row-Level Security(RLS), Prisma Middleware를 활용한 테넌트 격리, 그리고 선생님 CRUD UI 구축 단계입니다. 핵심은 **Prisma Middleware + PostgreSQL RLS의 레이어드 접근**으로 데이터 유출을 방지하고, 기존 학생 데이터에 `teamId` 외래 키를 무중단으로 마이그레이션하는 것입니다.

**Key Findings:**
- **Prisma Middleware는 deprecated**: [Prisma 공식 문서](https://www.prisma.io/docs/concepts/components/prisma-client/middleware)에 따르면 Middleware는 v4.16.0부터 deprecated되었으며, **Prisma Client Extensions**를 사용해야 합니다
- **PostgreSQL RLS with session variables**: Crunchy Data의 가이드에 따라 `current_setting('rls.org_id', TRUE)` 패턴으로 테넌트 격리 구현
- **NOT VALID 제약조건**: 무중단 마이그레이션을 위해 `ALTER TABLE ... ADD CONSTRAINT ... NOT VALID` 후 `VALIDATE CONSTRAINT`로 분리 실행
- **Next.js 15 RBAC**: Clerk 블로그의 2025년 2월 가이드에 따라 middleware에서 role 체크 후 redirect 패턴 사용
- **shadcn/ui + TanStack Table**: 공식 문서 기반의 데이터 테이블 패턴으로 검색, 필터, 페이지네이션 구현

**Primary recommendation:** Prisma Client Extensions로 자동 팀 필터링 구현, PostgreSQL RLS로 데이터베이스 레벨 강제, Jose JWT로 role/teamId 세션 관리, shadcn/ui + TanStack Table로 선생님 목록 UI 구현, `NOT VALID` 제약조건으로 무중단 마이그레이션.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **Prisma** | 7.3.0 (현재 사용 중) | ORM | Prisma Client Extensions로 자동 팀 필터링, mature ecosystem |
| **PostgreSQL** | 16.x | Database | Row-Level Security (RLS)로 테넌트 격리 강제 |
| **Jose** | 6.1.3 (현재 사용 중) | JWT | Session에 role, teamId 포함 (이미 사용 중) |
| **shadcn/ui** | latest | UI Components | Radix primitives, TanStack Table과 통합 |
| **TanStack Table** | 8.21.3 (현재 사용 중) | Data Tables | Server-side pagination, sorting, filtering |
| **Next.js** | 15.5+ | App Framework | Server Components, Server Actions |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **@prisma/adapter-pg** | 7.3.0 (현재 사용 중) | PostgreSQL Adapter | Prisma + PostgreSQL 연결에 이미 사용 중 |
| **React Hook Form** | 7.71.1 (현재 사용 중) | Form Management | 선생님 생성/편집 폼 |
| **Zod** | 4.3.6 (현재 사용 중) | Schema Validation | Form + Server Action 검증 |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Prisma Extensions | Prisma Middleware (deprecated) | Middleware는 deprecated됨. Extensions가 공식 권장 방식 |
| PostgreSQL RLS | Application-level filtering only | RLS는 database-level 강제. app-only는 버그로 데이터 유출 위험 |
| Jose JWT | iron-session | Jose는 이미 사용 중. iron-session은 더 간단하지만 migration 비용 |
| Server-side filtering | Client-side pagination | Server-side는 대용량 데이터에 필수적. Client-side는 소규모만 |

**Installation:**
```bash
# 이미 설치된 패키지 (package.json 기준)
# Prisma 7.3.0, Jose 6.1.3, TanStack Table 8.21.3, shadcn/ui, Zod 4.3.6
# 추가 설치 필요 없음 - 기존 스택 사용
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── lib/
│   ├── db/
│   │   ├── index.ts                  # Prisma client singleton
│   │   ├── schema-extensions.ts      # Prisma Extensions for team filtering
│   │   └── rls-policies.sql          # PostgreSQL RLS policies (raw SQL)
│   ├── session.ts                    # JWT session (이미 존재, 확장 필요)
│   ├── dal.ts                        # Data Access Layer (이미 존재, role 체크 추가)
│   ├── actions/
│   │   ├── teachers.ts               # Teacher CRUD Server Actions
│   │   └── teams.ts                  # Team management Server Actions
│   └── validations/
│       ├── teacher.ts                # Teacher Zod schemas
│       └── team.ts                   # Team Zod schemas
├── app/
│   ├── (dashboard)/
│   │   ├── teachers/
│   │   │   ├── page.tsx              # Teacher list (TanStack Table)
│   │   │   └── [id]/
│   │   │       └── page.tsx          # Teacher detail
│   │   └── teams/
│   │       ├── page.tsx              # Team list
│   │       └── new/
│   │           └── page.tsx          # Create team
│   └── api/
│       └── teachers/
│           └── [id]/
│               └── route.ts          # Teacher detail API
└── components/
    ├── teachers/
    │   ├── teacher-table.tsx         # TanStack Table with search/filter
    │   ├── teacher-form.tsx          # Create/Edit teacher form
    │   └── teacher-card.tsx          # Teacher detail card
    └── teams/
        └── team-select.tsx           # Team selection dropdown

prisma/
├── schema.prisma                     # 확장된 스키마 (Team, Teacher 변경)
└── migrations/
    └── 20260130_add_teacher_team_support/
        ├── migration.sql             # teamId 추가, RLS 정책
        └── seed.ts                   # 초기 팀 및 역할 데이터
```

### Pattern 1: Prisma Client Extensions for Automatic Team Filtering

**What:** Prisma Client Extensions로 모든 쿼리에 자동으로 `teamId` 필터 추가
**When to use:** 모든 Teacher/Student 데이터 접근 (항상)
**Why:** Middleware는 deprecated, Extensions가 공식 권장 방식

**Example:**
```typescript
// src/lib/db/schema-extensions.ts
// Source: https://www.prisma.io/docs/concepts/components/prisma-client/middleware (deprecated → extensions)
import { PrismaClient } from '@prisma/client'

/**
 * Prisma Client Extension for automatic team filtering
 * CRITICAL: This applies to ALL queries - defense in depth with RLS
 */
export function createTeamFilteredPrisma(teamId: string | null, role: string) {
  return new PrismaClient().$extends({
    query: {
      // 모델에 대해 자동 teamId 필터링
      $allOperations({ model, operation, args, query }) {
        // Director는 모든 데이터 접근 가능
        if (role === 'DIRECTOR') {
          return query(args)
        }

        // Teacher, Student 모델에 teamId 필터 자동 추가
        if (model === 'Teacher' || model === 'Student') {
          // Team Leader: 자신의 팀만
          if (role === 'TEAM_LEADER' && teamId) {
            args.where = { ...args.where, teamId }
          }

          // Manager/Teacher: 자신의 담당 학생만
          if ((role === 'MANAGER' || role === 'TEACHER') && teamId) {
            // Teacher는 자신의 students만, Student는 본인만
            if (model === 'Student') {
              args.where = { ...args.where, teamId, teacherId: currentTeacherId }
            }
          }
        }

        return query(args)
      },
    },
  })
}

// 사용 예시
const prisma = createTeamFilteredPrisma(session.teamId, session.role)
const students = await prisma.student.findMany() // 자동으로 teamId 필터됨
```

### Pattern 2: PostgreSQL RLS with Session Variables

**What:** PostgreSQL RLS 정책으로 데이터베이스 레벨에서 테넌트 격리 강제
**When to use:** 모든 테이블의 SELECT/INSERT/UPDATE/DELETE (항상)
**Why:** Application-layer 필터링만으로는 부족, DB-level 강제가 필요

**Example:**
```sql
-- prisma/migrations/20260130_add_teacher_team_support/migration.sql

-- 1. teamId 추가 (nullable로 시작)
ALTER TABLE "Student" ADD COLUMN "teamId" TEXT;

-- 2. Teacher 테이블에 role, teamId 추가
ALTER TABLE "Teacher" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'TEACHER';
ALTER TABLE "Teacher" ADD COLUMN "teamId" TEXT;

-- 3. Team 테이블 생성
CREATE TABLE "Team" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. 외래 키 제약조건 (NOT VALID로 무중단)
ALTER TABLE "Student"
  ADD CONSTRAINT "Student_teamId_fkey"
  FOREIGN KEY ("teamId")
  REFERENCES "Team"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE
  NOT VALID;

ALTER TABLE "Teacher"
  ADD CONSTRAINT "Teacher_teamId_fkey"
  FOREIGN KEY ("teamId")
  REFERENCES "Team"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE
  NOT VALID;

-- 5. Role Enum 생성
CREATE TYPE "TeacherRole" AS ENUM ('DIRECTOR', 'TEAM_LEADER', 'MANAGER', 'TEACHER');
ALTER TABLE "Teacher" ALTER COLUMN "role" TYPE "TeacherRole" USING "role"::"TeacherRole";

-- 6. RLS 활성화
ALTER TABLE "Student" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Teacher" ENABLE ROW LEVEL SECURITY;

-- 7. RLS 정책 (session variable 사용)
-- Source: https://www.crunchydata.com/blog/row-level-security-for-tenants-in-postgres
CREATE POLICY "Student_team_isolation_policy"
ON "Student"
FOR ALL
TO application
USING (
  -- Director: 모든 데이터 접근
  "current_setting"('rls.teacher_role', TRUE) = 'DIRECTOR' OR

  -- Team Leader: 자신의 팀 학생만
  ("current_setting"('rls.teacher_role', TRUE) = 'TEAM_LEADER' AND "teamId" = "current_setting"('rls.team_id', TRUE)) OR

  -- Manager/Teacher: 자신의 담당 학생만
  (("current_setting"('rls.teacher_role', TRUE) = 'MANAGER' OR
    "current_setting"('rls.teacher_role', TRUE) = 'TEACHER') AND
    "teacherId" = "current_setting"('rls.teacher_id', TRUE))
);

CREATE POLICY "Teacher_team_isolation_policy"
ON "Teacher"
FOR ALL
TO application
USING (
  -- Director: 모든 데이터 접근
  "current_setting"('rls.teacher_role', TRUE) = 'DIRECTOR' OR

  -- Team Leader: 자신의 팀 선생님만
  ("current_setting"('rls.teacher_role', TRUE) = 'TEAM_LEADER' AND "teamId" = "current_setting"('rls.team_id', TRUE)) OR

  -- 자신의 계정만
  "id" = "current_setting"('rls.teacher_id', TRUE)
);

-- 8. 인덱스 추가
CREATE INDEX IF NOT EXISTS "Student_teamId_idx" ON "Student"("teamId");
CREATE INDEX IF NOT EXISTS "Teacher_teamId_idx" ON "Teacher"("teamId");
```

```typescript
// src/lib/db/rls-session.ts
// Source: https://www.crunchydata.com/blog/row-level-security-for-tenants-in-postgres
import { db } from './index'

/**
 * PostgreSQL RLS session variables 설정
 * 모든 쿼리 전에 호출하여 테넌트 격리 활성화
 */
export async function setRLSSessionContext({
  teacherId,
  role,
  teamId,
}: {
  teacherId: string
  role: 'DIRECTOR' | 'TEAM_LEADER' | 'MANAGER' | 'TEACHER'
  teamId: string | null
}) {
  await db.$executeRaw`SET LOCAL rls.teacher_id = ${teacherId}`
  await db.$executeRaw`SET LOCAL rls.teacher_role = ${role}`
  if (teamId) {
    await db.$executeRaw`SET LOCAL rls.team_id = ${teamId}`
  }
}

// 사용 예시 (Server Action)
'use server'
import { setRLSSessionContext } from '@/lib/db/rls-session'
import { verifySession } from '@/lib/dal'

export async function getStudents() {
  const session = await verifySession()
  const teacher = await db.teacher.findUnique({ where: { id: session.userId } })

  // RLS context 설정
  await setRLSSessionContext({
    teacherId: teacher.id,
    role: teacher.role,
    teamId: teacher.teamId,
  })

  // RLS 정책에 따라 자동으로 필터링됨
  return await db.student.findMany()
}
```

### Pattern 3: Extended Session with Role and TeamId

**What:** JWT session에 role과 teamId 포함하여 Prisma/RLE context 설정
**When to use:** 로그인 시, 모든 요청에서
**Why:** Server Component/Action에서 role-based 로직에 필요

**Example:**
```typescript
// src/lib/session.ts (확장)
// Source: 기존 코드 + role/teamId 추가
export type SessionPayload = {
  userId: string
  role: 'DIRECTOR' | 'TEAM_LEADER' | 'MANAGER' | 'TEACHER'
  teamId: string | null
  expiresAt: Date
}

export async function createSession(
  userId: string,
  role: 'DIRECTOR' | 'TEAM_LEADER' | 'MANAGER' | 'TEACHER',
  teamId: string | null
): Promise<void> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const session = await encrypt({ userId, role, teamId, expiresAt })
  const cookieStore = await cookies()

  cookieStore.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })
}
```

```typescript
// src/lib/dal.ts (확장)
// Source: 기존 verifySession 확장
export const verifySession = cache(async () => {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  const payload = await decrypt(session)

  if (!payload?.userId) {
    redirect('/login')
  }

  await updateSession()

  return {
    isAuth: true,
    userId: payload.userId,
    role: payload.role,
    teamId: payload.teamId,
  }
})

/**
 * Role-based access check
 * Director만 접근 가능한 페이지용
 */
export async function requireDirector() {
  const session = await verifySession()
  if (session.role !== 'DIRECTOR') {
    redirect('/unauthorized')
  }
  return session
}

/**
 * Team Leader 또는 Director 접근 체크
 */
export async function requireTeamLeaderOrAbove() {
  const session = await verifySession()
  if (!['DIRECTOR', 'TEAM_LEADER'].includes(session.role)) {
    redirect('/unauthorized')
  }
  return session
}
```

### Pattern 4: TanStack Table with Server-Side Filtering

**What:** shadcn/ui + TanStack Table로 검색, 필터, 페이지네이션 구현
**When to use:** 선생님 목록 페이지 (항상)
**Why:** 대용량 데이터에 필수적인 server-side pagination

**Example:**
```typescript
// src/app/(dashboard)/teachers/page.tsx
// Source: https://ui.shadcn.com/docs/components/data-table
import { columns } from './columns'
import { TeacherTable } from '@/components/teachers/teacher-table'

export default async function TeachersPage({
  searchParams,
}: {
  searchParams: { page?: string query?: string role?: string team?: string }
}) {
  const session = await verifySession()

  // Server-side pagination & filtering
  const page = parseInt(searchParams.page || '1')
  const limit = 20
  const skip = (page - 1) * limit

  const teachers = await db.teacher.findMany({
    where: {
      // Director: 모두, 그 외: 자신 팀만 (RLS가 자동 필터링)
      OR: searchParams.query ? [
        { name: { contains: searchParams.query, mode: 'insensitive' } },
        { email: { contains: searchParams.query, mode: 'insensitive' } },
      ] : undefined,
      ...(searchParams.role && { role: searchParams.role }),
      ...(searchParams.team && { teamId: searchParams.team }),
    },
    include: {
      team: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit,
  })

  const totalCount = await db.teacher.count({ where: /* same as above */ })

  return (
    <div className="container">
      <h1>선생님 관리</h1>
      <TeacherTable
        data={teachers}
        pageCount={Math.ceil(totalCount / limit)}
        currentPage={page}
      />
    </div>
  )
}
```

```typescript
// src/components/teachers/teacher-table.tsx
'use client'
// Source: https://ui.shadcn.com/docs/components/data-table
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export type Teacher = {
  id: string
  name: string
  email: string
  role: 'DIRECTOR' | 'TEAM_LEADER' | 'MANAGER' | 'TEACHER'
  team: { id: string; name: string } | null
}

export const columns: ColumnDef<Teacher>[] = [
  { accessorKey: 'name', header: '이름' },
  { accessorKey: 'email', header: '이메일' },
  { accessorKey: 'role', header: '역할' },
  {
    accessorKey: 'team',
    header: '소속 팀',
    cell: ({ row }) => row.original.team?.name || '-'
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <Link href={`/teachers/${row.original.id}`}>
        <Button variant="ghost">상세보기</Button>
      </Link>
    ),
  },
]

export function TeacherTable({ data, pageCount, currentPage }: {
  data: Teacher[]
  pageCount: number
  currentPage: number
}) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div>
      {/* Search & Filter */}
      <div className="flex gap-2 mb-4">
        <Input
          name="query"
          placeholder="이름, 이메일로 검색..."
          defaultValue={searchParams.query}
        />
        <Select name="role">
          <SelectTrigger>
            <SelectValue placeholder="역할 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DIRECTOR">원장</SelectItem>
            <SelectItem value="TEAM_LEADER">팀장</SelectItem>
            <SelectItem value="MANAGER">매니저</SelectItem>
            <SelectItem value="TEACHER">선생님</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <TableHead key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map(row => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center">
                선생님이 없습니다.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          asChild={currentPage > 1}
        >
          {currentPage > 1 ? (
            <Link href={`/teachers?page=${currentPage - 1}`}>이전</Link>
          ) : (
            <span>이전</span>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= pageCount}
          asChild={currentPage < pageCount}
        >
          {currentPage < pageCount ? (
            <Link href={`/teachers?page=${currentPage + 1}`}>다음</Link>
          ) : (
            <span>다음</span>
          )}
        </Button>
      </div>
    </div>
  )
}
```

### Anti-Patterns to Avoid

- **Prisma Middleware 사용**: v4.16.0부터 deprecated. Prisma Client Extensions를 사용하세요
- **Application-layer filtering only**: RLS 없이는 DB 직접 접속 시 데이터 유출 위험
- **Client-side pagination**: 대용량 데이터에서는 server-side pagination 필수
- **Role stored only in DB**: Session에 role 없이 매번 DB 조회는 비효율적
- **NOT VALID 누락**: production에서 FK 제약조건 추가 시 LOCK으로 장애 가능

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Team filtering logic | Custom where clauses in every query | Prisma Extensions | 자동화, 타입 안전성, DRY 원칙 |
| Tenant isolation | Application-level checks only | PostgreSQL RLS | DB-level 강제, defense in depth |
| Session role storage | Separate role lookup table | JWT payload | 이미 사용 중인 Jose, 간단한 확장 |
| Table search/filter | Custom state management | TanStack Table | sorting, filtering, pagination 이미 구현됨 |
| Role-based UI rendering | Custom conditional rendering | Clerk RBAC pattern 또는 간단한 조건부 | [Next.js 15 RBAC 가이드](https://clerk.com/blog/nextjs-role-based-access-control) 참고 |

**Key insight:** Prisma Extensions + PostgreSQL RLS 조합이 테넌트 격리의 best practice입니다. Application-layer만으로는 insufficient.

## Common Pitfalls

### Pitfall 1: Prisma Middleware 사용 (Deprecated)

**What goes wrong:** Prisma v4.16.0+에서 Middleware는 deprecated. 향후 버전에서 제거될 수 있음.

**Why it happens:** Old tutorials, StackOverflow answers

**How to avoid:**
```typescript
// ❌ WRONG: Deprecated middleware
prisma.$use(async (params, next) => {
  // ...
})

// ✅ CORRECT: Prisma Client Extensions
prisma.$extends({
  query: {
    $allOperations({ query, args }) {
      // ...
    }
  }
})
```

**Reference:** [Prisma Middleware Docs (Deprecated Notice)](https://www.prisma.io/docs/concepts/components/prisma-client/middleware)

### Pitfall 2: RLS Policy에서 NULL 비교 버그

**What goes wrong:** `teamId = NULL`은 항상 false (SQL 삼-valued logic)

**Why it happens:** NULL과의 비교는 UNKNOWN 반환

**How to avoid:**
```sql
-- ❌ WRONG: NULL 비교
USING (teamId = current_setting('rls.team_id', TRUE))

-- ✅ CORRECT: NULL 체크 또는 COALESCE
USING (
  current_setting('rls.team_id', TRUE) IS NULL OR
  teamId = current_setting('rls.team_id', TRUE)::uuid
)
```

### Pitfall 3: Foreign Key 제약조건 추가 시 LOCK

**What goes wrong:** Production에서 `ALTER TABLE ... ADD FOREIGN KEY` 실행 시 전체 테이블 LOCK으로 장애

**Why it happens:** PostgreSQL은 FK 추가 시 table scan 필요 (SHARE ROW EXCLUSIVE lock)

**How to avoid:**
```sql
-- 1. NOT VALID로 제약조건 생성 (LOCK 없음)
ALTER TABLE "Student"
  ADD CONSTRAINT "Student_teamId_fkey"
  FOREIGN KEY ("teamId") REFERENCES "Team"("id")
  NOT VALID;

-- 2. 추후 VALIDATE (background 실행, 최소 LOCK)
ALTER TABLE "Student"
  VALIDATE CONSTRAINT "Student_teamId_fkey";
```

**Reference:** [Postgres: Adding Foreign Keys With Zero Downtime](https://travisofthenorth.com/blog/2017/2/2/postgres-adding-foreign-keys-with-zero-downtime)

### Pitfall 4: RLS Session Variable 미설정

**What goes wrong:** Server Component에서 RLS context 설정 없이 쿼리 실행 시 모든 데이터 거부 (default deny)

**Why it happens:** RLS 활성화 시 policy가 없으면 default deny

**How to avoid:**
```typescript
// ❌ WRONG: RLS context 없이 쿼리
const students = await db.student.findMany() // Returns empty!

// ✅ CORRECT: RLS context 먼저 설정
await setRLSSessionContext({ teacherId, role, teamId })
const students = await db.student.findMany() // Returns filtered data
```

### Pitfall 5: Client-Side Filtering으로 대용량 데이터 처리

**What goes wrong:** 1000+명 선생님을 client-side에서 필터링 시 느려짐

**Why it happens:** 모든 데이터를 전송한 후 client에서 필터링

**How to avoid:**
```typescript
// ❌ WRONG: Client-side filtering
const allTeachers = await db.teacher.findMany() // 1000+ rows
const filtered = allTeachers.filter(t => t.role === 'TEACHER')

// ✅ CORRECT: Server-side filtering
const teachers = await db.teacher.findMany({
  where: { role: 'TEACHER' },
  skip: (page - 1) * 20,
  take: 20,
})
```

## Code Examples

Verified patterns from official sources:

### Prisma Extension for Team Filtering

```typescript
// src/lib/db/schema-extensions.ts
// Source: https://www.prisma.io/docs/concepts/components/prisma-client/middleware (→ extensions)
import { PrismaClient } from '@prisma/client'

export function withTeamFiltering(prisma: PrismaClient, role: string, teamId: string | null) {
  return prisma.$extends({
    query: {
      $allOperations({ model, args, query }) {
        // Director: no filtering
        if (role === 'DIRECTOR') {
          return query(args)
        }

        // Apply team filter for Teacher and Student
        if ((model === 'Teacher' || model === 'Student') && teamId) {
          args.where = { ...args.where, teamId }
        }

        return query(args)
      },
    },
  })
}
```

### PostgreSQL RLS Policy

```sql
-- prisma/migrations/xxx/migration.sql
-- Source: https://www.crunchydata.com/blog/row-level-security-for-tenants-in-postgres

CREATE POLICY "Student_team_isolation_policy"
ON "Student"
FOR ALL
TO application
USING (
  current_setting('rls.teacher_role', TRUE) = 'DIRECTOR' OR
  (current_setting('rls.teacher_role', TRUE) = 'TEAM_LEADER' AND
   teamId = current_setting('rls.team_id', TRUE)::uuid) OR
  (id = current_setting('rls.teacher_id', TRUE)::uuid)
);
```

### Role-Based Access Control in Next.js 15

```typescript
// src/middleware.ts
// Source: https://clerk.com/blog/nextjs-role-based-access-control
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const session = await getSession(req)

  // Protect admin routes
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (session?.role !== 'DIRECTOR') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return NextResponse.next()
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Prisma Middleware | Prisma Client Extensions | v4.16.0 (2023) | Middleware deprecated, Extensions로 migration 필수 |
| App-level filtering only | PostgreSQL RLS + App filtering | 2024+ | Defense in depth, DB-level 강제 |
| Client-side pagination | Server-side pagination | Always for large datasets | TanStack Table에 내장된 server-side pattern |
| Role in DB only | JWT payload with role | JWT era (현재) | DB 조회 없이 session에서 role 접근 |

**Deprecated/outdated:**
- **Prisma Middleware**: v4.16.0부터 deprecated, Extensions로 대체
- **Application-only tenant isolation**: RLS 없이는 insufficient
- **Client-side only filtering**: 대용량 데이터에 부적합

## Open Questions

Things that couldn't be fully resolved:

1. **Prisma Client Extensions 생성 시점**
   - What we know: Extensions는 PrismaClient instance에 $extends로 호출
   - What's unclear: Request 단위로 extension 생성 vs singleton pattern
   - Recommendation: Session context (role, teamId)는 요청마다 다르므로 request 단위 생성 필요. 성능 테스트로 검증 필요.

2. **RLS Policy 복잡도**
   - What we know: Director/TeamLeader/Manager/Teacher 4가지 role에 따른 policy 작성
   - What's unclear: Policy의 performance overhead (매 요청마다 current_setting 호출)
   - Recommendation: PostgreSQL connection pooling (PgBouncer) 사용 시 session variable 유지 확인 필요.

3. **기존 Student 데이터 마이그레이션 시점**
   - What we know: teamId는 NULL로 시작, 추후 업데이트
   - What's unclear: 언제 NULL을 허용하지 않을지 (NOT NULL 제약조건 적용 시점)
   - Recommendation: Phase 11에서는 nullable로 유지, Phase 12-13에서 학생-선생님 배정 시 업데이트.

## Sources

### Primary (HIGH confidence)

- [Prisma Middleware Documentation (Deprecated Notice)](https://www.prisma.io/docs/concepts/components/prisma-client/middleware) - Middleware는 v4.16.0부터 deprecated
- [Crunchy Data - Row Level Security for Tenants in Postgres](https://www.crunchydata.com/blog/row-level-security-for-tenants-in-postgres) - RLS session variable pattern
- [PostgreSQL CREATE POLICY Documentation](https://www.postgresql.org/docs/current/sql-createpolicy.html) - RLS policy 문법
- [Clerk - Implement Role-Based Access Control in Next.js 15](https://clerk.com/blog/nextjs-role-based-access-control) - Next.js 15 RBAC pattern (2025-02-07)
- [Shadcn UI Data Table Documentation](https://ui.shadcn.com/docs/components/data-table) - TanStack Table 통합 가이드
- [Travis of the North - Zero Downtime Postgres Migration](https://travisofthenorth.com/blog/2017/2/2/postgres-adding-foreign-keys-with-zero-downtime) - NOT VALID 제약조건 패턴

### Secondary (MEDIUM confidence)

- [How to Use Row-Level Security in PostgreSQL (OneUptime, 2026-01-25)](https://oneuptime.com/blog/post/2026-01-25-use-row-level-security-postgresql/view) - 최신 RLS 가이드
- [How to Implement PostgreSQL Row Level Security for Multi-Tenant SaaS (TechBuddies, 2026-01-01)](https://www.techbuddies.io/2026/01/01/how-to-implement-postgresql-row-level-security-for-multi-tenant-saas/) - Multi-tenant RLS 구현
- [Postgres RLS Implementation Guide (Permit.io)](https://www.permit.io/blog/postgres-rls-implementation-guide) - RLS best practices
- [Squawk - Adding Foreign Key Constraints](https://squawkhq.com/docs/adding-foreign-key-constraint) - NOT VALID 패턴 설명
- [DBA StackExchange - NOT VALID Foreign Key Discussion](https://dba.stackexchange.com/questions/343791/do-you-need-not-valid-when-adding-new-foreign-key-column) - NOT VALID 필요성 확인

### Tertiary (LOW confidence - requiring validation)

- Prisma Middleware vs Extensions performance comparison (공식 문서에 deprecated 명시만 있고, performance benchmark 없음)
- RLS policy performance overhead (실제 production data에서의 측정치 없음)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Prisma 7.3.0, PostgreSQL 16, Jose 6.1.3는 현재 사용 중, verified in package.json
- Architecture (Prisma Extensions): HIGH - Prisma 공식 문서에서 deprecated 명시, Extensions가 권장
- Architecture (PostgreSQL RLS): HIGH - Crunchy Data 가이드, PostgreSQL 공식 문서 verified
- Architecture (Next.js RBAC): HIGH - Clerk 최신 블로그 (2025-02-07) verified
- Architecture (TanStack Table): HIGH - Shadcn UI 공식 문서 verified
- Migration (NOT VALID constraint): MEDIUM - Zero-downtime 패턴 verified, but production test 필요
- UI patterns: HIGH - Shadcn UI + TanStack Table은 표준 pattern

**Research date:** 2026-01-30
**Valid until:** 2026-03-01 (60 days - stack은 stable하지만 Prisma Extensions 실무 사용 검증 필요)

**Critical monitoring:**
- Prisma Extensions performance impact (middleware vs extensions benchmark 필요)
- PostgreSQL RLS policy performance (대용량 데이터에서의 overhead 확인)
- RLS session variable persistence (PgBouncer 사용 시 동작 확인)
