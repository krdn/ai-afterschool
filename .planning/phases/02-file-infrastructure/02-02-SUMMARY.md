---
phase: 02-file-infrastructure
plan: 02
subsystem: infra
tags: [cloudinary, prisma, nextjs, zod]

# Dependency graph
requires:
  - phase: 01-foundation-authentication
    provides: Student model, authenticated server actions
provides:
  - StudentImage model with per-student type slots
  - Cloudinary signed upload parameters endpoint
  - Server actions for image upsert and deletion
affects: [02-03-ui, 02-04-verification, 05-ai-image-analysis]

# Tech tracking
tech-stack:
  added: [cloudinary]
  patterns: [signed direct upload via server-issued signature, square-crop resize for all image types]

key-files:
  created: [src/lib/cloudinary.ts, src/app/api/cloudinary/sign/route.ts, src/lib/actions/student-images.ts, src/lib/validations/student-images.ts]
  modified: [prisma/schema.prisma, prisma/migrations/20260128022234_add_student_images/migration.sql, src/lib/actions/students.ts, package.json, package-lock.json]

key-decisions:
  - "None - followed plan as specified"

patterns-established:
  - "Student images stored with per-type unique slot and Cloudinary asset cleanup"
  - "Signed upload parameters returned from /api/cloudinary/sign"

# Metrics
duration: 8 min
completed: 2026-01-28
---

# Phase 2 Plan 2: Cloudinary storage and image persistence Summary

**Cloudinary-backed signed uploads with StudentImage persistence and per-type replacement via server actions.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-28T02:22:13Z
- **Completed:** 2026-01-28T02:30:31Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments
- Added StudentImage schema with per-student unique slots and migration
- Implemented Cloudinary signed upload helper and API endpoint
- Added image validation and server actions for upsert/delete with asset cleanup

## Task Commits

Each task was committed atomically:

1. **Task 1: Add student image models to Prisma** - `dfda1d8` (feat)
2. **Task 2: Add Cloudinary helper and signed upload endpoint** - `0243ffc` (feat)
3. **Task 3: Persist and delete student images** - `c340013` (feat)

**Plan metadata:** (pending docs commit)

## Files Created/Modified
- `prisma/schema.prisma` - StudentImage model and enum definitions
- `prisma/migrations/20260128022234_add_student_images/migration.sql` - DB migration for image storage
- `src/lib/cloudinary.ts` - Cloudinary config, signature, and resize helpers
- `src/app/api/cloudinary/sign/route.ts` - Signed upload params endpoint
- `src/lib/validations/student-images.ts` - Image payload schema
- `src/lib/actions/student-images.ts` - Image upsert/delete actions with cleanup
- `src/lib/actions/students.ts` - Create/update student image payload handling
- `package.json` - Cloudinary dependency
- `package-lock.json` - Dependency lock updates

## Decisions Made
None - followed plan as specified.

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
- ESLint warning persists for TanStack Table hook memoization in `src/components/students/student-table.tsx` (pre-existing).

## User Setup Required

**External services require manual configuration.** See `02-USER-SETUP.md` for:
- Environment variables to add
- Account setup steps
- Verification commands

## Next Phase Readiness
- Ready for 02-03 UI work once Cloudinary env vars are configured
- Signed upload endpoint and persistence actions are in place

---
*Phase: 02-file-infrastructure*
*Completed: 2026-01-28*
