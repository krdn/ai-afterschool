# Phase 37: Autocomplete Search API - Research

**Researched:** 2026-02-19
**Domain:** Next.js 15 Route Handler + Prisma 7 full-text(contains) search + RBAC
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### 검색 동작
- 초성 검색(ㄱㄴㄷ) 미지원 — 완성된 글자만 검색 가능
- 최소 검색 글자수: 1자 이상 (ROADMAP 2자 기준에서 완화 — 한국어 특성상 "김" 한 글자도 의미 있음)
- 타입 필터: `?types=student,teacher,team` 쿼리 파라미터로 특정 타입만 검색 가능 (ROADMAP 명시)

#### 응답 구조
- 서브레이블 풍부하게 구성:
  - 학생: 학년 + 학교 + 생년월일
  - 선생님: 역할 + 담당학생수
  - 학급(팀): 팀명 + 인원수
- 아바타/프로필 이미지 URL 포함 — 드롭다운에서 시각적 구분 용이

### Claude's Discretion
- 결과 최대 개수 (타입별 또는 전체)
- 결과 정렬 기준 (이름 사전순 vs 관련도)
- 응답 그룹핑 방식 (타입별 그룹 vs 플랫 리스트 + type 필드)
- 디바운스 전략 (클라이언트 전용 vs 서버 병행)
- 쿼리 병렬 실행 전략 (Promise.all vs UNION ALL)
- 서버 측 캐싱 여부 및 TTL
- AbortController 서버 측 처리 방식
- 빈 결과 메시지 형태
- 특수문자 처리 (제거 vs 그대로 검색)
- RBAC 접근 불가 엔티티 처리 (조용히 제외 vs 명시적 알림)
- 인증 실패 응답 방식 (기존 앱 패턴 따름)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MENT-06 | 학생, 선생님, 학급(팀) 3가지 엔티티 타입을 멘션할 수 있다 | GET /api/chat/mentions/search 라우트가 3가지 타입 모두 검색 지원. RBAC 필터를 통해 접근 가능한 엔티티만 반환. mention-types.ts의 MentionType('student'|'teacher'|'team')과 일관성 유지. |
</phase_requirements>

---

## Summary

Phase 37은 신규 파일 하나(`/api/chat/mentions/search/route.ts`)를 추가하는 단일 라우트 구현이다. 기존 코드베이스에 이미 검증된 패턴(verifySession, NextRequest.nextUrl.searchParams, Prisma contains mode:insensitive, Promise.all 병렬 쿼리, NextResponse.json)이 모두 존재하므로 새 라이브러리 설치 없이 순수 조합 작업으로 완성 가능하다.

핵심 설계 판단 사항은 세 가지다. (1) 응답 구조는 **타입별 그룹 객체** (`{ students: [...], teachers: [...], teams: [...] }`)가 Phase 38 드롭다운 섹션 렌더링에 직접 매핑되어 플랫 리스트보다 유리하다. (2) RBAC는 **조용히 제외(silent filter)** — 검색 자체가 탐색 행위이므로 "접근 불가" 메시지 없이 결과에서 제외하는 것이 UX상 자연스럽고 mentor-resolver와의 역할 분리도 명확하다. (3) 결과 상한은 **타입별 5건(총 최대 15건)** — 드롭다운 UX에서 20건 이상은 읽히지 않으며, 빠른 응답이 정확도보다 중요하다.

