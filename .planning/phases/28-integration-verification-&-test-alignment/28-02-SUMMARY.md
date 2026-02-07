---
phase: 28
plan: 02
title: "Selector Fixes for High-Priority Components"
summary: "High-priority E2E test selectors added to student tabs, admin pages, counseling components, error pages, and matching components"
subsystem: "E2E Testing Infrastructure"
tags: ["e2e", "data-testid", "selectors", "testing"]
priority: "high"
difficulty: "low"
status: "complete"

# Dependency Graph
requires:
  - "28-01"  # Test Environment Setup
provides:
  - "Reliable selectors for E2E tests"
  - "Test IDs for high-priority components"
affects:
  - "28-03"  # Login/Auth Flow Fixes
  - "28-04"  # API & Navigation Fixes

# Tech Stack
tech-stack:
  added: []
  patterns: ["data-testid naming convention", "kebab-case selectors"]

# Key Files
key-files:
  created: []
  modified:
    - "src/app/(dashboard)/students/[id]/page.tsx"
    - "src/app/(dashboard)/admin/llm-usage/page.tsx"
    - "src/app/(dashboard)/counseling/page.tsx"
    - "src/components/admin/admin-tabs-wrapper.tsx"
    - "src/components/counseling/ReservationCalendarView.tsx"
    - "src/components/counseling/CounselingSessionModal.tsx"
    - "src/components/counseling/CounselingSessionCard.tsx"
    - "src/components/errors/access-denied-page.tsx"
    - "src/components/errors/not-found-page.tsx"
    - "src/app/global-error.tsx"
    - "src/components/matching/teacher-recommendation-list.tsx"
    - "src/components/compatibility/compatibility-score-card.tsx"

# Decisions Made
decisions:
  - "data-tab 속성 추가: 학생 상세 탭에 data-tab 속성 추가로 탭 선택자 개선"
  - "AdminTabsContent testid 매핑: 탭 값에 따른 동적 testid 할당으로 통합 admin 페이지 지원"
  - "통계 카드 testid 패턴: counseling-stat-card-{type} 패턴으로 일관성 유지"
  - "동적 매칭 ID: teacher-match-{id} 패턴으로 각 선생님 매칭 카드 식별"

# Metrics
metrics:
  duration: "5m 16s"
  completed: "2026-02-07"
  commits: 5
  files_changed: 12
  lines_added: 29
  lines_removed: 17

# Deviations
deviations: "None - plan executed exactly as written."

# Testing
testing:
  build_status: "pass"
  e2e_tests_run: false
  unit_tests: false

# Self-Check
self_check: "PASSED"
- All 12 modified files exist
- All 6 commits verified (9823220, 92713c4, c529d68, 34dd10f, 0b9bdf1, ecb4e14)
- SUMMARY.md exists at correct path
---
