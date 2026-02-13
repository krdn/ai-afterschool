# Universal LLM Hub 버그 수정 및 코드 품질 개선 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** LLM Hub의 타이포, 코드 품질 이슈, 누락 어댑터를 수정하여 10개 provider 모두 정상 동작하게 만든다.

**Architecture:** 기존 Adapter Pattern(BaseAdapter → 구체 어댑터) 유지. BaseAdapter에 공통 유틸 추가 후, 4개 신규 어댑터는 기존 패턴과 동일하게 구현. 각 어댑터는 Vercel AI SDK 공식 패키지 사용.

**Tech Stack:** Next.js 15, Vercel AI SDK (`@ai-sdk/deepseek`, `@ai-sdk/mistral`, `@ai-sdk/cohere`, `@ai-sdk/xai`), TypeScript

---

### Task 1: 타이포 수정

**Files:**
- Modify: `src/components/admin/llm-providers/provider-card.tsx:388`
- Modify: `src/components/admin/llm-providers/provider-form.tsx:429,517`
- Modify: `src/components/admin/llm-providers/template-selector.tsx:213`
- Modify: `src/lib/ai/adapters/index.ts:164`

**Step 1: 타이포 5곳 수정**

provider-card.tsx:388 `묶뤂` → `무료`
provider-form.tsx:517 `묶뤂` → `무료`
provider-form.tsx:429 `대첸` → `대체`
template-selector.tsx:213 `묶뤂` → `무료`
adapters/index.ts:164 `재낳ㅇ` → `재export`

**Step 2: 빌드 확인**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: 에러 없음

**Step 3: 커밋**

```bash
git add src/components/admin/llm-providers/provider-card.tsx \
  src/components/admin/llm-providers/provider-form.tsx \
  src/components/admin/llm-providers/template-selector.tsx \
  src/lib/ai/adapters/index.ts
git commit -m "fix: 한글 타이포 수정 (묶뤂→무료, 대첸→대체, 재낳ㅇ→재export)"
```

---

### Task 2: 코드 품질 정리

**Files:**
- Modify: `src/components/admin/llm-providers/provider-form.tsx:138-143`
- Modify: `src/components/admin/llm-providers/provider-card.tsx:69,438-443`

**Step 1: console.log 제거**

provider-form.tsx에서 다음 3줄 제거:
```typescript
console.log('ProviderForm - provider.models:', provider.models);
console.log('ProviderForm - defaultModel:', defaultModel);
console.log('ProviderForm - hasApiKey:', provider.hasApiKey);
```

**Step 2: 미사용 maskApiKey 함수 제거**

provider-card.tsx에서 `maskApiKey` 함수 전체 제거 (438-443줄):
```typescript
// 삭제 대상
function maskApiKey(key: string): string {
  if (!key || key.length < 8) return key;
  const prefix = key.slice(0, 4);
  const suffix = key.slice(-4);
  return `${prefix}...${suffix}`;
}
```

**Step 3: 타입 단언 개선**

provider-card.tsx:69에서:
```typescript
// Before
const providerData = provider as unknown as Record<string, unknown>;

// After - 제거하고 provider를 직접 사용
// providerData 참조를 모두 provider로 변경
// provider 타입에 없는 필드는 Prisma Provider 타입에서 이미 제공됨
```

provider-card.tsx의 `providerData.xxx` 참조를 `provider.xxx`로 변경.
ProviderWithModels 타입이 Prisma Provider를 확장하므로 isEnabled, capabilities, costTier, qualityTier 등 모든 필드 접근 가능.

testStatus 초기화도 개선:
```typescript
// Before
const [testStatus, setTestStatus] = useState<{...}>({
  tested: (provider as unknown as Record<string, unknown>).isValidated as boolean,
  success: (provider as unknown as Record<string, unknown>).isValidated as boolean,
});

// After
const [testStatus, setTestStatus] = useState<{...}>({
  tested: provider.isValidated,
  success: provider.isValidated,
});
```

**Step 4: 빌드 확인**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: 에러 없음

**Step 5: 커밋**

```bash
git add src/components/admin/llm-providers/provider-form.tsx \
  src/components/admin/llm-providers/provider-card.tsx
git commit -m "refactor: 디버그 로그 제거, 미사용 함수 제거, 타입 단언 개선"
```

---

### Task 3: BaseAdapter에 decryptApiKey 추가 및 기존 어댑터 정리

