# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-19)

**Core value:** 학생 정보 통합 관리를 기반으로 AI 성향 분석 및 맞춤형 학습/진로 제안 제공
**Current focus:** v4.0 AI Smart Chat — Phase 36: Server-side Foundation

## Current Position

Milestone: v4.0 AI Smart Chat
Phase: 36 of 40 (Server-side Foundation)
Plan: — (not started)
Status: Ready to plan
Last activity: 2026-02-19 — Roadmap phases 36-40 created

Progress: [████████████████████████████████████████████░░] 91% (183/200+ plans)

**v4.0 AI Smart Chat** — ROADMAP COMPLETE, READY TO EXECUTE
- [ ] Phase 36: Server-side Foundation (MENT-03, MENT-04, CTX-01~05)
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
Stopped at: Roadmap created for v4.0 AI Smart Chat (phases 36-40)
Resume file: None
Next action: /gsd:plan-phase 36
