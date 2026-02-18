# 사주 분석 캐시 배지 + 강제 새로고침 UI 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 학생·선생님 사주 분석 패널에 캐시 히트 배지(`⚡ 캐시됨`)와 강제 새로고침 버튼(`⟳`)을 추가하고, 선생님 사주에 캐시 인프라(히스토리 테이블 + 백엔드 로직)를 신규 구축한다.

**Architecture:**
- DB: `TeacherSajuAnalysisHistory` 테이블 추가 (Prisma 마이그레이션)
- 백엔드: `runTeacherSajuAnalysis`에 캐시 조회 + `forceRefresh` + 히스토리 저장 추가; 학생 쪽 `runSajuAnalysisAction`은 이미 `forceRefresh` 지원하므로 UI 연결만 필요
- UI: 두 패널에 `isCached` state + 배지 + 헤더 새로고침 버튼 추가

**Tech Stack:** Next.js 15 Server Actions, Prisma ORM, PostgreSQL, React `useTransition`, Tailwind CSS, lucide-react

---

## Task 1: Prisma 스키마에 TeacherSajuAnalysisHistory 추가

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: 스키마에 모델 추가**

`prisma/schema.prisma`의 `SajuAnalysisHistory` 모델 바로 아래에 추가:

```prisma
model TeacherSajuAnalysisHistory {
  id                String   @id @default(cuid())
  teacherId         String
  promptId          String   @default("default")
  additionalRequest String?
  result            Json
  interpretation    String?
  usedProvider      String   @default("내장 알고리즘")
  usedModel         String?
  calculatedAt      DateTime
  createdAt         DateTime @default(now())

  @@index([teacherId])
  @@index([teacherId, createdAt(sort: Desc)])
}
```

**Step 2: 마이그레이션 생성 및 적용**

```bash
cd /home/gon/projects/ai/ai-afterschool
pnpm prisma migrate dev --name add_teacher_saju_history
```

Expected: `migrations/20260218XXXXXX_add_teacher_saju_history/migration.sql` 파일 생성, DB 적용 완료

**Step 3: Prisma 클라이언트 재생성 확인**

```bash
pnpm prisma generate
```

Expected: `TeacherSajuAnalysisHistory` 타입이 `@prisma/client`에 포함됨

**Step 4: 커밋**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: TeacherSajuAnalysisHistory 테이블 추가"
```

---

## Task 2: 선생님 사주 히스토리 DB 함수 추가

**Files:**
- Modify: `src/lib/db/student/analysis.ts` (teacherId 히스토리 함수 추가)

**Step 1: 히스토리 생성/조회 함수 추가**

`src/lib/db/student/analysis.ts` 파일 맨 아래에 추가:

```typescript
// ---------------------------------------------------------------------------
// 선생님 사주 분석 이력
// ---------------------------------------------------------------------------

export type TeacherSajuHistoryPayload = {
  teacherId: string
  promptId: string
  additionalRequest?: string | null
  result: Prisma.InputJsonValue
  interpretation?: string | null
  usedProvider: string
  usedModel?: string | null
  calculatedAt?: Date
}

export async function createTeacherSajuHistory(payload: TeacherSajuHistoryPayload) {
  return db.teacherSajuAnalysisHistory.create({
    data: {
      teacherId: payload.teacherId,
      promptId: payload.promptId,
      additionalRequest: payload.additionalRequest ?? null,
      result: payload.result,
      interpretation: payload.interpretation ?? null,
      usedProvider: payload.usedProvider,
      usedModel: payload.usedModel ?? null,
      calculatedAt: payload.calculatedAt ?? new Date(),
    },
  })
}