**Primary recommendation:** `verifySession` + `Promise.all([db.student.findMany, db.teacher.findMany, db.team.findMany])` + 타입별 그룹 응답. 외부 라이브러리 불필요, 새 마이그레이션 불필요.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js Route Handler | ^15.5.10 | GET /api/chat/mentions/search 구현 | 앱 전체 API 패턴과 동일, AbortController는 클라이언트 signal이 서버에 propagate됨 |
| Prisma Client | ^7.4.0 | DB 검색 쿼리 | contains + mode:'insensitive'로 대소문자/한글 부분 일치. 이미 다른 검색에서 검증됨 |
| verifySession (`@/lib/dal`) | — | 인증 | 모든 신규 API 라우트 표준. getSession 대신 verifySession 사용 (더 엄격한 검증) |
| NextResponse.json | — | JSON 응답 | providers/route.ts, feature-mappings/route.ts 등 전체 API 일관 패턴 |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| TypeScript strict | ^5 | 응답 타입 정의 | SearchResult 타입을 mention-types.ts 옆에 정의하거나 route.ts 내 인라인 |
| Zod | ^4.3.6 | 쿼리 파라미터 검증 | 선택적. q 길이 검증 + types enum 검증. 간단해서 수동 검증도 충분 |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Promise.all 3개 쿼리 | Prisma $queryRaw UNION ALL | UNION ALL은 타입별 limit 적용이 불편하고 타입 안전성 낮음. Promise.all이 명확하고 유지보수 쉬움 |
| 타입별 그룹 응답 | 플랫 배열 + type 필드 | 플랫은 Phase 38에서 섹션 구분 렌더링 시 filter 단계 추가 필요. 그룹이 직접 매핑됨 |
| silent filter (RBAC) | 접근 거부 메시지 반환 | 검색 단계는 탐색이므로 조용히 제외가 자연스러움. mention-resolver는 submit 시 명시적 알림을 담당 |
| 서버 측 캐싱 없음 | Redis TTL 캐시 | 검색은 매번 다른 q 값. 캐시 효율 낮고 복잡도 증가. 클라이언트 디바운스로 충분 |

**Installation:** 추가 패키지 없음.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/api/chat/
│   ├── route.ts                    # 기존 POST /api/chat (Phase 36)
│   └── mentions/
│       └── search/
│           └── route.ts            # 신규 GET /api/chat/mentions/search
├── lib/chat/
│   ├── mention-types.ts            # 기존 MentionType, MentionItem (변경 없음)
│   ├── mention-resolver.ts         # 기존 (변경 없음)
│   └── context-builder.ts          # 기존 (변경 없음)
└── hooks/
    └── use-mention-search.ts       # Phase 38용 클라이언트 훅 (이번 Phase 범위 밖)
```

### Pattern 1: GET Route Handler with searchParams (검증된 앱 패턴)

**What:** `request.nextUrl.searchParams`로 쿼리 파라미터 추출
**When to use:** 모든 GET API 라우트에서 표준 패턴

```typescript
// Source: Next.js 공식 문서 + 앱 내 /api/providers/route.ts 동일 패턴
import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/dal'

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession()
    // verifySession은 인증 실패 시 redirect('/auth/login')를 호출하므로
    // 별도 401 체크 불필요. 단, GET 라우트에서 redirect가 발생하면
    // fetch 클라이언트가 리다이렉트를 따라가므로 실질적으로 인증 강제됨.

    const { searchParams } = request.nextUrl
    const q = searchParams.get('q') ?? ''
    const typesParam = searchParams.get('types') ?? 'student,teacher,team'

    // 파라미터 검증
    if (q.trim().length < 1) {
      return NextResponse.json({ students: [], teachers: [], teams: [] })
    }

    // ...쿼리 실행
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### Pattern 2: Promise.all 병렬 Prisma 쿼리 (검증된 앱 패턴)

**What:** 독립적인 DB 쿼리를 병렬 실행하여 지연 최소화
**When to use:** 타입별 쿼리가 서로 독립적일 때 (이 케이스에 해당)

```typescript
// Source: mention-resolver.ts 내 resolveStudents()가 동일 패턴 사용
const [students, teachers, teams] = await Promise.all([
  db.student.findMany({
    where: {
      name: { contains: q, mode: 'insensitive' },
      ...(rbacFilter.student),  // RBAC 조건
    },
    select: {
      id: true,
      name: true,
      grade: true,
      school: true,
      birthDate: true,
      images: {
        where: { type: 'profile' },
        select: { resizedUrl: true },
        take: 1,
      },
    },
    orderBy: { name: 'asc' },
    take: 5,
  }),
  db.teacher.findMany({ ... }),
  db.team.findMany({ ... }),
])
```

### Pattern 3: RBAC 필터 (검증된 앱 패턴)

**What:** 세션의 role과 teamId를 기반으로 where 조건 생성
**When to use:** 학생/선생님 쿼리 시 항상

