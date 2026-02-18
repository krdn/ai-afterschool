---
phase: 36-server-side-foundation
plan: 02
subsystem: api
tags: [typescript, prisma, postgresql, chat, mention, rbac, audit-log]

# Dependency graph
requires:
  - phase: 36-01
    provides: MentionItem, ResolvedMention, MentionedEntity, MentionResolutionResult 타입
affects:
  - 36-03 (context-builder에서 ResolvedMention.contextData 사용)
  - 36-04 (chat route에서 resolveMentions 호출)

provides:
  - resolveMentions(mentions, session) 함수 — RBAC 포함 엔티티 DB 조회 및 요약 텍스트 반환
  - 학생/선생님/팀 3타입 배치 조회 로직 (N+1 방지)
  - RBAC 실패 시 logAuditAction(MENTION_ACCESS_DENIED) + 알림 메시지 생성 패턴
  - 한국어 구조화 요약 텍스트 빌더 (사주/MBTI/성명학/관상/손금/VARK/별자리/AI종합/최근상담)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "배치 조회 + Promise.all 병렬 패턴: 멘션 타입별 분류 후 병렬 DB 조회로 N+1 방지"
    - "RBAC 레이어: createTeamFilteredPrisma 대신 직접 teamId 비교로 배치 조회 후 필터링"
    - "감사 로그 패턴: logAuditAction(MENTION_ACCESS_DENIED)로 RBAC 실패 추적"

key-files:
  created:
    - src/lib/chat/mention-resolver.ts
  modified: []

key-decisions:
  - "배치 조회 후 RBAC 필터링: createTeamFilteredPrisma Prisma Extension 대신 직접 teamId 비교 선택 — 배치 조회 결과를 Application 레이어에서 필터링하는 것이 더 명확하고 유연함"
  - "logAuditAction try-catch: 감사 로그 실패가 주 흐름을 방해하지 않도록 별도 예외 처리 적용"
  - "원본 순서 보장: resolvedMap으로 배치 조회 후 원본 mentions 순서대로 재정렬하여 반환"

patterns-established:
  - "handleAccessDenied 헬퍼: RBAC 실패 처리 로직 캡슐화 (감사 로그 + ResolvedMention + MentionedEntity + 알림 메시지 일괄 생성)"
  - "분석 데이터 인덱스 맵: findMany 배치 결과를 Map으로 인덱싱하여 O(1) 조회"

requirements-completed: [MENT-04, CTX-02]

# Metrics
duration: 2min
completed: 2026-02-19
---

# Phase 36 Plan 02: RBAC 포함 멘션 Resolver Summary

**RBAC 기반 엔티티 배치 조회 + 한국어 구조화 요약 텍스트 생성 함수(resolveMentions)를 Promise.all 병렬 패턴과 감사 로그 추적으로 구현**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-18T15:58:43Z
- **Completed:** 2026-02-18T16:00:59Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- `src/lib/chat/mention-resolver.ts` 신설 — `resolveMentions(mentions, session)` 함수로 학생/선생님/팀 3타입 RBAC 조회 구현
- `Promise.all` 병렬 배치 조회로 N+1 문제 방지 (분석 데이터 9개 테이블 동시 조회)
- RBAC 실패 시 `logAuditAction(MENTION_ACCESS_DENIED)` + 알림 메시지 자동 생성 — 감사 추적 완비
- 한국어 구조화 요약 텍스트: 사주/MBTI/성명학/관상/손금/VARK/별자리/AI종합/최근상담 (최대 100자 축약)

## Task Commits

Each task was committed atomically:

1. **Task 1: mention-resolver.ts 구현** - `b3e9e99` (feat)

**Plan metadata:** (docs commit to follow)

## Files Created/Modified
- `src/lib/chat/mention-resolver.ts` - resolveMentions 함수 (700줄) — RBAC 포함 학생/선생님/팀 엔티티 DB 조회 및 한국어 요약 텍스트 생성

## Decisions Made
- **배치 조회 후 RBAC 필터링 선택**: `createTeamFilteredPrisma` Prisma Extension 대신 Application 레이어에서 직접 teamId 비교. 배치 조회 결과를 for 루프에서 필터링하는 것이 더 명확하고 테스트하기 쉬움
- **logAuditAction try-catch 감싸기**: 감사 로그 실패가 멘션 해결 주 흐름을 방해하지 않도록 별도 예외 처리
- **원본 mentions 순서 보장**: 배치 조회 후 resolvedMap으로 원본 순서대로 재정렬하여 일관된 결과 반환

## Deviations from Plan

None - 계획대로 정확히 실행됨.

## Issues Encountered
None

## User Setup Required
None - DB 스키마 변경 없음.

## Next Phase Readiness
- Plan 36-03 (context-builder) 즉시 시작 가능: `resolveMentions` 반환 `ResolvedMention.contextData` 사용 준비 완료
- Plan 36-04 (chat route): `resolveMentions` 호출 준비 완료

---
*Phase: 36-server-side-foundation*
*Completed: 2026-02-19*

## Self-Check: PASSED

- `src/lib/chat/mention-resolver.ts` — FOUND
- commit `b3e9e99` — FOUND

## Superpowers 호출 기록

| # | 스킬명 | 호출 시점 | 결과 요약 |
|---|--------|----------|----------|
| 1 | superpowers:brainstorming | Task 1 실행 전 | logAuditAction HTTP 컨텍스트 제약 확인, 배치 조회 + RBAC 필터링 전략 수립 |
| 2 | superpowers:requesting-code-review | Task 1 완료 후 | RBAC/N+1/에러처리/타입 안전성 검토 — 이슈 0개 approved |

### 미호출 스킬 사유
| 스킬명 | 미호출 사유 |
|--------|-----------|
| superpowers:test-driven-development | 1개 Task로만 구성된 서버 함수 — DB 통합 테스트는 별도 Phase에서 처리 |
| superpowers:systematic-debugging | 버그 미발생 (TypeScript 컴파일 에러 없음) |
