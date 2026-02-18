# Architecture Research

**Domain:** @mention-based context injection for AI chat (Next.js 15 App Router)
**Researched:** 2026-02-18
**Confidence:** HIGH (direct codebase inspection — all integration points verified from source)

---

## Existing Architecture (Baseline)

Before defining what changes, here is the confirmed current data flow from code inspection:

```
[ChatInput.tsx]
     | onSend(prompt, providerId)
     v
[ChatPage.tsx] handleSend()
     | buildContextMessages from messages[]
     v
[useChatStream.ts] sendMessage()
     | POST /api/chat  { prompt, providerId, sessionId, messages[] }
     v
[route.ts] POST handler
     | verifySession -> session check/create -> DB save user msg
     | streamWithProvider({ prompt, system: SYSTEM_PROMPT, messages })
     v
[universal-router.ts] streamWithProvider()
     | streamText({ model, messages, system })
     v
[Vercel AI SDK] -> LLM provider
     | stream tee -> client stream + DB save assistant msg
     v
[useChatStream.ts] reader.read() loop -> setStreamingContent()
     v
[ChatMessageList.tsx] -> [ChatMessageItem.tsx]
```

**Key constraint identified:** `system` in `route.ts` is currently a fixed string constant (`SYSTEM_PROMPT`). Mention context must be injected here dynamically per request. The `streamWithProvider` signature already accepts `system?: string` — this integration point exists and requires no signature change.

---

## Recommended Architecture for @mention System

### System Overview

```
+-----------------------------------------------------------------------+
|                          CLIENT LAYER                                  |
+------------------------------------+----------------------------------+
|  ChatInput (MODIFIED)              |  ChatPage (MODIFIED)              |
|  +------------------------------+  |  +------------------------------+  |
|  | MentionTextarea              |  |  | mentions[] state             |  |
|  | MentionDropdown              |  |  | handleSend(prompt, mentions) |  |
|  | use-mention.ts (NEW)         |  |  |                              |  |
|  +------------------------------+  |  +------------------------------+  |
+------------------------------------+----------------------------------+
|                          HOOK LAYER                                    |
|  use-chat-stream.ts (MODIFIED)                                         |
|    sendMessage({ prompt, providerId, sessionId, messages, mentions[] })|
+-----------------------------------------------------------------------+
|                          API LAYER                                     |
|  POST /api/chat (MODIFIED)                                             |
|    + GET /api/chat/mentions/search?q=&type= (NEW)                      |
+------------------------------+----------------------------------------+
|  mention-resolver.ts (NEW)   |  context-builder.ts (NEW)              |
|  DB queries for each entity  |  Formats entity data into system       |
|  type with access control    |  prompt fragments                      |
+------------------------------+----------------------------------------+
|                    DATA LAYER (ALL EXISTING)                           |
|  Student, Teacher, Team, SajuAnalysis, MbtiAnalysis,                  |
|  CompatibilityResult, CounselingSession, PersonalitySummary,           |
|  GradeHistory, VarkAnalysis, ZodiacAnalysis                           |
+-----------------------------------------------------------------------+
```

### Component Boundaries

| Component | Status | Responsibility | Communicates With |
|-----------|--------|---------------|-------------------|
| `ChatInput` | MODIFIED | Textarea with @ trigger, dropdown, mention tag display | `ChatPage` via `onSend(prompt, mentions[], providerId?)` |
| `MentionTextarea` | NEW | Monitors keystrokes for `@`, cursor position tracking | `MentionDropdown`, parent `ChatInput` |
| `MentionDropdown` | NEW | Autocomplete UI (Popover+Command pattern) | `/api/chat/mentions/search`, `ChatInput` |
| `MentionTag` | NEW | Inline chip rendering inside message bubbles | `ChatMessageItem` |
| `ChatPage` | MODIFIED | Holds `mentions[]` state, passes to `handleSend` | `useChatStream` (extended sendMessage) |
| `ChatMessageItem` | MODIFIED | Renders `@Name` tokens as chips in user messages | Receives `mentionedEntities` from message data |
| `useChatStream` | MODIFIED | Passes `mentions[]` in POST body | `/api/chat` route |
| `/api/chat/mentions/search` | NEW | Search entities by name, return id+label+type | DB via Prisma |
| `/api/chat` route | MODIFIED | Receives mentions[], calls context-builder, injects into system prompt, saves mentionedEntities to DB | `mention-resolver.ts`, `context-builder.ts` |
| `mention-resolver.ts` | NEW | Loads full entity data from DB per mention with access control | Prisma (Student, Teacher, Team + related analyses) |
| `context-builder.ts` | NEW | Converts resolved entity data into formatted prompt sections | Consumed by `/api/chat` route |
| `ChatMessage` DB model | MODIFIED | Add `mentionedEntities Json?` column for UI re-rendering | Prisma schema migration |

