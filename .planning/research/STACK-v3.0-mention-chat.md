# Stack Research

**Domain:** @mention-based context injection for AI chat system
**Researched:** 2026-02-18
**Confidence:** HIGH

## Context

This is a subsequent milestone on an existing system. The project already runs:
- Next.js 15 App Router, React 19.2.3
- Prisma 7.4 + PostgreSQL
- Vercel AI SDK (`ai@^6.0.64`) with `streamText`
- shadcn/ui (Tailwind v4, Radix UI, cmdk@1.1.1)
- `use-debounce@^10.1.0` (already installed)

**This research covers ONLY net-new additions for: @mention autocomplete UI, dynamic system prompt generation, and entity data aggregation.**

---

## New Additions Required

### 1. @mention Autocomplete UI

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **react-mentions-ts** | 5.4.7 | @mention trigger in textarea | React 19 native, zero runtime deps, peer deps already in project (clsx, class-variance-authority, tailwind-merge), SSR-compatible, async data loading, Tailwind v4 ready |

**Why react-mentions-ts over alternatives:**

- `react-mentions` (signavio): v4.4.10, last updated 3 years ago. Does not support React 19. Eliminated.
- `rc-mentions` (Ant Design): v2.20.0, supports React ≥16.9. Brings Ant Design styles, conflicts with shadcn/ui Tailwind setup.
- Custom textarea + `cmdk` popover: Requires solving caret position calculation manually. `cmdk` (already installed) does not expose `getAnchorRect`-style positioning without significant custom code. Add-only if react-mentions-ts proves unsuitable.
- `@ariakit/react` combobox-textarea: Ariakit v0.4.21 has a well-documented `Combobox + textarea` pattern with precise `getAnchorRect` positioning. This is the fallback if react-mentions-ts conflicts with the existing shadcn/ui system at integration time.

**react-mentions-ts peer dependencies check (all already installed):**

| Peer Dep | Required | Installed |
|----------|----------|-----------|
| react | >=19.0.0 | 19.2.3 ✓ |
| react-dom | >=19.0.0 | 19.2.3 ✓ |
| class-variance-authority | >=0.6.0 | ^0.7.1 ✓ |
| clsx | >=2.0.0 | ^2.1.1 ✓ |
| tailwind-merge | >=3.0.0 | ^3.4.0 ✓ |

**Result: react-mentions-ts installs with zero additional transitive dependencies.**

---

### 2. Caret Position Helper (Conditional)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **textarea-caret** | 3.1.0 | Get caret x/y coordinates in textarea | Only needed if building a custom mention dropdown instead of using react-mentions-ts. `react-mentions-ts` handles this internally. |

**Decision: Do NOT add `textarea-caret` if using react-mentions-ts.** Add only if custom implementation is chosen as fallback.

---

### 3. Dynamic System Prompt — No New Library Needed

The existing `streamWithProvider()` call already accepts a `system` string parameter. Dynamic context injection is pure TypeScript:

```typescript
// In /api/chat/route.ts — replace static SYSTEM_PROMPT with:
function buildSystemPrompt(mentions: MentionedEntity[]): string {
  const base = '당신은 방과후 교실 관리 시스템의 AI 어시스턴트입니다...'
  if (mentions.length === 0) return base

  const contextBlocks = mentions.map(formatEntityBlock).join('\n\n')
  return `${base}\n\n## 참조 데이터\n\n${contextBlocks}`
}
```

The `system` property in Vercel AI SDK is a plain string, dynamically constructable via template literals. Verified against official AI SDK docs. No new library needed.

---

### 4. Entity Data Aggregation — No New Library Needed

Prisma `include` / `select` with the existing `db` client handles all multi-table lookups. The pattern:

```typescript
// Server action: gather all data for a mentioned student
async function getStudentContext(studentId: string) {
  return db.student.findUnique({
    where: { id: studentId },
    select: {
      name: true, school: true, grade: true, birthDate: true,
      mbtiAnalysis: { select: { mbtiType: true, interpretation: true } },
      sajuAnalysis: true,                          // via SajuAnalysis.subjectId
      counselingSessions: {
        orderBy: { sessionDate: 'desc' },
        take: 5,
        select: { summary: true, sessionDate: true, type: true }
      },
      personalitySummary: { select: { coreTraits: true } },
      varkAnalysis: { select: { varkType: true } },
    }
  })
}
```

Use `select` over `include` for all entity aggregation to avoid over-fetching (confirmed Prisma performance guidance, HIGH confidence).

---

## What Already Exists — No Re-implementation Needed

| Capability | Existing Asset | Location |
|-----------|---------------|----------|
| Debounced search | `use-debounce@10.1.0` | Already installed |
| Command palette/search UI | `cmdk@1.1.1` | Already installed |
| Streaming AI response | `streamWithProvider()` | `src/lib/ai/universal-router.ts` |
| Session/message persistence | ChatSession, ChatMessage models | `prisma/schema.prisma` |
| Auth session in API routes | `verifySession()` | `src/lib/dal.ts` |
| Student/teacher/class data | All Prisma models | `prisma/schema.prisma` |
| Toast notifications | `sonner@2.0.7` | Already installed |

---

## Installation

```bash
# Only new package needed
pnpm add react-mentions-ts@5.4.7
```

No `prisma migrate` needed for the mention feature itself (mention metadata stored in ChatMessage.content as JSON or parsed client-side; no schema change required unless explicit mention tracking is added).

---

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| react-mentions-ts | react-mentions (signavio) | 3 years unmaintained, not React 19 compatible |
| react-mentions-ts | Custom textarea + cmdk + textarea-caret | ~300 lines of custom caret positioning, popover management; library solves this correctly |
| react-mentions-ts | @ariakit/react combobox-textarea | Excellent pattern, but adds @ariakit/react dependency; use as fallback if react-mentions-ts styling conflicts with shadcn |
| Vercel AI SDK system param | Separate RAG pipeline (LangChain etc.) | Over-engineered; data is in PostgreSQL already, no vector store needed for structured entity data |
| Prisma select | Raw SQL / Prisma $queryRaw | Raw SQL loses type safety; structured entity data fits Prisma's relational model perfectly |
| Server action entity fetch | Client-side fetch + cache | Server actions keep data access server-only, consistent with existing auth pattern in this codebase |

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Tiptap / Slate / Lexical** | Rich text editor with full AST, overkill for a mention-only feature, 50-200KB bundle addition | react-mentions-ts (textarea-based, ~5KB) |
| **LangChain / LlamaIndex** | Vector DB, embedding pipeline, unnecessary when entity data is structured PostgreSQL | Prisma select + template literal system prompt |
| **react-query / SWR** | Cache layer for entity data | Server actions (already the codebase pattern), `useDebouncedCallback` for search |
| **@octokit/webhooks** | Previous milestone library, no relation | (already installed from prior milestone) |
| **@ariakit/react** | Adds 30KB if react-mentions-ts works | Only add as fallback if mention lib fails |

---

## Integration Points

### Data Flow: @mention → Context → LLM

```
User types "@김민수" in ChatInput
  → react-mentions-ts detects "@" trigger
  → fires async data prop with "김민수" query
  → calls Server Action: searchEntities("김민수")
    → db.student.findMany({ where: { name: { contains: query } }, ... })
    → returns [{ id, name, type: "student" }]
  → displays dropdown via react-mentions-ts popover
  → user selects "김민수 (3학년)"
  → mention stored in message value as markup "@[김민수](student:clx...)"

