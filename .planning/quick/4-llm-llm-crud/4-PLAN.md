---
phase: quick-4
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/ai/providers/types.ts
  - src/lib/ai/providers/index.ts
  - src/lib/ai/test-provider.ts
  - src/lib/ai/config.ts
  - src/lib/ai/smart-routing.ts
  - src/lib/actions/llm-settings.ts
  - src/app/(dashboard)/admin/llm-settings/provider-card.tsx
  - src/app/(dashboard)/admin/llm-settings/provider-select.tsx
  - src/app/(dashboard)/admin/llm-settings/feature-mapping.tsx
  - package.json
autonomous: true
must_haves:
  truths:
    - "관리자가 LLM 설정 페이지에서 8개 제공자(기존 4 + DeepSeek, Mistral, Cohere, xAI/Grok) 카드를 볼 수 있다"
    - "새 제공자에 API 키를 입력하고 저장/검증할 수 있다"
    - "기능별 매핑에서 새 제공자를 선택할 수 있다"
    - "기본 제공자 선택에서 새 제공자를 선택할 수 있다"
    - "기존 4개 제공자 기능이 그대로 동작한다"
  artifacts:
    - path: "src/lib/ai/providers/types.ts"
      provides: "8개 제공자 타입 및 설정"
      contains: "deepseek.*mistral.*cohere.*xai"
    - path: "src/lib/ai/providers/index.ts"
      provides: "8개 제공자 팩토리 함수"
      exports: ["providers", "getProvider"]
    - path: "src/lib/ai/test-provider.ts"
      provides: "새 제공자 연결 검증"
      contains: "deepseek.*mistral.*cohere.*xai"
  key_links:
    - from: "src/lib/ai/providers/types.ts"
      to: "provider-card.tsx, provider-select.tsx"
      via: "PROVIDER_CONFIGS object iteration"
      pattern: "Object.entries.*PROVIDER_CONFIGS"
    - from: "src/lib/ai/providers/index.ts"
      to: "src/lib/ai/test-provider.ts"
      via: "provider SDK instances"
      pattern: "create.*Provider"
---

<objective>
LLM 설정 관리 화면에 4개 새 제공자(DeepSeek, Mistral, Cohere, xAI/Grok) 추가

Purpose: 다양한 LLM 제공자를 등록/관리할 수 있도록 확장하여 비용 최적화 및 모델 선택 폭을 넓힌다.
Output: 8개 제공자가 표시되는 LLM 설정 페이지, 각 제공자별 API 키 저장/검증/기능 매핑 가능
</objective>

<execution_context>
@/home/gon/.claude/get-shit-done/workflows/execute-plan.md
@/home/gon/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/lib/ai/providers/types.ts
@src/lib/ai/providers/index.ts
@src/lib/ai/providers/ollama.ts
@src/lib/ai/test-provider.ts
@src/lib/ai/config.ts
@src/lib/ai/smart-routing.ts
@src/lib/actions/llm-settings.ts
@src/app/(dashboard)/admin/llm-settings/page.tsx
@src/app/(dashboard)/admin/llm-settings/provider-card.tsx
@src/app/(dashboard)/admin/llm-settings/provider-select.tsx
@src/app/(dashboard)/admin/llm-settings/feature-mapping.tsx
@package.json
</context>

<tasks>

