# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-30)

**Core value:** 학생 정보 통합 관리를 기반으로 AI 성향 분석 및 맞춤형 학습/진로 제안 제공
**Current focus:** Phase 11 - Teacher Infrastructure & Access Control

## Current Position

Phase: 11 of 15 (Teacher Infrastructure & Access Control)
Plan: 6 of 7 in current phase
Status: In progress
Last activity: 2026-01-30 — Completed 11-06-PLAN.md (Teacher Detail Page)

Progress: [███████████████░░░░░░░░░░░] 75.86%

## Performance Metrics

**Velocity:**
- Total plans completed: 61
- Average duration: ~5 min
- Total execution time: ~5 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1-7 (v1.0) | 36 | 254 min | ~7 min |
| 8-10 (v1.1) | 22 | ~102 min | ~5 min |
| 11 (v2.0) | 3 | 9 min | ~3 min |

**Recent Trend:**
- Last 5 plans: Teacher Detail Page, Teacher List UI, Teacher CRUD API, Prisma Extensions + RLS, Database backup
- Trend: Stable (v2.0 execution progressing)

*Updated after 11-06 completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [11-01] Role enum with default TEACHER for zero-downtime migration - Existing teachers get TEACHER role, promoted later by admin
- [11-01] Nullable teamId on Teacher/Student for gradual team rollout - Teams assigned in future plans without schema changes
- [11-01] FK with ON DELETE SET NULL for referential integrity - Prevents orphaned records when Team deleted
- [11-02] Prisma Client Extensions over deprecated Middleware - $allOperations pattern for automatic teamId filtering
- [11-02] PostgreSQL RLS with quoted identifiers for case sensitivity - "teamId" vs teamid to prevent folding
- [11-02] Defense in Depth: App-layer (Prisma Extensions) + DB-layer (RLS) for tenant isolation
- [11-03] verifySession as RLS entry point - All DB queries must go through verifySession which calls setRLSSessionContext
- [11-03] Backward-compatible JWT payload - Role defaults to TEACHER, teamId defaults to null for existing sessions
- [11-04] Explicit RBAC checks in Server Actions - Clear permission model with role-based CRUD matrix (Directors full access, users self-update)
- [11-04] Form state pattern for validation errors - Field-specific and _form errors for user feedback
- [11-05] Client-side filtering for teacher list - TanStack Table with useMemo for instant search/filter response
- [11-05] Dynamic team filter dropdown - Extracted from teacher data instead of separate API call
- [11-06] Next.js 15 params as Promise - Dynamic route params must be typed as Promise and awaited before use
- [11-06] Client component pattern for teacher detail - 'use client' directive for interactive UI elements (buttons, links)
- [v2.0] 팀 단위 데이터 분리: 보안 및 프라이버시 보장을 위해 Prisma middleware + PostgreSQL RLS 적용
- [v2.0] 선생님 성향 분석: 학생과 동일한 방식으로 궁합 계산 (기존 분석 모듈 재사용)
- [v2.0] LLM 전체 공통 설정: 관리 용이성 및 비용 효율성을 위해 Vercel AI SDK로 통합

### Pending Todos

None yet.

### Blockers/Concerns

**From Phase 11-05 execution:**
- None identified

**From Phase 11-04 execution:**
- None identified

**From Phase 11-02 execution:**
- Session module must call setRLSSessionContext before every DB query - RESOLVED: Now integrated in verifySession
- Server Actions must use getRBACPrisma instead of raw db - RESOLVED: Teacher/Team actions use explicit RBAC checks

**From Phase 11-01 execution:**
- Shadow database sync issue: Prisma migrate dev failed due to ReportPDF table missing in shadow DB. Workaround: Manual migration creation and apply. Monitor for future migrations.

**From Phase 11 planning:**
- Ollama Docker networking: Docker 컨테이너에서 192.168.0.5:11434 접속 가능성 확인 필요 (Phase 15)
- Korean saju compatibility validation: 학술적 검증 부족으로 도메인 전문가 상담 필요 (Phase 13)

## Session Continuity

Last session: 2026-01-30 09:54 (Phase 11 Plan 06 execution)
Stopped at: Completed 11-06-PLAN.md (Teacher Detail Page)
Resume file: None

---
*Last updated: 2026-01-30*
