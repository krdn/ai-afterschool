# Phase 09: Performance & Database Optimization - Research

**Researched:** 2026-01-30
**Domain:** Database performance optimization, connection pooling, query optimization, image optimization
**Confidence:** HIGH

## Summary

This phase focuses on production-scale performance optimization through database query optimization, connection pooling, and image optimization. The application already uses Prisma ORM with PostgreSQL and Cloudinary for image storage, which provides a solid foundation for optimization.

The research identifies five key areas:

1. **Database Migration Automation**: Using `prisma migrate deploy` for safe, automated production migrations
2. **Connection Pooling**: Implementing Prisma singleton pattern with `@prisma/adapter-pg` and connection limits
3. **Query Optimization**: Resolving N+1 query patterns using Prisma's `include` for relation loading
4. **Database Indexing**: Adding strategic indexes based on actual query patterns (not premature optimization)
5. **Image Optimization**: Leveraging Next.js Image component with Cloudinary's automatic optimization

The current codebase already has:
- Basic Prisma setup with custom adapter (`@prisma/adapter-pg`)
- Singleton pattern implementation in `/src/lib/db.ts`
- Cloudinary integration via `next-cloudinary`
- Basic database indexes (`teacherId`, `name`, `school`)

**Primary recommendation:** Implement connection pooling configuration, add `prisma migrate deploy` to deployment workflow, enable query logging to identify N+1 patterns, and use Next.js Image component for all Cloudinary images.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **Prisma** | 7.3.0 | ORM and migrations | Production-grade TypeScript ORM with excellent query optimization features |
| **@prisma/adapter-pg** | 7.3.0 | PostgreSQL connection pooling adapter | Official Prisma adapter for PostgreSQL with connection pool management |
| **pg** | 8.17.2 | PostgreSQL driver | Underlying driver used by Prisma adapter |
| **next-cloudinary** | 6.17.5 | Next.js integration for Cloudinary | Provides `CldImage` component with automatic optimization |
| **Next.js Image** | 15.5.10 | Built-in image optimization | Automatic WebP/AVIF conversion, responsive sizing, lazy loading |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **sharp** | 0.34.5 | Image processing (already installed) | Already a dependency, used by Next.js Image optimization |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| **prisma migrate deploy** | Manual migration execution | Manual is error-prone and doesn't scale; `migrate deploy` is production standard |
| **include** | select/relation loading strategy | `include` is simpler and sufficient for this scale; `select` for specific field needs |
| **Next.js Image** | raw img tags | Next.js Image provides automatic optimization; img tags require manual optimization |
| **Cloudinary** | Self-hosted image optimization | Cloudinary provides CDN + optimization already integrated |

**Installation:**
All required dependencies are already installed. No new packages needed.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── db.ts                    # Existing: Prisma singleton
│   ├── db/
│   │   ├── student-analysis.ts  # Existing: Analysis queries
│   │   └── reports.ts           # NEW: Deduplicated report queries
│   └── cloudinary.ts            # Existing: Cloudinary utilities
├── components/
│   └── students/
│       └── student-image-uploader.tsx  # UPDATE: Use CldImage
└── app/
    ├── api/
    │   └── health/
    │       └── route.ts         # UPDATE: Add connection pool metrics
    └── (dashboard)/
        └── students/
            ├── page.tsx         # VERIFY: No N+1 queries
            └── [id]/
                └── page.tsx     # VERIFY: Proper include usage
prisma/
├── schema.prisma                # UPDATE: Add indexes
└── migrations/                  # EXISTING: Migration files
```

### Pattern 1: Prisma Connection Pooling with Singleton

**What:** Singleton pattern ensures one PrismaClient instance per application lifecycle, with connection pooling via pg Pool.

**When to use:** Always in production, especially with Next.js serverless/edge functions that could create multiple instances.

**Example:**
```typescript
// Source: https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/instantiate-prisma-client
// Current implementation in src/lib/db.ts
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set")
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: Pool | undefined
}

// Create connection pool with max 10 connections (per CONTEXT.md decision)
const pool = globalForPrisma.pool ?? new Pool({
  connectionString: databaseUrl,
  max: 10, // Maximum pool size
  idleTimeoutMillis: 30000, // 30 seconds
  connectionTimeoutMillis: 2000, // 2 seconds
})

const adapter = new PrismaPg(pool)

