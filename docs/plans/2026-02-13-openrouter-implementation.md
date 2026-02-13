# OpenRouter Provider Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Universal LLM Hub에 OpenRouter 제공자를 추가하여 단일 API로 200+ 모델에 접근 가능하게 한다.

**Architecture:** 기존 Moonshot 어댑터 패턴(`@ai-sdk/openai-compatible`)을 따르되, OpenRouter 고유 기능(무비용 검증 `/auth/key`, 공개 모델 API `/models`, 커스텀 헤더 `HTTP-Referer`/`X-Title`)을 반영한다. 5개 파일 수정 + 1개 파일 생성.

**Tech Stack:** TypeScript, `@ai-sdk/openai-compatible` (이미 설치됨), Vercel AI SDK, Next.js, Zod

**Design Doc:** `docs/plans/2026-02-13-openrouter-provider-design.md`

---

### Task 1: 타입 등록 — ProviderType에 'openrouter' 추가

**Files:**
- Modify: `src/lib/ai/types.ts:13-24` (ProviderType union)
- Modify: `src/lib/ai/types.ts:207-218` (PROVIDER_NAME_TO_TYPE mapping)
- Modify: `src/lib/ai/providers/types.ts:1` (ProviderName union)
- Modify: `src/lib/ai/providers/types.ts:32-113` (PROVIDER_CONFIGS)
- Modify: `src/lib/ai/providers/types.ts:116-127` (COST_PER_MILLION_TOKENS)

**Step 1: ProviderType union에 'openrouter' 추가**

`src/lib/ai/types.ts` 에서 `ProviderType` union의 `'moonshot'` 뒤에 추가:

```typescript
export type ProviderType =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'ollama'
  | 'deepseek'
  | 'mistral'
  | 'cohere'
  | 'xai'
  | 'zhipu'
  | 'moonshot'
  | 'openrouter'
  | 'custom';
```

**Step 2: PROVIDER_NAME_TO_TYPE 매핑에 openrouter 추가**

같은 파일 `src/lib/ai/types.ts`에서 `PROVIDER_NAME_TO_TYPE` 객체에 추가:

```typescript
export const PROVIDER_NAME_TO_TYPE: Record<LegacyProviderName, ProviderType> = {
  anthropic: 'anthropic',
  openai: 'openai',
  google: 'google',
  ollama: 'ollama',
  deepseek: 'deepseek',
  mistral: 'mistral',
  cohere: 'cohere',
  xai: 'xai',
  zhipu: 'zhipu',
  moonshot: 'moonshot',
  openrouter: 'openrouter',
};
```

**Step 3: Legacy ProviderName에 'openrouter' 추가**

`src/lib/ai/providers/types.ts:1`:

```typescript
export type ProviderName = 'anthropic' | 'openai' | 'google' | 'ollama' | 'deepseek' | 'mistral' | 'cohere' | 'xai' | 'zhipu' | 'moonshot' | 'openrouter';
```

**Step 4: PROVIDER_CONFIGS에 openrouter 항목 추가**

`src/lib/ai/providers/types.ts`의 `PROVIDER_CONFIGS` 객체 끝, moonshot 다음에:

```typescript
  openrouter: {
    name: 'openrouter',
    displayName: 'OpenRouter',
    requiresApiKey: true,
    supportsVision: true,
    defaultModel: 'openai/gpt-4o',
    models: ['openai/gpt-4o', 'openai/gpt-4o-mini', 'anthropic/claude-sonnet-4-5', 'google/gemini-2.5-flash'],
  },
```

**Step 5: COST_PER_MILLION_TOKENS에 openrouter 항목 추가**

같은 파일 `src/lib/ai/providers/types.ts`의 `COST_PER_MILLION_TOKENS` 끝에:

```typescript
  openrouter: { input: 2.5, output: 10.0 },  // 모델에 따라 다름 (GPT-4o 기준)
```

**Step 6: 타입 체크 실행**

