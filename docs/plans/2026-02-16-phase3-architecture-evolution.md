# Phase 3: 아키텍처 진화 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 분석 모델 통합, DDD 모듈화, SSE 실시간 알림, i18n 인프라를 구축하여 코드베이스 유지보수성과 확장성을 강화한다.

**Architecture:** 4개 Wave로 실행. Wave 1은 분석 모델 다형성 통합 (Prisma 스키마 + 마이그레이션). Wave 2는 DDD 점진적 모듈화 (actions/db 도메인별 재구성). Wave 3은 SSE 실시간 알림 (EventBus + SSE 엔드포인트). Wave 4는 i18n 인프라 (next-intl 설정 + 주요 컴포넌트 한/영 추출).

**Tech Stack:** Next.js 15.5, React 19.2, Prisma 7, PostgreSQL, next-intl, SSE (ReadableStream), EventEmitter, sonner (toast)

---

## Wave 1: 분석 모델 다형성 통합

### Task 1: Prisma 스키마에 SubjectType enum 및 통합 모델 작성

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: SubjectType enum 추가**

`prisma/schema.prisma` 상단 enum 영역에 추가:

```prisma
enum SubjectType {
  STUDENT
  TEACHER
}
```

**Step 2: SajuAnalysis 모델에 subjectType/subjectId 추가**

기존 `SajuAnalysis` 모델을 수정:
- `studentId` → `subjectId`로 변경
- `subjectType SubjectType` 필드 추가
- `usedProvider String?` 추가 (Teacher 모델에만 있던 필드)
- `usedModel String?` 추가
- `student Student? @relation(...)` → 제거 (다형성이므로 Prisma relation 불가)
- `@@unique([subjectType, subjectId])` 추가
- `@@index([subjectType, subjectId])` 추가

**Step 3: 나머지 4개 모델도 동일 패턴 적용**

NameAnalysis, MbtiAnalysis, FaceAnalysis, PalmAnalysis 각각:
- `studentId` → `subjectId`로 변경
- `subjectType SubjectType` 필드 추가
- Student/Teacher relation 제거
- `@@unique([subjectType, subjectId])` + `@@index` 추가

**Step 4: Teacher 전용 모델 5개 제거**

삭제 대상:
- `TeacherSajuAnalysis`
- `TeacherNameAnalysis`
- `TeacherMbtiAnalysis`
- `TeacherFaceAnalysis`
- `TeacherPalmAnalysis`

**Step 5: Student 모델에서 분석 relation 제거**

Student 모델의 `sajuAnalysis`, `nameAnalysis` 등 relation 필드 제거.
Teacher 모델의 `teacherSaju`, `teacherName` 등도 제거.

**Step 6: 커밋**

```bash
git add prisma/schema.prisma
git commit -m "refactor: 분석 모델 다형성 통합 스키마 작성 (SubjectType enum)"
```

---

### Task 2: 데이터 마이그레이션 SQL 작성

**Files:**
- Create: `prisma/migrations/20260216000000_unify_analysis_models/migration.sql`

**Step 1: 마이그레이션 SQL 작성**

