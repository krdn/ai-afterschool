---
phase: 14-performance-analytics-team-insights
plan: 01
subsystem: database
tags: [prisma, performance, rbac, postgresql]

# Dependency graph
requires:
  - phase: 11-04
    provides: RBAC pattern with getRBACPrisma
  - phase: 11-02
    provides: Prisma Client Extensions for teamId filtering
provides:
  - Performance analytics data models (GradeHistory, CounselingSession, StudentSatisfaction)
  - Student control variables (initialGradeLevel, attendanceRate, priorAcademicPerformance)
  - 16 CRUD functions for performance data management
  - 9 Server Actions with RBAC checks
  - Grade progress calculation utility
affects: [14-02, 14-03, 14-04, 14-05, 14-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - RBAC with getRBACPrisma for team-based filtering
    - TypeScript payload types for type safety
    - Grade normalization (score/maxScore * 100)
    - Progress rate calculation with time-series tracking

key-files:
  created: [src/lib/db/performance.ts, src/lib/actions/performance.ts]
  modified: [prisma/schema.prisma]

key-decisions:
  - "teacherId nullable in GradeHistory - supports unassigned/self-study cases"
  - "ON DELETE SET NULL for GradeHistory.teacherId - preserves grade records when teacher deleted"
  - "ON DELETE CASCADE for other models - automatic cleanup when student/teacher deleted"
  - "Composite indexes on [studentId, subject, testDate] for efficient grade tracking"
  - "NormalizedScore calculated at write time - 0-100 range for consistent analysis"

patterns-established:
  - "Pattern 1: RBAC in Server Actions - TEACHER role limited to own students, others have full access"
  - "Pattern 2: revalidatePath for Next.js cache invalidation after data mutations"
  - "Pattern 3: Form state validation - Zod-like validation with error returns"

# Metrics
duration: 2min
completed: 2026-01-31
---

# Phase 14 Plan 01: 성과 분석 데이터베이스 스키마 설계 및 구현 Summary

**GradeHistory, CounselingSession, StudentSatisfaction models with RBAC-enabled CRUD operations and grade progress tracking**

## Performance

- **Duration:** 2 min (from 12:01:38 to 12:03:13)
- **Started:** 2026-01-31T03:01:38Z
- **Completed:** 2026-01-31T03:03:13Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Performance analytics data models added (GradeHistory, CounselingSession, StudentSatisfaction)
- Student control variables added (initialGradeLevel, attendanceRate, priorAcademicPerformance)
- 16 CRUD functions implemented with proper TypeScript types
- 9 Server Actions with RBAC checks and form validation
- Grade progress calculation utility for tracking improvement over time

## Task Commits

Each task was committed atomically:

1. **Task 1: 성과 분석 데이터 모델 설계** - `4e33867` (feat)
2. **Task 2: 성과 데이터 CRUD 모듈 구현** - `09305dc` (feat)

**Plan metadata:** (not committed - summary created after execution)

## Files Created/Modified
- `prisma/schema.prisma` - Added GradeHistory, CounselingSession, StudentSatisfaction models with enums and indexes
- `src/lib/db/performance.ts` - 16 CRUD functions with TypeScript types and RBAC support
- `src/lib/actions/performance.ts` - 9 Server Actions with form validation and RBAC checks

## Decisions Made

### Schema Design Decisions
1. **teacherId nullable in GradeHistory** - Allows for self-study or unassigned test cases, maintaining flexibility
2. **ON DELETE SET NULL for GradeHistory.teacherId** - Preserves grade records when teacher is deleted (historical data integrity)
3. **ON DELETE CASCADE for other models** - Automatic cleanup for counseling sessions and satisfaction surveys when student/teacher deleted (no orphaned records)
4. **Composite indexes on [studentId, subject, testDate]** - Enables efficient querying of student grade history with time-series tracking

### Implementation Decisions
1. **NormalizedScore calculated at write time** - Stores 0-100 normalized score directly for consistent analysis without recalculation
2. **RBAC in Server Actions** - TEACHER role limited to own students via getRBACPrisma, DIRECTOR/TEAM_LEADER/MANAGER have full access
3. **Grade progress calculation utility** - calculateGradeProgress computes first/last scores and rate of change for trend analysis
4. **Separate RBAC-aware function** - getTeamAverageSatisfaction uses getRBACPrisma to filter teachers by team

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - models and migrations already existed from prior execution.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Performance data infrastructure complete and ready for analytics dashboards
- CRUD functions support all required operations for grade/counseling/satisfaction data
- RBAC pattern established ensures proper team-based data access
- Ready for Plan 14-02 (선생님 성과 분석 API 구현)

---
*Phase: 14-performance-analytics-team-insights*
*Completed: 2026-01-31*
