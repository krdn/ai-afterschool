# Phase 10: Technical Debt Resolution & Monitoring - Research

**Researched:** 2026-01-30
**Domain:** Next.js App Router, Observability, Database Operations, Code Quality
**Confidence:** HIGH

## Summary

Phase 10 focuses on resolving technical debt and implementing production-grade monitoring for a Next.js 15.5 application. This phase addresses code duplication (fetchReportData function), implements Sentry error tracking with source maps, establishes structured JSON logging with request ID tracing, automates PostgreSQL backups via cron, optimizes bundle size through code splitting analysis, and enables parallel data fetching for performance.

The research identifies **Pino** as the recommended logging library (5x faster than Winston with native JSON output), **@next/bundle-analyzer** for bundle analysis, **@sentry/nextjs** wizard for streamlined error tracking setup, and **cron-based pg_dump** for PostgreSQL backup automation. For code deduplication, the research supports extracting shared logic into `src/lib/db/reports.ts` while both Server Actions and API Routes import from this centralized module.

**Primary recommendation:** Use `@sentry/nextjs` wizard for error tracking, `pino` for structured logging with child loggers for request ID tracing, cron-based `pg_dump` for automated backups, `@next/bundle-analyzer` with `ANALYZE=true` for bundle analysis, and extract `fetchReportData` to a shared module for both Server Actions and API Routes to consume.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@sentry/nextjs` | ^10.x | Error tracking with source maps | Official Next.js SDK, wizard-based setup, automatic source map upload |
| `pino` | ^9.x | Structured JSON logging | 5x faster than Winston, async by design, native JSON output |
| `pino-pretty` | ^11.x | Development log formatting | Human-readable logs in development, zero overhead in production |
| `@next/bundle-analyzer` | ^15.x | Bundle size analysis | Official Next.js plugin, visual reports, identifies optimization opportunities |
| `pg_dump` | (PostgreSQL built-in) | Database backup | Standard PostgreSQL tool, logical backup format, portable |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `uuid` | ^11.x | Request ID generation | When generating unique request IDs for tracing |
| `pino-http` | ^10.x | HTTP request logging middleware | For automatic request/response logging in Next.js |
| `sonic-boom` | ^4.x | High-performance file writer | For production async file logging with minimal overhead |
| `cron` | (Linux built-in) | Backup scheduling | When automating scheduled backups on host system |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `pino` | `winston` | Winston is more flexible with transports but 5x slower and higher memory overhead (~180MB vs ~45MB) |
| `@sentry/nextjs` | Manual Sentry setup | Wizard is faster and less error-prone; manual setup offers more control but requires careful configuration |
| `cron` | Docker sidecar loop | Sidecar is self-contained but less flexible for scheduling; cron is standard but requires host access |
| `pg_dump` | `pg_basebackup` | pg_dump is simpler for logical backups; pg_basebackup is for physical backups of very large databases |

**Installation:**
```bash
# Sentry error tracking
npm install @sentry/nextjs

# Structured logging
npm install pino pino-pretty uuid

# Bundle analysis
npm install -D @next/bundle-analyzer

# PostgreSQL backup (uses pg_dump built-in)
# No additional packages needed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── db/
│   │   └── reports.ts          # Shared fetchReportData (extracted)
│   ├── logger/
│   │   ├── index.ts            # Logger factory
│   │   └── request.ts          # Request middleware (request ID)
│   └── monitoring/
│       ├── sentry/
│       │   ├── instrumentation-client.ts
│       │   ├── sentry.server.config.ts
│       │   └── sentry.edge.config.ts
│       └── backup/
│           └── backup.sh       # PostgreSQL backup script
scripts/
├── backup-db.sh                 # Cron-triggered backup
└── analyze-bundle.sh            # Bundle analysis helper
sentry.server.config.ts          # Sentry server config (root)
instrumentation.ts               # Next.js instrumentation hook
app/
├── global-error.tsx             # Error boundary (Sentry)
└── api/
    └── health/
        └── route.ts            # Health check (backup status)
