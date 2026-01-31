---
phase: 15-multi-llm-integration-smart-routing
plan: 01
subsystem: ai
tags: [vercel-ai-sdk, anthropic, openai, google, ollama, aes-256-gcm, prisma]

requires:
  - phase: 14-performance-analytics-team-insights
    provides: Performance analytics foundation

provides:
  - Vercel AI SDK integration with 4 providers
  - Provider registry with unified interface
  - API key encryption utilities (AES-256-GCM)
  - LLM configuration and usage tracking database schema

affects:
  - 15-02 (LLM provider router)
  - 15-03 (Admin settings UI)
  - 15-06 (Token usage tracking)

tech-stack:
  added:
    - ai@6.0.64
    - "@ai-sdk/anthropic@3.0.33"
    - "@ai-sdk/openai@3.0.23"
    - "@ai-sdk/google@3.0.18"
    - ollama-ai-provider-v2@3.0.3
  patterns:
    - Provider registry pattern for unified LLM access
    - AES-256-GCM encryption for API key storage

key-files:
  created:
    - src/lib/ai/providers/types.ts
    - src/lib/ai/providers/index.ts
    - src/lib/ai/encryption.ts
  modified:
    - package.json
    - prisma/schema.prisma
    - .env.example
    - .env.development

key-decisions:
  - "Used ollama-ai-provider-v2 instead of ollama-ai-provider due to Zod v4 compatibility"
  - "AES-256-GCM with iv:authTag:encrypted format for API key encryption"
  - "prisma db push instead of migrate dev due to known shadow database issue"

patterns-established:
  - "getProvider(name, model?) returns unified provider instance"
  - "COST_PER_MILLION_TOKENS constant for cost calculation"

duration: 4min
completed: 2026-01-31
---

# Phase 15 Plan 01: Vercel AI SDK Integration & DB Schema Summary

**Vercel AI SDK with 4 providers (Anthropic, OpenAI, Google, Ollama), API key encryption utilities, and Prisma models for LLM configuration/usage tracking**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-31T07:30:53Z
- **Completed:** 2026-01-31T07:35:23Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- Installed Vercel AI SDK core and 4 provider packages (anthropic, openai, google, ollama)
- Created unified provider registry with getProvider() function for consistent LLM access
- Implemented AES-256-GCM encryption for secure API key storage in database
- Added 5 Prisma models for LLM configuration and usage tracking (LLMConfig, LLMFeatureConfig, LLMUsage, LLMUsageMonthly, LLMBudget)

## Task Commits

1. **Task 1: Install Vercel AI SDK packages and setup types** - `9e420f0` (feat)
2. **Task 2: Add API key encryption utilities** - `4858efb` (feat)
3. **Task 3: Add Prisma schema for LLM configuration and usage tracking** - `4b7b88d` (feat)

## Files Created/Modified

- `src/lib/ai/providers/types.ts` - Provider and feature type definitions, cost constants
- `src/lib/ai/providers/index.ts` - Provider registry with getProvider function
- `src/lib/ai/encryption.ts` - encryptApiKey, decryptApiKey, maskApiKey functions
- `package.json` - Added 5 AI SDK packages
- `prisma/schema.prisma` - Added 5 LLM-related models
- `.env.example` - Documented API_KEY_ENCRYPTION_SECRET
- `.env.development` - Added development dummy encryption key

## Decisions Made

1. **ollama-ai-provider-v2 over ollama-ai-provider** - The v1 package had Zod v3 peer dependency conflicts with project's Zod v4
2. **AES-256-GCM encryption** - Industry standard authenticated encryption for API keys
3. **prisma db push over migrate dev** - Continued pattern from previous phases due to shadow database sync issues

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- **Ollama package conflict** - Initial `npm install ollama-ai-provider` failed due to Zod v3 vs v4 conflict. Resolved by using `ollama-ai-provider-v2` as recommended in research document.

## Next Phase Readiness

- Provider registry ready for use in 15-02 (LLM provider router)
- Encryption utilities ready for API key storage
- Database schema ready for configuration storage and usage tracking
- All must-haves verified:
  - [x] Vercel AI SDK packages installed
  - [x] LLMConfig, LLMFeatureConfig, LLMUsage, LLMUsageMonthly, LLMBudget models created
  - [x] API key encryption/decryption functions working
  - [x] Provider types and registry exported

---
*Phase: 15-multi-llm-integration-smart-routing*
*Completed: 2026-01-31*