```sql
-- SubjectType enum 생성
CREATE TYPE "SubjectType" AS ENUM ('STUDENT', 'TEACHER');

-- 1. SajuAnalysis 통합
ALTER TABLE "SajuAnalysis" ADD COLUMN "subjectType" "SubjectType";
ALTER TABLE "SajuAnalysis" ADD COLUMN "usedProvider" TEXT;
ALTER TABLE "SajuAnalysis" ADD COLUMN "usedModel" TEXT;
ALTER TABLE "SajuAnalysis" RENAME COLUMN "studentId" TO "subjectId";
UPDATE "SajuAnalysis" SET "subjectType" = 'STUDENT';
ALTER TABLE "SajuAnalysis" ALTER COLUMN "subjectType" SET NOT NULL;

-- Teacher 데이터 이관
INSERT INTO "SajuAnalysis" ("id", "subjectType", "subjectId", "inputSnapshot", "result", "interpretation", "status", "version", "calculatedAt", "usedProvider", "usedModel", "createdAt", "updatedAt")
SELECT "id", 'TEACHER', "teacherId", "inputSnapshot", "result", "interpretation", "status", "version", "calculatedAt", "usedProvider", "usedModel", "createdAt", "updatedAt"
FROM "TeacherSajuAnalysis";

-- 2. NameAnalysis 통합
ALTER TABLE "NameAnalysis" ADD COLUMN "subjectType" "SubjectType";
ALTER TABLE "NameAnalysis" RENAME COLUMN "studentId" TO "subjectId";
UPDATE "NameAnalysis" SET "subjectType" = 'STUDENT';
ALTER TABLE "NameAnalysis" ALTER COLUMN "subjectType" SET NOT NULL;

INSERT INTO "NameAnalysis" ("id", "subjectType", "subjectId", "inputSnapshot", "result", "interpretation", "status", "version", "calculatedAt", "createdAt", "updatedAt")
SELECT "id", 'TEACHER', "teacherId", "inputSnapshot", "result", "interpretation", "status", "version", "calculatedAt", "createdAt", "updatedAt"
FROM "TeacherNameAnalysis";

-- 3. MbtiAnalysis 통합
ALTER TABLE "MbtiAnalysis" ADD COLUMN "subjectType" "SubjectType";
ALTER TABLE "MbtiAnalysis" RENAME COLUMN "studentId" TO "subjectId";
UPDATE "MbtiAnalysis" SET "subjectType" = 'STUDENT';
ALTER TABLE "MbtiAnalysis" ALTER COLUMN "subjectType" SET NOT NULL;

INSERT INTO "MbtiAnalysis" ("id", "subjectType", "subjectId", "responses", "scores", "mbtiType", "percentages", "interpretation", "version", "calculatedAt", "createdAt", "updatedAt")
SELECT "id", 'TEACHER', "teacherId", "responses", "scores", "mbtiType", "percentages", "interpretation", "version", "calculatedAt", "createdAt", "updatedAt"
FROM "TeacherMbtiAnalysis";

-- 4. FaceAnalysis 통합
ALTER TABLE "FaceAnalysis" ADD COLUMN "subjectType" "SubjectType";
ALTER TABLE "FaceAnalysis" RENAME COLUMN "studentId" TO "subjectId";
UPDATE "FaceAnalysis" SET "subjectType" = 'STUDENT';
ALTER TABLE "FaceAnalysis" ALTER COLUMN "subjectType" SET NOT NULL;

INSERT INTO "FaceAnalysis" ("id", "subjectType", "subjectId", "imageUrl", "result", "status", "errorMessage", "version", "analyzedAt", "createdAt", "updatedAt")
SELECT "id", 'TEACHER', "teacherId", "imageUrl", "result", "status", "errorMessage", "version", "analyzedAt", "createdAt", "updatedAt"
FROM "TeacherFaceAnalysis";

-- 5. PalmAnalysis 통합
ALTER TABLE "PalmAnalysis" ADD COLUMN "subjectType" "SubjectType";
ALTER TABLE "PalmAnalysis" RENAME COLUMN "studentId" TO "subjectId";
UPDATE "PalmAnalysis" SET "subjectType" = 'STUDENT';
ALTER TABLE "PalmAnalysis" ALTER COLUMN "subjectType" SET NOT NULL;

INSERT INTO "PalmAnalysis" ("id", "subjectType", "subjectId", "hand", "imageUrl", "result", "status", "errorMessage", "version", "analyzedAt", "createdAt", "updatedAt")
SELECT "id", 'TEACHER', "teacherId", "hand", "imageUrl", "result", "status", "errorMessage", "version", "analyzedAt", "createdAt", "updatedAt"
FROM "TeacherPalmAnalysis";

-- 기존 FK 제약조건 제거 (studentId → subjectId 변경에 따라)
-- Prisma가 자동 관리하지만 명시적으로 처리

-- Teacher 전용 테이블 삭제
DROP TABLE IF EXISTS "TeacherSajuAnalysis";
DROP TABLE IF EXISTS "TeacherNameAnalysis";
DROP TABLE IF EXISTS "TeacherMbtiAnalysis";
DROP TABLE IF EXISTS "TeacherFaceAnalysis";
DROP TABLE IF EXISTS "TeacherPalmAnalysis";

-- 통합 인덱스 생성
CREATE UNIQUE INDEX "SajuAnalysis_subjectType_subjectId_key" ON "SajuAnalysis"("subjectType", "subjectId");
CREATE UNIQUE INDEX "NameAnalysis_subjectType_subjectId_key" ON "NameAnalysis"("subjectType", "subjectId");
CREATE UNIQUE INDEX "MbtiAnalysis_subjectType_subjectId_key" ON "MbtiAnalysis"("subjectType", "subjectId");
CREATE UNIQUE INDEX "FaceAnalysis_subjectType_subjectId_key" ON "FaceAnalysis"("subjectType", "subjectId");
CREATE UNIQUE INDEX "PalmAnalysis_subjectType_subjectId_key" ON "PalmAnalysis"("subjectType", "subjectId");

-- 기존 studentId 인덱스 제거 (있으면)
DROP INDEX IF EXISTS "SajuAnalysis_studentId_key";
DROP INDEX IF EXISTS "NameAnalysis_studentId_key";
DROP INDEX IF EXISTS "MbtiAnalysis_studentId_key";
DROP INDEX IF EXISTS "FaceAnalysis_studentId_key";
DROP INDEX IF EXISTS "PalmAnalysis_studentId_key";
```

