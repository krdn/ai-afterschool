# Phase 15: Multi-LLM Integration & Smart Routing - Research

**Researched:** 2026-01-31
**Domain:** Multi-Provider LLM Integration, Cost Optimization, Failover Patterns
**Confidence:** HIGH

## Summary

This phase implements a unified LLM provider interface supporting Ollama (local), Google Gemini, OpenAI (ChatGPT), and Anthropic Claude. The research confirms that **Vercel AI SDK** is the standard solution for this domain, providing a unified interface across all target providers with built-in streaming support, token usage tracking, and consistent error handling.

Key findings:
- Vercel AI SDK v4+ provides unified `generateText`/`streamText` APIs that work identically across all providers
- Token usage information is automatically tracked and returned by the SDK, enabling straightforward cost calculation
- The SDK supports built-in retry logic (`maxRetries` parameter) but not provider-level failover - we must implement that ourselves
- Ollama integration requires `ollama-ai-provider-v2` community package with custom `baseURL` for Docker networking
- API key encryption should use Node.js built-in `crypto` module with AES-256-GCM (no additional dependencies needed)

**Primary recommendation:** Use Vercel AI SDK with provider-specific packages, implement custom failover logic at the service layer, and store encrypted API keys in PostgreSQL.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `ai` | ^4.0.0 | Vercel AI SDK core | Official unified LLM interface from Vercel, 5700+ code snippets, HIGH reputation |
| `@ai-sdk/anthropic` | ^1.0.0 | Claude provider | Official Vercel AI SDK provider for Anthropic |
| `@ai-sdk/openai` | ^1.0.0 | OpenAI provider | Official Vercel AI SDK provider for OpenAI |
| `@ai-sdk/google` | ^1.0.0 | Gemini provider | Official Vercel AI SDK provider for Google Gemini |
| `ollama-ai-provider-v2` | ^2.0.0 | Ollama provider | Community provider for local Ollama, direct HTTP API |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `recharts` | ^3.7.0 | Dashboard charts | Already in project, use for cost/usage dashboards |
| `crypto` (Node built-in) | - | API key encryption | AES-256-GCM encryption for stored API keys |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vercel AI SDK | LiteLLM | Python-focused, would require separate service |
| Vercel AI SDK | LangChain | More complex, overkill for this use case |
| Custom failover | Requesty gateway | External service dependency, adds latency |

**Installation:**
```bash
npm install ai @ai-sdk/anthropic @ai-sdk/openai @ai-sdk/google ollama-ai-provider-v2
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   └── ai/
│       ├── providers/           # Provider configurations
│       │   ├── index.ts         # Provider registry
│       │   ├── anthropic.ts     # Claude provider setup
│       │   ├── openai.ts        # OpenAI provider setup
│       │   ├── google.ts        # Gemini provider setup
│       │   └── ollama.ts        # Ollama provider setup
│       ├── router.ts            # Smart routing & failover logic
│       ├── usage-tracker.ts     # Token/cost tracking service
│       └── config.ts            # LLM config management
├── app/
│   ├── (dashboard)/
│   │   └── admin/
│   │       ├── llm-settings/   # Provider configuration UI
│   │       └── usage/          # Usage dashboard
│   └── api/
│       └── llm/
│           └── test-provider/  # API key validation endpoint
└── components/
    └── admin/
        ├── provider-card.tsx    # Provider config card
        └── usage-charts.tsx     # Cost/usage visualization
```

### Pattern 1: Unified Provider Interface
**What:** Wrap all LLM calls through a single service that handles provider selection, failover, and usage tracking
**When to use:** Always - never call providers directly from actions

**Example:**
```typescript
// Source: Vercel AI SDK official docs
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { createOllama } from 'ollama-ai-provider-v2';

// Provider registry with unified interface
const providers = {
  anthropic: () => anthropic('claude-sonnet-4-5'),
  openai: () => openai('gpt-4o'),
  google: () => google('gemini-2.5-flash'),
  ollama: () => {
    const ollama = createOllama({ baseURL: 'http://192.168.0.5:11434/api' });
    return ollama('llama3.1');
  }
};

// Unified call with failover
async function generateWithFallback(
  prompt: string,
  featureType: 'learning_analysis' | 'counseling' | 'report',
  providerOrder: string[] // e.g., ['ollama', 'anthropic']
) {
  for (const providerName of providerOrder) {
    try {
      const model = providers[providerName]();
      const result = await generateText({
        model,
        prompt,
        maxRetries: 0, // We handle retries at provider level
      });
      
      // Track usage
      await trackUsage({
        provider: providerName,
        feature: featureType,
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
        responseTime: result.response?.timestamp,
      });
      
      return result;
    } catch (error) {
      console.error(`Provider ${providerName} failed:`, error);
      // Continue to next provider
    }
  }
  throw new Error('All providers failed');
}
```

