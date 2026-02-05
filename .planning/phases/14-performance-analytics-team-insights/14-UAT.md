---
status: complete
phase: 14-performance-analytics-team-insights
source: 14-01-SUMMARY.md, 14-02-SUMMARY.md, 14-03-SUMMARY.md, 14-04-SUMMARY.md, 14-05-SUMMARY.md, 14-06-SUMMARY.md, 14-07-SUMMARY.md, 14-08-SUMMARY.md, 14-09-SUMMARY.md
started: 2026-02-06T01:55:00Z
updated: 2026-02-06T01:55:00Z
---

## Current Test

[testing complete]

## Tests

### 1. 선생님 담당 학생 목록 페이지
expected: /teachers/[id]/students 페이지에서 담당 학생 목록과 4개 요약 카드, 검색/정렬, 색상 구분된 성적 표시
result: pass

### 2. 상담 기록 폼
expected: /counseling/new 페이지에서 상담 세션 기록 폼이 표시됨. 날짜, 시간, 유형(학업/진로/행동/가정/기타), 요약, 후속 조치, 만족도(1-5 별점) 입력 가능.
result: pass

### 3. 상담 이력 목록
expected: /counseling 페이지에서 월별로 그룹화된 상담 이력이 표시됨. 상대 시간(오늘, 어제, N일 전 등) 표시. 유형별 배지 색상 구분.
result: pass

### 4. 학생 만족도 조사 폼
expected: /satisfaction/new 페이지에서 만족도 조사 폼 표시. 4개 항목(전체 만족도, 교수 방법, 의사소통, 지원)에 대해 1-10 슬라이더로 점수 입력. 수준 표시(불만족/보통/만족/매우 만족).
result: pass

### 5. 성과 분석 대시보드 - 개별 탭
expected: /analytics 페이지의 '개별' 탭에서 선생님별 성과 카드가 표시됨. 각 카드에 6개 주요 지표(학생 수, 향상률, 상담 횟수, 만족도, 궁합 점수, 과목 분포) 표시.
result: pass

### 6. 성과 분석 대시보드 - 추이 탭
expected: /analytics 페이지의 '추이' 탭에서 성적 추이 LineChart가 표시됨. 과목별 색상 구분.
result: pass

### 7. 성과 분석 대시보드 - 비교 탭
expected: /analytics 페이지의 '비교' 탭에서 선생님 간 성과 비교 차트가 표시됨.
result: pass

### 8. 성과 분석 대시보드 - 요약 탭
expected: /analytics 페이지의 '요약' 탭에서 전체 통계(총 학생 수, 평균 향상률, 총 상담 횟수, 상담 유형 분포, 만족도 평균) 표시.
result: pass

### 9. 팀 구성 분석 페이지
expected: /teams/[id]/composition 페이지에서 팀 구성 분석이 표시됨. 다양성 점수(0-100), 5축 레이더 차트(MBTI/VARK/오행/과목/학년), MBTI 분포 파이 차트, 전문 분야 커버리지 히트맵, 추천 사항 카드.
result: pass

### 10. 학생 학습 현황 탭 - 성적 목록
expected: 학생 상세 페이지의 '학습 현황' 탭에서 성적 목록 테이블(날짜, 유형, 과목, 점수)이 표시됨. 점수별 색상 구분(90+녹색, 80+파랑, 70+노랑, 70-빨강).
result: pass

### 11. 학생 학습 현황 탭 - 성적 추이 차트
expected: 학생 상세 페이지의 '학습 현황' 탭에서 성적 추이 LineChart가 표시됨. 과목별 색상 구분.
result: pass

### 12. 학생 학습 현황 탭 - 성적 추가
expected: 학생 상세 페이지의 '학습 현황' 탭에서 '성적 추가' 버튼 클릭 시 Dialog 폼이 열림. 과목, 점수, 유형(중간/기말/퀴즈/과제), 날짜, 학기 입력 후 저장하면 목록에 반영됨.
result: pass

## Summary

total: 12
passed: 12
issues: 0
pending: 0
skipped: 0

## Gaps

[none yet]