**Step 2: Prisma generate 실행**

Run: `npx prisma generate`
Expected: Prisma client 재생성 성공

**Step 3: 커밋**

```bash
git add prisma/
git commit -m "refactor: 분석 모델 통합 마이그레이션 SQL 작성"
```

---

### Task 3: DB 함수 제네릭화

**Files:**
- Modify: `src/lib/db/mbti-analysis.ts` (학생+교사 통합)
- Modify: `src/lib/db/face-analysis.ts`
- Modify: `src/lib/db/palm-analysis.ts`
- Modify: `src/lib/db/name-analysis.ts`
- Modify: `src/lib/db/student-analysis.ts` (사주 분석)
- Delete: `src/lib/db/teacher-mbti-analysis.ts`
- Delete: `src/lib/db/teacher-face-analysis.ts`
- Delete: `src/lib/db/teacher-palm-analysis.ts`
- Delete: `src/lib/db/teacher-name-analysis.ts`
- Delete: `src/lib/db/teacher-saju-analysis.ts`

**Step 1: 공통 타입 정의**

각 DB 함수에서 `SubjectType` import 추가하고, 함수 시그니처를 `(subjectType: SubjectType, subjectId: string)` 패턴으로 변경.

예시 (mbti-analysis.ts):
```typescript
import { SubjectType } from '@/generated/prisma'

export async function getMbtiAnalysis(subjectType: SubjectType, subjectId: string) {
  return db.mbtiAnalysis.findUnique({
    where: { subjectType_subjectId: { subjectType, subjectId } }
  })
}

export async function upsertMbtiAnalysis(subjectType: SubjectType, subjectId: string, data: {...}) {
  return db.mbtiAnalysis.upsert({
    where: { subjectType_subjectId: { subjectType, subjectId } },
    create: { subjectType, subjectId, ...data },
    update: data,
  })
}
```

**Step 2: Teacher 전용 DB 파일 삭제**

5개 파일 삭제: `teacher-mbti-analysis.ts`, `teacher-face-analysis.ts`, `teacher-palm-analysis.ts`, `teacher-name-analysis.ts`, `teacher-saju-analysis.ts`

**Step 3: 커밋**

```bash
git add src/lib/db/
git commit -m "refactor: 분석 DB 함수 제네릭화 (SubjectType 기반)"
```

---

### Task 4: Server Actions 교사 분석 코드 수정

**Files:**
- Modify: `src/lib/actions/teacher-analysis.ts`
- Modify: `src/lib/actions/teacher-face-analysis.ts`
- Modify: `src/lib/actions/teacher-palm-analysis.ts`
- Modify: `src/lib/actions/teacher-analysis-tab.ts`
- Modify: `src/lib/actions/teacher-analysis-history.ts`
- Modify: `src/lib/actions/analysis.ts` (학생 분석도 SubjectType 추가)
- Modify: `src/lib/actions/zodiac-analysis.ts`
- Modify: `src/lib/actions/calculation-analysis.ts`
- Modify: `src/lib/actions/mbti-survey.ts`
- Modify: `src/lib/actions/vark-survey.ts`
- Modify: `src/lib/actions/name-interpretation.ts`
- Modify: `src/lib/actions/ai-image-analysis.ts`

**Step 1: 교사 분석 Actions에서 Teacher 전용 DB 함수 → 통합 DB 함수로 변경**

모든 `import { getTeacherXxxAnalysis }` → `import { getXxxAnalysis }` 변경.
호출부에 `'TEACHER'` SubjectType 추가.

**Step 2: 학생 분석 Actions에서도 SubjectType 추가**

모든 `getXxxAnalysis(studentId)` → `getXxxAnalysis('STUDENT', studentId)` 변경.

**Step 3: 빌드 검증**

Run: `npx tsc --noEmit`
Expected: 타입 에러 없음

**Step 4: 커밋**

```bash
git add src/lib/actions/
git commit -m "refactor: Server Actions 통합 분석 모델 적용"
```

---

### Task 5: 컴포넌트 props 수정

**Files:**
- Modify: 학생 분석 패널 (zodiac, mbti, vark, saju 등) - `studentId` 참조를 유지하되 DB 응답 타입 변경에 대응
- Modify: 교사 분석 패널 - `teacherId` → 통합 모델 대응

**Step 1: 분석 패널 컴포넌트에서 데이터 타입 업데이트**

컴포넌트 props는 대부분 Server Action 반환값에 의존하므로, Action 수정 후 타입 에러가 발생하는 부분만 수정.

**Step 2: 빌드 검증**

