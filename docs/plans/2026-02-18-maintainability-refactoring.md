# 유지보수성 개선 리팩토링 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 매칭/궁합 영역의 코드 중복을 제거하고, 대형 파일을 분해하여 유지보수성을 개선한다.

**Architecture:** Bottom-Up 접근법으로 데이터 조회 계층부터 통합하고, Server Actions 분해, 에러 처리 통일, 컴포넌트 개선 순서로 진행한다. 각 Phase는 독립적으로 배포 가능하며, Phase 완료 시 커밋 + 테스트 통과를 확인한다.

**Tech Stack:** Next.js 15, Prisma 7, TypeScript, Vitest

**Design:** `docs/plans/2026-02-18-maintainability-refactoring-design.md`

---

## Phase 1: 공유 데이터 조회 함수 추출

### Task 1: 타입 정의 파일 생성

**Files:**
- Create: `src/lib/db/matching/types.ts`

**Step 1: 타입 정의 파일 작성**

`src/lib/db/matching/types.ts`에 분석 데이터 조회 결과의 공통 타입을 정의한다.
기존 코드에서 `as unknown as MbtiPercentages`로 캐스팅하던 부분을 타입 가드로 대체한다.

```typescript
import type { MbtiPercentages } from "@/lib/analysis/mbti-scoring"
import type { SajuResult } from "@/lib/analysis/saju"
import type { NameNumerologyResult } from "@/lib/analysis/name-numerology"

/**
 * 단일 대상(학생 또는 선생님)의 분석 데이터 조회 결과
 */
export type SubjectAnalyses = {
  mbti: MbtiPercentages | null
  saju: SajuResult | null
  name: NameNumerologyResult | null
}

/**
 * 선생님-학생 쌍의 분석 데이터
 */
export type PairAnalyses = {
  teacher: SubjectAnalyses
  student: SubjectAnalyses
}

/**
 * 배치 조회용: 선생님 정보 + 분석 데이터
 */
export type TeacherWithAnalyses = {
  id: string
  name: string
  role: string
  currentStudentCount: number
  analyses: SubjectAnalyses
}
```

**Step 2: 커밋**

```bash
git add src/lib/db/matching/types.ts
git commit -m "refactor: 매칭 분석 공통 타입 정의 추가"
```

---

### Task 2: 타입 가드 함수 + 단위 테스트 작성

**Files:**
- Create: `src/lib/db/matching/type-guards.ts`
- Create: `tests/lib/db/matching/type-guards.test.ts`

**Step 1: 실패하는 테스트 작성**

`tests/lib/db/matching/type-guards.test.ts`:

```typescript
import { describe, it, expect } from "vitest"
import { parseMbtiPercentages, parseSajuResult } from "@/lib/db/matching/type-guards"

describe("parseMbtiPercentages", () => {
  it("유효한 MBTI 퍼센티지를 반환한다", () => {
    const valid = { E: 60, I: 40, S: 55, N: 45, T: 70, F: 30, J: 65, P: 35 }
    expect(parseMbtiPercentages(valid)).toEqual(valid)
  })

  it("null 입력이면 null을 반환한다", () => {
    expect(parseMbtiPercentages(null)).toBeNull()
    expect(parseMbtiPercentages(undefined)).toBeNull()
  })

  it("유효하지 않은 구조면 null을 반환한다", () => {
    expect(parseMbtiPercentages({ E: 60 })).toBeNull()
    expect(parseMbtiPercentages("string")).toBeNull()
    expect(parseMbtiPercentages(42)).toBeNull()
  })
})

describe("parseSajuResult", () => {
  it("유효한 사주 결과를 반환한다", () => {
    const valid = {
      fourPillars: { year: {}, month: {}, day: {}, hour: {} },
      fiveElements: { wood: 1, fire: 1, earth: 1, metal: 1, water: 1 },
    }
    expect(parseSajuResult(valid)).toEqual(valid)
  })

  it("null 입력이면 null을 반환한다", () => {
    expect(parseSajuResult(null)).toBeNull()
  })

  it("필수 필드가 없으면 null을 반환한다", () => {
    expect(parseSajuResult({ fourPillars: {} })).toBeNull()
    expect(parseSajuResult({})).toBeNull()
  })
})
```

