---
phase: 40-llmquerybar-extension
plan: 01
subsystem: ui
tags: [react-mentions-ts, MentionsInput, LLMQueryBar, chat, url-serialization, mentions]

# Dependency graph
requires:
  - phase: 38-autocomplete-ui-chatinput-integration
    provides: react-mentions-ts, useMention, occurrencesToMentionItems, MentionExtra 패턴
  - phase: 36-server-side-foundation
    provides: MentionItem 타입, Phase 36 서버 파이프라인 handleSend
provides:
  - LLMQueryBar에 MentionsInput 통합 (대시보드 전역 @멘션 자동완성)
  - mentions URL 파라미터 직렬화/파싱 패턴
  - chat/page.tsx에서 initialMentions 파싱 → ChatPage 전달
  - ChatPage initialMentions prop → handleSend 연결
affects: [chat-pipeline, dashboard-layout]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "QueryBar URL 직렬화 패턴: URLSearchParams + JSON.stringify(MentionItem[]) → /chat?q=...&mentions=..."
    - "mentions 안전 파싱: JSON.parse + Array.isArray + 타입 가드 (type, id 필드 존재 확인)"
    - "suggestionsPlacement='below': 화면 상단 컴포넌트는 below로 드롭다운 방향 고정"

key-files:
  created: []
  modified:
    - src/components/layout/llm-query-bar.tsx
    - src/app/[locale]/(dashboard)/chat/page.tsx
    - src/components/chat/chat-page.tsx

key-decisions:
  - "suggestionsPlacement='below' (not 'auto'): LLMQueryBar는 화면 상단에 위치하므로 항상 아래쪽 드롭다운"
  - "autoResize 미사용: QueryBar는 단일 행 38px UI 유지 (chat-input.tsx와 달리)"
  - "mentions URL 직렬화 방식: URLSearchParams + JSON.stringify → 파싱 실패 시 조용히 무시 (하위 호환)"
  - "initialMentions를 useEffect 의존성에 추가하지 않음: 기존 빈 배열 + eslint-disable 패턴 유지"

patterns-established:
  - "QueryBar submit 패턴: plain text 추출 → occurrencesToMentionItems → URLSearchParams 구성 → router.push"
  - "URL mentions 파싱 패턴: JSON.parse + 타입 가드 → 실패 시 undefined (멘션 없이 처리)"

requirements-completed: [UI-04]

# Metrics
duration: 2min
completed: 2026-02-19
---

# Phase 40 Plan 01: LLMQueryBar Extension Summary

**대시보드 전역 LLMQueryBar에 MentionsInput을 통합하여 @멘션 자동완성 후 mentions를 URL 파라미터로 직렬화, chat/page.tsx에서 파싱하여 Phase 36 서버 파이프라인으로 전달하는 엔드투엔드 흐름 완성**

## Performance

- **Duration:** 2min
- **Started:** 2026-02-19T04:36:17Z
- **Completed:** 2026-02-19T04:38:37Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- LLMQueryBar의 `<input type="text">`를 `<MentionsInput>`으로 교체 — 대시보드 어디서든 @멘션 자동완성 가능
- submit 시 `occurrencesToMentionItems` + `URLSearchParams` + `JSON.stringify`로 mentions URL 직렬화
- chat/page.tsx에서 mentions 파라미터 안전 파싱 (타입 가드 + JSON.parse 실패 무시)
- ChatPage `initialMentions` prop 추가 → `handleSend(query, initialMentions ?? [], undefined)` 연결

## Task Commits

각 Task는 원자적으로 커밋됨:

1. **Task 1: LLMQueryBar에 MentionsInput 통합 + submit 로직 확장** - `5aac923` (feat)
2. **Task 2: ChatPage에서 URL mentions 파라미터 수신 + handleSend 연결** - `cb8cb84` (feat)

## Files Created/Modified
- `src/components/layout/llm-query-bar.tsx` — MentionsInput 통합, mentions URL 직렬화, suggestionsPlacement='below', 단일 행 38px 유지
- `src/app/[locale]/(dashboard)/chat/page.tsx` — mentions?: string searchParams 추가, JSON.parse + 타입 가드 파싱, initialMentions prop 전달
- `src/components/chat/chat-page.tsx` — ChatPageProps에 initialMentions?: MentionItem[] 추가, handleSend에 initialMentions ?? [] 전달

## Decisions Made
- `suggestionsPlacement="below"` 고정: LLMQueryBar는 화면 최상단에 위치하므로 드롭다운이 항상 아래쪽으로 나타나야 함 (chat-input.tsx의 "auto"와 다름)
- `autoResize` 미사용: QueryBar는 단일 행 38px UI가 핵심 제약 — 높이 팽창 방지
- mentions URL 파싱 실패 시 조용히 무시: 잘못된 URL 직접 접근에도 일반 질문으로 처리 (하위 호환)
- `prevTypeRef`를 컴포넌트 내부 선언: 모듈 레벨 공유 금지 (chat-input.tsx 패턴 동일)

## Deviations from Plan

없음 — 계획대로 정확하게 실행됨.

## Issues Encountered

없음 — TypeScript 컴파일 에러 없이 첫 시도에 완료.

## User Setup Required

없음 — 외부 서비스 설정 불필요.

## Next Phase Readiness
- Phase 40 Plan 01 완료: LLMQueryBar Extension 구현 완성
- Phase 36 서버 파이프라인이 멘션 컨텍스트를 처리하는 전체 흐름 완성
- 브라우저에서 대시보드 @멘션 → 채팅 페이지 이동 → AI 응답 흐름 검증 가능

---
*Phase: 40-llmquerybar-extension*
*Completed: 2026-02-19*

## Self-Check: PASSED

- FOUND: src/components/layout/llm-query-bar.tsx
- FOUND: src/app/[locale]/(dashboard)/chat/page.tsx
- FOUND: src/components/chat/chat-page.tsx
- FOUND: .planning/phases/40-llmquerybar-extension/40-01-SUMMARY.md
- FOUND: commit 5aac923 (Task 1)
- FOUND: commit cb8cb84 (Task 2)

## Superpowers 호출 기록

| # | 스킬명 | 호출 시점 | 결과 요약 |
|---|--------|----------|----------|
| 1 | superpowers:brainstorming | Task 1 실행 전 | suggestionsPlacement='below', autoResize 미사용, prevTypeRef 컴포넌트 내부 선언 등 4개 고려사항 명확화 |

### 미호출 스킬 사유
| 스킬명 | 미호출 사유 |
|--------|-----------|
| superpowers:test-driven-development | 플랜에 tdd="true" 없음, UI 통합 태스크로 TDD 불적용 |
| superpowers:systematic-debugging | 버그/에러 미발생, 첫 시도에 TypeScript 컴파일 통과 |
| superpowers:requesting-code-review | 2개 태스크 완료, 변경 파일 3개, 소규모 통합 작업으로 생략 |
