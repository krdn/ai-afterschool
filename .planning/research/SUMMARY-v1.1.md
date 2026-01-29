# Project Research Summary - v1.1 Production Readiness

**Project:** AI AfterSchool - 학생 관리 시스템 with AI 성향 분석
**Domain:** Production deployment, performance optimization, technical debt resolution
**Milestone:** v1.1 Production Readiness (Subsequent to v1.0 MVP)
**Researched:** 2026-01-30
**Confidence:** HIGH

## Executive Summary

AI AfterSchool v1.1 is a **production readiness milestone** for an existing, well-architected Next.js application (11,451 lines of TypeScript, 98/100 integration health). The research focuses on transforming a development environment into a production deployment suitable for a single-organization deployment (50-200 students) on a home server (192.168.0.5).

The recommended approach emphasizes **simplicity over sophistication**: avoid over-engineering for this scale. Use Docker Compose with Caddy for automatic SSL, MinIO for S3-compatible PDF storage, Prisma connection pooling for database efficiency, and Sentry for error tracking. The research identifies two critical blockers from v1.0: (1) PDFs stored on local filesystem break in containerized deployments, and (2) code duplication in `fetchReportData` creates maintenance burden.

Key risks include environment variable leakage in Docker images, database connection pool exhaustion under concurrent load, N+1 query problems hidden by small development datasets, and timezone inconsistencies between KST and UTC. Mitigation strategies include proper `.dockerignore` configuration, Prisma singleton patterns, query optimization with `include`, and explicit timezone handling throughout the stack.

## Key Findings

### Recommended Stack

From STACK.md, the v1.0 stack (Next.js 15, Prisma, PostgreSQL, Cloudinary, @react-pdf/renderer) is validated. Additions for production:

**Core production infrastructure:**
- **Caddy 2.8+**: Reverse proxy with automatic SSL — simpler than Nginx for single-app deployments, zero-downtime reloads, eliminates manual SSL renewal
- **MinIO (latest)**: S3-compatible object storage for PDF files — self-hosted, full S3 API compatibility, cost-effective for single org vs AWS S3/Cloudflare R2 at this scale
- **Redis 7.2+**: Caching layer — reduces database load, improves response times for frequently accessed data like student reports
- **@sentry/nextjs 9.x**: Error tracking & performance monitoring — production-grade error monitoring with source map support for Next.js 15

**Development tools:**
- **Docker Compose**: Production orchestration — sufficient for single-server deployment, simpler than Kubernetes for 50-200 users
- **ioredis**: Redis client for Node.js — use with Redis for caching layer
- **MinIO SDK**: Object storage client — use for PDF storage operations

### Expected Features

From FEATURES.md, v1.1 focuses on production deployment, performance optimization, and technical debt resolution.

**Must have (P1 - Production Deployment):**
- **Docker Compose Production Environment** — Containerized deployment with health checks, zero-downtime deployment capability
- **Database Migration Automation** — `prisma migrate deploy` in CI/CD pipeline, prevents manual schema change errors
- **Health Check Endpoint** — `/api/health` for liveness/readiness probes, required by Docker healthchecks
- **PDF Storage Migration** — Move from local to S3-compatible storage (MinIO), breaks in containers otherwise
- **Query Optimization** — Fix N+1 problems with Prisma `include`, optimize for scale
- **Environment Variables Management** — Separate dev/staging/production configs, prevent secret leakage
- **Basic Error Tracking** — Sentry integration for error aggregation in production
- **Database Backup Automation** — Automated `pg_dump` with retention policy, prevent data loss

**Should have (P2 - Performance & Operations):**
- **Structured Logging** — JSON-based logs with request ID tracing for debugging production issues
- **Performance Monitoring** — Core Web Vitals tracking, slow query identification
- **Code Splitting Optimization** — Bundle analysis and lazy loading, reduce initial bundle size
- **Parallel Data Fetching** — Eliminate sequential query waterfalls with `Promise.all()`

**Defer (P3 - v2+ Future Consideration):**
- **Redis Caching Layer** — Only if Next.js built-in cache insufficient for scale
- **Advanced Performance Monitoring** — Full APM with distributed tracing only if performance issues arise
- **CDN for PDFs** — Multi-region only if international expansion required

### Architecture Approach

From ARCHITECTURE.md, the production architecture expands the existing 3-tier Next.js application with containerization, monitoring, and storage abstraction layers.