Run: `cd /home/gon/projects/ai/ai-afterschool && npx tsc --noEmit 2>&1 | head -30`
Expected: 에러 발생 (아직 어댑터가 없으므로 일부 에러는 예상됨. `types.ts` 관련 에러만 없으면 OK)

**Step 7: 커밋**

```bash
git add src/lib/ai/types.ts src/lib/ai/providers/types.ts
git commit -m "feat: ProviderType에 openrouter 타입 등록"
```

---

### Task 2: OpenRouter 어댑터 구현

**Files:**
- Create: `src/lib/ai/adapters/openrouter.ts`

**Step 1: 어댑터 파일 생성**

`src/lib/ai/adapters/openrouter.ts`:

```typescript
/**
 * OpenRouter Adapter (OpenAI Compatible)
 *
 * OpenRouter - 200+ AI 모델을 단일 API로 접근
 * OpenAI 호환 API 사용 (https://openrouter.ai/api/v1)
 */

import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { generateText, streamText, type LanguageModel } from 'ai';
import { BaseAdapter } from './base';
import type {
  ProviderConfig,
  GenerateOptions,
  GenerateResult,
  StreamResult,
  ValidationResult,
  ModelInfo,
  ModelParams,
} from '../types';

export class OpenRouterAdapter extends BaseAdapter {
  readonly providerType = 'openrouter';
  readonly supportsVision = true;
  readonly supportsStreaming = true;
  readonly supportsTools = true;
  readonly supportsJsonMode = true;

  private apiKey: string = '';
  private baseUrl: string = 'https://openrouter.ai/api/v1';

  createModel(modelId: string, config?: ProviderConfig): LanguageModel {
    const effectiveConfig = config || ({} as ProviderConfig);
    const effectiveApiKey = effectiveConfig.apiKeyEncrypted
      ? this.decryptApiKey(effectiveConfig.apiKeyEncrypted)
      : this.apiKey;
    const effectiveBaseUrl = effectiveConfig.baseUrl || this.baseUrl;

    const openrouter = createOpenAICompatible({
      name: 'openrouter',
      baseURL: effectiveBaseUrl,
      apiKey: effectiveApiKey,
      headers: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'AI Afterschool',
      },
    });

    return openrouter.chatModel(modelId);
  }

  async generate(options: GenerateOptions): Promise<GenerateResult> {
    const result = await generateText({
      model: options.model,
      ...(options.messages
        ? { messages: options.messages }
        : { prompt: options.prompt || '' }),
      system: options.system,
      maxOutputTokens: options.maxTokens,
      temperature: options.temperature,
      topP: options.topP,
    });

    return {
      text: result.text,
      usage: result.usage,
    };
  }

  async stream(options: GenerateOptions): Promise<StreamResult> {
    const result = streamText({
      model: options.model,
      ...(options.messages
        ? { messages: options.messages }
        : { prompt: options.prompt || '' }),
      system: options.system,
      maxOutputTokens: options.maxTokens,
      temperature: options.temperature,
      topP: options.topP,
    });

    return {
      stream: result.textStream,
      provider: this.providerType,
      model: 'unknown',
    };
  }

  async validate(config: ProviderConfig): Promise<ValidationResult> {
    try {
      const apiKey = config.apiKeyEncrypted
        ? this.decryptApiKey(config.apiKeyEncrypted)
        : this.apiKey;

      if (!apiKey) {
        return {
          isValid: false,
          error: 'API 키가 설정되지 않았습니다.',
        };
      }

      const baseUrl = (config.baseUrl || this.baseUrl).replace(/\/$/, '');

      // OpenRouter 전용: /auth/key 엔드포인트로 무비용 검증
      const response = await fetch(`${baseUrl}/auth/key`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (response.ok) {
        return { isValid: true };
      }

      if (response.status === 401) {
        return {
          isValid: false,
          error: 'API 키가 유효하지 않습니다.',
        };
      }

      if (response.status === 402) {
        return {
          isValid: true,
          error: 'API 키는 유효하지만 크레딧이 부족합니다. 충전 후 이용하세요.',
        };
      }

      return {
        isValid: false,
        error: `검증 실패 (HTTP ${response.status})`,
      };
    } catch (error) {
      return {
        isValid: false,
        error: this.handleError(error, 'validation').message,
      };
    }
  }

  async listModels(config: ProviderConfig): Promise<ModelInfo[]> {
    try {
      const baseUrl = (config.baseUrl || this.baseUrl).replace(/\/$/, '');

      // OpenRouter /models API는 인증 불필요 (공개 API)
      const response = await fetch(`${baseUrl}/models`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('OpenRouter models API error:', response.status);
        return this.getDefaultModels();
      }

      const data = await response.json() as {
        data?: Array<{
          id: string;
          name: string;
          context_length?: number;
          architecture?: {
            modality?: string;
            input_modalities?: string[];
          };
          supported_parameters?: string[];
        }>;
      };

      if (!data.data || !Array.isArray(data.data)) {
        return this.getDefaultModels();
      }

      return data.data.map((model) => ({
        id: model.id,
        modelId: model.id,
        displayName: model.name || this.formatDisplayName(model.id),
        contextWindow: model.context_length || 4096,
        supportsVision: this.checkVisionSupport(model),
        supportsTools: model.supported_parameters?.includes('tools') ?? false,
      }));
    } catch (error) {
      console.error('Failed to fetch OpenRouter models:', error);
      return this.getDefaultModels();
    }
  }

  private checkVisionSupport(model: {
    architecture?: { modality?: string; input_modalities?: string[] };
  }): boolean {
    if (model.architecture?.input_modalities?.includes('image')) return true;
    if (model.architecture?.modality === 'multimodal') return true;
    return false;
  }

  private formatDisplayName(modelId: string): string {
    // 'openai/gpt-4o' → 'GPT-4o (via OpenRouter)'
    const parts = modelId.split('/');
    const name = parts.length > 1 ? parts[1] : parts[0];
    return `${name} (via OpenRouter)`;
  }

  private getDefaultModels(): ModelInfo[] {
    return [
      { id: 'openai/gpt-4o', modelId: 'openai/gpt-4o', displayName: 'GPT-4o (via OpenRouter)', contextWindow: 128000, supportsVision: true, supportsTools: true },
      { id: 'openai/gpt-4o-mini', modelId: 'openai/gpt-4o-mini', displayName: 'GPT-4o Mini (via OpenRouter)', contextWindow: 128000, supportsVision: true, supportsTools: true },
      { id: 'anthropic/claude-sonnet-4-5', modelId: 'anthropic/claude-sonnet-4-5', displayName: 'Claude Sonnet 4.5 (via OpenRouter)', contextWindow: 200000, supportsVision: true, supportsTools: true },
      { id: 'anthropic/claude-3-5-haiku', modelId: 'anthropic/claude-3-5-haiku', displayName: 'Claude 3.5 Haiku (via OpenRouter)', contextWindow: 200000, supportsVision: false, supportsTools: true },
      { id: 'google/gemini-2.5-flash', modelId: 'google/gemini-2.5-flash', displayName: 'Gemini 2.5 Flash (via OpenRouter)', contextWindow: 1000000, supportsVision: true, supportsTools: true },
      { id: 'google/gemini-2.0-flash', modelId: 'google/gemini-2.0-flash', displayName: 'Gemini 2.0 Flash (via OpenRouter)', contextWindow: 1048576, supportsVision: true, supportsTools: true },
      { id: 'meta-llama/llama-3.3-70b-instruct', modelId: 'meta-llama/llama-3.3-70b-instruct', displayName: 'Llama 3.3 70B (via OpenRouter)', contextWindow: 131072, supportsVision: false, supportsTools: true },
      { id: 'deepseek/deepseek-chat-v3', modelId: 'deepseek/deepseek-chat-v3', displayName: 'DeepSeek V3 (via OpenRouter)', contextWindow: 131072, supportsVision: false, supportsTools: true },
      { id: 'mistralai/mistral-large', modelId: 'mistralai/mistral-large', displayName: 'Mistral Large (via OpenRouter)', contextWindow: 128000, supportsVision: false, supportsTools: true },
      { id: 'qwen/qwen-2.5-72b-instruct', modelId: 'qwen/qwen-2.5-72b-instruct', displayName: 'Qwen 2.5 72B (via OpenRouter)', contextWindow: 131072, supportsVision: false, supportsTools: true },
    ];
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl;
  }

  normalizeParams(params?: ModelParams): Record<string, unknown> {
    return {
      temperature: params?.temperature ?? 0.7,
      max_tokens: params?.maxTokens,
      top_p: params?.topP,
    };
  }

  protected buildHeaders(config: ProviderConfig): Record<string, string> {
    const apiKey = config.apiKeyEncrypted
      ? this.decryptApiKey(config.apiKeyEncrypted)
      : this.apiKey;

    return {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'AI Afterschool',
    };
  }

  protected getDefaultBaseUrl(): string {
    return 'https://openrouter.ai/api/v1';
  }
}
```

