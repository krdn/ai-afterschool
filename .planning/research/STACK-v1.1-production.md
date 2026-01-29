# Production Stack Research

**Domain:** Production deployment, performance optimization, and technical debt resolution for Next.js application
**Project:** AI AfterSchool - 학생 관리 시스템 v1.1
**Researched:** 2026-01-30
**Confidence:** HIGH

## Executive Summary

This research focuses on stack additions and changes needed for **production readiness** of an existing Next.js application (currently at v1.0). The current stack (Next.js 15, Prisma, PostgreSQL, Cloudinary, @react-pdf/renderer) is validated and working. This document recommends **new capabilities** only for:
1. Production deployment infrastructure
2. Performance optimization
3. Technical debt resolution

**Key Recommendation:** For a single-organization deployment with 50-200 users, **avoid over-engineering**. Use simple, proven tools that solve specific problems rather than enterprise-scale solutions.

---

## New Stack Additions

### Core Infrastructure

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Caddy** | 2.8+ | Reverse proxy with automatic SSL | Automatic HTTPS, zero-downtime reloads, simpler config than Nginx. Ideal for single-app deployments. Eliminates manual SSL renewal overhead. |
| **MinIO** | RELEASE.2025+ | S3-compatible object storage for PDF files | Self-hosted, full S3 API compatibility, eliminates vendor lock-in. Cost-effective for single org vs Cloudflare R2/AWS S3 at this scale. |
| **Redis** | 7.2+ | Caching layer for query results & session data | Reduces database load, improves response times. Single instance sufficient for 50-200 users. |
| **@sentry/nextjs** | 9.x | Error tracking & performance monitoring | Production-grade error monitoring, source map support for Next.js 15, distributed tracing for Server Actions. |

### Development Tools

| Technology | Purpose | When to Use |
|------------|---------|-------------|
| **Docker Compose** (production config) | Production orchestration | Sufficient for single-server deployment. Simpler than Kubernetes for this scale. |
| **ioredis** | Redis client for Node.js | Use with Redis for caching layer. |
| **MinIO SDK** | Object storage client | Use MinIO JavaScript SDK for PDF storage operations. |

---

## Production Deployment Configuration

### Next.js Standalone Mode

**Why:** Reduces Docker image size by ~80%, enables multi-stage builds, faster deployment.

**Configuration:**
```typescript
// next.config.ts
const nextConfig: NextConfig = {
  output: 'standalone',
  // Enable experimental features for production
  experimental: {
    serverComponentsExternalPackages: ['@react-pdf/renderer'],
  },
}
```

**Source:** [Next.js 15 Standalone Mode & Docker Optimization](https://ketan-chavan.medium.com/next-js-15-self-hosting-with-docker-complete-guide-0826e15236da) (HIGH confidence)

### Docker Compose Production Configuration

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  # Next.js Application
  app:
    build:
      context: .
      dockerfile: Dockerfile.prod
      target: production
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=redis://redis:6379
      - SENTRY_DSN=${SENTRY_DSN}
      - MINIO_ENDPOINT=minio:9000
      - MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY}
      - MINIO_SECRET_KEY=${MINIO_SECRET_KEY}
      - TZ=Asia/Seoul
    depends_on:
      - postgres
      - redis
      - minio
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  # Caddy Reverse Proxy
  caddy:
    image: caddy:2.8-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    restart: unless-stopped

  # PostgreSQL Database
  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - TZ=Asia/Seoul
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  # Redis Cache
  redis:
    image: redis:7.2-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    restart: unless-stopped

  # MinIO Object Storage
  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      - MINIO_ROOT_USER=${MINIO_ACCESS_KEY}
      - MINIO_ROOT_PASSWORD=${MINIO_SECRET_KEY}
    volumes:
      - minio_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  minio_data:
  caddy_data:
  caddy_config:
```

### Caddyfile (Automatic SSL + Reverse Proxy)

```caddyfile
# Caddyfile - Automatic SSL + Reverse Proxy
{
    email your-email@example.com
}

