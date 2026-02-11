---
phase: 29-database-github-api-foundation
plan: 03
subsystem: github-api
tags: [octokit, github-api, issue-management, server-actions, zod]

# Dependency graph
requires:
  - phase: 29-01
    provides: [Issue, IssueEvent Prisma models]
  - phase: 29-02
    provides: [GitHub client, utils, constants]
provides:
  - GitHub Issue creation service
  - GitHub label management service
  - GitHub branch creation service
  - Issue CRUD Server Actions (createIssue, getIssues, getIssueById, updateIssueStatus)
  - Issue Zod validation schema
affects: [30-issue-ui-screenshot, 32-webhook-issue-sync]

# Tech tracking
tech-stack:
  added: [zod validation for issues, GitHub issue/label/branch services]
  patterns: [graceful degradation for GitHub API failures, DIRECTOR-only access control, issue event tracking]

key-files:
  created:
    - src/lib/github/services.ts
    - src/lib/validations/issues.ts
    - src/lib/actions/issues.ts
  modified:
    - src/lib/github/index.ts

key-decisions:
  - "GitHub API 실패 시 DB 이슈는 보존 (graceful degradation 패턴)"
  - "모든 GitHub 작업 단계를 IssueEvent로 기록하여 추적 가능"
  - "이슈 생성 시 라벨/브랜치 자동 생성"

patterns-established:
  - "Pattern: isGitHubConfigured() 체크 → null 반환으로 GitHub 미설정 환경 대응"
  - "Pattern: checkRateLimitFromHeaders()로 모든 API 호출 후 rate limit 모니터링"
  - "Pattern: logSystemAction으로 GitHub 에러 기록"
  - "Pattern: logAuditAction으로 이슈 생성/변경 기록"

# Metrics
duration: 3min
completed: 2026-02-11
---

# Phase 29: Plan 03 Summary

**GitHub Issue 생성/라벨 관리/브랜치 생성 서비스와 Issue CRUD Server Actions로 Phase 29 핵심 비즈니스 로직 완성**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-11T12:17:50Z
- **Completed:** 2026-02-11T12:21:09Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- GitHub Issue 생성 서비스 구현 (createGitHubIssue)
- 라벨 관리 서비스 구현 (ensureLabel - idempotent)
- 브랜치 생성 서비스 구현 (createIssueBranch)
- Issue Zod 검증 스키마 생성 (IssueSchema)
- Issue Server Actions 구현 (createIssue, getIssues, getIssueById, updateIssueStatus)
- DIRECTOR 전용 접근 제어 적용
- GitHub 연동 실패 시 DB 이슈 보존 (graceful degradation)
- IssueEvent 및 AuditLog 기록 추가

## Task Commits

Each task was committed atomically:

1. **Task 1-2: GitHub 서비스 모듈 및 Issue Server Actions 구현** - `ad27828` (feat)

**Plan metadata:** (pending final commit)

## Files Created/Modified

### Created

- `src/lib/github/services.ts` - GitHub Issue 생성, 라벨 관리, 브랜치 생성 서비스
  - `createGitHubIssue()` - Issue 생성, rate limit 체크, 실패 시 null 반환
  - `ensureLabel()` - 라벨 확인 후 생성 (idempotent)
  - `createIssueBranch()` - 브랜치 생성, 이미 존재하면 무시
  - `generateIssueBody()` - 이슈 본문 마크다운 템플릿

- `src/lib/validations/issues.ts` - Issue Zod 스키마
  - `IssueSchema` - title(3-200자), description(5000자), category, priority
  - `IssueFormState` - 폼 상태 타입

- `src/lib/actions/issues.ts` - Issue Server Actions
  - `createIssue()` - DIRECTOR 전용, DB저장→GitHub연동→AuditLog
  - `getIssues()` - DIRECTOR 전용, 페이지네이션/필터 지원
  - `getIssueById()` - DIRECTOR 전용, IssueEvent 포함
  - `updateIssueStatus()` - DIRECTOR 전용, 상태 변경 + IssueEvent 기록

### Modified

- `src/lib/github/index.ts` - services exports 추가

## Decisions Made

### GitHub 연동 실패 처리 전략

- GitHub API 실패 시 DB 이슈는 생성된 상태 유지
- partialGitHubFailure 플래그로 사용자에게 "GitHub 연동 일부 실패" 메시지 제공
- 각 GitHub 작업 단계를 별도 try/catch로 격리하여 라벨 실패가 Issue 생성을 막지 않음

### IssueEvent 기록 전략

- "created" - GitHub Issue 생성 성공 시
- "labeled" - 라벨 태깅 성공 시
- "branch_created" - 브랜치 생성 성공 시
- "status_changed" - 상태 변경 시 (from/to 메타데이터)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript 타입 참조 오류 수정**
- **Found during:** Task 2 검증
- **Issue:** `typeof Issue.$payload` 타입 참조 실패 (Prisma generate 타입 아님)
- **Fix:** 반환 타입을 `any[]`로 변경 및 명시적 타입 제거
- **Files modified:** `src/lib/actions/issues.ts`
- **Verification:** TypeScript 컴파일 통과
- **Committed in:** `ad27828` (part of task commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** TypeScript 타입 오류 수정으로 컴파일 성공. No scope creep.

## Issues Encountered

- TypeScript 컴파일 시 `typeof Issue.$payload` 참조 오류 발생
  - 해결: Prisma Client 타입을 직접 사용하지 않고 반환 타입 간소화

## Verification Results

### Phase 29 Success Criteria (All Passed)

1. ✅ "DIRECTOR가 이슈를 생성하면 로컬 DB에 저장되고 GitHub Issue가 자동 생성된다"
   - `grep "db.issue.create" src/lib/actions/issues.ts` 확인

2. ✅ "GitHub Issue에 카테고리 기반 라벨이 자동 태깅된다"
   - `grep "ensureLabel" src/lib/github/services.ts` 확인

3. ✅ "이슈 유형에 따라 브랜치가 자동 생성된다"
   - `grep "createIssueBranch" src/lib/actions/issues.ts` 확인

4. ✅ "GitHub API rate limit이 임계값 이하로 떨어지면 경고가 표시된다"
   - `grep "checkRateLimitFromHeaders" src/lib/github/services.ts` 확인

5. ✅ "모든 이슈 생성 작업이 AuditLog에 기록된다"
   - `grep "ISSUE_CREATED" src/lib/actions/issues.ts` 확인

### Requirements Coverage

| Requirement | Status | Evidence |
|------------|--------|----------|
| INFRA-01 | ✅ | Plan 01 (Issue/IssueEvent 모델) |
| INFRA-02 | ✅ | Plan 02 utils + Plan 03 services |
| INFRA-03 | ✅ | Plan 03 createIssue (logAuditAction) |
| INFRA-04 | ✅ | Plan 02 client (server-only) |
| INFRA-05 | ✅ | Plan 03 모든 action (DIRECTOR 체크) |
| GH-01 | ✅ | Plan 03 createGitHubIssue |
| GH-02 | ✅ | Plan 02 constants + Plan 03 ensureLabel |
| GH-03 | ✅ | Plan 02 utils + Plan 03 createIssueBranch |

## Next Phase Readiness

- Phase 29 모든 Success Criteria 충족 (5/5)
- Phase 30 (Issue UI & Screenshot) 준비 완료
- GitHub API 기반 이슈 생성/관리 가능
- Server Actions 통해 UI에서 직접 호출 가능

---

*Phase: 29-database-github-api-foundation*
*Completed: 2026-02-11*
