---
phase: 36-server-side-foundation
verified: 2026-02-19T10:40:00Z
status: passed
score: 5/5 must-haves verified
re_verification: false
---

# Phase 36: Server-Side Foundation Verification Report

**Phase Goal:** 교사가 @멘션을 포함한 메시지를 전송하면 서버가 RBAC를 적용하여 엔티티 데이터를 조회하고 AI 시스템 프롬프트에 안전하게 주입한다
**Verified:** 2026-02-19T10:40:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | @멘션이 포함된 채팅 메시지 전송 시 서버가 엔티티 ID/타입 목록을 파싱하여 DB에서 데이터를 조회한다 | VERIFIED | `route.ts` L63-68: `body.mentions` 파싱 후 `resolveMentions` 호출. `mention-resolver.ts` 700줄로 학생/선생님/팀 배치 DB 조회 완전 구현 |
| 2 | 조회된 엔티티 데이터가 토큰 예산(~800토큰/엔티티) 내로 요약되어 AI 시스템 프롬프트에 주입된다 | VERIFIED | `context-builder.ts` L9: `TOKEN_BUDGET_PER_ENTITY = 800`, `CHAR_BUDGET_PER_ENTITY = 1200`. `truncateToCharBudget` + `redistributeBudget` 구현. `route.ts` L73: `dynamicSystem = SYSTEM_PROMPT + mentionContext` |
| 3 | 교사는 자신의 팀에 속하지 않은 학생/선생님을 멘션해도 해당 데이터가 조회되지 않는다 (RBAC) | VERIFIED | `mention-resolver.ts` L327: `session.role !== 'DIRECTOR' && student.teamId !== session.teamId` 체크. L480: 선생님, L586: 팀 동일 패턴. DIRECTOR는 전체 접근 가능 |
| 4 | 상담 노트 등 자유 텍스트 필드가 XML 경계 마킹으로 감싸져 Prompt Injection을 방어한다 | VERIFIED | `context-builder.ts` L45-51: `escapeXml` 함수 (`&`, `<`, `>`, `"` 4종 처리). L162-163: `wrapWithXmlBoundary`에서 `escapeXml` 적용 후 `<student_data>` 태그 래핑 |
| 5 | 전송된 메시지의 ChatMessage 레코드에 mentionedEntities JSON 메타데이터가 저장된다 | VERIFIED | `route.ts` L97-106: `db.chatMessage.create` 시 `mentionedEntities: mentionedEntitiesData as Prisma.InputJsonValue`. `prisma/schema.prisma` L858: `mentionedEntities Json?` 컬럼 존재 |

