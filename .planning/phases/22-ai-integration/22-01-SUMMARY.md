---
phase: 22-ai-integration
plan: 01
subsystem: ai
tags: [prisma, llm, prompt-builder, counseling]

# Dependency graph
requires:
  - phase: 06-ai-integration
    provides: UnifiedPersonalityData 타입, integration-prompts.ts 패턴
  - phase: 14-counseling-session
    provides: CounselingSession 모델
provides:
  - CounselingSession.aiSummary 필드 (AI 생성 상담 요약 저장)
  - buildCounselingSummaryPrompt 함수 (상담 요약 프롬프트 생성)
  - buildPersonalitySummaryPrompt 함수 (성향 요약 프롬프트 생성)
affects: [22-02, 22-03, 22-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "프롬프트 빌더 패턴: 동적 데이터 기반 프롬프트 조립"
    - "조건부 섹션 구성: 데이터 유무에 따른 프롬프트 섹션 동적 포함"

key-files:
  created:
    - src/lib/ai/counseling-prompts.ts
  modified:
    - prisma/schema.prisma

key-decisions:
  - "Student.personalitySummary 신규 String 필드 대신 기존 PersonalitySummary 관계 활용 (명명 충돌 방지)"
  - "상담 요약 출력 형식 Markdown 채택 (교사 가독성 우선)"
  - "성향 요약 출력 형식 단순 텍스트 (1-2문장, JSON/Markdown 불필요)"
  - "이전 상담 이력 최대 5개만 프롬프트에 포함 (토큰 효율성)"

patterns-established:
  - "상담 프롬프트 빌더: CounselingSummaryPromptParams 인터페이스로 타입 안전성 확보"
  - "조건부 성향 데이터 포맷팅: unknown 타입에서 특정 필드 안전하게 추출"

# Metrics
duration: 3min
completed: 2026-02-05
---

# Phase 22 Plan 01: Schema 확장 및 프롬프트 빌더 Summary

**CounselingSession.aiSummary 필드와 상담/성향 요약 프롬프트 빌더 2종 구현**

## Performance

- **Duration:** 3분
- **Started:** 2026-02-05T01:11:21 KST
- **Completed:** 2026-02-05T01:14:20 KST
- **Tasks:** 2/2
- **Files modified:** 2

## Accomplishments

- CounselingSession 모델에 AI 생성 요약 저장용 aiSummary 필드 추가
- 상담 내용 + 학생 성향 + 이전 이력 종합 요약 프롬프트 빌더 구현
- 5개 분석 결과를 1-2문장으로 요약하는 프롬프트 빌더 구현
- UnifiedPersonalityData 타입 연동으로 타입 안전성 확보

## Task Commits

Each task was committed atomically:

1. **Task 1: Prisma Schema 확장** - `2f6c0e0` (feat)
2. **Task 2: 프롬프트 빌더 함수 구현** - `d2635a8` (feat)

## Files Created/Modified

- `prisma/schema.prisma` - CounselingSession.aiSummary 필드 추가
- `src/lib/ai/counseling-prompts.ts` - 상담/성향 요약 프롬프트 빌더 함수 및 타입

## Decisions Made

1. **기존 PersonalitySummary 관계 활용:** Plan에서 `Student.personalitySummary String?` 필드를 요청했으나, 이미 `personalitySummary PersonalitySummary?` 관계가 존재. 명명 충돌 방지를 위해 기존 관계의 `coreTraits` 필드를 1-2문장 요약 용도로 활용.

2. **상담 요약 출력 형식 Markdown:** 교사가 읽기 쉬운 구조화된 형식 (핵심 내용, 합의 사항, 관찰 사항, 후속 조치 섹션)

3. **성향 요약 출력 형식 단순 텍스트:** 1-2문장 요약에 JSON/Markdown 불필요, 직접 사용 가능한 텍스트로 출력

4. **이전 상담 이력 5개 제한:** 토큰 효율성과 맥락 유지 균형

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Student.personalitySummary 필드 충돌 회피**
- **Found during:** Task 1 분석 단계
- **Issue:** Plan에서 요청한 `personalitySummary String?` 필드는 기존 `personalitySummary PersonalitySummary?` 관계와 명명 충돌
- **Fix:** 신규 String 필드 추가 대신 기존 PersonalitySummary 모델의 coreTraits 필드 활용 (동일한 목적 달성)
- **Verification:** Prisma validate 성공, 빌드 성공
- **Impact:** Plan 의도 충족하면서 스키마 일관성 유지

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Plan의 의도(성향 요약 저장)는 기존 구조로 충족. 불필요한 중복 방지.

## Issues Encountered

None - Plan 분석 후 기존 구조 활용으로 원활히 진행

## User Setup Required

None - 외부 서비스 구성 불필요

## Next Phase Readiness

- **Ready:**
  - CounselingSession.aiSummary 필드로 AI 생성 요약 저장 준비 완료
  - buildCounselingSummaryPrompt, buildPersonalitySummaryPrompt 함수로 LLM 호출 준비 완료
  - UnifiedPersonalityData 타입 연동으로 기존 AI 분석 데이터 활용 가능

- **Next steps:**
  - Plan 22-02: 상담 요약 생성 Server Action 구현
  - Plan 22-03: UI 통합 및 사용자 인터페이스

---
*Phase: 22-ai-integration*
*Completed: 2026-02-05*