**Step 2: 타입 체크 실행**

Run: `cd /home/gon/projects/ai/ai-afterschool && npx tsc --noEmit 2>&1 | head -30`
Expected: `openrouter.ts` 관련 에러 없음

**Step 3: 커밋**

```bash
git add src/lib/ai/adapters/openrouter.ts
git commit -m "feat: OpenRouter 어댑터 구현 (OpenAI Compatible 기반)"
```

---

### Task 3: 어댑터 팩토리 등록

**Files:**
- Modify: `src/lib/ai/adapters/index.ts:14` (import 추가)
- Modify: `src/lib/ai/adapters/index.ts:44` (등록 추가)
- Modify: `src/lib/ai/adapters/index.ts:183` (re-export 추가)

**Step 1: import 추가**

`src/lib/ai/adapters/index.ts`의 import 블록 끝에 (`import { XaiAdapter }` 다음):

```typescript
import { OpenRouterAdapter } from './openrouter';
```

**Step 2: registerDefaultAdapters에 등록 추가**

같은 파일의 `registerDefaultAdapters()` 메서드 끝에 (`this.adapters.set('xai', XaiAdapter);` 다음):

```typescript
    this.adapters.set('openrouter', OpenRouterAdapter);
```

**Step 3: re-export 추가**

파일 끝에 (`export { XaiAdapter }` 다음):

