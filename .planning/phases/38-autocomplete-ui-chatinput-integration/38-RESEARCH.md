# Phase 38: Autocomplete UI & ChatInput Integration - Research

**Researched:** 2026-02-19
**Domain:** react-mentions-ts v5.4.7 + Tailwind v4 + Korean IME + Next.js 15 Chat Input
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### 드롭다운 UI 디자인
- 그룹 헤더 + 구분선으로 학생/선생님/학급 섹션 구분 (Slack 멘션 드롭다운 스타일)
- 각 항목: 이름 + 서브레이블만 표시 (아바타 없음)
  - 학생: '홍길동 · 3학년 방과후초'
  - 선생님: '김철수 · TEACHER'
  - 학급: 'A반 · 5명'

#### 입력 & 멘션 삽입 동작
- Phase 36의 "Parse on Submit" 결정 유지 — 입력창 내 멘션 표시 방식은 Claude 재량

#### 한국어 IME & 키보드 인터랙션
- 키보드 탐색: ↑↓ Enter Esc 기본 4종 필수 지원

### Claude's Discretion

#### 드롭다운 UI
- 최대 표시 개수 (타입별 또는 전체)
- 빈 결과 상태 메시지 vs 드롭다운 숨김

#### 입력/멘션
- @트리거 타이밍 (@ 즉시 vs @ + 1자 이상)
- 멘션 텍스트 표시 방식 (평문 vs 시각적 칩)
- 다중 멘션 지원 여부
- 멘션 삽입 후 커서 동작 (공백 자동 삽입 여부)

#### IME/키보드
- IME 조합 중 드롭다운 동작 (차단 vs 실시간 검색)
- 디바운스 타이밍 (200ms 기준, 조정 가능)
- 드롭다운 열린 상태에서 Enter 동작 (항목 선택 vs 메시지 전송)

#### 라이브러리
- react-mentions-ts vs @ariakit/react vs 직접 구현 — 스파이크 테스트 결과 기반 판단
- 스파이크 성공/실패 판단 기준
- 외부 라이브러리 vs 직접 구현 선택

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MENT-01 | 교사가 채팅 입력창에서 @를 입력하면 학생/선생님/학급 검색 드롭다운이 표시된다 | react-mentions-ts MentionsInput + Mention trigger="@" 조합으로 직접 구현. data 함수가 GET /api/chat/mentions/search 호출. 200ms 디바운스는 data 함수 내부에서 setTimeout+stale-query 패턴으로 처리. |
| MENT-02 | 교사가 드롭다운에서 엔티티를 선택하면 채팅 입력에 멘션이 삽입된다 | react-mentions-ts의 Mention.onAdd 콜백 또는 onMentionsChange.mentions 배열로 추적. 선택 시 markup "@[홍길동](student:abc123)"이 value에 삽입되고 displayTransform이 "@홍길동"으로 표시. appendSpaceOnAdd로 공백 자동 삽입. |
| MENT-05 | 한국어 IME 조합 중에도 자동완성이 정상 작동한다 | react-mentions-ts가 _isComposing 플래그를 내부적으로 관리 (compositionstart/compositionend 이벤트 핸들러 내장). _isComposing=true 시 updateMentionsQueries 호출이 차단되어 드롭다운이 열리지 않음. 별도 IME 처리 코드 불필요. |
| UI-01 | 드롭다운 자동완성이 타입별 그룹으로 표시된다 (학생/선생님/학급) | 단일 Mention 컴포넌트 + renderSuggestion 클로저 패턴으로 구현. data 함수가 students+teachers+teams를 flat 배열로 반환 (학생→선생님→팀 순). renderSuggestion(entry, search, highlightedDisplay, index, focused)의 index 파라미터와 flat 배열 참조로 타입 전환 지점 감지 → 그룹 헤더 렌더링. |
</phase_requirements>

---

## Summary

Phase 38의 핵심 라이브러리인 react-mentions-ts@5.4.7은 이 프로젝트에 필요한 모든 기능을 내장하고 있다. 특히 한국어 IME 조합 차단(`_isComposing` 플래그), 키보드 탐색(↑↓ Enter Esc), Tailwind v4 호환 스타일시스트, async data 함수 지원이 모두 포함되어 있다. peer dependency(class-variance-authority, clsx, tailwind-merge)는 이미 설치되어 있으므로 `pnpm add react-mentions-ts@5.4.7` 하나만 추가하면 된다.