```typescript
// Source: mention-resolver.ts resolveStudents() + /api/teams/route.ts 동일 패턴
function buildStudentWhere(q: string, session: VerifiedSession) {
  const base = { name: { contains: q, mode: 'insensitive' as const } }
  if (session.role === 'DIRECTOR') return base
  return { ...base, teamId: session.teamId }
}

function buildTeacherWhere(q: string, session: VerifiedSession) {
  const base = { name: { contains: q, mode: 'insensitive' as const } }
  if (session.role === 'DIRECTOR') return base
  return { ...base, teamId: session.teamId }
}

function buildTeamWhere(q: string, session: VerifiedSession) {
  const base = { name: { contains: q, mode: 'insensitive' as const } }
  if (session.role === 'DIRECTOR') return base
  // 비 DIRECTOR는 자신의 팀만 (id 매칭)
  if (!session.teamId) return { ...base, id: '__never__' } // 빈 결과 보장
  return { ...base, id: session.teamId }
}
```

### Pattern 4: 응답 타입 — SearchResult

```typescript
// mention-types.ts에 추가하거나 route.ts 내 인라인 정의
export type MentionSearchResult = {
  id: string
  type: MentionType
  name: string           // displayName
  sublabel: string       // 예: "3학년 · 강남초 · 2010-05-12" / "TEACHER · 5명" / "12명"
  avatarUrl: string | null
}

export type MentionSearchResponse = {
  students: MentionSearchResult[]
  teachers: MentionSearchResult[]
  teams: MentionSearchResult[]
}
```

### Anti-Patterns to Avoid

- **getSession 사용:** `/api/teams/route.ts`가 `getSession`을 사용하나, 최신 패턴은 `verifySession` (더 엄격한 세션 검증 + RLS 설정 포함). 새 라우트는 반드시 `verifySession` 사용.
- **verifySession의 redirect 의존:** `verifySession`은 미인증 시 `redirect()`를 호출한다. GET 요청에서 302 리다이렉트를 받으면 fetch가 자동으로 따라가 로그인 페이지 HTML을 반환한다. 클라이언트에서 `res.ok` 체크 또는 `res.redirected` 체크가 필요하다. 단, 기존 `use-chat-stream.ts`도 동일 구조이므로 앱 전체 패턴과 일치한다.
- **q가 빈 문자열일 때 DB 조회:** 빈 q로 `contains: ''`를 쿼리하면 모든 레코드가 매칭된다. 반드시 조기 반환.
- **TeamId null인 사용자가 팀 쿼리:** `session.teamId`가 null인 비 DIRECTOR는 팀 쿼리 결과를 빈 배열로 반환해야 한다. `where: { id: undefined }`는 Prisma에서 전체 조회가 될 수 있으므로 명시적 처리 필요.
- **`export const dynamic = 'force-static'`:** Next.js 15에서 GET 라우트 핸들러는 기본적으로 동적(non-cached). 이 라우트는 사용자별 RBAC 결과를 반환하므로 정적 캐싱 금지. 이 export 추가하지 말 것.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 한글 대소문자 무관 검색 | 직접 정규식 | Prisma `contains + mode:'insensitive'` | PostgreSQL ILIKE로 변환됨. 이미 `detail.ts`, `performance.ts`에서 사용 검증됨 |
| 병렬 쿼리 | 순차 await | `Promise.all([...])` | mention-resolver.ts에서 동일 패턴. 직렬 대비 ~2-3배 빠름 |
| 인증 | 직접 쿠키 파싱 | `verifySession()` | RLS 설정, 세션 복호화, 리다이렉트 포함 |
| 쿼리 파라미터 추출 | `new URL(request.url)` | `request.nextUrl.searchParams` | Next.js 15 공식 패턴. 앱 내 모든 GET 라우트 동일 |

**Key insight:** 이 Phase의 모든 개별 기술 조각은 이미 코드베이스에 존재한다. 조합만 하면 된다.

---

## Common Pitfalls

### Pitfall 1: verifySession의 redirect() 동작
**What goes wrong:** `verifySession()`은 인증 실패 시 `redirect('/auth/login')`을 호출하는데, 이는 Next.js `redirect()`이므로 서버에서 `NEXT_REDIRECT` 예외를 throw한다. try/catch로 잡으면 안 되고, 잡히면 500을 반환하게 된다.
**Why it happens:** Next.js `redirect()`는 예외 기반 구현이므로 일반 Error로 catch됨.
**How to avoid:** try/catch 블록에서 `NEXT_REDIRECT` 예외를 재throw하거나, verifySession 호출을 try/catch 바깥에 두지 않는다. 기존 `/api/providers/route.ts` 패턴 참고 — verifySession을 try 블록 안에 두되 catch에서 NEXT_REDIRECT를 필터링하거나 그냥 throw.

