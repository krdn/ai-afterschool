---
phase: 39-message-rendering-ux-polish
plan: 01
subsystem: ui
tags: [react, radix-ui, popover, regex, mention, typescript, nextjs, prisma, rbac]

# Dependency graph
requires:
  - phase: 36-server-side-foundation
    provides: MentionedEntity 타입 (mention-types.ts)
  - phase: 38-autocomplete-ui-chatinput-integration
    provides: mentions[] 파이프라인, 멘션 데이터 저장

provides:
  - parseMentionChips 유틸리티 (plain text + MentionedEntity[] → ContentSegment[])
  - MentionTag 컴포넌트 (Radix Popover 기반 칩 + 프리뷰 카드)
  - GET /api/chat/mentions/preview 엔드포인트 (RBAC 포함)

affects:
  - 39-02-message-rendering (MentionTag + parseMentionChips 통합)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "parseMentionChips: displayName 길이 내림차순 정렬으로 부분 매칭 방지"
    - "MentionTag: accessDenied 칩은 Popover 없이 비활성 스타일만 렌더링"
    - "Preview API: RBAC — team 타입은 id 직접 비교로 간결하게 처리"
    - "지연 로딩 패턴: onOpenChange에서 fetch, !preview && !accessDenied 조건으로 중복 요청 방지"

key-files:
  created:
    - src/lib/chat/parse-mention-chips.ts
    - src/components/chat/mention-tag.tsx
    - src/app/api/chat/mentions/preview/route.ts
  modified: []

key-decisions:
  - "accessDenied 칩은 Popover 자체를 제거하고 비활성 span만 렌더링 (UX 명확성)"
  - "Preview API team RBAC: DIRECTOR가 아니면 id === session.teamId 직접 비교 (OR 조건보다 간결)"
  - "Teacher sublabel: 역할명만 표시 (담당 학생 수 제외) — role 한국어 변환 적용"

patterns-established:
  - "Pattern 1: parseMentionChips — 구형 메시지(null entities) 자동 폴백"
  - "Pattern 2: MentionTag — 칩 클릭 시 지연 로딩 (onOpenChange guard: !preview && !loading)"
  - "Pattern 3: Preview API — 타입별 RBAC + 엔티티별 summary 필드 선택"

requirements-completed: [UI-02, UI-03]

# Metrics
duration: 3min
completed: 2026-02-19
---

# Phase 39 Plan 01: MentionTag 컴포넌트, parseMentionChips 유틸리티, Preview API Summary

**Radix Popover 기반 MentionTag 칩 컴포넌트 + 정규식 파싱 유틸리티 + RBAC 포함 엔티티 프리뷰 API 구축**

## Performance

- **Duration:** 3min
- **Started:** 2026-02-19T03:54:26Z
- **Completed:** 2026-02-19T03:57:12Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- `parseMentionChips`: plain text + MentionedEntity[] → ContentSegment[] 파싱 유틸리티 구현 (displayName 길이 내림차순 정렬으로 부분 매칭 방지, 구형 메시지 null 폴백)
- `MentionTag`: 엔티티 타입별 색상 칩(student/teacher/team) + Radix Popover 프리뷰 카드 — 로딩 스켈레톤 + 프리뷰 카드 + 에러 폴백 지원
- `GET /api/chat/mentions/preview`: student(성격 요약)/teacher(MBTI)/team(학생수·교사수) 타입별 RBAC 포함 엔티티 요약 반환

## Task Commits

1. **Task 1: parseMentionChips 유틸리티 + MentionTag 컴포넌트 생성** - `b9a6335` (feat)
2. **Task 2: Preview API 라우트 생성 (RBAC 포함)** - `b9b2ea3` (feat)

## Files Created/Modified

- `src/lib/chat/parse-mention-chips.ts` - ContentSegment 타입 + parseMentionChips 함수 (구형 메시지 호환, 정규식 기반 파싱)
- `src/components/chat/mention-tag.tsx` - MentionTag "use client" 컴포넌트 (엔티티 타입별 색상, Popover, 지연 로딩, accessDenied 처리)
- `src/app/api/chat/mentions/preview/route.ts` - GET /api/chat/mentions/preview (RBAC, student/teacher/team 타입별 요약 반환)

## Decisions Made

- `accessDenied` 칩은 Popover 자체를 마운트하지 않고 비활성 span만 렌더링 — 접근 불가 엔티티에 클릭 이벤트가 발생하지 않도록 UX 명확화
- Teacher sublabel: 담당 학생 수 조회 추가하면 N+1 문제 발생 가능성이 있어 역할명만 표시 (ROLE_LABELS 매핑)
- Team RBAC: `OR: [{ students: { some: ... } }, { teachers: { some: ... } }]` 대신 `id !== session.teamId` 조기 반환으로 단순화

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 3개 모듈(parseMentionChips, MentionTag, Preview API) 완성 → Phase 39-02에서 ChatMessageItem 통합 준비 완료
- mentionedEntities 데이터 플로우 (getChatSession → ChatPage → ChatMessageItem) 연결 작업은 39-02에서 수행

---
*Phase: 39-message-rendering-ux-polish*
*Completed: 2026-02-19*

## Superpowers 호출 기록

| # | 스킬명 | 호출 시점 | 결과 요약 |
|---|--------|----------|----------|
| 1 | superpowers:brainstorming | Task 1 실행 전 | parseMentionChips/MentionTag/Preview API 구현 전략 확인 — 3개 모듈 독립 구현 접근법 검증 |

### 미호출 스킬 사유

| 스킬명 | 미호출 사유 |
|--------|-----------|
| superpowers:test-driven-development | 계획에 tdd="true" 속성 없음, UI 컴포넌트 단위 — 시각적 검증이 주요 검증 방법 |
| superpowers:systematic-debugging | 버그 미발생, TypeScript 체크 즉시 통과 |
| superpowers:requesting-code-review | 2개 태스크의 코드가 연구 문서 패턴과 정확히 일치하여 review 불필요 |