export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db
  globalForPrisma.pool = pool
}
```

**Key configuration:**
- `max: 10` - Maximum connections per CONTEXT.md decision
- `idleTimeoutMillis` - Close idle connections after 30 seconds
- `connectionTimeoutMillis` - Wait 2 seconds for connection

### Pattern 2: Query Logging for N+1 Detection

**What:** Enable Prisma query logging to identify repeated queries (N+1 pattern).

**When to use:** During development and testing to identify optimization opportunities.

**Example:**
```typescript
// Source: https://www.prisma.io/docs/orm/prisma-client/observability-and-logging/logging
// Updated src/lib/db.ts with logging

import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
})

const adapter = new PrismaPg(pool)

export const db = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === "development"
    ? ['query', 'error', 'warn']
    : ['error'], // Only log errors in production
})
```

**Detection pattern:**
1. Enable query logging in development
2. Monitor console for repeated similar queries
3. Identify loops that trigger queries
4. Replace with `include` or `select` patterns

### Pattern 3: N+1 Query Resolution with `include`

**What:** Load related data in single query using `include` instead of separate queries.

**When to use:** Whenever accessing related records (analysis results, images, etc.)

**Example - BEFORE (N+1 pattern):**
```typescript
// BAD: N+1 query - fetches student images separately
const students = await db.student.findMany({
  where: { teacherId: session.userId },
})

// Then for each student, fetch images (N queries)
for (const student of students) {
  const images = await db.studentImage.findMany({
    where: { studentId: student.id },
  })
}
```

**Example - AFTER (Optimized):**
```typescript
// GOOD: Single query with include
const students = await db.student.findMany({
  where: { teacherId: session.userId },
  include: {
    images: true, // Loads images in same query
  },
})
```

**Current codebase status:**
- `/src/lib/db/personality-summary.ts` - ✅ Correctly uses `include` for all 5 analysis relations
- `/src/lib/db/student-analysis.ts` - ✅ Correctly uses `include` for saju/name analysis
- `/src/app/(dashboard)/students/page.tsx` - ✅ Uses `select` (no relations, OK)

### Pattern 4: Database Index Strategy

**What:** Add indexes to columns frequently used in WHERE, ORDER BY, and JOIN clauses.

**When to use:** After identifying slow queries via EXPLAIN ANALYZE, not preemptively.

**Example - Schema Indexes:**
```prisma
// prisma/schema.prisma
model Student {
  // ... existing fields

  // Existing indexes (good!)
  @@index([teacherId])
  @@index([name])
  @@index([school])

  // NEW: Composite indexes for common query patterns
  @@index([teacherId, name])        // For "WHERE teacherId = ? AND name LIKE ?"
  @@index([teacherId, school])      // For filtering by school within teacher
  @@index([expiresAt])              // For identifying expired student records
  @@index([calculationRecalculationNeeded]) // For students needing recalculation
}

model StudentImage {
  // ... existing fields

  // NEW: For querying images by student
  @@index([studentId])  // Already exists, verify it's being used
}

model ReportPDF {
  // ... existing fields

  // NEW: For PDF generation status queries
  @@index([status])  // For finding pending/failed generations
  @@index([studentId])  // Already exists
}
```

**Verification approach:**
```sql
-- Run EXPLAIN ANALYZE to verify index usage
EXPLAIN ANALYZE
SELECT * FROM "Student" WHERE "teacherId" = '...' AND "name" LIKE '...%';

-- Look for "Index Scan" (good) vs "Seq Scan" (bad)
```

**Per CONTEXT.md decision:** Only add indexes for actually slow queries, not preemptively.

### Pattern 5: Next.js Image + Cloudinary Optimization

**What:** Use Next.js Image component with Cloudinary URLs for automatic WebP/AVIF conversion and responsive sizing.

**When to use:** For all student photos and analysis images.

**Example - Current (uses img tag):**
```tsx
// Current implementation in student-image-uploader.tsx
<img
  src={previewUrl}
  alt={`${label} 미리보기`}
  className="h-32 w-32 rounded-md object-cover"
/>
```

**Example - Optimized (use CldImage):**
```tsx
// Source: https://next.cloudinary.dev/guides/image-optimization
import { CldImage } from 'next-cloudinary'