**Score:** 5/5 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/chat/mention-types.ts` | 멘션 공유 타입 5개 export | VERIFIED | 61줄. `MentionType`, `MentionItem`, `MentionedEntity`, `ResolvedMention`, `MentionResolutionResult` 모두 export |
| `src/lib/chat/mention-resolver.ts` | RBAC 포함 엔티티 DB 조회 | VERIFIED | 700줄. `resolveMentions` export. 학생/선생님/팀 3타입 배치 조회, RBAC 필터링, 감사 로그, 한국어 요약 텍스트 생성 |
| `src/lib/chat/context-builder.ts` | XML 경계 마킹 + 토큰 예산 관리 | VERIFIED | 221줄. `buildMentionContext` export. `escapeXml`, `truncateToCharBudget`, `redistributeBudget`, `wrapWithXmlBoundary` 5개 함수 완전 구현 |
| `src/app/api/chat/route.ts` | 멘션 통합 채팅 API | VERIFIED | 201줄. `resolveMentions` + `buildMentionContext` 호출, `mentionedEntities` 저장, `X-Mention-Warnings` 헤더, 하위 호환 |
| `prisma/schema.prisma` | `ChatMessage.mentionedEntities Json?` 컬럼 | VERIFIED | L858: `mentionedEntities Json?` 확인 |
| `prisma/migrations/20260218155423_add_mentioned_entities/migration.sql` | JSONB 컬럼 + GIN 인덱스 | VERIFIED | `ALTER TABLE "chat_messages" ADD COLUMN "mentionedEntities" JSONB` + `CREATE INDEX ... USING GIN ("mentionedEntities" jsonb_path_ops)` |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/app/api/chat/route.ts` | `src/lib/chat/mention-resolver.ts` | `resolveMentions` 호출 | WIRED | L4: import, L64: 실제 호출 확인 |
| `src/app/api/chat/route.ts` | `src/lib/chat/context-builder.ts` | `buildMentionContext` 호출 | WIRED | L5: import, L71: 실제 호출 확인 |
| `src/app/api/chat/route.ts` | `prisma ChatMessage.mentionedEntities` | `db.chatMessage.create` 시 저장 | WIRED | L102-104: `mentionedEntities` 필드 포함 저장 확인 |
| `src/app/api/chat/route.ts` | `streamWithProvider` | `system: dynamicSystem` 전달 | WIRED | L130: `system: dynamicSystem` — 멘션 컨텍스트 포함 system prompt 전달 확인 |
| `src/lib/chat/mention-resolver.ts` | `src/lib/chat/mention-types.ts` | `MentionItem`, `ResolvedMention`, `MentionResolutionResult` 타입 사용 | WIRED | L5-10: import 확인 |
| `src/lib/chat/mention-resolver.ts` | `src/lib/dal.ts` | `logAuditAction` — RBAC 실패 감사 로그 | WIRED | L3: import, L174: `logAuditAction({ action: 'MENTION_ACCESS_DENIED', ... })` 호출 확인 |
| `src/lib/chat/mention-resolver.ts` | `src/lib/db/common/rbac.ts` | `TeacherRole` 타입 + DIRECTOR 역할 비교 | WIRED | L4: `import type { TeacherRole }`, L327/L480/L586: `session.role !== 'DIRECTOR'` RBAC 체크 확인 |
| `src/lib/chat/context-builder.ts` | `src/lib/chat/mention-types.ts` | `ResolvedMention` 타입 사용 | WIRED | L4: import 확인 |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| MENT-03 | 36-01, 36-04 | 시스템이 제출된 메시지에서 @멘션을 파싱하여 엔티티 ID/타입 목록을 추출한다 | SATISFIED | `route.ts`에서 `body.mentions?: MentionItem[]` 수신, `resolveMentions` 호출로 파싱 |
| MENT-04 | 36-02 | 시스템이 멘션된 엔티티의 데이터를 DB에서 RBAC 적용하여 조회한다 | SATISFIED | `mention-resolver.ts` — RBAC 포함 학생/선생님/팀 배치 DB 조회 |
| CTX-01 | 36-03, 36-04 | 멘션된 엔티티 데이터가 AI 시스템 프롬프트에 동적으로 주입된다 | SATISFIED | `route.ts` L73: `dynamicSystem = SYSTEM_PROMPT + mentionContext` → L130: `system: dynamicSystem` |
| CTX-02 | 36-02 | 교사는 자신의 팀에 속한 엔티티만 멘션할 수 있다 (RBAC) | SATISFIED | `mention-resolver.ts` — teamId 비교 + DIRECTOR 예외 처리 |
| CTX-03 | 36-03 | 엔티티 데이터는 토큰 예산 내로 요약되어 주입된다 (~800토큰/엔티티) | SATISFIED | `context-builder.ts` — `TOKEN_BUDGET_PER_ENTITY = 800`, `CHAR_BUDGET_PER_ENTITY = 1200`, 우선순위 절삭 |
| CTX-04 | 36-03 | 상담 노트 등 자유 텍스트는 경계 마킹으로 Prompt Injection을 방어한다 | SATISFIED | `context-builder.ts` — `escapeXml` + `wrapWithXmlBoundary` + 경계 지시문 |
| CTX-05 | 36-01, 36-04 | ChatMessage에 멘션 메타데이터가 저장된다 (mentionedEntities JSON) | SATISFIED | `schema.prisma` + 마이그레이션 + `route.ts` `db.chatMessage.create` |