---

## New Components — Detailed Spec

### 1. MentionTextarea (NEW)

Replaces the raw `<Textarea>` in `ChatInput`. Must solve the controlled/uncontrolled split:

```typescript
// The core challenge: textarea value vs visual mention chips
// Decision: store raw text with @EntityName inline in value
// Parse mentions on submit, not on render

type MentionState = {
  query: string          // current @query substring after trigger
  cursorPosition: number
  dropdownOpen: boolean
  anchorPosition: { top: number; left: number }
}
```

**Pattern to follow:** Use `onKeyUp` + `selectionStart` to detect `@` triggers. Do NOT use a contenteditable div — the existing `<Textarea>` works fine with text parsing. Mention chips in the input are a visual enhancement; the raw `@EntityName` text can remain in the textarea value and be parsed on submit.

**Why not a rich text editor (Tiptap, Slate.js):** Overkill for this use case. Adds ~200KB bundle weight, complex SSR handling, and requires custom serialization to extract plain text for the LLM. The LLM sees the resolved context in the system prompt, not the raw message. Visual chips belong in the read-only message bubbles, not the editable input.

### 2. MentionDropdown (NEW)

Uses the existing `Command` + `Popover` pattern already present in `src/components/matching/unassigned-student-combobox.tsx`:

```typescript
type MentionResult = {
  id: string
  type: 'student' | 'teacher' | 'team'
  label: string        // display name
  subLabel?: string    // school+grade for student, role for teacher
}

// Rendered as absolute-positioned Popover anchored to cursor position
// CommandGroup sections: 학생 / 선생님 / 팀
```

Fetch pattern: debounced `fetch('/api/chat/mentions/search?q=민준&type=student')` on each character after `@`. Client-side result cache with `Map<query, MentionResult[]>` to avoid duplicate requests within the same dropdown session.

### 3. `/api/chat/mentions/search` (NEW Route)

```typescript
// GET /api/chat/mentions/search?q=&type=
// Auth: verifySession (teacher sees own students + all teachers + teams)
// Returns: MentionResult[]

// Query scope by role:
// TEACHER -> students where teacherId = session.userId
// DIRECTOR/MANAGER/TEAM_LEADER -> all students (mirrors existing getStudents() pattern)
// All roles -> all teachers, all teams

// Limits: take: 8 students, take: 5 teachers, take: 3 teams
// No streaming, returns JSON directly
```

This is a lightweight read-only route. No streaming. No AI. Returns JSON directly. No Server Action — autocomplete needs debounced GET requests with `AbortController` cancellation, which requires a standard fetch route.

### 4. `mention-resolver.ts` (NEW)

```typescript
// src/lib/chat/mention-resolver.ts

type MentionedEntity = {
  id: string
  type: 'student' | 'teacher' | 'team'
}

type ResolvedContext = {
  entityType: string
  entityName: string
  contextBlock: string   // formatted text block for prompt injection
}

async function resolveMentions(
  mentions: MentionedEntity[],
  requestingTeacherId: string
): Promise<ResolvedContext[]>
```

Per entity type, what gets fetched and included:

