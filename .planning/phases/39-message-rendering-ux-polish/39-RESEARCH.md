# Phase 39: Message Rendering & UX Polish - Research

**Researched:** 2026-02-19
**Domain:** React mention chip rendering, Radix UI Popover, Next.js data flow
**Confidence:** HIGH

---

## Summary

Phase 39 completes the mention UX loop: after Phase 38 enabled mention insertion into the input, Phase 39 makes those mentions visually distinct in sent messages and clickable for entity detail popover. The core challenge is parsing `@이름` plain text back into visual chips using the `mentionedEntities` metadata stored in the DB, then fetching a lightweight entity preview for the popover.

The existing infrastructure is well-suited: the DB already stores `mentionedEntities` (Json?) on each `ChatMessage`, containing `[{id, type, displayName, accessDenied?}]`. The UI layer (chat-page.tsx, chat-message-list.tsx, chat-message-item.tsx) does NOT currently pass `mentionedEntities` down the component tree — this is the primary wiring gap. A new `GET /api/chat/mentions/preview` endpoint is needed for popover data.

The critical architectural insight is that content stored in the DB is plain text with `@이름` format (not the react-mentions-ts markup format), so chip parsing uses a simple regex against the `mentionedEntities.displayName` array — no library utilities needed. The Radix UI Popover already exists in the codebase (`src/components/ui/popover.tsx`) and handles viewport collision via `avoidCollisions={true}` by default. The dropdown placement requirement (39-03) refers to changing `suggestionsPlacement="above"` to `"auto"` in `chat-input.tsx` for dynamic viewport detection — react-mentions-ts's `"auto"` mode already computes this.

**Primary recommendation:** Wire `mentionedEntities` through the message prop chain, implement a regex-based `parseMentionChips()` utility, build `MentionTag` with Radix Popover, add a lightweight preview API, and change `suggestionsPlacement` to `"auto"`.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| UI-02 | 채팅 메시지에서 멘션이 시각적 칩으로 렌더링된다 | `mentionedEntities` DB field exists; regex parse `@이름` → chip; `MentionTag` component with Badge-style styling; `ChatMessageItem` receives `mentionedEntities` prop |
| UI-03 | 멘션 칩 클릭 시 엔티티 프리뷰 카드가 팝오버로 표시된다 | Radix Popover (`PopoverContent` with `avoidCollisions={true}`) already in codebase; new `GET /api/chat/mentions/preview` endpoint for entity summary; `MentionTag` wraps trigger+content |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| radix-ui (Popover) | ^1.4.3 | Popover trigger+content+portal | Already installed; `src/components/ui/popover.tsx` exists with full shadcn/ui wrapper; handles viewport collision natively |
| react-mentions-ts | 5.4.7 | `suggestionsPlacement="auto"` for dynamic dropdown | Already installed; "auto" mode does viewport height detection in source code |
| Tailwind CSS v4 | ^4 | Chip styling via inline classes | Already used everywhere; no new install |
| shadcn/ui Badge | existing | Visual chip base styling | `src/components/ui/badge.tsx` already exists with `cva` variants |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | ^0.563.0 | Icons in popover card (e.g., User, GraduationCap) | Already installed; use sparingly in preview card |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Radix Popover | Tooltip | Tooltip is for non-interactive content; Popover is correct for clickable chip with rich card |
| regex parsing | react-mentions-ts getPlainText/getMentions | Library utils expect markup format; stored content is already plain text with @name — regex is simpler and more reliable |
| New preview API | Reuse mention-resolver | mention-resolver is server-only, heavy (loads all analyses); need lightweight client-fetchable endpoint |

**Installation:** No new packages needed. All dependencies already present.

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/chat/
│   ├── chat-message-item.tsx     # MODIFY: accept mentionedEntities prop, call parseMentionChips
│   ├── chat-message-list.tsx     # MODIFY: pass mentionedEntities from Message type
│   ├── chat-page.tsx             # MODIFY: Message type adds mentionedEntities, getChatSession needs to return it
│   └── mention-tag.tsx           # NEW: MentionTag component (chip + popover)
├── lib/
│   ├── chat/
│   │   └── mention-types.ts      # EXISTING: MentionedEntity type already defined
│   └── actions/chat/
│       └── sessions.ts           # MODIFY: getChatSession select to include mentionedEntities
└── app/api/chat/mentions/
    └── preview/
        └── route.ts              # NEW: GET /api/chat/mentions/preview?type=student&id=xxx
