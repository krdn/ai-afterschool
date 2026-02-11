# Phase 29 Research: Database & GitHub API Foundation

## Overview
이 문서는 Phase 29 (Database & GitHub API Foundation)를 계획하기 위해 필요한 프로젝트 컨텍스트를 정리합니다.

## 1. 기존 Prisma 스키마 구조

### 파일 위치
- `prisma/schema.prisma`

### 주요 모델 및 패턴

#### 1.1 AuditLog 모델 (이미 존재)
```prisma
model AuditLog {
  id         String   @id @default(cuid())
  teacherId  String
  action     String
  entityType String
  entityId   String?
  changes    Json?
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime @default(now())
  teacher    Teacher  @relation(fields: [teacherId], references: [id], onDelete: Cascade)

  @@index([teacherId])
  @@index([entityType, entityId])
  @@index([createdAt(sort: Desc)])
  @@map("audit_logs")
}
```

**특징:**
- `@map()` 사용: 테이블 이름을 스네이크 케이스로 매핑 (`audit_logs`)
- Json 타입 사용: `changes` 필드에서 구조화된 데이터 저장
- 복합 인덱스: `[entityType, entityId]` 조합으로 특정 엔티티의 감사 로그 빠르게 조회
- Cascade 삭제: Teacher 삭제 시 관련 AuditLog도 삭제

#### 1.2 네이밍 패턴
- **모델명**: PascalCase (예: `Teacher`, `AuditLog`, `SystemLog`)
- **필드명**: camelCase (예: `teacherId`, `createdAt`, `entityType`)
- **테이블명**: snake_case with `@map()` (예: `@@map("audit_logs")`)
- **ID**: `@default(cuid())` 사용 (Collision-resistant IDs)

#### 1.3 JSON 필드 사용 사례
프로젝트에서 Json 타입을 광범위하게 사용:
- `SajuAnalysis.result`, `NameAnalysis.result`: 분석 결과 저장
- `AuditLog.changes`: 변경 사항 기록
- `Teacher.nameHanja`, `Student.nameHanja`: 한자 이름 배열

#### 1.4 Enum 타입
```prisma
enum Role {
  DIRECTOR
  TEAM_LEADER
  MANAGER
  TEACHER
}
```

**Phase 29에서 추가할 Enum:**
- `IssueCategory`: bug, feature, improvement, ui-ux 등
- `IssueStatus`: open, in_progress, in_review, closed
- `IssuePriority`: low, medium, high, urgent
- `BranchType`: fix, feat, chore 등

### 마이그레이션 패턴
```
20260127142756_init
20260128022234_add_student_images
20260210150940_convert_teacher_name_hanja_to_json
```
- 형식: `YYYYMMDDHHmmss_description_in_snake_case`
- Prisma Migrate 사용 (`prisma migrate dev`)

---

## 2. 인증 및 권한 패턴

### 2.1 세션 관리 (`src/lib/session.ts`)

#### SessionPayload 타입
```typescript
export type SessionPayload = {
  userId: string
  role: 'DIRECTOR' | 'TEAM_LEADER' | 'MANAGER' | 'TEACHER'
  teamId: string | null
  expiresAt: Date
}
```

#### 세션 생성
```typescript
export async function createSession(
  userId: string,
  role: SessionPayload['role'] = 'TEACHER',
  teamId: string | null = null
): Promise<void> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const session = await encrypt({ userId, role, teamId, expiresAt })
  const cookieStore = await cookies()

  // HTTP vs HTTPS 자동 감지
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const isHttps = appUrl.startsWith('https://')

  cookieStore.set('session', session, {
    httpOnly: true,
    secure: isHttps, // IMPORTANT: HTTP 환경에서는 false
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })
}
```

**특징:**
- JWT 기반 (jose 라이브러리)
- 7일 만료
- httpOnly + sameSite 보안
- `SESSION_SECRET` 환경 변수 필수

### 2.2 인증 검증 (`src/lib/dal.ts`)

#### verifySession()
```typescript
export const verifySession = cache(async (): Promise<VerifiedSession> => {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  const payload = await decrypt(session)

  if (!payload?.userId) {
    redirect('/auth/login')
  }

  return {
    isAuth: true,
    userId: payload.userId,
    role: payload.role,
    teamId: payload.teamId,
  }
})
```

