# Feature Research: Production Readiness v1.1

**Domain:** Production Deployment, Performance Optimization, Technical Debt Resolution
**Project:** AI AfterSchool - 학생 관리 시스템 with AI 성향 분석
**Milestone:** v1.1 Production Readiness (Subsequent Milestone)
**Researched:** 2026-01-30
**Confidence:** HIGH

---

## Executive Summary

v1.1 is a **production readiness milestone** for an existing v1.0 MVP that shipped with 11,451 lines of TypeScript and an integration health score of 98/100. The focus is on:

1. **Deployment Features**: Docker-based production deployment with zero-downtime updates
2. **Performance Features**: Query optimization, image optimization, code splitting, caching
3. **Technical Debt Resolution**: PDF storage migration (local → S3), code deduplication

**Key Finding**: The existing codebase is well-architected (Next.js App Router, Prisma, Server Actions), but has two critical production blockers:
- **PDF storage on local filesystem** breaks in containerized deployments
- **Code duplication** (`fetchReportData` in 2 files) creates maintenance burden

**Recommendation**: Prioritize P1 features (Docker deployment, PDF migration, query optimization) for production readiness. Defer P3 features (Redis, advanced monitoring) unless proven need arises.

---

## Feature Landscape

### Table Stakes (Production Readiness Essentials)

Features expected in any production Next.js application. Missing these means the application is not production-ready.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Zero-downtime Deployment** | Production apps cannot have service interruptions during updates | MEDIUM | Use atomic folder swapping or blue-green deployment with Docker |
| **Database Migration Automation** | Manual schema changes cause data loss and downtime | LOW-MEDIUM | Prisma `migrate deploy` in CI/CD pipeline, **NEVER** `migrate dev` in production |
| **Environment-specific Configurations** | Dev/staging/production separation prevents accidents | LOW | `.env.local` for dev, secrets manager for production |
| **Health Check Endpoint** | Load balancers and monitoring need liveness/readiness probes | LOW | Simple `/api/health` endpoint returning DB connectivity |
| **Structured Logging** | Debugging production requires structured, searchable logs | MEDIUM | JSON-based logging with request ID tracing |
| **Error Tracking** | Unhandled errors must be captured and reported | LOW-MEDIUM | Sentry or similar for error aggregation |
| **PDF Storage Migration** | Local filesystem storage breaks in containerized deployments | HIGH | Move from `./public/reports` to S3-compatible storage |
| **Query Optimization** | N+1 queries kill performance as data grows | MEDIUM | Prisma `include` vs separate queries, eager loading |
| **Image Optimization** | Unoptimized images waste bandwidth and slow loading | LOW | Next.js `<Image>` component with WebP/AVIF |
| **Code Splitting** | Large bundles cause slow initial page loads | LOW-MEDIUM | Route-based splitting (automatic in App Router) + lazy loading |
| **Database Backup Automation** | Production data must be backed up regularly | MEDIUM | PostgreSQL `pg_dump` scheduled via cron |
| **SSL/TLS Termination** | HTTP is insecure for authentication data | LOW | Reverse proxy (Nginx/Caddy) or Let's Encrypt |