**Files:**
- Modify: `src/lib/ai/adapters/base.ts`
- Modify: `src/lib/ai/adapters/openai.ts`
- Modify: `src/lib/ai/adapters/anthropic.ts`
- Modify: `src/lib/ai/adapters/google.ts`
- Modify: `src/lib/ai/adapters/ollama.ts`
- Modify: `src/lib/ai/adapters/moonshot.ts`
- Modify: `src/lib/ai/adapters/zhipu.ts`

**Step 1: BaseAdapter에 protected decryptApiKey 추가**

`src/lib/ai/adapters/base.ts`의 `handleError` 메서드 아래에 추가:

```typescript
/**
 * 암호화된 API 키를 복호화합니다.
 *
 * @param encrypted - 암호화된 API 키
 * @returns 복호화된 API 키 (실패 시 빈 문자열)
 */
protected decryptApiKey(encrypted: string | null): string {
  if (!encrypted) return '';
  try {
    const { decryptApiKey } = require('../encryption');
    return decryptApiKey(encrypted);
  } catch {
    return '';
  }
}
```

**Step 2: 6개 어댑터에서 private decryptApiKey 제거**

각 파일에서 다음 블록 삭제:
- `src/lib/ai/adapters/openai.ts:196-204`
- `src/lib/ai/adapters/anthropic.ts:183-191`
- `src/lib/ai/adapters/google.ts:182-190`
- `src/lib/ai/adapters/ollama.ts:286-294`
- `src/lib/ai/adapters/moonshot.ts:232-240`
- `src/lib/ai/adapters/zhipu.ts:220-228`

각 어댑터의 `this.decryptApiKey()` 호출은 변경 불필요 (private→protected 상속으로 자동 전환)

**Step 3: 빌드 확인**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: 에러 없음

**Step 4: 커밋**

```bash
git add src/lib/ai/adapters/
git commit -m "refactor: decryptApiKey를 BaseAdapter로 이동하여 중복 제거"
```

---

### Task 4: DeepSeek 어댑터 구현

**Files:**
- Create: `src/lib/ai/adapters/deepseek.ts`
- Modify: `src/lib/ai/adapters/index.ts`

**Step 1: 어댑터 파일 생성**

`src/lib/ai/adapters/deepseek.ts`:

```typescript
/**
 * DeepSeek Adapter
 *
 * Vercel AI SDK의 @ai-sdk/deepseek와 통합됩니다.
 */

import { createDeepSeek } from '@ai-sdk/deepseek';
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

export class DeepSeekAdapter extends BaseAdapter {
  readonly providerType = 'deepseek';
  readonly supportsVision = false;
  readonly supportsStreaming = true;
  readonly supportsTools = true;
  readonly supportsJsonMode = true;

  private apiKey: string = '';
  private baseUrl: string = 'https://api.deepseek.com/v1';

  createModel(modelId: string, config?: ProviderConfig): LanguageModel {
    const effectiveConfig = config || ({} as ProviderConfig);
    const effectiveApiKey = effectiveConfig.apiKeyEncrypted
      ? this.decryptApiKey(effectiveConfig.apiKeyEncrypted)
      : this.apiKey;

    const provider = createDeepSeek({
      apiKey: effectiveApiKey,
    });

    return provider(modelId);
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

    return { text: result.text, usage: result.usage };
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

    return { stream: result.textStream, provider: this.providerType, model: 'unknown' };
  }

  async validate(config: ProviderConfig): Promise<ValidationResult> {
    try {
      const apiKey = config.apiKeyEncrypted
        ? this.decryptApiKey(config.apiKeyEncrypted)
        : this.apiKey;

      if (!apiKey) {
        return { isValid: false, error: 'API 키가 설정되지 않았습니다.' };
      }

      const testModel = this.createModel('deepseek-chat', config);
      await generateText({ model: testModel, prompt: 'Hello', maxOutputTokens: 10 });

      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: this.handleError(error, 'validation').message };
    }
  }

  async listModels(_config: ProviderConfig): Promise<ModelInfo[]> {
    return [
      { id: 'deepseek-chat', modelId: 'deepseek-chat', displayName: 'DeepSeek Chat', contextWindow: 64000, supportsVision: false, supportsTools: true },
      { id: 'deepseek-reasoner', modelId: 'deepseek-reasoner', displayName: 'DeepSeek Reasoner', contextWindow: 64000, supportsVision: false, supportsTools: true },
    ];
  }

  normalizeParams(params?: ModelParams): Record<string, unknown> {
    return { temperature: params?.temperature ?? 0.7, max_tokens: params?.maxTokens, top_p: params?.topP };
  }

  setApiKey(apiKey: string): void { this.apiKey = apiKey; }
  setBaseUrl(baseUrl: string): void { this.baseUrl = baseUrl; }

  protected buildHeaders(config: ProviderConfig): Record<string, string> {
    const apiKey = config.apiKeyEncrypted ? this.decryptApiKey(config.apiKeyEncrypted) : this.apiKey;
    return { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
  }

  protected getDefaultBaseUrl(): string { return 'https://api.deepseek.com/v1'; }
}
```