**Step 2: 테스트 실행하여 실패 확인**

Run: `pnpm vitest run tests/lib/db/matching/type-guards.test.ts`
Expected: FAIL (모듈 없음)

**Step 3: 타입 가드 구현**

`src/lib/db/matching/type-guards.ts`:

```typescript
import type { MbtiPercentages } from "@/lib/analysis/mbti-scoring"
import type { SajuResult } from "@/lib/analysis/saju"
import type { NameNumerologyResult } from "@/lib/analysis/name-numerology"

const MBTI_KEYS = ["E", "I", "S", "N", "T", "F", "J", "P"] as const

/**
 * DB에서 조회한 MBTI 퍼센티지를 안전하게 파싱
 *
 * Prisma의 Json 타입은 runtime에 unknown이므로,
 * 8개 키(E,I,S,N,T,F,J,P)가 모두 number인지 검증한다.
 */
export function parseMbtiPercentages(
  data: unknown
): MbtiPercentages | null {
  if (!data || typeof data !== "object") return null
  const obj = data as Record<string, unknown>

  for (const key of MBTI_KEYS) {
    if (typeof obj[key] !== "number") return null
  }

  return data as MbtiPercentages
}

/**
 * DB에서 조회한 사주 결과를 안전하게 파싱
 *
 * fourPillars와 fiveElements 필드 존재 여부로 검증한다.
 */
export function parseSajuResult(
  data: unknown
): SajuResult | null {
  if (!data || typeof data !== "object") return null
  const obj = data as Record<string, unknown>

  if (!obj.fourPillars || typeof obj.fourPillars !== "object") return null
  if (!obj.fiveElements || typeof obj.fiveElements !== "object") return null

  return data as SajuResult
}

/**
 * DB에서 조회한 이름 분석 결과에서 NameNumerologyResult를 추출
 *
 * name-compatibility.ts의 extractNumerologyFromResult를 대체하며,
 * 동일한 로직이지만 여기서 중앙 관리한다.
 */
export function parseNameNumerology(
  dbResult: unknown
): NameNumerologyResult | null {
  if (!dbResult || typeof dbResult !== "object") return null
  const obj = dbResult as Record<string, unknown>
  if (!obj.numerology || typeof obj.numerology !== "object") return null
  return obj.numerology as NameNumerologyResult
}
```

**Step 4: 테스트 실행하여 통과 확인**

Run: `pnpm vitest run tests/lib/db/matching/type-guards.test.ts`
Expected: PASS (3/3)

**Step 5: 커밋**

```bash
git add src/lib/db/matching/type-guards.ts tests/lib/db/matching/type-guards.test.ts
git commit -m "refactor: 매칭 분석 데이터 타입 가드 함수 추가 (TDD)"
```

---

### Task 3: 공유 데이터 조회 함수 + 테스트 작성

**Files:**
- Create: `src/lib/db/matching/fetch-analysis.ts`
- Create: `tests/lib/db/matching/fetch-analysis.test.ts`

**Step 1: 실패하는 테스트 작성**

`tests/lib/db/matching/fetch-analysis.test.ts`:

DB 모킹이 필요하므로, 조회 함수의 결과 변환 로직을 중심으로 테스트한다.
실제 DB 호출은 통합 테스트에서 검증한다.

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest"