- **Student**: `Student` base fields + `SajuAnalysis` (result summary), `MbtiAnalysis` (mbtiType), `PersonalitySummary` (coreTraits, learningStrategy), `VarkAnalysis` (varkType), `CompatibilityResult` (with requesting teacher only), `CounselingSession` (last 3 by sessionDate desc), `GradeHistory` (last 5 by testDate desc). Access control: TEACHER role sees only their own students.
- **Teacher**: `Teacher` (name, role, teamId) + `team` (name). No analysis data (privacy). Access control: all roles can see all teachers.
- **Team**: `Team` (name, description) + `Teacher[]` count + `Student[]` count. No individual records.

Fetch only what exists — use `findUnique` with `include`, check null before serializing each analysis type.

### 5. `context-builder.ts` (NEW)

```typescript
// src/lib/chat/context-builder.ts

function buildSystemPrompt(
  basePrompt: string,
  resolvedContexts: ResolvedContext[]
): string

// Output structure example:
// [BASE_PROMPT]
//
// --- 참조 데이터 ---
//
// [학생: 김민준]
// - 학교: 한강중학교, 2학년
// - 생년월일: 2010-03-15
// - MBTI: INTJ (2025-01 분석)
// - 사주 특성: 목(木) 일주, ...
// - 성격 요약: ...
// - 최근 상담 (2025-12-01 학업): ...
// - 최근 성적: 수학 85, 국어 90 (2025년 2학기)
//
// [선생님: 이수진]
// - 직책: TEAM_LEADER, 소속팀: A팀
```

Token budget constraint: cap each entity block to approximately 500 tokens equivalent (roughly 350 Korean characters). If more than 3 entities are mentioned, truncate to the most contextually valuable (students first, then teachers, then teams). Log a warning in development if budget exceeded.

---

## Data Flow — Full @mention Request

```
[User types "@김민준 이 학생 학습 전략 추천해줘" and presses Enter]
     |
     v
[ChatInput] parseMentions("@김민준 이 학생...")
     -> finds: [{ id: "clxxx", type: "student", label: "김민준" }]
     |
     v
[ChatPage.handleSend(prompt, mentions)]
     -> setMessages optimistic update (shows @김민준 as tag in bubble)
     |
     v
[useChatStream.sendMessage({
  prompt: "@김민준 이 학생 학습 전략 추천해줘",
  mentions: [{ id: "clxxx", type: "student" }],
  sessionId, messages
})]
     |
     v
POST /api/chat {
  prompt,
  mentions: [{ id, type }],
  sessionId, messages, providerId
}
     |
     v
[route.ts]
  1. verifySession
  2. resolveMentions(mentions, teacherId)       <- NEW: DB queries + access control
  3. buildSystemPrompt(BASE_PROMPT, resolved)   <- NEW: format context blocks
  4. DB save user message (content + mentionedEntities JSON)  <- MODIFIED
  5. streamWithProvider({
       prompt,
       system: dynamicSystemPrompt,             <- CHANGED: was fixed SYSTEM_PROMPT constant
       messages
     })
     |
     v
[LLM] receives context-rich system prompt + user message
     |
     v
[stream tee -> client stream + DB save assistant msg]  <- NO CHANGE
```

---

## Data Flow — Autocomplete Search (Separate Flow)

```
[User types "@" in textarea]
     |
[use-mention.ts] detects @ trigger via onKeyUp + selectionStart
     |
[MentionDropdown opens, query = ""]
     |
[User types more chars: "@김"]
     |
[use-mention.ts] debounce 200ms, cancel previous AbortController
     | fetch("/api/chat/mentions/search?q=김", { signal: abortController.signal })
     v
[GET /api/chat/mentions/search]
     | verifySession
     | DB: Student.findMany({ where: { name: { contains: q, mode: 'insensitive' } }, take: 8 })
     | DB: Teacher.findMany({ where: { name: { contains: q } }, take: 5 })
     | DB: Team.findMany({ where: { name: { contains: q } }, take: 3 })
     v
[MentionDropdown] renders grouped results via Command/CommandGroup
     |
[User selects "김민준 (학생)"]
     |
[use-mention.ts] inserts "@김민준" at cursor position, records { id, type, label }
[MentionDropdown closes]
```