**Step 2: AdapterFactory에 등록**

`src/lib/ai/adapters/index.ts`에서:
- import 추가: `import { DeepSeekAdapter } from './deepseek';`
- registerDefaultAdapters에 추가: `this.adapters.set('deepseek', DeepSeekAdapter);`
- export 추가: `export { DeepSeekAdapter } from './deepseek';`

**Step 3: 빌드 확인**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: 에러 없음

**Step 4: 커밋**

```bash
git add src/lib/ai/adapters/deepseek.ts src/lib/ai/adapters/index.ts
git commit -m "feat: DeepSeek 어댑터 구현"
```

---

### Task 5: Mistral 어댑터 구현

**Files:**
- Create: `src/lib/ai/adapters/mistral.ts`
- Modify: `src/lib/ai/adapters/index.ts`

**Step 1: 어댑터 파일 생성**

`src/lib/ai/adapters/mistral.ts`:

```typescript
/**
 * Mistral AI Adapter
 *
 * Vercel AI SDK의 @ai-sdk/mistral와 통합됩니다.
 */

import { createMistral } from '@ai-sdk/mistral';
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

export class MistralAdapter extends BaseAdapter {
  readonly providerType = 'mistral';
  readonly supportsVision = false;
  readonly supportsStreaming = true;
  readonly supportsTools = true;
  readonly supportsJsonMode = true;

  private apiKey: string = '';
  private baseUrl: string = 'https://api.mistral.ai/v1';

  createModel(modelId: string, config?: ProviderConfig): LanguageModel {
    const effectiveConfig = config || ({} as ProviderConfig);
    const effectiveApiKey = effectiveConfig.apiKeyEncrypted
      ? this.decryptApiKey(effectiveConfig.apiKeyEncrypted)
      : this.apiKey;

    const provider = createMistral({
      apiKey: effectiveApiKey,
    });

    return provider(modelId);
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

    return { text: result.text, usage: result.usage };
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

    return { stream: result.textStream, provider: this.providerType, model: 'unknown' };
  }

  async validate(config: ProviderConfig): Promise<ValidationResult> {
    try {
      const apiKey = config.apiKeyEncrypted
        ? this.decryptApiKey(config.apiKeyEncrypted)
        : this.apiKey;

      if (!apiKey) {
        return { isValid: false, error: 'API 키가 설정되지 않았습니다.' };
      }

      const testModel = this.createModel('mistral-small-latest', config);
      await generateText({ model: testModel, prompt: 'Hello', maxOutputTokens: 10 });

      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: this.handleError(error, 'validation').message };
    }
  }

  async listModels(_config: ProviderConfig): Promise<ModelInfo[]> {
    return [
      { id: 'mistral-large-latest', modelId: 'mistral-large-latest', displayName: 'Mistral Large', contextWindow: 128000, supportsVision: false, supportsTools: true },
      { id: 'mistral-medium-latest', modelId: 'mistral-medium-latest', displayName: 'Mistral Medium', contextWindow: 128000, supportsVision: false, supportsTools: true },
      { id: 'mistral-small-latest', modelId: 'mistral-small-latest', displayName: 'Mistral Small', contextWindow: 128000, supportsVision: false, supportsTools: true },
      { id: 'codestral-latest', modelId: 'codestral-latest', displayName: 'Codestral', contextWindow: 32000, supportsVision: false, supportsTools: true },
    ];
  }

  normalizeParams(params?: ModelParams): Record<string, unknown> {
    return { temperature: params?.temperature ?? 0.7, max_tokens: params?.maxTokens, top_p: params?.topP };
  }

  setApiKey(apiKey: string): void { this.apiKey = apiKey; }
  setBaseUrl(baseUrl: string): void { this.baseUrl = baseUrl; }

  protected buildHeaders(config: ProviderConfig): Record<string, string> {
    const apiKey = config.apiKeyEncrypted ? this.decryptApiKey(config.apiKeyEncrypted) : this.apiKey;
    return { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
  }

  protected getDefaultBaseUrl(): string { return 'https://api.mistral.ai/v1'; }
}
```

**Step 2: AdapterFactory에 등록**

`src/lib/ai/adapters/index.ts`에서:
- import 추가: `import { MistralAdapter } from './mistral';`
- registerDefaultAdapters에 추가: `this.adapters.set('mistral', MistralAdapter);`
- export 추가: `export { MistralAdapter } from './mistral';`