// db mock
vi.mock("@/lib/db", () => ({
  db: {
    mbtiAnalysis: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    sajuAnalysis: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    nameAnalysis: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

import { db } from "@/lib/db"
import { fetchSubjectAnalyses, fetchBatchAnalyses } from "@/lib/db/matching/fetch-analysis"

const mockedDb = vi.mocked(db)

describe("fetchSubjectAnalyses", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("분석 데이터가 있으면 파싱된 결과를 반환한다", async () => {
    const mbtiData = { E: 60, I: 40, S: 55, N: 45, T: 70, F: 30, J: 65, P: 35 }
    const sajuData = { fourPillars: { year: {}, month: {}, day: {}, hour: {} }, fiveElements: { wood: 1, fire: 1, earth: 1, metal: 1, water: 1 } }
    const nameData = { numerology: { split: {}, strokes: {}, grids: { won: 10, hyung: 20, yi: 15, jeong: 25 }, interpretations: {} } }

    mockedDb.mbtiAnalysis.findUnique.mockResolvedValue({ percentages: mbtiData } as any)
    mockedDb.sajuAnalysis.findUnique.mockResolvedValue({ result: sajuData } as any)
    mockedDb.nameAnalysis.findUnique.mockResolvedValue({ result: nameData } as any)

    const result = await fetchSubjectAnalyses("student-1", "STUDENT")

    expect(result.mbti).toEqual(mbtiData)
    expect(result.saju).toEqual(sajuData)
    expect(result.name).not.toBeNull()
  })

  it("분석 데이터가 없으면 null을 반환한다", async () => {
    mockedDb.mbtiAnalysis.findUnique.mockResolvedValue(null)
    mockedDb.sajuAnalysis.findUnique.mockResolvedValue(null)
    mockedDb.nameAnalysis.findUnique.mockResolvedValue(null)

    const result = await fetchSubjectAnalyses("student-1", "STUDENT")

    expect(result.mbti).toBeNull()
    expect(result.saju).toBeNull()
    expect(result.name).toBeNull()
  })
})

describe("fetchBatchAnalyses", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("여러 대상의 분석 데이터를 Map으로 반환한다", async () => {
    const mbtiData = { E: 60, I: 40, S: 55, N: 45, T: 70, F: 30, J: 65, P: 35 }

    mockedDb.mbtiAnalysis.findMany.mockResolvedValue([
      { subjectId: "t1", percentages: mbtiData } as any,
    ])
    mockedDb.sajuAnalysis.findMany.mockResolvedValue([])
    mockedDb.nameAnalysis.findMany.mockResolvedValue([])

    const result = await fetchBatchAnalyses(["t1", "t2"], "TEACHER")

    expect(result.get("t1")?.mbti).toEqual(mbtiData)
    expect(result.get("t2")?.mbti).toBeNull()
  })

  it("빈 ID 배열이면 빈 Map을 반환한다", async () => {
    const result = await fetchBatchAnalyses([], "TEACHER")
    expect(result.size).toBe(0)
  })
})
```

**Step 2: 테스트 실행하여 실패 확인**

Run: `pnpm vitest run tests/lib/db/matching/fetch-analysis.test.ts`
Expected: FAIL (모듈 없음)

**Step 3: 공유 조회 함수 구현**

`src/lib/db/matching/fetch-analysis.ts`:

```typescript
import { db } from "@/lib/db"
import type { SubjectType } from "@prisma/client"
import type { SubjectAnalyses } from "./types"
import {
  parseMbtiPercentages,
  parseSajuResult,
  parseNameNumerology,
} from "./type-guards"

/**
 * 단일 대상의 분석 데이터(MBTI, 사주, 이름)를 일괄 조회
 *
 * 3개의 분석 테이블을 Promise.all로 병렬 조회하고,
 * 타입 가드를 통해 안전하게 파싱된 결과를 반환한다.
 *
 * @param subjectId - 대상 ID (학생 또는 선생님)
 * @param subjectType - 대상 타입 ('STUDENT' | 'TEACHER')
 * @returns 파싱된 분석 결과 (없으면 각 필드가 null)
 */
export async function fetchSubjectAnalyses(
  subjectId: string,
  subjectType: SubjectType
): Promise<SubjectAnalyses> {
  const [mbtiRow, sajuRow, nameRow] = await Promise.all([
    db.mbtiAnalysis.findUnique({
      where: { subjectType_subjectId: { subjectType, subjectId } },
      select: { percentages: true },
    }),
    db.sajuAnalysis.findUnique({
      where: { subjectType_subjectId: { subjectType, subjectId } },
      select: { result: true },
    }),
    db.nameAnalysis.findUnique({
      where: { subjectType_subjectId: { subjectType, subjectId } },
      select: { result: true },
    }),
  ])

  return {
    mbti: parseMbtiPercentages(mbtiRow?.percentages),
    saju: parseSajuResult(sajuRow?.result),
    name: parseNameNumerology(nameRow?.result),
  }
}

/**
 * 여러 대상의 분석 데이터를 배치 조회
 *
 * findMany + Map 변환으로 N+1 쿼리를 방지한다.
 * assignment.ts, llm-compatibility.ts에서 선생님 목록 조회에 사용.
 *
 * @param subjectIds - 대상 ID 배열
 * @param subjectType - 대상 타입 ('STUDENT' | 'TEACHER')
 * @returns subjectId → SubjectAnalyses 매핑
 */
export async function fetchBatchAnalyses(
  subjectIds: string[],
  subjectType: SubjectType
): Promise<Map<string, SubjectAnalyses>> {
  if (subjectIds.length === 0) return new Map()

  const [mbtis, sajus, names] = await Promise.all([
    db.mbtiAnalysis.findMany({
      where: { subjectType, subjectId: { in: subjectIds } },
      select: { subjectId: true, percentages: true },
    }),
    db.sajuAnalysis.findMany({
      where: { subjectType, subjectId: { in: subjectIds } },
      select: { subjectId: true, result: true },
    }),
    db.nameAnalysis.findMany({
      where: { subjectType, subjectId: { in: subjectIds } },
      select: { subjectId: true, result: true },
    }),
  ])

  const mbtiMap = new Map(mbtis.map((m) => [m.subjectId, m.percentages]))
  const sajuMap = new Map(sajus.map((s) => [s.subjectId, s.result]))
  const nameMap = new Map(names.map((n) => [n.subjectId, n.result]))

  const result = new Map<string, SubjectAnalyses>()

  for (const id of subjectIds) {
    result.set(id, {
      mbti: parseMbtiPercentages(mbtiMap.get(id)),
      saju: parseSajuResult(sajuMap.get(id)),
      name: parseNameNumerology(nameMap.get(id)),
    })
  }

  return result
}

/**
 * 선생님-학생 쌍의 분석 데이터를 일괄 조회
 *
 * compatibility.ts의 analyzeCompatibility에서 사용.
 * 두 대상의 분석 데이터를 병렬로 조회한다.
 */
export async function fetchPairAnalyses(
  teacherId: string,
  studentId: string
): Promise<{ teacher: SubjectAnalyses; student: SubjectAnalyses }> {
  const [teacher, student] = await Promise.all([
    fetchSubjectAnalyses(teacherId, "TEACHER"),
    fetchSubjectAnalyses(studentId, "STUDENT"),
  ])

  return { teacher, student }
}
```

**Step 4: 테스트 실행하여 통과 확인**

Run: `pnpm vitest run tests/lib/db/matching/fetch-analysis.test.ts`
Expected: PASS (4/4)

**Step 5: 커밋**

```bash
git add src/lib/db/matching/fetch-analysis.ts tests/lib/db/matching/fetch-analysis.test.ts
git commit -m "refactor: 매칭 분석 데이터 공유 조회 함수 추가 (TDD)"
```

---

### Task 4: 배럴 export 파일 생성

**Files:**
- Modify: `src/lib/db/matching/index.ts` (없으면 생성)

**Step 1: index.ts 배럴 파일 생성**

기존 `src/lib/db/matching/` 디렉토리에는 `compatibility-result.ts`와 `assignment.ts`가 있다.
배럴 파일로 기존 export와 새 export를 통합한다.

`src/lib/db/matching/index.ts`:

```typescript
// 기존 모듈
export { upsertCompatibilityResult, getCompatibilityResult, getAllCompatibilityResultsForStudent, getAllCompatibilityResultsForTeacher, getAllCompatibilityResultsForTeam, deleteCompatibilityResult } from "./compatibility-result"

// 새 모듈
export { fetchSubjectAnalyses, fetchBatchAnalyses, fetchPairAnalyses } from "./fetch-analysis"
export type { SubjectAnalyses, PairAnalyses, TeacherWithAnalyses } from "./types"
export { parseMbtiPercentages, parseSajuResult, parseNameNumerology } from "./type-guards"
```

**Step 2: 커밋**

```bash
git add src/lib/db/matching/index.ts
git commit -m "refactor: 매칭 DB 모듈 배럴 export 추가"
```

---

### Task 5: compatibility.ts를 공유 함수로 전환

**Files:**
- Modify: `src/lib/actions/matching/compatibility.ts`

**Step 1: 기존 테스트 통과 확인**

Run: `pnpm vitest run`
Expected: 모든 기존 테스트 PASS

**Step 2: compatibility.ts 리팩토링**

기존 코드에서:
- 46-75줄의 `Promise.all([db.mbtiAnalysis.findUnique...])` 중복 제거
- `as unknown as MbtiPercentages` 캐스팅 제거
- `extractNumerologyFromResult` 대신 `fetchPairAnalyses` 사용

수정 후 `src/lib/actions/matching/compatibility.ts`:

```typescript
"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { verifySession } from "@/lib/dal"
import { calculateCompatibilityScore } from "@/lib/analysis/compatibility-scoring"
import { upsertCompatibilityResult } from "@/lib/db/matching/compatibility-result"
import { fetchPairAnalyses } from "@/lib/db/matching/fetch-analysis"

/**
 * 선생님-학생 궁합 분석 실행
 */
export async function analyzeCompatibility(
  teacherId: string,
  studentId: string
) {
  await verifySession()

  const teacher = await db.teacher.findUnique({
    where: { id: teacherId },
    select: {
      id: true,
      _count: { select: { students: true } },
    },
  })

  if (!teacher) {
    throw new Error("선생님을 찾을 수 없어요.")
  }

  // 공유 함수로 분석 데이터 일괄 조회
  const { teacher: teacherAnalyses, student: studentAnalyses } =
    await fetchPairAnalyses(teacherId, studentId)

  const score = calculateCompatibilityScore(
    {
      mbti: teacherAnalyses.mbti,
      saju: teacherAnalyses.saju,
      name: teacherAnalyses.name,
      currentLoad: teacher._count.students,
    },
    {
      mbti: studentAnalyses.mbti,
      saju: studentAnalyses.saju,
      name: studentAnalyses.name,
    }
  )

  await upsertCompatibilityResult(teacherId, studentId, score)

  revalidatePath(`/students/${studentId}`)
  revalidatePath(`/teachers/${teacherId}`)

  return { success: true, score }
}

/**
 * 다수 학생에 대해 궁합 분석 일괄 실행
 */
export async function batchAnalyzeCompatibility(studentIds: string[]) {
  await verifySession()

  const teachers = await db.teacher.findMany({
    select: { id: true },
  })

  if (teachers.length === 0) {
    throw new Error("팀에 선생님이 없어요.")
  }

  const results = await Promise.all(
    studentIds.map(async (studentId) => {
      const compatibilityResults = await Promise.all(
        teachers.map((teacher) =>
          analyzeCompatibility(teacher.id, studentId).catch((error) => {
            console.error(
              `궁합 분석 실패 (Teacher: ${teacher.id}, Student: ${studentId}):`,
              error
            )
            return null
          })
        )
      )

      return {
        studentId,
        results: compatibilityResults.filter((r) => r !== null),
      }
    })
  )

  return { success: true, results }
}
```

**Step 3: 전체 테스트 실행**

Run: `pnpm vitest run`
Expected: 모든 테스트 PASS

**Step 4: 커밋**

```bash
git add src/lib/actions/matching/compatibility.ts
git commit -m "refactor: compatibility.ts를 공유 조회 함수로 전환"
```

---

### Task 6: assignment.ts의 getTeacherRecommendations를 공유 함수로 전환

**Files:**
- Modify: `src/lib/actions/matching/assignment.ts`

**Step 1: assignment.ts 리팩토링**

`getTeacherRecommendations` 함수(231-335줄)에서:
- 학생 분석 데이터 조회 → `fetchSubjectAnalyses` 사용
- 선생님 배치 분석 데이터 조회 → `fetchBatchAnalyses` 사용
- `as unknown as` 캐스팅 전부 제거
- `extractNumerologyFromResult` import 제거

나머지 함수(assignStudentToTeacher, reassignStudent, assignStudentBatch, applyAutoAssignment)는 분석 데이터를 직접 조회하지 않으므로 변경 불필요.

`getTeacherRecommendations` 수정:

```typescript
// 기존 import 변경
import { fetchSubjectAnalyses, fetchBatchAnalyses } from "@/lib/db/matching/fetch-analysis"
// extractNumerologyFromResult import 제거
// MbtiPercentages, SajuResult import 제거

export async function getTeacherRecommendations(studentId: string) {
  await verifySession()

  const student = await db.student.findUnique({
    where: { id: studentId },
    select: { id: true, name: true },
  })

  if (!student) {
    throw new Error("학생을 찾을 수 없어요.")
  }

  // 공유 함수로 학생 분석 데이터 조회
  const studentAnalyses = await fetchSubjectAnalyses(studentId, "STUDENT")

  const teachers = await db.teacher.findMany({
    where: { role: { in: ["TEACHER", "MANAGER", "TEAM_LEADER"] } },
    select: {
      id: true,
      name: true,
      role: true,
      _count: { select: { students: true } },
    },
  })

  if (teachers.length === 0) {
    return { studentId: student.id, studentName: student.name, recommendations: [] }
  }

  // 공유 함수로 선생님 배치 분석 데이터 조회
  const teacherIds = teachers.map((t) => t.id)
  const teacherAnalysesMap = await fetchBatchAnalyses(teacherIds, "TEACHER")

  const totalStudentCount = await db.student.count()
  const averageLoad = teachers.length > 0 ? totalStudentCount / teachers.length : 15

  const recommendations = teachers.map((teacher) => {
    const tAnalyses = teacherAnalysesMap.get(teacher.id) ?? { mbti: null, saju: null, name: null }

    const score = calculateCompatibilityScore(
      {
        mbti: tAnalyses.mbti,
        saju: tAnalyses.saju,
        name: tAnalyses.name,
        currentLoad: teacher._count.students,
      },
      {
        mbti: studentAnalyses.mbti,
        saju: studentAnalyses.saju,
        name: studentAnalyses.name,
      },
      averageLoad
    )

    return {
      teacherId: teacher.id,
      teacherName: teacher.name,
      teacherRole: teacher.role,
      currentStudentCount: teacher._count.students,
      score,
      breakdown: score.breakdown,
      reasons: score.reasons,
    }
  })

  recommendations.sort((a, b) => b.score.overall - a.score.overall)

  return { studentId: student.id, studentName: student.name, recommendations }
}
```

**Step 2: 전체 테스트 실행**

Run: `pnpm vitest run`
Expected: 모든 테스트 PASS

**Step 3: 커밋**

```bash
git add src/lib/actions/matching/assignment.ts
git commit -m "refactor: assignment.ts의 분석 조회를 공유 함수로 전환"
```

---

### Task 7: llm-compatibility.ts를 공유 함수로 전환

**Files:**
- Modify: `src/lib/actions/admin/llm-compatibility.ts`

**Step 1: llm-compatibility.ts 리팩토링**

변경 대상:
- 학생 분석 데이터 조회(145-158줄) → `fetchSubjectAnalyses` 사용
- 선생님 배치 분석 데이터 조회(177-194줄) → `fetchBatchAnalyses` 사용
- `as unknown as` 캐스팅(208-219줄) 제거
- `extractNumerologyFromResult` import → 제거
- `MbtiPercentages`, `SajuResult` import → 제거

수정 후 getLLMTeacherRecommendations의 데이터 조회 부분:

```typescript
// import 변경
import { fetchSubjectAnalyses, fetchBatchAnalyses } from "@/lib/db/matching/fetch-analysis"
// 아래 import 제거:
// import type { MbtiPercentages } from "@/lib/analysis/mbti-scoring"
// import type { SajuResult } from "@/lib/analysis/saju"
// import { extractNumerologyFromResult } from "@/lib/analysis/name-compatibility"

// getLLMTeacherRecommendations 내부:

  // 학생 분석 데이터 조회
  const studentAnalyses = await fetchSubjectAnalyses(studentId, "STUDENT")

  // ... 선생님 목록 조회 (기존 코드 유지) ...

  // 선생님 배치 분석 데이터 조회
  const teacherIds = teachers.map((t) => t.id)
  const teacherAnalysesMap = await fetchBatchAnalyses(teacherIds, "TEACHER")

  // 프롬프트용 데이터 변환 (캐스팅 없이)
  const studentData: StudentData = {
    id: student.id,
    name: student.name,
    mbti: studentAnalyses.mbti,
    saju: studentAnalyses.saju,
    nameAnalysis: studentAnalyses.name,
  }

  const teacherDataList: TeacherData[] = teachers.map((t) => {
    const tAnalyses = teacherAnalysesMap.get(t.id) ?? { mbti: null, saju: null, name: null }
    return {
      id: t.id,
      name: t.name,
      role: t.role,
      mbti: tAnalyses.mbti,
      saju: tAnalyses.saju,
      nameAnalysis: tAnalyses.name,
      currentStudentCount: t._count.students,
    }
  })
```

**Step 2: 전체 테스트 실행**

Run: `pnpm vitest run`
Expected: 모든 테스트 PASS

**Step 3: 커밋**

```bash
git add src/lib/actions/admin/llm-compatibility.ts
git commit -m "refactor: llm-compatibility.ts의 분석 조회를 공유 함수로 전환"
```

---

### Task 8: 사용자 입력 요청 — extractNumerologyFromResult 처리 결정

**Human input requested:**

`extractNumerologyFromResult` 함수가 `name-compatibility.ts`에 남아있고, `type-guards.ts`에 `parseNameNumerology`로 동일한 기능이 새로 생겼다.

결정할 사항:
- 기존 `extractNumerologyFromResult` → deprecated로 표기하고 `parseNameNumerology`를 re-export할지
- 기존 함수를 완전히 제거하고 모든 호출부를 새 함수로 교체할지

다른 파일에서의 사용처 확인 필요:
Run: `grep -r "extractNumerologyFromResult" src/`

---

### Task 9: extractNumerologyFromResult 정리

**Files:**
- Modify: `src/lib/analysis/name-compatibility.ts`

**Step 1: 기존 함수를 새 함수의 re-export로 전환**

`src/lib/analysis/name-compatibility.ts`에서:

```typescript
// 기존 extractNumerologyFromResult 구현을 제거하고
// type-guards.ts의 parseNameNumerology를 re-export

import { parseNameNumerology } from "@/lib/db/matching/type-guards"

/**
 * @deprecated parseNameNumerology (from @/lib/db/matching) 사용을 권장합니다.
 * 하위 호환을 위해 re-export합니다.
 */
export const extractNumerologyFromResult = parseNameNumerology
```

이렇게 하면 기존 호출부가 깨지지 않으면서, 새 코드는 `parseNameNumerology`를 직접 사용할 수 있다.

**Step 2: 전체 테스트 실행**

Run: `pnpm vitest run`
Expected: 모든 테스트 PASS

**Step 3: 커밋**

```bash
git add src/lib/analysis/name-compatibility.ts
git commit -m "refactor: extractNumerologyFromResult를 parseNameNumerology re-export로 전환"
```

---

### Task 10: Phase 1 검증 — 전체 테스트 + 빌드

**Step 1: 전체 단위 테스트 실행**

Run: `pnpm vitest run`
Expected: 모든 테스트 PASS (기존 34건 + 신규 7건 이상)

**Step 2: TypeScript 빌드 검증**

Run: `pnpm tsc --noEmit`
Expected: 에러 없음

**Step 3: Next.js 빌드 검증**

Run: `pnpm build`
Expected: 빌드 성공

**Step 4: 성과 확인**

확인 항목:
- `compatibility.ts`: `as unknown as` 캐스팅 0개
- `assignment.ts`: `as unknown as` 캐스팅 0개
- `llm-compatibility.ts`: `as unknown as` 캐스팅 0개
- 세 파일 모두 `extractNumerologyFromResult` 직접 import 없음
- `fetchSubjectAnalyses`, `fetchBatchAnalyses` 사용 확인

Run: `grep -c "as unknown as" src/lib/actions/matching/compatibility.ts src/lib/actions/matching/assignment.ts src/lib/actions/admin/llm-compatibility.ts`
Expected: 각 파일 0

---

## Phase 2-4: 후속 작업 (별도 계획)

Phase 1 완료 후 결과를 검증하고, Phase 2(대형 Server Action 분해), Phase 3(에러 처리 통일), Phase 4(거대 컴포넌트 개선)의 상세 구현 계획을 작성한다.

Phase 2-4는 Phase 1의 패턴을 따르며:
- 각 Task는 TDD (테스트 → 구현 → 검증)
- 각 Task 완료 시 커밋
- Phase 완료 시 전체 빌드 검증