**가장 중요한 아키텍처 결정 사항이 두 가지다:**

첫째, react-mentions-ts는 동일한 trigger 값을 가진 `<Mention>` 컴포넌트를 두 개 이상 받으면 런타임 에러를 던진다(`seenChildren` 중복 검사). 따라서 학생/선생님/학급을 각각 별도 `<Mention trigger="@">`로 처리할 수 없다. 단일 `<Mention trigger="@">`를 사용하고 data 함수에서 3가지 타입을 flat 배열로 반환해야 하며, 그룹 헤더는 `renderSuggestion`의 `index` 파라미터와 클로저로 주입한다.

둘째, react-mentions-ts의 data prop이 정적 배열이면 클라이언트 측에서 다시 필터링한다(`getSubstringIndex`). 우리는 서버 API가 이미 필터한 결과를 반환하므로 data를 **함수 형태**로 전달해야 이중 필터링을 피할 수 있다. 이 함수 안에서 200ms 디바운스(setTimeout+stale query ref 패턴)와 AbortController를 직접 관리한다.

**Primary recommendation:** `react-mentions-ts@5.4.7` 스파이크 → 성공 시 그대로 채택. 실패 기준(shadcn/ui 스타일 충돌 또는 Tailwind v4 @source 미작동)이면 `@radix-ui/react-popover` + 직접 textarea 구현으로 fallback.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-mentions-ts | 5.4.7 | MentionsInput (textarea+overlay) | 유일한 React 19 + Tailwind v4 + TypeScript + IME 내장 멘션 라이브러리. 기존 signavio/react-mentions의 TS 재작성 버전. |
| use-debounce | 10.1.0 | 디바운스 | 이미 설치됨. useDebouncedCallback export 포함. (실제로는 in-function setTimeout 패턴 선호 - 아래 설명) |
| @/hooks/use-chat-stream | — | 기존 스트리밍 훅 | mentions[] 추가 파라미터만 확장 |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| radix-ui (Popover) | 1.4.3 | fallback 드롭다운 | react-mentions-ts 스파이크 실패 시 직접 구현 fallback |
| cmdk | 1.1.1 | fallback 목록 렌더링 | react-mentions-ts 스파이크 실패 시 CommandList 재사용 |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-mentions-ts | @ariakit/react combobox-textarea | ariakit은 Phase 계획서에 명시된 fallback. shadcn/ui 충돌 시 사용. |
| react-mentions-ts | 직접 구현 (textarea + Popover) | 완전한 제어권, 그룹 헤더 자유롭게 구현 가능. 그러나 커서 추적, highlight 레이어, IME 처리 등 수백 줄의 직접 구현 필요. |
| data 함수 방식 | data 정적 배열 | 정적 배열은 react-mentions-ts가 클라이언트 필터링(getSubstringIndex)을 재적용함 → 이중 필터. 함수 방식은 결과를 그대로 사용. |

**Installation:**
```bash
pnpm add react-mentions-ts@5.4.7
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── hooks/
│   └── use-mention.ts          # 자동완성 상태, 디바운스 페치, AbortController
├── components/
│   └── chat/
│       ├── chat-input.tsx      # MentionsInput 통합, onSend(prompt, mentions[], providerId?)
│       └── mention-suggestion-item.tsx  # renderSuggestion 컴포넌트 (그룹 헤더 포함)
```

### Pattern 1: Single Mention with Flat Data + Group Headers via renderSuggestion

**What:** 단일 `<Mention trigger="@">` 컴포넌트에 flat 배열을 data 함수로 전달. `renderSuggestion`의 `index` 파라미터를 사용해 타입 경계에서 그룹 헤더 렌더링.

**When to use:** react-mentions-ts 스파이크 성공 시 (Tailwind v4 @source 정상 동작 + shadcn/ui 스타일 충돌 없음)

