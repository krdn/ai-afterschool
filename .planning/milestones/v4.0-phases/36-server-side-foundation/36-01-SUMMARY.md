---
phase: 36-server-side-foundation
plan: 01
subsystem: database
tags: [typescript, prisma, postgresql, chat, mention, gin-index, jsonb]

# Dependency graph
requires: []
provides:
  - MentionType 리터럴 유니온 타입 (student | teacher | team)
  - MentionItem 클라이언트 전송 튜플 타입
  - MentionedEntity DB JSON 저장 메타데이터 타입
  - ResolvedMention mention-resolver 반환 타입
  - MentionResolutionResult 전체 해결 결과 타입
  - ChatMessage.mentionedEntities Json? 컬럼
  - GIN 인덱스 (idx_chat_messages_mentioned_entities)
affects:
  - 36-02 (mention-resolver에서 MentionResolutionResult 사용)
  - 36-03 (context-builder에서 ResolvedMention.contextData 사용)
  - 36-04 (chat route에서 MentionItem 파싱 + mentionedEntities 저장)
  - Phase 37 (autocomplete API에서 MentionType 사용)
  - Phase 38 (UI에서 MentionItem 전송)
  - Phase 39 (UI 렌더링에서 MentionedEntity 사용)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "멘션 타입 중앙화: 클라이언트/서버 공유 타입을 src/lib/chat/mention-types.ts에서 단일 정의"
    - "JSONB + GIN 인덱스: 구조화된 메타데이터 컬럼에 jsonb_path_ops GIN 인덱스로 엔티티 필터링 지원"

key-files:
  created:
    - src/lib/chat/mention-types.ts
    - prisma/migrations/20260218155423_add_mentioned_entities/migration.sql
  modified:
    - prisma/schema.prisma

key-decisions:
  - "MentionedEntity.accessDenied 선택적 필드: RBAC 실패 멘션도 메타데이터로 저장 가능하도록 optional 처리"
  - "GIN 인덱스 jsonb_path_ops: containment 연산자(@>)에 최적화, 향후 엔티티별 채팅 필터링 지원"
  - "src/lib/chat/ 디렉토리 신설: 채팅 시스템 공유 코드 격리"

patterns-established:
  - "MentionItem 최소 정보 원칙: 클라이언트는 {type, id}만 전송, 서버에서 RBAC 포함 데이터 조회"
  - "accessDenied 추적 패턴: RBAC 실패 멘션을 MentionedEntity로 기록하여 감사 로그 지원"

requirements-completed: [MENT-03, CTX-05]

# Metrics
duration: 2min
completed: 2026-02-19
---

# Phase 36 Plan 01: 멘션 시스템 기반 타입 및 DB 스키마 Summary

**5개 멘션 공유 타입(TypeScript)과 ChatMessage.mentionedEntities JSONB 컬럼 + GIN 인덱스로 Phase 36~40 멘션 시스템 기반 구축**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-18T15:53:23Z
- **Completed:** 2026-02-18T15:55:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- `src/lib/chat/mention-types.ts` 신설 — 5개 공유 타입으로 Phase 36~40 전역 멘션 타입 체계 확립
- `ChatMessage.mentionedEntities Json?` 컬럼 추가 — 멘션 메타데이터 DB 저장 기반
- GIN 인덱스(`jsonb_path_ops`) 생성 — `WHERE "mentionedEntities" @> '[{"id": "xxx"}]'` 엔티티별 필터링 지원

## Task Commits

Each task was committed atomically:

1. **Task 1: 멘션 시스템 공유 타입 정의** - `7d7326a` (feat)
2. **Task 2: Prisma 스키마 변경 및 마이그레이션** - `ace2fd7` (feat)

**Plan metadata:** (docs commit to follow)

## Files Created/Modified
- `src/lib/chat/mention-types.ts` - MentionType, MentionItem, MentionedEntity, ResolvedMention, MentionResolutionResult 5개 타입 정의
- `prisma/schema.prisma` - ChatMessage.mentionedEntities Json? 컬럼 추가
- `prisma/migrations/20260218155423_add_mentioned_entities/migration.sql` - JSONB 컬럼 추가 + GIN 인덱스 생성 SQL

## Decisions Made
- `MentionedEntity.accessDenied` 를 선택적 필드로 처리: RBAC 실패 멘션도 메타데이터 저장 가능하도록 유연성 확보
- GIN 인덱스 `jsonb_path_ops` 선택: 전체 문서 대신 containment 연산자에 최적화된 연산자 클래스 사용
- `src/lib/chat/` 디렉토리 신설: 채팅 관련 공유 코드를 독립적으로 관리

## Deviations from Plan

None - 계획대로 정확히 실행됨.

단, `psql` CLI가 로컬에 없어 GIN 인덱스를 Docker 컨테이너(`ai-afterschool-postgres`)를 통해 직접 적용함.
마이그레이션 파일에는 GIN 인덱스 SQL이 포함되어 향후 마이그레이션 재현 시에도 자동 적용됨.

## Issues Encountered
- `psql` CLI가 로컬 환경에 없어 `docker exec ai-afterschool-postgres psql ...` 로 GIN 인덱스 직접 적용 — 정상 해결

## User Setup Required
None - 로컬 DB에 마이그레이션 적용 완료.

## Next Phase Readiness
- Plan 36-02 (mention-resolver) 즉시 시작 가능: `MentionResolutionResult`, `ResolvedMention`, `MentionedEntity` 타입 사용 준비 완료
- Plan 36-03 (context-builder): `ResolvedMention.contextData` 타입 사용 준비 완료
- Plan 36-04 (chat route): `MentionItem` 파싱 + `mentionedEntities` 저장 준비 완료

---
*Phase: 36-server-side-foundation*
*Completed: 2026-02-19*

## Superpowers 호출 기록

| # | 스킬명 | 호출 시점 | 결과 요약 |
|---|--------|----------|----------|
| 1 | superpowers:brainstorming | Task 1 실행 전 | src/lib/chat 디렉토리 신설 필요성 확인, 5개 타입 구조 검토 |

### 미호출 스킬 사유
| 스킬명 | 미호출 사유 |
|--------|-----------|
| superpowers:test-driven-development | 타입 정의 파일이므로 TDD 불필요 (TypeScript 컴파일러가 검증) |
| superpowers:systematic-debugging | 버그 미발생 |
| superpowers:requesting-code-review | 2개 Task 단순 타입/스키마 작업으로 코드 리뷰 생략 |