<CldImage
  width={512}
  height={512}
  src={publicId}
  sizes="100vw"
  alt={`${label} 미리보기`}
  className="h-32 w-32 rounded-md object-cover"
  // Automatic WebP/AVIF conversion
  // Responsive sizing
  // Lazy loading
/>
```

**Key benefits:**
- Automatic format selection (WebP, AVIF based on browser support)
- Responsive sizing with `sizes` prop
- Built-in lazy loading
- Cloudinary CDN delivery

### Pattern 6: Database Migration Automation

**What:** Use `prisma migrate deploy` to apply pending migrations in production.

**When to use:** As part of CI/CD pipeline before starting application.

**Example - Deployment Workflow:**
```bash
# Source: https://www.prisma.io/docs/orm/prisma-client/deployment/deploy-database-changes-with-prisma-migrate

# In production deployment script:
npx prisma generate        # Generate Prisma Client
npx prisma migrate deploy  # Apply pending migrations

# Then start application:
npm start
```

**Per CONTEXT.md decisions:**
- Deploy runs `prisma migrate deploy` automatically
- Migration failure triggers immediate rollback
- Short downtime acceptable (stop app, migrate, restart app)

### Anti-Patterns to Avoid

- **Multiple PrismaClient instances:** Creates multiple connection pools, exhausts database connections
  - Instead: Use singleton pattern (already implemented)

- **Separate queries in loops:** Classic N+1 pattern
  - Instead: Use `include` to load relations in single query

- **Premature indexing:** Adding indexes without measuring query performance
  - Instead: Use EXPLAIN ANALYZE, add indexes only for slow queries

- **Manual image optimization:** Converting images manually or using complex build scripts
  - Instead: Let Next.js Image + Cloudinary handle optimization automatically

- **Using `findMany` + manual filtering:** Filtering in code instead of database
  - Instead: Use `where` clause to let database filter

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| **Connection pooling** | Custom connection management | Prisma adapter with pg Pool | Handles connection lifecycle, timeouts, retries |
| **Image format conversion** | Manual sharp/webp conversion | Next.js Image + Cloudinary | Automatic format selection per browser, CDN delivery |
| **Query result caching** | Custom in-memory cache | Prisma built-in query caching or Redis | Prisma caches prepared statements; Redis for application-level caching |
| **Migration versioning** | Custom migration tracking | Prisma migrations folder | Automatic version tracking, rollback support |
| **N+1 query detection** | Custom query counters | Prisma query logging | Built-in logging shows all executed queries |

**Key insight:** Prisma and Next.js already solve most performance problems. Focus on configuration and proper usage, not building custom solutions.

## Common Pitfalls

### Pitfall 1: Connection Pool Exhaustion

**What goes wrong:** Multiple PrismaClient instances create multiple connection pools, each with default size (num_physical_cpus * 2 + 1). With 10 CPUs = 21 connections per instance × multiple instances = database connection limit exceeded.

**Why it happens:** Next.js hot-reloading in development creates new instances on each file change. Without singleton pattern, each module import creates new PrismaClient.

**How to avoid:**
```typescript
// CORRECT: Singleton pattern (already implemented in src/lib/db.ts)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: Pool | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db
  globalForPrisma.pool = pool
}
```

**Warning signs:**
- Error: "FATAL: sorry, too many clients already"
- Slow database queries under load
- Database connection limit warnings

### Pitfall 2: N+1 Queries in Student List

**What goes wrong:** Fetching list of students, then separately fetching related data (images, analyses) for each student. With 50 students, this becomes 51 queries instead of 1-2.

**Why it happens:** Developer loads students first, then iterates to fetch related data.

**How to avoid:**
```typescript
// BAD: N+1 pattern
const students = await db.student.findMany({
  where: { teacherId },
})
for (const student of students) {
  student.images = await db.studentImage.findMany({
    where: { studentId: student.id },
  })
}

// GOOD: Single query with include
const students = await db.student.findMany({
  where: { teacherId },
  include: {
    images: true,
    sajuAnalysis: true,
    nameAnalysis: true,
    // ... other relations
  },
})
```

**Warning signs:**
- Page load time increases with student count
- Database logs show many similar queries
- Prisma query logging shows repeated SELECT statements

**Detection:**
```typescript
// Enable query logging in development
const db = new PrismaClient({
  log: ['query'], // Shows all queries in console
})

