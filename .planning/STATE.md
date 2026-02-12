# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-12)

**Core value:** 학생 정보 통합 관리를 기반으로 AI 성향 분석 및 맞춤형 학습/진로 제안 제공
**Current focus:** v3.0 Issue Management & Auto DevOps Pipeline - Phase 29 (Database & GitHub API Foundation)

## Current Position

Milestone: v3.0 Issue Management & Auto DevOps Pipeline
Phase: 30 of 35 (Issue UI & Screenshot) 🚧 IN PROGRESS
Plan: 02 of 03 completed
Status: In progress - Screenshot UI components complete
Last activity: 2026-02-12 — Completed 30-02 (Screenshot UI Components)

Progress: [████████████████████████████████████████████░] 92.3% (173/196 plans across v1.0-v3.0)

**v3.0 Issue Management & Auto DevOps Pipeline** 🚧 IN PROGRESS
- Phase 29: Database & GitHub API Foundation (3/3 plans complete) ✅ 29-01, 29-02, 29-03
- Phase 30: Issue UI & Screenshot (2/3 plans complete) ✅ 30-01, 30-02
- Phase 31: Sentry Error Auto-Collection (not started)
- Phase 32: Webhook & Issue Sync (not started)
- Phase 33: CI/CD Pipeline (not started)
- Phase 34: Issue Dashboard & Integration Testing (not started)

**Universal LLM Hub** ✅ COMPLETE
- Phase 35: Core Types & Provider Registry Foundation (9/9 complete) ✅ 35-01, 35-02, 35-03, 35-04, 35-05, 35-06, 35-07, 35-08, 35-09

## Performance Metrics

**Velocity:**
- Total plans completed: 170 (v1.0-v3.0)
- Average duration: ~4.3 min
- Total execution time: ~12.2 hours

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

**Universal LLM Hub (Phase 35) - COMPLETE:**
- Prisma schema: Provider, Model, FeatureMapping 테이블 추가 (35-01)
- 타입 정의: Prisma 타입에서 파생하여 일관성 유지 (35-02)
- 어댑터 패턴: BaseAdapter 상속 구조 (35-02)
- ProviderRegistry: Singleton + TTL 캐싱 (35-02)
- 제공자 템플릿: 11개 인기 제공자 템플릿 정의 (35-03)
- 템플릿 기반 등록: 필드 자동 채우기 + 직접 설정 모드 (35-03)
- Provider API: REST API + Server Actions 이중 지원 (35-03)
- Feature Mapping System: 태그 기반 + 직접 지정 하이브리드 해상도 (35-04)
  - FeatureResolver: resolve(), resolveWithFallback() 지원
  - 태그 필터링: requiredTags, excludedTags
  - 폴 백 체인: priority 기반 정렬, fallbackMode (next_priority, any_available, fail)
  - 시딩 데이터: 12개 기능 타입 기본 매핑
  - 매핑 API: CRUD + resolve 엔드포인트
  - Server Actions: 6개 액션으로 UI 연동
- Admin Dashboard UI: 기능별 LLM 매핑 설정 페이지 (35-07)
  - ResolutionPreview: 폴 백 체인 미리보기
  - FeatureMappingForm: 태그 기반/직접 지정 모드 설정
  - FeatureMappingCard: 규칙 카드 표시
  - FeatureMappingList: 기능별 탭 조직화
  - /admin/llm-features: DIRECTOR 권한 관리 페이지
- Help System: 인라인 도움말 + 헬프 센터 + 추천 위자드 (35-08)
  - 도움말 콘텐츠: 4개 카테고리, 20+ 주제
  - InlineHelp: (?) 아이콘으로 필드별 도움말
  - HelpCenter: 검색, 카테고리 탭, 마크다운 렌더링
  - LLMRecommender: 3-4단계 질문 기반 추천 위자드
  - 모든 관리자 페이지에 통합
- Testing & Validation: 단위/통합/E2E 테스트 (35-09)
  - ProviderRegistry: 20+ 단위 테스트
  - FeatureResolver: 23 단위 테스트
  - Universal Router: 24 단위 테스트
  - 통합 테스트: 10 시나리오
  - E2E 테스트: 30+ 시나리오 (제공자 관리, 기능 매핑)
  - 총 98개 테스트 통과

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

**From Phase 35:**
- AI SDK 타입 변경사항: 최신 버전과의 호환성 확인 필요 (resolved in 35-02)
- Prisma Client 재생성 필요: schema 변경사항 반영을 위해 `prisma generate` 실행 필요 (TypeScript 오류 해결)
- **Router Migration 완료 (35-05)**: 기존 router.ts가 universal-router.ts로 위임하도록 변경, 하위호환성 100% 유지
  - Universal Router: FeatureResolver 기반 동적 모델 선택
  - Compatibility Layer: legacy/new 타입 변환 지원
  - 통합 테스트: 19개 테스트 통과

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 004 | 사주분석 미리보기 markdown HTML 렌더링 개선 | 2026-02-11 | 7fa87bd | [004-saju-preview-markdown-html](./quick/004-saju-preview-markdown-html/) |
| 005 | 사주 이력 패널 마크다운 렌더링 개선 | 2026-02-11 | ff7760a | [005-saju-interpretation-markdown-render](./quick/005-saju-interpretation-markdown-render/) |
| 006 | 사주 해석 미리보기 포맷 개선 | 2026-02-11 | 1fc5c71 | [006-saju-preview-format-fix](./quick/006-saju-preview-format-fix/) |

## Session Continuity

Last session: 2026-02-12
Stopped at: Phase 30-02 COMPLETE (Screenshot UI Components)
Resume file: None
Next action: Execute 30-03: Issue Report Form Integration

**Phase 30 Summary:**
- 30-01 Screenshot Infrastructure: modern-screenshot, capture.ts, image-storage.ts
- 30-02 Screenshot UI Components: ScreenshotCapture, ScreenshotPreview components
- Blob-based capture → upload pipeline ready
- S3ImageStorage singleton for MinIO integration
- UI state machine: idle → capturing → captured → uploading → uploaded

Last activity: 2026-02-12 - Completed 30-02: Screenshot UI Components

---
*Last updated: 2026-02-12 (Phase 30 IN PROGRESS - 30-02 complete)*
