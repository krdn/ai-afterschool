---
phase: 23
plan: 01
title: Phase 23 Plan 1: 학생, 분석, Admin 페이지 data-testid 추가
summary: 학생, 분석, Admin 페이지 컴포넌트에 E2E 테스트를 위한 data-testid 속성 추가
subsystem: UI Testing Infrastructure
tags: [data-testid, E2E, Playwright, Testing, Accessibility]
depends_on: []
provides: [E2E Test Selectors]
affects: [Phase 24-28]
tech-stack:
  added: []
  patterns: [data-testid attribute pattern for E2E testing]
---

# Phase 23 Plan 1: 학생, 분석, Admin 페이지 data-testid 추가

## 요약 (One-liner)
학생 목록/상세, 분석 탭, Admin LLM 설정/사용량 페이지 컴포넌트에 data-testid 속성을 추가하여 E2E 테스트 셀렉터와 정합성을 맞췄습니다.

## 목적 및 배경
E2E 테스트(student.spec.ts, analysis.spec.ts, admin.spec.ts)에서 `[data-testid="..."]` 셀렉터로 안정적으로 요소를 찾을 수 있도록 합니다. 이는 테스트 안정성을 확보하고 CSS 클래스 변경 등 UI 리팩토링 시 테스트가 깨지는 것을 방지합니다.

## 구현 내용

### 1. 학생 목록 및 상세 페이지 (STU-01)
- **파일:** `src/app/(dashboard)/students/page.tsx`
- **변경:**
  - student-card 내부에 `data-testid="student-name"` 추가 (학생 이름 h3 태그)
  - `data-testid="student-school"` 추가 (학교 표시)
  - `data-testid="student-grade"` 추가 (학년 표시)

- **파일:** `src/app/(dashboard)/students/[id]/page.tsx`
- **변경:**
  - 탭 링크에 동적 `data-testid={${tab.id}-tab}` 추가 (learning-tab, analysis-tab, matching-tab, counseling-tab)

### 2. 분석 탭 및 분석 패널 (ANL-01)
- **파일:** `src/components/students/tabs/analysis-tab.tsx`
- **변경:** 로딩 상태 div에 `data-testid="analysis-loading"` 추가

- **파일:** `src/components/students/saju-analysis-panel.tsx`
- **변경:**
  - Card에 `data-testid="saju-tab"` 추가 (탭 식별자)
  - 사주 결과 컨테이너에 `data-testid="saju-result"` 추가
  - 사주 주柱에 `data-testid="year-pillar"`, `data-testid="month-pillar"`, `data-testid="day-pillar"`, `data-testid="hour-pillar"` 추가
  - 오행 분석 섹션에 `data-testid="ohang-analysis"` 추가

- **파일:** `src/components/students/mbti-analysis-panel.tsx`
- **변경:** h2 제목에 `data-testid="mbti-tab"` 추가

- **파일:** `src/components/mbti/results-display.tsx`
- **변경:**
  - 결과 카드에 `data-testid="mbti-result-card"` 추가
  - `data-testid="mbti-description"` 추가 (요약 설명)
  - `data-testid="mbti-strengths"` 추가 (강점 섹션)
  - `data-testid="mbti-weaknesses"` 추가 (약점 섹션)
  - `data-testid="learning-style"` 추가 (학습 스타일 섹션)

- **파일:** `src/components/students/name-analysis-panel.tsx`
- **변경:** Card에 `data-testid="name-tab"` 추가

### 3. Admin LLM 설정 페이지 (ADM-01)
- **파일:** `src/app/(dashboard)/admin/llm-settings/page.tsx`
- **변경:**
  - 현재 활성 제공자 수 표시에 `data-testid="current-provider"` 추가
  - ProviderSelect 컴포넌트 임포트 및 추가

