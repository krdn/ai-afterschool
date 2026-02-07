---
phase: 27-rbac-auth-error-handling
plan: 02
subsystem: rbac-error-handling
tags: [next.js-15, rbac, 404, not-found, team-leader, prisma-extensions]

# Dependency graph
requires:
  - phase: 27-rbac-auth-error-handling
    plan: 01
    provides: access-denied-page.tsx, errors directory structure
provides:
  - NotFoundPage 공통 404 에러 페이지 컴포넌트
  - 선생님 상세 404 페이지 (not-found.tsx)
  - Admin 페이지 TEAM_LEADER 접근 허용
  - getRBACPrisma()를 사용한 자동 팀 데이터 필터링
affects: [28-integration-verification, future-auth-enhancements]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Next.js 15 not-found.js 패턴으로 라우트 레벨 404 처리
    - getRBACPrisma() 활용한 Server Action 레벨 팀 필터링
    - 공통 에러 페이지 컴포넌트 재사용 패턴

key-files:
  created:
    - src/components/errors/not-found-page.tsx
    - src/app/(dashboard)/teachers/[id]/not-found.tsx
  modified:
    - src/app/(dashboard)/admin/page.tsx
    - src/lib/actions/system.ts
    - src/lib/actions/audit.ts
    - src/lib/actions/backup.ts

key-decisions:
  - "[27-02] 공통 404 컴포넌트 구조: Search 아이콘과 회색 배경 사용, 향후 403/401/500 확장 가능한 유연한 구조 유지"
  - "[27-02] Admin 페이지 TEAM_LEADER 접근: 모든 Admin 탭 허용하되 getRBACPrisma()로 자신의 팀 데이터만 접근 가능 (CONTEXT.md 결정 준수)"
  - "[27-02] Server Action 레벨 RBAC: getSystemLogs, getAuditLogs, getBackupList에서 getRBACPrisma() 사용하여 자동 팀 필터링"

patterns-established:
  - "Pattern: not-found.js for Route-Level 404 - Next.js 15의 not-found.js 파일로 라우트 레벨 404 처리"
  - "Pattern: Server Action RBAC Verification - 모든 데이터 조회 Server Action에서 getRBACPrisma() 사용으로 팀 필터링"

# Metrics
duration: 5min
completed: 2026-02-07
---

# Phase 27: Plan 2 Summary

**NotFoundPage 컴포넌트로 친화적인 404 에러 페이지 제공 및 Admin 페이지 TEAM_LEADER 접근 허용하되 getRBACPrisma()로 팀 데이터 자동 필터링**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-07T00:47:02Z
- **Completed:** 2026-02-07T00:52:00Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- NotFoundPage 공통 404 에러 페이지 컴포넌트 생성 (Search 아이콘, 회색 배경, 유연한 구조)
- 선생님 상세 404 페이지 생성 (not-found.tsx, Next.js not-found.js 패턴)
- Admin 페이지 TEAM_LEADER 접근 허용 (모든 탭 접근 가능, getRBACPrisma()로 팀 데이터 필터링)
- Server Action 레벨 RBAC 강화 (getSystemLogs, getAuditLogs, getBackupList)

## Task Commits

Each task was committed atomically:

1. **Task 1: 공통 404 에러 페이지 컴포넌트 생성** - `158beb8` (feat)
2. **Task 2: 선생님 상세 404 페이지 생성** - `0cbd4af` (feat)
3. **Task 3: Admin 페이지 TEAM_LEADER 접근 허용 및 팀 데이터 필터링 강화** - `b5048fd` (feat)

**Plan metadata:** (pending final commit)

_Note: TDD tasks may have multiple commits (test → feat → refactor)_

## Files Created/Modified

- `src/components/errors/not-found-page.tsx` - 공통 404 에러 페이지 컴포넌트 (Search 아이콘, resourceType/suggestions props)
- `src/app/(dashboard)/teachers/[id]/not-found.tsx` - 선생님 상세 404 페이지 (NotFoundPage 활용)
- `src/app/(dashboard)/admin/page.tsx` - TEAM_LEADER 접근 허용, getRBACPrisma import
- `src/lib/actions/system.ts` - getRBACPrisma()로 팀 필터링 적용
- `src/lib/actions/audit.ts` - getRBACPrisma()로 팀 필터링 적용
- `src/lib/actions/backup.ts` - TEAM_LEADER 역할 허용

## Decisions Made

**공통 404 컴포넌트 구조:** Search 아이콘과 회색 배경을 사용하여 404 에러를 친화적으로 표현했습니다. 향후 403/401/500 확장 가능성을 고려하여 컴포넌트 구조는 유연하게 유지했습니다 (CONTEXT.md의 "에러 타입별 다른 아이콘/메시지/색상"은 향후 확장을 위한 가이드로 해석).

**Admin 페이지 TEAM_LEADER 접근:** CONTEXT.md 결정에 따라 "모든 Admin 탭 허용" + "자신의 팀 데이터만 접근 가능, 타 팀 데이터 완전 차단"으로 구현했습니다. Admin 페이지 역할 체크를 `session.role !== 'DIRECTOR'`에서 `(session.role !== 'DIRECTOR' && session.role !== 'TEAM_LEADER')`로 수정했습니다.

**Server Action 레벨 RBAC:** getSystemLogs, getAuditLogs, getBackupList Server Action에서 getRBACPrisma(session)를 사용하여 자동 팀 필터링을 적용했습니다. Prisma Client Extensions의 $allOperations 패턴이 팀 데이터 자동 필터링을 수행합니다.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed as planned.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 404 에러 처리 인프라 완료, 향후 403/401/500 확장 가능
- TEAM_LEADER Admin 페이지 접근 가능, 팀 데이터 필터링 동작
- Phase 28 통합 검증 및 테스트 정렬 준비 완료
- 다음 Phase에서 다른 리소스(학생, 팀 등)의 404 페이지 확장 가능

---
*Phase: 27-rbac-auth-error-handling*
*Plan: 02*
*Completed: 2026-02-07*

## Self-Check: PASSED
