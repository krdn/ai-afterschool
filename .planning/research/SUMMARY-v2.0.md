# Project Research Summary

**Project:** AI AfterSchool v2.0 - Teacher Management & Multi-LLM Support
**Domain:** Academy Management System with Teacher-Student Compatibility Analysis
**Researched:** 2026-01-30
**Confidence:** HIGH

## Executive Summary

AI AfterSchool v2.0 is an academy management system that extends the existing single-teacher platform to support multiple teachers, team-based access control, and AI-powered teacher-student compatibility matching. The recommended approach builds on the existing Next.js 15 + Prisma + PostgreSQL foundation, adding **Vercel AI SDK for multi-LLM integration**, **Prisma middleware for role-based access control**, and **weighted matching algorithms** for teacher-student compatibility analysis.

The research identifies three critical risks: (1) **data leakage** between teams without proper access controls, (2) **migration failures** when adding team foreign keys to existing student data, and (3) **algorithmic bias** in AI-based compatibility matching. These are mitigated through Prisma middleware with PostgreSQL RLS, NOT VALID constraints for zero-downtime migration, and fairness metrics with human-in-the-loop validation.

The core differentiator is **AI-powered teacher-student compatibility analysis** combining MBTI personality types, traditional Korean saju (four pillars), and learning styles to recommend optimal teacher-student pairings. This is supported by an LLM router that provides failover across Claude, Gemini, ChatGPT, and local Ollama models for cost optimization and reliability.

## Key Findings

### Recommended Stack

**From STACK.md — v2.0 extends the existing stack with multi-LLM and RBAC capabilities:**

**Core technologies:**
- **Vercel AI SDK (^3.x)**: Multi-provider LLM integration with unified interface — supports 25+ providers including Claude, Gemini, OpenAI, Ollama with 2M+ weekly downloads, enabling model switching without code changes
- **Prisma Middleware + RLS**: Team-based data isolation — automatic query filtering by teamId with role-based access (Director > Team Leader > Manager > Teacher) enforced at database level
- **Recharts (^2.x)**: Performance analytics visualization — React-native charts for teacher performance dashboards with smaller bundle size than Chart.js
- **Custom Weighted Algorithm**: Teacher-student compatibility scoring — transparent, tunable weights for MBTI (25%), saju (20%), learning styles (25%), workload (15%), name analysis (15%)

**Key integration points:**
- Existing Claude API wrapped as provider in Vercel AI SDK for backward compatibility
- Ollama local LLM at 192.168.0.5:11434 for cost-effective inference with Claude fallback
- Session management extended to include role and teamId in JWT

### Expected Features

**From FEATURES.md — feature landscape for multi-teacher academy management:**

**Must have (table stakes):**
- **Teacher Information Management** — Basic CRUD for teachers with team assignment, photos, contact info (expected in all management systems)
- **Role-Based Access Control** — Four-tier hierarchy (Director, Team Leader, Manager, Teacher) with team-scoped data access (critical for multi-user security)
- **Student Assignment Management** — Manual teacher-student assignment with workload balancing (foundational for matching features)
- **Teacher Performance Tracking** — Student grade changes, counseling history, performance reports (expected for teacher evaluation)
- **Multi-LLM Configuration** — Provider registration, API key management, failover handling (required for AI reliability)

**Should have (competitive differentiators):**
- **Teacher Personality Analysis** — MBTI, saju, name analysis matching student analysis (enables compatibility calculation)
- **Teacher-Student Compatibility Analysis** — Multi-factor scoring with MBTI/saju/learning style compatibility (unique market differentiation)
- **AI-Based Automatic Assignment** — Compatibility-score-based recommendations with workload balancing (core value proposition)
- **Team Composition Analysis** — Team diversity metrics, expertise coverage, performance comparison (management insights)
- **Student-Specific Teacher Recommendation** — Personalized teacher rankings with explanation (decision support)

**Defer (v2.1+):**
- **Multi-Academy Franchise Management** — Single-academy focus first, franchise requires separate architecture
- **Real-Time Chat/Messaging** — External tools (KakaoTalk) sufficient, WebSocket complexity not justified
- **Predictive Analytics** — Requires more data than 50-200 students provide, ML deferred until data accumulation

### Architecture Approach

**From ARCHITECTURE.md — extends existing patterns with teacher management and multi-LLM support:**

**Major components:**
1. **LLM Provider Router** — Adapter pattern with unified interface for Claude/Ollama/Gemini/OpenAI, automatic failover and cost-based routing
2. **Team-Based Data Isolation** — Prisma middleware automatic query filtering by teamId, role-based access control guards in all Server Actions
3. **Compatibility Analysis Module** — Reusable algorithm combining existing student analysis modules with teacher personality data
4. **Teacher Management System** — Mirrors student CRUD patterns, extends existing analysis modules for teacher personality profiling
5. **Access Control Layer** — Middleware + Server Action guards with `verifySessionWithTeam()` and `buildTeamAccessFilter()`