- **파일 (신규):** `src/app/(dashboard)/admin/llm-settings/provider-select.tsx`
- **내용:** 기본 제공자 선택 드롭다운 컴포넌트 생성
  - `data-testid="provider-select"` 추가
  - 현재 활성화된 제공자 목록 표시
  - 제공자 선택 UI (Note: 실제 저장 기능은 추후 Phase에서 구현)

- **파일:** `src/app/(dashboard)/admin/llm-settings/provider-card.tsx`
- **변경:** API 키 마스킹 표시 p 태그에 `data-testid="api-key-display"` 추가

### 4. Admin LLM 사용량 페이지 (ADM-02)
- **파일:** `src/app/(dashboard)/admin/llm-usage/page.tsx`
- **변경:**
  - 총 토큰 표시 div에 `data-testid="total-tokens"` 추가
  - 총 비용 표시 div에 `data-testid="estimated-cost"` 추가

- **파일:** `src/app/(dashboard)/admin/llm-usage/usage-charts.tsx`
- **변경:**
  - UsageCharts 래퍼 div에 `data-testid="usage-chart"` 추가
  - ProviderDistributionChart Card에 `data-testid="model-breakdown"` 추가
  - FeatureUsageChart Card에 `data-testid="feature-breakdown"` 추가

- **파일:** `src/app/(dashboard)/admin/llm-usage/cost-alerts.tsx`
- **변경:**
  - dateRange 상태 추가 (7d, 30d, 90d)
  - 날짜 범위 버튼 그룹에 `data-testid="date-range-selector"` 추가
  - UI만 구현 (필터링 동작은 추후 Phase에서 구현)

## 기술적 결정 사항

1. **data-testid 네이밍 컨벤션:** kebab-case 사용 (예: `student-name`, `analysis-loading`)
2. **동적 data-testid:** 탭 ID 기반 동적 생성 (예: `${tab.id}-tab`)
3. **최소 변경 원칙:** 기존 UI/스타일 변경 없이 data-testid 속성만 추가
4. **ProviderSelect 컴포넌트:** UI만 구현, 실제 제공자 변경 로직은 추후 Phase에서 구현
5. **날짜 범위 선택기:** UI만 구현, 실제 필터링 로직은 추후 Phase에서 구현

## 검증 기준
- [x] `npx next build` 에러 없이 빌드 통과
- [x] `grep -r 'data-testid="student-name"' src/` 결과 확인
- [x] `grep -r 'data-testid="analysis-loading"' src/` 결과 확인
- [x] `grep -r 'data-testid="saju-tab"' src/` 결과 확인
- [x] `grep -r 'data-testid="mbti-tab"' src/` 결과 확인
- [x] `grep -r 'data-testid="current-provider"' src/` 결과 확인
- [x] `grep -r 'data-testid="provider-select"' src/` 결과 확인
- [x] `grep -r 'data-testid="usage-chart"' src/` 결과 확인
- [x] `grep -r 'data-testid="total-tokens"' src/` 결과 확인
- [x] `grep -r 'data-testid="estimated-cost"' src/` 결과 확인
- [x] `grep -r 'data-testid="model-breakdown"' src/` 결과 확인
- [x] `grep -r 'data-testid="feature-breakdown"' src/` 결과 확인

## 결과
- STU-01 충족: 학생 카드와 내부 요소에 data-testid 추가 완료
- ANL-01 충족: 분석 탭과 로딩 상태에 data-testid 추가 완료
- ADM-01 충족: LLM 설정 페이지에 data-testid 추가 완료
- ADM-02 충족: LLM 사용량 페이지에 data-testid 추가 완료
- 빌드 성공 확인

## 다음 Phase 준비
Phase 24-28의 E2E 테스트 실행을 위한 인프라가 준비되었습니다. Playwright 테스트에서 data-testid 셀렉터를 사용하여 안정적으로 요소를 찾을 수 있습니다.

## 메트릭
- **Duration:** ~10분
- **Files modified:** 13개 파일 (신규 1개 포함)
- **Lines changed:** +182 insertions, -28 deletions
- **Completion date:** 2026-02-06