**Example:**
```typescript
// Source: react-mentions-ts README + GitHub source analysis
// 그룹 헤더 주입 패턴

type MentionExtra = {
  type: 'student' | 'teacher' | 'team'
  sublabel: string
}

// use-mention.ts에서 관리하는 flat 배열
const [flatSuggestions, setFlatSuggestions] = useState<MentionDataItem<MentionExtra>[]>([])

// data 함수: 디바운스 + AbortController 내장
const latestQueryRef = useRef('')
const abortRef = useRef<AbortController | null>(null)

const mentionData = useCallback(async (query: string): Promise<MentionDataItem<MentionExtra>[]> => {
  latestQueryRef.current = query

  // 최소 2자 미만이면 즉시 빈 결과 (API 최소 검색어 동일)
  if (query.length < 2) return []

  // 200ms 디바운스: stale query 체크
  await new Promise(resolve => setTimeout(resolve, 200))
  if (latestQueryRef.current !== query) return []

  // AbortController로 이전 요청 취소
  abortRef.current?.abort()
  const controller = new AbortController()
  abortRef.current = controller

  try {
    const res = await fetch(
      `/api/chat/mentions/search?q=${encodeURIComponent(query)}`,
      { signal: controller.signal }
    )
    if (!res.ok) return []
    const data: MentionSearchResponse = await res.json()

    // flat 배열로 변환: 학생 → 선생님 → 팀 순서
    return [
      ...data.students.map(s => ({ id: `student:${s.id}`, display: s.name, type: 'student' as const, sublabel: s.sublabel })),
      ...data.teachers.map(t => ({ id: `teacher:${t.id}`, display: t.name, type: 'teacher' as const, sublabel: t.sublabel })),
      ...data.teams.map(t => ({ id: `team:${t.id}`, display: t.name, type: 'team' as const, sublabel: t.sublabel })),
    ]
  } catch {
    return []
  }
}, [])

// renderSuggestion: 클로저로 flatSuggestions 참조하여 그룹 헤더 주입
const renderSuggestion = useCallback((
  entry: SuggestionDataItem<MentionExtra>,
  search: string,
  highlightedDisplay: ReactNode,
  index: number,
  focused: boolean
) => {
  const isFirstOfType = index === 0 || entry.type !== flatSuggestions[index - 1]?.type
  const groupLabels = { student: '학생', teacher: '선생님', team: '학급' }

  return (
    <>
      {isFirstOfType && (
        <div className="px-2 pt-2 pb-1 text-xs font-semibold text-muted-foreground border-t first:border-t-0">
          {groupLabels[entry.type]}
        </div>
      )}
      <div className="flex flex-col px-2 py-1">
        <span className="text-sm font-medium">{highlightedDisplay}</span>
        <span className="text-xs text-muted-foreground">{entry.sublabel}</span>
      </div>
    </>
  )
}, [flatSuggestions])
```

### Pattern 2: MentionsInput + ChatInput Integration

**What:** 기존 `ChatInput.tsx`의 `<Textarea>`를 `<MentionsInput>`으로 교체. `onSend` 시그니처에 `mentions[]` 추가.

**Example:**
```typescript
// Source: react-mentions-ts README
import { MentionsInput, Mention } from 'react-mentions-ts'
import type { MentionOccurrence } from 'react-mentions-ts'
import type { MentionExtra } from '@/hooks/use-mention'

// ChatInput props 시그니처 변경
type ChatInputProps = {
  onSend: (prompt: string, mentions: MentionItem[], providerId?: string) => void
  onCancel: () => void
  isStreaming: boolean
  initialValue?: string
}

// 내부 상태
const [mentionMarkup, setMentionMarkup] = useState('')
const [activeMentions, setActiveMentions] = useState<MentionOccurrence<MentionExtra>[]>([])

// onMentionsChange 핸들러
const handleMentionsChange = useCallback(({ value, mentions }: MentionsInputChangeEvent<MentionExtra>) => {
  setMentionMarkup(value)
  setActiveMentions(mentions)
}, [])

// Submit 시 mentions → MentionItem[] 변환
const handleSubmit = useCallback(() => {
  const plainText = mentionMarkup.replace(/@\[([^\]]+)\]\([^)]+\)/g, '@$1')
  const mentionItems: MentionItem[] = activeMentions.map(m => {
    const [type, id] = String(m.id).split(':')
    return { type: type as MentionType, id }
  })
  onSend(plainText, mentionItems, parseProviderId(selectedModel))
  setMentionMarkup('')
  setActiveMentions([])
}, [mentionMarkup, activeMentions, ...])

// Enter 키 처리 (드롭다운 열려있으면 react-mentions-ts가 가로챔 → 닫혀있으면 통과)
const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSubmit()
  }
}, [handleSubmit])

// JSX
<MentionsInput
  value={mentionMarkup}
  onMentionsChange={handleMentionsChange}
  onKeyDown={handleKeyDown}
  a11ySuggestionsListLabel="멘션 검색 결과"
  suggestionsPlacement="above"  // 채팅 입력창은 화면 하단 → 드롭다운을 위쪽으로
  autoResize
  disabled={isStreaming}
>
  <Mention
    trigger="@"
    data={mentionData}
    renderSuggestion={renderSuggestion}
    displayTransform={(_id, display) => `@${display}`}
    appendSpaceOnAdd
    markup="@[__display__](__id__)"
  />
</MentionsInput>
```

