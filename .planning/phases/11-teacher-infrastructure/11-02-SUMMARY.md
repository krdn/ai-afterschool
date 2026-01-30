---
phase: 11-teacher-infrastructure
plan: 02
subsystem: auth
tags: [rbac, rls, prisma, postgresql, row-level-security, team-isolation]

# Dependency graph
requires:
  - phase: 11-teacher-infrastructure
    plan: 01
    provides: Teacher.role/teamId fields, Team model, Role enum
provides:
  - Prisma Client Extensions for automatic team filtering
  - PostgreSQL RLS policies for database-level access control
  - setRLSSessionContext function for RLS session variable management
  - createTeamFilteredPrisma factory for role-based Prisma clients
affects: [11-03-session-rbac, 11-04-teacher-crud, 11-05-student-rbac]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Prisma Client Extensions for query interception
    - PostgreSQL RLS with session variables (rls.teacher_role, rls.team_id)
    - Defense in Depth (app-layer + DB-layer filtering)
    - Role-based Prisma client factory pattern

key-files:
  created:
    - src/lib/db/rbac.ts
    - scripts/apply-rls.ts
    - scripts/check-db.ts
    - scripts/check-policies.ts
  modified:
    - prisma/schema.prisma

key-decisions:
  - "Used PostgreSQL quoted identifiers (\"teamId\") in RLS policies to preserve case sensitivity"
  - "Applied RLS policies via TypeScript script instead of psql for better maintainability"
  - "Created separate scripts for RLS application and verification for debugging"

patterns-established:
  - "Pattern 1: Prisma Client Extensions with $allOperations for automatic filtering"
  - "Pattern 2: PostgreSQL RLS using current_setting('rls.variable_name', TRUE) pattern"
  - "Pattern 3: Role-based client factory returning different Prisma instances based on role"
  - "Pattern 4: Defense in Depth - app-layer (Prisma Extensions) + DB-layer (RLS)"

# Metrics
duration: 11min
completed: 2026-01-30
---

# Phase 11: Teacher Infrastructure & Access Control - Plan 02 Summary

**Prisma Client Extensions with PostgreSQL RLS for team-based data isolation and role-based access control**

## Performance

- **Duration:** 11 min
- **Started:** 2026-01-30T09:23:08Z
- **Completed:** 2026-01-30T09:34:05Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- **Prisma Client Extensions for team filtering**: Automatic `teamId` injection on all Teacher/Student queries based on user role
- **PostgreSQL RLS policies enabled**: 4 policies (2 per table) for database-level access control enforcement
- **setRLSSessionContext function**: PostgreSQL session variable setter for RLS context (rls.teacher_role, rls.team_id, rls.teacher_id)
- **createTeamFilteredPrisma factory**: Returns role-appropriate Prisma client (DIRECTOR gets unfiltered, others get team-filtered)
- **Verification scripts**: Scripts to check RLS status, policies, and database schema

## Task Commits

Each task was committed atomically:

1. **Task 1: RLS 정책 SQL 스크립트 작성** - `fe2119a` (docs)
2. **Task 2: Prisma Client Extensions RBAC 모듈 생성** - `61d5cc6` (feat)
3. **Task 3: RLS 정책 데이터베이스에 적용** - `79ee67a` (feat)

**Plan metadata:** (to be committed after SUMMARY.md)

## Files Created/Modified

- `prisma/schema.prisma` - Added RLS policy SQL as comments for reference
- `src/lib/db/rbac.ts` - Core RBAC module with setRLSSessionContext, createTeamFilteredPrisma, getRBACPrisma
- `scripts/apply-rls.ts` - Script to apply RLS policies to database
- `scripts/check-db.ts` - Script to verify database state (columns, RLS status)
- `scripts/check-policies.ts` - Script to list existing RLS policies

## Decisions Made

1. **Quoted identifiers in RLS policies**: Used `"teamId"` (quoted) instead of `teamId` (unquoted) to prevent PostgreSQL from folding to lowercase, which caused "column teamid does not exist" errors
2. **TypeScript scripts over psql**: Created `apply-rls.ts` instead of raw SQL files for better maintainability and error handling
3. **Policy existence checks**: Wrapped each `CREATE POLICY` in try/catch to handle cases where policies already exist from previous runs

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Missing teamId column in database**
- **Found during:** Task 3 (Applying RLS policies)
- **Issue:** Schema had teamId fields but migration wasn't applied, causing "column teamid does not exist" error
- **Fix:** Migration `20260130182537_add_teacher_role_and_team` was already created and applied (database showed as up-to-date)
- **Files modified:** None (migration already existed)
- **Verification:** `check-db.ts` confirmed teamId columns exist in both Teacher and Student tables
- **Committed in:** N/A (migration was pre-existing)

**2. [Rule 1 - Bug] PostgreSQL case sensitivity in RLS policies**
- **Found during:** Task 3 (Applying RLS policies)
- **Issue:** Unquoted `teamId` was folded to lowercase `teamid` by PostgreSQL, causing column not found errors
- **Fix:** Changed to quoted `"teamId"` in RLS policy USING clauses
- **Files modified:** `scripts/apply-rls.ts`
- **Verification:** Policies created successfully after fix
- **Committed in:** `79ee67a` (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both auto-fixes essential for functionality. RLS policies now work correctly with proper case handling.

## Issues Encountered

- **psql not available**: Initial plan to use psql directly failed due to missing psql binary. Resolved by creating TypeScript script using Prisma's `$executeRaw` instead.
- **Prisma Client constructor error**: Initial node -e script failed with "PrismaClient needs to be constructed with options". Resolved by importing the existing db singleton from `@/lib/db` instead.

## User Setup Required

None - no external service configuration required. RLS policies are applied to local PostgreSQL database.

## Next Phase Readiness

**Ready for Phase 11-03 (Session RBAC):**
- `setRLSSessionContext` function available for session integration
- `getRBACPrisma` factory ready for session-based client creation
- RLS policies enforced at database level

**Blockers/concerns:**
- Session module needs to call `setRLSSessionContext` before every DB query
- Server Actions need to use `getRBACPrisma` instead of raw `db` for proper team filtering

---
*Phase: 11-teacher-infrastructure*
*Plan: 02*
*Completed: 2026-01-30*
