---
phase: 35-universal-llm-hub
plan: 02
subsystem: ai

# Dependency graph
requires:
  - phase: 35-universal-llm-hub
    provides: Prisma schema for Provider, Model, FeatureMapping
provides:
  - Universal LLM Hub 타입 정의
  - ProviderRegistry 싱글톤 클래스
  - AI SDK 어댑터 기반 구조
  - OpenAI, Anthropic, Google, Ollama 어댑터
affects:
  - Phase 35-03 (Feature Mapping & Resolution)
  - Phase 35-04 (Router Migration)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Adapter Pattern: BaseAdapter 추상 클래스"
    - "Singleton Pattern: ProviderRegistry"
    - "Factory Pattern: AdapterFactory"

key-files:
  created:
    - src/lib/ai/types.ts
    - src/lib/ai/provider-registry.ts
    - src/lib/ai/adapters/base.ts
    - src/lib/ai/adapters/index.ts
    - src/lib/ai/adapters/openai.ts
    - src/lib/ai/adapters/anthropic.ts
    - src/lib/ai/adapters/google.ts
    - src/lib/ai/adapters/ollama.ts
  modified: []

key-decisions:
  - "타입은 Prisma 모델에서 파생하여 일관성 유지"
  - "AI SDK 최신 버전과의 호환성 (LanguageModel, maxOutputTokens)"
  - "어댑터는 BaseAdapter를 상속하여 일관된 인터페이스 제공"
  - "ProviderRegistry는 singleton으로 구현하여 전역 상태 관리"

patterns-established:
  - "Adapter Pattern: 각 제공자별 어댑터는 BaseAdapter 상속"
  - "TTL Cache: ProviderRegistry에서 5분 캐싱"
  - "Default Models: 제공자 등록 시 기본 모델 자동 생성"

# Metrics
duration: 11 min
completed: 2026-02-12
---

# Phase 35 Plan 02: Core Types & Provider Registry Foundation Summary

**Universal LLM Hub 타입 정의 + ProviderRegistry 싱글톤 + AI SDK 어댑터 기반 구조**

## Performance

- **Duration:** 11 min
- **Started:** 2026-02-12T05:30:52Z
- **Completed:** 2026-02-12T05:42:00Z
- **Tasks:** 3
- **Files created:** 8

## Accomplishments

1. **타입 정의 (src/lib/ai/types.ts)**
   - ProviderType, AuthType, Capability 등 enum 타입
   - ProviderConfig, ModelConfig, FeatureMappingConfig 인터페이스
   - RegistryEntry, ResolutionResult 등 레지스트리 관련 타입
   - 기존 ProviderName과의 호환성 유지

2. **AI SDK 어댑터 구조 (src/lib/ai/adapters/)**
   - BaseAdapter 추상 클래스 (generate, stream, validate, listModels)
   - AdapterFactory (providerType -> Adapter 매핑)
   - OpenAIAdapter, AnthropicAdapter, GoogleAdapter, OllamaAdapter 구현

3. **ProviderRegistry (src/lib/ai/provider-registry.ts)**
   - Singleton 패턴으로 구현
   - CRUD: register, update, remove, get, list
   - validate: 어댑터를 통한 연결 테스트
   - syncModels: 제공자 API에서 모델 목록 동기화
   - TTL 기반 캐싱 (5분)

## Task Commits

Each task was committed atomically:

1. **Task 1: Universal LLM Hub 타입 정의** - `ad9df2f` (feat)
2. **Task 2: AI SDK 어댑터 기반 구조** - `fa4b092` (feat)
3. **Task 3: ProviderRegistry 구현** - `2670ce4` (feat)

**Fix commits:**

- `ca1bdab` fix(35-02): fix AI SDK type compatibility issues

## Files Created

- `src/lib/ai/types.ts` - Universal LLM Hub 타입 정의 (Provider, Model, FeatureMapping)
- `src/lib/ai/provider-registry.ts` - ProviderRegistry 싱글톤 클래스
- `src/lib/ai/adapters/base.ts` - BaseAdapter 추상 클래스
- `src/lib/ai/adapters/index.ts` - AdapterFactory 및 어댑터 exports
- `src/lib/ai/adapters/openai.ts` - OpenAIAdapter 구현
- `src/lib/ai/adapters/anthropic.ts` - AnthropicAdapter 구현
- `src/lib/ai/adapters/google.ts` - GoogleAdapter 구현
- `src/lib/ai/adapters/ollama.ts` - OllamaAdapter 구현

## Decisions Made

1. **Prisma 타입 파생**: ProviderConfig, ModelConfig 등의 타입은 Prisma Client에서 자동 생성된 타입을 사용하여 DB 스키마와 항상 동기화
2. **AI SDK 버전 호환**: 최신 AI SDK의 LanguageModel 타입과 maxOutputTokens 파라미터 사용
3. **어댑터 패턴**: 각 제공자별로 BaseAdapter를 상속받아 일관된 인터페이스 제공
4. **Singleton Registry**: ProviderRegistry를 싱글톤으로 구현하여 전역적으로 하나의 인스턴스만 사용

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] AI SDK 타입 호환성 수정**
- **Found during:** Task 2 (어댑터 구현 후 TypeScript 검증)
- **Issue:** LanguageModelV1 타입이 AI SDK에서 제거됨, chatModel() 메서드가 아닌 직접 호출 방식으로 변경됨
- **Fix:** 
  - `LanguageModelV1` → `LanguageModel` from 'ai'
  - `provider.chatModel(modelId)` → `provider(modelId)`
  - `maxTokens` → `maxOutputTokens`
  - generateText/streamText에서 messages와 prompt를 동시에 전달하지 않도록 수정
- **Files modified:** src/lib/ai/adapters/*.ts, src/lib/ai/types.ts
- **Verification:** TypeScript compilation passes
- **Committed in:** ca1bdab (fix commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** 필수 수정사항. AI SDK 최신 버전과의 호환성 확보.

## Issues Encountered

1. **AI SDK API 변경사항**: 최신 AI SDK에서 타입과 메서드 호출 방식이 변경됨
   - 해결: 공식 문서와 기존 router.ts 코드를 참고하여 올바른 방식으로 수정

## Next Phase Readiness

- ✅ 타입 정의 완료 (Provider, Model, FeatureMapping)
- ✅ ProviderRegistry 구현 완료
- ✅ AI SDK 어댑터 기반 구조 확립
- ✅ OpenAI, Anthropic, Google, Ollama 어댑터 구현 완료
- 🔄 준비 완료: Phase 35-03 (Feature Mapping & Resolution)

---
*Phase: 35-universal-llm-hub*
*Completed: 2026-02-12*
