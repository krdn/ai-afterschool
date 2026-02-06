---
phase: 23-data-testid-infrastructure
plan: 02
subsystem: testing
tags: [data-testid, e2e, playwright, testing, counseling, matching, analytics]

# Dependency graph
requires:
  - phase: 23-01
    provides: E2E test selector pattern and testing infrastructure
provides:
  - E2E test selectors for counseling (calendar-view, counseling-detail-modal, counseling-session, counseling-form)
  - E2E test selectors for matching (compatibility-score, mbti-compatibility, learning-style-compatibility, fairness-metric, fairness-suggestions)
  - E2E test selectors for analytics (metric-card, improvement-chart, performance-dashboard)
affects: [24-missing-routes, 26-counseling-matching-ui, 28-integration-verification]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - data-testid selector pattern for E2E testing stability
    - Semantic test ID naming: [component]-[element] pattern

key-files:
  created: []
  modified:
    - src/components/counseling/ReservationCalendarView.tsx
    - src/components/counseling/CounselingPageTabs.tsx
    - src/components/counseling/CounselingSessionCard.tsx
    - src/components/counseling/CounselingSessionModal.tsx
    - src/app/(dashboard)/counseling/page.tsx
    - src/components/compatibility/compatibility-score-card.tsx
    - src/components/compatibility/fairness-metrics-panel.tsx
    - src/app/(dashboard)/matching/fairness/page.tsx
    - src/components/analytics/TeacherPerformanceCard.tsx
    - src/components/analytics/PerformanceDashboard.tsx

key-decisions:
  - "Used data-testid instead of class selectors for E2E test stability"
  - "Applied consistent naming pattern: [component]-[element] (e.g., calendar-view, counseling-detail-modal)"
  - "Used conditional data-testid for dynamic content (MBTI/learning-style compatibility)"
  - "Added data-tab attribute alongside data-testid for tab components"

patterns-established:
  - "Pattern: E2E test selectors use data-testid attributes exclusively for CSS-independent testing"
  - "Pattern: Test ID names match the component's semantic purpose, not implementation details"

# Metrics
duration: 4min
completed: 2026-02-06
---

# Phase 23 Plan 02: E2E Test Selectors for Counseling, Matching, Performance Summary

**Added data-testid attributes across counseling, matching/compatibility, and performance dashboard components to enable stable E2E test selectors**

## Performance

- **Duration:** 4 minutes
- **Started:** 2026-02-06T14:57:37Z
- **Completed:** 2026-02-06T15:02:31Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- **CNS-01 & CNS-02 fulfilled:** Added data-testid selectors for all counseling-related UI components (calendar, sessions, modal, statistics cards, filter form)
- **MAT-01 & MAT-02 fulfilled:** Added data-testid selectors for compatibility scoring (MBTI, learning-style) and fairness metrics panel (metric cards, values, labels, suggestions)
- **PRF-01 fulfilled:** Added data-testid selectors for performance dashboard (metric cards, improvement chart)

## Task Commits

Each task was committed atomically:

1. **Task 1: 상담 캘린더/세션 + 상담 통계 컴포넌트에 data-testid 추가** - `0d1e7ec` (feat)
2. **Task 2: 궁합/공정성 + 성과 대시보드에 data-testid 추가** - `f6d4248` (feat)

**Plan metadata:** N/A (included in task commits)

_Note: Each task was verified with build and grep checks before commit_

## Files Created/Modified

### Counseling Components (Task 1)
- `src/components/counseling/ReservationCalendarView.tsx` - Added `calendar-view`, `calendar-loading` testids
- `src/components/counseling/CounselingPageTabs.tsx` - Added `data-tab` attributes to all tabs (history, reservations, calendar)
- `src/components/counseling/CounselingSessionCard.tsx` - Added `counseling-session` testid
- `src/components/counseling/CounselingSessionModal.tsx` - Added `counseling-detail-modal` testid to DialogContent
- `src/app/(dashboard)/counseling/page.tsx` - Added statistics cards (monthly-sessions, total-sessions, avg-duration, followup-count), counseling-form, and counseling-session list item testids

### Compatibility & Analytics Components (Task 2)
- `src/components/compatibility/compatibility-score-card.tsx` - Added `compatibility-score` to card, conditional `mbti-compatibility` and `learning-style-compatibility` to value spans
- `src/components/compatibility/fairness-metrics-panel.tsx` - Added `fairness-metric`, `metric-value`, `metric-label` to metric cards, `fairness-suggestions` to recommendations section
- `src/app/(dashboard)/matching/fairness/page.tsx` - Added `fairness-heading` to h1
- `src/components/analytics/TeacherPerformanceCard.tsx` - Added `metric-card` to Card
- `src/components/analytics/PerformanceDashboard.tsx` - Added `performance-dashboard` to container, `improvement-chart` wrapper around GradeTrendChart

## Decisions Made

- **Conditional data-testid approach:** Used conditional expressions for dynamic test IDs (MBTI/learning-style) to avoid adding testids to non-critical elements
- **data-tab for tab components:** Added `data-tab` attribute alongside existing TabsTrigger for more semantic tab selection in tests
- **Consistent naming pattern:** Followed [component]-[element] pattern (e.g., `counseling-detail-modal`, `fairness-metric`) for test readability

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all data-testid additions were straightforward and passed build verification.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All required data-testid selectors are in place for E2E tests (counseling.spec.ts, matching.spec.ts, performance.spec.ts)
- Build verified successfully with all changes
- Ready for Phase 24 (Missing Routes Creation) or next E2E testing phase

## Verification Results

All required data-testid attributes verified:
- `calendar-view` ✓ (ReservationCalendarView)
- `counseling-detail-modal` ✓ (CounselingSessionModal)
- `counseling-session` ✓ (CounselingSessionCard, counseling/page.tsx list)
- `data-tab="calendar"` ✓ (CounselingPageTabs)
- `compatibility-score` ✓ (CompatibilityScoreCard)
- `mbti-compatibility` ✓ (CompatibilityBar - conditional)
- `learning-style-compatibility` ✓ (CompatibilityBar - conditional)
- `fairness-metric` ✓ (DisparityIndexCard, ABROCACard, DistributionBalanceCard)
- `metric-value` ✓ (fairness metric cards)
- `metric-label` ✓ (fairness metric cards)
- `fairness-suggestions` ✓ (RecommendationsSection)
- `fairness-heading` ✓ (fairness/page.tsx)
- `metric-card` ✓ (TeacherPerformanceCard)
- `improvement-chart` ✓ (PerformanceDashboard wrapper)
- `performance-dashboard` ✓ (PerformanceDashboard container)

Build verification: Passed ✓

---
*Phase: 23-data-testid-infrastructure*
*Completed: 2026-02-06*