// Look for patterns like:
// SELECT * FROM "Student" WHERE ...
// SELECT * FROM "StudentImage" WHERE ...
// SELECT * FROM "StudentImage" WHERE ...
// (repeated many times)
```

### Pitfall 3: Missing Indexes on Frequently Queried Columns

**What goes wrong:** Queries on unindexed columns perform full table scans (sequential scan), becoming slower as data grows.

**Why it happens:** Default Prisma schema only indexes foreign keys and unique constraints. Common query patterns aren't automatically indexed.

**How to avoid:**
```prisma
// Add indexes for common query patterns
model Student {
  // ... fields

  @@index([teacherId, name])        // For "WHERE teacherId = ? AND name LIKE ?"
  @@index([teacherId, school])      // For filtering by school
  @@index([expiresAt])              // For finding expired records
}
```

**Verification:**
```sql
-- Check query plan
EXPLAIN ANALYZE SELECT * FROM "Student" WHERE "teacherId" = 'xxx';

-- Good: "Index Scan using Student_teacherId_idx"
-- Bad: "Seq Scan on Student" (full table scan)
```

**Warning signs:**
- Query time increases with data volume
- EXPLAIN ANALYZE shows "Seq Scan" on large tables
- CPU usage high during queries

### Pitfall 4: Unoptimized Image Delivery

**What goes wrong:** Serving full-resolution images (2-5MB) when thumbnails (50-200KB) would suffice. Slow page loads, high bandwidth usage.

**Why it happens:** Using `<img>` tags with direct Cloudinary URLs doesn't leverage optimization.

**How to avoid:**
```tsx
// BAD: Unoptimized image
<img src="https://res.cloudinary.com/.../student.jpg" alt="Student" />

// GOOD: Optimized with Next.js Image
import { CldImage } from 'next-cloudinary'

<CldImage
  src="student"
  width={400}
  height={400}
  sizes="(max-width: 768px) 100vw, 400px"
  alt="Student"
  // Automatically: WebP/AVIF, responsive, lazy-loaded
/>
```

**Warning signs:**
- Large image file sizes in network tab (>500KB)
- Images load slowly on mobile
- Layout shift during image load

### Pitfall 5: Migration Failures in Production

**What goes wrong:** Migration fails mid-deployment, leaving database in inconsistent state. Application starts with mismatched schema.

**Why it happens:** Running migrations manually or without proper error handling.

**How to avoid:**
```bash
# In deployment script:
#!/bin/bash
set -e  # Exit on any error

echo "Running database migrations..."
npx prisma migrate deploy || {
  echo "Migration failed! Rolling back..."
  exit 1  # Deployment fails, triggers rollback
}

echo "Migrations successful. Starting application..."
npm start
```

**Per CONTEXT.md:** Migration failure triggers immediate rollback.

## Code Examples

Verified patterns from official sources:

### Database Connection Pool Configuration

```typescript
// Source: https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/instantiate-prisma-client
// Current implementation: /mnt/data/projects/ai/ai-afterschool/src/lib/db.ts

import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set")
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: Pool | undefined
}

// UPDATE: Add explicit connection pool configuration
const pool = globalForPrisma.pool ?? new Pool({
  connectionString: databaseUrl,
  max: 10, // CONTEXT.md decision: max 10 connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

const adapter = new PrismaPg(pool)

export const db = globalForPrisma.prisma ?? new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === "development"
    ? ['query', 'error', 'warn']
    : ['error'],
})

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db
  globalForPrisma.pool = pool
}
```

### N+1 Query Resolution

```typescript
// Source: https://www.prisma.io/docs/orm/prisma-client/queries/relation-queries
// Current implementation: /mnt/data/projects/ai/ai-afterschool/src/lib/db/personality-summary.ts

// GOOD: Already correctly implemented
export async function getUnifiedPersonalityData(
  studentId: string,
  teacherId: string
): Promise<UnifiedPersonalityData | null> {
  const student = await db.student.findFirst({
    where: {
      id: studentId,
      teacherId,
    },
    include: {
      sajuAnalysis: true,      // Loads in same query
      nameAnalysis: true,      // Loads in same query
      mbtiAnalysis: true,      // Loads in same query
      faceAnalysis: true,      // Loads in same query
      palmAnalysis: true,      // Loads in same query
    },
  })

  if (!student) return null

  return {
    saju: {
      result: student.sajuAnalysis?.result ?? null,
      calculatedAt: student.sajuAnalysis?.calculatedAt ?? null,
      interpretation: student.sajuAnalysis?.interpretation ?? null,
    },
    // ... rest of mapping
  }
}
```

### Next.js Image with Cloudinary

```typescript
// Source: https://next.cloudinary.dev/guides/image-optimization
// UPDATE for: /mnt/data/projects/ai/ai-afterschool/src/components/students/student-image-uploader.tsx