```typescript
export { OpenRouterAdapter } from './openrouter';
```

**Step 4: 타입 체크 실행**

Run: `cd /home/gon/projects/ai/ai-afterschool && npx tsc --noEmit 2>&1 | head -30`
Expected: 에러 없음

**Step 5: 커밋**

```bash
git add src/lib/ai/adapters/index.ts
git commit -m "feat: AdapterFactory에 OpenRouter 어댑터 등록"
```

---

### Task 4: 템플릿 추가

**Files:**
- Modify: `src/lib/ai/templates.ts:430-431` (Moonshot 템플릿과 Custom 템플릿 사이)

**Step 1: OpenRouter 템플릿 추가**

`src/lib/ai/templates.ts`에서 Moonshot 항목(line ~430) 뒤, Custom 항목(line ~432) 앞에 추가:

```typescript
  // OpenRouter (인기 - 멀티 제공자)
  {
    templateId: 'openrouter',
    name: 'OpenRouter',
    providerType: 'openrouter',
    description: '200+ AI 모델을 단일 API로 접근. OpenAI, Anthropic, Google, Meta 등',
    logoUrl: '/images/providers/openrouter.svg',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    defaultAuthType: 'api_key',
    defaultCapabilities: ['vision', 'function_calling', 'json_mode', 'streaming', 'tools'],
    defaultCostTier: 'medium',
    defaultQualityTier: 'premium',
    defaultModels: [
      {
        modelId: 'openai/gpt-4o',
        displayName: 'GPT-4o (via OpenRouter)',
        contextWindow: 128000,
        supportsVision: true,
      },
      {
        modelId: 'openai/gpt-4o-mini',
        displayName: 'GPT-4o Mini (via OpenRouter)',
        contextWindow: 128000,
        supportsVision: true,
      },
      {
        modelId: 'anthropic/claude-sonnet-4-5',
        displayName: 'Claude Sonnet 4.5 (via OpenRouter)',
        contextWindow: 200000,
        supportsVision: true,
      },
      {
        modelId: 'anthropic/claude-3-5-haiku',
        displayName: 'Claude 3.5 Haiku (via OpenRouter)',
        contextWindow: 200000,
        supportsVision: false,
      },
      {
        modelId: 'google/gemini-2.5-flash',
        displayName: 'Gemini 2.5 Flash (via OpenRouter)',
        contextWindow: 1000000,
        supportsVision: true,
      },
      {
        modelId: 'google/gemini-2.0-flash',
        displayName: 'Gemini 2.0 Flash (via OpenRouter)',
        contextWindow: 1048576,
        supportsVision: true,
      },
      {
        modelId: 'meta-llama/llama-3.3-70b-instruct',
        displayName: 'Llama 3.3 70B (via OpenRouter)',
        contextWindow: 131072,
        supportsVision: false,
      },
      {
        modelId: 'deepseek/deepseek-chat-v3',
        displayName: 'DeepSeek V3 (via OpenRouter)',
        contextWindow: 131072,
        supportsVision: false,
      },
      {
        modelId: 'mistralai/mistral-large',
        displayName: 'Mistral Large (via OpenRouter)',
        contextWindow: 128000,
        supportsVision: false,
      },
      {
        modelId: 'qwen/qwen-2.5-72b-instruct',
        displayName: 'Qwen 2.5 72B (via OpenRouter)',
        contextWindow: 131072,
        supportsVision: false,
      },
    ],
    apiKeyInstructions: 'OpenRouter 대시보드에서 API 키를 생성하세요. Settings → Keys → Create Key',
    apiKeyUrl: 'https://openrouter.ai/keys',
    helpUrl: 'https://openrouter.ai/docs',
    isPopular: true,
    sortOrder: 5,
  },
```

