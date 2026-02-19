# Phase 40: LLMQueryBar Extension - Research

**Researched:** 2026-02-19
**Domain:** react-mentions-ts v5.4.7 + LLMQueryBar refactor + Next.js routing + API pipeline reuse
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| UI-04 | 대시보드 LLMQueryBar에서도 @멘션을 사용할 수 있다 | 3개의 성공 기준으로 분해됨: (1) Phase 38 드롭다운 동작 동일, (2) Phase 36 서버 파이프라인 동일 처리, (3) 기존 멘션 없는 질문 하위 호환성 유지 |
</phase_requirements>

---

## Summary

Phase 40은 Phase 38~39에서 이미 완성된 @멘션 시스템을 LLMQueryBar에 이식(port)하는 작업이다. 핵심 컴포넌트, 훅, API 엔드포인트가 **모두 이미 존재**하므로 새 코드 작성보다는 올바른 연결(wiring)이 핵심이다.

현재 `LLMQueryBar`는 `<input type="text">`를 사용해 prompt를 받고 `/chat?q=<encoded>` URL로 라우팅한다. 이 방식은 멘션 데이터를 URL에 담을 수 없어 서버 파이프라인을 활용할 수 없다. Phase 40의 핵심 아키텍처 결정은 **LLMQueryBar의 submit 동작을 URL 라우팅에서 직접 API 호출로 전환**하는 것이다. `useChatStream` 훅이 이미 이를 지원하며, `/api/chat` 엔드포인트는 `mentions[]`를 받아 Phase 36 서버 파이프라인을 실행한다.

LLMQueryBar의 `<input type="text">`를 `<MentionsInput>`으로 교체하면 Phase 38의 모든 드롭다운 UX(그룹 헤더, 키보드 탐색, IME 지원, 200ms 디바운스)가 자동으로 동작한다. `useMention` 훅과 `occurrencesToMentionItems` 유틸리티는 재사용된다. UI는 chat-input.tsx와 달리 **인라인 바** 형태를 유지해야 하므로, `autoResize=false` + 단일 행 제약이 필요하다. 또한 submit 시 채팅 페이지로 이동해야 하는지(navigate) 아니면 in-place로 응답을 처리해야 하는지가 UX 결정 사항인데, 가장 간단하고 하위 호환적인 접근은 **멘션 없는 경우 기존 URL 라우팅 유지, 멘션 있는 경우 채팅 페이지로 이동하되 mentions 데이터를 sessionStorage나 상태로 전달**하는 방식이다. 그러나 더 단순한 방안은 **항상 채팅 페이지로 네비게이션하되, `handleSend`를 chatPage 측에서 mentions와 함께 받도록 변경**하는 것이다.

**Primary recommendation:** `LLMQueryBar`를 `Client Component`로 유지하며 `<input>`을 `<MentionsInput>`으로 교체한다. submit 시 `/chat?q=...&mentions=...` URL 파라미터로 멘션을 직렬화해서 전달하거나, 현재 패턴처럼 채팅 페이지의 `initialQuery` + 새 `initialMentions` prop으로 처리한다. 단, URL 직렬화가 가장 심플하다.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-mentions-ts | 5.4.7 | MentionsInput (textarea+overlay) | Phase 38에서 이미 설치 및 통합. `globals.css`에 `@source` 설정 완료. |
| `useMention` hook | — | 자동완성 API 호출 + 디바운스 + AbortController | Phase 38에서 구현됨. `/api/chat/mentions/search` 호출. 재사용 가능. |
| `occurrencesToMentionItems` | — | MentionOccurrence[] → MentionItem[] 변환 | Phase 38에서 구현됨. 중복 제거 포함. 재사용 가능. |
| `useChatStream` | — | `/api/chat` POST 스트리밍 | Phase 36에서 구현됨. `mentions?` 파라미터 지원. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| next/navigation (`useRouter`) | — | 채팅 페이지 네비게이션 | submit 후 채팅 페이지로 이동 시 |
| next/navigation (`usePathname`) | — | 채팅 페이지 숨김 처리 | `/chat` 경로에서 QueryBar 숨김 (기존 로직 유지) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| URL 파라미터로 mentions 전달 | sessionStorage | URL이 더 명확하고 새로고침에 강함. 단, JSON이 길어질 수 있음 |
| 채팅 페이지 네비게이션 | In-place 스트리밍 응답 | 현재 QueryBar UI에는 스트리밍 결과를 표시할 공간이 없어 UX 복잡도 급증 |
| `<MentionsInput autoResize>` | 고정 높이 | QueryBar는 단일 행 UI이므로 autoResize 비활성화 또는 maxHeight 제한 필요 |