**Key architectural patterns:**
- **Provider Adapter Pattern**: LLM providers implement unified interface, new providers added without changing calling code
- **Reusable Analysis Modules**: Student MBTI/saju/name analysis modules reused for teachers to ensure consistency
- **Defense in Depth**: Authentication checked at middleware, API routes, and Server Actions to prevent bypass vulnerabilities

### Critical Pitfalls

**From PITFALLS.md — top 5 critical risks for v2.0 implementation:**

1. **Data Leakage (Critical)** — Cross-team data access without proper isolation
   - **Prevention**: Prisma middleware for automatic query filtering + PostgreSQL RLS for database-level enforcement + API route permission checks
   - **Phase**: 11 (Teacher Infrastructure)

2. **Migration Foreign Key Failures (Critical)** — Adding teamId to existing student table causes orphaned record errors
   - **Prevention**: Use NOT VALID constraint option + phased migration (nullable column → data migration → FK with NOT VALID → validate)
   - **Phase**: 11 (Database Schema Changes)

3. **Next.js Middleware-Only Authentication (Critical)** — Relying solely on middleware allows bypass
   - **Prevention**: Defense in Depth — middleware + Server Action guards + page-level checks, never trust middleware alone
   - **Phase**: 11 (RBAC Implementation)

4. **AI Algorithm Bias (High)** — Compatibility analysis may disadvantage certain student demographics
   - **Prevention**: Fairness metrics (ABROCA, Disparity Index), exclude protected attributes, human-in-the-loop approval, explainability
   - **Phase**: 13 (Compatibility Analysis)

5. **Multi-LLM Cost Explosion (High)** — Untracked API usage and rate limits cause budget overruns
   - **Prevention**: LLM Gateway with token tracking, cost alerts, smart routing (cheap-first with fallback), queue system for long jobs
   - **Phase**: 15 (Multi-LLM Integration)

## Implications for Roadmap

Based on research, suggested phase structure for v2.0:

### Phase 11: Teacher Infrastructure & Access Control
**Rationale:** Foundation must come first — all features depend on secure data isolation and teacher entity existence. Critical security vulnerabilities (data leakage) addressed here.
**Delivers:** Teacher CRUD, team management, RBAC with Prisma middleware, PostgreSQL RLS, session extension with role/teamId
**Addresses:** Teacher Information Management, Role-Based Access Control, Student Assignment (manual)
**Avoids:** Data leakage, middleware-only authentication, FK migration failures

### Phase 12: Teacher Analysis & Team Data Access
**Rationale:** Teacher personality data required for compatibility analysis. Reuses existing student analysis modules for consistency.
**Delivers:** Teacher MBTI/saju/name analysis, team-based query optimization (N+1 prevention), teacher profile pages
**Uses:** Existing analysis modules (mbti-scoring, saju, name-numerology), TanStack Table for teacher lists
**Implements:** Reusable Analysis Modules pattern, Team-Based Data Isolation
**Avoids:** Prisma N+1 queries, duplicate analysis code

### Phase 13: Compatibility Analysis & Matching
**Rationale:** Core differentiator — requires both teacher and student data available. This is the primary value-add feature.
**Delivers:** Compatibility scoring algorithm (weighted: MBTI 25%, saju 20%, learning styles 25%, workload 15%, name 15%), compatibility reports, teacher-student matching UI
**Uses:** Recharts for compatibility visualization, custom algorithm with transparent weights
**Implements:** Compatibility Analysis Module, fairness metrics for bias detection
**Avoids:** Algorithmic bias, lack of explainability

### Phase 14: Performance Analytics & Team Insights
**Rationale:** Requires compatibility analysis data and teacher performance history. Management-focused features after core functionality.
**Delivers:** Teacher performance dashboards, team composition analysis, student grade tracking, counseling history
**Uses:** Prisma Aggregation for server-side calculations, Recharts for visualization, date-fns for period metrics
**Implements:** Performance tracking with multi-dimensional metrics (not just grades)
**Avoids:** Single-metric bias, unfair teacher evaluation

### Phase 15: Multi-LLM Integration & Smart Routing
**Rationale:** Technical enhancement after core features proven. Reduces costs and improves reliability for all AI operations.
**Delivers:** LLM Provider Router with failover, cost tracking dashboard, smart routing (Ollama first → Claude fallback), API key management UI
**Uses:** Vercel AI SDK for unified interface, environment variables for provider configuration
**Implements:** LLM Gateway pattern, token usage tracking, cost alerts
**Avoids:** Cost explosion, rate limiting issues, vendor lock-in

### Phase Ordering Rationale

- **Security-first approach**: RBAC and data isolation (Phase 11) must precede any feature development to prevent embedding insecure patterns
- **Dependency-driven**: Compatibility analysis (Phase 13) requires both teacher (Phase 12) and student (existing) data, team insights (Phase 14) require compatibility data
- **Risk mitigation**: Critical pitfalls addressed early (data leakage in Phase 11, algorithmic bias in Phase 13, cost control in Phase 15)
- **Value delivery**: Core differentiator (compatibility matching) delivered in Phase 13, after foundation but before advanced features
- **Technical debt prevention**: LLM abstraction (Phase 15) refactors existing Claude calls, preventing vendor lock-in before scale

