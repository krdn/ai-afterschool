---
phase: 38-autocomplete-ui-chatinput-integration
plan: 02
subsystem: ui
tags: [react-mentions-ts, autocomplete, mention, chat-input, tailwindcss]

# Dependency graph
requires:
  - phase: 38-autocomplete-ui-chatinput-integration/38-01
    provides: react-mentions-ts@5.4.7 설치, useMention 훅, MentionExtra 타입, fetchMentions 함수
  - phase: 37-autocomplete-search-api
    provides: GET /api/chat/mentions/search API
  - phase: 36-server-side-foundation
    provides: MentionItem, MentionType (mention-types.ts)
provides:
  - src/components/chat/chat-input.tsx: MentionsInput 기반 ChatInput 컴포넌트 (멘션 자동완성 + 그룹 헤더 + 키보드 탐색 + IME 호환)
  - ChatInputProps.onSend 시그니처: (prompt, mentions: MentionItem[], providerId?) 확장
  - chat-page.tsx handleSend: mentions 파라미터 수용 업데이트
affects:
  - 38-03: Message Rendering (mentionedEntities 데이터 사용)
  - 39: UX Polish

# Tech tracking
tech-stack:
  added: []
  patterns:
    - prevTypeRef 패턴: renderSuggestion 내 그룹 헤더 주입 (ref로 이전 타입 추적)
    - suggestionsPlacement="above": 채팅창 하단 위치로 드롭다운을 위로 표시
    - MentionsInputChangeEvent 패턴: value(마크업) + plainTextValue + mentions 동시 처리

key-files:
  created: []
  modified:
    - src/components/chat/chat-input.tsx
    - src/components/chat/chat-page.tsx
    - src/app/globals.css

key-decisions:
  - "prevTypeRef 패턴으로 renderSuggestion 내 그룹 헤더 삽입: 배열에 헤더 아이템 추가하는 방식 대신 ref로 타입 전환 감지"
  - "SuggestionDataItem 미export 확인: MentionDataItem<MentionExtra>로 대체 (동일 타입)"
  - "onMentionsChange 이벤트 구조: MentionsInputChangeEvent.value(마크업)와 plainTextValue 모두 활용"
  - "@source 지시문으로 react-mentions-ts 스타일 통합: @import 대신 @source로 exports 제약 우회"

patterns-established:
  - "MentionsInput 통합 패턴: onMentionsChange로 markup + mentions 동시 추적, submit 시 regex로 plain text 추출"
  - "@source 지시문 패턴: CSS exports 미정의 패키지의 Tailwind 스캔을 @source로 대체"

requirements-completed: [MENT-01, MENT-02, MENT-05, UI-01]

# Metrics
duration: 7min
completed: 2026-02-19
---

# Phase 38 Plan 02: ChatInput MentionsInput 통합 Summary

**Textarea를 react-mentions-ts MentionsInput으로 교체하여 @멘션 자동완성(그룹 헤더, 키보드 탐색, IME 호환, 공백 자동 삽입) + onSend mentions[] 전달 완전 구현**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-19T02:49:26Z
- **Completed:** 2026-02-19T02:56:46Z
- **Tasks:** 1
- **Files modified:** 3 (chat-input.tsx, chat-page.tsx, globals.css)

## Accomplishments
- ChatInput.tsx: Textarea 완전 제거, MentionsInput으로 교체 — @멘션 자동완성 드롭다운 동작
- 학생/선생님/학급 그룹 헤더 렌더링 (prevTypeRef 패턴으로 타입 전환 감지)
- onSend 시그니처 확장: `(prompt, mentions: MentionItem[], providerId?)` — 서버 멘션 처리 연동 준비
- chat-page.tsx handleSend 시그니처 업데이트 (하위 호환: mentions 기본값 `[]`)
- globals.css: `@import` → `@source` 변경으로 빌드 차단 문제 해결

## Task Commits

각 Task가 원자적으로 커밋됨:

1. **Task 1: ChatInput MentionsInput 통합 + renderSuggestion 그룹 헤더 + onSend 시그니처 확장** - `6c892bb` (feat)

## Files Created/Modified
- `src/components/chat/chat-input.tsx` - Textarea → MentionsInput 교체, 그룹 헤더 renderSuggestion, onSend mentions[] 지원
- `src/components/chat/chat-page.tsx` - handleSend 시그니처 업데이트 (MentionItem 파라미터 추가)
- `src/app/globals.css` - @import react-mentions-ts/styles/tailwind.css → @source ../node_modules/react-mentions-ts/dist