**Installation:** 새 패키지 없음. 모든 의존성 이미 설치되어 있음.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── components/layout/
│   └── llm-query-bar.tsx         # MODIFY: <input> → <MentionsInput>
│                                  #         submit 로직: mentions 포함 URL 파라미터로 전달
├── hooks/
│   └── use-mention.ts            # REUSE: fetchMentions 함수 (변경 없음)
├── components/chat/
│   └── chat-page.tsx             # MODIFY: initialMentions prop 추가 (선택적)
│                                  #         또는 URL에서 mentions 파싱
└── app/[locale]/(dashboard)/chat/
    └── page.tsx                  # MODIFY: searchParams에서 mentions 파라미터 파싱 (선택적)
```

### Pattern 1: LLMQueryBar의 MentionsInput 교체 패턴

**What:** `<input type="text">`를 `<MentionsInput>`으로 교체. `useMention` 훅 연결. 기존 `handleSubmit`에서 `activeMentions` 상태 포함.

**When to use:** Phase 40의 핵심 구현 패턴.

**Example:**
```typescript
// Source: 기존 chat-input.tsx 패턴 + llm-query-bar.tsx의 단일 행 제약 결합
"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { Sparkles, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MentionsInput, Mention } from 'react-mentions-ts'
import type { MentionsInputChangeEvent, MentionDataItem } from 'react-mentions-ts'
import { useMention, occurrencesToMentionItems, type MentionExtra } from '@/hooks/use-mention'
import type { MentionItem } from '@/lib/chat/mention-types'
import { toast } from "sonner"

export function LLMQueryBar() {
  const t = useTranslations("LLMChat")
  const router = useRouter()
  const pathname = usePathname()
  const { fetchMentions } = useMention()
  const [mentionMarkup, setMentionMarkup] = useState("")
  const [activeMentions, setActiveMentions] = useState<Array<{ id: string | number; display?: string | null }>>([])
  const prevTypeRef = useRef<string | null>(null)

  const handleMentionsChange = useCallback((change: MentionsInputChangeEvent<MentionExtra>) => {
    setMentionMarkup(change.value)
    setActiveMentions(change.mentions)
  }, [])

  const handleSubmit = useCallback(() => {
    // plain text 추출: @[이름](type:id) → @이름
    const plainText = mentionMarkup.replace(/@\[([^\]]+)\]\([^)]+\)/g, '@$1').trim()
    if (!plainText) {
      toast.error(t("errorNoPrompt"))
      return
    }

    const mentionItems = occurrencesToMentionItems(activeMentions)

    // 멘션이 있으면 mentions를 URL-safe JSON으로 직렬화
    if (mentionItems.length > 0) {
      const mentionsParam = encodeURIComponent(JSON.stringify(mentionItems))
      router.push(`/chat?q=${encodeURIComponent(plainText)}&mentions=${mentionsParam}`)
    } else {
      // 기존 하위 호환: 멘션 없으면 기존 URL 라우팅
      router.push(`/chat?q=${encodeURIComponent(plainText)}`)
    }

    setMentionMarkup("")
    setActiveMentions([])
  }, [mentionMarkup, activeMentions, router, t])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit]
  )

  if (pathname.includes("/chat")) return null

  const plainTextForDisabled = mentionMarkup.replace(/@\[([^\]]+)\]\([^)]+\)/g, '@$1').trim()

  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-500 flex-shrink-0" />

          <MentionsInput
            value={mentionMarkup}
            onMentionsChange={handleMentionsChange}
            onKeyDown={handleKeyDown}
            placeholder={t("placeholder")}
            a11ySuggestionsListLabel="멘션 검색 결과"
            suggestionsPlacement="below"  // QueryBar는 화면 상단 → 드롭다운을 아래쪽으로
            // autoResize 미사용 — 단일 행 UI 유지
            className="flex-1 h-[38px] text-sm"
          >
            <Mention
              trigger="@"
              data={fetchMentions as (query: string) => Promise<ReadonlyArray<MentionDataItem<MentionExtra>>>}
              renderSuggestion={/* chat-input.tsx의 renderSuggestion과 동일 */}
              displayTransform={(_id, display) => `@${display ?? ''}`}
              appendSpaceOnAdd
              markup="@[__display__](__id__)"
            />
          </MentionsInput>

          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!plainTextForDisabled}
            className="h-[38px] flex-shrink-0"
          >
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">{t("send")}</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
```

### Pattern 2: ChatPage에서 URL의 mentions 파라미터 파싱

**What:** `chat/page.tsx`의 `searchParams`에서 `mentions` JSON 파라미터를 파싱해 `ChatPage`에 전달. `ChatPage`의 `useEffect`에서 `handleSend(initialQuery, initialMentions)` 호출.

**When to use:** LLMQueryBar에서 멘션 포함 submit 시.

**Example:**
```typescript
// app/[locale]/(dashboard)/chat/page.tsx
type Props = {
  searchParams: Promise<{ q?: string; mentions?: string }>
}