export async function getTeacherSajuHistoryList(teacherId: string) {
  return db.teacherSajuAnalysisHistory.findMany({
    where: { teacherId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      promptId: true,
      additionalRequest: true,
      usedProvider: true,
      usedModel: true,
      calculatedAt: true,
      createdAt: true,
      interpretation: true,
    },
  })
}
```

**Step 2: 타입 오류 확인**

```bash
pnpm tsc --noEmit 2>&1 | grep analysis.ts
```

Expected: 오류 없음

**Step 3: 커밋**

```bash
git add src/lib/db/student/analysis.ts
git commit -m "feat: 선생님 사주 히스토리 DB 함수 추가"
```

---

## Task 3: 선생님 사주 액션에 캐시 + forceRefresh 추가

**Files:**
- Modify: `src/lib/actions/teacher/analysis.ts`

**Step 1: `runTeacherSajuAnalysis` 시그니처에 `forceRefresh` 추가 및 캐시 로직 삽입**

`src/lib/actions/teacher/analysis.ts`에서:

1. import에 `createTeacherSajuHistory` 추가:
```typescript
import { upsertSajuAnalysis, upsertNameAnalysis, createTeacherSajuHistory } from "@/lib/db/student/analysis"
```

2. `TeacherSajuAnalysisData` 타입에 `cached` 필드 추가:
```typescript
type TeacherSajuAnalysisData = {
  result: SajuResult
  interpretation: string
  llmFailed: boolean
  llmError: string | undefined
  usedProvider: string
  usedModel: string | undefined
  cached: boolean  // 추가
}
```

3. 함수 시그니처에 `forceRefresh` 추가:
```typescript
export async function runTeacherSajuAnalysis(
  teacherId: string,
  provider?: string,
  promptId?: string,
  additionalRequest?: string,
  forceRefresh?: boolean  // 추가
): Promise<ActionResult<TeacherSajuAnalysisData>>
```

4. `sajuResult` 계산 직후(line ~89), LLM 분기 전에 캐시 확인 블록 삽입:
```typescript
const resolvedPromptId = promptId || 'default'
const useLLM = provider && provider !== 'built-in'

