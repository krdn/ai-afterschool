---
phase: 01-foundation-authentication
plan: 01
subsystem: infra
tags: [nextjs, prisma, postgresql, shadcn-ui, tailwind, sonner, zod, jose, argon2, resend]

# Dependency graph
requires: []
provides:
  - Next.js 15.x scaffold with Tailwind and ESLint
  - shadcn/ui component baseline with Sonner setup
  - Prisma schema and initial migration for Teacher/Student data
affects: [authentication, student-crud, ui, database]

# Tech tracking
tech-stack:
  added: [next, react, tailwindcss, prisma, @prisma/client, shadcn-ui, sonner, zod, jose, argon2, resend, @tanstack/react-table, react-hook-form, @hookform/resolvers]
  patterns: [Prisma client singleton, env example for local setup, shadcn/ui component ownership]

key-files:
  created: [prisma/schema.prisma, prisma/migrations/20260127142756_init/migration.sql, src/lib/db.ts, components.json, tailwind.config.ts, src/components/ui/button.tsx]
  modified: [package.json, package-lock.json, tsconfig.json, src/app/layout.tsx, src/app/globals.css, .gitignore]

key-decisions:
  - "Use Noto Sans KR via next/font/google for the primary Korean font"
  - "Run local Prisma migrations against the existing Supabase Postgres container on port 54322"

patterns-established:
  - "DB access uses a Prisma client singleton in src/lib/db.ts"
  - "UI primitives come from shadcn/ui with Sonner for toast UX"

# Metrics
duration: 1 min
completed: 2026-01-27
---

# Phase 1 Plan 01: Project Setup and DB Schema Summary

**Next.js 15.5 scaffold with shadcn/ui primitives and a Prisma schema for teacher-student management.**

## Performance

- **Duration:** 1 min
- **Started:** 2026-01-27T23:31:24+09:00
- **Completed:** 2026-01-27T14:33:16Z
- **Tasks:** 2
- **Files modified:** 31

## Accomplishments
- Next.js App Router project initialized with Tailwind, ESLint, and Korean font setup
- shadcn/ui components installed alongside Sonner and form/table dependencies
- Prisma schema and migration created for Teacher, Student, and PasswordResetToken

## Task Commits

Each task was committed atomically:

1. **Task 1: Next.js 프로젝트 생성 및 의존성 설치** - `3f7cfcd` (feat)
2. **Task 2: Prisma 스키마 정의 및 DB 마이그레이션** - `06d57e1` (feat)

**Plan metadata:** TBD (docs: complete plan)

## Files Created/Modified
- `package.json` - project dependencies aligned to Next.js 15.x
- `src/app/layout.tsx` - root layout with Korean font and Sonner Toaster
- `src/app/globals.css` - Tailwind theme variables and font binding
- `prisma/schema.prisma` - Teacher/Student/PasswordResetToken models
- `prisma/migrations/20260127142756_init/migration.sql` - initial schema migration
- `src/lib/db.ts` - Prisma client singleton for server usage
- `src/components/ui/*` - shadcn/ui primitives for buttons, forms, tables, cards
- `.env.local.example` - environment variable template for local setup

## Decisions Made
- Use Noto Sans KR for the primary UI font to support Korean typography.
- Target the local Supabase Postgres container (port 54322) for initial migrations.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] create-next-app refused non-empty root directory**
- **Found during:** Task 1 (project scaffold)
- **Issue:** CLI blocked initialization because `.planning/` and README/RULES existed
- **Fix:** Generated the app in a temp directory, then rsynced into repo root
- **Files modified:** project scaffold files under `src/`, `public/`, configs
- **Verification:** `npm run dev` and `npm run build` succeeded
- **Committed in:** `3f7cfcd` (Task 1 commit)

**2. [Rule 3 - Blocking] shadcn toast component deprecated**
- **Found during:** Task 1 (component install)
- **Issue:** `shadcn add toast` was blocked by deprecation warning
- **Fix:** Installed `sonner` component instead and wired Toaster in layout
- **Files modified:** `src/components/ui/sonner.tsx`, `src/app/layout.tsx`
- **Verification:** `npm run build` succeeded
- **Committed in:** `3f7cfcd` (Task 1 commit)

**3. [Rule 3 - Blocking] Prisma 7 schema no longer accepts datasource url**
- **Found during:** Task 2 (migration)
- **Issue:** `npx prisma migrate dev` failed with P1012
- **Fix:** Removed `url` from `schema.prisma` and relied on `prisma.config.ts`
- **Files modified:** `prisma/schema.prisma`, `prisma.config.ts`
- **Verification:** Migration applied successfully
- **Committed in:** `06d57e1` (Task 2 commit)

**4. [Rule 3 - Blocking] prisma db push --dry-run not supported**
- **Found during:** Task 2 (verification)
- **Issue:** CLI rejected `--dry-run` flag
- **Fix:** Ran `npx prisma db push` to verify schema sync
- **Files modified:** None
- **Verification:** CLI reported schema in sync
- **Committed in:** `06d57e1` (Task 2 commit)

**5. [Rule 1 - Bug] Next.js version mismatch with plan (16.x vs 15.x)**
- **Found during:** Post-task verification
- **Issue:** create-next-app installed Next.js 16.x, conflicting with plan requirement
- **Fix:** Downgraded to Next.js 15.5.x and rebuilt
- **Files modified:** `package.json`, `package-lock.json`, `tsconfig.json`
- **Verification:** `npm run build` succeeded on 15.5.x
- **Committed in:** `69cfb79` (post-task fix)

---

**Total deviations:** 5 auto-fixed (4 blocking, 1 bug)
**Impact on plan:** All fixes were required to satisfy the plan and unblock tooling. No scope creep.

## Issues Encountered
- Prisma CLI v7 removed `schema.prisma` datasource URLs and `db push --dry-run` support; adjusted accordingly.

## Authentication Gates
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Ready for `01-02-PLAN.md` (session/DAL/middleware), DB schema and UI base are in place.

---
*Phase: 01-foundation-authentication*
*Completed: 2026-01-27*
