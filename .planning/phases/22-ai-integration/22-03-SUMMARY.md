---
phase: 22-ai-integration
plan: 03
subsystem: api
tags: [server-actions, ai, llm, counseling, personality-summary]

# Dependency graph
requires:
  - phase: 22-01
    provides: CounselingSession.aiSummary 필드, 프롬프트 빌더
  - phase: 15-ai-features
    provides: generateWithProvider 통합 라우터
provides:
  - 학생 AI 지원 데이터 조회 Server Action (getStudentAISupportDataAction)
  - AI 상담 요약 생성 Server Action (generateCounselingSummaryAction)
  - AI 요약 저장 Server Action (saveAISummaryAction)
  - 성향 요약 생성 Server Action (generatePersonalitySummaryAction)
affects: [22-04, 22-05, 22-06, ui-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Server Action에서 generateWithProvider 통합 라우터 활용
    - teacherId 기반 권한 확인 패턴
    - FailoverError 처리 패턴

key-files:
  created:
    - src/lib/actions/counseling-ai.ts
  modified: []

key-decisions:
  - "기존 getUnifiedPersonalityData, getCompatibilityResult 재사용"
  - "featureType: counseling_suggest (상담 요약), personality_summary (성향 요약)"
  - "temperature: 0.3 (낮은 온도로 일관된 요약)"
  - "maxOutputTokens: 500 (요약은 짧게)"

patterns-established:
  - "AI 요약 생성 시 generateWithProvider 호출 패턴"
  - "teacherId로 권한 확인 후 DB 접근"
  - "FailoverError 처리 및 사용자 메시지 반환"

# Metrics
duration: 5min
completed: 2026-02-05
---

# Phase 22 Plan 03: AI 상담 지원 Server Actions Summary

**학생 AI 지원 데이터 조회, AI 상담 요약 생성/저장, 성향 요약 생성을 위한 4개의 Server Actions 구현**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-04T16:18:08Z
- **Completed:** 2026-02-04T16:23:06Z
- **Tasks:** 2
- **Files created:** 1

## Accomplishments
- getStudentAISupportDataAction: 학생 성향 요약과 궁합 점수 조회
- generateCounselingSummaryAction: AI 기반 상담 요약 생성 (성향 정보 + 이전 이력 활용)
- saveAISummaryAction: 생성된 AI 요약을 CounselingSession.aiSummary에 저장
- generatePersonalitySummaryAction: 5개 분석 결과 종합하여 1-2문장 요약 생성

## Task Commits

Each task was committed atomically:

1. **Task 1: getStudentAISupportDataAction 구현** - `0e40a36` (feat)
2. **Task 2: AI 요약 생성/저장 Server Actions 구현** - `b5dcc6c` (feat)

## Files Created/Modified
- `src/lib/actions/counseling-ai.ts` - AI 상담 지원 Server Actions (4개 함수)

## Decisions Made
- 기존 함수 재사용: getUnifiedPersonalityData, getCompatibilityResult, generateWithProvider
- featureType 구분: counseling_suggest (상담), personality_summary (성향)
- 낮은 temperature(0.3): 일관된 요약 결과
- maxOutputTokens 500: 요약은 간결하게

## Deviations from Plan
None - plan executed exactly as written

## Issues Encountered
- 빌드 시 webpack 캐시 오류 발생 - .next 및 node_modules/.cache 삭제 후 재빌드로 해결

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- 4개의 Server Actions가 UI 컴포넌트에서 호출 가능
- 22-04에서 AI 지원 패널 UI 구현 시 이 Actions 활용 예정
- generateWithProvider 연동 완료 (자동 폴백 지원)

---
*Phase: 22-ai-integration*
*Completed: 2026-02-05*