Run: `npm run build`
Expected: 빌드 성공

**Step 3: 기존 테스트 실행**

Run: `npm run test`
Expected: 모든 테스트 통과

**Step 4: 커밋**

```bash
git add src/components/
git commit -m "refactor: 컴포넌트 통합 분석 모델 타입 적용"
```

---

## Wave 2: DDD 점진적 모듈화

### Task 6: actions/ 도메인별 디렉토리 생성 및 파일 이동

**Files:**
- Create: `src/lib/actions/student/` 디렉토리
- Create: `src/lib/actions/teacher/` 디렉토리
- Create: `src/lib/actions/counseling/` 디렉토리
- Create: `src/lib/actions/auth/` 디렉토리
- Create: `src/lib/actions/admin/` 디렉토리
- Create: `src/lib/actions/matching/` 디렉토리
- Create: `src/lib/actions/common/` 디렉토리

**Step 1: 도메인 디렉토리 생성**

```bash
mkdir -p src/lib/actions/{student,teacher,counseling,auth,admin,matching,common}
```

**Step 2: 파일 이동 (git mv)**

```bash
# student 도메인
git mv src/lib/actions/students.ts src/lib/actions/student/crud.ts
git mv src/lib/actions/student.ts src/lib/actions/student/detail.ts
git mv src/lib/actions/analysis.ts src/lib/actions/student/analysis.ts
git mv src/lib/actions/zodiac-analysis.ts src/lib/actions/student/zodiac-analysis.ts
git mv src/lib/actions/calculation-analysis.ts src/lib/actions/student/calculation-analysis.ts
git mv src/lib/actions/mbti-survey.ts src/lib/actions/student/mbti-survey.ts
git mv src/lib/actions/vark-survey.ts src/lib/actions/student/vark-survey.ts
git mv src/lib/actions/name-interpretation.ts src/lib/actions/student/name-interpretation.ts
git mv src/lib/actions/ai-image-analysis.ts src/lib/actions/student/ai-image-analysis.ts
git mv src/lib/actions/student-analysis-tab.ts src/lib/actions/student/analysis-tab.ts
git mv src/lib/actions/student-images.ts src/lib/actions/student/images.ts
git mv src/lib/actions/personality-integration.ts src/lib/actions/student/personality-integration.ts
git mv src/lib/actions/grade.ts src/lib/actions/student/grade.ts

# teacher 도메인
git mv src/lib/actions/teachers.ts src/lib/actions/teacher/crud.ts
git mv src/lib/actions/teacher-analysis.ts src/lib/actions/teacher/analysis.ts
git mv src/lib/actions/teacher-face-analysis.ts src/lib/actions/teacher/face-analysis.ts
git mv src/lib/actions/teacher-palm-analysis.ts src/lib/actions/teacher/palm-analysis.ts
git mv src/lib/actions/teacher-analysis-tab.ts src/lib/actions/teacher/analysis-tab.ts
git mv src/lib/actions/teacher-analysis-history.ts src/lib/actions/teacher/analysis-history.ts
git mv src/lib/actions/teacher-performance.ts src/lib/actions/teacher/performance.ts

# counseling 도메인
git mv src/lib/actions/counseling-ai.ts src/lib/actions/counseling/ai.ts
git mv src/lib/actions/counseling-search.ts src/lib/actions/counseling/search.ts
git mv src/lib/actions/counseling-stats.ts src/lib/actions/counseling/stats.ts
git mv src/lib/actions/follow-up.ts src/lib/actions/counseling/follow-up.ts
git mv src/lib/actions/upcoming-counseling.ts src/lib/actions/counseling/upcoming.ts
git mv src/lib/actions/reservations.ts src/lib/actions/counseling/reservations.ts

# auth 도메인
git mv src/lib/actions/auth.ts src/lib/actions/auth/login.ts

# admin 도메인
git mv src/lib/actions/provider-actions.ts src/lib/actions/admin/providers.ts
git mv src/lib/actions/feature-mapping-actions.ts src/lib/actions/admin/feature-mappings.ts
git mv src/lib/actions/llm-settings.ts src/lib/actions/admin/llm-settings.ts
git mv src/lib/actions/llm-usage.ts src/lib/actions/admin/llm-usage.ts
git mv src/lib/actions/llm-compatibility.ts src/lib/actions/admin/llm-compatibility.ts
git mv src/lib/actions/system.ts src/lib/actions/admin/system.ts
git mv src/lib/actions/backup.ts src/lib/actions/admin/backup.ts
git mv src/lib/actions/audit.ts src/lib/actions/admin/audit.ts

# matching 도메인
git mv src/lib/actions/compatibility.ts src/lib/actions/matching/compatibility.ts
git mv src/lib/actions/matching-history.ts src/lib/actions/matching/history.ts
git mv src/lib/actions/assignment.ts src/lib/actions/matching/assignment.ts
git mv src/lib/actions/assignment-results.ts src/lib/actions/matching/assignment-results.ts

# common 도메인
git mv src/lib/actions/notifications.ts src/lib/actions/common/notifications.ts
git mv src/lib/actions/issues.ts src/lib/actions/common/issues.ts
git mv src/lib/actions/analytics.ts src/lib/actions/common/analytics.ts
git mv src/lib/actions/performance.ts src/lib/actions/common/performance.ts
git mv src/lib/actions/teams.ts src/lib/actions/common/teams.ts
```