## Decisions Made
- `SuggestionDataItem` 타입이 react-mentions-ts exports에 없음 → `MentionDataItem<MentionExtra>`로 대체 (실제로 동일 타입)
- prevTypeRef 패턴: renderSuggestion이 호출될 때마다 이전 타입과 비교하여 그룹 헤더 자동 주입
- handleSuggestionClick/initialQuery 직접 호출은 mentions 기본값 `[]`로 하위 호환 처리

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] globals.css @import 제약 해결**
- **Found during:** Task 1 검증 (pnpm build)
- **Issue:** `react-mentions-ts/styles/tailwind.css`가 패키지 exports 필드에 미등록 → "not exported under the condition 'style'" 빌드 에러
- **Fix:** `@import "react-mentions-ts/styles/tailwind.css"` → `@source "../node_modules/react-mentions-ts/dist"` 변경. CSS 파일 내용(`@source "../dist"`)과 동일한 효과를 직접 표현
- **Files modified:** src/app/globals.css
- **Verification:** pnpm build 성공 (warnings only, no errors)
- **Committed in:** 6c892bb (Task 1 커밋에 포함)

**2. [Rule 1 - Bug] chat-page.tsx onSend 타입 불일치 수정**
- **Found during:** Task 1 구현 (ChatInputProps.onSend 시그니처 변경 시)
- **Issue:** ChatInput의 onSend 시그니처를 `(prompt, mentions, providerId?)` 로 변경하면 chat-page.tsx handleSend와 타입 불일치 발생
- **Fix:** chat-page.tsx handleSend에 `mentions: MentionItem[] = []` 파라미터 추가, MentionItem 타입 import
- **Files modified:** src/components/chat/chat-page.tsx
- **Verification:** pnpm tsc --noEmit 통과
- **Committed in:** 6c892bb (Task 1 커밋에 포함)

---

**Total deviations:** 2 auto-fixed (1 Rule 3 blocking, 1 Rule 1 bug)
**Impact on plan:** 두 수정 모두 빌드 성공과 타입 안전성을 위한 필수 수정. 기능 범위 변화 없음.

## Issues Encountered

- react-mentions-ts 패키지 package.json exports 필드에 `./styles/tailwind.css` 미등록 (패키지 버그). Tailwind v4 `@source` 지시문으로 직접 대체 해결.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- ChatInput이 MentionsInput 기반으로 완전히 교체됨. @멘션 드롭다운 기능 동작 준비 완료
- onSend(prompt, mentions, providerId) 시그니처로 서버에 mentions[] 전달 가능
- Phase 39 (Message Rendering & UX Polish)에서 멘션 표시/하이라이트 구현 가능
- 한국어 IME 호환은 react-mentions-ts 내장 (_isComposing) — 추가 작업 불필요

---
*Phase: 38-autocomplete-ui-chatinput-integration*
*Completed: 2026-02-19*

## Superpowers 호출 기록

| # | 스킬명 | 호출 시점 | 결과 요약 |
|---|--------|----------|----------|
| 1 | superpowers:brainstorming | Task 1 실행 전 | API 타입 정의 확인 (MentionDataItem 제네릭, SuggestionDataItem 미export, MentionsInputChangeEvent 구조) |
| 2 | superpowers:test-driven-development | Task 1 시작 시 | react-mentions-ts 타입 d.ts 직접 검토로 정확한 시그니처 확인 |
| 3 | superpowers:requesting-code-review | Task 1 완료 후 | 이슈 0개 — 타입 캐스팅, prevTypeRef ref 변경 패턴, @source 치환 검증 완료 |

### 미호출 스킬 사유
| 스킬명 | 미호출 사유 |
|--------|-----------|
| superpowers:systematic-debugging | TypeScript 첫 시도 통과, 빌드 에러는 CSS exports 제약으로 즉시 원인 파악 후 해결 |

## Self-Check: PASSED

| Item | Status |
|------|--------|
| src/components/chat/chat-input.tsx | FOUND |
| src/components/chat/chat-page.tsx | FOUND |
| src/app/globals.css | FOUND |
| 38-02-SUMMARY.md | FOUND |
| commit 6c892bb | FOUND |
| MentionsInput import | FOUND |
| suggestionsPlacement="above" | FOUND |
| mentions: MentionItem[] param | FOUND |
| appendSpaceOnAdd | FOUND |
| trigger="@" | FOUND |