<task type="auto">
  <name>Task 1: 새 제공자 SDK 설치 및 타입/설정 확장</name>
  <files>
    package.json
    src/lib/ai/providers/types.ts
    src/lib/ai/providers/index.ts
    src/lib/ai/test-provider.ts
    src/lib/ai/config.ts
    src/lib/ai/smart-routing.ts
    src/lib/actions/llm-settings.ts
  </files>
  <action>
    1. **패키지 설치**: `npm install @ai-sdk/deepseek @ai-sdk/mistral @ai-sdk/cohere @ai-sdk/xai`

    2. **types.ts 수정**:
       - `ProviderName` 유니온에 `'deepseek' | 'mistral' | 'cohere' | 'xai'` 추가
       - `PROVIDER_CONFIGS`에 4개 새 제공자 추가:
         - `deepseek`: displayName 'DeepSeek', requiresApiKey true, supportsVision false, defaultModel 'deepseek-chat', models ['deepseek-chat', 'deepseek-reasoner']
         - `mistral`: displayName 'Mistral', requiresApiKey true, supportsVision false, defaultModel 'mistral-large-latest', models ['mistral-large-latest', 'mistral-small-latest', 'codestral-latest']
         - `cohere`: displayName 'Cohere', requiresApiKey true, supportsVision false, defaultModel 'command-r-plus', models ['command-r-plus', 'command-r']
         - `xai`: displayName 'Grok', requiresApiKey true, supportsVision true, defaultModel 'grok-3', models ['grok-3', 'grok-3-mini']
       - `COST_PER_MILLION_TOKENS`에 4개 추가:
         - `deepseek`: { input: 0.27, output: 1.10 } (DeepSeek V3 기준)
         - `mistral`: { input: 2.0, output: 6.0 } (Mistral Large 기준)
         - `cohere`: { input: 2.5, output: 10.0 } (Command R+ 기준)
         - `xai`: { input: 3.0, output: 15.0 } (Grok-3 기준)

    3. **providers/index.ts 수정**:
       - 새 SDK import 추가:
         ```
         import { deepseek } from '@ai-sdk/deepseek';
         import { mistral } from '@ai-sdk/mistral';
         import { cohere } from '@ai-sdk/cohere';
         import { xai } from '@ai-sdk/xai';
         ```
       - `providers` 객체에 4개 팩토리 추가:
         - `deepseek: (model?) => deepseek(model || 'deepseek-chat')`
         - `mistral: (model?) => mistral(model || 'mistral-large-latest')`
         - `cohere: (model?) => cohere(model || 'command-r-plus')`
         - `xai: (model?) => xai(model || 'grok-3')`

    4. **test-provider.ts 수정**:
       - switch문에 4개 case 추가. 각 제공자별 테스트 모델:
         - `deepseek`: `createDeepSeek({ apiKey })('deepseek-chat')` (import: `@ai-sdk/deepseek`의 `createDeepSeek`)
         - `mistral`: `createMistral({ apiKey })('mistral-small-latest')` (import: `@ai-sdk/mistral`의 `createMistral`)
         - `cohere`: `createCohere({ apiKey })('command-r')` (import: `@ai-sdk/cohere`의 `createCohere`)
         - `xai`: `createXai({ apiKey })('grok-3-mini')` (import: `@ai-sdk/xai`의 `createXai`)
       - 테스트는 가장 저렴한 모델을 사용 (비용 절감)

    5. **config.ts 수정**: 변경 불필요. `PROVIDER_CONFIGS[config.provider as ProviderName]`는 타입 확장만으로 자동 동작. 단, `saveLLMConfig`의 `providerConfig` 접근이 새 제공자에서도 동작하는지 확인.

    6. **smart-routing.ts 수정**: `VISION_PROVIDERS` 배열에 `'xai'` 추가 (Grok은 비전 지원). `COST_PER_MILLION_TOKENS`에 새 키가 추가되면 `getCostScore` 함수가 자동으로 새 제공자를 처리.

    7. **llm-settings.ts (server actions) 수정**:
       - `setDefaultProviderAction` 내 `allProviders` 배열에 4개 추가: `['ollama', 'anthropic', 'openai', 'google', 'deepseek', 'mistral', 'cohere', 'xai']`
       - `allFeatures` 배열에 누락된 FeatureType 추가 (현재 `vark_analysis`, `name_analysis`, `zodiac_analysis` 누락): 전체 11개 FeatureType 반영
  </action>
  <verify>
    `npx tsc --noEmit` 타입 에러 없음. `PROVIDER_CONFIGS`에 8개 키 존재 확인.
  </verify>
  <done>
    ProviderName 타입에 8개 제공자가 정의되고, 각각의 SDK 인스턴스 생성 및 연결 테스트가 가능하다.
  </done>
</task>