**Major components:**
1. **Reverse Proxy (Caddy/Nginx)** — SSL termination, static file serving, security headers, HTTP-to-HTTPS redirects
2. **Next.js App (Standalone Mode)** — Application logic with Server Components, Server Actions, Route Handlers; connection pooling configured
3. **PostgreSQL + Prisma** — Structured data storage with ACID transactions; connection pooling (`connection_limit=10`) for production concurrency
4. **MinIO/S3 Storage** — PDF file storage with persistent data; S3-compatible API with presigned URLs for secure access
5. **Monitoring (Sentry)** — Error tracking, performance monitoring, source map upload for readable stack traces
6. **Health Check Endpoint** — Container health monitoring with DB/storage connectivity checks

**Key architectural patterns:**
- **Storage Abstraction Layer**: Interface-based design supporting both local (dev) and S3/MinIO (prod) storage backends
- **Connection Pooling**: Prisma singleton pattern with configured connection limits to prevent pool exhaustion
- **Reverse Proxy Termination**: Caddy/Nginx handles SSL, compression, static assets before Next.js

### Critical Pitfalls

From PITFALLS.md, the top production-readiness pitfalls:

1. **Environment Variable Leakage in Docker Images** — Use `.dockerignore` to exclude `.env*` files, never hardcode secrets in Dockerfile with `ENV`, verify with `docker history --no-trunc <image>` to check for exposed secrets

2. **Database Connection Pool Exhaustion** — Implement Prisma singleton pattern, configure `connection_limit=10` for Docker environments, monitor with `pg_stat_activity` to detect idle connection accumulation

3. **N+1 Query Problems Not Caught in Development** — Small dev datasets hide performance issues; use Prisma `include` for eager loading, enable query logging in development to detect patterns, verify with `EXPLAIN ANALYZE` before production

4. **Image Optimization Not Working in Production** — Configure `images.remotePatterns` in `next.config.js` for external domains (Cloudinary), ensure `sharp` native module installs correctly in Docker (`apk add vips-dev`), verify optimized image sizes <100KB in production Network tab

5. **Timezone Handling (KST vs UTC)** — Store all timestamps in UTC in database with `timestamptz` type, convert to KST (`Asia/Seoul`) in UI layer, test with birthdate-based saju calculations to verify correctness

## Implications for Roadmap

Based on research, suggested phase structure for v1.1:

### Phase 1: Production Infrastructure Foundation

**Rationale:** Deployment infrastructure must exist before performance optimization can be measured. PDF storage migration is a critical blocker that breaks in containers.

**Delivers:**
- Docker Compose production configuration with multi-stage builds
- Caddy reverse proxy with automatic SSL
- MinIO S3-compatible storage for PDFs
- Health check endpoint (`/api/health`)
- Environment variable management with `.dockerignore`

**Addresses:**
- Docker Compose Production Environment (P1)
- PDF Storage Migration (P1)
- Health Check Endpoint (P1)
- Environment Variables Management (P1)