```typescript
// 안전한 패턴 (providers/route.ts 동일)
export async function GET(request: NextRequest) {
  try {
    const session = await verifySession()  // try 안에서 호출
    // ...
  } catch (error) {
    // NEXT_REDIRECT는 재throw
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') throw error
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

실제로 `/api/providers/route.ts`는 try 안에서 verifySession을 호출하고 catch에서 별도 처리 없이 500을 반환한다. Next.js 내부적으로 NEXT_REDIRECT는 Response가 아닌 throw이므로 catch를 통과하지 않는다 (Next.js가 미들웨어 레벨에서 처리). 앱 기존 패턴대로 따르면 된다.

### Pitfall 2: teamId null인 사용자의 팀(Team) 쿼리
**What goes wrong:** `session.role !== 'DIRECTOR'`이고 `session.teamId === null`인 사용자가 팀 검색 시, `where: { name: { contains: q }, id: null }`을 전달하면 Prisma가 오류를 낸다.
**Why it happens:** Prisma에서 `id: null`은 "null인 레코드"를 찾으나 Team.id는 String @id이므로 null일 수 없음.
**How to avoid:**

```typescript
function buildTeamWhere(q: string, session: VerifiedSession) {
  if (session.role === 'DIRECTOR') {
    return { name: { contains: q, mode: 'insensitive' as const } }
  }
  if (!session.teamId) {
    return null  // null을 반환하면 호출측에서 빈 배열 즉시 반환
  }
  return { id: session.teamId, name: { contains: q, mode: 'insensitive' as const } }
}

// 사용:
const teamWhere = buildTeamWhere(q, session)
const teams = teamWhere
  ? await db.team.findMany({ where: teamWhere, ... })
  : []
```

### Pitfall 3: types 파라미터 파싱 시 빈 문자열
**What goes wrong:** `?types=` (값 없음)를 파싱하면 `''`이 되고, `''.split(',')` = `['']`이 되어 유효하지 않은 타입 `''`이 포함됨.
**How to avoid:**

```typescript
const typesParam = searchParams.get('types') ?? ''
const requestedTypes = typesParam
  .split(',')
  .map(t => t.trim())
  .filter((t): t is MentionType => ['student', 'teacher', 'team'].includes(t))

// requestedTypes가 비면 3가지 모두 검색
const activeTypes: MentionType[] = requestedTypes.length > 0
  ? requestedTypes
  : ['student', 'teacher', 'team']
```

### Pitfall 4: 이미지 URL — Student vs Teacher 구조 차이
**What goes wrong:** Teacher는 `profileImage: String?` 필드 직접, Student는 `images: StudentImage[]` 관계 테이블 별도 조회.
**Why it happens:** 데이터 모델이 다르다.
**How to avoid:**
- 학생 아바타: `images: { where: { type: 'profile' }, select: { resizedUrl: true }, take: 1 }` include
- 선생님 아바타: `profileImage` 필드 직접 select
- 팀 아바타: 없음 (null 반환)

### Pitfall 5: AbortController — 서버 측 처리
**What goes wrong:** 클라이언트가 fetch를 abort해도 서버 Prisma 쿼리는 이미 실행 중이면 완료된다. "서버 측 AbortController"를 구현하려는 시도는 복잡도만 올린다.
**Why it happens:** HTTP 연결 단절 시 Next.js 라우트 핸들러는 이미 시작된 async 작업을 중단하지 않는다.
**How to avoid:** ROADMAP의 "AbortController 취소 지원"은 **클라이언트 측 fetch abort**를 의미한다. 서버는 특별한 처리 없이, 클라이언트에서 `AbortController`를 사용해 이전 요청을 cancel하면 충분하다. 서버 응답은 완료되지만 클라이언트가 무시한다. 이는 acceptable trade-off이며 `use-chat-stream.ts`가 이미 동일 패턴을 사용한다.

---

## Code Examples

### 완전한 Route Handler 뼈대

```typescript
// Source: 앱 내 패턴 조합 (providers/route.ts + mention-resolver.ts)
// File: src/app/api/chat/mentions/search/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/dal'
import { db } from '@/lib/db'
import type { MentionType } from '@/lib/chat/mention-types'