**Sources:**
- [Next.js Production Checklist](https://nextjs.org/docs/app/guides/production-checklist) (HIGH confidence - official docs, Dec 2025)
- [Next.js Deploying Guide](https://nextjs.org/docs/app/getting-started/deploying) (HIGH confidence - official docs, Dec 2025)
- [Prisma Migrate Development and Production](https://www.prisma.io/docs/orm/prisma-migrate/workflows/development-and-production) (HIGH confidence - official docs)

### Differentiators (Competitive Advantages)

Features that set this implementation apart from typical MVP deployments.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Multi-stage Docker Build** | Smaller production images (~70% size reduction), faster deployment, better security | MEDIUM | Separate build/deps/runtime stages |
| **Parallel Data Fetching** | Faster page loads by eliminating query waterfalls | MEDIUM | `Promise.all()` for independent queries in Server Components |
| **Component-level Caching** | Reduced database load, faster response times | MEDIUM | Next.js 15+ `use cache` directive or Redis for distributed |
| **Streaming with Suspense** | Perceived performance improvement (loading UI appears faster) | LOW-MEDIUM | Loading skeletons for async operations |
| **Database Connection Pooling** | Better resource utilization, handles concurrent requests | MEDIUM | Prisma `connection_limit` configuration |
| **CDN for Static Assets** | Faster global content delivery | LOW | Cloudinary already used for images, extend to PDFs |
| **Automated Rollback** | Faster recovery from failed deployments | MEDIUM | Health check-based rollback in CI/CD |
| **Performance Monitoring** | Proactive performance regression detection | HIGH | OpenTelemetry + APM or lightweight alternative |
| **GitOps Deployment** | Declarative infrastructure, audit trail for changes | MEDIUM | Git-based deployment triggers, infrastructure as code |

**Sources:**
- [Next.js Lazy Loading Guide](https://nextjs.org/docs/app/guides/lazy-loading) (HIGH confidence - official docs, Oct 2025)
- [Next.js Package Bundling Optimization](https://nextjs.org/docs/app/guides/package-bundling) (HIGH confidence - official docs, Dec 2025)
- [Optimizing Next.js for Maximum Performance](https://dev.to/devops-make-it-run/optimizing-nextjs-for-maximum-performance-3634) (MEDIUM confidence - community tutorial, Oct 2025)
- [Mastering Lazy Loading in Next.js 15](https://medium.com/@sureshdotariya/mastering-lazy-loading-in-nextjs-15-advanced-patterns-for-peak-performance-75e0bd574c76) (MEDIUM confidence - Medium, 2025)

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems for this scale/scope (50-200 students).

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Redis for Everything** | "Caching is good, right?" | Over-engineering for 50-200 students; adds operational overhead | Next.js built-in cache (request memoization, data cache) |
| **Kubernetes Orchestration** | "Production-grade scalability" | Complex for single-server deployment; overkill for <1000 users | Docker Compose with health checks |
| **Microservices Architecture** | "Modern, scalable design" | Increases latency, operational complexity; data consistency challenges | Monolithic Next.js App Router (already has good separation) |
| **Real-time WebSocket Updates** | "Live notifications for PDF generation" | Adds complexity, connection management overhead | Polling with exponential backoff (already implemented) |
| **Custom Server with Express** | "Need more control" | Loses Next.js optimizations; harder to upgrade; breaks Vercel compatibility | Next.js Route Handlers + Middleware |
| **Multiple Database Replicas** | "High availability for reads" | Replication lag complexity; overkill for read-heavy but low-concurrency app | Single PostgreSQL with connection pooling |
| **Full-text Search Engine** | "Better student search" | Elasticsearch/Meilisearch operational overhead | PostgreSQL full-text search (TsVector) or simple LIKE |
| **Background Job Queue (Bull/BullMQ)** | "Reliable PDF generation" | Redis dependency; adds failure modes | Next.js `after()` API (already implemented, simpler) |
| **Multi-region Deployment** | "Global availability" | Data consistency challenges; significant cost increase | Single-region with CDN (Cloudinary) |

**Sources:**
- [Next.js Performance Optimization Techniques](https://www.linkedin.com/posts/lokesh-dudhat_nextjs-performance-optimization-want-faster-activity-7404428617822433280-zcJx) (LOW-MEDIUM confidence - LinkedIn post)
- [Warning: Think twice before using Prisma in large projects](https://www.reddit.com/r/nextjs/comments/1i9zvyy/warning_think_twice_before_using_prisma_in_large/) (LOW confidence - Reddit discussion)
- [Why You Should Use Next.js for Your SaaS (2026 Guide)](https://makerkit.dev/blog/tutorials/why-you-should-use-nextjs-saas) (MEDIUM confidence - MakerKit blog, Jan 2026)

---

## Feature Dependencies

```
[Docker Environment Setup]
    ├──requires──> [Multi-stage Dockerfile]
    ├──requires──> [Environment Variables Management]
    └──requires──> [Health Check Endpoint]

[Database Migration Automation]
    ├──requires──> [Prisma Migrate Setup]
    └──enhances──> [Zero-downtime Deployment]

[Zero-downtime Deployment]
    ├──requires──> [CI/CD Pipeline]
    ├──requires──> [Automated Testing]
    └──requires──> [Health Check Endpoint]

[PDF Storage Migration]
    ├──requires──> [S3-compatible Storage Setup]
    ├──requires──> [PDF Upload to Storage]
    └──conflicts──> [Local Filesystem PDF serving]

[Query Optimization]
    ├──enhances──> [Performance Monitoring]
    └──requires──> [Prisma Query Analysis]

[Performance Monitoring]
    ├──enhances──> [All Performance Features]
    └──requires──> [Structured Logging]
```

### Dependency Notes

- **Docker Environment Setup requires Multi-stage Dockerfile**: Cannot optimize image size without separating build/runtime stages
- **Database Migration Automation enhances Zero-downtime Deployment**: Automated migrations prevent manual errors during deployment
- **PDF Storage Migration conflicts with Local Filesystem PDF serving**: Must switch entirely; hybrid approach causes confusion
- **Query Optimization enhances Performance Monitoring**: Need monitoring to verify optimization impact
- **CI/CD Pipeline requires Automated Testing**: Cannot safely deploy without test coverage

**Sources:**
- [Next.js Containerization using Docker](https://medium.com/@redrobotdev/next-js-containerization-using-docker-73a32348917f) (MEDIUM confidence - Medium tutorial)
- [Self-Host Next.js with Kamal and GitHub Actions](https://getdeploying.com/guides/deploy-nextjs) (MEDIUM confidence - deployment guide, Jan 2025)

---

## MVP Definition (v1.1 Production Readiness)

### Launch With (Production Deployment)

Minimum features for safe production deployment.

- [ ] **Docker Compose Production Environment** — Containerized deployment with health checks
- [ ] **Database Migration Automation** — `prisma migrate deploy` in CI/CD pipeline
- [ ] **Environment Variables Management** — Separate dev/staging/production configs
- [ ] **Health Check Endpoint** — `/api/health` for liveness/readiness probes
- [ ] **Basic Error Tracking** — Sentry integration for error aggregation
- [ ] **PDF Storage Migration** — Move from local to S3-compatible storage (MinIO/AWS)
- [ ] **Query Optimization** — Fix N+1 problems, optimize Prisma includes
- [ ] **Structured Logging** — JSON-based logs with request ID tracing
- [ ] **Database Backup Automation** — Automated `pg_dump` with retention policy

### Add After Validation (Post-MVP Performance)

Features to add once core production deployment is stable.

- [ ] **Performance Monitoring** — OpenTelemetry + APM or lightweight alternative
- [ ] **Code Splitting Optimization** — Bundle analysis and lazy loading implementation
- [ ] **Component-level Caching** — `use cache` directive or Redis integration
- [ ] **Parallel Data Fetching** — Refactor to eliminate sequential query waterfalls
- [ ] **Streaming with Suspense** — Loading skeletons for better perceived performance
- [ ] **Automated Rollback** — Health check-based rollback in CI/CD
- [ ] **Database Connection Pooling** — Tune `connection_limit` for concurrency

### Future Consideration (v2+)

Features to defer until proven need.

- [ ] **CDN for PDFs** — Cloudinary or similar for global PDF delivery (if multi-region needed)
- [ ] **Advanced Performance Monitoring** — Full APM with distributed tracing (if performance issues arise)
- [ ] **Redis Caching Layer** — Only if Next.js built-in cache insufficient for scale
- [ ] **Full-text Search** — PostgreSQL full-text search only if simple LIKE insufficient
- [ ] **Multi-region Deployment** — Only if international expansion required

**Sources:**
- [Next.js 15 Production Checklist](https://srivathsav.me/blog/nextjs-15-production-checklist) (MEDIUM confidence - community blog, Aug 2025)
- [How to Deploy a Next.js App in 2026](https://kuberns.com/blogs/post/deploy-nextjs-app/) (MEDIUM confidence - deployment tutorial, Nov 2025)

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Docker Compose Production Environment | HIGH (deployment capability) | MEDIUM | **P1** |
| Database Migration Automation | HIGH (prevents data loss) | LOW | **P1** |
| Health Check Endpoint | HIGH (operational requirement) | LOW | **P1** |
| PDF Storage Migration | HIGH (breaks in containers) | MEDIUM | **P1** |
| Query Optimization | HIGH (performance scales) | MEDIUM | **P1** |
| Environment Variables Management | MEDIUM (operational safety) | LOW | **P1** |
| Basic Error Tracking | MEDIUM (debuggability) | LOW-MEDIUM | **P1** |
| Database Backup Automation | HIGH (data safety) | MEDIUM | **P1** |
| Structured Logging | MEDIUM (debuggability) | LOW-MEDIUM | **P2** |
| Code Splitting Optimization | MEDIUM (performance) | LOW-MEDIUM | **P2** |
| Performance Monitoring | MEDIUM (observability) | HIGH | **P2** |
| Parallel Data Fetching | MEDIUM (performance) | MEDIUM | **P2** |
| Component-level Caching | LOW (nice-to-have) | MEDIUM | **P2** |
| Streaming with Suspense | LOW (UX improvement) | LOW-MEDIUM | **P3** |
| Automated Rollback | MEDIUM (safety net) | MEDIUM | **P3** |
| Database Connection Pooling | LOW (scalability) | LOW | **P3** |
| Multi-stage Docker Build | LOW (image size) | MEDIUM | **P3** |
| CDN for PDFs | LOW (performance) | MEDIUM | **P3** |
| Redis Caching Layer | LOW (performance) | HIGH | **P3** |

**Priority key:**
- **P1**: Must have for production launch (v1.1)
- **P2**: Should have, add when possible (v1.2)
- **P3**: Nice to have, future consideration (v2+)

**Sources:**
- [Next.js 15 — Deployment, CI/CD & Hosting](https://javascript.plainenglish.io/next-js-15-deployment-ci-cd-hosting-like-a-devops-minimalist-c24e8019e91a) (MEDIUM confidence - community article, Sep 2025)

---

## v1.1-Specific Feature Categories

### Deployment Features (Production Infrastructure)

#### Table Stakes (P1)

1. **Docker Compose Production Configuration**
   - Multi-stage Dockerfile (build → deps → runtime)
   - Production-ready `docker-compose.yml` with health checks
   - Environment-specific compose files (base, production, staging)
   - Volume management for persistent data (database, uploads)

2. **Zero-Downtime Deployment Strategy**
   - Atomic container replacement with health check verification
   - Rollback capability on health check failure
   - Blue-green deployment (if multi-server setup in future)

3. **Database Migration Automation**
   - `prisma migrate deploy` in CI/CD pipeline (**NEVER** `migrate dev` in production)
   - Pre-migration backup requirement
   - Migration status tracking in database
   - Rollback plan for failed migrations

4. **Environment-Specific Configurations**
   - `.env.local` for local development (gitignored)
   - `.env.production` template for required variables
   - Docker Secrets or external secret manager (Vault/AWS Secrets)
   - Configuration validation on startup

**Sources:**
- [Prisma Migrate Development and Production](https://www.prisma.io/docs/orm/prisma-migrate/workflows/development-and-production) (HIGH confidence - official docs)
- [How to Deploy a Next.js App in 2026](https://kuberns.com/blogs/post/deploy-nextjs-app/) (MEDIUM confidence - tutorial, Nov 2025)

#### Differentiators (P2-P3)

5. **GitOps-Based Deployment**
   - GitHub Actions workflow for automated deployment
   - Deployment triggered on main branch merge
   - Environment promotion (dev → staging → production)
   - Deployment status notifications

6. **Automated SSL/TLS with Caddy**
   - Automatic Let's Encrypt certificate renewal
   - Reverse proxy for Next.js container
   - HTTP-to-HTTPS redirect
   - Security headers configuration

**Sources:**
- [Build a Clean CI/CD Pipeline for Next.js with GitHub Actions](https://minhas309.medium.com/build-a-clean-ci-cd-pipeline-for-your-nextjs-app-using-github-actions-and-any-server-ee96eb32ecc2) (MEDIUM confidence - Medium tutorial, 2025)
- [Deploying Your Next.js Application on AWS with GitHub Actions](https://heyvivek.com/deploying-your-nextjs-application-on-aws-with-github-actions-a-step-by-step-guide) (MEDIUM confidence - tutorial, Feb 2025)

### Performance Features (Optimization & Monitoring)

#### Table Stakes (P1-P2)

1. **Query Optimization (N+1 Prevention)**
   - Prisma `include` for eager loading related data
   - `select` for specific field selection (reduce payload)
   - Batch queries for multiple records
   - Query analysis with `prisma query`

2. **Image Optimization**
   - Next.js `<Image>` component for all student photos
   - WebP/AVIF format generation (automatic)
   - Responsive sizes with `srcset`
   - Lazy loading for below-fold images
   - Blur placeholder for better UX

3. **Code Splitting & Lazy Loading**
   - Route-based splitting (automatic in App Router)
   - Dynamic imports for heavy Client Components
   - `next/dynamic` for conditional imports
   - Bundle analysis with `@next/bundle-analyzer`

4. **Basic Performance Monitoring**
   - Core Web Vitals tracking (LCP, FID, CLS)
   - `useReportWebVitals` hook for analytics
   - Lighthouse CI in CI/CD pipeline

**Sources:**
- [Prisma Query Optimization Performance](https://www.prisma.io/docs/orm/prisma-client/queries/query-optimization-performance) (HIGH confidence - official Prisma docs)
- [How to Avoid N+1 Problems with Prisma](https://www.linkedin.com/posts/shohan-pherones_prisma-orm_backend-activity-7325160320967049216-SwfR) (MEDIUM confidence - LinkedIn post)
- [Mastering Code Splitting in Next.js App Router](https://dev.to/ahr_dev/mastering-code-splitting-in-nextjs-app-router-2608) (MEDIUM confidence - Dev.to tutorial, Sep 2025)
- [Next.js Bundle Analyzer Guide](https://blog.csdn.net/gitblog_00735/article/details/152356387) (LOW-MEDIUM confidence - Chinese tutorial, Nov 2025)

#### Differentiators (P2)

5. **Parallel Data Fetching**
   - `Promise.all()` for independent queries in Server Components
   - Eliminates sequential query waterfalls
   - Preloading related data where possible

6. **Component-Level Caching**
   - Next.js 15+ `use cache` directive
   - Cache tags for selective invalidation
   - Time-based revalidation (`revalidate`)

**Sources:**
- [Optimizing Next.js for Maximum Performance](https://dev.to/devops-make-it-run/optimizing-nextjs-for-maximum-performance-3634) (MEDIUM confidence - Dev.to, Oct 2025)

### Technical Debt Resolution (Refactoring & Cleanup)

#### Table Stakes (P1)

1. **PDF Storage Migration (HIGH PRIORITY)**
   - **Current Issue**: PDFs stored in `./public/reports` (local filesystem)
   - **Problem**: Breaks in containerized deployments (ephemeral storage)
   - **Impact**: PDFs lost on container restart
   - **Solution**: Migrate to S3-compatible storage (MinIO for self-hosted, AWS S3 for cloud)
   - **Implementation**:
     - Replace `fs.writeFile()` with S3 SDK upload
     - Generate presigned URLs for secure PDF access
     - Database migration to update existing file URLs
     - Backfill existing PDFs to S3

2. **Code Deduplication (fetchReportData)**
   - **Current Issue**: `fetchReportData()` duplicated in `actions.ts` and `route.ts`
   - **Locations**: `src/app/api/students/[id]/report/route.ts` and `src/app/(dashboard)/students/[id]/report/actions.ts`
   - **Lines**: ~77 lines duplicated
   - **Impact**: Maintenance burden, potential inconsistency
   - **Solution**: Extract to shared function in `src/lib/db/reports.ts`
   - **Implementation**:
     - Create `getReportData(studentId, teacherId)` in `src/lib/db/reports.ts`
     - Replace both implementations with shared function
     - Add unit tests for data transformation logic

3. **TypeScript Migration (if applicable)**
   - Verify all files use TypeScript (check for remaining `.js` files)
   - Enable strict mode in `tsconfig.json`
   - Fix any `any` types
   - Add proper return types to functions

**Sources:**
- [Amazon S3 vs Local File System](https://documentation.censhare.com/classic/latest/Public/amazon-s3-vs-local-file-system) (LOW-MEDIUM confidence - vendor documentation)
- [Amazon S3 vs Local Storage](https://www.jscape.com/blog/amazon-s3-vs-local-storage-where-should-you-store-files-uploaded-to-your-file-transfer-server) (LOW-MEDIUM confidence - vendor comparison)
- [View PDF stored on S3 in new tab](https://laracasts.com/discuss/channels/general-discussion/view-pdf-stored-on-s3-in-new-tab) (MEDIUM confidence - community discussion, 2025)

#### Differentiators (P2-P3)

4. **State Management Audit**
   - Review Client Component state usage
   - Consolidate duplicate state (URL params + local state)
   - Consider Server Actions replacement for client-side mutations

5. **Error Handling Standardization**
   - Consistent error response format across API routes
   - Proper HTTP status codes
   - Error logging with context
   - User-friendly error messages (Korean)

### Operations Features (Monitoring & Maintenance)

#### Table Stakes (P1-P2)

1. **Health Check Endpoint**
   - `/api/health` endpoint returning:
     - Status: `healthy` / `degraded` / `unhealthy`
     - Database connectivity check
     - Timestamp
     - Version info
   - Used by Docker health checks and load balancers

2. **Structured Logging**
   - JSON-formatted logs (pino or winston)
   - Request ID tracing across logs
   - Log levels: error, warn, info, debug
   - Sensitive data redaction (passwords, tokens)

3. **Error Tracking**
   - Sentry integration for runtime errors
   - Source maps upload for readable stack traces
   - User context (teacher ID, student ID)
   - Performance monitoring (slow transactions)

4. **Database Backup Automation**
   - Daily automated backups via cron
   - `pg_dump` to compressed SQL file
   - Retention policy (e.g., 7 daily, 4 weekly, 3 monthly)
   - Backup restoration testing (quarterly)

**Sources:**
- [How to Add a Health Check Endpoint to Your Next.js App](https://hyperping.com/blog/nextjs-health-check-endpoint) (MEDIUM confidence - Hyperping blog, March 2025)
- [Sentry for Next.js](https://sentry.io/for/nextjs/) (HIGH confidence - official Sentry docs)
- [Observing and Debugging Next.js apps with Sentry](https://sentry.io/resources/workshop-nextjs-feb-2026/) (MEDIUM confidence - Sentry workshop, Feb 2026)

#### Differentiators (P2-P3)

5. **Performance Metrics Dashboard**
   - Response time percentiles (p50, p95, p99)
   - Database query duration tracking
   - API route request counts
   - Error rate by endpoint

6. **Alert Configuration**
   - Alert on error rate spike (>5% for 5 minutes)
   - Alert on high response time (p95 > 2s)
   - Alert on database connection failures
   - Alert on disk space < 20%

**Sources:**
- [OpenTelemetry Setup for Next.js Performance Monitoring](https://staarter.dev/blog/opentelemetry-setup-for-nextjs-performance-monitoring) (LOW-MEDIUM confidence - community blog, June 2024)
- [9 Best Next.js Monitoring Tools](https://cubeapm.com/blog/best-next-js-monitoring-tools/) (LOW-MEDIUM confidence - CubeAPM blog, Oct 2025)

---

## Known Technical Debt (From v1.0 Audit)

### High Priority (P1)

1. **PDF Storage Location** (Critical)
   - **Current**: `./public/reports` local filesystem
   - **Issue**: Breaks in Docker containers (ephemeral storage)
   - **Impact**: PDFs lost on container restart
   - **Fix**: Migrate to S3-compatible storage (MinIO/AWS S3)

2. **Code Duplication: fetchReportData()** (Medium)
   - **Locations**: `src/app/api/students/[id]/report/route.ts` (lines 108-184) and `src/app/(dashboard)/students/[id]/report/actions.ts` (lines 138-214)
   - **Lines**: ~77 lines duplicated
   - **Impact**: Maintenance burden, potential inconsistency
   - **Fix**: Extract to `src/lib/db/reports.ts`

### Medium Priority (P2)

3. **Missing VERIFICATION.md** (Low)
   - **Issue**: Phase 1 verification file missing
   - **Impact**: Incomplete project documentation
   - **Fix**: Create verification checklist file

### Low Priority (P3)

4. **Bundle Size Optimization** (Deferred to v1.2)
   - Analyze bundle size with `@next/bundle-analyzer`
   - Lazy load heavy Client Components
   - Remove unused dependencies

**Sources:**
- Direct codebase inspection (2026-01-30)
- v1.0 Milestone Audit (`.planning/milestones/v1.0-MILESTONE-AUDIT.md`)
- Project Documentation (`.planning/PROJECT.md`)

---

## Competitor Feature Analysis

| Feature | Vercel (Next.js Host) | Railway (Container Host) | Self-Hosted (Docker) | Our Approach |
|---------|----------------------|-------------------------|----------------------|--------------|
| **Deployment** | Git push, automatic | Git push, automatic | Docker Compose manual | Docker Compose + GitHub Actions CI/CD |
| **Database Migrations** | Integrated Prisma | Manual commands | Manual commands | Automated `prisma migrate deploy` in CI/CD |
| **SSL/TLS** | Automatic Let's Encrypt | Automatic Let's Encrypt | Manual Caddy/Nginx | Caddy reverse proxy with auto-SSL |
| **Health Checks** | Built-in | Built-in | Manual implementation | Custom `/api/health` endpoint |
| **Logging** | Structured logs | Structured logs | Docker logs only | JSON logging + file rotation |
| **Error Tracking** | Integration available | Integration available | Manual setup | Sentry integration |
| **Scaling** | Auto-scaling | Auto-scaling | Manual scaling | Horizontal scaling with Docker Swarm (future) |
| **Backups** | Point-in-time recovery | Daily backups | Manual pg_dump | Automated pg_dump cron job |
| **Cost (50-200 users)** | $20-60/month | $20-50/month | $5-15/month (VPS only) | **$5-15/month (self-hosted VPS)** |

**Key Insight**: Self-hosted Docker deployment offers **80% cost savings** vs managed platforms for this scale (50-200 users).

**Sources:**
- [Next.js Official Deploying Documentation](https://nextjs.org/docs/app/getting-started/deploying) (HIGH confidence - official docs)
- [You don't need Vercel - Hosting Next.js 15 with Docker](https://www.reddit.com/r/nextjs/comments/1qdcxf8/you_dont_need_vercel_hosting_nextjs_15_with/) (LOW confidence - Reddit discussion)

---

## Korean/Asia-Specific Considerations

### Localization
- **Korean Error Messages**: All user-facing errors in Korean ✅ (already implemented)
- **Korean PDF Support**: ✅ Already implemented with Noto Sans KR font
- **Timezone Handling**: All timestamps in KST (Asia/Seoul)
- **Korean Name Sorting**: Database collation for Korean names

### Infrastructure
- **Local Deployment**: Many Korean academies prefer on-premise VPS
- **Compliance**: Consider Personal Information Protection Act (PIPA)
- **Data Residency**: Keep student data in South Korea if required by law

### Performance
- **CDN Selection**: Use Cloudflare or AWS CloudFront (both have Korea edge locations)
- **Database Hosting**: Local providers (Naver Cloud, AWS Seoul region) for lower latency

---

## Implementation Roadmap for v1.1

### Phase 1: Production Infrastructure (Week 1-2)
1. Docker Compose production configuration
2. Health check endpoint
3. Environment variables management
4. Database migration automation (CI/CD)

### Phase 2: Technical Debt Resolution (Week 2-3)
1. PDF storage migration (local → S3-compatible)
2. Code deduplication (fetchReportData)
3. Create missing VERIFICATION.md

### Phase 3: Performance Optimization (Week 3-4)
1. Query optimization (N+1 prevention)
2. Image optimization audit
3. Code splitting analysis
4. Basic performance monitoring

### Phase 4: Operations & Monitoring (Week 4-5)
1. Structured logging implementation
2. Error tracking (Sentry)
3. Database backup automation
4. SSL/TLS configuration

### Phase 5: Testing & Validation (Week 5-6)
1. End-to-end testing in production-like environment
2. Load testing (50-200 concurrent users)
3. Backup/restore testing
4. Deployment rollback testing

---

## Sources Summary

### Official Documentation (HIGH Confidence)
- [Next.js Production Checklist](https://nextjs.org/docs/app/guides/production-checklist) (Dec 2025)
- [Next.js Deploying Guide](https://nextjs.org/docs/app/getting-started/deploying) (Dec 2025)
- [Prisma Migrate Development and Production](https://www.prisma.io/docs/orm/prisma-migrate/workflows/development-and-production)
- [Next.js Lazy Loading Guide](https://nextjs.org/docs/app/guides/lazy-loading) (Oct 2025)
- [Next.js Package Bundling Optimization](https://nextjs.org/docs/app/guides/package-bundling) (Dec 2025)
- [Prisma Query Optimization Performance](https://www.prisma.io/docs/orm/prisma-client/queries/query-optimization-performance)
- [Sentry for Next.js](https://sentry.io/for/nextjs/)

### Community Resources (MEDIUM Confidence)
- [Next.js 15 Production Checklist](https://srivathsav.me/blog/nextjs-15-production-checklist) (Aug 2025)
- [How to Deploy a Next.js App in 2026](https://kuberns.com/blogs/post/deploy-nextjs-app/) (Nov 2025)
- [Next.js 15 Deployment, CI/CD & Hosting](https://javascript.plainenglish.io/next-js-15-deployment-ci-cd-hosting-like-a-devops-minimalist-c24e8019e91a) (Sep 2025)
- [Top 8 Next.js Development Best Practices In 2026](https://www.serviots.com/blog/nextjs-development-best-practices) (Nov 2025)
- [Zero Configuration NextJS Deployment with Kamal](https://ronald.ink/zero-configuration-nextjs-deployment-to-a-self-hosted-vps-with-kamal-a-comprehensive-guide/) (Oct 2025)
- [Why You Should Use Next.js for Your SaaS (2026 Guide)](https://makerkit.dev/blog/tutorials/why-you-should-use-nextjs-saas) (Jan 2026)
- [Build a Clean CI/CD Pipeline for Next.js with GitHub Actions](https://minhas309.medium.com/build-a-clean-ci-cd-pipeline-for-your-nextjs-app-using-github-actions-and-any-server-ee96eb32ecc2) (2025)
- [Deploying Your Next.js Application on AWS with GitHub Actions](https://heyvivek.com/deploying-your-nextjs-application-on-aws-with-github-actions-a-step-by-step-guide) (Feb 2025)
- [How to Add a Health Check Endpoint to Your Next.js App](https://hyperping.com/blog/nextjs-health-check-endpoint) (March 2025)
- [Observing and Debugging Next.js apps with Sentry](https://sentry.io/resources/workshop-nextjs-feb-2026/) (Feb 2026)
- [Optimizing Next.js for Maximum Performance](https://dev.to/devops-make-it-run/optimizing-nextjs-for-maximum-performance-3634) (Oct 2025)
- [Mastering Code Splitting in Next.js App Router](https://dev.to/ahr_dev/mastering-code-splitting-in-nextjs-app-router-2608) (Sep 2025)
- [Mastering Lazy Loading in Next.js 15](https://medium.com/@sureshdotariya/mastering-lazy-loading-in-nextjs-15-advanced-patterns-for-peak-performance-75e0bd574c76) (2025)
- [Next.js Containerization using Docker](https://medium.com/@redrobotdev/next-js-containerization-using-docker-73a32348917f)
- [Self-Host Next.js with Kamal and GitHub Actions](https://getdeploying.com/guides/deploy-nextjs) (Jan 2025)

### Vendor Documentation (LOW-MEDIUM Confidence)
- [Amazon S3 vs Local File System](https://documentation.censhare.com/classic/latest/Public/amazon-s3-vs-local-file-system)
- [Amazon S3 vs Local Storage](https://www.jscape.com/blog/amazon-s3-vs-local-storage-where-should-you-store-files-uploaded-to-your-file-transfer-server)
- [AWS Best Practices for File Gateway](https://docs.aws.amazon.com/filegateway/latest/files3/best-practices.html)
- [Best S3-Compatible Storage Providers: Top 5 Options in 2026](https://cloudian.com/guides/s3-storage/best-s3-compatible-storage-providers-top-5-options-in-2026/)

### Community Discussions (LOW Confidence)
- [How to Avoid N+1 Problems with Prisma](https://www.linkedin.com/posts/shohan-pherones_prisma-orm_backend-activity-7325160320967049216-SwfR)
- [View PDF stored on S3 in new tab](https://laracasts.com/discuss/channels/general-discussion/view-pdf-stored-on-s3-in-new-tab) (2025)
- [How to solve the N+1 problem in GraphQL with Prisma](https://dev.to/lagoni/how-to-solve-the-n-plus-1-problem-in-graphql-with-prisma-and-apollo-5923) (2023)
- [Prisma or TypeORM in 2026?](https://medium.com/@Nexumo_/prisma-or-typeorm-in-2026-the-nestjs-data-layer-call-ae47b5cfdd73)
- [Warning: Think twice before using Prisma in large projects](https://www.reddit.com/r/nextjs/comments/1i9zvyy/warning_think_twice_before_using_prisma_in_large/)
- [You don't need Vercel - Hosting Next.js 15 with Docker](https://www.reddit.com/r/nextjs/comments/1qdcxf8/you_dont_need_vercel_hosting_nextjs_15_with/)

### Performance & Monitoring (LOW-MEDIUM Confidence)
- [Web Performance Optimization in Next.js](https://strapi.io/blog/web-performance-optimization-in-nextjs) (Sep 2024)
- [8 Reasons Your Next.js App is Slow](https://blog.logrocket.com/fix-nextjs-app-slow-performance/) (June 2025)
- [OpenTelemetry Setup for Next.js Performance Monitoring](https://staarter.dev/blog/opentelemetry-setup-for-nextjs-performance-monitoring) (June 2024)
- [9 Best Next.js Monitoring Tools](https://cubeapm.com/blog/best-next-js-monitoring-tools/) (Oct 2025)
- [Next.js Bundle Analyzer Guide (Chinese)](https://blog.csdn.net/gitblog_00735/article/details/152356387) (Nov 2025)
- [How to Analyze and Optimize Bundle Size](https://juejin.cn/post/7551988176652091430) (Sep 2025)

### Project-Specific Sources
- AI AfterSchool v1.0 Codebase Analysis (direct inspection, 2026-01-30)
- v1.0 Milestone Audit (`.planning/milestones/v1.0-MILESTONE-AUDIT.md`)
- Project Documentation (`.planning/PROJECT.md`)

---

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| **Deployment Features** | **HIGH** | Official Next.js/Prisma docs + verified community sources |
| **Performance Optimization** | **HIGH** | Official Next.js docs + recent 2025-2026 tutorials |
| **Technical Debt Patterns** | **MEDIUM** | Based on codebase analysis + general best practices |
| **PDF Storage Solutions** | **HIGH** | Direct code inspection + AWS S3 documentation |
| **Database Migrations** | **HIGH** | Official Prisma documentation (very clear guidance) |
| **Docker Deployment** | **MEDIUM-HIGH** | Docker official docs + verified community guides |
| **CI/CD Pipelines** | **MEDIUM** | Multiple verified GitHub Actions tutorials |
| **Monitoring & Logging** | **MEDIUM** | Sentry official docs + community best practices |
| **Korean/Asia Considerations** | **LOW** | Based on general knowledge, not region-specific sources |

**Overall Confidence: HIGH**

Research based on:
- **Official documentation** (Next.js, Prisma, Sentry) - HIGH confidence
- **Verified 2025-2026 community resources** - MEDIUM-HIGH confidence
- **Direct codebase inspection** - HIGH confidence for project-specific findings
- **General best practices** - MEDIUM confidence for patterns not specifically documented

**LOW confidence items** (marked for validation):
- Korean/Asia-specific infrastructure considerations
- Some vendor documentation (S3 vs local storage)
- Community discussion threads (Reddit, Stack Overflow)

---

## Quality Gate Checklist

- [x] **Categories are clear** (table stakes vs differentiators vs anti-features)
- [x] **Complexity noted for each feature** (Low/Medium/High + implementation notes)
- [x] **Dependencies between features identified** (Dependency tree diagram included)
- [x] **MVP recommendation provided** (Phased approach with P1/P2/P3 priorities)
- [x] **Market positioning analyzed** (Self-hosted vs managed platforms comparison)
- [x] **Sources documented** (Multiple official and community sources with URLs)
- [x] **Anti-features justified** (Clear explanation of why to avoid for 50-200 student scale)
- [x] **Technical debt catalogued** (v1.0 audit findings with prioritization)
- [x] **Implementation roadmap provided** (6-week phased approach for v1.1)
- [x] **Korean/Asia considerations addressed** (Localization, compliance, performance)

---

**Research Complete**

All four research domains (deployment, performance, technical debt, operations) have been investigated with comprehensive findings documented. Ready for roadmap creation phase.

**Next Steps:**
1. Review this features research with project stakeholder
2. Prioritize P1 features for v1.1 milestone
3. Create detailed phase plans for each P1 feature
4. Begin implementation following the 6-week roadmap

---

*Feature research for: AI AfterSchool v1.1 Production Readiness*
*Researched: 2026-01-30*
*Confidence: HIGH*
