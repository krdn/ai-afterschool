---
phase: 36-server-side-foundation
plan: 03
subsystem: api
tags: [typescript, chat, mention, context-builder, xml, prompt-injection, token-budget]

# Dependency graph
requires:
  - phase: 36-01-SUMMARY
    provides: "ResolvedMention 타입 (item, displayName, contextData, accessDenied)"
  - phase: 36-02-SUMMARY
    provides: "mention-resolver가 조립한 contextData 문자열"
provides:
  - buildMentionContext 함수 (src/lib/chat/context-builder.ts)
  - XML 경계 마킹 래핑 (student_data / teacher_data / team_data 태그)
  - 토큰 예산 관리 및 우선순위 절삭 로직
  - 다중 멘션 예산 재분배 알고리즘
  - Prompt Injection 방어 (escapeXml)
affects:
  - 36-04 (chat route에서 buildMentionContext 반환값을 system 파라미터에 append)
  - Phase 37 (autocomplete API — 간접 영향 없음)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "XML 경계 마킹 패턴: <student_data id=...> 태그 + 상단 경계 지시문으로 Prompt Injection 방어"
    - "토큰 예산 우선순위 절삭: 분석 섹션을 뒤에서부터 제거, 기본정보 보존"
    - "다중 엔티티 예산 재분배: 예산 미달 엔티티의 남은 예산을 1회 재배분"

key-files:
  created:
    - src/lib/chat/context-builder.ts
  modified: []

key-decisions:
  - "escapeXml에서 & 먼저 처리: &amp; 치환이 먼저 적용되어야 <&lt;> 등 이중 이스케이프 방지"
  - "절삭 후 hard 절삭 보조: 섹션 단위 제거로 부족 시 문자 단위 hard 절삭 추가 안전장치"
  - "예산 재분배 1회 제한: 복잡도와 예측 가능성을 위해 1회만 재분배"

patterns-established:
  - "contextData는 mention-resolver가 조립, context-builder는 래핑만: 역할 분리로 테스트 용이"
  - "MAX_ENTITIES=10 하드캡: 무한 루프/과도한 컨텍스트 방지"

requirements-completed: [CTX-01, CTX-03, CTX-04]

# Metrics
duration: 2min
completed: 2026-02-19
---

# Phase 36 Plan 03: 멘션 컨텍스트 빌더 Summary

**토큰 예산 800토큰/엔티티 + XML 경계 마킹으로 Prompt Injection 방어하는 buildMentionContext 함수 — ResolvedMention 배열을 AI system prompt 주입 문자열로 조립**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-18T15:58:49Z
- **Completed:** 2026-02-18T16:00:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- `src/lib/chat/context-builder.ts` 신설 — 5개 내부 함수 + 1개 export 함수로 구조화
- XML 이스케이프 `escapeXml` — `&`, `<`, `>`, `"` 4종 처리로 Prompt Injection 방어
- 우선순위 절삭 `truncateToCharBudget` — 9개 분석 섹션 뒤에서부터 제거, `[기본정보]` 절대 보존
- 예산 재분배 `redistributeBudget` — 예산 미달 엔티티의 남은 예산을 초과 엔티티에 1회 재분배
- XML 래핑 `wrapWithXmlBoundary` — 엔티티 타입별 `student_data` / `teacher_data` / `team_data` 태그
- TypeScript exhaustiveness check (`never` 타입)으로 향후 MentionType 추가 시 컴파일 오류 보장

## Task Commits

Each task was committed atomically:

1. **Task 1: context-builder.ts 구현** - `f95c96e` (feat)

**Plan metadata:** (docs commit to follow)

## Files Created/Modified
- `src/lib/chat/context-builder.ts` - buildMentionContext, escapeXml, truncateToCharBudget, redistributeBudget, wrapWithXmlBoundary 구현

## Decisions Made
- `&` 먼저 이스케이프: `replace(/&/g, '&amp;')` 순서를 최우선으로 처리하여 `<` → `&lt;` 후 `&lt;` → `&amp;lt;` 이중 이스케이프 방지
- 섹션 단위 절삭 + hard 절삭 보조: 정규식으로 `[섹션명]` 블록 단위 제거, 부족 시 `.slice(0, budget)` 보조 안전장치
- 예산 재분배 1회 제한: 복잡한 반복 분배 대신 단순하고 예측 가능한 1회 재분배

## Deviations from Plan

None - 계획대로 정확히 실행됨.

## Issues Encountered
None

## User Setup Required
None - 라이브러리 추가 없음, 새 파일 생성만.

## Next Phase Readiness
- Plan 36-04 (chat route) 즉시 시작 가능: `buildMentionContext` export 완료
- `import { buildMentionContext } from '@/lib/chat/context-builder'` 패턴으로 사용
- chat route에서 `resolutionResult.resolved`를 buildMentionContext에 전달 후 system 파라미터에 append

## Self-Check: PASSED

- `src/lib/chat/context-builder.ts` — FOUND
- `36-03-SUMMARY.md` — FOUND
- Commit `f95c96e` — FOUND

---
*Phase: 36-server-side-foundation*
*Completed: 2026-02-19*

## Superpowers 호출 기록

| # | 스킬명 | 호출 시점 | 결과 요약 |
|---|--------|----------|----------|
| 1 | superpowers:brainstorming | Task 1 실행 전 | escapeXml 순서(&먼저), 절삭 전략, 재분배 알고리즘 검토 |
| 4 | superpowers:requesting-code-review | 모든 Task 완료 후 | 이슈 0개, TypeScript exhaustiveness check 확인, approved |

### 미호출 스킬 사유
| 스킬명 | 미호출 사유 |
|--------|-----------|
| superpowers:test-driven-development | 단일 유틸리티 함수 파일, tsx 런타임 테스트로 검증 완료 |
| superpowers:systematic-debugging | 버그 미발생 |