export default async function NewChatPage({ searchParams }: Props) {
  const [sessions, params] = await Promise.all([
    getChatSessions(),
    searchParams,
  ])

  // mentions JSON 파싱: 실패 시 undefined (하위 호환)
  let initialMentions: MentionItem[] | undefined
  if (params.mentions) {
    try {
      initialMentions = JSON.parse(decodeURIComponent(params.mentions))
    } catch {
      // 파싱 실패 시 무시 — 멘션 없이 전송
    }
  }

  return (
    <ChatPage
      initialSessions={sessions}
      initialQuery={params.q}
      initialMentions={initialMentions}
    />
  )
}
```

```typescript
// components/chat/chat-page.tsx
type ChatPageProps = {
  initialSessions: SessionSummary[]
  sessionId?: string
  initialMessages?: Message[]
  initialQuery?: string
  initialMentions?: MentionItem[]  // NEW: LLMQueryBar에서 전달받은 멘션
}

// useEffect: initialQuery + initialMentions 함께 처리
useEffect(() => {
  if (initialQuery && !initialSessionId) {
    handleSend(initialQuery, initialMentions ?? [], undefined)
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [])
```

### Pattern 3: renderSuggestion 공유 방안

**What:** `chat-input.tsx`와 `llm-query-bar.tsx`의 `renderSuggestion`이 동일한 로직을 필요로 한다. 중복을 피하기 위해 공유 유틸리티로 추출.

**When to use:** 두 컴포넌트 모두 renderSuggestion이 필요할 때.

**Option A (권장):** `prevTypeRef` 패턴을 함수 밖으로 추출

```typescript
// hooks/use-mention.ts에 추가 (또는 별도 파일)
export function createRenderSuggestion(prevTypeRef: React.MutableRefObject<string | null>) {
  return function renderSuggestion(
    entry: MentionDataItem<MentionExtra>,
    _search: string,
    highlightedDisplay: React.ReactNode,
    index: number,
    focused: boolean
  ) {
    const currentType = entry.type
    const showHeader = index === 0 || prevTypeRef.current !== currentType
    if (showHeader) prevTypeRef.current = currentType
    // ... 동일한 JSX
  }
}
```

**Option B (단순):** 각 컴포넌트에 동일 코드 복붙 (DRY 위반이지만 Phase 40 범위에서 허용)

**Phase 40 권장:** Option B (복붙). 두 컴포넌트가 공존하면 나중에 리팩토링 검토.

### Anti-Patterns to Avoid

- **`useChatStream`을 LLMQueryBar 내부에서 직접 호출하지 말 것:** QueryBar UI에는 스트리밍 결과를 표시할 공간이 없다. 채팅 페이지로 네비게이션하는 것이 올바른 UX.
- **`<MentionsInput autoResize>`를 QueryBar에 사용하지 말 것:** QueryBar는 단일 행 UI다. `autoResize`를 켜면 멘션 텍스트가 길어질 때 높이가 팽창하여 레이아웃이 깨진다.
- **`suggestionsPlacement="above"` 미사용:** QueryBar는 헤더 바로 아래에 위치하므로 드롭다운이 위로 열리면 헤더에 가려진다. `"below"` 또는 `"auto"` 사용.
- **멘션 없는 submit을 변경하지 말 것:** 기존 동작(`/chat?q=...`)을 유지해 하위 호환성 보장.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 자동완성 드롭다운 | textarea + Popover + 직접 키보드 처리 | react-mentions-ts MentionsInput | Phase 38에서 이미 통합. IME, 키보드, 커서 추적 모두 내장. |
| 디바운스 + AbortController | setTimeout 직접 관리 | `useMention.fetchMentions` (기존 훅) | Phase 38에서 이미 구현. 재사용만 하면 됨. |
| 멘션 → MentionItem 변환 | 직접 파싱 | `occurrencesToMentionItems` (기존 유틸) | Phase 38에서 이미 구현. 중복 제거 로직 포함. |
| 서버 멘션 처리 | 새 API 엔드포인트 | `/api/chat` + `resolveMentions` (기존) | Phase 36 파이프라인이 이미 `mentions[]`를 처리함. |

**Key insight:** Phase 40은 "새 기능 개발"이 아니라 "기존 시스템의 진입점 추가"다. 새 코드는 최소화하고 기존 컴포넌트/훅/API를 최대한 재사용해야 한다.

---

## Common Pitfalls

### Pitfall 1: suggestionsPlacement 방향 오류

**What goes wrong:** `suggestionsPlacement="above"` (chat-input.tsx 기본값)를 QueryBar에 그대로 복붙하면 드롭다운이 헤더 위로 열려 브라우저 상단에 잘린다.

**Why it happens:** chat-input.tsx는 화면 하단에 위치하므로 `"auto"`로 설정되어 있다. QueryBar는 화면 상단 바로 아래에 있어 아래 방향이 맞다.

**How to avoid:** `suggestionsPlacement="below"` 설정. 또는 `"auto"` (react-mentions-ts가 viewport를 측정해 자동 결정).

**Warning signs:** 드롭다운이 헤더에 가려지거나 화면 밖으로 잘리는 경우.

### Pitfall 2: MentionsInput 단일 행 UI 제약

**What goes wrong:** `<MentionsInput>`은 기본적으로 `<textarea>`를 렌더링하므로, className으로 높이를 고정해도 내부 textarea가 여러 줄로 확장될 수 있다.

**Why it happens:** `autoResize` prop이 없어도 사용자가 줄바꿈(Shift+Enter)을 입력하면 textarea가 확장된다.

**How to avoid:**
- `onKeyDown`에서 `Enter`(shift 없이)는 submit 처리, `Shift+Enter`는 `e.preventDefault()`로 막거나 무시
- CSS로 `overflow-y: hidden` + 고정 높이 강제
- 또는 MentionsInput의 `rows={1}` prop 사용 (textarea 속성 pass-through)

**Warning signs:** QueryBar가 다중 행으로 팽창되어 레이아웃이 깨지는 경우.

### Pitfall 3: mentions URL 파라미터 직렬화 문제

**What goes wrong:** `JSON.stringify(mentionItems)`를 URL에 그대로 붙이면 특수문자(`[`, `]`, `{`, `}`, `"`)가 URL을 깨뜨린다.

**Why it happens:** URL 인코딩 없이 JSON을 쿼리 스트링에 포함시키면 브라우저가 파싱 실패.

**How to avoid:** `encodeURIComponent(JSON.stringify(mentionItems))` 사용. 수신 측에서 `JSON.parse(decodeURIComponent(params.mentions))`.

**Warning signs:** URL에서 `mentions` 파라미터가 잘리거나 파싱 오류 발생.

### Pitfall 4: prevTypeRef 공유 문제

**What goes wrong:** `prevTypeRef`를 모듈 수준이나 외부에서 공유하면, 두 컴포넌트(LLMQueryBar, ChatInput)가 동시에 드롭다운을 열 때 ref가 오염된다.

**Why it happens:** Phase 38의 `prevTypeRef` 패턴은 컴포넌트 인스턴스 내의 `useRef`여야 한다.

**How to avoid:** 각 컴포넌트에서 `const prevTypeRef = useRef<string | null>(null)` 로컬 선언. 공유하지 않는다.

### Pitfall 5: initialMentions useEffect 의존성 배열

**What goes wrong:** `initialMentions`를 `useEffect` 의존성 배열에 추가하면, 부모 컴포넌트 리렌더링마다 handleSend가 재호출된다.

**Why it happens:** 객체/배열은 reference equality로 비교되어 매번 새 레퍼런스로 판단됨.

**How to avoid:** Phase 39의 패턴을 그대로 따른다 — `// eslint-disable-next-line react-hooks/exhaustive-deps` 주석과 함께 의존성 배열을 비움 (`[]`). 단, ESLint 경고 명시적으로 무시.

### Pitfall 6: LLMQueryBar의 layout 파일에서 props 전달

**What goes wrong:** `layout.tsx`는 서버 컴포넌트이고 `LLMQueryBar`는 클라이언트 컴포넌트다. Teacher session 데이터를 LLMQueryBar에 전달하려 하면 직렬화 문제가 발생할 수 있다.

**Why it happens:** 서버 컴포넌트 → 클라이언트 컴포넌트로 non-serializable props 전달 시 오류.

**How to avoid:** LLMQueryBar는 teacher 데이터 없이도 동작한다. 자동완성 API(`/api/chat/mentions/search`)가 자체적으로 `verifySession()`을 호출하므로, LLMQueryBar에 session props 전달이 불필요함. 기존 패턴 유지.

---

## Code Examples

Verified patterns from official sources and existing codebase:

### 기존 submitHandler의 멘션 포함 버전

```typescript
// Source: 기존 llm-query-bar.tsx 패턴 + occurrencesToMentionItems 추가
const handleSubmit = useCallback(() => {
  const plainText = mentionMarkup.replace(/@\[([^\]]+)\]\([^)]+\)/g, '@$1').trim()
  if (!plainText) {
    toast.error(t("errorNoPrompt"))
    return
  }

  const mentionItems = occurrencesToMentionItems(activeMentions)

  // URL 파라미터 구성
  const params = new URLSearchParams({ q: plainText })
  if (mentionItems.length > 0) {
    params.set('mentions', JSON.stringify(mentionItems))
  }

  router.push(`/chat?${params.toString()}`)
  setMentionMarkup("")
  setActiveMentions([])
}, [mentionMarkup, activeMentions, router, t])
```

### ChatPage의 initialMentions 처리

```typescript
// Source: 기존 chat-page.tsx의 initialQuery useEffect 패턴 확장
useEffect(() => {
  if (initialQuery && !initialSessionId) {
    handleSend(initialQuery, initialMentions ?? [], undefined)
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [])
```

### mentions URL 파라미터 파싱 (chat/page.tsx)

```typescript
// Source: 기존 chat/page.tsx searchParams 패턴 확장
let initialMentions: MentionItem[] | undefined
if (params.mentions) {
  try {
    const parsed = JSON.parse(params.mentions)
    // 타입 가드: MentionItem[] 형태인지 확인
    if (Array.isArray(parsed) && parsed.every(
      (m): m is MentionItem => typeof m === 'object' && 'type' in m && 'id' in m
    )) {
      initialMentions = parsed
    }
  } catch {
    // 파싱 실패 시 무시 — 멘션 없이 전송
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| LLMQueryBar: `<input type="text">` | `<MentionsInput>` | Phase 40 | @멘션 자동완성 지원 |
| submit: URL 라우팅만 | URL 라우팅 + mentions 파라미터 | Phase 40 | 멘션 포함 질문이 서버 파이프라인으로 처리됨 |
| ChatPage: `initialQuery`만 수신 | `initialQuery` + `initialMentions` | Phase 40 | LLMQueryBar 발신 멘션이 chat-page에서 처리됨 |

**Deprecated/outdated:**
- LLMQueryBar의 `inputRef` (HTMLInputElement): `<MentionsInput>`으로 교체하면 불필요해짐

---

## Key Architecture Decision: URL vs Direct API Call

LLMQueryBar의 submit 전략에 두 가지 옵션이 있다:

### Option A: URL 파라미터 직렬화 (권장)

```
LLMQueryBar submit
  → router.push('/chat?q=...&mentions=[{...}]')
  → chat/page.tsx (서버): searchParams 파싱
  → ChatPage: initialQuery + initialMentions로 handleSend 호출
  → useChatStream → /api/chat (Phase 36 파이프라인)
```

**장점:**
- 기존 아키텍처와 완벽히 일관됨 (초기 query는 이미 URL로 전달됨)
- SSR 친화적: page.tsx에서 서버 사이드 파싱 가능
- 새로고침/히스토리 지원
- LLMQueryBar가 스트리밍 상태 관리 불필요

**단점:**
- URL이 길어질 수 있음 (mentionItems JSON이 URL에 노출)
- mentions 파라미터 파싱 로직이 chat/page.tsx에 추가됨

### Option B: LLMQueryBar 내부 useChatStream 직접 호출

```
LLMQueryBar submit
  → useChatStream.sendMessage({ prompt, mentions })
  → /api/chat (Phase 36 파이프라인)
  → 스트리밍 응답... (어디서 표시?)
```

**장점:**
- 채팅 페이지 진입 없이 처리 가능

**단점:**
- QueryBar UI에 스트리밍 결과 표시 공간 없음
- 스트리밍 완료 후 채팅 페이지로 이동해도 해당 세션 복구 복잡
- Phase 40 목표("빠르게 할 수 있다")와 맞지 않음 — 결국 채팅 페이지로 이동해야 함

**결론:** Option A (URL 파라미터 직렬화)를 채택한다. Phase 40 success criteria #2 ("Phase 36 서버 파이프라인이 동일하게 처리")는 chat/page.tsx → ChatPage → useChatStream → /api/chat 경로로 이미 충족된다.

---

## Open Questions

1. **mentions URL 파라미터 길이 제한**
   - 학생/선생님/팀을 여러 개 멘션할 경우 URL이 길어질 수 있음
   - 실제 최대 멘션 수: Phase 38에서 타입별 5건 반환, 실용적으로 5~10개 이내
   - MentionItem은 `{type: "student", id: "cuid"}` 형태로 매우 작음 (~30자/개)
   - **결론:** 실용적으로 URL 길이 문제는 발생하지 않음 (HIGH 신뢰도)

2. **MentionsInput 단일 행 스타일링**
   - `<input>`은 단일 행이지만 `<MentionsInput>` (textarea)는 다중 행이 기본
   - react-mentions-ts `MentionsInputClassNames`를 통해 `control`, `input` 클래스 세밀 조정 가능
   - 또는 wrapper div에 `overflow-hidden` + 고정 높이 적용
   - **권장:** `rows={1}` prop 전달 + Enter 시 submit (기존 로직) + `max-h-[38px] overflow-hidden` CSS
   - **신뢰도:** MEDIUM — 실제 렌더링 후 스타일 미세 조정 필요할 수 있음

3. **renderSuggestion 코드 중복**
   - LLMQueryBar와 ChatInput 둘 다 동일한 renderSuggestion 필요
   - Phase 40에서는 복붙(Option B) 허용, 추후 리팩토링으로 공유 컴포넌트 추출
   - **신뢰도:** HIGH — 복붙이 더 단순하고 안전

---

## Sources

### Primary (HIGH confidence)
- 기존 `src/components/chat/chat-input.tsx` — react-mentions-ts MentionsInput 통합 패턴 (실제 동작 중)
- 기존 `src/hooks/use-mention.ts` — useMention, occurrencesToMentionItems (실제 동작 중)
- 기존 `src/components/layout/llm-query-bar.tsx` — 현재 구현 (교체 대상)
- 기존 `src/app/[locale]/(dashboard)/chat/page.tsx` — searchParams 패턴 (확장 대상)
- 기존 `src/components/chat/chat-page.tsx` — initialQuery + handleSend 패턴 (확장 대상)
- react-mentions-ts `dist/index.d.ts` v5.4.7 — `suggestionsPlacement: 'auto' | 'above' | 'below'` 타입 확인
- Phase 38 RESEARCH.md — react-mentions-ts 통합 패턴 (이 프로젝트에서 검증됨)
- Phase 39 RESEARCH.md — handleSend 4-param 패턴, mentions 데이터 흐름

### Secondary (MEDIUM confidence)
- Phase 38~39 SUMMARY.md — prevTypeRef 패턴, occurrencesToMentionItems 동작 검증

### Tertiary (LOW confidence)
- 없음

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — 모든 라이브러리 이미 설치 및 동작 중
- Architecture: HIGH — 기존 패턴을 직접 확인. URL 직렬화 방안은 실제 코드 기반
- Pitfalls: HIGH — 실제 코드 분석 + Phase 38/39 경험 기반
- MentionsInput 단일 행 스타일링: MEDIUM — 렌더링 후 조정 필요 가능

**Research date:** 2026-02-19
**Valid until:** 2026-03-19 (react-mentions-ts 버전 고정이므로 30일 유효)