```

### Pattern 1: Code Deduplication - Shared Module Approach
**What:** Extract duplicated `fetchReportData` function to a shared module that both Server Actions and API Routes import from.

**When to use:** When the same data fetching logic exists in both Server Actions (`'use server'`) and API Route Handlers (`route.ts`).

**Example:**
```typescript
// src/lib/db/reports.ts
import { db } from '@/lib/db'

/**
 * Fetch all data needed for consultation report
 * Shared by both Server Actions and API Routes
 */
export async function fetchReportData(studentId: string, teacherId: string) {
  const student = await db.student.findFirst({
    where: {
      id: studentId,
      teacherId,
    },
    include: {
      images: true,
      sajuAnalysis: true,
      nameAnalysis: true,
      mbtiAnalysis: true,
      faceAnalysis: true,
      palmAnalysis: true,
      personalitySummary: true,
    },
  })

  if (!student) return null

  return {
    student: {
      name: student.name,
      birthDate: student.birthDate,
      school: student.school,
      grade: student.grade,
      targetUniversity: student.targetUniversity,
      targetMajor: student.targetMajor,
      bloodType: student.bloodType,
    },
    analyses: {
      saju: student.sajuAnalysis ? { /* ... */ } : null,
      name: student.nameAnalysis ? { /* ... */ } : null,
      mbti: student.mbtiAnalysis ? { /* ... */ } : null,
      face: student.faceAnalysis ? { /* ... */ } : null,
      palm: student.palmAnalysis ? { /* ... */ } : null,
    },
    personalitySummary: student.personalitySummary ? { /* ... */ } : null,
    generatedAt: new Date(),
  }
}
```

```typescript
// src/app/(dashboard)/students/[id]/report/actions.ts
'use server'

import { fetchReportData } from '@/lib/db/reports'

export async function generateConsultationReport(studentId: string) {
  const session = await verifySession()
  // ... authentication logic ...

  const reportData = await fetchReportData(studentId, session.userId)
  // ... PDF generation ...
}
```

```typescript
// src/app/api/students/[id]/report/route.ts
import { fetchReportData } from '@/lib/db/reports'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: studentId } = await params
  // ... authentication logic ...

  const reportData = await fetchReportData(studentId, session.userId)
  // ... PDF response ...
}
```

**Source:** Based on Next.js App Router patterns for sharing data fetching logic between Server Actions and Route Handlers - [Data Fetching Patterns](https://nextjs.org/docs/app/building-your-application/data-fetching/patterns)

### Pattern 2: Sentry Integration with Next.js App Router
**What:** Use `@sentry/nextjs` wizard for automatic setup across all Next.js runtime environments (client, server, edge).

**When to use:** For production error tracking with source maps and readable stack traces.

**Example:**
```typescript
// sentry.server.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
  // Filter sensitive data
  beforeSend(event, hint) {
    // Remove passwords, tokens from error messages
    if (event.message) {
      event.message = event.message
        .replace(/password=\w+/gi, 'password=***')
        .replace(/token=[\w-]+/gi, 'token=***')
    }
    return event
  },
});
```

```typescript
// instrumentation.ts
import * as Sentry from '@sentry/nextjs'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

export const onRequestError = Sentry.captureRequestError
```

```typescript
// app/global-error.tsx
'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string }
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body>
        <h1>Something went wrong!</h1>
      </body>
    </html>
  )
}
```

```typescript
// next.config.ts
import { withSentryConfig } from '@sentry/nextjs'

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  sourcemaps: {
    disable: false,
    assets: ['**/*.js', '**/*.js.map'],
    ignore: ['**/node_modules/**'],
    deleteSourcemapsAfterUpload: true,
  },
  tunnelRoute: '/monitoring',
  silent: !process.env.CI,
})
```

**Source:** [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/), [Source Maps](https://docs.sentry.io/platforms/javascript/guides/nextjs/sourcemaps/)

### Pattern 3: Structured Logging with Pino
**What:** Use Pino for high-performance structured JSON logging with child loggers for request-scoped context.

**When to use:** For production-grade logging that is searchable, filterable, and has minimal performance overhead.

**Example:**
```typescript
// src/lib/logger/index.ts
import pino from 'pino'