```

### Pattern 1: Regex-Based Mention Chip Parsing
**What:** Parse plain text content (`@이름`) against `mentionedEntities` array to split string into segments (text | chip)
**When to use:** In `ChatMessageItem` for user messages only (assistant messages don't contain @mentions)
**Example:**
```typescript
// Source: derived from chat-input.tsx handleSubmit regex
// Content stored: "@홍길동 학생의 성향을 분석해줘"
// mentionedEntities: [{id: "abc", type: "student", displayName: "홍길동"}]

type ContentSegment =
  | { kind: "text"; text: string }
  | { kind: "mention"; entity: MentionedEntity }

export function parseMentionChips(
  content: string,
  entities: MentionedEntity[]
): ContentSegment[] {
  if (!entities || entities.length === 0) return [{ kind: "text", text: content }]

  // Build regex from display names, sorted longest-first to avoid partial match
  const sorted = [...entities].sort((a, b) => b.displayName.length - a.displayName.length)
  const escaped = sorted.map(e => e.displayName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const pattern = new RegExp(`@(${escaped.join('|')})`, 'g')

  const segments: ContentSegment[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ kind: "text", text: content.slice(lastIndex, match.index) })
    }
    const displayName = match[1]
    const entity = sorted.find(e => e.displayName === displayName)!
    segments.push({ kind: "mention", entity })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < content.length) {
    segments.push({ kind: "text", text: content.slice(lastIndex) })
  }

  return segments
}
```

### Pattern 2: MentionTag Component with Popover
**What:** Inline clickable chip that wraps Radix Popover trigger. On click, fetches preview data lazily.
**When to use:** Rendered by `parseMentionChips` output; never standalone
**Example:**
```typescript
// Source: src/components/ui/popover.tsx (existing) + Radix docs
"use client"

import { useState } from "react"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import type { MentionedEntity } from "@/lib/chat/mention-types"

type MentionTagProps = {
  entity: MentionedEntity
}

