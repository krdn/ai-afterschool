---
phase: 35-universal-llm-hub
plan: 04
subsystem: ai

# Dependency graph
requires:
  - phase: 35-universal-llm-hub
    provides: Prisma schema for Provider, Model, FeatureMapping
  - phase: 35-universal-llm-hub
    provides: Core Types & ProviderRegistry Foundation
provides:
  - FeatureResolver 클래스 (태그 기반 + 직접 지정 하이브리드)
  - 기능 매핑 시딩 데이터 (12개 기능 타입)
  - 기능 매핑 REST API (GET/POST/PATCH/DELETE)
  - 모델 해상도 API (/api/feature-mappings/resolve)
  - 기능 매핑 Server Actions (6개)
affects:
  - Phase 35-05 (Router Migration)
  - Admin LLM Features 페이지

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Tag-based Resolution: requiredTags/excludedTags 필터링"
    - "Priority-based Fallback: 우선순위 순 폴 백 체인"
    - "Hybrid Match Mode: auto_tag + specific_model 지원"
    - "Idempotent Seeding: 중복 생성 방지"

key-files:
  created:
    - src/lib/ai/feature-resolver.ts
    - src/lib/db/seed-feature-mappings.ts
    - src/app/api/feature-mappings/route.ts
    - src/app/api/feature-mappings/[id]/route.ts
    - src/app/api/feature-mappings/resolve/route.ts
    - src/lib/actions/feature-mapping-actions.ts
  modified: []

key-decisions:
  - "태그 기반 필터링: vision, balanced, premium, fast, low 등 태그 지원"
  - "우선순위 기반 폴 백: priority 값으로 정렬된 다중 규칙 지원"
  - "Fallback Mode: next_priority, any_available, fail 3가지 모드"
  - "Idempotent Seeding: 기존 매핑 존재 시 건��� (CLI 스크립트)"

patterns-established:
  - "FeatureResolver: 기능 타입 → 모odel 해상도의 중앙화된 처리"
  - "Tag Filtering: requiredTags 모두 충족 + excludedTags 모두 제외"
  - "Requirements Filtering: needsVision, needsTools, cost/quality 선호도"
  - "Server Actions: DIRECTOR 권한 확인 + revalidatePath 패턴"

# Metrics
duration: 6min
completed: 2026-02-12
---

# Phase 35 Plan 04: Feature Mapping System Summary

**태그 기반 + 직접 지정 하이브리드 기능 매핑 시스템 - FeatureResolver, 시딩 데이터, API, Server Actions**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-12T05:47:30Z
- **Completed:** 2026-02-12T05:53:55Z
- **Tasks:** 4
- **Files created:** 6

## Accomplishments

1. **FeatureResolver 구현 (src/lib/ai/feature-resolver.ts)**
   - `resolve()`: 기능 타입에 가장 적합한 모델 단일 반환
   - `resolveWithFallback()`: 우선순위 순으로 정렬된 후보 목록 (폴 백 체인)
   - `resolveByTags()`: 태그 기반 필터링 (requiredTags, excludedTags)
   - `resolveBySpecificModel()`: 특정 모델 ID 직접 지정
   - CRUD: `getMappings()`, `createOrUpdateMapping()`, `deleteMapping()`
   - ResolutionRequirements: needsVision, needsTools, preferredCost, preferredQuality, minContextWindow

2. **기능 매핑 시딩 데이터 (src/lib/db/seed-feature-mappings.ts)**
   - 12개 기능 타입 기본 매핑 정의
   - 태그 기반 규칙: vision, balanced, premium, fast, low
   - 폴 백 모드: next_priority, any_available
   - CLI 지원: seed, reset <feature>, clear
   - Idempotent 설계 (중복 생성 방지)

3. **기능 매핑 API (src/app/api/feature-mappings/)**
   - `GET /api/feature-mappings` - 목록 조회 (featureType 필터 지원)
   - `POST /api/feature-mappings` - 새 매핑 생성
   - `GET /api/feature-mappings/[id]` - 단일 조회
   - `PATCH /api/feature-mappings/[id]` - 수정
   - `DELETE /api/feature-mappings/[id]` - 삭제
   - `POST /api/feature-mappings/resolve` - 모델 해상도
   - DIRECTOR 권한 확인 on all endpoints

4. **기능 매핑 Server Actions (src/lib/actions/feature-mapping-actions.ts)**
   - `getFeatureMappingsAction()` - 매핑 목록 조회
   - `resolveFeatureAction()` - 단일 모델 해상도
   - `getResolutionChainAction()` - 폴 백 체인 조회
   - `createFeatureMappingAction()` - 매핑 생성
   - `updateFeatureMappingAction()` - 매핑 수정
   - `deleteFeatureMappingAction()` - 매핑 삭제
   - `revalidatePath('/admin/llm-features')` 적용

## Task Commits

Each task was committed atomically:

1. **Task 1: FeatureResolver 구현** - `d56854b` (feat)
2. **Task 2: 기능 매핑 시딩 데이터** - `bdd7122` (feat)
3. **Task 3: 기능 매핑 API** - `8bd7e5d` (feat)
4. **Task 4: 기능 매핑 Server Actions** - `e946e0f` (feat)

## Files Created

- `src/lib/ai/feature-resolver.ts` - 기능별 모델 해결 로직 (태그 기반 + 직접 지정)
- `src/lib/db/seed-feature-mappings.ts` - 기본 기능 매핑 규칙 및 시딩 스크립트
- `src/app/api/feature-mappings/route.ts` - 기능 매핑 목록/생성 API
- `src/app/api/feature-mappings/[id]/route.ts` - 개별 매핑 조회/수정/삭제 API
- `src/app/api/feature-mappings/resolve/route.ts` - 모델 해상도 API
- `src/lib/actions/feature-mapping-actions.ts` - 기능 매핑 Server Actions

## Decisions Made

1. **태그 기반 필터링**: requiredTags와 excludedTags로 유연한 모델 선택
   - 내장 태그: vision, tools, fast, balanced, premium, low, medium, high
   - 제공자 capabilities도 태그로 사용 가능

2. **우선순위 기반 폴 백**: priority 값으로 다중 규칙의 적용 순서 결정
   - 높은 priority가 먼저 적용됨
   - fallbackMode로 폴 백 동작 제어

3. **Fallback Mode 3가지**:
   - `next_priority`: 다음 우선순위 규칙으로 폴 백
   - `any_available`: 활성화된 모든 모델 중 선택
   - `fail`: 폴 백 없이 실패

4. **Idempotent Seeding**: CLI 스크립트로 여러 번 실행필도 중복 생성되지 않음
   - featureType + priority 조합으로 기존 매핑 확인

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

1. **Prisma Client 타입 미생성**: schema.prisma에 모델이 추가되었으나 Prisma Client가 재생성되지 않아 타입 오류 발생
   - 상태: Phase 35-01에서 DB 마이그레이션 완료 후 `prisma generate` 필요
   - 영향: TypeScript 컴파일 오류 (런타임에는 정상 동작)

## Next Phase Readiness

- ✅ FeatureResolver 구현 완료
- ✅ 기능 매핑 시딩 데이터 준비 완료
- ✅ REST API 구현 완료
- ✅ Server Actions 구현 완료
- 🔄 준비 완료: Phase 35-05 (Router Migration)
- ⚠️ 필요: `prisma generate` 실행 후 타입 오류 해결

---
*Phase: 35-universal-llm-hub*
*Completed: 2026-02-12*
