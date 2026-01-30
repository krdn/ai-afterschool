---
phase: 11-teacher-infrastructure
plan: 01
subsystem: database
tags: [prisma, postgresql, schema, migration, rbac, team-based-isolation]

# Dependency graph
requires:
  - phase: 10 (v2.0 milestone)
    provides: v1.1 production-ready foundation with Prisma ORM and PostgreSQL database
provides:
  - Role enum for teacher hierarchy (DIRECTOR, TEAM_LEADER, MANAGER, TEACHER)
  - Team model for multi-tenant data isolation
  - Teacher.role and Teacher.teamId fields for role-based access
  - Student.teamId field for team-based student assignment
  - Database migration with foreign key constraints and indexes
affects: [11-02-teacher-crud, 11-03-rbac-policies, 11-04-rbac-middleware, 12-01-student-team-assignment]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Role-based enum pattern for user hierarchy
    - Nullable foreign key pattern for gradual data migration
    - Team-based multi-tenancy with foreign key isolation

key-files:
  created:
    - prisma/migrations/20260130182537_add_teacher_role_and_team/migration.sql - Database migration SQL
  modified:
    - prisma/schema.prisma - Added Role enum, Team model, Teacher.role/teamId, Student.teamId

key-decisions:
  - "Role enum default value TEACHER ensures existing teachers have valid role without manual migration"
  - "Nullable teamId on Teacher and Student allows gradual rollout of team assignment"
  - "Foreign key constraints with ON DELETE SET NULL prevent orphaned records if Team deleted"
  - "Manual migration creation due to shadow database sync issue (Rule 3 - Blocking)"

patterns-established:
  - "Pattern 1: Enum-based role hierarchy with explicit role values"
  - "Pattern 2: Nullable foreign keys for zero-downtime schema changes"
  - "Pattern 3: Team-based multi-tenancy with FK-based data isolation"

# Metrics
duration: 4 min
completed: 2026-01-30
---

# Phase 11 Plan 01: Teacher Role-Based Database Schema Summary

**Role enum (DIRECTOR, TEAM_LEADER, MANAGER, TEACHER), Team model for multi-tenant isolation, and Teacher/Student team foreign keys for hierarchical access control foundation**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-30T09:23:15Z
- **Completed:** 2026-01-30T09:27:17Z
- **Tasks:** 3
- **Files modified:** 2 (schema.prisma, migration)

## Accomplishments
- Role enum with 4 hierarchical roles defined (DIRECTOR > TEAM_LEADER > MANAGER > TEACHER)
- Team model created with unique name constraint and timestamp fields
- Teacher model extended with role (default TEACHER) and optional teamId fields
- Student model extended with optional teamId for team-based assignment
- Foreign key constraints established for referential integrity
- Database indexes on teamId columns for query performance

## Task Commits

Each task was committed atomically:

1. **Task 1 & 2: Add Role enum and Team/Teacher/Student relations** - `ff51472` (feat)
2. **Task 3: Create and apply migration** - `cfd0a38` (feat)

**Plan metadata:** (to be committed separately)

## Files Created/Modified
- `prisma/schema.prisma` - Added Role enum, Team model, Teacher.role/teamId, Student.teamId
- `prisma/migrations/20260130182537_add_teacher_role_and_team/migration.sql` - Database migration SQL

## Decisions Made

1. **Role enum with default value TEACHER** - Ensures all existing Teacher records have valid role without requiring data migration. Existing teachers will be assigned TEACHER role by default, and can be promoted later by admin.

2. **Nullable teamId on Teacher and Student** - Allows gradual rollout of team assignment. Teachers and students can exist without being assigned to a team initially. Future plans can assign teams without requiring schema changes.

3. **Foreign key with ON DELETE SET NULL** - Prevents orphaned records if a Team is deleted. Teachers and students will have teamId set to NULL rather than breaking referential integrity.

4. **Manual migration creation** - Due to shadow database sync issue preventing `prisma migrate dev`, created migration manually and applied directly. Migration marked as resolved to maintain Prisma migration history.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added Student.teamId field and team relation**

- **Found during:** Task 2 (Teacher model modification)
- **Issue:** Prisma schema validation failed because Team model referenced `students` relation but Student model lacked opposite relation field. The plan stated "기존 Teacher 모델과 Student 모델은 이후 작업에서 수정 예정" but the Team-Student relation was required for schema validity.
- **Fix:** Added `teamId String?` and `team Team? @relation(fields: [teamId], references: [id])` to Student model to complete the bidirectional relation.
- **Files modified:** prisma/schema.prisma (Student model)
- **Verification:** `prisma validate` passed successfully
- **Committed in:** ff51472 (part of Task 2 commit)

**2. [Rule 3 - Blocking] Created and applied migration manually due to shadow database sync issue**

- **Found during:** Task 3 (Migration creation)
- **Issue:** `prisma migrate dev` failed with error "The underlying table for model `ReportPDF` does not exist" in shadow database. The shadow database was out of sync with actual database state.
- **Fix:** Created migration directory manually, wrote migration SQL based on schema changes, applied using `npx prisma db execute --stdin`, then marked migration as resolved using `prisma migrate resolve --applied`.
- **Files modified:** prisma/migrations/20260130182537_add_teacher_role_and_team/migration.sql
- **Verification:** `prisma migrate status` shows "Database schema is up to date!", `prisma validate` passes
- **Committed in:** cfd0a38 (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes were necessary for schema validity and migration completion. The Student.teamId addition enables proper Team-Student relations. Manual migration approach achieved same outcome as automated process.

## Issues Encountered

1. **Shadow database sync issue** - The `prisma migrate dev` command failed because the shadow database didn't have the ReportPDF table, even though the actual database was up to date. Resolved by creating migration manually and applying directly, then marking as resolved. This is a known issue with Prisma's shadow database in some development environments.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Role enum and Team model are ready for use in CRUD operations
- Teacher.role and teamId fields can be populated in future plans
- Student.teamId field ready for team assignment in Phase 12
- Foreign key constraints ensure referential integrity for RBAC implementation
- Indexes on teamId provide query performance for team-based filtering

**Ready for:** 11-02-PLAN.md (Teacher CRUD UI) - Can now create, read, update teachers with role and team assignment
**Prerequisites for RBAC:** PostgreSQL RLS policies need to be created in Phase 11-03 based on this schema foundation

---
*Phase: 11-teacher-infrastructure*
*Completed: 2026-01-30*