### Research Flags

**Phases likely needing deeper research during planning:**
- **Phase 13 (Compatibility Analysis):** Korean saju compatibility algorithms lack academic validation — need domain expert (명리학) consultation for weight tuning
- **Phase 15 (Multi-LLM):** Ollama integration in Docker environment requires network testing from 192.168.0.5:11434 — verify host.docker.internal access before implementation

**Phases with standard patterns (skip research-phase):**
- **Phase 11 (RBAC):** Prisma middleware + PostgreSQL RLS well-documented, Next.js multi-tenant patterns established
- **Phase 12 (Teacher CRUD):** Mirrors existing student patterns, Server Actions + Prisma standard approach
- **Phase 14 (Analytics):** Prisma Aggregation + Recharts standard stack, similar to existing student dashboards

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Vercel AI SDK official docs verified (2M+ weekly downloads), Prisma middleware patterns from official documentation, Recharts React 19 compatibility confirmed |
| Features | MEDIUM-HIGH | Teacher management features HIGH (established patterns), compatibility analysis MEDIUM (Korean saju lacks academic validation), multi-LLM management HIGH (One-API pattern proven) |
| Architecture | HIGH | Based on existing codebase analysis — all patterns verified against current implementation, LLM Provider Adapter pattern standard practice, RBAC architecture well-documented |
| Pitfalls | HIGH | Multi-tenant data leakage verified against CVE-2024-10976, Next.js middleware bypass confirmed in security disclosures, PostgreSQL migration pitfalls from official DBA resources |

**Overall confidence:** HIGH

### Gaps to Address

- **Korean saju compatibility validation**: Saju (four pillars) element compatibility weights lack academic research — handle by consulting domain expert during Phase 13 planning, make weights tunable by admin
- **Ollama Docker network access**: Unclear if Docker containers can reach 192.168.0.5:11434 — handle by testing network connectivity in Phase 15 research, document host.docker.internal configuration
- **Algorithmic fairness thresholds**: Specific fairness metric targets (ABROCA < 0.1, Disparity Index < 0.05) untested for this domain — handle by establishing baseline in Phase 13, monitor and adjust based on real outcomes

## Sources

### Primary (HIGH confidence)
- [Vercel AI SDK Documentation](https://vercel.com/docs/ai-sdk) — Multi-provider integration, 25+ providers, unified interface (official docs)
- [Prisma Middleware Documentation](https://www.prisma.io/docs/concepts/components/prisma-middleware) — Query filtering, multi-tenancy patterns (official docs)
- [Next.js Multi-Tenant Guide](https://nextjs.org/docs/app/guides/multi-tenant) — Official patterns for multi-tenant Next.js applications (April 15, 2025)
- [PostgreSQL Row-Level Security](https://www.techbuddies.io/2026/01/01/how-to-implement-postgresql-row-level-security-for-multi-tenant-saas/) — RLS implementation for data isolation
- [Ollama OpenAI Compatibility](https://ollama.com/blog/openai-compatibility) — OpenAI-compatible API for local LLMs (official)
- [Existing codebase analysis](/mnt/data/projects/ai/ai-afterschool) — Current Prisma schema, Server Actions patterns, session management, middleware

### Secondary (MEDIUM confidence)
- [Multi-Tenant Authorization with RBAC](https://medium.com/@gskiran526/building-a-multi-tenant-authorization-service-with-dynamic-hierarchical-rbac-my-startup-journey-763d92e776fa) — Hierarchical RBAC patterns (2025)
- [Teacher Assignment Problem Solutions](https://ink.library.smu.edu.sg/context/sis_research/article/5005/viewcontent/Solving_the_Teacher_Assignment_Problem_b.pdf) — Academic research on teacher-student matching algorithms
- [Self-Optimizing Teacher and Auto-Matching Student Model](https://dl.acm.org/doi/10.1145/3718091) — AI-based matching with transformer encoders (ACM DL)
- [Algorithmic Bias in Education](https://link.springer.com/article/10.1007/s40593-021-00285-9) — Fairness metrics for educational AI (1,126 citations, Springer 2021)
- [Navigating Fairness, Bias, and Ethics in Educational AI](https://arxiv.org/html/2407.18745v1) — Ethical considerations for AI matching (arXiv 2024)
- [How an LLM Gateway Can Help You Build Better AI Applications](https://dev.to/kuldeep_paul/how-an-llm-gateway-can-help-you-build-better-ai-applications-27hf) — LLM Gateway patterns (Dev.to Dec 2025)

### Tertiary (LOW confidence, needs validation)
- **Saju compatibility algorithms**: Traditional Korean fortune-telling lacks peer-reviewed validation — requires domain expert consultation
- **MBTI compatibility research**: Western-centric, may not apply to Korean educational context — cultural validation needed
- **Ollama Docker networking**: Limited production documentation on Docker host access — requires practical testing

---
*Research completed: 2026-01-30*
*Ready for roadmap: yes*
