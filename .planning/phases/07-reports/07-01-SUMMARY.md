---
phase: 07-reports
plan: 01
subsystem: pdf-generation
tags: [react-pdf, pdf-generation, korean-fonts, prisma, caching]

# Dependency graph
requires:
  - phase: 06-ai-integration
    provides: PersonalitySummary model with AI-generated content
provides:
  - ReportPDF database model for PDF caching
  - Korean font registration (Noto Sans KR TTF)
  - PDF generation utilities (buffer and file rendering)
  - Standardized PDF filename and storage path functions
affects: [07-02, 07-03, 07-04, 07-05]

# Tech tracking
tech-stack:
  added: [@react-pdf/renderer v4.3.2]
  patterns: [font-registration-module, pdf-utility-functions, status-based-caching]

key-files:
  created: [src/lib/pdf/fonts.ts, src/lib/pdf/generator.ts, public/fonts/NotoSansKR-Regular.ttf, public/fonts/NotoSansKR-Bold.ttf]
  modified: [prisma/schema.prisma, package.json, package-lock.json]

key-decisions:
  - "TTF format required for Korean fonts - OTF not supported by @react-pdf/renderer"
  - "Status-based PDF generation flow (none, generating, complete, failed)"
  - "Version tracking for cache invalidation using PersonalitySummary.version"

patterns-established:
  - "Font registration pattern: Centralized in lib/pdf/fonts.ts with exported constants"
  - "PDF utility pattern: Separate module for rendering logic (lib/pdf/generator.ts)"
  - "Cache invalidation pattern: dataVersion field references source data version"

# Metrics
duration: 2min
completed: 2026-01-29
---

# Phase 7 Plan 1: PDF Generation Infrastructure Summary

**ReportPDF caching model with Korean font support (Noto Sans KR TTF) and PDF rendering utilities using @react-pdf/renderer**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-29T14:14:48Z
- **Completed:** 2026-01-29T14:16:50Z
- **Tasks:** 4
- **Files modified:** 3

## Accomplishments
- Installed @react-pdf/renderer v4.3.2 for PDF generation
- Downloaded Noto Sans KR Korean fonts (Regular and Bold) in TTF format
- Created ReportPDF database model for caching generated PDFs
- Built font registration module with exported constants
- Implemented PDF generation utilities (buffer and file rendering)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install @react-pdf/renderer and download Korean fonts** - `1fe8ec8` (feat)
2. **Task 2: Add ReportPDF model to schema** - `954d8bb` (feat)
3. **Task 3: Create font registration module** - `6a0852c` (feat)
4. **Task 4: Create PDF generation utility module** - `ea003fe` (feat)
5. **Task 4 Fix: Fix TypeScript types in generator.ts** - `387b5b1` (fix)

**Plan metadata:** TBD (docs: complete plan)

_Note: All tasks completed successfully with auto-fix for TypeScript types_

## Files Created/Modified

### Created
- `src/lib/pdf/fonts.ts` - Korean font registration for @react-pdf/renderer (Noto Sans KR)
- `src/lib/pdf/generator.ts` - PDF generation utilities (pdfToBuffer, pdfToFile, filename generation)
- `public/fonts/NotoSansKR-Regular.ttf` - Korean font regular weight (297KB)
- `public/fonts/NotoSansKR-Bold.ttf` - Korean font bold weight (297KB)

### Modified
- `prisma/schema.prisma` - Added ReportPDF model with status-based caching
- `package.json` - Added @react-pdf/renderer v4.3.2 dependency
- `package-lock.json` - Updated dependency lock file

## Decisions Made

1. **TTF format for Korean fonts** - @react-pdf/renderer only supports TTF format for Korean fonts. OTF causes display issues (squares, garbled text). Downloaded from Google Fonts GitHub repository.

2. **Status-based PDF generation flow** - ReportPDF model uses status field (none, generating, complete, failed) to prevent duplicate generation and track progress.

3. **Version-based cache invalidation** - dataVersion field references PersonalitySummary.version to automatically invalidate cached PDFs when student data changes.

4. **Separate font registration module** - Centralized font configuration in lib/pdf/fonts.ts follows project pattern of lib modules (lib/actions, lib/db, etc.) for maintainability.

5. **Utility functions for both streaming and storage** - pdfToBuffer for API responses, pdfToFile for caching/storage provides flexibility for different use cases.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript types in generator.ts**
- **Found during:** Task 4 (PDF generation utility module)
- **Issue:** React.ReactElement type was too generic, causing TS2345 error with @react-pdf/renderer functions
- **Fix:** Changed React.ReactElement to React.ReactElement<DocumentProps> for proper type safety
- **Files modified:** src/lib/pdf/generator.ts
- **Verification:** TypeScript compilation passes with `npx tsc --noEmit`
- **Committed in:** 387b5b1 (separate fix commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Auto-fix necessary for type safety and correct compilation. No scope creep.

## Font Registration Details

### Font Family
- **Name:** Noto Sans KR
- **Format:** TTF (TrueType Font)
- **Weights:** 400 (Regular), 700 (Bold)

### Font Constants
```typescript
export const fonts = {
  sans: 'Noto Sans KR',
}

export const fontWeights = {
  normal: 400,
  bold: 700,
}
```

### File Paths
- Regular: `/fonts/NotoSansKR-Regular.ttf`
- Bold: `/fonts/NotoSansKR-Bold.ttf`

## ReportPDF Schema Structure

```prisma
model ReportPDF {
  id           String   @id @default(cuid())
  studentId    String   @unique
  status       String   @default("none")  // none, generating, complete, failed
  fileUrl      String?  // Relative path to PDF file
  dataVersion  Int?     // PersonalitySummary.version for cache invalidation
  errorMessage String?
  generatedAt  DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([studentId])
}
```

### Key Fields
- **studentId:** Unique constraint prevents duplicate PDFs per student
- **status:** Tracks generation state (none, generating, complete, failed)
- **fileUrl:** Relative path to cached PDF file
- **dataVersion:** References PersonalitySummary.version for cache invalidation
- **errorMessage:** Stores error details for failed generations

## PDF Storage Path Configuration

### Environment Variable
```bash
PDF_STORAGE_PATH=./public/reports  # Default
```

### Storage Function
```typescript
export function getPdfStoragePath(): string {
  return process.env.PDF_STORAGE_PATH || './public/reports'
}
```

### Filename Generation
```typescript
export function generateReportFilename(
  studentId: string,
  studentName: string,
  timestamp: number = Date.now()
): string {
  const sanitizedName = studentName.replace(/[^a-zA-Z0-9가-힣]/g, '_')
  return `report-${studentId}-${sanitizedName}-${timestamp}.pdf`
}
```

**Example:** `report-clx7y8x0000qzqbhxke2k3s4h-홍길동-1706547200000.pdf`

## Issues Encountered

None - all tasks completed as planned with minor TypeScript type fix.

## Authentication Gates

None - no external service authentication required.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

### Ready for Next Phase
- ReportPDF database table created and pushed to database
- Korean fonts registered and available for PDF components
- PDF generation utilities ready for template rendering
- TypeScript compilation passes without errors

### Dependencies for Next Phase
- PDF template components can now use fonts from `src/lib/pdf/fonts.ts`
- PDF generation can use utilities from `src/lib/pdf/generator.ts`
- Caching logic can query ReportPDF model by studentId

### Blockers/Concerns
None - all infrastructure components are in place for PDF template development.

---
*Phase: 07-reports*
*Plan: 01*
*Completed: 2026-01-29*
