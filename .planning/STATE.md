# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-11)

**Core value:** 학생 정보 통합 관리를 기반으로 AI 성향 분석 및 맞춤형 학습/진로 제안 제공
**Current focus:** v3.0 Issue Management & Auto DevOps Pipeline - Phase 29 (Database & GitHub API Foundation)

## Current Position

Milestone: v3.0 Issue Management & Auto DevOps Pipeline
Phase: 29 of 34 (Database & GitHub API Foundation)
Plan: 03 of 03 completed
Status: Phase 29 complete (3/3 plans complete)
Last activity: 2026-02-11 — Completed 29-03 (GitHub Services & Issue Actions)

Progress: [██████████████████████████░░░░░░░░░░░░░░░░░] 83.7% (165/196 plans across v1.0-v3.0)

**v3.0 Issue Management & Auto DevOps Pipeline** 🚧 IN PROGRESS
- Phase 29: Database & GitHub API Foundation (3/3 plans complete) ✅ 29-01, 29-02, 29-03
- Phase 30: Issue UI & Screenshot (not started)
- Phase 31: Sentry Error Auto-Collection (not started)
- Phase 32: Webhook & Issue Sync (not started)
- Phase 33: CI/CD Pipeline (not started)
- Phase 34: Issue Dashboard & Integration Testing (not started)

**Coverage:**
- Requirements: 31/31 (100%) mapped to phases
- Phases: 6 phases (29-34)
- Phase 29: 8 requirements (INFRA-01~05, GH-01~03)
- Phase 30: 5 requirements (ISSUE-01~05)
- Phase 31: 5 requirements (ERR-01~05)
- Phase 32: 3 requirements (GH-04~06)
- Phase 33: 5 requirements (CICD-01~05)
- Phase 34: 5 requirements (DASH-01~05)

## Performance Metrics

**Velocity:**
- Total plans completed: 165 (v1.0-v3.0)
- Average duration: ~4.3 min
- Total execution time: ~11.8 hours

**By Milestone:**

| Milestone | Plans | Total | Avg/Plan |
|-----------|-------|-------|----------|
| v1.0 MVP | 36 | 254 min | ~7 min |
| v1.1 Production | 22 | ~102 min | ~5 min |
| v2.0 Teacher Mgmt | 40 | ~119 min | ~3 min |
| v2.1 Counseling | 30 | ~189 min | ~6.3 min |
| v2.1.1 E2E Test | 34 | ~208 min | ~6.1 min |
| v3.0 DevOps | 3 | ~3 min | ~3 min |

**Recent Trend:**
- v2.0 velocity: ~3 min/plan (improved)
- v2.1 velocity: ~6.3 min/plan (comprehensive features)
- v2.1.1 velocity: ~6.1 min/plan (test infrastructure)

*Updated after v3.0 roadmap creation*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting v3.0:

**v3.0 Phase Structure (Roadmap):**
- Phase 29-34 order follows dependency graph: DB→API→UI→Sentry→Webhook→CI/CD→Dashboard
- Phase 29 addresses INFRA & GH foundation (8 requirements)
- Phase 30 addresses user-facing issue reporting (5 requirements)
- Phase 31 addresses automatic error collection (5 requirements)
- Phase 32 addresses GitHub sync bidirectional (3 requirements)
- Phase 33 addresses deployment automation (5 requirements)
- Phase 34 addresses visibility & integration (5 requirements)

**v3.0 Key Technical Decisions (from research):**
- GitHub API integration: octokit SDK (unified REST + GraphQL)
- Screenshot capture: modern-screenshot (20KB, 3x faster than html2canvas)
- Webhook security: HMAC-SHA256 signature verification mandatory
- Error deduplication: fingerprint-based to prevent issue spam
- Rate limit monitoring: X-RateLimit-Remaining header tracking
- Dual-layer storage: Local PostgreSQL + GitHub Issues sync
- CI/CD trigger: `auto-deploy` label on PR merge to main

**Critical Pitfalls to Avoid:**
1. GitHub API rate limit (5,000/hour) - monitor and cache locally
2. Webhook signature verification - HMAC-SHA256 + timingSafeEqual
3. Sentry issue spam - fingerprint + threshold (10 errors → 1 issue)
4. Auto-deploy infinite loop - [skip ci] + bot account filtering
5. Screenshot CORS - image proxy + crossorigin="anonymous"

### Pending Todos

None yet for v3.0.

### Blockers/Concerns

**From v3.0 Research - Gaps to Address:**
- GitHub App vs PAT authentication: Start with PAT, migrate to GitHub App if rate limit issues
- Image upload strategy: MinIO upload + URL insertion vs base64 inline (decide in Phase 30)
- Sentry beforeSend async pattern: fire-and-forget with local queueing fallback (design in Phase 31)

**From v2.1.1 Technical Debt:**
- E2E test coverage 20.7% (18/87 passing) - Admin data-testid missing, timeout issues
- Analysis history feature constraint - @unique prevents multiple records, needs separate history table
- 40 unimplemented feature tests skipped - teacher management, admin settings, report generation

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 004 | 사주분석 미리보기 markdown HTML 렌더링 개선 | 2026-02-11 | 7fa87bd | [004-saju-preview-markdown-html](./quick/004-saju-preview-markdown-html/) |
| 005 | 사주 이력 패널 마크다운 렌더링 개선 | 2026-02-11 | ff7760a | [005-saju-interpretation-markdown-render](./quick/005-saju-interpretation-markdown-render/) |
| 006 | 사주 해석 미리보기 포맷 개선 | 2026-02-11 | 1fc5c71 | [006-saju-preview-format-fix](./quick/006-saju-preview-format-fix/) |

## Session Continuity

Last session: 2026-02-11
Stopped at: Phase 29 complete (3/3 plans)
Resume file: None
Next action: `/gsd:plan-phase 30` to create Phase 30 execution plans

Last activity: 2026-02-11 - Completed quick task 006: 사주 해석 미리보기 포맷 개선

---
*Last updated: 2026-02-11 (Phase 29 complete, ready for Phase 30)*