### Pattern 3: useChatStream.ts + ChatPage.tsx mentions[] 전달

**What:** ChatPage의 `handleSend`에서 mentions[] 수신 → useChatStream.sendMessage에 추가 → POST body에 포함.

**Example:**
```typescript
// useChatStream.ts - SendMessageOptions 타입 확장
type SendMessageOptions = {
  prompt: string
  providerId?: string
  sessionId?: string
  messages?: Array<{ role: 'user' | 'assistant'; content: string }>
  mentions?: MentionItem[]   // 추가
}

// POST body에 포함
body: JSON.stringify({
  prompt,
  providerId,
  sessionId,
  messages,
  mentions,   // 추가
}),

// ChatPage.tsx - handleSend 시그니처 변경
const handleSend = useCallback(async (prompt: string, mentions: MentionItem[], providerId?: string) => {
  ...
  await sendMessage({ prompt, mentions, providerId, sessionId, messages: contextMessages })
  ...
}, [])
```

### Anti-Patterns to Avoid

- **중복 trigger 사용:** `<Mention trigger="@">` 두 개 이상 → 런타임 에러 발생. 반드시 단일 `<Mention>`으로 모든 타입 처리.
- **정적 배열을 data prop에 전달:** react-mentions-ts가 client-side 재필터링 적용 → 이중 필터. 반드시 함수로 전달.
- **data 함수에서 callback 파라미터 기대:** DataSource 타입은 `(query: string) => MaybePromise<MentionDataItem[]>` — 콜백 패턴 아님.
- **Enter 키 핸들러 중복:** 드롭다운 열려있을 때 react-mentions-ts가 Enter를 가로채 선택 처리. 닫혀있을 때만 외부 onKeyDown 호출됨. 이 동작에 의존해 Submit 로직 작성.
- **Tailwind v4에서 node_modules 자동 스캔 기대:** Tailwind v4는 node_modules를 기본 제외. `globals.css`에 `@import "react-mentions-ts/styles/tailwind.css"` 반드시 추가.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 커서 위치 추적 | 직접 selectionStart/selectionEnd 관리 | react-mentions-ts 내장 | caret 좌표 계산, highlight 레이어 동기화, scroll 동기화 등 수백 줄의 엣지 케이스 존재 |
| IME composition 이벤트 처리 | compositionstart/end 직접 관리 | react-mentions-ts 내장 (_isComposing) | 이미 검증된 구현. `_isComposing=true`이면 `updateMentionsQueries` 자동 차단 |
| 키보드 네비게이션 (↑↓ Enter Esc) | 직접 focusIndex 상태 관리 | react-mentions-ts 내장 | `shiftFocus`, `selectFocused`, `clearSuggestions` 메서드가 모두 처리 |
| 드롭다운 포지셔닝 | absolute/fixed 위치 계산 | react-mentions-ts SuggestionsOverlay | caret 위치 기반 overlay 자동 배치, `suggestionsPlacement="above"` 옵션 지원 |
| 멘션 마크업 파싱 | 정규식으로 직접 파싱 | `getMentions`, `getPlainText` from `react-mentions-ts/utils` | markup 형식에 맞는 공식 파서 제공 |

**Key insight:** react-mentions-ts의 핵심 가치는 커서 추적 + highlight 레이어 동기화다. 이것을 직접 구현하면 contenteditable 수준의 복잡도가 필요하다.

---

## Common Pitfalls

### Pitfall 1: 동일한 trigger 중복 에러
**What goes wrong:** `<Mention trigger="@">` + `<Mention trigger="@">` → `"MentionsInput does not support Mention children with duplicate triggers: @"` 런타임 에러
**Why it happens:** `validateChildren()`이 `seenChildren` Set으로 trigger 중복을 체크하고 throw
**How to avoid:** 반드시 단일 `<Mention trigger="@">` 사용. 학생/선생님/학급을 flat 배열로 합침
**Warning signs:** 스파이크 테스트 시 콘솔에 에러 즉시 표시