---

## Recommended Project Structure (New Files Only)

```
src/
+-- app/
|   +-- api/
|       +-- chat/
|           +-- route.ts                    # MODIFIED
|           +-- mentions/
|               +-- search/
|                   +-- route.ts            # NEW
+-- components/
|   +-- chat/
|       +-- chat-input.tsx                  # MODIFIED
|       +-- chat-page.tsx                   # MODIFIED
|       +-- chat-message-item.tsx           # MODIFIED
|       +-- mention-dropdown.tsx            # NEW
|       +-- mention-tag.tsx                 # NEW
+-- hooks/
|   +-- use-chat-stream.ts                  # MODIFIED
|   +-- use-mention.ts                      # NEW
+-- lib/
    +-- chat/
        +-- mention-resolver.ts             # NEW
        +-- context-builder.ts              # NEW
        +-- mention-types.ts               # NEW (shared types, no deps)
```

### DB Schema Change (Minimal)

Add one nullable column to `ChatMessage` to store mention metadata for message bubble re-rendering:

```prisma
model ChatMessage {
  // ... existing fields
  mentionedEntities Json?   // [{ id, type, label }] -- for UI chip rendering only
}
```

Migration: additive nullable column, zero data migration needed. Existing messages get `null` and render as plain text (backward compatible).

---

## Architectural Patterns

### Pattern 1: Parse on Submit, Not on Keystroke

**What:** Store raw `@EntityName` text in the textarea. Extract and resolve mentions only at submit time in `ChatInput.handleSubmit()`.

**When to use:** This use case — textarea remains a simple controlled component with no contenteditable complexity.

**Trade-offs:**
- Pro: Simple state model. No special keyboard handling beyond detecting `@` for dropdown trigger.
- Pro: The LLM doesn't care about the raw message format — context arrives via system prompt.
- Con: The textarea shows `@김민준` as raw text rather than a styled chip. Acceptable UX for a power-user feature.

**Recommended approach:** Keep textarea as raw text with `@Name` in value. In read-only message bubbles (`ChatMessageItem`), use stored `mentionedEntities` metadata to replace `@Name` patterns with styled `<MentionTag>` chips via simple regex substitution on render.

### Pattern 2: GET API Route for Autocomplete, Not Server Action

**What:** Use a GET API route (`/api/chat/mentions/search`) for the autocomplete search, not a Server Action.

**When to use:** Debounced autocomplete with cancellation — this specific pattern.

**Trade-offs:**
- Pro: Supports `AbortController` for clean request cancellation on fast typing.
- Pro: Standard `fetch` with query params — simpler than Server Action form context.
- Con: Extra API route instead of the project's preferred Server Action pattern.

**Why it is worth it:** Server Actions use POST and cannot be naturally cancelled mid-flight. For autocomplete, cancel-on-next-keystroke is essential UX.

### Pattern 3: System Prompt Injection, Not Message Injection

**What:** Inject entity context into the `system` parameter of `streamWithProvider`, not as an additional `user` or `assistant` message in the messages array.

**When to use:** All @mention context injection.

**Trade-offs:**
- Pro: System prompt is authoritative background context — LLMs treat it as ground truth, not as something the user said.
- Pro: Does not pollute the `messages[]` array that gets replayed in multi-turn context.
- Pro: The existing `streamWithProvider` signature already accepts `system?: string` — no interface changes needed.
- Con: System prompt tokens cost on every streaming request. Not a concern at this scale.

### Pattern 4: Mention Resolution Server-Side, Client Sends Only IDs

**What:** The API route (`route.ts`) calls `resolveMentions()`. The client sends only `[{ id, type }]` tuples — never full entity data.

**When to use:** Always. This is a security requirement, not just a preference.

**Trade-offs:**
- Pro: Prevents leaking full student PII through network requests to client.
- Pro: Server validates the requesting teacher has access to mentioned entities before including data.
- Pro: Prevents prompt injection — user cannot craft mentions to exfiltrate data they do not own.
- Con: API route becomes more complex. Worth it unconditionally.

