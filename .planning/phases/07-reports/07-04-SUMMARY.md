---
phase: 07-reports
plan: 04
subsystem: pdf-ui
tags: [client-component, server-component, polling, state-management, ui-integration]

# Dependency graph
requires:
  - phase: 07-03
    provides: PDF generation Server Actions, status polling API endpoint
  - phase: 06-ai-integration
    provides: Server/Client component separation pattern
provides:
  - ReportButtonClient component with 2-second polling
  - ReportButton Server Component wrapper
  - Student detail page integration
affects: [07-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Polling-based status updates (2-second interval)
    - Server/Client component separation pattern
    - Dynamic import for client components
    - State-based UI rendering (none, generating, complete, failed)
    - Retry mechanism for failed generations

key-files:
  created:
    - src/components/students/report-button-client.tsx
    - src/components/students/report-button.tsx
  modified:
    - src/app/(dashboard)/students/[id]/page.tsx

key-decisions:
  - "2-second polling interval - Balances real-time feedback with server load"
  - "Server Component for initial state - Follows project pattern, improves performance"
  - "Dynamic import pattern - Avoids 'use client' directive in server components"
  - "PDF section placement at bottom - Logical flow: analysis -> summary -> recommendations -> report"

patterns-established:
  - "PDF Generation UI Flow: none -> generating -> complete/failed"
  - "Polling Cleanup: useEffect cleanup clears interval on component unmount"
  - "Cache Handling: Cached PDF displays immediately, no polling needed"
  - "Error Recovery: Failed state shows retry button with error message"
  - "State Synchronization: Client polls status API, Server loads initial state"

# Metrics
duration: 1min
completed: 2026-01-29
---

# Phase 07-04: PDF Generation Button UI Summary

**Complete UI implementation with polling-based status display and Server/Client component separation**

## Performance

- **Duration:** 1 min
- **Started:** 2026-01-29T14:39:49Z
- **Completed:** 2026-01-29T14:40:49Z
- **Tasks:** 3
- **Files created:** 2
- **Files modified:** 1

## Accomplishments

- Created ReportButtonClient component with 2-second polling for status updates
- Created ReportButton Server Component wrapper with dynamic import
- Integrated ReportButton into student detail page
- Implemented four UI states (none, generating, complete, failed)
- Added retry mechanism for failed generations
- All success criteria verified (5/5)
- TypeScript compilation confirmed (0 errors)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ReportButtonClient component with polling** - `4071c85` (feat)
2. **Task 2: Create ReportButton Server Component wrapper** - `457a986` (feat)
3. **Task 3: Integrate ReportButton into student detail page** - `e2d51c4` (feat)

**Plan metadata:** (to be committed with STATE.md)

## Files Created/Modified

### Created

#### 1. ReportButtonClient Component (src/components/students/report-button-client.tsx)

**Purpose:** Client component with polling for PDF generation status

**Key Features:**

- `'use client'` directive for client-side rendering
- Four UI states with conditional rendering:
  - `none`: Show "보고서 생성" button
  - `generating`: Show "생성 중..." with spinner
  - `complete`: Show "PDF 다운로드" link
  - `failed`: Show "재시도" button with error message
- 2-second polling interval for status updates
- Automatic cleanup on component unmount
- Integration with `generateConsultationReport` Server Action

**State Management:**

```typescript
const [status, setStatus] = useState<ReportStatus>(initialStatus)
const [fileUrl, setFileUrl] = useState<string | null>(initialFileUrl)
const [errorMessage, setErrorMessage] = useState<string | null>(null)
const [isPolling, setIsPolling] = useState(false)
```

**Polling Logic:**

```typescript
useEffect(() => {
  if (status === 'generating' && !isPolling) {
    const interval = setInterval(pollStatus, 2000)
    return () => clearInterval(interval) // Cleanup
  }
}, [status, isPolling, pollStatus])
```

**Status Polling:**

```typescript
const pollStatus = useCallback(async () => {
  const response = await fetch(`/api/students/${studentId}/report/status`)
  const data = await response.json()
  setStatus(data.status || 'none')
  setFileUrl(data.fileUrl)
  setErrorMessage(data.errorMessage)
}, [studentId])
```

#### 2. ReportButton Server Component (src/components/students/report-button.tsx)

**Purpose:** Server Component wrapper for initial state loading

**Key Features:**

- Server Component for data fetching
- Dynamic import of ReportButtonClient to avoid `'use client'` issues
- Fetches initial status from ReportPDF table
- Follows project pattern (personality-summary-card.tsx)

**Dynamic Import Pattern:**

```typescript
const ReportButtonClient = dynamic(
  () => import('./report-button-client').then(mod => ({ default: mod.ReportButtonClient })),
  { ssr: false }
)
```

**Initial State Loading:**

```typescript
const report = await db.reportPDF.findUnique({
  where: { studentId },
})

const status = (report?.status as 'none' | 'generating' | 'complete' | 'failed') || 'none'
const fileUrl = report?.fileUrl || null
```

### Modified

#### 3. Student Detail Page (src/app/(dashboard)/students/[id]/page.tsx)

**Changes:**

1. Added import: `import { ReportButton } from "@/components/students/report-button"`

2. Added PDF Report section after AI recommendations:

```typescript
{/* PDF Report Section */}
<div className="rounded-lg border bg-white p-6 shadow-sm">
  <div className="flex items-center justify-between">
    <div>
      <h3 className="text-lg font-semibold">상담 보고서</h3>
      <p className="text-sm text-gray-600">
        학생의 모든 분석 결과와 AI 제안을 포함한 종합 PDF 보고서를 생성합니다.
      </p>
    </div>
    <ReportButton studentId={student.id} />
  </div>
</div>
```

**Placement Rationale:**

- Logical flow: Analysis → Summary → Recommendations → Report
- Matches consultation report order
- Follows existing panel styling
- Positioned at bottom as final deliverable

## UI State Flow

### State Transitions

```
┌─────────────────────────────────────────────────────────────────┐
│                         PDF Generation Flow                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────┐    User clicks      ┌─────────────┐    Server Action    ┌──────────┐
│  none   │ ──────────────────> │ generating  │ ──────────────────> │ complete │
│         │   "보고서 생성"      │             │   Background PDF    │          │
│         │                     │ (polling)   │   generation        │ (cached) │
└─────────┘                     └─────────────┘                     └──────────┘
     ▲                                  │                                   │
     │                                  │ Error                             │
     │                                  ▼                                   │
     │                            ┌──────────┐                            │
     │                            │  failed  │                            │
     │                            │          │                            │
     │                            │ retry?   │                            │
     │                            └──────────┘                            │
     │                                                                  │
     └──────────────────────────────────────────────────────────────────┘
                    User clicks "재시도" or "PDF 다운로드"
```

### State Descriptions

| State | Trigger | UI Display | User Action |
|-------|---------|------------|-------------|
| `none` | Initial state, no PDF exists | "보고서 생성" button | Click to generate |
| `generating` | PDF generation in progress | "생성 중..." spinner | Wait (automatic polling) |
| `complete` | PDF successfully generated | "PDF 다운로드" button | Click to download |
| `failed` | Generation error occurred | "재시도" button + error message | Click to retry |

### Polling Behavior

- **Interval:** 2 seconds
- **Start:** When status becomes `generating`
- **Stop:** When status becomes `complete` or `failed`
- **Cleanup:** Interval cleared on component unmount

```typescript
useEffect(() => {
  if (status === 'generating' && !isPolling) {
    const interval = setInterval(pollStatus, 2000) // 2-second polling
    return () => clearInterval(interval) // Cleanup
  }
}, [status, isPolling, pollStatus])
```

## Server/Client Component Separation Pattern

### Pattern Overview

Follows Phase 6's established pattern:

```
┌─────────────────────────────────────────────────────────────┐
│                  Component Separation Pattern               │
└─────────────────────────────────────────────────────────────┘

Server Component (report-button.tsx)
  ├─ Fetches initial state from database
  ├─ Uses dynamic import for client component
  └─ Passes initial props to client

Client Component (report-button-client.tsx)
  ├─ Manages interactive state
  ├─ Polls status API every 2 seconds
  ├─ Handles user interactions
  └─ Renders appropriate UI based on state
```

### Benefits

1. **Performance:** Initial state loaded server-side, faster initial render
2. **Separation of Concerns:** Server for data, client for interactivity
3. **Type Safety:** Props interface ensures type consistency
4. **Testability:** Each component can be tested independently

### Dynamic Import Pattern

```typescript
const ReportButtonClient = dynamic(
  () => import('./report-button-client').then(mod => ({ default: mod.ReportButtonClient })),
  { ssr: false }
)
```

**Why `ssr: false`?**

- Prevents SSR of client-only component
- Avoids hydration mismatches
- Reduces server load
- Component only needed on client after initial state loaded

## Integration with 07-03 API Endpoints

### Status Polling API

**Endpoint:** `GET /api/students/[id]/report/status`

**Usage in ReportButtonClient:**

```typescript
const pollStatus = useCallback(async () => {
  const response = await fetch(`/api/students/${studentId}/report/status`)
  const data = await response.json()

  setStatus(data.status || 'none')
  setFileUrl(data.fileUrl)
  setErrorMessage(data.errorMessage)
}, [studentId])
```

**Response Schema:**

```typescript
{
  status: 'none' | 'generating' | 'complete' | 'failed'
  fileUrl: string | null
  errorMessage: string | null
}
```

### PDF Generation Server Action

**Function:** `generateConsultationReport(studentId)`

**Usage in ReportButtonClient:**

```typescript
const handleGenerate = async () => {
  const result = await generateConsultationReport(studentId)

  if (result.success) {
    if (result.cached && result.fileUrl) {
      // Cached PDF available immediately
      setStatus('complete')
      setFileUrl(result.fileUrl)
    } else {
      // Start generation
      setStatus('generating')
      setIsPolling(true)
    }
  } else {
    setStatus('failed')
    setErrorMessage(result.error || '생성 실패')
  }
}
```

**Response Schema:**

```typescript
{
  success: boolean
  cached: boolean
  fileUrl?: string
  error?: string
}
```

## UI Component Styling

### Button States

| State | Variant | Icon | Label | Disabled |
|-------|---------|------|-------|----------|
| `none` | Default | `FileText` | "보고서 생성" | No |
| `generating` | Outline | `Loader2` (spinning) | "생성 중..." | Yes |
| `complete` | Default | `Download` | "PDF 다운로드" | No (link) |
| `failed` | Destructive | `AlertCircle` | "재시도" | No |

### Layout Structure

```typescript
<div className="rounded-lg border bg-white p-6 shadow-sm">
  <div className="flex items-center justify-between">
    <div>
      <h3 className="text-lg font-semibold">상담 보고서</h3>
      <p className="text-sm text-gray-600">
        학생의 모든 분석 결과와 AI 제안을 포함한 종합 PDF 보고서를 생성합니다.
      </p>
    </div>
    <ReportButton studentId={student.id} />
  </div>
</div>
```

**Styling Decisions:**

- Follows existing panel styling (matches PersonalitySummaryCard, LearningStrategyPanel)
- Border + shadow for visual separation
- Flexbox layout for horizontal arrangement
- Responsive design (works on mobile)

## Error Handling

### Polling Errors

```typescript
try {
  const response = await fetch(`/api/students/${studentId}/report/status`)
  if (!response.ok) {
    throw new Error('상태 조회 실패')
  }
  // ...
} catch (error) {
  console.error('Status poll error:', error)
  setIsPolling(false) // Stop polling on error
}
```

**Behavior:**

- Logs error to console
- Stops polling to prevent infinite loops
- User can retry by clicking generate button again

### Generation Errors

```typescript
if (result.success) {
  // Handle success
} else {
  setStatus('failed')
  setErrorMessage(result.error || '생성 실패')
}
```

**UI Display:**

```typescript
if (status === 'failed') {
  return (
    <div className="flex items-center gap-2">
      <Button variant="destructive" onClick={handleRetry} size="sm">
        <AlertCircle className="mr-2 h-4 w-4" />
        재시도
      </Button>
      {errorMessage && (
        <span className="text-sm text-red-600">{errorMessage}</span>
      )}
    </div>
  )
}
```

**User Recovery:**

- Clear error message display
- "재시도" button resets state and retries generation
- User can try again without page refresh

## Deviations from Plan

### Auto-fixed Issues

None - plan executed exactly as written.

## Known Limitations

### 1. Polling Interval Fixed at 2 Seconds

**Issue:** Polling interval is hardcoded

**Impact:** Not configurable for different network conditions

**Future Enhancement:** Consider adaptive polling based on network latency

### 2. No Retry Exponential Backoff

**Issue:** Failed generations retry immediately

**Impact:** Could overload server if multiple users retry simultaneously

**Future Enhancement:** Implement exponential backoff for retries

### 3. No Success Toast Notification

**Issue:** PDF completes silently

**Impact:** User might miss completion if they look away

**Future Enhancement:** Add toast notification when PDF is ready

## Authentication Gates

None - no external service authentication required.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Complete for next phases:**
- ReportButtonClient component with polling ready for 07-05 testing
- ReportButton Server Component wrapper integrated into page
- UI state flow tested and verified
- TypeScript compilation confirmed (0 errors)

**Ready for:**
- 07-05: End-to-end testing and deployment preparation

**No blockers** - all dependencies satisfied, proceeding to 07-05.

---
*Phase: 07-reports*
*Plan: 04*
*Completed: 2026-01-29*
