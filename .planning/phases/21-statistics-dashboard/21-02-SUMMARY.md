---
phase: 21-statistics-dashboard
plan: 02
subsystem: api
tags: [server-actions, date-fns, prisma, rbac, counseling]

# Dependency graph
requires:
  - phase: 16-parent-reservation-schema
    provides: CounselingSession 모델 및 followUpRequired, followUpDate 필드
  - phase: 11-rbac-system
    provides: getRBACPrisma, verifySession
provides:
  - 후속 조치 타입 정의 (FollowUpItem, FollowUpFilter, FollowUpStatus, CompleteFollowUpInput)
  - 후속 조치 Server Actions (getFollowUpsAction, completeFollowUpAction, getOverdueCountAction)
  - date-fns 기반 날짜 범위 필터링 (오늘/이번 주/전체)
  - 지연 상태(overdue) 자동 계산 로직
affects: [21-03-dashboard-ui, 21-statistics-dashboard]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - date-fns 날짜 범위 필터링 (startOfDay, endOfDay, startOfWeek, endOfWeek)
    - satisfactionScore null 기준으로 후속 조치 미완료 판단
    - isBefore로 지연 상태 계산
    - Prisma.CounselingSessionWhereInput 타입 사용

key-files:
  created:
    - src/types/follow-up.ts
    - src/lib/actions/follow-up.ts
  modified: []

key-decisions:
  - "satisfactionScore !== null을 후속 조치 완료 기준으로 사용 (기존 스키마 활용)"
  - "완료 시 satisfactionScore를 임시값(1)으로 설정하여 완료 표시"
  - "date-fns로 한국 로케일(ko) 기반 주간 범위 계산"
  - "마감일 임박순(followUpDate ASC) 정렬"

patterns-established:
  - "FollowUpStatus 계산: satisfactionScore로 완료 여부, isBefore로 지연 여부"
  - "날짜 범위 필터: today(startOfDay~endOfDay), week(startOfWeek~endOfWeek, ko)"
  - "RBAC 기반 후속 조치 목록 조회 및 완료 처리"

# Metrics
duration: 3min
completed: 2026-02-04
---

# Phase 21 Plan 02: Follow-Up Server Actions Summary

**CounselingSession의 followUpRequired/followUpDate 필드를 활용한 후속 조치 목록 조회 및 완료 처리 Server Actions 구현**

## Performance

- **Duration:** 3분
- **Started:** 2026-02-04T12:52:28Z
- **Completed:** 2026-02-04T12:55:55Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- 후속 조치 타입 정의 (FollowUpStatus, FollowUpItem, FollowUpFilter, CompleteFollowUpInput)
- 오늘/이번 주/전체 범위 필터링 기능
- 지연 상태(overdue) 자동 계산 (isBefore)
- 후속 조치 완료 처리 (satisfactionScore 활용)
- RBAC 기반 권한 제어

## Task Commits

Each task was committed atomically:

1. **Task 1: 후속 조치 타입 정의** - `8a90bff` (feat)
2. **Task 2: 후속 조치 Server Actions 구현** - `c4b217c` (feat)
3. **Fix: 사용하지 않는 변수 제거** - `ebbd671` (fix)

**Plan metadata:** (다음 단계)

## Files Created/Modified
- `src/types/follow-up.ts` - 후속 조치 타입 정의 (FollowUpStatus, FollowUpItem, FollowUpFilter, CompleteFollowUpInput)
- `src/lib/actions/follow-up.ts` - 후속 조치 Server Actions (getFollowUpsAction, completeFollowUpAction, getOverdueCountAction)

## Decisions Made

**1. satisfactionScore를 후속 조치 완료 기준으로 활용**
- **이유:** 기존 스키마에 followUpCompleted 필드가 없으므로, satisfactionScore !== null을 완료 기준으로 사용
- **구현:** 완료 시 satisfactionScore를 임시값(1)으로 설정

**2. date-fns로 날짜 범위 필터링**
- **이유:** 타임존 안전한 날짜 계산 필요
- **구현:** startOfDay, endOfDay, startOfWeek, endOfWeek 활용, 한국 로케일(ko) 적용

**3. 지연 상태 자동 계산**
- **이유:** 후속 조치 마감일 초과 여부를 자동으로 판단하여 UI에서 강조 표시 가능
- **구현:** isBefore(followUpDate, today) && satisfactionScore === null

**4. 마감일 임박순 정렬**
- **이유:** 긴급한 후속 조치를 먼저 표시하여 우선순위 명확화
- **구현:** orderBy: { followUpDate: 'asc' }

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 후속 조치 Server Actions 완료, UI 구현 준비 완료
- getFollowUpsAction, completeFollowUpAction, getOverdueCountAction 모두 검증됨
- 타입 안전성 확보 (Prisma.CounselingSessionWhereInput)
- RBAC 적용으로 다중 팀 환경 지원
- Plan 21-03(대시보드 UI)에서 이 Actions 활용 가능

---
*Phase: 21-statistics-dashboard*
*Completed: 2026-02-04*
