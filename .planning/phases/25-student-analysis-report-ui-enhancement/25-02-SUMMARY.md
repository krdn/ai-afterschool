---
phase: 25-student-analysis-report-ui-enhancement
plan: 02
subsystem: ui
tags: [shadcn-ui, tabs, error-handling, data-testid, nextjs, typescript]

# Dependency graph
requires:
  - phase: 24-missing-routes-creation
    provides: student detail page with tabs infrastructure
provides:
  - Analysis tab with 4 subtabs (사주, 관상, 손금, MBTI)
  - Unified error handling pattern for all analysis panels
  - data-testid attributes for E2E testing
affects: [counseling-ui, matching-ui, report-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - shadcn/ui Tabs component for nested tab navigation
    - Server action pattern for client-side data fetching
    - Unified error state management with retry buttons
    - data-testid naming convention: [component]-[element]

key-files:
  created:
    - src/lib/actions/student-analysis-tab.ts - Server action for fetching all analysis data
  modified:
    - src/components/students/tabs/analysis-tab.tsx - Refactored to use subtabs
    - src/components/students/saju-analysis-panel.tsx - Added unified error handling
    - src/components/students/face-analysis-panel.tsx - Added unified error handling
    - src/components/students/palm-analysis-panel.tsx - Added unified error handling
    - src/components/students/mbti-analysis-panel.tsx - Added error handling
    - src/components/students/mbti-direct-input-modal.tsx - Added isSaving prop

key-decisions:
  - "상태 기반 서브탭: URL 해시 없이 useState로 관리하여 URL 복잡도 최소화"
  - "기본 서브탭은 사주: 첫 번째 탭을 기본값으로 설정"
  - "통일된 에러 메시지 형식: '{분석 유형} 분석에 실패했습니다. (원인: {error}) 다시 시도해주세요.'"
  - "재시도 버튼 스타일 통일: Button 컴포넌트 + variant='outline' + RefreshCw/Loader2 아이콘"

patterns-established:
  - "서버 액션 데이터 페칭: 클라이언트 컴포넌트에서 useEffect로 서버 액션 호출"
  - "에러 상태 관리: useState로 errorMessage 관리 + 재시도 핸들러"
  - "data-testid 패턴: analysis-error(에러), retry-button(재시도), saju-analyze-button(분석 버튼)"

# Metrics
duration: 5min
completed: 2026-02-07
---

# Phase 25: Plan 02 - Analysis Tab Subtab Structure and Error Handling Summary

**Analysis Tab에 4개 서브탭(사주/관상/손금/MBTI)을 shadcn/ui Tabs로 분리하고, 모든 AI 분석 패널의 에러 처리를 통일된 메시지와 재시도 버튼으로 개선**

## Performance

- **Duration:** 5 minutes
- **Started:** 2026-02-06T16:53:50Z
- **Completed:** 2026-02-06T16:58:50Z
- **Tasks:** 2
- **Files modified:** 7 (1 created, 6 modified)

## Accomplishments

- **Analysis Tab 서브탭 구조**: shadcn/ui Tabs 컴포넌트를 사용하여 사주/관상/손금/MBTI 4개 서브탭 구현
- **통합 데이터 조회**: 서버 액션(getStudentAnalysisData)으로 모든 분석 데이터를 한 번에 조회
- **에러 메시지 통일**: 각 분석 유형별로 통일된 에러 메시지 형식 적용
- **재시도 버튼 표준화**: Button 컴포넌트 + RefreshCw/Loader2 아이콘으로 일관된 UI 제공
- **data-testid 추가**: E2E 테스트를 위한 test-id 속성 추가

## Task Commits

Each task was committed atomically:

1. **Task 1: AnalysisTab 서브탭 구조 변경 (ANL-02)** - `883818a` (feat)
2. **Task 2: 에러 메시지 통일 및 data-testid 추가 (ANL-03)** - `37378ee` (feat)

**Plan metadata:** (to be committed after SUMMARY.md)

## Files Created/Modified

- `src/lib/actions/student-analysis-tab.ts` - **NEW** 서버 액션으로 학생 분석 데이터 통합 조회 (student, face, palm, mbti)
- `src/components/students/tabs/analysis-tab.tsx` - shadcn/ui Tabs로 서브탭 구조 변경, 4개 탭(사주/관상/손금/MBTI)
- `src/components/students/saju-analysis-panel.tsx` - 에러 메시지 통일, data-testid 추가, 재시도 버튼 스타일 변경
- `src/components/students/face-analysis-panel.tsx` - 에러 메시지 통일, data-testid 추가, 재시도 버튼 스타일 변경
- `src/components/students/palm-analysis-panel.tsx` - 에러 메시지 통일, data-testid 추가, 재시도 버튼 스타일 변경
- `src/components/students/mbti-analysis-panel.tsx` - 에러 처리 추가, data-testid 추가
- `src/components/students/mbti-direct-input-modal.tsx` - isSaving prop 추가, 로딩 상태 표시 개선

## Decisions Made

### Task 1: AnalysisTab 서브탭 구조 변경

1. **shadcn/ui Tabs 중첩 구조**: 기존 단일 탭에서 4개 서브탭으로 분리하여 UX 개선
2. **상태 기반 서브탭 관리**: URL 해시를 사용하지 않고 useState로 관리하여 URL 복잡도 최소화
3. **기본 서브탭은 사주**: 첫 번째 탭을 기본값으로 설정하여 직관적인 UX 제공
4. **서버 액션으로 데이터 통합 조회**: 클라이언트 컴포넌트에서 useEffect로 서버 액션 호출하여 모든 분석 데이터를 한 번에 가져옴

### Task 2: 에러 메시지 통일

1. **통일된 에러 메시지 형식**:
   - 사주: "사주 분석에 실패했습니다. (원인: {error}) 다시 시도해주세요."
   - 관상/손금: "이미지 분석에 실패했습니다. (원인: {error}) 다시 시도해주세요."
   - MBTI: "MBTI 분석에 실패했습니다. (원인: {error}) 다시 시도해주세요."
2. **재시도 버튼 스타일 통일**: Button 컴포넌트 + variant="outline" + RefreshCw/Loader2 아이콘 + "다시 시도" 텍스트
3. **data-testid 추가**: `analysis-error`(에러 상태), `retry-button`(재시도 버튼)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed as expected.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **25-03 준비 완료**: 다음 플랜(학생 페이지 UI 개선)을 위해 필요한 모든 컴포넌트가 준비됨
- **E2E 테스트 준비**: data-testid 속성이 추가되어 자동화 테스트 가능
- **Blockers 없음**: 모든 기능이 정상 동작하며 다음 단계로 진행 가능

---
*Phase: 25-student-analysis-report-ui-enhancement*
*Completed: 2026-02-07*

## Self-Check: PASSED

**Files created:**
- src/lib/actions/student-analysis-tab.ts: FOUND

**Commits verified:**
- 883818a: feat(25-02): AnalysisTab 서브탭 구조 변경 (ANL-02)
- 37378ee: feat(25-02): 에러 메시지 통일 및 data-testid 추가 (ANL-03)