**Coverage:** 7/7 Phase 36 requirements SATISFIED. No orphaned requirements.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `mention-resolver.ts` | 278-283 | `counselingSession.findMany` — `take` 없이 전체 조회 후 in-memory로 3건 제한 | Info | 기능적으로 정확하나 학생 수가 많을 때 불필요한 DB rows 반환. 향후 성능 최적화 여지 있음 |

안티패턴 없음 (Blocker/Warning 수준). 위 항목은 기능적으로 올바르며 현재 단계에서 허용 가능한 수준.

---

### Human Verification Required

자동화 검증으로 확인 불가한 항목:

#### 1. RBAC 런타임 동작 확인

**Test:** DIRECTOR가 아닌 교사로 로그인 후, 다른 팀의 학생 ID를 `mentions` 배열에 포함하여 `/api/chat`에 POST 요청
**Expected:** 응답 헤더에 `X-Mention-Warnings`가 포함되고, AI 응답에 해당 학생 데이터가 포함되지 않음
**Why human:** 실제 DB에 다른 팀 학생 데이터와 두 팀 이상의 교사 세션이 필요

#### 2. 스트리밍 응답 중 mentionedEntities 저장 확인

**Test:** 멘션 포함 메시지 전송 후 DB의 `chat_messages` 테이블에서 해당 레코드의 `mentionedEntities` 컬럼 확인
**Expected:** `[{"id":"...", "type":"student", "displayName":"..."}]` 형태의 JSON 저장 확인
**Why human:** DB 직접 확인 또는 운영 서버 접근 필요

#### 3. 토큰 예산 절삭 확인

**Test:** 분석 데이터가 풍부한 학생을 멘션한 채팅 전송 후 AI 시스템 프롬프트 로그 확인
**Expected:** `<student_data>` 태그 내 데이터가 1200자 이내로 절삭됨
**Why human:** 시스템 프롬프트 내용을 직접 관찰하려면 서버 로그 접근 필요

---

### Gaps Summary

없음. Phase 36의 모든 서버사이드 구성요소가 완전히 구현되어 연결됨.

**구현 완성도 요약:**
- `mention-types.ts`: 공유 타입 5개 — 완전 구현
- `mention-resolver.ts`: RBAC 포함 엔티티 DB 조회 700줄 — 완전 구현 (학생/선생님/팀 3타입 배치 조회, N+1 방지, 감사 로그)
- `context-builder.ts`: XML 경계 마킹 + 토큰 예산 + Prompt Injection 방어 221줄 — 완전 구현
- `route.ts`: 모든 컴포넌트 통합, 하위 호환 보장, X-Mention-Warnings 헤더 — 완전 구현
- Prisma 스키마 + GIN 인덱스 마이그레이션 — 적용 완료

---

## Superpowers Phase 호출 기록

Phase 36 레벨 스킬 호출 기록 (verifier 관찰):

각 Plan SUMMARY.md에 `## Superpowers 호출 기록` 섹션이 모두 포함되어 있음. Plan별 기록:
- 36-01: `brainstorming` 호출됨
- 36-02: `brainstorming`, `requesting-code-review` 호출됨
- 36-03: `brainstorming`, `requesting-code-review` 호출됨
- 36-04: `brainstorming`, `requesting-code-review` 호출됨

Phase 레벨 스킬(`verification-before-completion`, `dispatching-parallel-agents`)은 오케스트레이터 레벨에서 별도 기록 필요.

---

_Verified: 2026-02-19T10:40:00Z_
_Verifier: Claude (gsd-verifier)_