export function MentionTag({ entity }: MentionTagProps) {
  const [preview, setPreview] = useState<EntityPreview | null>(null)
  const [loading, setLoading] = useState(false)

  const handleOpen = async (open: boolean) => {
    if (!open || preview || entity.accessDenied) return
    setLoading(true)
    try {
      const res = await fetch(
        `/api/chat/mentions/preview?type=${entity.type}&id=${entity.id}`
      )
      if (res.ok) setPreview(await res.json())
    } finally {
      setLoading(false)
    }
  }

  const chipColors: Record<string, string> = {
    student: "bg-blue-100 text-blue-800 hover:bg-blue-200",
    teacher: "bg-purple-100 text-purple-800 hover:bg-purple-200",
    team: "bg-green-100 text-green-800 hover:bg-green-200",
  }

  return (
    <Popover onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <span
          className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium cursor-pointer transition-colors mx-0.5 ${chipColors[entity.type] ?? "bg-gray-100 text-gray-800"}`}
        >
          @{entity.displayName}
        </span>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-3"
        side="top"
        avoidCollisions={true}
        collisionPadding={8}
      >
        {/* preview card content */}
      </PopoverContent>
    </Popover>
  )
}
```

### Pattern 3: Preview API (GET /api/chat/mentions/preview)
**What:** Lightweight authenticated endpoint that returns name, role/grade, and latest analysis summary
**When to use:** Called lazily on popover open; separate from mention-resolver (which is heavyweight)
**Example:**
```typescript
// Source: derived from mention-resolver.ts patterns
// GET /api/chat/mentions/preview?type=student&id=xxx
// Returns: { name, sublabel, summary }

// Student: { name: "홍길동", sublabel: "3학년 · 강남초", summary: "coreTraits text | null" }
// Teacher: { name: "김철수", sublabel: "원장", summary: "mbtiType + interpretation | null" }
// Team:    { name: "A반", sublabel: "학생 5명", summary: null }
```

### Pattern 4: mentionedEntities Data Flow
**What:** Pass `mentionedEntities` from DB through server-side session loading down to `ChatMessageItem`
**When to use:** Required for chip rendering in loaded sessions (not just new messages)
**Critical gap — current vs required:**

| Layer | Current State | Required Change |
|-------|--------------|----------------|
| `getChatSession()` | Does NOT select `mentionedEntities` | Add `mentionedEntities: true` to select |
| `ChatSessionDetail.messages` type | No `mentionedEntities` field | Add `mentionedEntities: unknown` |
| `ChatSessionPage` | Maps messages without `mentionedEntities` | Include in mapped object |
| `ChatPage.Message` type | No `mentionedEntities` | Add `mentionedEntities?: MentionedEntity[] \| null` |
| `ChatPage.handleSend` | `tempUserMsg` has no `mentionedEntities` | Add from `mentions` param via `occurrencesToMentionItems` → needs displayName |
| `ChatMessageList` | No `mentionedEntities` in Message type | Pass through |
| `ChatMessageItem` | No `mentionedEntities` prop | Accept and use for chip parsing |

**Important note on optimistic messages:** When `handleSend` creates `tempUserMsg` optimistically, `mentionedEntities` needs the displayName. The `MentionItem[]` from `ChatInput.onSend` does NOT include displayName — only `{type, id}`. Solution: pass the raw `activeMentions` (which has `display` from MentionDataItem) from ChatInput, OR resolve display names client-side by matching against the MentionDataItem context. The simplest approach: ChatInput's `onSend` callback should also pass the display-enriched mention data.

**Alternative simpler approach:** Extract display names from the `mentionMarkup` string in ChatInput before clearing it, match `@[displayName](type:id)` pattern, and include in the callback. This avoids changing the callback signature excessively.

**Recommended:** Add `displayName` to `MentionItem` type (or create a separate `MentionItemWithDisplay` type) passed via `onSend` so the optimistic message can show chips immediately.

### Anti-Patterns to Avoid
- **Storing markup format in DB:** The stored content is plain text `@이름`. Do NOT attempt to store or re-derive react-mentions-ts markup format — it's lossy.
- **Fetching preview in render:** Fetch lazily in `onOpenChange` handler, not at mount time.
- **Blocking chip render on preview fetch:** Chip renders from `mentionedEntities` synchronously; preview data is separate async concern.
- **Using `<span>` inside `<p>` for chips in `ChatMessageItem`:** Currently user content is rendered as `<p className="text-sm whitespace-pre-wrap">{content}</p>`. With chips, switch to a `<div>` or use `whitespace-pre-wrap` on a `<div>` to allow inline spans.
- **Fixed `side="top"` on PopoverContent:** Use `avoidCollisions={true}` (default) with `side="top"` as preference — Radix Popover automatically flips to bottom if needed.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Popover positioning & viewport collision | Custom `getBoundingClientRect` positioning logic | Radix Popover `avoidCollisions={true}` | Built-in collision detection with flip/slide behavior; handles edge cases |
| Dropdown viewport detection | `window.innerHeight` check in component | `suggestionsPlacement="auto"` in react-mentions-ts | Library already does: `top + suggestions.offsetHeight > viewportHeight && suggestions.offsetHeight < top - caretHeight` |
| Chip styling system | Custom CSS | Tailwind `bg-blue-100 text-blue-800` inline | Consistent with existing codebase, no new abstraction needed |
| Animation on popover open/close | Custom CSS transitions | Tailwind `data-[state=open]:animate-in` already on `PopoverContent` in popover.tsx | Already present in the component |

**Key insight:** Both the dropdown viewport issue and the popover positioning are solved by existing library features — zero custom viewport math needed.

---

## Common Pitfalls

### Pitfall 1: Optimistic Message Missing mentionedEntities
**What goes wrong:** User sends a message with @mention; the optimistic `tempUserMsg` doesn't have `mentionedEntities`, so chips don't appear until the session is reloaded.
**Why it happens:** `handleSend` creates `tempUserMsg` before server response; `mentionedEntities` is resolved server-side.
**How to avoid:** ChatInput `onSend` callback should pass enriched mention data (with displayName). The `activeMentions` state in ChatInput already has the display info from react-mentions-ts. Construct a `MentionedEntity[]` from `activeMentions` before clearing state and pass it up alongside `MentionItem[]`.
**Warning signs:** Chips appear after page refresh but not immediately after sending.

### Pitfall 2: Regex Matching Wrong displayName
**What goes wrong:** Two entities named "김철수" and "김철수 선생님" — shorter name matches inside longer name.
**Why it happens:** Regex alternation matches first pattern found.
**How to avoid:** Sort entities by `displayName.length` descending before building regex. Already accounted for in Pattern 1 example above.
**Warning signs:** Wrong entity popover opens for similarly-named mentions.

### Pitfall 3: `whitespace-pre-wrap` Breaking Inline Spans
**What goes wrong:** Using `<p className="whitespace-pre-wrap">` with inline `<span>` chip children — some browsers collapse whitespace inconsistently.
**Why it happens:** `whitespace-pre-wrap` preserves newlines but the mix of inline-block spans can cause layout issues.
**How to avoid:** Use `<div className="text-sm whitespace-pre-wrap leading-relaxed">` for the container. Render text segments as plain text nodes (not wrapped in spans). Each segment of kind "text" can be a plain string React node.
**Warning signs:** Extra spacing around chips or collapsed newlines.

### Pitfall 4: Preview API Without RBAC Check
**What goes wrong:** Any authenticated user can fetch preview for any entity ID.
**Why it happens:** forgetting RBAC in new routes.
**How to avoid:** Preview API must apply the same RBAC as mention-resolver: DIRECTOR sees all; others only see their teamId's entities. Reuse `verifySession()` and team-based filtering.
**Warning signs:** Cross-team data leak in preview popover.

### Pitfall 5: mentionedEntities is null for Old Messages
**What goes wrong:** Messages sent before Phase 38/39 have `mentionedEntities = null`; parser crashes.
**Why it happens:** DB column is `Json?` (nullable).
**How to avoid:** Always guard: `if (!mentionedEntities || mentionedEntities.length === 0) return [{ kind: "text", text: content }]`. Already in Pattern 1 example.
**Warning signs:** TypeError on old session messages.

### Pitfall 6: getChatSession Not Returning mentionedEntities for History
**What goes wrong:** Opening an existing session shows no chips even though mentionedEntities is in DB.
**Why it happens:** `getChatSession` select statement doesn't include `mentionedEntities`.
**How to avoid:** Add `mentionedEntities: true` to the Prisma select in `sessions.ts`. Also update `ChatSessionDetail.messages` type.
**Warning signs:** New messages show chips but session history doesn't.

### Pitfall 7: Streaming Message Shows "accessDenied" Chip
**What goes wrong:** During streaming, `streamingContent` is shown in `ChatMessageItem` but has no `mentionedEntities` — it shouldn't try to parse mentions.
**Why it happens:** The streaming assistant message is a temporary component without entity data.
**How to avoid:** Only parse mentions for `role === "user"` messages that have `mentionedEntities`. The streaming message is always `role="assistant"` — no parsing needed.
**Warning signs:** Chips appearing in streaming assistant messages.

---

## Code Examples

Verified patterns from official sources and codebase inspection:

### Popover with avoidCollisions (from existing popover.tsx)
```typescript
// Source: src/components/ui/popover.tsx (existing codebase)
// PopoverContent already wraps in Portal and has avoidCollisions by default

<Popover onOpenChange={handleOpen}>
  <PopoverTrigger asChild>
    <span className="...chip styles...">@{entity.displayName}</span>
  </PopoverTrigger>
  <PopoverContent
    className="w-64 p-3"
    side="top"        // preferred side
    sideOffset={4}    // default
    // avoidCollisions={true} is DEFAULT in Radix - no need to set
    collisionPadding={8}
  >
    {/* preview content */}
  </PopoverContent>
</Popover>
```

### suggestionsPlacement="auto" (39-03 dropdown fix)
```typescript
// Source: react-mentions-ts dist/index.js — "auto" mode logic:
// shouldShowAboveCaret = suggestionsPlacement === "above" ||
//   (suggestionsPlacement === "auto" &&
//    top + suggestions.offsetHeight > viewportHeight &&
//    suggestions.offsetHeight < top - caretHeight)

// Change in chat-input.tsx:
<MentionsInput
  suggestionsPlacement="auto"   // was "above" — now dynamic
  // ...
/>
```

### ChatInput onSend with mentionedEntities for optimistic display
```typescript
// Source: derived from chat-input.tsx + mention-types.ts
// Pass MentionedEntity[] constructed from activeMentions for optimistic rendering

const handleSubmit = useCallback(() => {
  const plainText = mentionMarkup.replace(/@\[([^\]]+)\]\([^)]+\)/g, '@$1').trim()
  if (!plainText || isStreaming) return

  const mentionItems = occurrencesToMentionItems(activeMentions)

  // Construct MentionedEntity[] for optimistic UI
  const mentionedEntities: MentionedEntity[] = activeMentions
    .filter((m, i, arr) => arr.findIndex(x => x.id === m.id) === i) // dedupe
    .map(m => {
      const raw = String(m.id)
      const colonIdx = raw.indexOf(':')
      return {
        id: raw.slice(colonIdx + 1),
        type: raw.slice(0, colonIdx) as MentionType,
        displayName: m.display ?? '',
      }
    })

  onSend(plainText, mentionItems, mentionedEntities, parseProviderId(selectedModel))
  setMentionMarkup('')
  setActiveMentions([])
}, [mentionMarkup, activeMentions, isStreaming, onSend, parseProviderId, selectedModel])
```

### Preview API (lightweight)
```typescript
// Source: derived from mention-resolver.ts + search/route.ts patterns
// GET /api/chat/mentions/preview?type=student&id=xxx

export async function GET(request: NextRequest) {
  const session = await verifySession()
  const { searchParams } = request.nextUrl
  const type = searchParams.get('type')
  const id = searchParams.get('id')

  // type-based dispatch with RBAC
  if (type === 'student') {
    const student = await db.student.findFirst({
      where: { id, ...(session.role !== 'DIRECTOR' ? { teamId: session.teamId } : {}) },
      select: {
        name: true, grade: true, school: true,
        personalitySummary: { select: { coreTraits: true } }
      }
    })
    if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({
      name: student.name,
      sublabel: `${student.grade}학년 · ${student.school}`,
      summary: student.personalitySummary?.coreTraits ?? null,
    })
  }
  // similar for teacher, team
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Fixed `suggestionsPlacement="above"` | `suggestionsPlacement="auto"` with viewport detection | Phase 39-03 | Dynamic positioning — shows above normally, switches to below when near bottom |
| No mention chip rendering | `parseMentionChips()` + `MentionTag` | Phase 39-01, 39-02 | @이름 text becomes visually distinct chip |
| No entity preview | Popover with preview API | Phase 39-01 | Click chip → see entity summary |

**Deprecated/outdated:**
- Storing markup format and parsing with library utils: NOT needed — stored content is already plain text.

---

## Open Questions

1. **ChatInput.onSend signature change scope**
   - What we know: Current signature is `(prompt: string, mentions: MentionItem[], providerId?: string)`
   - What's unclear: Adding `mentionedEntities?: MentionedEntity[]` as 4th param vs restructuring to object
   - Recommendation: Add as optional 4th param to minimize diff; planner should decide if object params are preferred.

2. **Preview API data for "최신 분석 요약"**
   - What we know: `PersonalitySummary.coreTraits` exists for students; teachers have `MbtiAnalysis.interpretation`; teams have no summary
   - What's unclear: Requirements say "최신 분석 요약" — does this mean the newest analysis entry or a dedicated summary field?
   - Recommendation: Use `PersonalitySummary.coreTraits` for students (has dedicated `summaryText` semantics), `MbtiAnalysis.mbtiType + interpretation` for teachers, `null`/empty for teams. This is a lightweight approach without fetching all analyses.

3. **Empty state for "빈 결과" dropdown (39-03)**
   - What we know: 39-03 includes "빈 결과 메시지" as a UX task
   - What's unclear: react-mentions-ts doesn't render a "no results" UI natively when the data function returns `[]`
   - Recommendation: The dropdown simply closes/doesn't appear when `[]` is returned — no empty state is shown by the library. The "빈 결과 메시지" task likely means showing a "검색 결과 없음" item in the suggestion list. This can be done by returning a disabled placeholder item from `fetchMentions` when the API returns empty. Planner should confirm scope.

4. **MentionOccurrence type in activeMentions**
   - What we know: `activeMentions` state in `chat-input.tsx` is typed as `Array<{ id: string | number }>` but react-mentions-ts `MentionOccurrence` includes `display: string`
   - What's unclear: Whether the current type annotation is complete or if `display` is accessible
   - Recommendation: Check actual runtime value — the activeMentions from `MentionsInputChangeEvent.mentions` is `MentionOccurrence<MentionExtra>[]` which includes `display`. The type in ChatInput needs to be widened to include `display` for the optimistic entity construction pattern.

---

## Key Discoveries

### Discovery 1: Markup Format vs Stored Content
The react-mentions-ts markup format in the input is `@[__display__](__id__)` which becomes `@[홍길동](student:abc123)`. The `handleSubmit` in `chat-input.tsx` strips this to plain text `@홍길동` before storing. This means:
- **Chip parsing must use regex against `@displayName`, NOT the markup format**
- `getMentions()` utility from react-mentions-ts/utils is NOT applicable (requires markup format input)
- No library dependency for parsing — pure regex

### Discovery 2: suggestionsPlacement="auto" Already Handles Viewport
react-mentions-ts source code (line confirmed): `"auto"` mode checks `top + suggestions.offsetHeight > viewportHeight` and flips to above. The fix for 39-03's dropdown positioning requirement is a **single prop change** from `"above"` to `"auto"` in `chat-input.tsx`.

### Discovery 3: Radix Popover Has avoidCollisions by Default
`PopoverContent` API: `avoidCollisions` defaults to `true`. The existing `popover.tsx` wrapper uses `PopoverPrimitive.Content` which inherits this. Setting `side="top"` with `avoidCollisions` handles the "뷰포트 하단에 걸리는 경우" requirement automatically.

### Discovery 4: mentionedEntities Not in Session Message Select
`getChatSession()` in `sessions.ts` selects `{id, role, content, provider, model, createdAt}` — `mentionedEntities` is explicitly omitted. This must be added for history chips to work.

### Discovery 5: Streaming Disable Already Handled
`chat-input.tsx` already has `disabled={isStreaming}` on `MentionsInput`. This satisfies success criterion #3 ("AI 응답 스트리밍 중에는 드롭다운이 비활성화"). No new work needed — but it should be verified/documented in the plan.

---

## Sources

### Primary (HIGH confidence)
- `/hbmartin/react-mentions-ts` Context7 — markup format, utility functions, TypeScript types
- `src/components/chat/chat-input.tsx` (codebase) — markup format `@[__display__](__id__)`, `disabled={isStreaming}`, `suggestionsPlacement="above"`, `activeMentions` type
- `src/components/ui/popover.tsx` (codebase) — full Radix Popover wrapper, `avoidCollisions` default
- `src/lib/chat/mention-types.ts` (codebase) — `MentionedEntity` type with `{id, type, displayName, accessDenied?}`
- `src/app/api/chat/route.ts` (codebase) — confirmed `mentionedEntities` stored as `mentionedEntitiesData` from `resolveMentions`
- `node_modules/react-mentions-ts/dist/index.js` (installed) — confirmed `"auto"` placement logic source code
- `/websites/radix-ui_primitives` Context7 — `PopoverContent` API, `avoidCollisions`, `side`, `collisionPadding`

### Secondary (MEDIUM confidence)
- `prisma/schema.prisma` (codebase) — `ChatMessage.mentionedEntities Json?` field confirmed
- `src/lib/actions/chat/sessions.ts` (codebase) — confirmed `mentionedEntities` NOT in select

### Tertiary (LOW confidence)
- None — all findings verified from codebase or official library sources

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed and verified in codebase
- Architecture: HIGH — data flow traced end-to-end through actual source files
- Pitfalls: HIGH — derived from actual code inspection (e.g., sessions.ts missing select, optimistic message gap)
- Preview API design: MEDIUM — data structure designed from existing mentor-resolver patterns but not yet validated against requirements for "최신 분석 요약" interpretation

**Research date:** 2026-02-19
**Valid until:** 2026-03-20 (stable stack, 30-day window)
