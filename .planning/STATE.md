# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-19)

**Core value:** 학생 정보 통합 관리를 기반으로 AI 성향 분석 및 맞춤형 학습/진로 제안 제공
**Current focus:** v4.0 AI Smart Chat — Phase 38: Autocomplete UI & ChatInput Integration

## Current Position

Milestone: v4.0 AI Smart Chat
Phase: 38 of 40 (Autocomplete UI & ChatInput Integration)
Plan: 03 complete (Phase 38 Plan 03 DONE — mentions[] 전달 파이프라인 연결)
Status: In Progress
Last activity: 2026-02-19 — Executed 38-03-PLAN.md

Progress: [████████████████████████████████████████████░░] 91% (183/200+ plans)

**v4.0 AI Smart Chat** — ROADMAP COMPLETE, READY TO EXECUTE
- [x] Phase 36: Server-side Foundation (MENT-03, MENT-04, CTX-01~05)
- [x] Phase 37: Autocomplete Search API (MENT-06)
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
| Phase 38-autocomplete-ui-chatinput-integration P01 | 3 | 2 tasks | 3 files |
| Phase 38-autocomplete-ui-chatinput-integration P02 | 7 | 1 tasks | 3 files |
| Phase 38-autocomplete-ui-chatinput-integration P03 | 3 | 2 tasks | 2 files |

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
- [Phase 37-01]: 타입별 그룹 응답 구조({ students, teachers, teams }): Phase 38 드롭다운 섹션 렌더링에 직접 매핑
- [Phase 37-01]: RBAC silent filter: 검색 단계는 탐색이므로 접근 불가 메시지 없이 조용히 제외
- [Phase 37-01]: buildXxxWhere null 반환 패턴: teamId null인 비 DIRECTOR의 Prisma null 오류 방지
- [Phase 38-01]: useMention data prop을 함수 형태로 전달하여 react-mentions-ts 이중 필터링 방지
- [Phase 38-01]: 200ms 디바운스: setTimeout + stale 쿼리 ref 패턴 (useDebounce 라이브러리 미사용)
- [Phase 38-autocomplete-ui-chatinput-integration]: [Phase 38-02]: prevTypeRef 패턴으로 renderSuggestion 내 그룹 헤더 삽입: 배열에 헤더 아이템 추가 방식 대신 ref로 타입 전환 감지
- [Phase 38-autocomplete-ui-chatinput-integration]: [Phase 38-02]: @source 지시문으로 react-mentions-ts 스타일 통합: exports 미등록 CSS를 @source로 직접 Tailwind 스캔
- [Phase 38-autocomplete-ui-chatinput-integration]: [Phase 38-03]: mentions.length > 0 ? mentions : undefined 패턴: 빈 배열 대신 undefined 전달로 POST body 간결화 및 하위 호환

### Pending Todos

None.

### Blockers/Concerns

**Phase 38 리스크 (경미):**
- react-mentions-ts + shadcn/ui Tailwind v4 통합: Phase 38 첫 Task에서 스파이크 테스트 필수
- 한국어 IME + @트리거 충돌: compositionstart/compositionend 이벤트 실제 테스트 필요

**v3.0 미완료 (병행 진행 가능):**
- Phase 31-34 미시작 (Sentry Auto-Collection, Webhook, CI/CD, Dashboard)

## Session Continuity

Last session: 2026-02-19
Stopped at: Completed 38-03-PLAN.md
Resume file: .planning/phases/38-autocomplete-ui-chatinput-integration/38-03-SUMMARY.md
Next action: Execute Phase 39 (Message Rendering & UX Polish)