### Pattern 2: Token Usage Tracking
**What:** Capture token usage from every LLM call and persist for cost analysis
**When to use:** On every LLM request completion

**Example:**
```typescript
// Source: Vercel AI SDK usage documentation
interface LanguageModelUsage {
  inputTokens?: number;
  inputTokenDetails?: {
    cacheReadTokens?: number;
    cacheWriteTokens?: number;
  };
  outputTokens?: number;
  outputTokenDetails?: {
    textTokens?: number;
    reasoningTokens?: number;
  };
  totalTokens?: number;
}

// Cost calculation per provider (prices per 1M tokens, 2026)
const COST_PER_MILLION_TOKENS = {
  anthropic: { input: 3.0, output: 15.0 },      // Sonnet 4.5
  openai: { input: 2.5, output: 10.0 },          // GPT-4o
  google: { input: 0.30, output: 2.50 },         // Gemini 2.5 Flash
  ollama: { input: 0, output: 0 },               // Local, free
};

function calculateCost(
  provider: string,
  inputTokens: number,
  outputTokens: number
): number {
  const costs = COST_PER_MILLION_TOKENS[provider];
  if (!costs) return 0;
  
  return (
    (inputTokens / 1_000_000) * costs.input +
    (outputTokens / 1_000_000) * costs.output
  );
}
```

### Pattern 3: API Key Encryption
**What:** Encrypt API keys before storing in database, decrypt on use
**When to use:** When storing provider API keys

**Example:**
```typescript
// Source: Node.js crypto best practices
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ENCRYPTION_KEY = process.env.API_KEY_ENCRYPTION_SECRET!; // 32 bytes
const ALGORITHM = 'aes-256-gcm';

export function encryptApiKey(plaintext: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Format: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decryptApiKey(encryptedData: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

### Pattern 4: Feature-Based Model Mapping
**What:** Map application features to specific provider/model combinations
**When to use:** Admin settings and routing decisions

**Example:**
```typescript
// Feature type definitions
type FeatureType = 
  | 'learning_analysis'   // 학습 분석
  | 'counseling_suggest'  // 상담 제안
  | 'report_generate'     // 보고서 생성
  | 'face_analysis'       // 관상 분석
  | 'palm_analysis';      // 손금 분석

interface FeatureConfig {
  primaryProvider: string;
  fallbackOrder: string[];
  modelId?: string; // Optional model override
}

// Stored in LLMConfig table
const defaultFeatureMapping: Record<FeatureType, FeatureConfig> = {
  learning_analysis: {
    primaryProvider: 'ollama',
    fallbackOrder: ['anthropic', 'openai'],
  },
  counseling_suggest: {
    primaryProvider: 'anthropic',
    fallbackOrder: ['openai', 'google'],
  },
  report_generate: {
    primaryProvider: 'anthropic',
    fallbackOrder: ['openai'],
  },
  face_analysis: {
    primaryProvider: 'anthropic', // Vision required
    fallbackOrder: ['openai', 'google'],
  },
  palm_analysis: {
    primaryProvider: 'anthropic', // Vision required
    fallbackOrder: ['openai', 'google'],
  },
};
```

### Anti-Patterns to Avoid
- **Direct provider calls:** Never import and call Anthropic SDK directly; always go through the unified service layer
- **Storing API keys in plaintext:** Always encrypt before database storage
- **Ignoring usage tracking:** Every LLM call must be tracked for cost visibility
- **Synchronous failover checks:** Use immediate failover on error, not health checks

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Unified LLM interface | Custom provider abstraction | Vercel AI SDK | 4000+ code examples, handles edge cases, streaming support |
| Token counting | Manual token estimation | SDK's usage response | Each provider counts differently, SDK normalizes |
| Retry logic | Custom retry implementation | SDK's `maxRetries` + custom failover | SDK handles transient errors properly |
| API key masking | String manipulation | Standard pattern: `sk-***...***xyz` | Consistent UX, prevents accidental exposure |

**Key insight:** The Vercel AI SDK already handles the complex parts (streaming, token counting, provider-specific quirks). Focus implementation effort on the routing logic and usage tracking.

## Common Pitfalls

### Pitfall 1: Ollama Docker Networking
**What goes wrong:** Ollama calls fail when running from Next.js on different network
**Why it happens:** Default localhost:11434 doesn't work cross-container or cross-machine
**How to avoid:** Configure Ollama provider with explicit IP (`192.168.0.5:11434`)
**Warning signs:** Connection refused errors, timeout on Ollama calls

### Pitfall 2: Token Count Discrepancies
**What goes wrong:** Cost calculations are inaccurate
**Why it happens:** Different providers count tokens differently; using estimates instead of actual
**How to avoid:** Always use `result.usage` from the SDK response, not estimates
**Warning signs:** Reported costs don't match provider bills

### Pitfall 3: Missing Vision Model Fallbacks
**What goes wrong:** Image analysis fails completely when primary provider is down
**Why it happens:** Not all providers support vision; falling back to text-only model
**How to avoid:** Only include vision-capable providers in fallback chain for image features
**Warning signs:** "Model does not support images" errors in failover

### Pitfall 4: Cost Alert Storm
**What goes wrong:** Directors receive hundreds of alerts
**Why it happens:** Alerts triggered on every threshold crossing without debouncing
**How to avoid:** Only alert once per threshold per time period (e.g., once per hour for 80%)
**Warning signs:** Duplicate alerts in notification center

### Pitfall 5: Encryption Key Management
**What goes wrong:** API keys become unrecoverable or security is compromised
**Why it happens:** Storing encryption key in code or losing it during deployment
**How to avoid:** Use environment variable, document key rotation procedure
**Warning signs:** Decryption failures after deployment

## Code Examples

Verified patterns from official sources:

### Vercel AI SDK - Text Generation with Usage
```typescript
// Source: Context7 - /vercel/ai
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