**Step 3: 각 도메인에 barrel export (index.ts) 생성**

예시 (`src/lib/actions/student/index.ts`):
```typescript
export * from './crud'
export * from './detail'
export * from './analysis'
export * from './zodiac-analysis'
export * from './calculation-analysis'
export * from './mbti-survey'
export * from './vark-survey'
export * from './name-interpretation'
export * from './ai-image-analysis'
export * from './analysis-tab'
export * from './images'
export * from './personality-integration'
export * from './grade'
```

각 도메인(teacher, counseling, auth, admin, matching, common)에 동일 패턴.

**Step 4: 커밋**

```bash
git add src/lib/actions/
git commit -m "refactor: actions 도메인별 디렉토리 재구성"
```

---

### Task 7: import path 일괄 업데이트

**Files:**
- Modify: `src/app/` 하위 모든 파일에서 actions import path 수정
- Modify: `src/components/` 하위 관련 파일

**Step 1: 전체 import 경로 업데이트**

기존: `import { xxx } from '@/lib/actions/students'`
변경: `import { xxx } from '@/lib/actions/student'`

기존: `import { xxx } from '@/lib/actions/teacher-analysis'`
변경: `import { xxx } from '@/lib/actions/teacher'`

기존: `import { xxx } from '@/lib/actions/counseling-ai'`
변경: `import { xxx } from '@/lib/actions/counseling'`

등등 모든 도메인에 대해 barrel export를 통한 import로 변경.

**Step 2: 빌드 검증**

Run: `npx tsc --noEmit`
Expected: 타입 에러 없음

**Step 3: 테스트 실행**

Run: `npm run test`
Expected: 모든 테스트 통과

**Step 4: 커밋**

```bash
git add -A
git commit -m "refactor: import path 도메인 경로로 일괄 변경"
```

---

### Task 8: db/ 도메인별 재구성

**Files:**
- `src/lib/db/` 하위 파일을 도메인별로 이동

**Step 1: 도메인 디렉토리 생성 및 파일 이동**

```bash
mkdir -p src/lib/db/{student,teacher,counseling,admin,common}

# student 도메인
git mv src/lib/db/student-analysis.ts src/lib/db/student/analysis.ts
git mv src/lib/db/mbti-analysis.ts src/lib/db/student/mbti.ts
git mv src/lib/db/vark-analysis.ts src/lib/db/student/vark.ts
git mv src/lib/db/face-analysis.ts src/lib/db/student/face.ts
git mv src/lib/db/palm-analysis.ts src/lib/db/student/palm.ts
git mv src/lib/db/name-analysis.ts src/lib/db/student/name.ts
git mv src/lib/db/zodiac-analysis.ts src/lib/db/student/zodiac.ts
git mv src/lib/db/personality-summary.ts src/lib/db/student/personality.ts
git mv src/lib/db/compatibility-result.ts src/lib/db/student/compatibility.ts

# admin 도메인
git mv src/lib/db/analysis-prompt-preset.ts src/lib/db/admin/analysis-prompt.ts
git mv src/lib/db/saju-prompt-preset.ts src/lib/db/admin/saju-prompt.ts
git mv src/lib/db/migrate-llm-config.ts src/lib/db/admin/migrate-llm-config.ts

# common 도메인
git mv src/lib/db/rbac.ts src/lib/db/common/rbac.ts
git mv src/lib/db/reports.ts src/lib/db/common/reports.ts
git mv src/lib/db/performance.ts src/lib/db/common/performance.ts
git mv src/lib/db/reservations.ts src/lib/db/common/reservations.ts
git mv src/lib/db/assignment.ts src/lib/db/common/assignment.ts

# seed 파일은 유지 (seed-*.ts)
```

**Step 2: barrel export 생성 + import 경로 업데이트**

각 도메인에 index.ts 생성.
actions/ 파일에서 db/ import 경로 업데이트.

**Step 3: 빌드 + 테스트 검증**

Run: `npm run build && npm run test`
Expected: 모두 통과

**Step 4: 커밋**

```bash
git add -A
git commit -m "refactor: db 함수 도메인별 디렉토리 재구성"
```

