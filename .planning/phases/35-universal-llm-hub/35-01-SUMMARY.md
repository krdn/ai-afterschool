---
phase: 35-universal-llm-hub
plan: 01
subsystem: database

# Dependency graph
requires:
  - phase: 15-multi-llm-integration
    provides: 기존 LLMConfig, LLMFeatureConfig 데이터 모델
provides:
  - Provider 테이블 (동적 제공자 등록)
  - Model 테이블 (제공자별 다중 모델 지원)
  - FeatureMapping 테이블 (기능 ↔ 모델 매핑)
  - ProviderTemplate 테이블 (미리 정의된 템플릿)
  - 데이터 마이그레이션 스크립트
affects:
  - Phase 35-02 (Core Types & Provider Registry)
  - Phase 35-03 (Provider Template System)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Prisma @@map for snake_case table names"
    - "Foreign key constraints with ON DELETE CASCADE/SET NULL"
    - "Composite unique indexes for provider-model relationships"

key-files:
  created:
    - prisma/migrations/20260212053041_universal_llm_hub/migration.sql
    - src/lib/db/migrate-llm-config.ts
  modified:
    - prisma/schema.prisma

key-decisions:
  - "기존 LLMConfig, LLMFeatureConfig 테이블은 하위호환성을 위해 유지 (데이터 보존)"
  - "Provider ↔ Model은 1:N 관계, Model ↔ FeatureMapping은 1:N (optional) 관계"
  - "마이그레이션 스크립트에 dry-run, rollback 옵션 제공"
  - "ProviderTemplate은 정적 데이터 (11개 인기 제공자 미리 정의)"

patterns-established:
  - "Database schema versioning: Prisma Migrate 사용"
  - "Data migration: Standalone TypeScript 스크립트 with Prisma Client"

# Metrics
duration: 4min
completed: 2026-02-12
---

# Phase 35 Plan 01: Database Schema Migration for Universal LLM Hub Summary

**새로운 Universal LLM Hub 데이터 모델(Provider, Model, FeatureMapping, ProviderTemplate) 정의 및 마이그레이션 인프라 구축**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-12T05:29:59Z
- **Completed:** 2026-02-12T05:33:35Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Prisma 스키마에 4개의 새로운 Universal LLM Hub 모델 정의
- PostgreSQL 마이그레이션 생성 및 적용 (providers, models, feature_mappings, provider_templates 테이블)
- 데이터 마이그레이션 스크립트 작성 (dry-run, rollback 지원)
- 기존 LLMConfig/LLMFeatureConfig 테이블과의 하위호환성 유지

## Task Commits

Each task was committed atomically:

1. **Task 1: 새로운 Prisma 스키마 정의** - `b2abd29` (feat)
2. **Task 2: Prisma 마이그레이션 생성** - `1cd5a04` (chore)
3. **Task 3: 기존 데이터 마이그레이션 스크립트** - `bf78ec1` (feat)

**Plan metadata:** (committed with final summary)

## Files Created/Modified

- `prisma/schema.prisma` - Provider, Model, FeatureMapping, ProviderTemplate 모델 추가
- `prisma/migrations/20260212053041_universal_llm_hub/migration.sql` - 새 테이블 및 인덱스 생성
- `src/lib/db/migrate-llm-config.ts` - 데이터 마이그레이션 스크립트

## Decisions Made

- **기존 테이블 유지**: LLMConfig, LLMFeatureConfig, LLMBudget 테이블은 하위호환성을 위해 그대로 유지
- **관계 설정**: Provider(1) → Model(N) → FeatureMapping(N, optional) 구조
- **인증 방식**: authType 필드로 'api_key', 'bearer', 'custom_header', 'none' 지원
- **마이그레이션 방식**: Standalone TypeScript 스크립트로 dry-run/rollback 지원

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- ✅ Database schema ready for Phase 35-02 (Core Types & Provider Registry)
- ✅ Migration script ready for data migration when needed
- ✅ Prisma Client types available for new models
- ⚠️ Note: 기존 데이터 마이그레이션은 Phase 35-05 (Legacy Migration)에서 실행 예정

---
*Phase: 35-universal-llm-hub*
*Completed: 2026-02-12*
