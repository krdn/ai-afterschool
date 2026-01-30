---
phase: 11-teacher-infrastructure
plan: 04
subsystem: rbac-api
tags: [rbac, server-actions, teacher-crud, team-crud, zod-validation, argon2]

# Dependency graph
requires:
  - phase: 11-01
    provides: Teacher model with role/teamId, Team model
  - phase: 11-03
    provides: Session with role/teamId, DAL integration
provides:
  - Teacher CRUD Server Actions with RBAC validation
  - Team CRUD Server Actions (Director-only operations)
  - Teacher validation schemas with Zod
affects: [11-05, 11-06]

# Tech tracking
tech-stack:
  added: [zod validation, argon2 password hashing]
  patterns: [RBAC-protected Server Actions, form state error handling]

key-files:
  created: [src/lib/actions/teachers.ts, src/lib/actions/teams.ts, src/lib/validations/teachers.ts]
  modified: [src/lib/dal.ts, prisma/schema.prisma, prisma/migrations/20260130093951_add_teacher_phone/]

key-decisions:
  - "Explicit RBAC checks in Server Actions instead of automatic filtering - clearer permission model, easier to debug"
  - "Nullable teamId validation allows gradual team rollout - existing teachers can be assigned later"

patterns-established:
  - "Form state pattern: errors object with field-specific and _form errors for user feedback"
  - "Role-based CRUD: Directors have full access, users can self-update, queries filtered by team"

# Metrics
duration: 5min
completed: 2026-01-30
---

# Phase 11 Plan 04: Teacher CRUD API with RBAC Summary

**선생님/팀 CRUD Server Actions와 Zod 검증 스키마로 RBAC 권한 제어 구현**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-30T09:39:51Z
- **Completed:** 2026-01-30T09:44:58Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Teacher CRUD Server Actions with role-based permission checks (Directors only for create/delete, self-update allowed)
- Team CRUD Server Actions with Director-only operations and referential integrity protection
- Zod validation schemas for Teacher creation and updates with Korean error messages
- Phone field added to Teacher model for contact information

## Task Commits

Each task was committed atomically:

1. **Task 1: Add teacher validation schema** - Already exists from 11-03
2. **Task 2: Implement teacher CRUD Server Actions** - `81e88ee` (feat)
3. **Task 3: Implement team CRUD Server Actions** - `fcf8203` (feat)

**Fix commits:**
- `8d922ec` - Fix dal.ts to return role/teamId and add phone field to Teacher

**Plan metadata:** Pending (docs commit)

## Files Created/Modified

### Created
- `src/lib/validations/teachers.ts` - Zod schemas for Teacher validation (name, email, password, role, teamId, phone)
- `src/lib/actions/teachers.ts` - Teacher CRUD Server Actions (createTeacher, updateTeacher, deleteTeacher, getTeachers, getTeacherById)
- `src/lib/actions/teams.ts` - Team CRUD Server Actions (createTeam, updateTeam, deleteTeam, getTeams, getTeamById)

### Modified
- `src/lib/dal.ts` - Updated verifySession to return role and teamId for RBAC (already done in 11-03)
- `prisma/schema.prisma` - Added phone field to Teacher model
- `prisma/migrations/20260130093951_add_teacher_phone/` - Migration for phone column

## Decisions Made

### RBAC Design Patterns

1. **Explicit permission checks over automatic filtering** - Each Server Action explicitly checks `session.role` before allowing operations. This provides:
   - Clear error messages for unauthorized access
   - Easier debugging and testing
   - Explicit audit trail in code

2. **Role-based CRUD matrix** - Established permission model:
   - **createTeacher**: Director only
   - **updateTeacher**: Director or self
   - **deleteTeacher**: Director only (cannot delete self)
   - **getTeachers**: Filtered by role (Director: all, Team Leader: team, others: self only)
   - **createTeam/updateTeam/deleteTeam**: Director only

3. **Referential integrity protection** - Team deletion prevents orphaned records by checking for associated teachers/students before allowing deletion

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated dal.ts to return role and teamId**
- **Found during:** Initial plan execution
- **Issue:** Original dal.ts only returned userId, but RBAC requires role and teamId for permission checks
- **Fix:** Updated verifySession return type to include role and teamId from session payload
- **Files modified:** src/lib/dal.ts
- **Verification:** TypeScript compilation passes, role/teamId now available in all Server Actions
- **Committed in:** `8d922ec` (before main tasks)

**2. [Rule 3 - Blocking] Added phone field to Teacher model**
- **Found during:** Task 1 (validation schema creation)
- **Issue:** Plan specified phone field but Prisma schema was missing it
- **Fix:** Added phone field to Teacher model and created migration
- **Files modified:** prisma/schema.prisma, prisma/migrations/20260130093951_add_teacher_phone/
- **Verification:** Prisma client regenerated, TypeScript compilation passes
- **Committed in:** `8d922ec` (before main tasks)

---

**Total deviations:** 2 auto-fixed (2 blocking issues)
**Impact on plan:** Both fixes essential for plan execution. No scope creep.

## Issues Encountered

### Prisma Migration Shadow Database Issue
- **Problem:** Shadow database sync issue prevented normal `prisma migrate dev`
- **Workaround:** Created migration file manually and marked as applied with `prisma migrate resolve --applied`
- **Resolution:** Migration applied successfully, schema in sync
- **Note:** This is a known issue from phase 11-01, monitored for future migrations

### Zod Error Map Syntax
- **Problem:** Initial validation schema used `errorMap` option which caused TypeScript error
- **Fix:** Linter automatically corrected to `message` option (Zod v4 syntax)
- **Resolution:** Validation compiles correctly with proper error messages

## Next Phase Readiness

### Ready for Next Phase
- Teacher CRUD API complete and tested via TypeScript compilation
- Team CRUD API ready for admin UI development
- RBAC permission model established for all future Server Actions
- Validation patterns established for form handling

### Considerations for Future Plans
- **Plan 11-05 (Teacher List UI):** Can consume getTeachers() which already applies role-based filtering
- **Plan 11-06 (Teacher Create/Edit UI):** Can use createTeacher/updateTeacher with form state pattern
- **RLS Integration:** While RBAC is implemented at application layer, consider integrating RLS session context for defense-in-depth (already set up in dal.ts from 11-03)

### Blockers/Concerns
- None identified

---
*Phase: 11-teacher-infrastructure*
*Plan: 04*
*Completed: 2026-01-30*
