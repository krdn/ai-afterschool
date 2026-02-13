# OpenRouter 제공자 추가 설계

**날짜:** 2026-02-13
**상태:** 승인됨
**브랜치:** feat/llm

## 목적

Universal LLM Hub에 OpenRouter 제공자를 추가하여, 단일 API 키로 200+ LLM 모델(OpenAI, Anthropic, Google, Meta 등)에 접근할 수 있도록 한다.

## 결정사항

| 항목 | 결정 | 근거 |
|------|------|------|
| SDK | `@ai-sdk/openai-compatible` | 기존 Moonshot/DeepSeek 패턴과 동일, 이미 설치됨 |
| 기본 모델 | 인기 10개 | 주요 제공자별 대표 모델 포함, 나머지는 API 동기화 |
| 모델 ID | 원본 그대로 (`openai/gpt-4o`) | displayName에 "(via OpenRouter)" 표기로 구분 |
| 기능 범위 | 기본 기능만 | 텍스트 생성, 스트리밍, 연결 테스트, 모델 동기화 |
| 고유 헤더 | `HTTP-Referer`, `X-Title` | 레이트리밋 완화 및 대시보드 식별 |

## 아키텍처

### 새 파일 (1개)

#### `src/lib/ai/adapters/openrouter.ts`

```
OpenRouterAdapter extends BaseAdapter
├── providerType: 'openrouter'
├── supportsVision: true
├── supportsStreaming: true
├── supportsTools: true
├── supportsJsonMode: true
│
├── createModel(modelId, config?)
│   → createOpenAICompatible('openrouter', { baseURL, apiKey, headers })
│
├── validate(config)
│   → GET /api/v1/auth/key (무비용 검증)
│
├── listModels(config)
│   → GET /api/v1/models (공개 API, 인증 불필요)
│   → id, name, context_length, pricing, supported_parameters 파싱
│
├── buildHeaders(config)
│   → HTTP-Referer: NEXT_PUBLIC_APP_URL
│   → X-Title: 'AI Afterschool'
│
└── normalizeParams(params)
    → temperature, max_tokens, top_p 표준 매핑
```

### 수정 파일 (4개)

#### `src/lib/ai/types.ts`
- `ProviderType` union에 `'openrouter'` 추가

#### `src/lib/ai/adapters/index.ts`
- `import { OpenRouterAdapter }` 추가
- `registerAdapter('openrouter', OpenRouterAdapter)` 등록

#### `src/lib/ai/templates.ts`
- OpenRouter 템플릿 추가 (sortOrder: 5, isPopular: true)

#### 프론트엔드 Zod 스키마
- `providerType` enum에 `'openrouter'` 추가

## 기본 모델 목록 (10개)

| modelId | displayName | contextWindow | vision |
|---------|-------------|---------------|--------|
| `openai/gpt-4o` | GPT-4o (via OpenRouter) | 128,000 | Yes |
| `openai/gpt-4o-mini` | GPT-4o Mini (via OpenRouter) | 128,000 | Yes |
| `anthropic/claude-sonnet-4-5` | Claude Sonnet 4.5 (via OpenRouter) | 200,000 | Yes |
| `anthropic/claude-3-5-haiku` | Claude 3.5 Haiku (via OpenRouter) | 200,000 | No |
| `google/gemini-2.5-flash` | Gemini 2.5 Flash (via OpenRouter) | 1,000,000 | Yes |
| `google/gemini-2.0-flash` | Gemini 2.0 Flash (via OpenRouter) | 1,048,576 | Yes |
| `meta-llama/llama-3.3-70b-instruct` | Llama 3.3 70B (via OpenRouter) | 131,072 | No |
| `deepseek/deepseek-chat-v3` | DeepSeek V3 (via OpenRouter) | 131,072 | No |
| `mistralai/mistral-large` | Mistral Large (via OpenRouter) | 128,000 | No |
| `qwen/qwen-2.5-72b-instruct` | Qwen 2.5 72B (via OpenRouter) | 131,072 | No |

## 연결 검증

기존 어댑터는 `generateText()`로 1토큰을 소모하여 검증하지만, OpenRouter는 전용 엔드포인트 사용:

```
GET https://openrouter.ai/api/v1/auth/key
Authorization: Bearer <api_key>

성공 응답: { "data": { "label": "...", "limit": ..., "usage": ... } }
실패 응답: 401 Unauthorized
```

## 에러 처리

| 상황 | 처리 |
|------|------|
| API 키 무효 (401) | "API 키가 유효하지 않습니다" |
| 크레딧 부족 (402) | "OpenRouter 크레딧이 부족합니다. 충전 후 다시 시도하세요" |
| 모델 동기화 실패 | 기본 모델 10개를 폴백으로 반환 |
| 네트워크 에러 | BaseAdapter 표준 에러 핸들링 |

## UI 변경

없음. 템플릿 시스템에 의해 자동으로 TemplateSelector에 노출됨.

## 추가 패키지

없음. `@ai-sdk/openai-compatible`이 이미 설치되어 있음.
