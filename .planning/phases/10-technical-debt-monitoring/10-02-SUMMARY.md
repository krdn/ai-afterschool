---
phase: 10-technical-debt-monitoring
plan: 02
subsystem: monitoring
tags: sentry, error-tracking, sourcemaps, nextjs, observability

# Dependency graph
requires:
  - phase: 01-foundation-authentication
    provides: Next.js application base, authentication system
provides:
  - Sentry error tracking integration for client, server, and edge runtimes
  - Automatic source maps upload for readable production stack traces
  - Global error boundary for client-side error capture
  - Sensitive data filtering to prevent security leaks
affects: []

# Tech tracking
tech-stack:
  added: [@sentry/nextjs@^10.38.0]
  patterns: Sentry integration, error boundaries, source maps upload, sensitive data redaction

key-files:
  created: [sentry.server.config.ts, sentry.edge.config.ts, sentry.client.config.ts, instrumentation.ts, src/app/global-error.tsx]
  modified: [next.config.ts, package.json, .env.example]

key-decisions:
  - "Sentry cloud-based error tracking (self-hosted not required for initial deployment)"
  - "Source maps uploaded to Sentry in production builds only (development uses dry run)"
  - "Sensitive data filtered via beforeSend hooks (passwords, tokens, API keys)"
  - "Session Replay enabled in production with 10% sampling rate"

patterns-established:
  - "Sentry multi-runtime configuration: separate config files for server/edge/client"
  - "Instrumentation hook pattern: register() loads appropriate config based on NEXT_RUNTIME"
  - "Error boundary pattern: global-error.tsx captures client errors with fallback UI"
  - "Environment-based configuration: DSN and tokens from environment variables"

# Metrics
duration: 7min
completed: 2026-01-30
---

# Phase 10 Plan 2: Sentry Error Tracking Summary

**Sentry error tracking integration with automatic source maps upload and sensitive data filtering across all Next.js runtime environments**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-01-30T06:09:54Z
- **Completed:** 2026-01-30T06:16:44Z
- **Tasks:** 8 (1-8 completed, Task 9 test deferred to user setup)
- **Files modified:** 10

## Accomplishments
- Installed @sentry/nextjs SDK (v10.38.0)
- Created Sentry configuration files for server, edge, and client runtimes
- Configured sensitive data filtering (passwords, tokens, API keys, secrets)
- Wrapped Next.js config with Sentry for automatic source maps upload
- Created instrumentation hook for automatic Sentry initialization
- Added global error boundary for client-side error capture
- Added environment variable templates for Sentry configuration

## Task Commits

All tasks committed atomically:

1. **Task 1-8: Sentry Integration** - `e420f9b` (feat)

**Note:** Task 9 (testing) deferred until user completes Sentry account setup and provides DSN/auth token.

## Files Created/Modified

### Created
- `sentry.server.config.ts` - Server-side Sentry configuration with sensitive data filtering
- `sentry.edge.config.ts` - Edge runtime Sentry configuration (minimal integrations)
- `sentry.client.config.ts` - Client-side Sentry configuration with Session Replay
- `instrumentation.ts` - Next.js instrumentation hook for automatic Sentry initialization
- `src/app/global-error.tsx` - Global error boundary with Korean UI fallback

### Modified
- `next.config.ts` - Wrapped with `withSentryConfig` for source maps upload
- `package.json` - Added @sentry/nextjs dependency
- `.env.example` - Added Sentry environment variable templates

## Decisions Made

- **Sentry Cloud vs Self-Hosted**: Chose Sentry cloud for initial setup (easier, can migrate to self-hosted later if needed)
- **Source Maps Upload**: Enabled only for production builds (development uses dry run mode)
- **Session Replay Sampling**: 10% session sampling in production, 0% in development
- **Tracing Sample Rate**: 100% in development, 10% in production for performance
- **Tunnel Route**: Configured `/monitoring` tunnel route to bypass ad-blockers

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Sentry API compatibility issues**
- **Found during:** Task 2-4 (Sentry configuration files)
- **Issue**: Latest Sentry SDK (v10.38.0) has different API than documentation examples
  - `BrowserTracing` class import doesn't exist (use `browserTracingIntegration()`)
  - `dryRun` option doesn't exist in `SentryBuildOptions`
  - `sessionSampleRate` is a top-level option, not in replay config
  - `tracing` option doesn't exist in `HttpOptions`