**CRITICAL:**
- **모든 Server Action과 Server Component에서 호출 필수**
- Middleware는 UX용 빠른 리다이렉트만 담당, 실제 보안은 `verifySession()`
- React `cache()` 사용으로 같은 요청 내 중복 호출 방지

#### 감사 로그 기록
```typescript
export async function logAuditAction(params: {
  action: string
  entityType: string
  entityId?: string
  changes?: Record<string, unknown>
}) {
  const session = await verifySession()
  if (!session?.userId) return

  const headersList = await headers()
  const ipAddress = headersList.get('x-forwarded-for') ||
                   headersList.get('x-real-ip') ||
                   null
  const userAgent = headersList.get('user-agent') || null

  await db.auditLog.create({
    data: {
      teacherId: session.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      changes: params.changes,
      ipAddress,
      userAgent,
    },
  })
}
```

**사용 예시:**
```typescript
await logAuditAction({
  action: 'ISSUE_CREATED',
  entityType: 'Issue',
  entityId: issue.id,
  changes: { title, category, githubIssueNumber },
})
```

### 2.3 RBAC 패턴

#### Server Action에서의 권한 검증 (예: `src/lib/actions/teams.ts`)
```typescript
export async function createTeam(
  prevState: TeamFormState,
  formData: FormData
): Promise<TeamFormState> {
  const session = await verifySession()

  // 권한 검증: 원장만 팀 생성 가능
  if (session.role !== 'DIRECTOR') {
    return {
      errors: {
        _form: ["팀을 생성할 권한이 없어요"],
      },
    }
  }

  // ... 실제 로직
}
```

#### API Route에서의 권한 검증 (예: `src/app/api/teams/route.ts`)
```typescript
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  // RBAC: DIRECTOR만 팀 생성 가능
  if (session.role !== 'DIRECTOR') {
    return NextResponse.json(
      { error: 'Only directors can create teams' },
      { status: 403 }
    )
  }

  // ... 실제 로직
}
```

**Phase 29 적용:**
- 이슈 생성/배포 트리거: `session.role !== 'DIRECTOR'` 체크
- 감사 로그 자동 기록
- 401 vs 403 명확히 구분

---

## 3. Server Action 패턴

### 3.1 파일 조직
```
src/lib/actions/
├── auth.ts              (5 functions)
├── audit.ts             (1 function)
├── teams.ts             (5 functions)
├── student.ts           (3 functions)
├── llm-usage.ts         (10 functions)
└── ... (총 40개 파일, 151개 함수)
```

**평균 파일 크기:** ~30줄/함수 (간결한 구조)

### 3.2 공통 패턴

#### 기본 구조
```typescript
"use server"

import { verifySession } from "@/lib/dal"
import { db } from "@/lib/db"

export async function someAction(
  prevState: SomeFormState,
  formData: FormData
): Promise<SomeFormState> {
  // 1. 인증 검증
  const session = await verifySession()

  // 2. 권한 검증
  if (session.role !== 'REQUIRED_ROLE') {
    return {
      errors: { _form: ["권한이 없어요"] },
    }
  }

  // 3. 입력 검증 (Zod)
  const validatedFields = SomeSchema.safeParse({
    field1: formData.get("field1"),
    field2: formData.get("field2"),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  // 4. 비즈니스 로직
  try {
    const result = await db.someModel.create({
      data: validatedFields.data,
    })

    // 5. 감사 로그 (중요 작업)
    await logAuditAction({
      action: 'SOME_ACTION',
      entityType: 'SomeModel',
      entityId: result.id,
    })
  } catch (error) {
    console.error("Error:", error)
    return {
      errors: { _form: ["오류가 발생했어요"] },
    }
  }

  // 6. 리다이렉트 또는 성공 반환
  redirect("/some-page")
}
```

#### FormState 타입 예시
```typescript
export type IssueFormState = {
  errors?: {
    title?: string[]
    description?: string[]
    category?: string[]
    priority?: string[]
    _form?: string[]
  }
  message?: string
  success?: boolean
}
```

### 3.3 에러 처리
- **검증 에러:** Zod 에러 → `fieldErrors` 반환
- **비즈니스 로직 에러:** `_form` 키에 일반 메시지
- **Prisma P2002 (Unique Constraint):** 중복 에러 별도 처리
- **로깅:** `console.error()` 사용 (Sentry 통합 가능)

---

## 4. GitHub API with Octokit