const RESULTS_PER_TYPE = 5

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession()

    const { searchParams } = request.nextUrl
    const q = searchParams.get('q')?.trim() ?? ''

    // 최소 1자 검증
    if (q.length < 1) {
      return NextResponse.json({ students: [], teachers: [], teams: [] })
    }

    // types 파라미터 파싱
    const typesParam = searchParams.get('types') ?? ''
    const validTypes: MentionType[] = ['student', 'teacher', 'team']
    const requestedTypes = typesParam.length > 0
      ? typesParam.split(',').map(t => t.trim()).filter(
          (t): t is MentionType => validTypes.includes(t as MentionType)
        )
      : validTypes

    // 특수문자: Prisma contains는 리터럴 문자열 검색이므로 그대로 전달
    // (SQL 인젝션은 Prisma가 파라미터화로 방어)
    const searchQ = q

    // 타입별 조건부 병렬 쿼리
    const [studentResults, teacherResults, teamResults] = await Promise.all([
      requestedTypes.includes('student')
        ? db.student.findMany({
            where: {
              name: { contains: searchQ, mode: 'insensitive' },
              ...(session.role !== 'DIRECTOR' ? { teamId: session.teamId } : {}),
            },
            select: {
              id: true, name: true, grade: true,
              school: true, birthDate: true,
              images: {
                where: { type: 'profile' },
                select: { resizedUrl: true },
                take: 1,
              },
            },
            orderBy: { name: 'asc' },
            take: RESULTS_PER_TYPE,
          })
        : Promise.resolve([]),

      requestedTypes.includes('teacher')
        ? db.teacher.findMany({
            where: {
              name: { contains: searchQ, mode: 'insensitive' },
              ...(session.role !== 'DIRECTOR' ? { teamId: session.teamId } : {}),
            },
            select: {
              id: true, name: true, role: true,
              profileImage: true,
              _count: { select: { students: true } },
            },
            orderBy: { name: 'asc' },
            take: RESULTS_PER_TYPE,
          })
        : Promise.resolve([]),

      requestedTypes.includes('team') && session.teamId
        ? db.team.findMany({
            where: {
              name: { contains: searchQ, mode: 'insensitive' },
              ...(session.role !== 'DIRECTOR' ? { id: session.teamId } : {}),
            },
            select: {
              id: true, name: true,
              _count: { select: { students: true, teachers: true } },
            },
            orderBy: { name: 'asc' },
            take: RESULTS_PER_TYPE,
          })
        : Promise.resolve([]),
    ])

    // 응답 변환
    const students = studentResults.map(s => ({
      id: s.id,
      type: 'student' as const,
      name: s.name,
      sublabel: `${s.grade}학년 · ${s.school} · ${s.birthDate.toISOString().slice(0, 10)}`,
      avatarUrl: s.images[0]?.resizedUrl ?? null,
    }))

    const teachers = teacherResults.map(t => ({
      id: t.id,
      type: 'teacher' as const,
      name: t.name,
      sublabel: `${t.role} · 담당 ${t._count.students}명`,
      avatarUrl: t.profileImage ?? null,
    }))

    const teams = teamResults.map(t => ({
      id: t.id,
      type: 'team' as const,
      name: t.name,
      sublabel: `학생 ${t._count.students}명 · 교사 ${t._count.teachers}명`,
      avatarUrl: null,
    }))

    return NextResponse.json({ students, teachers, teams })
  } catch (error) {
    console.error('[MentionSearch] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### 타입 정의 (mention-types.ts에 추가)

```typescript
// Source: 기존 mention-types.ts 패턴 연장

/** 자동완성 검색 결과 단일 항목 */
export type MentionSearchItem = {
  id: string
  type: MentionType
  name: string
  sublabel: string
  avatarUrl: string | null
}

/** GET /api/chat/mentions/search 응답 */
export type MentionSearchResponse = {
  students: MentionSearchItem[]
  teachers: MentionSearchItem[]
  teams: MentionSearchItem[]
}
```

### 클라이언트 훅 뼈대 (Phase 38 참고용, 이번 Phase 범위 밖)

```typescript
// Phase 38에서 구현. 연구 목적으로만 기록.
// AbortController 패턴은 use-chat-stream.ts와 동일.
"use client"
import { useRef, useCallback, useState } from 'react'
import type { MentionSearchResponse } from '@/lib/chat/mention-types'

export function useMentionSearch() {
  const abortRef = useRef<AbortController | null>(null)
  const [results, setResults] = useState<MentionSearchResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const search = useCallback(async (q: string, types?: string) => {
    abortRef.current?.abort()  // 이전 요청 취소
    const controller = new AbortController()
    abortRef.current = controller

    setIsLoading(true)
    try {
      const params = new URLSearchParams({ q })
      if (types) params.set('types', types)
      const res = await fetch(`/api/chat/mentions/search?${params}`, {
        signal: controller.signal,
      })
      if (res.ok) {
        const data: MentionSearchResponse = await res.json()
        setResults(data)
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return  // 정상 취소
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { search, results, isLoading }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| GET 라우트 기본 캐싱 | GET 라우트 기본 비캐싱 | Next.js 15 | `export const dynamic = 'force-static'` 없으면 항상 동적. 이 라우트는 원하는 동작 |
| `new URL(request.url).searchParams` | `request.nextUrl.searchParams` | Next.js 13 App Router | NextRequest 전용 확장 API. 더 간결 |
| getSession (lib/session.ts) | verifySession (lib/dal.ts) | 앱 자체 패턴 | verifySession이 RLS 설정 + 더 엄격한 검증 포함. 신규 라우트 표준 |

**Deprecated/outdated:**
- `getSession`: `/api/teams/route.ts`에서 여전히 사용하나, `verifySession`이 신규 라우트 표준. 이 Phase에서 `getSession` 사용 금지.

---

## Open Questions

1. **Teacher 역할(role) 서브레이블 표시 형식**
   - What we know: Teacher.role은 Prisma Role enum (`DIRECTOR`, `TEAM_LEADER`, `MANAGER`, `TEACHER`)
   - What's unclear: 한국어 표시명 매핑이 있는지 (예: DIRECTOR → "원장")
   - Recommendation: 앱 내 기존 역할 표시 코드 확인 후 일관성 유지. 없으면 영문 그대로 사용.

2. **`session.teamId`가 null인 비 DIRECTOR의 Team 검색**
   - What we know: MANAGER 역할은 팀 없이 존재 가능
   - What's unclear: MANAGER가 팀 검색 시 어떤 결과가 적절한가 (전체? 빈 배열?)
   - Recommendation: 팀 배정 없으면 빈 배열. 자신의 팀 소속이 아니므로 접근 없는 것이 RBAC 원칙에 부합.

3. **다중 teamId를 가진 선생님 (미래 확장)**
   - What we know: 현재 Teacher.teamId는 단일 String?
   - What's unclear: 미래 다중 팀 지원 시 검색 확장 필요 여부
   - Recommendation: 이번 Phase는 현재 단일 teamId 스키마로 구현. 스키마 변경 시 where 조건만 수정.

---

## Sources

### Primary (HIGH confidence)

- 앱 내 `/src/lib/chat/mention-resolver.ts` — Promise.all 병렬 쿼리, RBAC 필터 패턴
- 앱 내 `/src/app/api/providers/route.ts` — verifySession + NextRequest.nextUrl.searchParams + NextResponse.json 패턴
- 앱 내 `/src/lib/actions/student/detail.ts` — contains mode:insensitive 검색 패턴
- 앱 내 `/src/hooks/use-chat-stream.ts` — AbortController 클라이언트 취소 패턴
- 앱 내 `/src/lib/chat/mention-types.ts` — MentionType, MentionItem 타입 정의
- 앱 내 `prisma/schema.prisma` — Student(images 관계), Teacher(profileImage), Team 모델 구조
- Context7 `/vercel/next.js` — `request.nextUrl.searchParams` GET 라우트 패턴, Next.js 15 동적 캐싱 기본값

### Secondary (MEDIUM confidence)

- Next.js 공식 문서 (Context7) — Next.js 15 GET 라우트 비캐싱 기본 동작 확인

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — 모든 기술이 앱 내 이미 사용 중
- Architecture: HIGH — 코드베이스 직접 분석으로 패턴 확인
- Pitfalls: HIGH — 실제 코드 검토로 발견 (teamId null, redirect 동작, 이미지 구조 차이)
- Claude's discretion 권장사항: MEDIUM — 타입별 5건, 타입별 그룹 응답, silent RBAC 필터는 합리적 판단이나 다른 선택도 유효

**Research date:** 2026-02-19
**Valid until:** 2026-03-20 (안정적 스택, 30일 유효)
