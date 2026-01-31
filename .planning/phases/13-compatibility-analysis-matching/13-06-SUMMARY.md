---
phase: 13-compatibility-analysis-matching
plan: 06
subsystem: analysis, ui
tags: [fairness-metrics, algorithmic-bias, disparity-index, abroca, dashboard]

# Dependency graph
requires:
  - phase: 13-03
    provides: AssignmentProposal model with assignments data
provides:
  - FairnessMetrics calculation functions (Disparity Index, ABROCA, Distribution Balance)
  - /matching/fairness dashboard page with RBAC
  - FairnessMetricsPanel visualization component
  - Progress UI component
affects: [13-07, 13-08]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Server Component with RBAC authorization (DIRECTOR, TEAM_LEADER)
    - Client Component with progress bar visualization
    - Statistical metrics calculation (stdDev, histogram, L1 distance)
    - Color-coded status indicators (green/yellow/red thresholds)

key-files:
  created:
    - src/lib/analysis/fairness-metrics.ts
    - src/app/(dashboard)/matching/fairness/page.tsx
    - src/components/compatibility/fairness-metrics-panel.tsx
    - src/components/ui/progress.tsx
  modified: []

key-decisions:
  - "Disparity Index: School-based group comparison with max-min normalization"
  - "ABROCA: Histogram-based distribution bias using L1 distance from uniform"
  - "Distribution Balance: 1 - (stdDev / mean) for teacher load balance"
  - "Threshold-based recommendations: >0.2 disparity, >0.3 abroca, <0.7 balance triggers warnings"

patterns-established:
  - "Pattern: Fairness metrics use 0-1 normalized scale for consistent interpretation"
  - "Pattern: Status colors (green/yellow/red) based on thresholds for quick visual assessment"
  - "Pattern: Recommendations include contextual icons (success/warning/error)"

# Metrics
duration: 5min
completed: 2026-01-31
---

# Phase 13 Plan 6: 공정성 메트릭 구현 및 대시보드 UI 요약

**알고리즘적 편향 검증을 위한 3가지 공정성 메트릭(Disparity Index, ABROCA, Distribution Balance)을 계산하고 시각화 대시보드로 편향 현황을 모니터링하며 개선 제안을 제공**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-31T01:02:39Z
- **Completed:** 2026-01-31T01:07:43Z
- **Tasks:** 3
- **Files created:** 4

## Accomplishments

- **Disparity Index 계산**: 학교별 평균 궁합 점수의 최대-최소 차이를 정규화하여 집단 간 편향 측정
- **ABROCA 계산**: 히스토그램(10 bins) 기반으로 실제 점수 분포와 균등 분포의 L1 distance 측정
- **Distribution Balance 계산**: 선생님별 배정 수의 표준편차/평균으로 균형 정도 측정 (1 - stdDev/mean)
- **공정성 대시보드 페이지**: /matching/fairness 경로에 RBAC(DIRECTOR, TEAM_LEADER) 적용
- **시각화 컴포넌트**: 3개 메트릭 카드(Progress bar), 색상 기반 상태 표시(양호/주의/위험), 추천 사항 섹션
- **히스토리 테이블**: 과거 배정 제안별 메트릭 추적 및 비교

## Task Commits

Each task was committed atomically:

1. **Task 1: 공정성 메트릭 계산 함수 구현** - `901efd2` (feat)
2. **Task 2 & 3: 공정성 메트릭 대시보드 및 시각화** - `7a87336` (feat)

## Files Created

- `src/lib/analysis/fairness-metrics.ts` - 공정성 메트릭 계산 함수 (calculateFairnessMetrics, calculateDisparityIndex, calculateABROCA, calculateDistributionBalance)
- `src/app/(dashboard)/matching/fairness/page.tsx` - 공정성 메트릭 대시보드 페이지 (Server Component, RBAC)
- `src/components/compatibility/fairness-metrics-panel.tsx` - 공정성 메트릭 시각화 컴포넌트 (Client Component)
- `src/components/ui/progress.tsx` - Progress bar UI 컴포넌트

## Decisions Made

1. **Disparity Index 정규화**: 학교별 평균 점수 차이를 100으로 나누어 0-1 범위로 정규화 (0 = 완전 공정, 1 = 최대 불공정)
2. **ABROCA 계산 방식**: 10개 히스토그램 bin으로 점수 분포를 측정하고 균등 분포와의 L1 distance로 편향 계산
3. **Distribution Balance 공식**: 1 - (stdDev / mean)로 계산하여 1에 가까울수록 균등, 0에 가까울수록 불균형 표현
4. **임계값 설정**: Disparity Index > 0.2, ABROCA > 0.3, Distribution Balance < 0.7 시 경고/개선 제안 생성

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- **TypeScript Map/Set iteration**: `for...of` 구문에서 TypeScript 오류 발생 → `Array.from()`으로 해결
- **Student.school nullable**: Prisma schema에서 school 필드가 nullable이나 실제로는 required → 타입 단언(as string)으로 처리
- **Progress 컴포넌트 부재**: shadcn/ui Progress 컴포넌트가 없어 직접 구현

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**What's ready:**
- 공정성 메트릭이 계산되어 알고리즘적 편향을 수치화할 수 있음
- 대시보드에서 편향 현황을 실시간으로 모니터링 가능
- 개선 제안이 제공되어 가중치 재조정 등의 조치를 안내함

**What's next:**
- Phase 13-07: 배정 결과 보고서 PDF 생성 및 다운로드 기능
- Phase 13-08: 궁합 분석 설정 페이지 (가중치 조정 UI)

**Blockers/Concerns:**
- 현재는 AssignmentProposal 데이터 기반으로만 공정성 계산 - 실제 적용된 배정(Student.teacherId) 기반 계산도 필요할 수 있음
- ABROCA 임계값(0.3)은 경험적 설정 - 실제 데이터로 검증 필요

---
*Phase: 13-compatibility-analysis-matching*
*Completed: 2026-01-31*