import { CldImage } from 'next-cloudinary'

// REPLACE current img usage:
{previewUrl ? (
  <div className="rounded-md border border-gray-100 bg-white p-2">
    <CldImage
      width={128}  // h-32 = 128px
      height={128} // w-32 = 128px
      src={publicId}  // Use publicId instead of URL
      sizes="128px"
      alt={`${label} 미리보기`}
      className="rounded-md object-cover"
      crop="fill"
      gravity="auto"
    />
  </div>
) : null}
```

### Database Indexes

```prisma
// Source: https://www.prisma.io/docs/orm/reference/prisma-schema-reference
// UPDATE for: /mnt/data/projects/ai/ai-afterschool/prisma/schema.prisma

model Student {
  // ... existing fields

  // Existing (keep these)
  @@index([teacherId])
  @@index([name])
  @@index([school])

  // NEW: Add composite indexes for common patterns
  @@index([teacherId, name])        // For student search within teacher
  @@index([teacherId, school])      // For filtering by school
  @@index([expiresAt])              // For cleanup jobs
  @@index([calculationRecalculationNeeded]) // For recalculation queue
}

model ReportPDF {
  // ... existing fields

  // NEW: For PDF generation status monitoring
  @@index([status])  // For finding "generating" or "failed" reports
  @@index([studentId])  // Already exists
}
```

### Migration Deployment Script

```bash
# Source: https://www.prisma.io/docs/orm/prisma-client/deployment/deploy-database-changes-with-prisma-migrate
# CREATE: scripts/deploy.sh

#!/bin/bash
set -e  # Exit on error

echo "🚀 Starting deployment..."

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate

# Run database migrations
echo "🗄️  Running database migrations..."
npx prisma migrate deploy || {
  echo "❌ Migration failed! Aborting deployment."
  exit 1
}

# Build application
echo "🔨 Building application..."
npm run build

# Start application
echo "✅ Starting application..."
npm start
```

### Query Performance Verification

```sql
-- Source: https://www.prisma.io/docs/orm/prisma-client/queries/query-optimization-performance
-- USAGE: Run in psql or Prisma Studio to verify index usage

-- Check if index is being used for student queries
EXPLAIN ANALYZE
SELECT * FROM "Student"
WHERE "teacherId" = 'teacher_123'
AND "name" LIKE '김%';

-- GOOD OUTPUT:
-- Index Scan using Student_teacherId_name_idx on Student (cost=0.00..10.00 rows=10)

-- BAD OUTPUT:
-- Seq Scan on Student (cost=0.00..1000.00 rows=1000)
-- → Indicates index is missing or not being used
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| **Manual migrations** | `prisma migrate deploy` automation | Prisma 2.0+ | Safer deployments, no manual intervention |
| **Separate queries for relations** | `include` for eager loading | Prisma 2.0+ | Eliminates N+1 queries |
| **Query strategy for relations** | Join strategy (LATERAL JOIN) default | Prisma 5.8.0+ (Preview) | Better performance for most relation queries |
| **Manual image optimization** | Next.js Image + Cloudinary auto-optimization | Next.js 13+ | Automatic WebP/AVIF, responsive sizing |
| **Unlimited connection pools** | Configured connection limits (max: 10) | Always recommended | Prevents connection pool exhaustion |

**Deprecated/outdated:**
- **Multiple PrismaClient instances**: Causes connection pool exhaustion - use singleton pattern
- **`prisma migrate dev` in production**: Unsafe - use `prisma migrate deploy` instead
- **Prisma 1.x separate relation queries**: Resolved with `include` in Prisma 2.0+
- **Manual WebP conversion**: Next.js Image handles this automatically since v13

## Open Questions

1. **Query Load Strategy for Relations**
   - What we know: Prisma 5.8.0+ supports `relationLoadStrategy: 'join'` (Preview) using LATERAL JOIN
   - What's unclear: Whether to enable preview feature flag for this codebase
   - Recommendation: Use default query strategy (join will be default when GA). Enable preview flag only if EXPLAIN ANALYZE shows significant benefit.

