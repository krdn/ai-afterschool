# Phase 14: Performance Analytics & Team Insights - Context

**Gathered:** 2026-01-31
**Status:** Ready for planning

<domain>
## Phase Boundary

선생님 성과 분석 및 팀 구성 분석 대시보드 구축. 개별 선생님의 학업 성과(성적 향상률), 상담 활동, 학생 만족도를 추적하고 시각화하며, 팀 단위의 구성 분석도 제공한다.

**Scope:**
- 개별 선생님 성과 메트릭 추적 및 시각화
- 팀 구성 분석 (성향 다양성, 전문성 커버리지)
- 공정한 평가를 위한 데이터 정규화

**Out of scope:**
- 실시간 알림/보고 (별도 Phase)
- 자동화된 리포트 이메일 발송 (별도 Phase)
- 성과 기반 자동 보상/인센티브 (미정)
</domain>

<decisions>
## Implementation Decisions

### 성과 메트릭 범위

**핵심 메트릭: 학업 성적 향상률**
- 점수 변화 기반 계산 (100점 → 120점 = +20점 향상)
- 성적 이력 저장 필요 (GradeHistory 모델)
- 시간에 따른 추이 분석 (선 그래프)

**부가 메트릭 1: 상담 활동**
- 상담 횟수 및 총 상담 시간 추적
- 수동 입력 방식: 선생님이 상담 후 직접 기록
- CounselingSession 모델 필요 (studentId, teacherId, duration, topics, notes, date)

**부가 메트릭 2: 학생 만족도**
- 수시 피드백 방식: 상담/분석 후 즉시 간단 평가
- 1-5점 또는 만족/보통/불만족 단순 척도
- SatisfactionRating 모델 필요 (studentId, teacherId, rating, context, date)

### 시각화 방식

**주요 뷰 구성**
- 개별 선생님 대시보드가 메인 뷰
- 원장/팀장이 특정 선생님을 선택하여 상세 성과 확인
- 팀 전체 비교는 별도 탭/페이지로 제공

**차트 유형**
- AI(Claude)가 데이터 특성에 맞게 최적의 차트 선택
- 시계열 데이터 → 선 그래프
- 비교 데이터 → 바 차트
- 다차원 요약 → 레이더 차트

**시간 단위**
- 사용자가 주간/월간/학기/연간 선택 가능 (드롭다운)
- 기본값: 학기 중심 (1학기/2학기)

**레이아웃 구성**
- 탭으로 분리: 개요 / 성적 / 상담 / 만족도
- 각 탭에서 해당 영역의 상세 차트와 통계 제공
- "개요" 탭에서 핵심 KPI 요약 보여주기

### Claude's Discretion

**다음 사항은 구현 단계에서 Claude가 결정:**
- 정확한 차트 라이브러리 설정 (Recharts 세부 구성)
- 색상 팔레트 및 테마
- 반응형 레이아웃 세부 사항
- 로딩 상태 및 에러 상태 디자인
- 데이터가 부족할 때의 Empty State 처리
- 상담/만족도 입력 폼의 구체적인 필드 구성
</decisions>

<specifics>
## Specific Ideas

**데이터 모델 추가 필요:**
```prisma
// 성적 이력
model GradeHistory {
  id          String   @id @default(cuid())
  studentId   String
  grade       Int      // 시험 점수
  testName    String   // 시험명 (예: "1학기 중간고사")
  testDate    DateTime
  createdAt   DateTime @default(now())
  student     Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  @@index([studentId, testDate])
}

// 상담 세션
model CounselingSession {
  id          String   @id @default(cuid())
  studentId   String
  teacherId   String
  duration    Int      // 분 단위
  topics      String[] // 상담 주제 태그
  notes       String?  // 상담 내용 요약
  date        DateTime
  createdAt   DateTime @default(now())
  student     Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  teacher     Teacher  @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  @@index([teacherId, date])
  @@index([studentId])
}

// 만족도 평가
model SatisfactionRating {
  id          String   @id @default(cuid())
  studentId   String
  teacherId   String
  rating      Int      // 1-5
  context     String   // "상담 후", "분석 후" 등
  date        DateTime @default(now())
  student     Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  teacher     Teacher  @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  @@index([teacherId, date])
}
```

**대시보드 탭 구성:**
1. **개요 탭:**
   - KPI 카드 (평균 성적 향상률, 총 상담 횟수, 평균 만족도)
   - 최근 6개월 성적 추이 미니 차트
   - 담당 학생 목록 요약

2. **성적 탭:**
   - 학생별 성적 변화 상세 차트
   - 학급/학교 평균과의 비교 (있는 경우)
   - 상위/하위 학생 리스트

3. **상담 탭:**
   - 월별 상담 횟수/시간 추이
   - 상담 주제 분포 (파이 차트)
   - 최근 상담 이력 테이블

4. **만족도 탭:**
   - 시간에 따른 만족도 추이
   - 만족도 분포 (히스토그램)
   - 피드백 코멘트 리스트
</specifics>

<deferred>
## Deferred Ideas

**Phase 범위를 벗어나는 아이디어 (추후 Phase로):**
- 실시간 성과 알림 (원장에게 성적 급등/급락 알림)
- 주간/월간 자동 리포트 이메일 발송
- 성과 기반 선생님 등급/보상 자동화
- 학생 출석률과 성과의 상관관계 분석
- AI 기반 선생님 개선 제안 ("상담 횟수를 늘리면 성적이 향상될 가능성")

**None of these are in scope for Phase 14.**
</deferred>

---

*Phase: 14-performance-analytics-team-insights*
*Context gathered: 2026-01-31*