### Pitfall 2: Tailwind v4 스타일 누락
**What goes wrong:** react-mentions-ts 드롭다운이 스타일 없이 렌더링됨 (또는 완전히 안 보임)
**Why it happens:** Tailwind v4는 node_modules를 자동 스캔하지 않음. `react-mentions-ts/dist` 내의 Tailwind 클래스들이 생성되지 않음
**How to avoid:** `globals.css`에 `@import "react-mentions-ts/styles/tailwind.css"` 추가. 이 파일이 `@source "../dist"` 디렉티브를 포함하여 Tailwind에게 스캔 경로를 알려줌
**Warning signs:** 드롭다운이 보이지만 스타일이 없거나 `bg-card`, `border-border` 클래스가 적용 안 됨

### Pitfall 3: 정적 배열 이중 필터링
**What goes wrong:** 서버 API 검색 결과가 다시 클라이언트에서 필터링되어 결과가 누락됨
**Why it happens:** `getDataProvider`가 배열 감지 시 `getSubstringIndex`로 재필터링
**How to avoid:** data prop에 항상 함수 형태 전달: `data={mentionData}` (not `data={results}`)
**Warning signs:** '김철수' 검색 시 결과가 보였다가 사라지는 현상

### Pitfall 4: Enter 키 Submit vs 항목 선택 충돌
**What goes wrong:** 드롭다운이 열린 상태에서 Enter를 눌렀을 때 항목 선택 대신 메시지 전송이 발생
**Why it happens:** 외부 `handleKeyDown`에서 `e.preventDefault()` 호출 후 `handleSubmit()` 실행
**How to avoid:** react-mentions-ts는 드롭다운이 열려있을 때 Enter를 `ev.preventDefault()` + `ev.stopPropagation()`으로 가로챔. 외부 `onKeyDown`은 드롭다운 닫혀있을 때만 도달함. 별도 처리 불필요.
**Warning signs:** 드롭다운에서 Enter 눌렀을 때 항목 선택 없이 빈 메시지 전송

### Pitfall 5: onMentionsChange vs onChange API 혼동
**What goes wrong:** v4에서 v5로 업그레이드 시 onChange 시그니처가 변경됨
**Why it happens:** react-mentions-ts v5.x은 `onMentionsChange({ value, plainTextValue, mentions, ... })` 사용
**How to avoid:** `onMentionsChange` 사용. `onChange`는 deprecated (여전히 동작하지만 시그니처 다름)
**Warning signs:** TypeScript 타입 에러

### Pitfall 6: suggestionsPlacement 기본값 미설정
**What goes wrong:** 드롭다운이 채팅 입력창 아래로 열려 화면 밖으로 벗어남
**Why it happens:** 기본값이 `'below'`. 채팅 입력창은 화면 하단에 위치
**How to avoid:** `suggestionsPlacement="above"` 또는 `"auto"` 설정
**Warning signs:** 드롭다운이 화면 아래로 잘림

---

## Code Examples

Verified patterns from official sources:

### 스파이크 최소 구현 (Plan 38-01 테스트용)
```tsx
// Source: react-mentions-ts README (https://github.com/hbmartin/react-mentions-ts)
import { useState } from 'react'
import { MentionsInput, Mention } from 'react-mentions-ts'

function MentionSpike() {
  const [value, setValue] = useState('')

  const fetchMentions = async (query: string) => {
    if (query.length < 2) return []
    const res = await fetch(`/api/chat/mentions/search?q=${encodeURIComponent(query)}`)
    if (!res.ok) return []
    const data = await res.json()
    return [
      ...data.students.map((s: any) => ({ id: `student:${s.id}`, display: s.name })),
      ...data.teachers.map((t: any) => ({ id: `teacher:${t.id}`, display: t.name })),
      ...data.teams.map((t: any) => ({ id: `team:${t.id}`, display: t.name })),
    ]
  }

  return (
    <MentionsInput
      value={value}
      onMentionsChange={({ value: nextValue }) => setValue(nextValue)}
      suggestionsPlacement="above"
    >
      <Mention
        trigger="@"
        data={fetchMentions}
        displayTransform={(_id, display) => `@${display}`}
        appendSpaceOnAdd
      />
    </MentionsInput>
  )
}
```