const result = await generateText({
  model: anthropic('claude-sonnet-4-5'),
  prompt: 'Describe the student learning strategy.',
  maxRetries: 2,
});

// Access response
const text = result.text;
const usage = result.usage;
// usage.inputTokens, usage.outputTokens, usage.totalTokens
```

### Streaming with Usage Tracking
```typescript
// Source: Context7 - /vercel/ai
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

const result = streamText({
  model: openai('gpt-4o'),
  prompt: 'Generate a career guidance report.',
});

// Stream text
for await (const textPart of result.textStream) {
  process.stdout.write(textPart);
}

// Get usage after stream completes
const usage = await result.usage;
const finishReason = await result.finishReason;
```

### Ollama Local Configuration
```typescript
// Source: Context7 - /ollama/ollama-js, ollama-ai-provider-v2 docs
import { createOllama } from 'ollama-ai-provider-v2';

const ollama = createOllama({
  baseURL: 'http://192.168.0.5:11434/api', // Docker host on home server
});

const model = ollama('llama3.1');

// Use with Vercel AI SDK
const result = await generateText({
  model,
  prompt: 'Analyze the learning pattern.',
});
```

### Google Gemini Configuration
```typescript
// Source: Context7 - /vercel/ai, /websites/ai_google_dev_api
import { google } from '@ai-sdk/google';

// Uses GOOGLE_GENERATIVE_AI_API_KEY env var by default
const model = google('gemini-2.5-flash');

const result = await generateText({
  model,
  prompt: 'Summarize the personality analysis.',
});
```

### API Key Validation Endpoint
```typescript
// Source: Best practices for API key validation
// app/api/llm/test-provider/route.ts
import { NextResponse } from 'next/server';
import { generateText } from 'ai';