**Step 3: 빌드 확인**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: 에러 없음

**Step 4: 커밋**

```bash
git add src/lib/ai/adapters/mistral.ts src/lib/ai/adapters/index.ts
git commit -m "feat: Mistral AI 어댑터 구현"
```

---

### Task 6: Cohere 어댑터 구현

**Files:**
- Create: `src/lib/ai/adapters/cohere.ts`
- Modify: `src/lib/ai/adapters/index.ts`

**Step 1: 어댑터 파일 생성**

`src/lib/ai/adapters/cohere.ts`:

```typescript
/**
 * Cohere Adapter
 *
 * Vercel AI SDK의 @ai-sdk/cohere와 통합됩니다.
 */

import { createCohere } from '@ai-sdk/cohere';
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

export class CohereAdapter extends BaseAdapter {
  readonly providerType = 'cohere';
  readonly supportsVision = false;
  readonly supportsStreaming = true;
  readonly supportsTools = true;
  readonly supportsJsonMode = false;

  private apiKey: string = '';
  private baseUrl: string = 'https://api.cohere.com/v1';

  createModel(modelId: string, config?: ProviderConfig): LanguageModel {
    const effectiveConfig = config || ({} as ProviderConfig);
    const effectiveApiKey = effectiveConfig.apiKeyEncrypted
      ? this.decryptApiKey(effectiveConfig.apiKeyEncrypted)
      : this.apiKey;

    const provider = createCohere({
      apiKey: effectiveApiKey,
    });

    return provider(modelId);
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

    return { text: result.text, usage: result.usage };
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

    return { stream: result.textStream, provider: this.providerType, model: 'unknown' };
  }

  async validate(config: ProviderConfig): Promise<ValidationResult> {
    try {
      const apiKey = config.apiKeyEncrypted
        ? this.decryptApiKey(config.apiKeyEncrypted)
        : this.apiKey;

      if (!apiKey) {
        return { isValid: false, error: 'API 키가 설정되지 않았습니다.' };
      }

      const testModel = this.createModel('command-r', config);
      await generateText({ model: testModel, prompt: 'Hello', maxOutputTokens: 10 });

      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: this.handleError(error, 'validation').message };
    }
  }

  async listModels(_config: ProviderConfig): Promise<ModelInfo[]> {
    return [
      { id: 'command-r-plus', modelId: 'command-r-plus', displayName: 'Command R+', contextWindow: 128000, supportsVision: false, supportsTools: true },
      { id: 'command-r', modelId: 'command-r', displayName: 'Command R', contextWindow: 128000, supportsVision: false, supportsTools: true },
    ];
  }

  normalizeParams(params?: ModelParams): Record<string, unknown> {
    return { temperature: params?.temperature ?? 0.7, max_tokens: params?.maxTokens, p: params?.topP };
  }

  setApiKey(apiKey: string): void { this.apiKey = apiKey; }
  setBaseUrl(baseUrl: string): void { this.baseUrl = baseUrl; }

  protected buildHeaders(config: ProviderConfig): Record<string, string> {
    const apiKey = config.apiKeyEncrypted ? this.decryptApiKey(config.apiKeyEncrypted) : this.apiKey;
    return { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
  }

  protected getDefaultBaseUrl(): string { return 'https://api.cohere.com/v1'; }
}
```

**Step 2: AdapterFactory에 등록**

`src/lib/ai/adapters/index.ts`에서:
- import 추가: `import { CohereAdapter } from './cohere';`
- registerDefaultAdapters에 추가: `this.adapters.set('cohere', CohereAdapter);`
- export 추가: `export { CohereAdapter } from './cohere';`

**Step 3: 빌드 확인**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: 에러 없음

**Step 4: 커밋**

```bash
git add src/lib/ai/adapters/cohere.ts src/lib/ai/adapters/index.ts
git commit -m "feat: Cohere 어댑터 구현"
```

---

### Task 7: xAI (Grok) 어댑터 구현

**Files:**
- Create: `src/lib/ai/adapters/xai.ts`
- Modify: `src/lib/ai/adapters/index.ts`

**Step 1: 어댑터 파일 생성**

`src/lib/ai/adapters/xai.ts`:

```typescript
/**
 * xAI (Grok) Adapter
 *
 * Vercel AI SDK의 @ai-sdk/xai와 통합됩니다.
 */

import { createXai } from '@ai-sdk/xai';
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

export class XaiAdapter extends BaseAdapter {
  readonly providerType = 'xai';
  readonly supportsVision = true;
  readonly supportsStreaming = true;
  readonly supportsTools = true;
  readonly supportsJsonMode = true;

  private apiKey: string = '';
  private baseUrl: string = 'https://api.x.ai/v1';

  createModel(modelId: string, config?: ProviderConfig): LanguageModel {
    const effectiveConfig = config || ({} as ProviderConfig);
    const effectiveApiKey = effectiveConfig.apiKeyEncrypted
      ? this.decryptApiKey(effectiveConfig.apiKeyEncrypted)
      : this.apiKey;

    const provider = createXai({
      apiKey: effectiveApiKey,
    });

    return provider(modelId);
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

    return { text: result.text, usage: result.usage };
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

    return { stream: result.textStream, provider: this.providerType, model: 'unknown' };
  }

  async validate(config: ProviderConfig): Promise<ValidationResult> {
    try {
      const apiKey = config.apiKeyEncrypted
        ? this.decryptApiKey(config.apiKeyEncrypted)
        : this.apiKey;

      if (!apiKey) {
        return { isValid: false, error: 'API 키가 설정되지 않았습니다.' };
      }

      const testModel = this.createModel('grok-3-mini', config);
      await generateText({ model: testModel, prompt: 'Hello', maxOutputTokens: 10 });

      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: this.handleError(error, 'validation').message };
    }
  }

  async listModels(_config: ProviderConfig): Promise<ModelInfo[]> {
    return [
      { id: 'grok-3', modelId: 'grok-3', displayName: 'Grok 3', contextWindow: 131072, supportsVision: true, supportsTools: true },
      { id: 'grok-3-fast', modelId: 'grok-3-fast', displayName: 'Grok 3 Fast', contextWindow: 131072, supportsVision: true, supportsTools: true },
      { id: 'grok-3-mini', modelId: 'grok-3-mini', displayName: 'Grok 3 Mini', contextWindow: 131072, supportsVision: false, supportsTools: true },
    ];
  }

  normalizeParams(params?: ModelParams): Record<string, unknown> {
    return { temperature: params?.temperature ?? 0.7, max_tokens: params?.maxTokens, top_p: params?.topP };
  }

  setApiKey(apiKey: string): void { this.apiKey = apiKey; }
  setBaseUrl(baseUrl: string): void { this.baseUrl = baseUrl; }

  protected buildHeaders(config: ProviderConfig): Record<string, string> {
    const apiKey = config.apiKeyEncrypted ? this.decryptApiKey(config.apiKeyEncrypted) : this.apiKey;
    return { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
  }

  protected getDefaultBaseUrl(): string { return 'https://api.x.ai/v1'; }
}
```

**Step 2: AdapterFactory에 등록**

`src/lib/ai/adapters/index.ts`에서:
- import 추가: `import { XaiAdapter } from './xai';`
- registerDefaultAdapters에 추가: `this.adapters.set('xai', XaiAdapter);`
- export 추가: `export { XaiAdapter } from './xai';`

**Step 3: 빌드 확인**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: 에러 없음

**Step 4: 커밋**

```bash
git add src/lib/ai/adapters/xai.ts src/lib/ai/adapters/index.ts
git commit -m "feat: xAI (Grok) 어댑터 구현"
```

---

### Task 8: Streaming 정합성 수정

**Files:**
- Modify: `src/lib/ai/adapters/moonshot.ts`
- Modify: `src/lib/ai/adapters/zhipu.ts`

**Step 1: supportsStreaming을 false로 변경**

moonshot.ts:
```typescript
// Before
readonly supportsStreaming = true;

// After
readonly supportsStreaming = false;
```

zhipu.ts:
```typescript
// Before
readonly supportsStreaming = true;

// After
readonly supportsStreaming = false;
```

**Step 2: 빌드 확인**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: 에러 없음

**Step 3: 커밋**

```bash
git add src/lib/ai/adapters/moonshot.ts src/lib/ai/adapters/zhipu.ts
git commit -m "fix: Moonshot/Zhipu supportsStreaming을 미구현 상태에 맞게 false로 변경"
```

---

### Task 9: 최종 검증

**Step 1: 전체 타입 체크**

Run: `npx tsc --noEmit --pretty`
Expected: 에러 없음

**Step 2: 기존 테스트 실행**

Run: `npx vitest run --reporter=verbose 2>&1 | tail -30`
Expected: 기존 테스트 모두 통과

**Step 3: 어댑터 팩토리 등록 확인**

등록된 10개 타입 확인:
openai, anthropic, google, ollama, deepseek, mistral, cohere, xai, zhipu, moonshot

---