2. **Connection Pool Monitoring**
   - What we know: Pool has `max: 10` per CONTEXT.md
   - What's unclear: How to monitor pool usage in production
   - Recommendation: Add health check endpoint that reports pool stats from `pool.totalCount` and `pool.idleCount`

3. **Image Thumbnail Strategy**
   - What we know: CONTEXT.md says "separate thumbnail/original"
   - What's unclear: Specific thumbnail sizes to generate
   - Recommendation: Use `CldImage` with responsive sizing instead of pre-generating thumbnails. Cloudinary handles on-demand resizing.

4. **Index Verification Timeline**
   - What we know: Should use EXPLAIN ANALYZE before adding indexes
   - What's unclear: When to run verification (before deployment? after?)
   - Recommendation: Run EXPLAIN ANALYZE on production-like staging data before adding indexes.

## Sources

### Primary (HIGH confidence)
- [Prisma Migrate Deploy Documentation](https://www.prisma.io/docs/orm/prisma-client/deployment/deploy-database-changes-with-prisma-migrate) - Official guide on `migrate deploy` for production
- [Instantiating Prisma Client](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/instantiate-prisma-client) - Connection pool management and singleton pattern
- [Prisma Relation Queries](https://www.prisma.io/docs/orm/prisma-client/queries/relation-queries) - Using `include` for N+1 prevention, relation load strategies
- [Next Cloudinary Image Optimization](https://next.cloudinary.dev/guides/image-optimization) - CldImage component with automatic WebP/AVIF
- [Query Optimization with Prisma](https://www.prisma.io/docs/orm/prisma-client/queries/query-optimization-performance) - Debugging and optimizing query performance
- [Prisma Connection Pooling](https://www.prisma.io/docs/postgres/database/connection-pooling) - PostgreSQL connection pool configuration

### Secondary (MEDIUM confidence)
- [Deploying Database Changes with Prisma Migrate](https://www.prisma.io/docs/orm/prisma-client/deployment/deploy-database-changes-with-prisma-migrate) - Verified with official docs
- [Prisma for Beginners: Setting Up, Migrating, and Querying](https://medium.com/@fardeenmansuri0316/prisma-for-beginners-setting-up-migrating-and-querying-data-050fc401fa0d) - Community guide on migrations
- [Improving Query Performance with Indexes](https://www.prisma.io/blog/series/improving-query-performance-using-indexes-2gozGfdxjevI) - Official Prisma blog series on indexing
- [Prisma Deep-Dive Handbook (2025)](https://dev.to/mihir_bhadak/prisma-deep-dive-handbook-2025-from-zero-to-expert-1761) - Community guide with current best practices
- [Prisma ORM Production Guide: Next.js Complete Setup 2025](https://www.digitalapplied.com/blog/prisma-orm-production-guide-nextjs) - Production deployment patterns
- [Next.js Image Component Documentation](https://nextjs.org/docs/app/api-reference/components/image) - Official Next.js Image API reference (updated Jan 15, 2026)

### Tertiary (LOW confidence)
- [Solving N+1 Query Problems in Go Applications](https://goprisma.org/blog/solving-n1-query-problems-in-go-applications) - N+1 query patterns (verified with official Prisma docs)
- [Prisma Query Logging](https://prisma.org.cn/docs/orm/prisma-client/observability-and-logging/logging) - Logging configuration (verified with official docs)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All packages already installed, verified official documentation
- Architecture: HIGH - Patterns verified from official Prisma/Next.js docs, current codebase analysis
- Pitfalls: HIGH - All pitfalls documented with official sources and verification methods

**Research date:** 2026-01-30
**Valid until:** 2026-02-27 (30 days - Prisma/Next.js stable APIs, but check for new versions)

**Current codebase analysis:**
- ✅ Singleton pattern implemented in `/src/lib/db.ts`
- ✅ Cloudinary integration via `next-cloudinary` package
- ✅ Basic indexes exist (`teacherId`, `name`, `school`)
- ⚠️ Connection pool not explicitly configured (needs max: 10)
- ⚠️ Query logging not enabled (needs development configuration)
- ⚠️ Images use `<img>` tags instead of `CldImage` component
- ⚠️ Some potential N+1 patterns need verification with query logging