On send:
  → parseMentions(messageValue) → [{ type: "student", id: "clx..." }]
  → parallel: fetchEntityData(mentions) → Prisma select queries
  → buildSystemPrompt(entityData) → dynamic string
  → POST /api/chat with { prompt, mentions: [...] }
  → route.ts: streamWithProvider({ system: dynamicPrompt, ... })
```

### Modified Files

| File | Change |
|------|--------|
| `src/components/chat/chat-input.tsx` | Add react-mentions-ts MentionsInput, replace raw Textarea |
| `src/app/api/chat/route.ts` | Accept `mentions[]` param, build dynamic system prompt |
| `src/lib/actions/chat/search-entities.ts` | New server action: student/teacher/class search |
| `src/lib/actions/chat/fetch-entity-context.ts` | New server action: aggregate entity data for prompt |
| `src/hooks/use-chat-stream.ts` | Pass mentions through to API call |

---

## Version Compatibility

| Package | Version | Compatibility Notes |
|---------|---------|---------------------|
| react-mentions-ts@5.4.7 | React >=19.0.0 | Full parity with React 19.2.3 in this project |
| react-mentions-ts@5.4.7 | Tailwind v4 | "Tailwind v4 ready" per library docs |
| react-mentions-ts@5.4.7 | Next.js 15 App Router | SSR-compatible per library docs; use `"use client"` in ChatInput (already is) |
| use-debounce@10.1.0 | React 19 | No known issues, hooks-only library |

---

## Security Note

Entity data injected into system prompts is **internal structured data from authenticated DB queries**, not user-supplied content. This avoids indirect prompt injection risk (OWASP LLM Top 10 #1, 2025). The user's message text should NOT be placed into the system prompt — only into the user message array position.

---

## Sources

- `npm info react-mentions-ts` — version 5.4.7, peerDeps, zero runtime deps — HIGH confidence
- [react-mentions-ts GitHub](https://github.com/hbmartin/react-mentions-ts) — API shape, async data support, React 19 requirement — HIGH confidence
- [Vercel AI SDK Prompts Docs](https://ai-sdk.dev/docs/foundations/prompts) — system param is a plain dynamic string — HIGH confidence
- [Ariakit combobox-textarea example](https://ariakit.org/examples/combobox-textarea) — fallback pattern reference — HIGH confidence
- Prisma query optimization docs — use select over include for aggregation — HIGH confidence
- `npm info react-mentions` — v4.4.10 last published 3 years ago — HIGH confidence (elimination reason)
- WebSearch: react-mentions-ts Tailwind v4, Next.js 15 SSR compatibility — MEDIUM confidence (library docs confirm, no deep integration report found)

---

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| react-mentions-ts choice | HIGH | npm-verified: React 19 native, zero deps, peer deps already present |
| Dynamic system prompt (no new lib) | HIGH | AI SDK official docs confirm system is plain string |
| Prisma aggregation (no new lib) | HIGH | Existing Prisma usage pattern in codebase, official docs |
| Tailwind v4 + react-mentions-ts | MEDIUM | Library claims compatibility, no third-party test report found |
| Alternative (Ariakit fallback) | HIGH | Working example documented on ariakit.org |

---

*Stack research for: @mention context injection chat system (v3.0 milestone)*
*Researched: 2026-02-18*
