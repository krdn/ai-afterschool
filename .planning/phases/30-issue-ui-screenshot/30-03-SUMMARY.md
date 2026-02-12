---
phase: 30-issue-ui-screenshot
plan: 03
subsystem: ui
tags: [react, dialog, form, server-actions, github, prisma]

# Dependency graph
requires:
  - phase: 30-issue-ui-screenshot-01
    provides: modern-screenshot, capture.ts, image-storage.ts
  - phase: 30-issue-ui-screenshot-02
    provides: ScreenshotCapture, ScreenshotPreview components
provides:
  - IssueForm component for issue data input
  - IssueReportModal component integrating form + screenshot
  - createIssue action with screenshot/userContext support
  - generateIssueBody with image and context markdown
affects:
  - phase-31-sentry-error-collection
  - issue-dashboard-ui

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Form validation with Zod safeParse"
    - "Server Actions with FormData for file uploads"
    - "Radix Dialog for modal implementation"
    - "Component composition pattern (form + capture)"

key-files:
  created:
    - src/components/issues/issue-form.tsx
    - src/components/issues/issue-report-modal.tsx
  modified:
    - src/lib/actions/issues.ts
    - src/lib/github/services.ts

key-decisions:
  - "IssueSchema validation uses safeParse() for better error handling"
  - "userContext stored as Prisma.InputJsonValue with JsonNull fallback"
  - "Modal auto-closes 1.5s after successful submission for UX"
  - "Screenshot and form are independent but integrated in modal"

patterns-established:
  - "IssueForm: Props interface with onSubmit callback pattern"
  - "IssueReportModal: State machine for submit/success/error flow"
  - "FormData construction for Server Action with JSON stringified context"

# Metrics
duration: 23min
completed: 2026-02-12
---

# Phase 30 Plan 03: Issue Input Form and Modal Integration

**IssueForm component with validation + IssueReportModal integrating screenshot capture for complete issue reporting UX**

## Performance

- **Duration:** 23 min
- **Started:** 2026-02-12T08:46:52Z
- **Completed:** 2026-02-12T09:08:04Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- IssueForm component with title, category, description fields
- Zod validation with IssueSchema and error display
- Screenshot preview integration with remove functionality
- IssueReportModal combining ScreenshotCapture and IssueForm
- createIssue action updated to handle screenshotUrl and userContext
- generateIssueBody now includes screenshot markdown and user context
- Complete flow: Capture → Preview → Fill Form → Submit → Success

## Task Commits

Each task was committed atomically:

1. **Task 1: Create IssueForm component** - `690a8cc` (feat)
2. **Task 2: Update createIssue and generateIssueBody** - `19fd087` (feat)
3. **Task 3: Create IssueReportModal component** - `c9c0dde` (feat)

**Fixes during execution:** `3731128` (fix)

## Files Created/Modified

### Created
- `src/components/issues/issue-form.tsx` - Issue input form with validation
- `src/components/issues/issue-report-modal.tsx` - Modal wrapper integrating form and screenshot

### Modified
- `src/lib/actions/issues.ts` - Added screenshotUrl and userContext handling
- `src/lib/github/services.ts` - Updated generateIssueBody with image/context
- `src/lib/help/help-content.ts` - Fixed multi-line string syntax errors
- `src/lib/db.ts` - Fixed PrismaClient initialization for build
- `src/app/admin/llm-features/page.tsx` - Fixed Server Actions async function
- `src/app/api/feature-mappings/[id]/route.ts` - Fixed PrismaClient import
- `src/app/api/feature-mappings/route.ts` - Fixed PrismaClient import
- `src/app/api/feature-mappings/resolve/route.ts` - Fixed PrismaClient import
- `src/lib/actions/feature-mapping-actions.ts` - Fixed PrismaClient import

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed syntax errors in help-content.ts**
- **Found during:** Build verification after Task 1
- **Issue:** Multi-line strings inside single quotes caused "Unterminated string constant" errors
- **Fix:** Split multi-line strings into separate array elements
- **Files modified:** src/lib/help/help-content.ts
- **Verification:** Build passes after fixes
- **Commit:** 3731128

**2. [Rule 3 - Blocking] Fixed Server Actions error in llm-features page**
- **Found during:** Build verification after Task 1
- **Issue:** Arrow function with 'use server' inside was not async
- **Fix:** Made callback async function with proper 'use server' directive
- **Files modified:** src/app/admin/llm-features/page.tsx
- **Commit:** 3731128

**3. [Rule 3 - Blocking] Fixed PrismaClient initialization across files**
- **Found during:** Build verification after Task 1
- **Issue:** Multiple files creating new PrismaClient() instances caused build failures
- **Fix:** Changed to use centralized `db` export from `@/lib/db` with lazy initialization
- **Files modified:** src/lib/db.ts, 3 API routes, 1 actions file
- **Commit:** 3731128

**4. [Rule 1 - Bug] Fixed userContext type compatibility**
- **Found during:** Task 2 implementation
- **Issue:** userContext type incompatible with Prisma's Json field
- **Fix:** Used `Prisma.InputJsonValue` type and `Prisma.JsonNull` fallback
- **Files modified:** src/lib/actions/issues.ts
- **Committed in:** 19fd087 (Task 2)

---

**Total deviations:** 4 auto-fixed (1 blocking, 3 blocking from existing code, 1 bug)
**Impact on plan:** All fixes necessary for build and type correctness. No scope creep.

## Issues Encountered

None beyond the auto-fixed deviations above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- IssueForm and IssueReportModal components ready for integration
- createIssue action supports full screenshot/user context workflow
- GitHub integration generates rich issue bodies with images and context
- Ready for Phase 31: Sentry Error Auto-Collection

---
*Phase: 30-issue-ui-screenshot*
*Completed: 2026-02-12*
