---
phase: 29-database-github-api-foundation
plan: 01
subsystem: database
tags: [prisma, postgresql, schema, migration, issue-tracking, github-integration]

# Dependency graph
requires:
  - phase: v2.1.1 (Teacher 모델 기반)
    provides: Teacher 모델 및 기존 Prisma 인프라
provides:
  - Issue 모델 (15개 필드, GitHub 동기화 준비)
  - IssueEvent 모델 (이벤트 추적, cascade delete)
  - IssueCategory, IssueStatus, IssuePriority enum
  - Teacher → Issue 양방향 relation (creator, assignee)
  - Issue → IssueEvent 1:N relation
  - DB 마이그레이션 및 인덱스 (8개)
affects: [29-02-github-service, 29-03-server-actions, 30-issue-ui, 31-sentry-integration, 32-webhook-sync]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "GitHub 동기화를 위한 nullable 외부 ID 필드 패턴 (githubIssueNumber, githubIssueUrl)"
    - "이벤트 추적을 위한 metadata JSON 필드 패턴"
    - "Cascade delete를 통한 자동 정리 패턴 (Issue 삭제 시 IssueEvent 자동 삭제)"

key-files:
  created:
    - prisma/migrations/20260211035155_add_issue_and_issue_event_models/migration.sql
  modified:
    - prisma/schema.prisma

key-decisions:
  - "screenshotUrl 및 userContext 필드를 Phase 30 대비하여 미리 추가 (마이그레이션 횟수 최소화)"
  - "IssueEvent.eventType을 String으로 유지하여 GitHub webhook 이벤트 타입 유연하게 수용"
  - "Teacher relation 3개 추가: issuesCreated, issuesAssigned, issueEvents (named relation 패턴)"
  - "@db.Text annotation 사용하여 description 필드에 긴 텍스트 허용"

patterns-established:
  - "Pattern 1: GitHub 동기화를 위한 nullable 외부 ID 필드 (githubIssueNumber unique, githubIssueUrl, githubBranchName)"
  - "Pattern 2: 이벤트 추적 테이블의 metadata Json 필드로 유연한 데이터 저장"
  - "Pattern 3: Cascade delete로 부모 삭제 시 자식 레코드 자동 정리"

# Metrics
duration: 96s
completed: 2026-02-11
---

# Phase 29 Plan 01: Database Schema for Issue Management Summary

**Issue 및 IssueEvent Prisma 모델과 3개 enum 추가, GitHub 동기화 준비 완료 (마이그레이션 적용 완료)**

## Performance

- **Duration:** 1분 36초
- **Started:** 2026-02-11T03:51:05Z
- **Completed:** 2026-02-11T03:52:41Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Issue 모델 추가 (15개 필드: title, description, category, priority, status, githubIssueNumber, githubIssueUrl, githubBranchName, screenshotUrl, userContext 등)
- IssueEvent 모델 추가 (7개 필드: issueId, eventType, performedBy, metadata, createdAt 등)
- 3개 enum 정의 (IssueCategory 7개 값, IssueStatus 5개 값, IssuePriority 4개 값)
- Teacher 모델에 3개 relation 추가 (issuesCreated, issuesAssigned, issueEvents)
- PostgreSQL DB에 issues, issue_events 테이블 생성 (마이그레이션 20260211035155)
- 8개 인덱스 생성 (issues 5개, issue_events 3개)
- Prisma Client 재생성 완료 (Issue, IssueEvent, IssueCategory 등 타입 사용 가능)

## Task Commits

각 작업이 원자적으로 커밋되었습니다:

1. **Task 1: Issue 및 IssueEvent 모델 추가** - `c61f684` (feat)
   - prisma/schema.prisma에 Issue, IssueEvent 모델 및 3개 enum 추가
   - Teacher 모델에 3개 relation 추가
   - npx prisma validate 통과 확인