// 캐시 확인
if (!forceRefresh && useLLM) {
  const cached = await db.teacherSajuAnalysisHistory.findFirst({
    where: {
      teacherId,
      promptId: resolvedPromptId,
      additionalRequest: additionalRequest || null,
      usedProvider: provider === 'auto' ? { not: '내장 알고리즘' } : provider,
    },
    orderBy: { createdAt: 'desc' },
    select: { interpretation: true, usedProvider: true, usedModel: true },
  })

  if (cached?.interpretation) {
    const inputSnapshot = {
      birthDate: teacher.birthDate!.toISOString(),
      timeKnown: Boolean(time),
      time,
      longitude: 127.0,
      promptId: resolvedPromptId,
    }
    await upsertSajuAnalysis(teacherId, {
      inputSnapshot,
      result: sajuResult,
      interpretation: cached.interpretation,
      status: 'complete',
      version: 1,
      calculatedAt: new Date(),
      usedProvider: cached.usedProvider,
      usedModel: cached.usedModel,
    }, 'TEACHER')

    revalidatePath(`/teachers/${teacherId}`)
    return ok({
      result: sajuResult,
      interpretation: cached.interpretation,
      llmFailed: false,
      llmError: undefined,
      usedProvider: cached.usedProvider,
      usedModel: cached.usedModel ?? undefined,
      cached: true,
    })
  }
}
```

5. 기존 return ok(...) 에 `cached: false` 추가:
```typescript
return ok({
  result: sajuResult,
  interpretation,
  llmFailed,
  llmError,
  usedProvider,
  usedModel,
  cached: false,  // 추가
})
```

6. `upsertSajuAnalysis` 호출 후 히스토리 저장 추가 (LLM 성공 시):
```typescript
// 이벤트 발행 직전에 추가
if (useLLM && !llmFailed) {
  await createTeacherSajuHistory({
    teacherId,
    promptId: resolvedPromptId,
    additionalRequest: additionalRequest || null,
    result: sajuResult as Prisma.InputJsonValue,
    interpretation,
    usedProvider,
    usedModel: usedModel ?? null,
  })
}
```

**Step 2: 타입 오류 확인**

```bash
pnpm tsc --noEmit 2>&1 | grep "teacher/analysis"
```

Expected: 오류 없음

**Step 3: 커밋**

```bash
git add src/lib/actions/teacher/analysis.ts
git commit -m "feat: 선생님 사주 분석에 캐시 조회 및 forceRefresh 추가"
```

---

## Task 4: 학생 사주 UI — 캐시 배지 + 새로고침 버튼

**Files:**
- Modify: `src/components/students/saju-analysis-panel.tsx`

**Step 1: `isCached` state 추가 및 `handleRunAnalysis` 수정**

`saju-analysis-panel.tsx`에서:

1. state 추가 (`simplifyError` 선언 아래):
```typescript
const [isCached, setIsCached] = useState(false)
```

2. `handleRunAnalysis` 함수에서 `setIsCached(false)` 초기화 추가 (다른 set 호출 옆):
```typescript
setIsCached(false)
```

3. `runSajuAnalysisAction` 호출 부분을 `forceRefresh` 파라미터 지원으로 변경:
```typescript
// handleRunAnalysis 함수에 forceRefresh 파라미터 추가
const handleRunAnalysis = (forceRefresh = false) => {
  startTransition(async () => {
    setErrorMessage(null)
    setProviderLabel(null)
    setPromptLabel(null)
    setSimplifiedText(null)
    setShowSimplified(false)
    setSimplifyError(null)
    setIsCached(false)
    try {
      const promptId = isLLM ? selectedPromptId : 'default'
      const extra = isLLM ? additionalRequest.trim() || undefined : undefined
      const res = await runSajuAnalysisAction(student.id, selectedProvider, promptId, extra, forceRefresh)
      if (res.llmFailed) {
        setErrorMessage(`내장 알고리즘으로 대체 해석했습니다. ${res.llmError || 'LLM 설정을 확인해주세요.'}`)
        setProviderLabel('내장 알고리즘')
      } else {
        const model = res.usedModel && res.usedModel !== 'default' ? ` (${res.usedModel})` : ''
        setProviderLabel(`${res.usedProvider}${model}`)
        setIsCached(res.cached ?? false)
      }
      // ... 나머지 동일
    }
  })
}
```

**Step 2: 헤더에 새로고침 버튼 추가**

`CardHeader` 안의 버튼 그룹에 새로고침 버튼 추가 (이력 버튼 바로 뒤):

```tsx
<Button
  variant="outline"
  size="sm"
  className="gap-1"
  onClick={() => handleRunAnalysis(true)}
  disabled={isPending}
  title="캐시 무시하고 새로 분석"
>
  {isPending ? (
    <Loader2 className="h-4 w-4 animate-spin" />
  ) : (
    <RefreshCw className="h-4 w-4" />
  )}
  새로고침
