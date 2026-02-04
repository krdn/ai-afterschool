---
phase: 21-statistics-dashboard
plan: 03
subsystem: ui
tags: [recharts, statistics, visualization, react, typescript]

# Dependency graph
requires:
  - phase: 21-01
    provides: 통계 Server Actions (월별 추이, 유형 분포, 누적 통계)
  - phase: 14-performance-analytics
    provides: Recharts 패턴 및 차트 컴포넌트
provides:
  - StatisticsCards 컴포넌트 (4개 요약 카드)
  - CounselingTrendChart 컴포넌트 (월별 추이 라인/영역 차트)
  - CounselingTypeChart 컴포넌트 (유형별 도넛 차트)
affects: [21-06-page-integration, 22-ai-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Recharts 도넛 차트 패턴 (innerRadius 사용)"
    - "라인/영역 차트 토글 전환 패턴"
    - "통계 요약 카드 grid 레이아웃"

key-files:
  created:
    - src/components/statistics/StatisticsCards.tsx
    - src/components/statistics/CounselingTrendChart.tsx
    - src/components/statistics/CounselingTypeChart.tsx
  modified: []

key-decisions:
  - "ResponsiveContainer height={300}으로 모든 차트 높이 통일"
  - "도넛 차트 innerRadius={60}, outerRadius={100}으로 비율 설정"
  - "라인/영역 차트 토글을 useState로 Client Component에서 관리"
  - "요약 카드 variant 시스템 (default, success, warning, danger)"

patterns-established:
  - "StatCard 내부 컴포넌트로 재사용 가능한 카드 추상화"
  - "loading prop으로 스켈레톤 상태 처리"
  - "빈 데이터 상태 일관된 UI (회색 텍스트, 중앙 정렬)"

# Metrics
duration: 2min
completed: 2026-02-04
---

# Phase 21 Plan 03: 통계 시각화 UI 컴포넌트 Summary

**Recharts 기반 상담 통계 시각화 3개 컴포넌트 (요약 카드, 월별 추이 차트, 유형별 도넛 차트) 구현**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-04T22:00:06Z
- **Completed:** 2026-02-04T22:01:57Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- 4개 요약 카드 컴포넌트 (이번 달 상담, 대기 예약, 지연 후속조치, 완료율)
- 월별 상담 추이 라인/영역 차트 토글 전환 지원
- 상담 유형별 도넛 차트 (innerRadius 사용, 백분율 라벨)

## Task Commits

Each task was committed atomically:

1. **Task 1: 요약 카드 컴포넌트 구현** - `3a5e0da` (feat)
2. **Task 2: 월별 추이 차트 컴포넌트 구현** - `12ce0d3` (feat)
3. **Task 3: 상담 유형별 도넛 차트 구현** - `6ebcb29` (feat)

## Files Created/Modified
- `src/components/statistics/StatisticsCards.tsx` - 4개 요약 카드를 반응형 grid로 표시 (모바일: 1열, 태블릿: 2열, 데스크탑: 4열)
- `src/components/statistics/CounselingTrendChart.tsx` - 월별 상담 추이를 라인 차트 또는 영역 차트로 시각화 (토글 버튼 지원)
- `src/components/statistics/CounselingTypeChart.tsx` - 상담 유형별 분포를 도넛 차트로 표시 (innerRadius={60})

## Decisions Made
- **ResponsiveContainer height={300}**: 모든 차트의 높이를 300px로 통일하여 일관된 레이아웃 제공
- **도넛 차트 비율**: innerRadius={60}, outerRadius={100}으로 도넛 두께 조절
- **라인/영역 차트 토글**: useState로 Client Component에서 차트 타입 상태 관리
- **variant 색상 시스템**: default(회색), success(초록), warning(주황), danger(빨강) 4가지 variant 정의

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- 통계 시각화 컴포넌트 3개 완료
- Plan 21-04 (후속 조치 목록), Plan 21-05 (필터 컴포넌트) 준비 완료
- Plan 21-06에서 페이지 통합 시 이 컴포넌트들을 조합하여 대시보드 구성 가능
- 모든 컴포넌트에 loading/empty 상태 처리가 포함되어 있어 데이터 패칭과 독립적으로 통합 가능

---
*Phase: 21-statistics-dashboard*
*Completed: 2026-02-04*
