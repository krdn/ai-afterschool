# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-19)

**Core value:** 학생 정보 통합 관리를 기반으로 AI 성향 분석 및 맞춤형 학습/진로 제안 제공
**Current focus:** v4.0 AI Smart Chat — Phase 36: Server-side Foundation

## Current Position

Milestone: v4.0 AI Smart Chat
Phase: 36 of 40 (Server-side Foundation)
Plan: 04 complete (Phase 36 DONE)
Status: In Progress
Last activity: 2026-02-18 — Executed 36-04-PLAN.md

Progress: [████████████████████████████████████████████░░] 91% (183/200+ plans)

**v4.0 AI Smart Chat** — ROADMAP COMPLETE, READY TO EXECUTE
- [x] Phase 36: Server-side Foundation (MENT-03, MENT-04, CTX-01~05)
- [ ] Phase 37: Autocomplete Search API (MENT-06)
- [ ] Phase 38: Autocomplete UI & ChatInput Integration (MENT-01, MENT-02, MENT-05, UI-01)
- [ ] Phase 39: Message Rendering & UX Polish (UI-02, UI-03)
- [ ] Phase 40: LLMQueryBar Extension (UI-04)

## Performance Metrics

**Velocity:**
- Total plans completed: 183+ (v1.0-Phase 35 + v3.0 29-30)
- Average duration: ~4.3 min
- Total execution time: ~13 hours

**By Milestone:**

| Milestone | Plans | Total | Avg/Plan |
|-----------|-------|-------|----------|
| v1.0 MVP | 36 | 254 min | ~7 min |
| v1.1 Production | 22 | ~102 min | ~5 min |
| v2.0 Teacher Mgmt | 40 | ~119 min | ~3 min |
| v2.1 Counseling | 30 | ~189 min | ~6.3 min |
| v2.1.1 E2E Test | 34 | ~208 min | ~6.1 min |
| v3.0 DevOps (partial) | 7 | ~21 min | ~3 min |
| v4.0 LLM Hub | 9 | ~27 min | ~3 min |
| Phase 36-server-side-foundation P01 | 2 | 2 tasks | 3 files |
| Phase 36-server-side-foundation P02 | 2 | 1 task | 1 file |
| Phase 36-server-side-foundation P03 | 2 | 1 task | 1 file |
| Phase 36-server-side-foundation P04 | 1 | 1 task | 1 file |

## Accumulated Context

### Decisions

**v4.0 AI Smart Chat — Architecture (from research 2026-02-18):**
- Parse on Submit: textarea에 @Name 텍스트 유지, submit 시에만 파싱 (contenteditable 불필요)
- System Prompt Injection: 엔티티 데이터를 messages[]가 아닌 system 파라미터로 주입 (히스토리 오염 방지)
- Server-side Resolution: 클라이언트는 [{type, id}] 튜플만 전송, 서버에서 RBAC 포함 데이터 조회
- GET Route for Autocomplete: AbortController 취소 지원 위해 Server Action 대신 GET route
- Token budget: ~800 토큰/엔티티 (한국어 1토큰 ≈ 1.5~2자)
- Security: XML 경계 마킹 (<student_data>) + system prompt 상단 지시문으로 Prompt Injection 방어
- New package: react-mentions-ts@5.4.7 (단 하나, peer deps 전부 기존 설치됨)
- Fallback: react-mentions-ts + shadcn/ui 충돌 시 @ariakit/react combobox-textarea
- [Phase 36-server-side-foundation]: 멘션 타입 중앙화: 클라이언트/서버 공유 타입을 src/lib/chat/mention-types.ts에서 단일 정의
- [Phase 36-server-side-foundation]: GIN 인덱스 jsonb_path_ops: ChatMessage.mentionedEntities 컬럼에 엔티티별 필터링 지원
- [Phase 36-02]: 배치 조회 후 RBAC 필터링: createTeamFilteredPrisma 대신 Application 레이어 직접 teamId 비교로 명확성 확보
- [Phase 36-02]: handleAccessDenied 헬퍼 패턴: RBAC 실패 처리(감사 로그+resolved+metadata+메시지) 캡슐화
- [Phase 36-03]: context-builder escapeXml &먼저 처리: 이중 이스케이프 방지 위해 & → &amp; 최우선 치환
- [Phase 36-03]: 예산 재분배 1회 제한: 단순하고 예측 가능한 1회 재분배로 복잡도 제한
- [Phase 36-04]: mentions 없으면 dynamicSystem = SYSTEM_PROMPT: 하위 호환 보장 — 기존 채팅 동작 변경 없음
- [Phase 36-04]: mentionedEntities undefined 시 Prisma 필드 생략: 기존 메시지 스키마 완전 호환
- [Phase 36-04]: 멘션 처리 위치(세션 이후+DB저장 이전): chatSessionId 확정 후 + mentionedEntitiesData 저장 전 정확한 삽입점

### Pending Todos

None.

### Blockers/Concerns

**Phase 38 리스크 (경미):**
- react-mentions-ts + shadcn/ui Tailwind v4 통합: Phase 38 첫 Task에서 스파이크 테스트 필수
- 한국어 IME + @트리거 충돌: compositionstart/compositionend 이벤트 실제 테스트 필요

**v3.0 미완료 (병행 진행 가능):**
- Phase 31-34 미시작 (Sentry Auto-Collection, Webhook, CI/CD, Dashboard)

## Session Continuity

Last session: 2026-02-18
Stopped at: Completed 36-04-PLAN.md (route.ts — 멘션 시스템 통합, Phase 36 서버사이드 완성)
Resume file: .planning/phases/37-autocomplete-search-api/ (Phase 37 시작)
Next action: /gsd:execute-phase 37-autocomplete-search-api