---

## Wave 3: SSE 실시간 알림

### Task 9: EventBus 싱글톤 구현

**Files:**
- Create: `src/lib/events/event-bus.ts`
- Create: `src/lib/events/types.ts`

**Step 1: 이벤트 타입 정의**

```typescript
// src/lib/events/types.ts
export type AnalysisCompleteEvent = {
  type: 'analysis:complete'
  analysisType: 'saju' | 'mbti' | 'vark' | 'face' | 'palm' | 'name' | 'zodiac'
  subjectType: 'STUDENT' | 'TEACHER'
  subjectId: string
  subjectName: string
  timestamp: string
}

export type ServerEvent = AnalysisCompleteEvent
```

**Step 2: EventBus 싱글톤 구현**

```typescript
// src/lib/events/event-bus.ts
import { EventEmitter } from 'events'
import type { ServerEvent } from './types'

class EventBus extends EventEmitter {
  private static instance: EventBus

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus()
      EventBus.instance.setMaxListeners(100)
    }
    return EventBus.instance
  }

  emitEvent(event: ServerEvent) {
    this.emit('server-event', event)
  }

  onEvent(listener: (event: ServerEvent) => void) {
    this.on('server-event', listener)
    return () => this.off('server-event', listener)
  }
}

// 개발 환경 HMR 대응
const globalForEventBus = globalThis as unknown as { eventBus: EventBus }
export const eventBus = globalForEventBus.eventBus ?? EventBus.getInstance()
if (process.env.NODE_ENV !== 'production') globalForEventBus.eventBus = eventBus
```

**Step 3: 커밋**

```bash
git add src/lib/events/
git commit -m "feat: EventBus 싱글톤 및 이벤트 타입 구현"
```

---

### Task 10: SSE 엔드포인트 구현

**Files:**
- Create: `src/app/api/events/route.ts`

**Step 1: SSE 엔드포인트 작성**

```typescript
// src/app/api/events/route.ts
import { NextRequest } from 'next/server'
import { getSession } from '@/lib/session'
import { eventBus } from '@/lib/events/event-bus'
import type { ServerEvent } from '@/lib/events/types'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }

  const encoder = new TextEncoder()
  let unsubscribe: (() => void) | null = null

  const stream = new ReadableStream({
    start(controller) {
      // 연결 확인 메시지
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`))

      // 이벤트 구독
      unsubscribe = eventBus.onEvent((event: ServerEvent) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
        } catch {
          // 클라이언트 연결 해제 시 무시
        }
      })

      // 30초 heartbeat
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`))
        } catch {
          clearInterval(heartbeat)
        }
      }, 30000)

      // 클라이언트 연결 해제 감지
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        if (unsubscribe) unsubscribe()
        try { controller.close() } catch { /* already closed */ }
      })
    },
    cancel() {
      if (unsubscribe) unsubscribe()
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
```

**Step 2: 커밋**

```bash
git add src/app/api/events/
git commit -m "feat: SSE 엔드포인트 구현 (/api/events)"
```

---

### Task 11: 클라이언트 훅 및 알림 Provider 구현

**Files:**
- Create: `src/lib/hooks/use-event-source.ts`
- Create: `src/components/common/notification-provider.tsx`
- Modify: `src/app/(dashboard)/layout.tsx`

**Step 1: useEventSource 훅 작성**

```typescript
// src/lib/hooks/use-event-source.ts
'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import type { ServerEvent } from '@/lib/events/types'

export function useEventSource(onEvent: (event: ServerEvent) => void) {
  const [connected, setConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const retryCountRef = useRef(0)

  const connect = useCallback(() => {
    const es = new EventSource('/api/events')
    eventSourceRef.current = es

    es.onopen = () => {
      setConnected(true)
      retryCountRef.current = 0
    }

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as ServerEvent
        if (data.type !== 'connected') {
          onEvent(data)
        }
      } catch { /* 파싱 실패 무시 */ }
    }

    es.onerror = () => {
      es.close()
      setConnected(false)
      // exponential backoff (최대 30초)
      const delay = Math.min(1000 * 2 ** retryCountRef.current, 30000)
      retryCountRef.current++
      setTimeout(connect, delay)
    }
  }, [onEvent])

  useEffect(() => {
    connect()
    return () => {
      eventSourceRef.current?.close()
    }
  }, [connect])

  return { connected }
}
```

**Step 2: NotificationProvider 작성**