---

## Integration Points

### Existing Code — Modification Map

| File | Change Type | What Exactly Changes |
|------|------------|---------------------|
| `src/app/api/chat/route.ts` | MODIFIED | Accept `mentions[]` in parsed body; call `resolveMentions`; call `buildSystemPrompt`; save `mentionedEntities` to DB; pass dynamic `system` to `streamWithProvider` |
| `src/components/chat/chat-input.tsx` | MODIFIED | Replace raw `<Textarea>` logic with `MentionTextarea` wrapper; mount `<MentionDropdown>`; emit `mentions[]` alongside `prompt` via `onSend(prompt, mentions, providerId)` |
| `src/components/chat/chat-page.tsx` | MODIFIED | `handleSend(prompt, mentions?, providerId?)` signature change; hold `activeMentions` state; pass `mentions` to `sendMessage` |
| `src/components/chat/chat-message-item.tsx` | MODIFIED | For user messages, replace `@Name` substrings with `<MentionTag>` chips using the `mentionedEntities` prop |
| `src/hooks/use-chat-stream.ts` | MODIFIED | Add `mentions` to `SendMessageOptions` type; include in POST body JSON |
| `prisma/schema.prisma` | MODIFIED | Add `mentionedEntities Json?` to `ChatMessage` model |

### New Code — Build Order

| Order | File | Depends On | Why This Order |
|-------|------|-----------|----------------|
| 1 | `src/lib/chat/mention-types.ts` | nothing | Defines `MentionedEntity`, `MentionResult`, `ResolvedContext` — all other files import from here |
| 2 | Prisma schema + migration | mention-types | Schema change needed before any DB code works |
| 3 | `src/lib/chat/mention-resolver.ts` | DB schema, mention-types | Core data fetching — needed by modified `route.ts` |
| 4 | `src/lib/chat/context-builder.ts` | mention-resolver output type | Formats resolver output — needed by modified `route.ts` |
| 5 | `src/app/api/chat/mentions/search/route.ts` | mention-types | Independent of context injection; can be built and tested in isolation before UI |
| 6 | `src/app/api/chat/route.ts` (modify) | resolver, context-builder | Integrates all server-side pieces; test with curl before building UI |
| 7 | `src/hooks/use-mention.ts` | mention-types, search route | Client hook for autocomplete state and debounced fetch |
| 8 | `src/components/chat/mention-tag.tsx` | mention-types | Primitive UI component, no deps beyond types |
| 9 | `src/components/chat/mention-dropdown.tsx` | use-mention, mention-tag | Uses hook and tag component |
| 10 | `src/components/chat/chat-input.tsx` (modify) | mention-dropdown, use-mention | Integrates dropdown into input; onSend signature change |
| 11 | `src/hooks/use-chat-stream.ts` (modify) | mention-types | Pass mentions in POST body |
| 12 | `src/components/chat/chat-page.tsx` (modify) | updated chat-input, use-chat-stream | Wire updated signatures together |
| 13 | `src/components/chat/chat-message-item.tsx` (modify) | mention-tag | Render chips in message history; can be done last since it is purely visual |

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Current (small school, under 50 students per teacher) | Direct DB queries per request. Sub-10ms query time. No caching needed. |
| 1k-5k students | The `name` index already exists (`@@index([name])`). Add debounce enforcement and AbortController on the search endpoint. Consider Redis cache for search results (TTL 60s). |
| Multi-tenant SaaS | Scope all mention queries by `tenantId`. Add mention entity permission layer as a separate abstraction. |

### First bottleneck

Mention search endpoint hit on every keystroke without debounce. Fix: enforce 200ms debounce in `use-mention.ts` with `AbortController` to cancel in-flight requests.

### Second bottleneck

System prompt size when many entities are mentioned simultaneously. Fix: cap each entity block to 500 tokens in `context-builder.ts`. If more than 3 entities, truncate lowest-priority (team info last).

