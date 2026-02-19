---
phase: 38-autocomplete-ui-chatinput-integration
plan: 01
subsystem: ui
tags: [react-mentions-ts, tailwindcss, autocomplete, mention, hooks]

# Dependency graph
requires:
  - phase: 37-autocomplete-search-api
    provides: GET /api/chat/mentions/search API + MentionSearchResponse 타입
  - phase: 36-server-side-foundation
    provides: mention-types.ts (MentionItem, MentionType, MentionSearchResponse)
provides:
  - react-mentions-ts@5.4.7 설치됨
  - globals.css에 react-mentions-ts Tailwind v4 스타일 통합됨
  - src/hooks/use-mention.ts: useMention 훅 (fetchMentions 함수 반환)
  - src/hooks/use-mention.ts: occurrencesToMentionItems 유틸리티 함수
  - src/hooks/use-mention.ts: MentionExtra 타입 export
affects:
  - 38-02: MentionsInput + 커스텀 드롭다운 UI 통합
  - 38-03: ChatInput에 MentionsInput 교체

# Tech tracking
tech-stack:
  added:
    - react-mentions-ts@5.4.7 (자동완성 textarea 라이브러리)
  patterns:
    - 200ms 디바운스 + AbortController 패턴: useRef로 stale 쿼리 감지 + 이전 요청 취소
    - DataSource 함수 패턴: react-mentions-ts의 이중 필터링 방지를 위해 배열이 아닌 함수 형태로 data 전달
    - flat 변환 패턴: type-prefixed ID (`student:abc123`) → { type, id } 파싱

key-files:
  created:
    - src/hooks/use-mention.ts
  modified:
    - package.json (react-mentions-ts@5.4.7 추가)
    - src/app/globals.css (@import react-mentions-ts/styles/tailwind.css 추가)

key-decisions:
  - "useMention: data prop에 함수 형태로 전달하여 react-mentions-ts 이중 필터링 방지"
  - "200ms 디바운스는 setTimeout + stale 쿼리 ref 패턴으로 구현 (useDebounce 라이브러리 불사용)"
  - "AbortController를 useRef로 관리하여 이전 요청 race condition 방지"
  - "최소 2자 조건: 서버 API와 동일한 최소 쿼리 길이 적용"

patterns-established:
  - "fetchMentions 패턴: (query: string) => Promise<MentionDataItem<MentionExtra>[]> 함수 시그니처"
  - "occurrencesToMentionItems 패턴: type:id 형식 ID 파싱 + 중복 제거"

requirements-completed: [MENT-01, MENT-05]

# Metrics
duration: 3min
completed: 2026-02-19
---

# Phase 38 Plan 01: react-mentions-ts 설치 + useMention 훅 구현 Summary

**react-mentions-ts@5.4.7 설치 및 Tailwind v4 스타일 통합, 200ms 디바운스 + AbortController useMention 훅 구현으로 Phase 38 자동완성 UI 기반 마련**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-19T02:43:49Z
- **Completed:** 2026-02-19T02:46:45Z
- **Tasks:** 2
- **Files modified:** 3 (package.json, globals.css, use-mention.ts)

## Accomplishments
- react-mentions-ts@5.4.7 설치 완료 (peer deps cva, clsx, tailwind-merge 기존 설치 확인)
- globals.css에 `@import "react-mentions-ts/styles/tailwind.css"` 추가로 Tailwind v4 스타일 통합
- useMention 훅 구현: 200ms 디바운스 + AbortController + stale 쿼리 감지 + 최소 2자 조건
- occurrencesToMentionItems 유틸리티: 중복 제거 + `type:id` → `{ type, id }` 파싱

## Task Commits

각 Task가 원자적으로 커밋됨:

1. **Task 1: react-mentions-ts 설치 + Tailwind v4 @import 추가** - `fe96625` (feat)
2. **Task 2: useMention 훅 구현** - `4419b90` (feat)

## Files Created/Modified
- `package.json` - react-mentions-ts@5.4.7 의존성 추가
- `src/app/globals.css` - @import "react-mentions-ts/styles/tailwind.css" 추가
- `src/hooks/use-mention.ts` - MentionExtra 타입, useMention 훅, occurrencesToMentionItems 함수 신규 생성

## Decisions Made
- `data` prop을 함수 형태로 전달: react-mentions-ts의 `getSubstringIndex` 이중 필터링 방지 (리서치 기반 결정)
- 200ms 디바운스를 `useDebounce` 라이브러리 없이 순수 `setTimeout + useRef` 패턴으로 구현하여 의존성 최소화
- AbortController를 `useRef`로 관리하여 컴포넌트 리렌더링에도 이전 요청 참조 유지

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- `pnpm-lock.yaml`이 `.gitignore`에 포함되어 커밋 대상에서 제외됨 (자동 감지, 해당 파일 제외 후 정상 커밋)

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- react-mentions-ts@5.4.7 설치 완료, Phase 38-02에서 MentionsInput + 커스텀 드롭다운 UI 통합 가능
- useMention 훅의 fetchMentions 함수를 `<Mention data={fetchMentions}>` prop에 직접 전달 가능
- occurrencesToMentionItems를 submit 핸들러에서 바로 사용 가능

---
*Phase: 38-autocomplete-ui-chatinput-integration*
*Completed: 2026-02-19*

## Superpowers 호출 기록

| # | 스킬명 | 호출 시점 | 결과 요약 |
|---|--------|----------|----------|
| 1 | superpowers:brainstorming | Task 1 실행 전 | 요구사항 3개 명확화 (MentionDataItem 제네릭 타입, styles 파일 존재, MentionSearchResponse 타입 확인) |
| 2 | superpowers:test-driven-development | Task 2 시작 시 | 구현 전 react-mentions-ts 타입 정의 검토 (MentionDataItem, MentionOccurrence, DataSource) |
| 3 | superpowers:requesting-code-review | 모든 Task 완료 후 | 이슈 0개, approved (MentionExtra 제약 검증, useCallback 의존성 확인) |

### 미호출 스킬 사유
| 스킬명 | 미호출 사유 |
|--------|-----------|
| superpowers:systematic-debugging | 버그 미발생, TypeScript 컴파일 첫 시도에 성공 |