</Button>
```

**Step 3: 해석 섹션 배지 영역에 캐시 배지 추가**

`providerLabel` 배지 바로 뒤에:

```tsx
{isCached && (
  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">
    ⚡ 캐시됨
  </span>
)}
```

**Step 4: 기존 버튼 onClick도 `handleRunAnalysis(false)` 로 명시적 변경**

```tsx
onClick={handleRunAnalysis}  →  onClick={() => handleRunAnalysis(false)}
```

에러 영역의 재시도 버튼도 동일:
```tsx
onClick={handleRunAnalysis}  →  onClick={() => handleRunAnalysis(false)}
```

**Step 5: 빌드 오류 확인**

```bash
pnpm tsc --noEmit 2>&1 | grep "saju-analysis-panel"
```

Expected: 오류 없음

**Step 6: 커밋**

```bash
git add src/components/students/saju-analysis-panel.tsx
git commit -m "feat: 학생 사주 패널에 캐시 배지 및 강제 새로고침 버튼 추가"
```

---

## Task 5: 선생님 사주 UI — 캐시 배지 + 새로고침 버튼

**Files:**
- Modify: `src/components/teachers/teacher-saju-panel.tsx`

**Step 1: `isCached` state 추가 및 `handleRunAnalysis` 수정**

`teacher-saju-panel.tsx`에서 Task 4와 동일한 패턴 적용:

1. state 추가:
```typescript
const [isCached, setIsCached] = useState(false)
```

2. `handleRunAnalysis`를 `forceRefresh` 파라미터 지원으로 변경:
```typescript
const handleRunAnalysis = (forceRefresh = false) => {
  startTransition(async () => {
    setErrorMessage(null)
    setProviderLabel(null)
    setPromptLabel(null)
    setSimplifiedText(null)
    setShowSimplified(false)
    setSimplifyError(null)
    setIsCached(false)
    try {
      const promptId = isLLM ? selectedPromptId : 'default'
      const extra = isLLM ? additionalRequest.trim() || undefined : undefined
      const res = await runTeacherSajuAnalysis(teacherId, selectedProvider, promptId, extra, forceRefresh)
      if (!res.success) {
        setErrorMessage(res.error ?? '사주 분석에 실패했습니다.')
        return
      }
      if (res.data.llmFailed) {
        setErrorMessage(`내장 알고리즘으로 대체 해석했습니다. ${res.data.llmError || 'LLM 설정을 확인해주세요.'}`)
        setProviderLabel('내장 알고리즘')
      } else {
        const model = res.data.usedModel && res.data.usedModel !== 'default' ? ` (${res.data.usedModel})` : ''
        setProviderLabel(`${res.data.usedProvider}${model}`)
        setIsCached(res.data.cached ?? false)
      }
      if (promptId !== 'default') {
        const meta = promptOptions.find((p) => p.id === promptId)
        if (meta) setPromptLabel(meta.name)
      }
      onAnalysisComplete?.()
    } catch (error) {
      setErrorMessage(`사주 분석에 실패했습니다. (원인: ${error instanceof Error ? error.message : '알 수 없는 오류'}) 다시 시도해주세요.`)
    }
  })
}
```

**Step 2: 헤더에 새로고침 버튼 추가**

`CardHeader`에 이력 버튼이 없다면 새로고침 버튼만 추가, 있다면 그 옆에:

```tsx
<Button
  variant="outline"
  size="sm"
  className="gap-1"
  onClick={() => handleRunAnalysis(true)}
  disabled={isPending}
  title="캐시 무시하고 새로 분석"
>
  {isPending ? (
    <Loader2 className="h-4 w-4 animate-spin" />
  ) : (
    <RefreshCw className="h-4 w-4" />
  )}
  새로고침
</Button>
```

**Step 3: 캐시 배지 추가**

`providerLabel` 배지 바로 뒤에 (Task 4와 동일):
```tsx
{isCached && (
  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">
    ⚡ 캐시됨
  </span>
)}
```

**Step 4: 기존 버튼 onClick 명시적 변경**

```tsx
onClick={handleRunAnalysis}  →  onClick={() => handleRunAnalysis(false)}
```

**Step 5: 빌드 오류 확인**

```bash
pnpm tsc --noEmit 2>&1 | grep "teacher-saju-panel"
```

Expected: 오류 없음

**Step 6: 커밋**

```bash
git add src/components/teachers/teacher-saju-panel.tsx
git commit -m "feat: 선생님 사주 패널에 캐시 배지 및 강제 새로고침 버튼 추가"
```

---

## Task 6: 전체 빌드 검증

**Step 1: 전체 타입 체크**

```bash
cd /home/gon/projects/ai/ai-afterschool
pnpm tsc --noEmit
```

Expected: 오류 0개

**Step 2: 빌드 확인**

```bash
pnpm build 2>&1 | tail -20
```

Expected: `✓ Compiled successfully` 또는 `Route ... compiled` 메시지

**Step 3: 단위 테스트 실행**

```bash
pnpm test run 2>&1 | tail -10
```

Expected: 기존 34/34 통과 유지

**Step 4: 최종 커밋 (필요 시)**

```bash
git add -A
git commit -m "chore: 사주 캐시 배지 UI 구현 완료"
```