---

## Anti-Patterns

### Anti-Pattern 1: Storing Full Entity Data in Message Content

**What people do:** Serialize full student JSON into the `content` field of the `ChatMessage` DB record.

**Why it is wrong:** Message history grows unbounded. When the session's 20-message context window replays old messages, the LLM receives stale entity data from months ago alongside the current message. Causes hallucinations on student data that has since changed.

**Do this instead:** Store only `[{ id, type, label }]` in `mentionedEntities`. Resolve fresh entity data from DB on each request. Old messages carry `mentionedEntities` metadata only for UI chip rendering — the LLM context rebuilds from DB on every new request.

### Anti-Pattern 2: Resolving Mentions Client-Side

**What people do:** Client fetches full student data from a Server Action, serializes it into the prompt payload, and sends the full entity data to `/api/chat`.

**Why it is wrong:** Exposes full student PII in network traffic. No server-side access control — the client can craft any `studentId` regardless of teacher-student relationship. Creates prompt injection risk.

**Do this instead:** Client sends only `[{ id, type }]`. Server validates access via `resolveMentions()` which checks `teacherId` ownership for TEACHER role.

### Anti-Pattern 3: Using a Rich Text Editor for @mentions

**What people do:** Replace `<Textarea>` with Tiptap or Slate.js to get inline styled mention chips in the editable input.

**Why it is wrong:** Adds ~200KB bundle weight. Complex SSR handling in Next.js App Router. Requires custom serialization to extract plain text for the LLM. Significantly more implementation complexity for minimal UX gain.

**Do this instead:** Keep `<Textarea>`, parse `@Name` on submit, render chips only in `ChatMessageItem` (read-only context where a React element substitution is trivial).

### Anti-Pattern 4: Injecting Mention Context as a User Message

**What people do:** Prepend entity data as `{ role: 'user', content: 'Here is context: ...' }` in the messages array before calling `streamWithProvider`.

**Why it is wrong:** Appears in the conversation history. Gets counted against `MAX_CONTEXT_MESSAGES` (20). Creates confusing "user" messages the actual user never typed. Multi-turn context replays these fake messages to the LLM.

**Do this instead:** Always inject via the `system` parameter. System prompt does not appear in the `messages[]` array and does not consume context window slots.

### Anti-Pattern 5: Per-Keystroke DB Queries Without Debounce

**What people do:** Call the mention search endpoint on every `onChange` event in the textarea.

**Why it is wrong:** Each character typed fires a DB query. For "김민준" that is 3 queries where only the last one matters. At 50ms per query under load, this creates a backlog.

**Do this instead:** Debounce 200ms in `use-mention.ts`. Cancel previous request with `AbortController` before issuing the next one. The existing `CommandInput` in `unassigned-student-combobox.tsx` does client-side filtering — the mention case needs server-side search because the full student list is not pre-loaded.

---

## Sources

- Direct codebase inspection (HIGH confidence):
  - `src/app/api/chat/route.ts` — current system prompt pattern, request body shape, streaming flow
  - `src/hooks/use-chat-stream.ts` — `SendMessageOptions` type, fetch implementation
  - `src/components/chat/chat-input.tsx` — current `onSend` signature, Textarea usage
  - `src/components/chat/chat-page.tsx` — state management, handleSend pattern
  - `src/components/chat/chat-message-item.tsx` — current render pattern for user vs assistant
  - `src/lib/ai/universal-router.ts` — `streamWithProvider` signature confirms `system?: string` exists
  - `prisma/schema.prisma` — `ChatMessage` model, `Student` indexes, `Teacher` role enum, all analysis models
  - `src/components/matching/unassigned-student-combobox.tsx` — Command/Popover/Combobox pattern to reuse
  - `src/lib/actions/student/detail.ts` — role-scoped query pattern (`where.teacherId = session.userId` for TEACHER role)

---
*Architecture research for: @mention-based context injection for AI chat*
*Researched: 2026-02-18*
*Confidence: HIGH — all integration points verified from direct source inspection*