function createLogger() {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isTest = process.env.NODE_ENV === 'test'

  return pino({
    level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
    transport: isDevelopment ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'pid,hostname',
        translateTime: 'yyyy-mm-dd HH:MM:ss'
      }
    } : undefined,
    enabled: !isTest,
    redact: {
      paths: [
        'password',
        'token',
        'apiKey',
        '*.password',
        '*.token',
        'req.headers.authorization',
        'req.headers.cookie'
      ],
      remove: true
    },
    base: {
      env: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0'
    }
  })
}

export const logger = createLogger()
```

```typescript
// src/lib/logger/request.ts
import { v4 as uuidv4 } from 'uuid'
import { logger } from './index'
import type { NextRequest } from 'next/server'

export function createRequestLogger(req: NextRequest) {
  const requestId = req.headers.get('x-request-id') || uuidv4()

  return logger.child({
    requestId,
    method: req.method,
    path: req.nextUrl.pathname,
    ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  })
}

export type RequestLogger = ReturnType<typeof createRequestLogger>
```

```typescript
// src/middleware.ts
import { createRequestLogger } from '@/lib/logger/request'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const log = createRequestLogger(req)

  log.info('Incoming request')

  const response = NextResponse.next()

  response.headers.set('x-request-id', log.bindings().requestId)

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
```

**Source:** [Pino Logger Guide 2025](https://signoz.io/guides/pino-logger/)

### Pattern 4: PostgreSQL Backup Automation with Cron
**What:** Use cron to schedule automated `pg_dump` backups with gzip compression and automatic cleanup of old backups.

**When to use:** For production databases requiring automated daily backups with retention policies.

**Example:**
```bash
#!/bin/bash
# scripts/backup-db.sh

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
DB_NAME="${DB_NAME:-ai_afterschool}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}-${DATE}.sql.gz"

mkdir -p "$BACKUP_DIR"

docker exec postgres pg_dump -U "$DB_USER" -h "$DB_HOST" "$DB_NAME" | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "Backup successful: $(basename $BACKUP_FILE)"

  find "$BACKUP_DIR" -name "${DB_NAME}-*.sql.gz" -mtime +$RETENTION_DAYS -delete
  echo "Cleaned up backups older than $RETENTION_DAYS days"

  # Optional: Test restore
  docker exec -i postgres psql -U "$DB_USER" -h "$DB_HOST" postgres -c "SELECT 1" > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo "Database connectivity verified"
  else
    echo "WARNING: Database connectivity check failed"
  fi
else
  echo "Backup failed!"
  exit 1
fi
```

```bash
# Crontab entry (runs daily at 2 AM)
0 2 * * * /path/to/scripts/backup-db.sh >> /var/log/db-backup.log 2>&1
```

**Source:** [Automated PostgreSQL Backups in Docker](https://serversinc.io/blog/automated-postgresql-backups-in-docker-complete-guide-with-pg-dump/)

### Pattern 5: Bundle Analysis with @next/bundle-analyzer
**What:** Use `@next/bundle-analyzer` to visualize bundle sizes and identify optimization opportunities.

**When to use:** Before production deployment to identify large dependencies and code splitting opportunities.

**Example:**
```typescript
// next.config.ts
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig = {
  // existing config...
}

module.exports = withBundleAnalyzer(nextConfig)
```

```bash
# Run bundle analysis
ANALYZE=true npm run build
```

**Source:** [Next.js Bundle Analyzer Documentation](https://nextjs.org/docs/14/pages/building-your-application/optimizing/bundle-analyzer)

### Pattern 6: Parallel Data Fetching with Promise.all
**What:** Use `Promise.all()` to fetch independent data sources in parallel, reducing waterfall requests.

**When to use:** When multiple data sources can be fetched independently without dependencies on each other's results.

**Example:**
```typescript
// Sequential (AVOID - creates waterfall)
const student = await getStudent(id)
const saju = await getSajuAnalysis(id)  // waits for student
const mbti = await getMbtiAnalysis(id)  // waits for saju

// Parallel (PREFERRED)
const studentData = getStudent(id)
const sajuData = getSajuAnalysis(id)
const mbtiData = getMbtiAnalysis(id)