<task type="auto">
  <name>Task 2: UI 컴포넌트에 새 제공자 색상/아이콘 추가 및 동적 렌더링</name>
  <files>
    src/app/(dashboard)/admin/llm-settings/provider-card.tsx
    src/app/(dashboard)/admin/llm-settings/provider-select.tsx
    src/app/(dashboard)/admin/llm-settings/feature-mapping.tsx
  </files>
  <action>
    1. **provider-card.tsx 수정**:
       - `PROVIDER_COLORS` Record에 4개 추가:
         - `deepseek`: 'bg-cyan-100 text-cyan-700 border-cyan-200'
         - `mistral`: 'bg-amber-100 text-amber-700 border-amber-200'
         - `cohere`: 'bg-rose-100 text-rose-700 border-rose-200'
         - `xai`: 'bg-slate-100 text-slate-700 border-slate-200'
       - provider-card는 이미 `PROVIDER_CONFIGS`를 기반으로 동적 렌더링하므로, 색상만 추가하면 자동으로 새 제공자 카드가 표시됨
       - 새 제공자들도 `config.requiresApiKey`가 true이므로 API 키 입력 UI가 자동 표시됨
       - 단, `baseUrl` 입력은 Ollama 전용이므로 그대로 유지 (새 제공자에는 baseUrl 불필요)

    2. **provider-select.tsx 수정**:
       - `ALL_PROVIDERS` 배열에 4개 추가: `['ollama', 'anthropic', 'openai', 'google', 'deepseek', 'mistral', 'cohere', 'xai']`
       - `PROVIDER_ICONS` Record에 4개 추가:
         - `deepseek`: 'D'
         - `mistral`: 'M'
         - `cohere`: 'C'
         - `xai`: 'X'
       - `PROVIDER_COLORS` Record에 4개 추가:
         - `deepseek`: { bg: 'bg-cyan-50 border-cyan-200 hover:bg-cyan-100', selected: 'bg-cyan-100 border-cyan-500 ring-2 ring-cyan-300' }
         - `mistral`: { bg: 'bg-amber-50 border-amber-200 hover:bg-amber-100', selected: 'bg-amber-100 border-amber-500 ring-2 ring-amber-300' }
         - `cohere`: { bg: 'bg-rose-50 border-rose-200 hover:bg-rose-100', selected: 'bg-rose-100 border-rose-500 ring-2 ring-rose-300' }
         - `xai`: { bg: 'bg-slate-50 border-slate-200 hover:bg-slate-100', selected: 'bg-slate-100 border-slate-500 ring-2 ring-slate-300' }
       - 그리드를 `md:grid-cols-4`에서 `md:grid-cols-4 lg:grid-cols-4`로 유지하되, 8개 항목이므로 2행으로 자연스럽게 배치됨

    3. **feature-mapping.tsx 수정**:
       - 이 컴포넌트는 이미 `PROVIDER_CONFIGS[provider].displayName`으로 동적 렌더링하므로 큰 변경 불필요
       - `getAvailableProviders` 함수의 `VISION_FEATURES`에서 `PROVIDER_CONFIGS[p].supportsVision`으로 필터링하므로 xAI(비전 지원)가 자동으로 비전 기능에 포함됨
       - 폴백 기본값 수정: 기존 `['anthropic', 'openai', 'google']` -> 새 제공자를 포함하지 않아도 됨 (DB에 저장된 값 우선, 없으면 기존 폴백 유지)

    4. **page.tsx**: 변경 불필요. 이미 `Object.entries(PROVIDER_CONFIGS)` 순회로 카드를 렌더링하므로 types.ts 확장만으로 자동 반영.
  </action>
  <verify>
    `npx tsc --noEmit` 타입 에러 없음. `npm run build` 성공. 브라우저에서 `/admin/llm-settings` 접속 시 8개 제공자 카드가 모두 표시되는지 확인.
  </verify>
  <done>
    LLM 설정 페이지에 8개 제공자가 고유 색상/아이콘으로 표시되고, 기본 제공자 선택과 기능별 매핑에서도 새 제공자를 선택할 수 있다. 기존 4개 제공자 기능은 그대로 동작한다.
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` - 타입 에러 없음
2. `npm run build` - 빌드 성공
3. 브라우저 `/admin/llm-settings` 접속:
   - 8개 제공자 카드 표시 (Anthropic, OpenAI, Google, Ollama, DeepSeek, Mistral, Cohere, Grok)
   - 각 카드에서 API 키 입력/저장/검증 동작
   - 기본 제공자 선택에 8개 표시
   - 기능별 매핑 드롭다운에 활성화된 제공자 표시
4. 기존 제공자(Anthropic, OpenAI 등) API 키가 저장되어 있다면 여전히 정상 동작
</verification>

<success_criteria>
- ProviderName 타입이 8개 제공자를 포함
- PROVIDER_CONFIGS에 8개 설정이 정의됨
- providers/index.ts에서 8개 제공자 SDK 인스턴스 생성 가능
- test-provider.ts에서 8개 제공자 연결 검증 가능
- UI에 8개 카드가 표시되며 각각 API 키 CRUD 동작
- 빌드 성공, 타입 에러 없음
</success_criteria>

<output>
After completion, create `.planning/quick/4-llm-llm-crud/4-SUMMARY.md`
</output>
