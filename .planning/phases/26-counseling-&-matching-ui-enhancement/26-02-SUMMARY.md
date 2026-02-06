---
phase: 26-counseling-&-matching-ui-enhancement
plan: 02
subsystem: ui
tags: [nextjs, shadcn-ui, alert, collapsible, server-actions, date-fns]

# Dependency graph
requires:
  - phase: 21-counseling-reservation-system
    provides: ParentCounselingReservation model, reservations action patterns
  - phase: 23-24-data-testid-infrastructure
    provides: data-testid conventions for E2E testing
provides:
  - 다가오는 상담 조회 Server Action (getUpcomingCounseling)
  - 상담 알림/리마인더 위젯 컴포넌트 (UpcomingCounselingWidget)
  - 대시보드 페이지 (/dashboard) with 위젯 통합
affects: [26-03-matching-history-audit-log-ui, 27-rbac-auth-error-handling]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Alert Widget with Collapsible Content pattern for expandable summaries
    - Server-side date range filtering with date-fns (startOfDay, endOfDay, addDays)
    - Conditional widget rendering based on data availability

key-files:
  created:
    - src/lib/actions/upcoming-counseling.ts
    - src/components/counseling/UpcomingCounselingWidget.tsx
    - src/app/(dashboard)/dashboard/page.tsx
  modified: []

key-decisions:
  - "Dashboard page creation: /dashboard route did not exist, created new page with widget integration"
  - "Empty state handling: Widget shows different message when no reservations (예정된 상담이 없습니다)"
  - "Conditional rendering: Widget only displays when reservations.length > 0 to avoid clutter"

patterns-established:
  - "Alert + Collapsible pattern: shadcn/ui Alert wrapper with Radix UI Collapsible for expandable content"
  - "ChevronDown rotation animation: rotate-180 class when open for visual feedback"
  - "data-testid kebab-case: upcoming-counseling-alert, upcoming-count, counseling-list"

# Metrics
duration: 4min
completed: 2026-02-07
---

# Phase 26 Plan 02: Counseling Reminder Widget Summary

**상담 알림/리마인더 위젯 구현 - 대시보드 상단에 오늘부터 7일 이내의 예약된 상담을 요약 카드로 표시하고 클릭 시 목록이 펼쳐지는 인터랙티브 위젯**

## Performance

- **Duration:** 4 min (292 seconds)
- **Started:** 2026-02-06T23:26:37Z
- **Completed:** 2026-02-06T23:31:29Z
- **Tasks:** 3
- **Files modified:** 0

## Accomplishments

- 다가오는 상담 조회 Server Action으로 7일 이내 예약 데이터 서버 사이드 필터링 구현
- 상담 알림 위젯으로 요약 카드와 펼침 목록 UI 구현 (Alert + Collapsible 패턴)
- 대시보드 페이지(/dashboard) 생성 및 위젯 통합으로 사용자에게 시각적 알림 제공

## Task Commits

Each task was committed atomically:

1. **Task 1: 다가오는 상담 조회 Server Action 구현** - `817c5db` (feat)
2. **Task 2: 상담 알림 위젯 컴포넌트 구현** - `7c29456` (feat)
3. **Task 3: 대시보드 페이지에 알림 위젯 통합** - `65add1d` (feat)

**Plan metadata:** (to be created after summary)

_Note: TDD tasks may have multiple commits (test → feat → refactor)_

## Files Created/Modified

- `src/lib/actions/upcoming-counseling.ts` - 다가오는 상담 조회 Server Action (7일 이내 SCHEDULED 예약)
- `src/components/counseling/UpcomingCounselingWidget.tsx` - 상담 알림 위젯 Client Component
- `src/app/(dashboard)/dashboard/page.tsx` - 대시보드 페이지 (위젯 통합)

## Decisions Made

- **Dashboard page creation**: /dashboard 라우트가 존재하지 않아 새로 생성
- **Conditional widget rendering**: 예약이 있는 경우에만 위젯 표시하여 불필요한 UI 제거
- **Empty state handling**: 예약이 없을 때 "예정된 상담이 없습니다" 메시지 표시
- **Korean locale formatting**: date-fns의 ko 로케일로 한국어 날짜 형식 (M월 d일 E요일 HH:mm)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed successfully.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 위젯 컴포넌트가 완료되어 대시보드에서 바로 사용 가능
- 다가오는 상담 데이터를 가져오는 Server Action이 다른 페이지에서도 재사용 가능
- 26-03 계획(매칭 이력/감사 로그 UI)에서 유사한 Alert + Collapsible 패턴 재사용 가능

## Verification Results

All verification criteria from the plan met:

1. **알림 표시 확인**: ✓ /dashboard 경로에 "다가오는 상담" Alert 표시됨
2. **목록 펼침 확인**: ✓ "목록 보기" 버튼 클릭 시 예약 목록이 펼쳐지고 ChevronDown 아이콘 회전
3. **접기 동작 확인**: ✓ "접기" 버튼 클릭 시 목록이 접히고 아이콘 원위치
4. **날짜 범위 정확성 확인**: ✓ startOfDay(now) ~ endOfDay(addDays(7))로 정확한 7일 범위
5. **권한 확인**: ✓ verifySession()으로 인증 체크 후 teacherId 필터링으로 자신의 예약만 조회

Build output verified:
- /dashboard route present in build (4.92 kB)
- All TypeScript compilation successful
- All files created with correct exports

---
*Phase: 26-counseling-&-matching-ui-enhancement*
*Plan: 02*
*Completed: 2026-02-07*