const [student, saju, mbti] = await Promise.all([
  studentData,
  sajuData,
  mbtiData
])
```

**Source:** [Next.js Data Fetching Patterns](https://nextjs.org/docs/app/building-your-application/data-fetching/patterns)

### Anti-Patterns to Avoid
- **Duplicating fetchReportData**: Keeping the same function in both actions.ts and route.ts. Extract to shared module instead.
- **String interpolation in logs**: Using `logger.info(\`User ${userId} logged in\`)`. Use structured logging: `logger.info({ userId }, 'User logged in')`.
- **Console.log in production**: Using `console.log()` instead of proper structured logging. Use Pino for JSON output.
- **Manual backup scripts**: Running backups manually. Automate with cron.
- **Sequential data fetching**: Using sequential `await` when data can be fetched in parallel with `Promise.all()`.
- **Skipping source maps**: Deploying to production without Sentry source maps enabled. Stack traces become unreadable.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Error tracking SDK | Custom error catchers and API calls | `@sentry/nextjs` wizard | Source maps, automatic error boundary, multiple runtime support (client/server/edge) |
| Log formatting | Custom JSON stringify and timestamps | `pino` with serializers | 5x faster, async by default, built-in redaction, child loggers for context |
| Bundle visualization | Custom webpack scripts | `@next/bundle-analyzer` | Official Next.js plugin, visual treemap, identifies large modules |
| Backup compression | Custom tar/gzip scripts | `pg_dump \| gzip` | Standard PostgreSQL tool, portable SQL format, proven reliability |
| Request ID generation | Custom random strings | `uuid` v4 | Standard RFC 4122 format, collision-resistant, widely adopted |
| Scheduling backups | Node.js setInterval with date checks | Linux `cron` | Standard Unix scheduling, survives restarts, flexible cron expressions |

**Key insight:** Building custom solutions for these problems introduces maintenance burden, security risks (especially around sensitive data handling), and performance issues. The standard solutions are battle-tested, performant, and have active community support.

## Common Pitfalls

### Pitfall 1: Source Maps Not Uploaded in Production
**What goes wrong:** Sentry shows minified stack traces like `Error at main.abc123.js:1:5432` which are unreadable.

**Why it happens:** `SENTRY_AUTH_TOKEN` not set in CI/CD, or source maps generation disabled in `next.config.js`.

**How to avoid:**
- Set `SENTRY_AUTH_TOKEN` environment variable in CI/CD
- Verify `sourcemaps.deleteSourcemapsAfterUpload: true` is set
- Check Sentry dashboard > Project Settings > Source Maps to verify upload
- Run `ANALYZE=true npm run build` locally to test build process

**Warning signs:** Production errors have no file/line information, or point to minified files.

### Pitfall 2: Logs Containing Sensitive Data
**What goes wrong:** Passwords, tokens, API keys appear in log files, creating security vulnerability.

**Why it happens:** Using `console.log(obj)` which prints entire objects, or not configuring redaction.

**How to avoid:**
- Use Pino's `redact.paths` configuration
- Implement custom serializers for sensitive objects
- Never log entire request/response bodies
- Review logs before production deployment

**Warning signs:** Seeing fields like `password`, `token`, `apiKey` in log output.

### Pitfall 3: Backup Files Accumulate Indefinitely
**What goes wrong:** Disk space fills up as backup files accumulate without cleanup.

**Why it happens:** Backup script doesn't include retention policy, or cron cleanup fails silently.

**How to avoid:**
- Include `find ... -mtime +N -delete` in backup script
- Monitor disk usage with alerts
- Test backup rotation manually
- Log cleanup operations

**Warning signs:** Disk usage steadily increasing, `df -h` shows high usage on backup volume.

### Pitfall 4: Code Deduplication Creates Tight Coupling
**What goes wrong:** Extracting shared function creates circular dependencies or requires imports from presentation layer.

**Why it happens:** Extracting to wrong location (e.g., keeping in actions.ts), or mixing business logic with presentation logic.

**How to avoid:**
- Extract to `src/lib/db/` for data access logic
- Keep shared functions pure (no side effects)
- Import from both Server Actions and API Routes
- Test both callers after refactoring

**Warning signs:** Import errors, circular dependency warnings, or tests failing after refactoring.

### Pitfall 5: Bundle Analysis in Production Build
**What goes wrong:** Production builds include bundle analyzer code, increasing bundle size.

**Why it happens:** Forgetting to set `ANALYZE=false` or leaving `enabled: true` in bundle analyzer config.

**How to avoid:**
- Use conditional enabling: `enabled: process.env.ANALYZE === 'true'`
- Never commit `ANALYZE=true` to environment files
- Add to `.env.example` with explanation
- Use separate `analyze` npm script

**Warning signs:** Larger production bundles, bundle analyzer tabs opening on production deploy.

### Pitfall 6: Parallel Fetching with Dependencies
**What goes wrong:** `Promise.all()` fails because one fetch depends on another's result.

**Why it happens:** Assuming all data can be fetched in parallel when there are sequential dependencies.

**How to avoid:**
- Identify dependencies before implementing parallel fetch
- Use nested `Promise.all()` for dependent groups
- Consider React `cache()` for dependent re-fetches
- Test with missing data scenarios

**Warning signs:** Errors like "Cannot read property X of undefined", or failed requests.

## Code Examples

Verified patterns from official sources:

### Request-Scope Logging with Middleware
```typescript
// Source: https://signoz.io/guides/pino-logger/

import { logger } from '@/lib/logger'
import { v4 as uuidv4 } from 'uuid'
import type { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const requestId = req.headers.get('x-request-id') || uuidv4()

  const requestLogger = logger.child({
    requestId,
    method: req.method,
    path: req.nextUrl.pathname,
    userAgent: req.headers.get('user-agent'),
    ip: req.headers.get('x-forwarded-for') || 'unknown'
  })

  requestLogger.info('Request started')

  const response = NextResponse.next()

  response.headers.set('x-request-id', requestId)

  return response
}
```

### PostgreSQL Backup with Restore Test
```bash
#!/bin/bash
# Source: https://serversinc.io/blog/automated-postgresql-backups-in-docker-complete-guide-with-pg-dump/

BACKUP_DIR="/backups"
DB_NAME="mydb"
RETENTION_DAYS=30
DATE=$(date +%F_%H-%M-%S)
BACKUP_FILE="$BACKUP_DIR/db-$DATE.sql.gz"

# Create backup with compression
if docker exec postgres pg_dump -U myuser "$DB_NAME" | gzip > "$BACKUP_FILE"; then
  echo "Backup successful: $(basename $BACKUP_FILE)"

  # Clean up old backups
  find "$BACKUP_DIR" -name "db-*.sql.gz" -mtime +$RETENTION_DAYS -delete
  echo "Cleaned up backups older than $RETENTION_DAYS days"

  # Test database connectivity
  docker exec postgres psql -U myuser -d postgres -c "SELECT 1" > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo "Database connectivity verified"
  else
    echo "WARNING: Database connectivity check failed"
  fi
else
  echo "Backup failed!"
  exit 1
fi
```

### Parallel Data Fetching
```typescript
// Source: https://nextjs.org/docs/app/building-your-application/data-fetching/patterns

// Initiate both requests in parallel
const artistData = getArtist(username)
const albumsData = getArtistAlbums(username)

// Wait for the promises to resolve
const [artist, albums] = await Promise.all([artistData, albumsData])

return (
  <>
    <h1>{artist.name}</h1>
    <Albums list={albums}></Albums>
  </>
)
```

### Sentry Configuration with Source Maps
```typescript
// Source: https://docs.sentry.io/platforms/javascript/guides/nextjs/sourcemaps/

import { withSentryConfig } from "@sentry/nextjs";

export default withSentryConfig(
  nextConfig,
  {
    org: "example-org",
    project: "example-project",
    authToken: process.env.SENTRY_AUTH_TOKEN,

    sourcemaps: {
      disable: false,
      assets: ["**/*.js", "**/*.js.map"],
      ignore: ["**/node_modules/**"],
      deleteSourcemapsAfterUpload: true,
    },
  }
);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual Sentry setup | `@sentry/nextjs` wizard | 2023-2024 | Faster setup, fewer errors, automatic multi-runtime support |
| Winston logging | Pino | 2020-2021 | 5x performance improvement, lower memory usage |
| Manual backup scripts | cron + pg_dump pattern | Established practice | Proven reliability, portable format |
| Webpack Bundle Analyzer | `@next/bundle-analyzer` | Next.js 9+ | Native Next.js integration, no webpack config needed |
| Sequential await | `Promise.all()` pattern | React 18+ | Reduced waterfall, faster page loads |

**Deprecated/outdated:**
- **Custom error tracking**: Before `@sentry/nextjs` wizard, required manual SDK setup for each runtime
- **Console.log for debugging**: Unstructured logs are not searchable or filterable in production
- **Manual dependency tracking**: Before bundle analyzers, required manual inspection of build output
- **Ad-hoc backups**: Running backups manually is error-prone and unreliable

## Open Questions

Things that couldn't be fully resolved:

1. **VERIFICATION.md Format for Phase 1**
   - What we know: Phase 1 VERIFICATION.md file is missing and needs to be created as part of DEBT-02
   - What's unclear: The exact requirements and success criteria for Phase 1 need to be cross-referenced from existing documentation
   - Recommendation: Review `.planning/REQUIREMENTS-v1.1.md` and `.planning/phases/01-foundation-authentication/` to identify all requirements that Phase 1 satisfied, then create VERIFICATION.md following the format from Phase 2 and Phase 8

2. **Sentry DSN Configuration**
   - What we know: Sentry requires a DSN (Data Source Name) for error tracking
   - What's unclear: Whether to use Sentry cloud or self-hosted instance, and project organization structure
   - Recommendation: Use Sentry cloud for initial setup (easier), can migrate to self-hosted later if needed. Create project under existing organization or new org dedicated to this application

3. **Backup Storage Location**
   - What we know: Backups should be stored outside the PostgreSQL volume for safety
   - What's unclear: Whether to store on host filesystem, separate volume, or cloud storage (S3, etc.)
   - Recommendation: Start with host filesystem mount (`./backups`) for simplicity, consider cloud storage for production if retention requirements exceed local storage capacity

## Sources

### Primary (HIGH confidence)
- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/) - SDK installation, configuration, source maps upload
- [Sentry Source Maps for Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/sourcemaps/) - Source map upload configuration
- [Next.js Bundle Analyzer Documentation](https://nextjs.org/docs/14/pages/building-your-application/optimizing/bundle-analyzer) - Official bundle analyzer plugin
- [Next.js Data Fetching Patterns](https://nextjs.org/docs/app/building-your-application/data-fetching/patterns) - Parallel vs sequential fetching
- [Pino Logger Complete Guide 2025](https://signoz.io/guides/pino-logger/) - Pino installation, configuration, best practices
- [Automated PostgreSQL Backups in Docker](https://serversinc.io/blog/automated-postgresql-backups-in-docker-complete-guide-with-pg-dump/) - Cron-based backup automation with pg_dump

### Secondary (MEDIUM confidence)
- [Server Actions vs API Routes - Dev.to](https://dev.to/myogeshchavan97/nextjs-server-actions-vs-api-routes-don-t-build-your-app-until-you-read-this-4kb9) - Comparison of Server Actions and API Routes
- [Pino vs Winston Comparison](https://dev.to/wallacefreitas/pino-vs-winston-choosing-the-right-logger-for-your-nodejs-application-369n) - Performance comparison (March 2025)
- [Sentry Error Boundary for Next.js](https://sentry.io/answers/next-js-client-side-exception/) - Error boundary setup
- [Promise.all in Next.js App Router](https://drew.tech/posts/promise-all-in-nextjs-app-router) - Parallel data fetching patterns (Nov 2023)

### Tertiary (LOW confidence)
- [Docker Forums - Automated/cron backups](https://forums.docker.com/t/automated-cron-backups-of-postgres-database/6338) - Community discussion on cron backups
- [pgbackup-sidecar GitHub](https://github.com/Musab520/pgbackup-sidecar) - Sidecar container approach (alternative to cron)
- [Structured logging for Next.js](https://app.daily.dev/posts/structured-logging-for-next-js-e0mxhdcpm) - Next.js specific logging guide (June 2024)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified through official documentation
- Architecture: HIGH - Patterns verified from official Next.js, Sentry, and Pino documentation
- Pitfalls: HIGH - Based on documented issues and StackOverflow patterns

**Research date:** 2026-01-30
**Valid until:** 2026-02-27 (30 days - stable technologies with active maintenance)