```typescript
// src/components/common/notification-provider.tsx
'use client'

import { useCallback } from 'react'
import { toast } from 'sonner'
import { useEventSource } from '@/lib/hooks/use-event-source'
import type { ServerEvent } from '@/lib/events/types'

const ANALYSIS_LABELS: Record<string, string> = {
  saju: '사주',
  mbti: 'MBTI',
  vark: 'VARK',
  face: '관상',
  palm: '수상',
  name: '이름풀이',
  zodiac: '별자리',
}

export function NotificationProvider() {
  const handleEvent = useCallback((event: ServerEvent) => {
    if (event.type === 'analysis:complete') {
      const label = ANALYSIS_LABELS[event.analysisType] || event.analysisType
      toast.success(`${event.subjectName}님의 ${label} 분석이 완료되었습니다.`)
    }
  }, [])

  useEventSource(handleEvent)

  return null
}
```

**Step 3: Dashboard layout에 NotificationProvider 추가**

`src/app/(dashboard)/layout.tsx`에서 `<NotificationProvider />` 추가 (Toaster 옆).

**Step 4: 커밋**

```bash
git add src/lib/hooks/ src/components/common/notification-provider.tsx src/app/\(dashboard\)/layout.tsx
git commit -m "feat: SSE 클라이언트 훅 및 알림 Provider 구현"
```

---

### Task 12: 분석 완료 시 이벤트 발행 연동

**Files:**
- Modify: `src/lib/actions/student/analysis.ts` (또는 이동 전 경로)
- Modify: `src/lib/actions/teacher/analysis.ts`
- Modify: 각 분석 Server Action에서 DB 저장 후 `eventBus.emitEvent()` 호출 추가

**Step 1: 분석 완료 후 이벤트 발행 추가**

각 분석 Server Action (`analyzeSaju`, `analyzeMbti`, `analyzeFace` 등)의 DB 저장 직후:

```typescript
import { eventBus } from '@/lib/events/event-bus'

// DB 저장 후 추가
eventBus.emitEvent({
  type: 'analysis:complete',
  analysisType: 'saju', // 해당 분석 타입
  subjectType: 'STUDENT', // 또는 'TEACHER'
  subjectId: studentId,
  subjectName: student.name,
  timestamp: new Date().toISOString(),
})
```

**Step 2: 빌드 + 테스트 검증**

Run: `npm run build && npm run test`
Expected: 모두 통과

**Step 3: 커밋**

```bash
git add src/lib/actions/
git commit -m "feat: 분석 완료 시 SSE 이벤트 발행 연동"
```

---

## Wave 4: i18n 인프라

### Task 13: next-intl 설치 및 기본 설정

**Files:**
- Modify: `package.json` (next-intl 설치)
- Create: `src/i18n/request.ts`
- Create: `src/i18n/routing.ts`
- Create: `src/i18n/navigation.ts`
- Create: `src/messages/ko.json`
- Create: `src/messages/en.json`
- Modify: `src/middleware.ts`
- Modify: `next.config.ts`

**Step 1: next-intl 설치**

Run: `npm install next-intl`

**Step 2: i18n 설정 파일 생성**

```typescript
// src/i18n/routing.ts
import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['ko', 'en'],
  defaultLocale: 'ko',
})
```

```typescript
// src/i18n/request.ts
import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale
  if (!locale || !routing.locales.includes(locale as 'ko' | 'en')) {
    locale = routing.defaultLocale
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
```

```typescript
// src/i18n/navigation.ts
import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing)
```

**Step 3: 기본 메시지 파일 생성**

```json
// src/messages/ko.json
{
  "Common": {
    "save": "저장",
    "cancel": "취소",
    "delete": "삭제",
    "edit": "수정",
    "search": "검색",
    "loading": "로딩 중...",
    "error": "오류가 발생했습니다",
    "confirm": "확인",
    "back": "뒤로",
    "noData": "데이터가 없습니다"
  },
  "Auth": {
    "login": "로그인",
    "logout": "로그아웃",
    "email": "이메일",
    "password": "비밀번호",
    "forgotPassword": "비밀번호 찾기"
  },
  "Navigation": {
    "students": "학생 관리",
    "teachers": "선생님 관리",
    "counseling": "상담",
    "matching": "매칭",
    "analytics": "분석",
    "admin": "관리자",
    "issues": "이슈"
  },
  "Student": {
    "title": "학생 관리",
    "addNew": "신규 학생 등록",
    "name": "이름",
    "birthDate": "생년월일",
    "teacher": "담당 선생님"
  },
  "Analysis": {
    "saju": "사주 분석",
    "mbti": "MBTI 분석",
    "vark": "VARK 분석",
    "face": "관상 분석",
    "palm": "수상 분석",
    "name": "이름풀이",
    "zodiac": "별자리 분석",
    "startAnalysis": "분석 시작",
    "reAnalyze": "재분석",
    "completed": "분석 완료",
    "inProgress": "분석 중..."
  }
}
```

