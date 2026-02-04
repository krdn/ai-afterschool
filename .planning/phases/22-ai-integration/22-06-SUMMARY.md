---
phase: 22-ai-integration
plan: 06
subsystem: ui
tags: [form-integration, ai-panel, counseling]

# Dependency graph
requires:
  - phase: 22-05
    provides: AISupportPanel 컴포넌트
provides:
  - 상담 폼에 AI 지원 패널 통합
  - AI 요약 적용 및 저장 기능
affects: [22-07, testing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 폼-사이드패널 통합 패턴
    - AI 요약 적용 시 기존 내용 앞에 추가
    - 별도 aiSummary 필드에 AI 요약 원본 저장

key-files:
  created: []
  modified:
    - src/components/counseling/CounselingSessionForm.tsx
    - src/components/counseling/NewCounselingClient.tsx
    - src/app/(dashboard)/counseling/new/page.tsx
    - src/lib/actions/performance.ts
    - src/lib/db/performance.ts

key-decisions:
  - "AI 요약은 기존 summary 앞에 추가 (구분선 --- 로 구분)"
  - "aiSummary는 별도 필드에 저장 (요약과 분리)"
  - "AI 지원 버튼은 CardHeader 우측에 배치"

patterns-established:
  - "setIsPanelOpen(false)로 요약 적용 후 패널 자동 닫기"
  - "appliedAISummary 상태로 AI 요약 원본 저장"
  - "FormData에 aiSummary 추가로 서버 전달"

# Metrics
duration: 8min
completed: 2026-02-05
---

# Phase 22 Plan 06: 상담 폼에 AI 지원 패널 통합 Summary

**기존 상담 기록 폼에 AI 지원 사이드 패널을 연동하여 선생님이 상담 중 AI 지원을 받을 수 있게 함**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-05T01:30:00Z
- **Completed:** 2026-02-05T01:38:00Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- CounselingSessionForm에 AI 지원 버튼 추가 (Sparkles 아이콘)
- AISupportPanel 통합 및 상태 관리
- AI 요약 적용 시 summary 필드에 반영 (기존 내용 앞에 추가)
- aiSummary 저장 처리 (FormData + DB)
- NewCounselingClient에 studentName, teacherId prop 전달

## Task Commits

1. **AI 지원 패널 통합** - `3ef6b1f` (feat)
2. **AI 요약 저장 처리 추가** - `56ddd4f` (feat)
3. **NewCounselingClient에 studentName, teacherId 전달** - `576d881` (feat)

## Files Modified

- `src/components/counseling/CounselingSessionForm.tsx` - AI 지원 버튼, 패널 통합, 요약 적용 로직
- `src/lib/actions/performance.ts` - aiSummary FormData 추출
- `src/lib/db/performance.ts` - aiSummary DB 저장
- `src/components/counseling/NewCounselingClient.tsx` - studentName, teacherId prop
- `src/app/(dashboard)/counseling/new/page.tsx` - teacherId 전달

## Decisions Made

- AI 요약은 기존 summary 앞에 추가 (구분선 `---` 로 구분)
- aiSummary는 별도 필드에 저장 (요약과 분리하여 AI 원본 유지)
- AI 지원 버튼은 CardHeader 우측에 배치
- 요약 적용 후 패널 자동 닫기

## Deviations from Plan

None - plan executed as written

## Issues Encountered

- NewCounselingClient에서 studentName, teacherId prop 누락 → 빌드 오류 해결

## User Setup Required

None

## Next Phase Readiness

- 상담 폼에서 AI 지원 패널 정상 동작
- 22-07에서 전체 기능 테스트 및 검증 예정

---
*Phase: 22-ai-integration*
*Completed: 2026-02-05*