export async function POST(request: Request) {
  const { provider, apiKey } = await request.json();
  
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
  
  try {
    // Create temporary provider with the API key
    const model = createProviderWithKey(provider, apiKey);
    
    await generateText({
      model,
      prompt: 'Say "API key is valid"',
      maxTokens: 10,
      abortSignal: controller.signal,
    });
    
    clearTimeout(timeout);
    return NextResponse.json({ valid: true });
  } catch (error) {
    clearTimeout(timeout);
    return NextResponse.json({ 
      valid: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Direct provider SDKs | Vercel AI SDK unified interface | 2024 | Single API for all providers |
| Manual token counting | SDK-provided usage stats | 2024 | Accurate cost tracking |
| Separate streaming implementations | SDK's `streamText` | 2024 | Consistent streaming across providers |
| Environment-only API keys | Encrypted DB storage per tenant | 2025 | Multi-tenant API key management |

**Deprecated/outdated:**
- `@anthropic-ai/sdk` direct usage: Use `@ai-sdk/anthropic` instead for unified interface
- `ollama-ai-provider` (v1): Use `ollama-ai-provider-v2` for better compatibility
- Manual prompt caching: SDK now handles caching for supported providers

## Database Schema Recommendation

Based on the requirements and Claude's Discretion area:

```prisma
// LLM Provider Configuration (per-tenant)
model LLMConfig {
  id              String   @id @default(cuid())
  provider        String   // 'anthropic' | 'openai' | 'google' | 'ollama'
  displayName     String   // 'Claude' | 'ChatGPT' | 'Gemini' | 'Ollama'
  apiKeyEncrypted String?  // Encrypted API key (null for Ollama)
  isEnabled       Boolean  @default(false)
  isValidated     Boolean  @default(false)
  validatedAt     DateTime?
  baseUrl         String?  // For Ollama: 'http://192.168.0.5:11434'
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@unique([provider])
}

// Feature-to-Model Mapping
model LLMFeatureConfig {
  id              String   @id @default(cuid())
  featureType     String   // 'learning_analysis' | 'counseling' | 'report' etc.
  primaryProvider String   // FK to provider name
  fallbackOrder   Json     // ['anthropic', 'openai']
  modelOverride   String?  // Optional model ID override
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@unique([featureType])
}

// Usage Tracking (all dimensions)
model LLMUsage {
  id            String   @id @default(cuid())
  provider      String   // 'anthropic' | 'openai' | 'google' | 'ollama'
  modelId       String   // 'claude-sonnet-4-5' | 'gpt-4o' etc.
  featureType   String   // 'learning_analysis' | 'counseling' etc.
  teacherId     String?  // Optional: who triggered the request
  inputTokens   Int
  outputTokens  Int
  totalTokens   Int
  costUsd       Float    // Calculated cost in USD
  responseTimeMs Int     // Response time in milliseconds
  success       Boolean  @default(true)
  errorMessage  String?
  failoverFrom  String?  // If this was a fallback, which provider failed
  createdAt     DateTime @default(now())
  
  @@index([provider, createdAt])
  @@index([featureType, createdAt])
  @@index([teacherId, createdAt])
  @@index([createdAt])
}

// Monthly Aggregates (permanent storage)
model LLMUsageMonthly {
  id            String   @id @default(cuid())
  year          Int
  month         Int
  provider      String
  featureType   String
  totalRequests Int
  totalInputTokens BigInt
  totalOutputTokens BigInt
  totalCostUsd  Float
  avgResponseTimeMs Float
  successRate   Float
  createdAt     DateTime @default(now())
  
  @@unique([year, month, provider, featureType])
  @@index([year, month])
}

// Cost Budget & Alerts
model LLMBudget {
  id            String   @id @default(cuid())
  period        String   // 'daily' | 'weekly' | 'monthly'
  budgetUsd     Float
  alertAt80     Boolean  @default(true)
  alertAt100    Boolean  @default(true)
  lastAlertAt   DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@unique([period])
}
```

## Open Questions

Things that couldn't be fully resolved:

1. **Ollama Model Selection**
   - What we know: Ollama supports many models (llama3.1, mistral, etc.)
   - What's unclear: Which specific model should be the default for Korean language tasks?
   - Recommendation: Start with llama3.1:8b, allow admin to change

2. **Monthly Aggregation Timing**
   - What we know: Need to aggregate raw data to monthly table
   - What's unclear: Should this be a cron job or database trigger?
   - Recommendation: Use Next.js cron route (vercel.json or node-cron for self-hosted)

3. **Notification Center Implementation**
   - What we know: Cost alerts go to in-app notification center
   - What's unclear: Is there an existing notification system in the app?
   - Recommendation: Check Phase 14 for existing patterns; if none, create simple bell icon with dropdown

## Sources

### Primary (HIGH confidence)
- Context7 `/vercel/ai` - Unified LLM interface, streaming, usage tracking (5700+ snippets)
- Context7 `/ollama/ollama-js` - Ollama JavaScript integration
- Context7 `/websites/ai_google_dev_api` - Gemini API setup
- Official Vercel AI SDK docs - Provider configuration patterns

### Secondary (MEDIUM confidence)
- MetaCTO pricing comparison (2026) - Token pricing per provider
- pricepertoken.com - Current Anthropic/OpenAI/Google pricing
- Next.js security guide - API key protection patterns
- LiteLLM docs - Cost tracking patterns (used for reference, not implementation)

### Tertiary (LOW confidence)
- Medium articles on circuit breaker patterns - General failover approach
- GitHub repositories for circuit breaker implementations - Pattern validation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Context7 verified, official SDK documentation
- Architecture: HIGH - Patterns from official Vercel AI SDK docs
- Pitfalls: MEDIUM - Some from official docs, some from community experience
- Cost tracking: HIGH - Pricing verified from multiple 2026 sources
- DB schema: MEDIUM - Based on requirements, needs validation with existing models

**Research date:** 2026-01-31
**Valid until:** 2026-02-28 (30 days - LLM ecosystem moves fast)