```json
// src/messages/en.json
{
  "Common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "search": "Search",
    "loading": "Loading...",
    "error": "An error occurred",
    "confirm": "Confirm",
    "back": "Back",
    "noData": "No data available"
  },
  "Auth": {
    "login": "Login",
    "logout": "Logout",
    "email": "Email",
    "password": "Password",
    "forgotPassword": "Forgot password"
  },
  "Navigation": {
    "students": "Students",
    "teachers": "Teachers",
    "counseling": "Counseling",
    "matching": "Matching",
    "analytics": "Analytics",
    "admin": "Admin",
    "issues": "Issues"
  },
  "Student": {
    "title": "Student Management",
    "addNew": "Add New Student",
    "name": "Name",
    "birthDate": "Date of Birth",
    "teacher": "Assigned Teacher"
  },
  "Analysis": {
    "saju": "Saju Analysis",
    "mbti": "MBTI Analysis",
    "vark": "VARK Analysis",
    "face": "Face Analysis",
    "palm": "Palm Analysis",
    "name": "Name Interpretation",
    "zodiac": "Zodiac Analysis",
    "startAnalysis": "Start Analysis",
    "reAnalyze": "Re-analyze",
    "completed": "Analysis Complete",
    "inProgress": "Analyzing..."
  }
}
```

**Step 4: middleware.ts에 next-intl 통합**

기존 인증 미들웨어에 locale 감지 로직 통합 (next-intl의 `createMiddleware` 사용).

**Step 5: next.config.ts에 next-intl 플러그인 추가**

```typescript
import createNextIntlPlugin from 'next-intl/plugin'
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')
```

기존 `withSentryConfig(withAnalyzer(nextConfig), ...)` → `withSentryConfig(withAnalyzer(withNextIntl(nextConfig)), ...)`

**Step 6: 커밋**

```bash
git add -A
git commit -m "feat: next-intl i18n 인프라 설정 (한국어/영어)"
```

---

### Task 14: App Router [locale] 레이아웃 적용

**Files:**
- Create: `src/app/[locale]/` 디렉토리
- Move: `src/app/(dashboard)/` → `src/app/[locale]/(dashboard)/`
- Move: `src/app/auth/` → `src/app/[locale]/auth/`
- Modify: `src/app/[locale]/layout.tsx`

**Step 1: [locale] 동적 세그먼트 추가**

기존 `src/app/layout.tsx`를 `src/app/[locale]/layout.tsx`로 이동.
`NextIntlClientProvider`로 감싸기:

```tsx
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
```

**Step 2: 페이지/레이아웃 구조 재배치**

`src/app/(dashboard)/` → `src/app/[locale]/(dashboard)/`
`src/app/auth/` → `src/app/[locale]/auth/`
API routes (`src/app/api/`)는 이동하지 않음 (locale 불필요).

**Step 3: 빌드 검증**

Run: `npm run build`
Expected: 빌드 성공

**Step 4: 커밋**

```bash
git add -A
git commit -m "feat: App Router [locale] 레이아웃 적용"
```

---

### Task 15: 주요 컴포넌트 i18n 적용 (1차 범위)

**Files:**
- Modify: `src/app/[locale]/(dashboard)/layout.tsx` (네비게이션 메뉴)
- Modify: `src/app/[locale]/auth/login/page.tsx` (로그인 페이지)
- Modify: `src/components/common/analysis-panel.tsx` (분석 패널 공통 컴포넌트)

**Step 1: 네비게이션 메뉴 i18n 적용**

하드코딩된 메뉴 텍스트를 `t('Navigation.students')` 등으로 교체.

**Step 2: 로그인 페이지 i18n 적용**

로그인 폼 라벨을 `t('Auth.login')`, `t('Auth.email')` 등으로 교체.

**Step 3: 분석 패널 공통 컴포넌트 i18n 적용**

분석 관련 텍스트를 `t('Analysis.startAnalysis')` 등으로 교체.

**Step 4: 빌드 + 수동 검증**

Run: `npm run build`
Expected: 빌드 성공. `/ko/students`와 `/en/students`에서 각각 한국어/영어 표시.

**Step 5: 커밋**

```bash
git add -A
git commit -m "feat: 주요 컴포넌트 i18n 적용 (네비게이션, 로그인, 분석 패널)"
```

---

## 최종 검증

### Task 16: 전체 빌드 및 테스트 검증

**Step 1: 전체 빌드**

Run: `npm run build`
Expected: 에러 없이 성공

**Step 2: 단위 테스트**

Run: `npm run test`
Expected: 모든 테스트 통과

**Step 3: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 타입 에러 없음

**Step 4: 최종 커밋 (필요시)**

```bash
git add -A
git commit -m "chore: Phase 3 최종 검증 및 정리"
```