2. **Task 2: Prisma 마이그레이션 생성 및 적용** - `603e141` (feat)
   - 마이그레이션 파일 생성 (20260211035155_add_issue_and_issue_event_models)
   - 로컬 DB에 마이그레이션 적용 완료
   - Prisma Client 재생성 (npx prisma generate)
   - npx prisma migrate status 확인 (Database schema is up to date)

## Files Created/Modified

**Created:**
- `prisma/migrations/20260211035155_add_issue_and_issue_event_models/migration.sql` - Issue 및 IssueEvent 테이블 생성 SQL (3 enum, 2 table, 8 index, 4 FK)

**Modified:**
- `prisma/schema.prisma` - Issue, IssueEvent 모델 추가 (75 lines), Teacher relation 3개 추가

## Decisions Made

1. **screenshotUrl, userContext 필드 선추가**: Phase 30(Issue UI)에서 사용할 필드이지만 마이그레이션 횟수를 줄이기 위해 지금 추가. 데이터 입력 없이 nullable로 유지하여 영향 없음.

2. **IssueEvent.eventType을 String으로 유지**: GitHub webhook에서 전송되는 다양한 이벤트 타입(labeled, unlabeled, assigned, closed 등)을 enum 없이 유연하게 수용. 향후 새 이벤트 타입 추가 시 스키마 변경 불필요.

3. **@db.Text annotation 사용**: Issue.description 필드에 긴 텍스트 허용 (기본 VARCHAR(255) 제한 제거).

4. **Teacher relation 명명 규칙 준수**: 기존 Student/Teacher relation과 동일하게 named relation 패턴 사용 (IssueCreator, IssueAssignee, IssueEventPerformer).

## Deviations from Plan

None - 계획대로 정확히 실행되었습니다.

## Issues Encountered

None - 모든 작업이 예상대로 진행되었습니다.

## Superpowers 호출 기록

| # | 스킬명 | 호출 시점 | 결과 요약 |
|---|--------|----------|----------|
| - | - | - | 미호출 (자동 실행 가능한 DB 스키마 작업) |

### 미호출 스킬 사유
| 스킬명 | 미호출 사유 |
|--------|-----------|
| superpowers:brainstorming | DB 스키마 추가 작업은 요구사항 명확, 브레인스토밍 불필요 |
| superpowers:test-driven-development | Prisma 스키마는 선언적 정의로 TDD 패턴 적용 불필요 |
| superpowers:systematic-debugging | 에러 미발생 |
| superpowers:requesting-code-review | 스키마 정의는 plan에 명시되어 있어 검토 불필요 |

## User Setup Required

None - 로컬 개발 DB에 마이그레이션이 자동 적용되었습니다.

운영 배포 시 마이그레이션 적용은 Phase 33(CI/CD Pipeline)에서 자동화됩니다.

## Next Phase Readiness

**Ready for:**
- Phase 29 Plan 02 (GitHub Service 구현) - Issue 모델 활용 가능
- Phase 29 Plan 03 (Server Actions 구현) - IssueEvent 추적 가능
- Phase 30 (Issue UI) - screenshotUrl, userContext 필드 사용 가능

**No blockers:**
- DB 스키마 완성, Prisma Client 재생성 완료
- TypeScript 타입 사용 가능 (Issue, IssueEvent, IssueCategory, IssueStatus, IssuePriority)

## Self-Check: PASSED

**Files verified:**
- ✅ FOUND: prisma/schema.prisma
- ✅ FOUND: prisma/migrations/20260211035155_add_issue_and_issue_event_models/migration.sql

**Commits verified:**
- ✅ FOUND: c61f684 (Task 1: Issue 및 IssueEvent 모델 추가)
- ✅ FOUND: 603e141 (Task 2: Prisma 마이그레이션 생성 및 적용)

모든 SUMMARY 주장이 검증되었습니다.

---
*Phase: 29-database-github-api-foundation*
*Completed: 2026-02-11*