### Tailwind v4 @source 설정
```css
/* src/app/globals.css에 추가 */
@import "tailwindcss";
@import "react-mentions-ts/styles/tailwind.css";  /* @source "../dist" 디렉티브 포함 */
```

### MentionItem 변환 (Submit 시)
```typescript
// Source: mention-types.ts (Phase 36 기존 타입 재사용)
import type { MentionOccurrence } from 'react-mentions-ts'
import type { MentionItem, MentionType } from '@/lib/chat/mention-types'

function occurrencesToMentionItems(
  mentions: MentionOccurrence<{ type: MentionType }>[]
): MentionItem[] {
  // 중복 제거: 같은 엔티티를 여러 번 멘션해도 한 번만 서버에 전달
  const seen = new Set<string>()
  return mentions.flatMap(m => {
    const raw = String(m.id) // "student:abc123"
    if (seen.has(raw)) return []
    seen.add(raw)
    const colonIdx = raw.indexOf(':')
    const type = raw.slice(0, colonIdx) as MentionType
    const id = raw.slice(colonIdx + 1)
    return [{ type, id }]
  })
}
```

### 디바운스 + AbortController data 함수
```typescript
// Source: react-mentions-ts types.ts DataSource 타입 분석
import { useRef, useCallback } from 'react'
import type { MentionDataItem } from 'react-mentions-ts'
import type { MentionSearchResponse } from '@/lib/chat/mention-types'

type MentionExtra = { type: 'student' | 'teacher' | 'team'; sublabel: string }

export function useMention() {
  const latestQueryRef = useRef<string>('')
  const abortRef = useRef<AbortController | null>(null)

  const fetchMentions = useCallback(async (query: string): Promise<MentionDataItem<MentionExtra>[]> => {
    // 최소 2자: API 서버 요건 동일
    if (query.length < 2) return []

    // stale query ref 업데이트
    latestQueryRef.current = query

    // 200ms 디바운스
    await new Promise(resolve => setTimeout(resolve, 200))
    if (latestQueryRef.current !== query) return [] // stale

    // AbortController
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch(
        `/api/chat/mentions/search?q=${encodeURIComponent(query)}`,
        { signal: controller.signal }
      )
      if (!res.ok) return []
      const data: MentionSearchResponse = await res.json()

      return [
        ...data.students.map(s => ({
          id: `student:${s.id}`,
          display: s.name,
          type: 'student' as const,
          sublabel: s.sublabel,
        })),
        ...data.teachers.map(t => ({
          id: `teacher:${t.id}`,
          display: t.name,
          type: 'teacher' as const,
          sublabel: t.sublabel,
        })),
        ...data.teams.map(t => ({
          id: `team:${t.id}`,
          display: t.name,
          type: 'team' as const,
          sublabel: t.sublabel,
        })),
      ]
    } catch {
      return [] // AbortError 포함 모든 에러 → 빈 결과
    }
  }, [])

  return { fetchMentions }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-mentions (JS) | react-mentions-ts (TypeScript) | 2024 | 완전한 타입 안전성, React 19 지원 |
| onChange(event, value, plainText, mentions) | onMentionsChange({ value, plainTextValue, mentions, trigger, ... }) | v5.x | 더 풍부한 이벤트 메타데이터 |
| content array in tailwind.config.js | @source directive in globals.css | Tailwind v4 | node_modules 스캔을 @source로 명시 |
| allowSuggestionsAboveCursor (boolean) | suggestionsPlacement ('auto' or 'above') | v5.x | 더 명확한 API |

**Deprecated/outdated:**
- `onChange` prop: deprecated (v5.x에서 `onMentionsChange`로 교체). 여전히 동작하지만 시그니처가 구버전 형식.
- `allowSuggestionsAboveCursor`: deprecated, `suggestionsPlacement="above"` 사용

---

## Open Questions

1. **Spike 성공/실패 판단 기준 (Plan 38-01)**
   - What we know: react-mentions-ts는 Tailwind v4 "first-class support" 명시. peer deps 모두 이미 설치됨.
   - What's unclear: shadcn/ui 컴포넌트 스타일(radix-ui 기반)과 react-mentions-ts의 Tailwind 스타일 간 충돌 가능성. 특히 `border-border`, `bg-card` CSS 변수 호환성.
   - Recommendation: 스파이크에서 (1) @import 추가 후 드롭다운 스타일 확인, (2) shadcn Textarea 옆에 배치 시 시각적 일관성 확인. 두 조건 통과 = 성공.

2. **멘션 텍스트 표시: 평문 vs 시각적 칩**
   - What we know: react-mentions-ts는 Mention `className` prop으로 멘션 텍스트에 스타일 적용 가능. `data-mention-selection` attribute로 포커스 상태 스타일링 가능.
   - What's unclear: 칩 스타일(배경색 + 둥근 모서리)이 textarea와 자연스럽게 어우러지는지 UI 검증 필요.
   - Recommendation: `@홍길동` 평문 + 미묘한 배경색 (`bg-blue-100 text-blue-800 rounded`) 으로 칩 흉내. contenteditable 없이도 가능.

3. **customSuggestionsContainer 활용 범위**
   - What we know: customSuggestionsContainer는 전체 목록의 wrapper div를 커스텀. 개별 항목 사이에 헤더 삽입 불가.
   - What's unclear: overlay 최대 높이, 스크롤 동작이 커스텀 컨테이너와 충돌하는지.
   - Recommendation: 기본 overlay 사용. 그룹 헤더는 renderSuggestion 내 index 기반으로 처리.

---

## Sources

### Primary (HIGH confidence)
- `/hbmartin/react-mentions-ts` (Context7) — MentionsInput props, Mention props, TypeScript types, async data, renderSuggestion
- `https://raw.githubusercontent.com/hbmartin/react-mentions-ts/master/src/MentionsInput.tsx` — IME 처리(_isComposing), Enter 키 처리(suggestionHandledKeys), 중복 trigger 에러(validateChildren), onMentionsChange 콜백
- `https://raw.githubusercontent.com/hbmartin/react-mentions-ts/master/src/types.ts` — DataSource, MentionDataItem<Extra>, MentionOccurrence 타입
- `https://raw.githubusercontent.com/hbmartin/react-mentions-ts/master/src/Suggestion.tsx` — renderSuggestion 시그니처 (li 래퍼 확인)
- `https://raw.githubusercontent.com/hbmartin/react-mentions-ts/master/src/SuggestionsOverlay.tsx` — isOpened 조건 (countSuggestions=0이면 닫힘)
- `/home/gon/projects/ai/ai-afterschool/src/components/chat/chat-input.tsx` — 기존 ChatInput 구조 파악
- `/home/gon/projects/ai/ai-afterschool/src/hooks/use-chat-stream.ts` — SendMessageOptions 타입, fetch POST 패턴
- `/home/gon/projects/ai/ai-afterschool/src/app/api/chat/route.ts` — mentions: MentionItem[] 이미 수신 처리됨 (Phase 36 완료)
- `/home/gon/projects/ai/ai-afterschool/src/lib/chat/mention-types.ts` — MentionSearchResponse, MentionItem, MentionType 기존 타입