**Step 2: 타입 체크 실행**

Run: `cd /home/gon/projects/ai/ai-afterschool && npx tsc --noEmit 2>&1 | head -30`
Expected: 에러 없음

**Step 3: 커밋**

```bash
git add src/lib/ai/templates.ts
git commit -m "feat: OpenRouter 제공자 템플릿 추가 (인기 10개 모델 포함)"
```

---

### Task 5: 프론트엔드 Zod 스키마 업데이트

**Files:**
- Modify: `src/components/admin/llm-providers/provider-form.tsx:46-58` (Zod enum)

**Step 1: providerType enum에 'openrouter' 추가**

`src/components/admin/llm-providers/provider-form.tsx`의 Zod 스키마에서 `'moonshot'` 다음에 `'openrouter'` 추가:

```typescript
  providerType: z.enum([
    'openai',
    'anthropic',
    'google',
    'ollama',
    'deepseek',
    'mistral',
    'cohere',
    'xai',
    'zhipu',
    'moonshot',
    'openrouter',
    'custom',
  ]),
```

**Step 2: 타입 체크 실행**

Run: `cd /home/gon/projects/ai/ai-afterschool && npx tsc --noEmit 2>&1 | head -30`
Expected: 에러 없음

**Step 3: 커밋**

```bash
git add src/components/admin/llm-providers/provider-form.tsx
git commit -m "feat: 프론트엔드 Zod 스키마에 openrouter 추가"
```

---

### Task 6: 빌드 검증 및 최종 확인

**Files:** (없음 - 검증만)

**Step 1: 전체 빌드 테스트**

Run: `cd /home/gon/projects/ai/ai-afterschool && npm run build 2>&1 | tail -20`
Expected: 빌드 성공 (no errors)

**Step 2: vitest 테스트 실행**

Run: `cd /home/gon/projects/ai/ai-afterschool && npx vitest run 2>&1 | tail -20`
Expected: 기존 테스트 모두 통과

**Step 3: 빌드 성공 확인 후 최종 커밋 (필요시)**

실패하는 부분이 있으면 수정 후 커밋. 모두 통과하면 이 단계는 스킵.
