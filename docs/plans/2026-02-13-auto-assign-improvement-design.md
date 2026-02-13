# AI 자동 배정 개선 설계

**날짜**: 2026-02-13
**상태**: 승인됨

## 목표

1. 자동 배정에서 이미 배정된 학생도 포함하여 전체 최적 재배정 가능하게 수정
2. 궁합 점수 계산 기준에 대한 상세 도움말 추가

## 변경 사항

### 1. 자동 배정 로직 변경 (`auto-assignment-suggestion.tsx`)

- `unassignedStudents` 필터 제거 → `allStudents` 전체를 배정 대상으로 사용
- 문구 변경: "미배정 학생 N명" → "전체 학생 N명 최적 배정"
- `handleGenerate()`에서 `allStudents.map(s => s.id)` 전달

### 2. 도움말 카드 추가 (`auto-assign/page.tsx`)

- Collapsible 접이식 카드로 궁합 점수 계산 기준 표시
- 5개 항목 가중치: MBTI(25%), 학습스타일(25%), 사주(20%), 성명학(15%), 부하분산(15%)
- 공정성 메트릭 3가지 설명
- 알고리즘 설명

### 변경하지 않는 것

- Server Action (`generateAutoAssignmentSuggestions`)
- 핵심 알고리즘 (`auto-assignment.ts`)
- 공정성 메트릭 계산

## 변경 파일

| 파일 | 변경 |
|------|------|
| `src/components/assignment/auto-assignment-suggestion.tsx` | 미배정 필터 제거, 전체 학생 대상 |
| `src/app/(dashboard)/matching/auto-assign/page.tsx` | 도움말 접이식 카드 추가 |