### Secondary (MEDIUM confidence)
- npm show react-mentions-ts@5.4.7 (peerDependencies, exports, files) — 의존성 및 패키지 구조 확인
- react-mentions-ts styles/tailwind.css 내용 (`@source "../dist"`) — Tailwind v4 통합 방법 확인

### Tertiary (LOW confidence)
- 없음

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — react-mentions-ts v5.4.7 직접 소스 코드 분석 완료. peer deps 이미 설치됨 확인.
- Architecture (그룹 헤더 패턴): HIGH — renderSuggestion + index 파라미터 + Suggestion.tsx 구조 확인. 실현 가능성 검증됨.
- IME 처리: HIGH — MentionsInput.tsx 소스에서 _isComposing 플래그와 updateMentionsQueries 차단 로직 직접 확인.
- Tailwind v4 통합: MEDIUM — @source 디렉티브 방식 확인됨. shadcn/ui 충돌 가능성은 스파이크(38-01)에서 검증 필요.
- Pitfalls: HIGH — 소스 코드 분석으로 중복 trigger 에러, 정적 배열 재필터링 등 실제 코드 경로 확인.

**Research date:** 2026-02-19
**Valid until:** 2026-03-20 (react-mentions-ts는 활발히 유지보수 중 — 패치 주의)