**Avoids:**
- Environment variable leakage (Pitfall #1)
- PDF data loss in containerized deployments (ARCHITECTURE critical blocker)

**Research Flags:**
- **MinIO setup:** Standard S3 API, but Docker volume persistence needs local testing
- **Caddy SSL:** Automatic HTTPS is well-documented, but DNS configuration varies by hosting

### Phase 2: Performance & Database Optimization

**Rationale:** Once infrastructure is stable, optimize data access patterns. Performance monitoring from Phase 1 will identify bottlenecks.

**Delivers:**
- Database migration automation with `prisma migrate deploy`
- Prisma connection pooling configuration
- Query optimization (N+1 prevention with `include`)
- Database indexes for common query patterns
- Basic performance monitoring setup

**Addresses:**
- Database Migration Automation (P1)
- Query Optimization (P1)
- Performance Monitoring (P2)

**Uses:**
- Prisma connection pooling (STACK.md)
- Query optimization patterns (ARCHITECTURE.md)

**Avoids:**
- Database connection pool exhaustion (Pitfall #2)
- N+1 query problems (Pitfall #3)

**Research Flags:**
- **Query optimization:** Well-documented Prisma patterns, but specific query patterns need codebase analysis
- **Index strategy:** Standard PostgreSQL practice, but depends on actual query workload

### Phase 3: Technical Debt Resolution & Monitoring

**Rationale:** With stable infrastructure and optimized queries, resolve code duplication and add production monitoring.

**Delivers:**
- Code deduplication (extract `fetchReportData` to shared `lib/db/reports.ts`)
- Sentry error tracking with source maps
- Structured logging implementation
- Database backup automation with cron

**Addresses:**
- Code Deduplication (P1 technical debt)
- Basic Error Tracking (P1)
- Structured Logging (P2)
- Database Backup Automation (P1)

**Uses:**
- Sentry integration (STACK.md)
- Storage abstraction layer (ARCHITECTURE.md)

**Avoids:**
- Maintenance burden from duplicated code (PITFALLS.md Pattern #1)
- Missing production errors (lack of monitoring)

**Research Flags:**
- **Sentry setup:** Official Next.js integration wizard, but source map upload needs CI/CD configuration
- **Backup strategy:** Standard `pg_dump` practice, but retention policy needs business requirements

### Phase 4: Validation & Load Testing

**Rationale:** Verify production readiness under realistic load before declaring v1.1 complete.

**Delivers:**
- End-to-end testing in production-like environment
- Load testing (50-200 concurrent users)
- Backup/restore testing
- Deployment rollback testing
- Lighthouse audit for performance metrics

**Addresses:**
- All P1 features verification
- Performance validation under load
- Recovery procedure testing

**Avoids:**
- Production surprises (all pitfalls)
- Deployment failures (missing health checks, rollback procedures)

**Research Flags:**
- **Load testing:** Standard tools (k6, artillery), but test scenarios need to match actual usage patterns
- **Performance targets:** Lighthouse scores are standard, but specific thresholds depend on user expectations

### Phase Ordering Rationale

- **Infrastructure first:** Docker deployment, PDF storage, and health checks are foundational. Performance optimization requires stable infrastructure to measure improvements.
- **Database before code:** Query optimization and connection pooling must happen before code deduplication to avoid optimizing code that accesses data inefficiently.
- **Monitoring before validation:** Sentry and logging must be in place during load testing to capture issues that only appear under concurrent load.
- **Debt cleanup last:** Code deduplication is lower priority than infrastructure blockers and can be done safely once the application is stable.

**How this avoids pitfalls:**
- Phase 1 prevents environment variable leakage and PDF data loss with proper Docker configuration
- Phase 2 prevents connection pool exhaustion and N+1 queries with proper database configuration
- Phase 3 prevents missing production errors with Sentry integration
- Phase 4 validates all mitigations work under realistic load

### Research Flags

**Phases likely needing deeper research during planning:**
- **Phase 1 (PDF Migration):** MinIO setup is standard, but migration script for existing PDFs needs data volume analysis. Current PDF count and storage size unknown.
- **Phase 2 (Query Optimization):** Prisma `include` patterns are well-documented, but specific N+1 issues depend on actual query patterns in codebase. Needs codebase audit before optimization.
- **Phase 4 (Load Testing):** Tools are standard (k6, artillery), but realistic test scenarios require understanding actual teacher workflows (simultaneous report generation, student list loads, etc.).

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Docker Compose):** Well-documented Docker Compose patterns, Caddy automatic SSL is standard
- **Phase 3 (Sentry):** Official Next.js integration wizard, well-documented source map upload
- **Phase 3 (Backup Automation):** Standard `pg_dump` with cron, PostgreSQL best practices

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack (Production Infrastructure) | **HIGH** | Verified with official Caddy, MinIO, Docker documentation; 2025-2026 sources confirm patterns |
| Features (Production Readiness) | **HIGH** | Next.js official production checklist, Prisma deployment docs, recent community guides |
| Architecture (Container Deployment) | **HIGH** | Docker Compose multi-container architecture is well-established; storage abstraction pattern is standard |
| Pitfalls (Production Deployment) | **MEDIUM-HIGH** | Docker/DB pitfalls verified with official sources; Korean-specific pitfalls (timezone, fonts) need local validation |

**Overall confidence:** HIGH

Research based on:
- **Official documentation** (Next.js, Prisma, Docker, Caddy, Sentry) — HIGH confidence
- **Verified 2025-2026 community resources** — MEDIUM-HIGH confidence
- **Direct v1.0 codebase analysis** — HIGH confidence for project-specific findings

### Gaps to Address

**Known gaps requiring validation during planning/execution:**

- **PDF migration scope:** Current PDF count and total storage size unknown. Migration script needs data volume analysis. Handle during Phase 1 planning with filesystem scan.

- **Query optimization targets:** Specific N+1 query patterns unknown without codebase audit. Handle during Phase 2 planning with Prisma query logging enabled in staging first.

- **Load testing scenarios:** Realistic teacher workflows (simultaneous report generation, student list loads) not documented. Handle during Phase 4 planning with stakeholder consultation.

- **Korean font rendering:** Noto Sans KR FOUT/CLS issues identified in PITFALLS.md but LOW confidence. Handle during Phase 2 planning with local testing using WebPageTest.

- **Timezone data migration:** Existing data may have mixed UTC/KST timestamps. Handle during Phase 1 planning with database audit for timezone consistency.

## Sources

### Primary (HIGH confidence)

**Official Documentation:**
- [Next.js Production Checklist](https://nextjs.org/docs/app/guides/production-checklist) — Production optimization guide (Dec 2025)
- [Next.js Deploying Documentation](https://nextjs.org/docs/app/getting-started/deploying) — Deployment strategies (Dec 2025)
- [Prisma Migrate Development and Production](https://www.prisma.io/docs/orm/prisma-migrate/workflows/development-and-production) — Migration automation
- [Prisma Connection Pooling](https://www.prisma.io/docs/postgres/database/connection-pooling) — Connection pool configuration
- [Prisma Query Optimization](https://www.prisma.io/docs/orm/prisma-client/queries/query-optimization-performance) — N+1 prevention
- [Next.js Data Security Guide](https://nextjs.org/docs/app/guides/data-security) — Security patterns (Dec 2025)
- [Sentry for Next.js](https://sentry.io/for/nextjs/) — Error tracking integration

**Deployment Guides:**
- [Production NextJS 15: The Complete Self-Hosting Guide](https://ketan-chavan.medium.com/production-nextjs-15-the-complete-self-hosting-guide-f1ff03f782e7) — Comprehensive production setup (2025)
- [Dockerizing a Next.js Application in 2025](https://medium.com/front-end-world/dockerizing-a-next-js-application-in-2025-bacdca4810fe) — Modern Docker practices
- [Building a File Storage With Next.js, PostgreSQL, and Minio S3](https://blog.alexefimenko.com/posts/file-storage-nextjs-postgres-s3) — S3 integration patterns

**Security:**
- [Complete Next.js Security Guide 2025](https://www.turbostarter.dev/blog/complete-nextjs-security-guide-2025-authentication-api-protection-and-best-practices) — Server Actions security
- [Next.js CVE-2025-29927 Authorization Bypass](https://www.akamai.com/blog/security-research/march-authorization-bypass-critical-nextjs-detections-mitigations) — Middleware-only auth vulnerability

### Secondary (MEDIUM confidence)

**Performance Optimization:**
- [8 Reasons Your Next.js App is Slow — And How to Fix Them](https://blog.logrocket.com/fix-nextjs-app-slow-performance/) — Performance troubleshooting (June 2025)
- [The Ultimate Guide to Improving Next.js TTFB Slowness](http://www.catchmetrics.io/blog/the-ultimate-guide-to-improving-nextjs-ttfb-slowness-from-800ms-to-less100ms) — Database latency optimization
- [Database Connection Pooling in Production: Real-World Tuning](https://medium.com/codetodeploy/database-connection-pooling-in-production-real-world-tuning-that-actually-works-0b6d8e12195b) — Pool exhaustion monitoring

**Docker & Infrastructure:**
- [Security Advice for Self-Hosting Next.js in Docker - Arcjet](https://blog.arcjet.com/security-advice-for-self-hosting-next-js-in-docker/) — Environment variable security
- [NextJS on Docker: Managing Environment Variables - Arity Labs](https://aritylabs.com/nextjs-on-docker-managing-environment-variables-across-different-environments-972b34a76203) — Runtime vs build-time env vars
- [How to Run PostgreSQL in Docker with Persistent Data](https://oneuptime.com/blog/post/2026-01-16-docker-postgresql-persistent/view) — Volume management (Jan 2026)

**Korean-Specific:**
- [Next.js Date & Time Localization Guide](https://staarter.dev/blog/nextjs-date-and-time-localization-guide) — KST/UTC handling patterns
- [Handling Time Zone in JavaScript - TOAST UI Medium](https://toastui.medium.com/handling-time-zone-in-javascript-547e67aa842d) — KST = UTC+09:00 conversion

### Tertiary (LOW confidence, needs validation)

**Community Discussions:**
- [I Had Enough of the Breaking Changes! - Reddit](https://www.reddit.com/r/nextjs/comments/1i8qmst/i_had_enough_of_the-breaking-changes/) — Technical debt accumulation
- [Why You Should Consider MinIO Over AWS S3](https://www.reddit.com/r/devops/comments/1kgy054/why_you_should_consider_minio_over_aws_s3_how_to/) — Self-hosted vs cloud storage
- [You don't need Vercel - Hosting Next.js 15 with Docker](https://www.reddit.com/r/nextjs/comments/1qdcxf8/you_dont_need_vercel_hosting_nextjs_15_with/) — Self-hosting validation

**Project-Specific Sources:**
- AI AfterSchool v1.0 Codebase Analysis (direct inspection, 2026-01-30) — 11,451 lines of TypeScript, identified PDF storage and code duplication issues
- v1.0 Milestone Audit (`.planning/milestones/v1.0-MILESTONE-AUDIT.md`) — Integration health score 98/100
- Project Documentation (`.planning/PROJECT.md`) — 50-200 student scale target

---
*Research completed: 2026-01-30*
*Ready for roadmap: yes*
