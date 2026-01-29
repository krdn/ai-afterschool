---
phase: 07-reports
plan: 03
subsystem: pdf-generation
tags: [server-actions, api-routes, pdf-caching, async-generation, polling]

# Dependency graph
requires:
  - phase: 07-02C
    provides: ConsultationReport PDF component with complete data structure
  - phase: 07-01
    provides: ReportPDF database model, PDF generation utilities
  - phase: 06-ai-integration
    provides: PersonalitySummary with version tracking for cache invalidation
provides:
  - ReportPDF database access layer with caching logic
  - PDF generation Server Actions with async after() pattern
  - PDF streaming API endpoint (cache-first, on-demand fallback)
  - Status polling API endpoint for client-side updates
affects: [07-04, 07-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - after() pattern for non-blocking PDF generation
    - Status-based caching (none, generating, complete, failed, stale)
    - DataVersion-based cache invalidation
    - React.createElement for JSX in .ts files
    - API route PDF streaming with proper headers

key-files:
  created:
    - src/lib/db/reports.ts
    - src/app/(dashboard)/students/[id]/report/actions.ts
    - src/app/api/students/[id]/report/route.ts
    - src/app/api/students/[id]/report/status/route.ts
  modified: []

key-decisions:
  - "Convert JSX to React.createElement for .ts files - TypeScript doesn't support JSX in .ts files by default"
  - "Duplicate fetchReportData function - TODO: Extract to shared function in lib/db/reports.ts"
  - "Cache-first API strategy - Serve cached PDF if available, generate on-demand otherwise"
  - "Separate status endpoint - Lightweight polling API prevents unnecessary data fetching"

patterns-established:
  - "PDF Generation Flow: Check cache → Mark generating → Background generation → Mark complete/failed"
  - "Cache Invalidation: Compare PersonalitySummary.version with ReportPDF.dataVersion"
  - "Status Polling: Client polls /status endpoint for generation progress"
  - "Error Recovery: Failed generations are marked with error messages and can be retried"
  - "Path Revalidation: after() completion triggers revalidatePath for UI updates"

# Metrics
duration: 4min
completed: 2026-01-29
---

# Phase 07-03: PDF Generation Server Actions & API Routes Summary

**Complete PDF generation system with Server Actions, caching, status polling, and streaming API endpoint**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-29T14:32:28Z
- **Completed:** 2026-01-29T14:36:28Z
- **Tasks:** 4
- **Files created:** 4

## Accomplishments

- Created ReportPDF database access layer with 7 exported functions
- Implemented PDF generation Server Actions with async after() pattern
- Built PDF streaming API endpoint with cache-first strategy
- Created status polling API endpoint for client-side updates
- Fixed TypeScript compilation errors (React import, JSX conversion, type assertions)
- All success criteria verified (5/5)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ReportPDF database access layer** - `ef1bbe9` (feat)
2. **Task 2: Create PDF generation Server Actions** - `d1e2c93` (feat)
3. **Task 3: Create PDF streaming API route** - `c62fac1` (feat)
4. **Task 4: Create status polling API endpoint** - `4cc17a6` (feat)
5. **Bug fixes: TypeScript compilation errors** - `916e015` (fix)

**Plan metadata:** (to be committed with STATE.md)

## Files Created/Modified

### Created

- `src/lib/db/reports.ts` - ReportPDF database access layer (117 lines)
- `src/app/(dashboard)/students/[id]/report/actions.ts` - Server Actions for PDF generation (213 lines)
- `src/app/api/students/[id]/report/route.ts` - PDF streaming API endpoint (183 lines)
- `src/app/api/students/[id]/report/status/route.ts` - Status polling endpoint (41 lines)

## Component Details

### 1. ReportPDF Database Access Layer (src/lib/db/reports.ts)

**Exported Functions:**

- `getStudentReportPDF(studentId)` - Fetch cached PDF record
- `shouldRegeneratePDF(studentId, currentDataVersion)` - Check if PDF needs regeneration
- `saveReportPDF(params)` - Upsert PDF record with status
- `markPDFGenerating(studentId)` - Mark as generating (prevent duplicates)
- `markPDFComplete(studentId, fileUrl, dataVersion)` - Mark as complete
- `markPDFFailed(studentId, errorMessage)` - Mark as failed
- `invalidateStudentReport(studentId)` - Mark as stale (trigger regeneration)

**Cache Invalidation Logic:**

```typescript
// Returns true if PDF should be regenerated
if (!report) return true                    // No PDF exists
if (report.status === 'failed') return true // Retry failed
if (report.status === 'stale') return true  // Stale cache
if (report.dataVersion !== currentDataVersion) return true // Data changed
return false                                // PDF is current
```

### 2. PDF Generation Server Actions (actions.ts)

**generateConsultationReport(studentId)**

Flow:
1. Verify teacher authentication (verifySession)
2. Verify student ownership
3. Check if already generating (prevent duplicate)
4. Get current data version from PersonalitySummary
5. Check if regeneration needed (cache hit)
6. Mark as generating
7. Generate PDF in background using after()
8. Fetch report data (student + all analyses)
9. Render PDF to file
10. Mark complete/failed
11. Revalidate path for UI updates

**getReportStatus(studentId)**

Returns:
```typescript
{
  status: 'none' | 'generating' | 'complete' | 'failed' | 'stale'
  fileUrl: string | null
  errorMessage: string | null
  generatedAt: Date | null
}
```

**fetchReportData(studentId, teacherId)**

Fetches complete student data:
- Student info (name, birthDate, school, grade, targets)
- All 5 analysis types (MBTI, Saju, Name, Face, Palm)
- PersonalitySummary (coreTraits, learningStrategy, careerGuidance)
- Generated timestamp

### 3. PDF Streaming API Route (route.ts)

**GET /api/students/[id]/report**

Flow:
1. Verify authentication
2. Verify student ownership
3. Check for cached PDF
4. If cached and file exists → Serve file with caching headers
5. If missing or stale → Generate on-demand
6. Return PDF stream with proper headers

**Headers:**
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="report-{name}.pdf"`
- `Content-Length: {buffer.length}`
- `Cache-Control: public, max-age=3600` (cached) or `no-cache` (on-demand)

### 4. Status Polling Endpoint (status/route.ts)

**GET /api/students/[id]/report/status**

Returns current PDF generation status for client-side polling.

## Caching Strategy

### Cache States

| Status | Description | Action |
|--------|-------------|--------|
| `none` | No PDF generated | Generate on request |
| `generating` | Currently generating | Return "already generating" |
| `complete` | PDF ready for download | Serve cached file |
| `failed` | Generation failed | Retry on next request |
| `stale` | Data outdated | Regenerate on request |

### Cache Invalidation

**Data Version Checking:**
- PersonalitySummary.version auto-increments on updates
- ReportPDF.dataVersion stores version at generation time
- Mismatch triggers regeneration

**Manual Invalidation:**
- `invalidateStudentReport(studentId)` marks as stale
- Triggers regeneration on next request

## Async Generation Pattern

Uses Phase 6's `after()` pattern for non-blocking PDF generation:

```typescript
after(async () => {
  try {
    // Fetch data
    const reportData = await fetchReportData(studentId, teacherId)

    // Generate PDF
    await pdfToFile(
      React.createElement(ConsultationReport, reportData) as React.ReactElement<any>,
      filepath
    )

    // Mark complete
    await markPDFComplete(studentId, fileUrl, dataVersion)

    // Refresh UI
    revalidatePath(`/students/${studentId}`)
  } catch (error) {
    // Mark failed
    await markPDFFailed(studentId, errorMessage)

    // Refresh UI
    revalidatePath(`/students/${studentId}`)
  }
})
```

**Benefits:**
- Non-blocking: Server returns immediately
- Progress tracking: Status API shows generation state
- Error recovery: Failed generations are logged
- UI updates: Path revalidation triggers refresh

## Known Limitations

### 1. Duplicate fetchReportData Function

**Issue:** `fetchReportData` is duplicated in `actions.ts` and `route.ts`

**Impact:** Code duplication, maintenance burden

**TODO:** Extract to shared function in `src/lib/db/reports.ts`

**Proposed Solution:**
```typescript
// src/lib/db/reports.ts
export async function fetchReportData(studentId: string, teacherId: string) {
  // ... implementation
}
```

### 2. JSX in .ts Files

**Issue:** TypeScript doesn't support JSX syntax in .ts files by default

**Workaround:** Use `React.createElement` instead of JSX

**Impact:** Less readable code, but functional

**Alternative:** Rename to .tsx (but breaks Next.js conventions)

### 3. File System Dependency

**Issue:** Cached PDFs stored in file system (./public/reports)

**Impact:** Not scalable across multiple server instances

**Future Consideration:** Use object storage (S3, Cloudinary) for production

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript compilation errors**

- **Found during:** Verification (TypeScript compilation)
- **Issues:**
  1. `next/after` module doesn't exist → Changed to `next/server`
  2. JSX syntax in .ts files → Converted to `React.createElement`
  3. Missing `generatedAt` in params type → Added to interface
  4. Wrong db import path → Fixed to `@/lib/db`
  5. Missing type assertions → Added `as React.ReactElement<any>`
  6. Prisma client not generated → Ran `npx prisma generate`
- **Files modified:** actions.ts, route.ts, reports.ts
- **Verification:** `npx tsc --noEmit` completes without errors (0 errors)
- **Committed in:** `916e015` (separate fix commit)

---

**Total deviations:** 1 auto-fixed (1 bug with 6 sub-issues)
**Impact on plan:** Auto-fixes necessary for TypeScript compilation. No scope creep.

## Issues Encountered

- TypeScript compilation failed due to 6 separate issues (wrong imports, JSX in .ts, missing types) - all resolved with single fix commit
- Required Prisma client regeneration for ReportPDF model

## Authentication Gates

None - no external service authentication required.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Complete for next phases:**
- ReportPDF DAL functions ready for UI integration (07-04, 07-05)
- Server Actions ready for button click handlers
- API endpoints ready for direct PDF download links
- Status polling ready for progress indicators
- TypeScript compilation confirmed (0 errors)

**Ready for:**
- 07-04: UI integration (Generate Report button, status display, download link)
- 07-05: Testing and deployment

**No blockers** - all dependencies satisfied, proceeding to 07-04.

---
*Phase: 07-reports*
*Plan: 03*
*Completed: 2026-01-29*