### 4.1 설치 필요 패키지
```bash
npm install octokit
```

**현재 상태:** octokit 미설치

### 4.2 기본 설정

#### Octokit 인스턴스 생성
```typescript
import { Octokit } from "octokit"

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN, // Personal Access Token (PAT)
})
```

**권장 스코프 (PAT):**
- `repo` (전체 저장소 접근)
- `workflow` (Actions 트리거, 필요 시)

#### 환경 변수
```env
# .env.example에 추가
GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
GITHUB_OWNER=krdn
GITHUB_REPO=ai-afterschool
```

### 4.3 Issue 생성 ([octokit.js REST API](https://octokit.github.io/rest.js/))

```typescript
const issue = await octokit.rest.issues.create({
  owner: "krdn",
  repo: "ai-afterschool",
  title: "버그: 학생 등록 시 이름 입력 오류",
  body: "## 설명\n학생 등록 폼에서...",
  labels: ["bug", "ui-ux"],
})

// 반환값
// issue.data.number (e.g., 123)
// issue.data.html_url (e.g., "https://github.com/krdn/ai-afterschool/issues/123")
```

**API 문서:** [octokit/rest.js - Create an issue](https://octokit.github.io/rest.js/)

### 4.4 Label 태깅

#### 기존 라벨 확인
```typescript
const labels = await octokit.rest.issues.listLabelsForRepo({
  owner: "krdn",
  repo: "ai-afterschool",
})
```

#### 라벨 생성 (없을 경우)
```typescript
await octokit.rest.issues.createLabel({
  owner: "krdn",
  repo: "ai-afterschool",
  name: "bug",
  color: "d73a4a",
  description: "Something isn't working",
})
```

**Phase 29 카테고리 라벨:**
- `bug` (빨강)
- `feature` (파랑)
- `improvement` (초록)
- `ui-ux` (보라)

### 4.5 브랜치 생성 ([GitHub Discussion](https://github.com/octokit/octokit.js/discussions/2198))

```typescript
// 1. 기본 브랜치의 최신 커밋 SHA 가져오기
const { data: ref } = await octokit.rest.git.getRef({
  owner: "krdn",
  repo: "ai-afterschool",
  ref: "heads/main",
})
const commitSha = ref.object.sha

// 2. 새 브랜치 생성
const branchName = `fix/issue-123-student-registration-error`
const newBranch = await octokit.rest.git.createRef({
  owner: "krdn",
  repo: "ai-afterschool",
  ref: `refs/heads/${branchName}`,
  sha: commitSha,
})
```

**브랜치 네이밍 규칙:**
- `fix/issue-{N}-{slug}` (bug)
- `feat/issue-{N}-{slug}` (feature)
- `chore/issue-{N}-{slug}` (improvement, ui-ux)

### 4.6 Rate Limit 모니터링 ([GitHub Docs](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api))

#### 응답 헤더 확인
```typescript
const response = await octokit.rest.issues.create({ /* ... */ })

const rateLimit = {
  limit: parseInt(response.headers['x-ratelimit-limit'] || '5000'),
  remaining: parseInt(response.headers['x-ratelimit-remaining'] || '0'),
  reset: parseInt(response.headers['x-ratelimit-reset'] || '0'),
}

// 경고 조건: remaining < 100
if (rateLimit.remaining < 100) {
  await logSystemAction({
    level: 'WARN',
    message: 'GitHub API rate limit low',
    context: rateLimit,
  })
}
```

#### Rate Limit API
```typescript
const { data } = await octokit.rest.rateLimit.get()
console.log(data.resources.core.remaining) // 5000 (PAT 기준)
```

**PAT Rate Limit:**
- 5,000 requests/hour
- 임계값 권장: 100 requests (2% 남음)

---

## 5. 환경 변수 관리

### 5.1 현재 패턴

#### 파일 구조
```
.env.example          # 템플릿
.env.local            # 로컬 개발 (gitignored)
.env.development      # 개발 환경
.env.staging          # 스테이징
.env.production       # 운영
```

#### 보안 규칙 (`.claude/rules/security.md`)
- ❌ API 키 하드코딩 금지
- ❌ `.env` 파일 커밋 금지
- ✅ 환경 변수로만 관리

### 5.2 Phase 29 추가 변수

#### `.env.example`에 추가
```env
# =============================================================================
# GitHub Integration (Phase 29)
# =============================================================================
# GitHub Personal Access Token (PAT) with repo scope
# Generate at: https://github.com/settings/tokens
GITHUB_TOKEN=ghp_xxxxxxxxxxxxx

# Repository information (auto-detected from git remote)
GITHUB_OWNER=krdn
GITHUB_REPO=ai-afterschool

# Rate limit threshold (requests remaining before warning)
GITHUB_RATE_LIMIT_THRESHOLD=100
```

#### Next.js 환경 변수 규칙
- **서버 전용:** `GITHUB_TOKEN` (클라이언트 노출 금지)
- **공개 가능:** `NEXT_PUBLIC_GITHUB_REPO` (필요 시)

### 5.3 검증 스크립트
프로젝트에 `scripts/validate-env.ts` 존재:
```typescript
// Phase 29 추가
if (isProd && !process.env.GITHUB_TOKEN) {
  errors.push("GITHUB_TOKEN is required in production")
}
```

---

## 6. Slug 생성 (한글 → URL-safe)

### 6.1 현재 프로젝트 사용
- **발견:** `src/components/admin/tabs/saju-prompts-tab.tsx`에서 `slug` 변수 사용 (단순 ID 생성)
- **설치된 라이브러리:** 없음 (필요 시 추가)

### 6.2 권장 접근법

#### Option A: 수동 구현 (의존성 없음)
```typescript
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '') // 특수문자 제거
    .replace(/\s+/g, '-')               // 공백 → 하이픈
    .replace(/-+/g, '-')                // 중복 하이픈 제거
    .substring(0, 50)                   // 최대 50자
}

// 예: "학생 등록 시 이름 오류" → "학생-등록-시-이름-오류"
```

**한글 처리:**
- GitHub 브랜치명은 한글 지원 ✅
- URL 인코딩 불필요

#### Option B: 라이브러리 사용
```bash
npm install slugify
```

```typescript
import slugify from 'slugify'

const slug = slugify(title, {
  lower: true,
  strict: false, // 한글 허용
  trim: true,
})
```

**추천:** Option A (의존성 최소화, 한글 브랜치명 자연스러움)

### 6.3 브랜치명 생성 로직
```typescript
function generateBranchName(issueNumber: number, title: string, category: string): string {
  const slug = generateSlug(title)
  const prefix = category === 'bug' ? 'fix' : category === 'feature' ? 'feat' : 'chore'
  return `${prefix}/issue-${issueNumber}-${slug}`
}

// 예: "fix/issue-42-학생-등록-오류"
```

---

## 7. 프로젝트 컨텍스트

### 7.1 기술 스택
- **Frontend:** Next.js 15 App Router, React 19, TailwindCSS
- **Backend:** Next.js Server Actions, API Routes
- **Database:** PostgreSQL + Prisma ORM
- **Storage:** MinIO (S3 호환)
- **Auth:** JWT (jose) + HTTP-only cookies
- **Deployment:** Docker (192.168.0.5:3001)

### 7.2 저장소 정보
- **URL:** git@github.com:krdn/ai-afterschool.git
- **Owner:** krdn
- **Repo:** ai-afterschool

### 7.3 데이터 모델 설계 가이드

#### Issue 모델 (신규)
```prisma
model Issue {
  id               String        @id @default(cuid())
  title            String
  description      String?
  category         IssueCategory
  priority         IssuePriority @default(MEDIUM)
  status           IssueStatus   @default(OPEN)
  githubIssueNumber Int?         @unique
  githubIssueUrl   String?
  githubBranchName String?
  createdBy        String
  assignedTo       String?
  closedAt         DateTime?
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt

  creator          Teacher       @relation("IssueCreator", fields: [createdBy], references: [id])
  assignee         Teacher?      @relation("IssueAssignee", fields: [assignedTo], references: [id])
  events           IssueEvent[]

  @@index([status])
  @@index([createdBy])
  @@index([githubIssueNumber])
  @@map("issues")
}
```

#### IssueEvent 모델 (신규)
```prisma
model IssueEvent {
  id          String   @id @default(cuid())
  issueId     String
  eventType   String   // "created", "labeled", "branch_created", "closed"
  performedBy String
  metadata    Json?
  createdAt   DateTime @default(now())

  issue       Issue    @relation(fields: [issueId], references: [id], onDelete: Cascade)
  performer   Teacher  @relation(fields: [performedBy], references: [id])

  @@index([issueId])
  @@index([createdAt(sort: Desc)])
  @@map("issue_events")
}
```

#### Enum 타입
```prisma
enum IssueCategory {
  BUG
  FEATURE
  IMPROVEMENT
  UI_UX
  DOCUMENTATION
  PERFORMANCE
  SECURITY
}

enum IssueStatus {
  OPEN
  IN_PROGRESS
  IN_REVIEW
  CLOSED
  ARCHIVED
}

enum IssuePriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}
```

---

## 8. 구현 전략 (Planning 시 고려사항)

### 8.1 점진적 접근 (Incremental Rollout)

#### Phase 29a: 기본 인프라
- Prisma 모델 추가 (Issue, IssueEvent)
- 마이그레이션 생성 및 적용
- 감사 로그 통합

#### Phase 29b: GitHub API 통합
- Octokit 설정
- Issue 생성 Server Action
- Label 자동 태깅

#### Phase 29c: 브랜치 자동 생성
- 브랜치 네이밍 로직
- GitHub API 브랜치 생성
- IssueEvent 기록

#### Phase 29d: Rate Limit 모니터링
- 응답 헤더 파싱
- SystemLog 경고 기록
- UI 경고 표시 (선택)

### 8.2 테스트 전략

#### Unit Tests (Vitest)
- `generateSlug()` 함수 (한글, 특수문자, 긴 텍스트)
- `generateBranchName()` 함수

#### Integration Tests
- GitHub API 호출 (Mocking)
- Prisma 트랜잭션 (Issue + IssueEvent 동시 생성)

#### E2E Tests (Playwright)
- DIRECTOR 로그인 → 이슈 생성 → GitHub 확인
- 권한 없는 사용자 접근 차단 확인

### 8.3 보안 고려사항

#### GITHUB_TOKEN 보호
- ✅ 서버 전용 환경 변수
- ✅ API Route에서만 사용
- ❌ 클라이언트 코드 노출 금지

#### RBAC 적용
- ✅ DIRECTOR만 이슈 생성
- ✅ verifySession() 호출
- ✅ 감사 로그 기록

#### Rate Limit 대응
- 임계값 이하 시 경고
- 필요 시 GitHub App 전환 (PAT 5,000 → App 15,000)

---

## 9. 참고 자료

### GitHub API
- [Octokit REST API Documentation](https://octokit.github.io/rest.js/)
- [GitHub REST API Rate Limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)
- [Creating Branches with Octokit](https://github.com/octokit/octokit.js/discussions/2198)

### Prisma
- 프로젝트 스키마: `/home/gon/projects/ai/ai-afterschool/prisma/schema.prisma`
- 마이그레이션: `prisma/migrations/`

### 프로젝트 패턴
- Server Actions: `src/lib/actions/*.ts`
- 인증/권한: `src/lib/dal.ts`, `src/lib/session.ts`
- 감사 로그: `src/lib/dal.ts::logAuditAction()`

---

## 10. 체크리스트 (Planning 단계에서 확인)

### 데이터베이스
- [ ] Issue 모델 필드 설계 완료
- [ ] IssueEvent 모델 필드 설계 완료
- [ ] Enum 타입 정의 완료
- [ ] 인덱스 전략 수립
- [ ] 마이그레이션 파일명 결정

### GitHub API
- [ ] Octokit 설정 방법 정의
- [ ] Issue 생성 로직 설계
- [ ] Label 매핑 규칙 확정
- [ ] 브랜치 네이밍 규칙 확정
- [ ] Rate Limit 임계값 결정 (100 requests)

### 보안 및 권한
- [ ] DIRECTOR 권한 검증 위치 확정
- [ ] 감사 로그 기록 항목 정의
- [ ] 환경 변수 추가 (.env.example)

### 에러 처리
- [ ] GitHub API 실패 시 Rollback 전략
- [ ] Rate Limit 초과 시 대응 방법
- [ ] 네트워크 오류 처리

### 테스트
- [ ] Unit 테스트 항목 정의
- [ ] E2E 테스트 시나리오 작성

---

## Next Steps

이 연구를 바탕으로 다음을 작성합니다:
1. **PLAN.md:** 구체적인 Task 분해 및 구현 순서
2. **ADR (Architecture Decision Record):** 주요 기술 결정 문서화
3. **Implementation:** Task별 코드 작성 및 테스트