# HTTP to HTTPS redirect
:80 {
    reverse_proxy app:3000
}

# HTTPS with automatic SSL
example.com {
    reverse_proxy app:3000

    # PDF files from MinIO (optional direct access)
    handle /pdf/* {
        reverse_proxy minio:9000
    }

    # Security headers
    header {
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        Referrer-Policy "strict-origin-when-cross-origin"
        X-XSS-Protection "1; mode=block"
    }

    # Korean language support
    header Time-Zone "Asia/Seoul"
    header Content-Language "ko"
}
```

**Source:** [Apache vs Nginx vs LiteSpeed vs Caddy | 2026 Guide](https://www.vpsmalaysia.com.my/blog/apache-vs-nginx-vs-litespeed-vs-caddy/) (HIGH confidence, Jan 2026)

### Health Check Endpoint

**Implementation:**
```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Check database connectivity
    await db.$queryRaw`SELECT 1`

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    )
  }
}
```

**Source:** [How to set up an endpoint for Health check on Next.js](https://stackoverflow.com/questions/57956476/how-to-set-up-an-endpoint-for-health-check-on-next-js) (MEDIUM confidence)

---

## Performance Optimization Stack

### Prisma Connection Pooling

**Problem:** Default Prisma setup can exhaust database connections under concurrent load.

**Solution:**
```typescript
// src/lib/db.ts
import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

// Set connection limit for production
if (process.env.NODE_ENV === 'production') {
  prisma.$connect()
  // Connection pooling is handled by pg connection string
  // Example: DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10"
}

export default prisma
```

**Configuration:**
```bash
# .env.production
DATABASE_URL="postgresql://user:password@host:5432/afterschool?connection_limit=10&pool_timeout=20"
```

**Source:** [Connection pooling in Prisma Postgres](https://www.prisma.io/docs/postgres/database/connection-pooling) (HIGH confidence)

### Database Indexing

**Current State:** Schema already has basic indexes (`teacherId`, `name`, `school`)

**Additional Indexes Needed:**
```prisma
// prisma/schema.prisma

// Add composite index for common query patterns
model Student {
  // ... existing fields

  @@index([teacherId, name])  // For "SELECT * WHERE teacherId = ? AND name LIKE ?"
  @@index([teacherId, school]) // For filtering by school within teacher
  @@index([expiresAt])         // For identifying expired student records
}

model PersonalitySummaryHistory {
  // ... existing fields

  @@index([studentId, createdAt(sort: Desc)]) // Already exists, good for time-based queries
}
```

**Verification:**
```bash
# Run EXPLAIN ANALYZE to verify index usage
npx prisma studio --browser none
# Or use psql: EXPLAIN ANALYZE SELECT * FROM "Student" WHERE "teacherId" = '...' AND "name" LIKE '...';
```

**Source:** [Query optimization using Prisma Optimize](https://www.prisma.io/docs/orm/prisma-client/queries/query-optimization-performance) (HIGH confidence)

### Redis Caching Strategy

**When to Use:**
- Cache `fetchReportData()` results (1-hour TTL)
- Cache `getPersonalitySummary()` results (30-minute TTL)
- Cache student list queries (5-minute TTL)

**Implementation:**
```typescript
// src/lib/cache.ts
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

export async function cacheGet<T>(key: string): Promise<T | null> {
  const cached = await redis.get(key)
  return cached ? JSON.parse(cached) : null
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  await redis.setex(key, ttlSeconds, JSON.stringify(value))
}

export async function cacheDelete(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern)
  if (keys.length > 0) {
    await redis.del(...keys)
  }
}
```

**Usage Example:**
```typescript
// In fetchReportData()
const cacheKey = `student:${studentId}:report`
const cached = await cacheGet(cacheKey)
if (cached) return cached

// ... fetch from DB
await cacheSet(cacheKey, data, 3600) // 1 hour TTL
```

**Source:** Prisma documentation confirms Redis is standard for caching layer (MEDIUM confidence)

### Code Splitting for PDF Generator

**Problem:** @react-pdf/renderer adds ~200KB to initial bundle

**Solution:**
```typescript
// Lazy load PDF generator only when needed
// src/app/(dashboard)/students/[id]/report/generate.tsx
'use client'

import dynamic from 'next/dynamic'

const PDFGenerator = dynamic(() => import('./PDFGenerator'), {
  loading: () => <p>PDF 생성 중...</p>,
  ssr: false, // PDF generation doesn't need SSR
})
```

**Source:** [Optimizing package bundling](https://nextjs.org/docs/app/guides/package-bundling) (HIGH confidence)

---

## Technical Debt Resolution

### 1. PDF Storage Migration

**Current Problem:**
- PDFs stored in `./public/reports` with relative paths
- Not scalable, no backup strategy, tied to container filesystem
- Code reference: `src/app/api/students/[id]/report/route.ts` line 51

**Solution: MinIO S3-Compatible Storage**

| Aspect | Implementation |
|--------|----------------|
| **Storage** | MinIO container with persistent volume |
| **API** | Use MinIO SDK or AWS S3 SDK (compatible) |
| **Database** | Update `ReportPDF.fileUrl` to S3 URLs |
| **Access** | Serve via Caddy reverse proxy or direct MinIO URL |
| **Backup** | Volume backup + MinIO replication |

**Implementation:**
```typescript
// src/lib/storage/minio.ts
import S3 from 'aws-sdk/clients/s3'

const s3 = new S3({
  endpoint: process.env.MINIO_ENDPOINT,
  accessKeyId: process.env.MINIO_ACCESS_KEY,
  secretAccessKey: process.env.MINIO_SECRET_KEY,
  s3ForcePathStyle: true, // Required for MinIO
  signatureVersion: 'v4',
})

export async function uploadPDF(
  studentId: string,
  filename: string,
  buffer: Buffer
): Promise<string> {
  const key = `pdfs/${studentId}/${filename}`

  await s3
    .putObject({
      Bucket: 'reports',
      Key: key,
      Body: buffer,
      ContentType: 'application/pdf',
    })
    .promise()

  return `${process.env.MINIO_ENDPOINT}/reports/${key}`
}

export async function getPDFUrl(key: string): Promise<string> {
  return `${process.env.MINIO_ENDPOINT}/reports/${key}`
}
```

**Migration Strategy:**
1. Deploy MinIO alongside existing setup
2. Create migration script to copy existing PDFs
3. Update `ReportPDF.fileUrl` to S3 URLs
4. Switch PDF generation to use MinIO
5. Remove old filesystem storage

**Why MinIO over alternatives:**
- **vs Cloudflare R2**: R2 has zero egress fees but requires public bucket or worker for private access. MinIO keeps data on-prem.
- **vs AWS S3**: S3 has egress fees and vendor lock-in. MinIO is free at this scale.
- **vs continuing Cloudinary**: Cloudinary is optimized for images, not PDFs. No cost advantage for documents.

**Source:** [Why You Should Consider MinIO Over AWS S3](https://www.reddit.com/r/devops/comments/1kgy054/why_you_should_consider_minio_over_aws_s3_how_to/) (MEDIUM confidence)

### 2. Code Deduplication

**Identified Duplication:**
- `fetchReportData()` exists in BOTH:
  - `/src/app/(dashboard)/students/[id]/report/actions.ts` (lines 138-214)
  - `/src/app/api/students/[id]/report/route.ts` (lines 108-184)

**Solution:**
```typescript
// Create: src/lib/db/reports.ts
export async function fetchReportData(studentId: string, teacherId: string) {
  const student = await db.student.findFirst({
    where: { id: studentId, teacherId },
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
      // ... rest of mapping logic
    },
  }
}
```

**Update both files:**
```typescript
// Both files now import:
import { fetchReportData } from '@/lib/db/reports'
```

**Why this matters:**
- Bug fixes need to be applied in two places currently
- Type inconsistencies can develop
- Increases bundle size unnecessarily
- Violates DRY principle

### 3. TypeScript Migration

**Current State:** README mentions JavaScript but codebase is already TypeScript

**Verification Needed:**
- [ ] Check if any `.js` files remain in `src/`
- [ ] Verify `tsconfig.json` is configured correctly
- [ ] Ensure all dependencies have `@types/*` packages

**Recommendation:** Complete TypeScript migration
- Already partially done (based on file extensions)
- Provides type safety for refactoring
- Required for performance optimization work

**Current Dependencies (from package.json):**
```json
{
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "typescript": "^5"
  }
}
```

All type packages are present. Migration is likely complete, just needs verification.

---

## Monitoring & Error Tracking

### Sentry Integration

**Why:** Production-grade error monitoring with source map support for Next.js 15

**Installation:**
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

**Configuration:**
```javascript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Filter sensitive data (PII)
  beforeSend(event, hint) {
    // Remove student personal information
    if (event.request) {
      delete event.request.cookies
    }
    return event
  },
})
```

**Source Map Upload:**
```javascript
// next.config.ts
const nextConfig: NextConfig = {
  output: 'standalone',

  // Sentry source map upload
  sentry: {
    hideSourceMaps: true,
    widenClientFileUpload: true,
  },
}
```

**Source:** [Error and Performance Monitoring for Next.js](https://sentry.io/for/nextjs/) (HIGH confidence)

### Database Monitoring

**PostgreSQL Slow Query Logging:**
```bash
# postgresql.conf (in Docker container)
log_min_duration_statement = 1000  # Log queries taking > 1 second
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
```

**Key Metrics to Monitor:**
- Connection pool usage (should be < 80%)
- Slow queries (> 1 second)
- Database size growth
- Index hit ratio (> 95%)

**Source:** [PostgreSQL Performance Checklist Before Going Live in 2026](https://rizqimulki.com/postgresql-performance-checklist-before-going-live-in-2026-39f54aa3ecf0) (HIGH confidence)

### Log Aggregation

**Docker Log Configuration:**
```yaml
# docker-compose.prod.yml
services:
  app:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

**Why:** Prevents disk fill from unlimited log growth

---

## Korean Language Considerations

### Fonts for PDF Generation

**Problem:** Korean fonts render as blank boxes if not properly embedded

**Solution:**
```typescript
// src/lib/pdf/fonts.ts
import { Font } from '@react-pdf/renderer'

// Register Nanum Gothic for Korean PDF rendering
Font.register({
  family: 'NanumGothic',
  src: '/fonts/NanumGothic.ttf', // Download from Google Fonts or Naver
})

// Use in PDF template
const styles = StyleSheet.create({
  text: {
    fontFamily: 'NanumGothic',
    fontSize: 12,
  },
})
```

**Font Download:**
- Google Fonts: https://fonts.google.com/specimen/Nanum+Gothic
- Free for commercial use (SIL Open Font License)

**Source:** [I'm trying to get Korean font to work in react-pdf](https://github.com/diegomura/react-pdf/issues/806) (MEDIUM confidence, working example)

### Timezone Configuration

**Problem:** Korean students' birth dates must use KST

**Solution:**
```typescript
// next.config.ts
const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: [],
  },
}

// Environment variables
TZ=Asia/Seoul
NEXT_PUBLIC_TZ=Asia/Seoul
```

**Docker Compose:**
```yaml
services:
  app:
    environment:
      - TZ=Asia/Seoul
  postgres:
    environment:
      - TZ=Asia/Seoul
```

---

## Performance Optimization Priorities

### High Impact (Do First)

1. **Prisma Connection Pooling** (HIGH confidence)
   - Set `connection_limit=10` in DATABASE_URL
   - Prevents "too many connections" errors under load
   - Source: Official Prisma docs

2. **Database Indexes** (HIGH confidence)
   - Add composite index on `Student(teacherId, name)`
   - Add index on `Student(teacherId, school)`
   - Current schema has basic indexes, verify they're being used

3. **Redis Caching for Analysis Results** (MEDIUM confidence)
   - Cache `fetchReportData()` results with 1-hour TTL
   - Cache `getPersonalitySummary()` results
   - Reduces DB queries for frequently accessed data

4. **Code Deduplication** (HIGH confidence)
   - Extract `fetchReportData()` to shared location
   - Identified in both `actions.ts` and `route.ts`
   - Reduces bundle size and maintenance burden

### Medium Impact (Do Second)

5. **PDF Generation Optimization** (MEDIUM confidence)
   - Stream PDF generation instead of buffering entire file
   - Consider background generation queue for concurrent requests

6. **Next.js Standalone Mode** (HIGH confidence)
   - Enable in `next.config.ts`
   - Reduces Docker image from ~1GB to ~200MB
   - Faster container startup

7. **Korean Font Loading** (MEDIUM confidence)
   - Preload Nanum Gothic font in PDF template
   - Use local TTF file instead of URL
   - Avoids blank PDF rendering issues

### Low Impact (Nice to Have)

8. **Code Splitting for PDF Generator** (LOW confidence)
   - Lazy load `@react-pdf/renderer` only when needed
   - Reduces initial bundle by ~200KB
   - Minimal impact for single-page app pattern

9. **Image Optimization** (HIGH confidence)
   - Verify Cloudinary images use `next/image`
   - Ensure `images.domains` includes Cloudinary CDN
   - Next.js 15 has built-in optimization

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| **Caddy** | Nginx | Use Nginx if you need complex routing, microservices, or already have Nginx expertise. Caddy is simpler for single-app. |
| **MinIO** | Cloudflare R2 | Use R2 for cloud-native with zero egress fees. MinIO keeps data on-prem for single org. |
| **MinIO** | AWS S3 | Use S3 if already in AWS ecosystem. S3 has egress fees. |
| **Redis** | Next.js built-in cache | Use Next.js cache only for simple cases. Redis provides persistence and TTL. |
| **Sentry** | LogRocket | Use LogRocket for session replay. Sentry is more focused on errors/performance. |
| **Docker Compose** | Kubernetes | Use K8s for auto-scaling, multi-server, complex orchestration. Overkill for 50-200 users. |

---

## What NOT to Use (Avoid Over-Engineering)

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Prisma Accelerate** | Additional cost, not needed for 50-200 users | Single PostgreSQL with connection pooling |
| **Vercel deployment** | Vendor lock-in, recurring costs | Self-hosted Docker deployment |
| **pm2** | Not needed with Docker in production | Docker's restart policy |
| **Separate Nginx container** | Unnecessary complexity | Caddy provides reverse proxy + SSL in one |
| **Cloudinary for PDFs** | Not optimized for documents | MinIO for document storage |
| **Webpack manual splitting** | Next.js 15 handles this automatically | Trust Next.js automatic splitting |
| **Environment vars in Compose** | Security risk if committed | Docker Secrets or separate .env file |

---

## Installation Commands

```bash
# Production deployment dependencies
npm install @sentry/nextjs
npm install ioredis
npm install minio

# Dev dependencies for source maps
npm install -D @sentry/webpack-plugin

# Sentry setup wizard
npx @sentry/wizard@latest -i nextjs

# Fonts (manual download)
# Download NanumGothic.ttf from Google Fonts
# Place in public/fonts/NanumGothic.ttf
```

---

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Next.js 15.5 | @sentry/nextjs 9.x | Verified Sentry has Next.js 15 support |
| @prisma/client 7.3 | PostgreSQL 16 | Use PG 16 for better performance |
| @react-pdf/renderer 4.3 | Next.js 15 | May need next.config.ts adjustments |
| Caddy 2.8 | Docker Compose 2.24+ | Requires port 80/443 binding |
| Redis 7.2 | ioredis 5.x | ioredis 5.x supports Redis 7 features |

---

## Production Readiness Checklist

- [ ] Enable Next.js standalone mode in `next.config.ts`
- [ ] Create production `Dockerfile` with multi-stage build
- [ ] Set up Docker Compose production configuration
- [ ] Configure Caddy reverse proxy with automatic SSL
- [ ] Implement `/api/health` endpoint with DB connectivity check
- [ ] Set up Sentry error tracking with source maps
- [ ] Configure Redis caching for frequently accessed data
- [ ] Add Prisma connection pooling configuration
- [ ] Create database indexes for optimized queries
- [ ] Set up MinIO for PDF storage
- [ ] Implement log rotation for Docker containers
- [ ] Configure PostgreSQL slow query logging
- [ ] Add Korean font (Nanum Gothic) to PDF templates
- [ ] Set up environment variable management (Docker Secrets)
- [ ] Implement backup strategy for PostgreSQL and MinIO volumes
- [ ] Load test application with 50-200 concurrent users

---

## Sources

### Production Deployment
- [Next.js 15 Standalone Mode & Docker Optimization](https://ketan-chavan.medium.com/next-js-15-self-hosting-with-docker-complete-guide-0826e15236da) — HIGH confidence, official Docker patterns
- [Best practices | Docker Docs](https://docs.docker.com/compose/how-tos/environment-variables/best-practices/) — HIGH confidence, official documentation
- [Managing Secrets in Docker Compose](https://phase.dev/blog/docker-compose-secrets) — MEDIUM confidence, Jan 2025

### Reverse Proxy & SSL
- [Apache vs Nginx vs LiteSpeed vs Caddy | 2026 Guide](https://www.vpsmalaysia.com.my/blog/apache-vs-nginx-vs-litespeed-vs-caddy/) — HIGH confidence, Jan 2026
- [I Switched from Nginx to Caddy](https://userjot.com/blog/caddy-reverse-proxy-nginx-alternative) — MEDIUM confidence

### Performance Optimization
- [Query optimization using Prisma Optimize](https://www.prisma.io/docs/orm/prisma-client/queries/query-optimization-performance) — HIGH confidence
- [Connection pooling in Prisma Postgres](https://www.prisma.io/docs/postgres/database/connection-pooling) — HIGH confidence
- [Optimizing package bundling](https://nextjs.org/docs/app/guides/package-bundling) — HIGH confidence

### Monitoring & Error Tracking
- [Error and Performance Monitoring for Next.js](https://sentry.io/for/nextjs/) — HIGH confidence
- [Error Monitoring: Ultimate Guide to Sentry in Next.js](https://medium.com/@rukshan1122/error-monitoring-the-ultimate-guide-to-sentry-in-next-js-never-miss-a-production-error-again-e678a93760ae) — MEDIUM confidence, 3 weeks old

### Object Storage
- [Cloudflare R2 vs AWS S3: Complete 2025 Comparison](https://www.digitalapplied.com/blog/cloudflare-r2-vs-aws-s3-comparison) — MEDIUM confidence, Jun 2025
- [Why You Should Consider MinIO Over AWS S3](https://www.reddit.com/r/devops/comments/1kgy054/why_you_should_consider_minio_over_aws_s3_how_to/) — MEDIUM confidence

### Database Monitoring
- [PostgreSQL Performance Checklist Before Going Live in 2026](https://rizqimulki.com/postgresql-performance-checklist-before-going-live-in-2026-39f54aa3ecf0) — HIGH confidence

### Korean Language Support
- [Nanum Gothic - Google Fonts](https://fonts.google.com/specimen/Nanum+Gothic) — HIGH confidence
- [I'm trying to get Korean font to work in react-pdf](https://github.com/diegomura/react-pdf/issues/806) — MEDIUM confidence

### Health Checks
- [How to set up an endpoint for Health check on Next.js](https://stackoverflow.com/questions/57956476/how-to-set-up-an-endpoint-for-health-check-on-next-js) — MEDIUM confidence

---

**Last Updated:** 2026-01-30
**Research Mode:** Production Stack (v1.1)
**Overall Confidence:** HIGH-MEDIUM (official docs + recent 2025-2026 sources)