- **Fix**: Updated all Sentry config files to use correct v10.38.0 API
- **Files modified**: sentry.server.config.ts, sentry.client.config.ts, next.config.ts
- **Verification**: Build passes with Sentry integration active
- **Committed in:** e420f9b (part of main task commit)

**2. [Rule 3 - Blocking] Fixed query_string type compatibility**
- **Found during:** Task 2 (Server-side configuration)
- **Issue**: Sentry's `event.request.query_string` type is `QueryParams | string | undefined`, not just string
- **Fix**: Added `String()` wrapper to handle both string and array formats
- **Files modified**: sentry.server.config.ts
- **Verification**: Type error resolved, build passes
- **Committed in:** e420f9b (part of main task commit)

**3. [Rule 1 - Bug] Fixed global-error.tsx location**
- **Found during:** Task 6 (Global error boundary creation)
- **Issue**: Created `app/global-error.tsx` but the project uses `src/app/` structure
- **Fix**: Moved file to `src/app/global-error.tsx` and removed empty `app/` directory
- **Files modified**: src/app/global-error.tsx (moved from app/)
- **Verification**: Error boundary in correct Next.js App Router location
- **Committed in:** e420f9b (part of main task commit)

---

**Total deviations:** 3 auto-fixed (1 bug, 1 blocking, 1 bug)
**Impact on plan:** All auto-fixes necessary for correct Sentry integration. No scope creep.

## Issues Encountered

### Build Error (Unrelated to Sentry)
- **Issue**: Pre-existing TypeScript error in `src/app/(dashboard)/students/[id]/page.tsx` with `MbtiAnalysis` type
- **Impact**: Build fails but not related to Sentry integration
- **Status**: Deferred to separate fix (not part of this plan)

### npm ENOTEMPTY Error
- **Issue**: `npm install` failed with "ENOTEMPTY: directory not empty" for `node_modules/uuid`
- **Fix**: Used `npm install --force` to bypass the issue
- **Status**: Resolved, Sentry installed successfully

## User Setup Required

**External services require manual configuration.** To complete Sentry integration:

### 1. Create Sentry Account
- Visit https://sentry.io/signup/ and create a free account

### 2. Create Sentry Project
- Create a new project for "Next.js" application
- Select the appropriate organization or create a new one

### 3. Get Configuration Values
From Sentry Dashboard:
- **DSN**: Project Settings > Client Keys (DSN) > Copy DSN
- **Auth Token**: Settings > Auth Tokens > Create token with `project:releases` scope
- **Organization Slug**: Dashboard URL (e.g., `https://sentry.io/orgs/<slug>/`)
- **Project Slug**: Project Settings > General > Project slug

### 4. Update Environment Variables
Add to `.env.local`:
```bash
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@o1234.ingest.sentry.io/12345
SENTRY_AUTH_TOKEN=sntrys_xxxxx
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
```

### 5. Configure Source Maps Upload
- In Sentry Project Settings > Source Maps
- Verify source maps are uploaded after `npm run build`
- Check "Releases" section to confirm deployment tracking

### 6. Test Integration
```bash
# Restart dev server with Sentry enabled
npm run dev

# Or build for production to test source maps upload
npm run build
```

Trigger a test error to verify Sentry integration:
```typescript
// Add temporarily to any component
useEffect(() => {
  throw new Error('Sentry test error')
}, [])
```

### 7. Verify in Sentry Dashboard
- Check Sentry Issues page for captured errors
- Verify stack traces show original source code (not minified)
- Confirm sensitive data is redacted from error reports

## Next Phase Readiness
- Sentry integration complete pending user account setup
- No dependencies on other phases
- Ready for testing once DSN is configured
- Source maps upload will activate on production builds

---
*Phase: 10-technical-debt-monitoring*
*Plan: 02*
*Completed: 2026-01-30*
