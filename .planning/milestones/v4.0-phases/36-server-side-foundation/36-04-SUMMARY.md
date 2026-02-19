---
phase: 36-server-side-foundation
plan: 04
subsystem: api
tags: [typescript, next.js, chat, mention, rbac, system-prompt, streaming]

# Dependency graph
requires:
  - phase: 36-02
    provides: "resolveMentions 함수 (RBAC 포함 엔티티 조회)"
  - phase: 36-03
    provides: "buildMentionContext 함수 (XML 경계 마킹 + 토큰 예산 관리)"
provides:
  - POST /api/chat — mentions 배열 수신 → 동적 system prompt 구성 → mentionedEntities 저장
  - X-Mention-Warnings 응답 헤더 (RBAC 실패 알림)
  - 하위 호환: mentions 없는 기존 요청은 이전과 동일하게 동작
affects:
  - Phase 38 (ChatInput에서 mentions 배열을 POST body에 포함하여 전송)
  - Phase 39 (ChatMessage.mentionedEntities 데이터를 메시지 렌더링에 활용 가능)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "동적 system prompt: 멘션 유무에 따라 SYSTEM_PROMPT 또는 SYSTEM_PROMPT + mentionContext 선택"
    - "Prisma InputJsonValue 캐스팅: MentionedEntity[] → Prisma.InputJsonValue 타입 변환"
    - "응답 헤더 RBAC 알림: X-Mention-Warnings 헤더로 클라이언트에 접근 거부 메시지 전달"

key-files:
  created: []
  modified:
    - src/app/api/chat/route.ts

key-decisions:
  - "mentions가 없으면 dynamicSystem = SYSTEM_PROMPT: 하위 호환 보장 — 기존 채팅 동작 그대로 유지"
  - "mentionedEntities undefined 시 Prisma 필드 생략: undefined 전달로 기존 메시지에 mentionedEntities 컬럼 없이 저장"
  - "멘션 처리 위치: 세션 처리 이후 + user 메시지 DB 저장 이전 — mentionedEntitiesData가 저장 시점에 필요"

requirements-completed: [MENT-03, CTX-05]

# Metrics
duration: 3min
completed: 2026-02-18
---

# Phase 36 Plan 04: 멘션 통합 Chat API Route Summary

**resolveMentions + buildMentionContext를 /api/chat/route.ts에 통합하여 @멘션 포함 메시지를 동적 system prompt로 처리하고 mentionedEntities를 ChatMessage에 저장 — Phase 36 서버사이드 완성**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-18T16:04:35Z
- **Completed:** 2026-02-18T16:08:15Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- `src/app/api/chat/route.ts` 수정 — mentions 배열 수신 + 멘션 처리 로직 통합
- 멘션 유무에 따른 동적 system prompt: `SYSTEM_PROMPT` 또는 `SYSTEM_PROMPT + mentionContext`
- user ChatMessage.mentionedEntities에 MentionedEntity[] JSON 저장 (Prisma.InputJsonValue 캐스팅)
- RBAC 실패 시 `X-Mention-Warnings` 응답 헤더로 클라이언트에 접근 거부 알림 전달
- 하위 호환 보장: mentions 없는 기존 요청은 SYSTEM_PROMPT 그대로 사용 — 동작 변경 없음
- TypeScript 타입 에러 0개, `pnpm build` 성공

## Task Commits

Each task was committed atomically:

1. **Task 1: /api/chat/route.ts에 멘션 시스템 통합** - `a13c4d3` (feat)

**Plan metadata:** (docs commit to follow)

## Files Created/Modified
- `src/app/api/chat/route.ts` — resolveMentions/buildMentionContext 통합, mentions 배열 처리, mentionedEntities 저장, X-Mention-Warnings 헤더

## Decisions Made
- **하위 호환 우선**: `dynamicSystem = SYSTEM_PROMPT` 기본값으로 설정 → mentions 없는 기존 요청 완전 호환
- **삽입 위치 결정**: 세션 처리 이후 + user DB 저장 이전 — chatSessionId 확정 이후이고 mentionedEntitiesData가 저장 시 필요하므로 정확한 위치
- **Prisma undefined 패턴**: `mentionedEntitiesData`가 없으면 `undefined` 전달 → Prisma가 필드를 생략하여 기존 메시지 스키마 호환

## Deviations from Plan

None — 계획대로 정확히 실행됨.

## Issues Encountered
None

## User Setup Required
None — 새 파일 없음, 스키마 변경 없음 (mentionedEntities 컬럼은 36-01에서 이미 마이그레이션 완료).

## Phase 36 완성 현황

Phase 36 Server-side Foundation 4개 Plan 모두 완료:
- **36-01**: mention-types.ts (공유 타입 정의) + Prisma 스키마 마이그레이션
- **36-02**: mention-resolver.ts (RBAC 포함 엔티티 배치 조회)
- **36-03**: context-builder.ts (XML 경계 마킹 + 토큰 예산 관리)
- **36-04**: route.ts 통합 (서버사이드 완성) ← 이번 Plan

## Next Phase Readiness
- Phase 37 (Autocomplete Search API) 즉시 시작 가능
- Phase 38 (ChatInput 통합): `mentions: MentionItem[]` 배열을 POST body에 포함하면 멘션 처리 자동 작동
- 클라이언트 측 `X-Mention-Warnings` 헤더 파싱 로직은 Phase 38에서 구현

---
*Phase: 36-server-side-foundation*
*Completed: 2026-02-18*

## Self-Check: PASSED

- `src/app/api/chat/route.ts` — FOUND
- commit `a13c4d3` — FOUND

## Superpowers 호출 기록

| # | 스킬명 | 호출 시점 | 결과 요약 |
|---|--------|----------|----------|
| 1 | superpowers:brainstorming | Task 1 실행 전 | 삽입 위치(세션 이후+DB 저장 이전), 하위 호환 전략, 헤더 패턴 검토 |
| 4 | superpowers:requesting-code-review | 모든 Task 완료 후 | imports/타입/순서/Prisma 캐스팅/헤더 검토 — 이슈 0개 approved |

### 미호출 스킬 사유
| 스킬명 | 미호출 사유 |
|--------|-----------|
| superpowers:test-driven-development | 기존 route.ts 수정 — 통합 테스트는 Phase 37+ E2E에서 처리 |
| superpowers:systematic-debugging | 버그 미발생 (TypeScript 에러 0, 빌드 성공) |
