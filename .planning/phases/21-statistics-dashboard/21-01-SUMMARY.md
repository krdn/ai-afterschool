---
phase: 21-statistics-dashboard
plan: 01
subsystem: statistics-backend
tags: [server-actions, statistics, prisma, rbac]
requires: [phase-14-performance-analysis, phase-17-reservation-actions]
provides: [counseling-stats-actions, statistics-types]
affects: [21-02-dashboard-cards, 21-03-chart-components]
tech-stack:
  added:
    - date-fns: "날짜 범위 계산 (startOfMonth, endOfMonth, subMonths)"
  patterns:
    - "Prisma groupBy 패턴 대신 findMany + Map 집계 사용"
    - "RBAC verifySession + getRBACPrisma 표준 패턴"
    - "Prisma.CounselingSessionWhereInput으로 타입 안전성 확보"
key-files:
  created:
    - src/types/statistics.ts: "통계 타입 정의 (5개 인터페이스, 2개 타입)"
    - src/lib/actions/counseling-stats.ts: "상담 통계 Server Actions (4개 액션 + 유틸 1개)"
  modified: []
decisions:
  - context: "Prisma groupBy vs findMany + Map 집계"
    decision: "findMany + Map 집계 선택"
    reasoning: "groupBy는 include를 지원하지 않아 teacher.name을 가져올 수 없음. findMany로 모든 데이터를 가져온 후 JavaScript Map으로 집계하는 방식이 더 유연함."
    alternatives:
      - "Prisma groupBy + 별도 teacher 조회"
      - "Raw SQL로 직접 JOIN 쿼리"
  - context: "빈 월 데이터 처리"
    decision: "getMonthlyTrendAction에서 빈 월도 0으로 초기화하여 반환"
    reasoning: "차트에서 연속적인 추이를 표시하려면 데이터가 없는 월도 count: 0으로 표시해야 함. date-fns의 subMonths로 빈 월 구조를 미리 생성."
    impact: "프론트엔드에서 추가 전처리 없이 바로 차트에 사용 가능"
  - context: "TypeDistribution percentage 계산"
    decision: "Server Action에서 percentage를 계산하여 반환 (소수점 1자리)"
    reasoning: "프론트엔드에서 매번 계산하는 것보다 서버에서 한 번 계산하는 것이 효율적. percentage는 반올림하여 소수점 1자리까지 표시."
    impact: "클라이언트 로직 단순화, 일관된 반올림 규칙 적용"
metrics:
  duration: "3분 51초"
  completed: "2026-02-04"
---

# Phase 21 Plan 01: 상담 통계 Server Actions 구현 Summary

**One-liner:** Prisma 쿼리 기반 상담 통계 Server Actions 4개 구현 (선생님별/학생별/유형별/월별 집계) + 타입 정의

## Overview

Phase 21 대시보드의 데이터 소스 역할을 하는 Server Actions를 구축했습니다. 기존 Phase 14의 analytics.ts 패턴을 참조하여 RBAC이 적용된 통계 집계 로직을 구현했습니다.

**구현된 기능:**
1. 선생님별 월간 상담 횟수 및 유형별 분포
2. 학생별 누적 상담 횟수 및 마지막 상담 날짜
3. 상담 유형별 분포 (비율 계산 포함)
4. 월별 상담 추이 (빈 월 포함, 유형별 세부 분포 선택적)

**핵심 패턴:**
- verifySession + getRBACPrisma로 권한 기반 데이터 조회
- Prisma.CounselingSessionWhereInput으로 타입 안전성 확보
- date-fns로 날짜 범위 계산 (startOfMonth, endOfMonth, subMonths)

## Objective Results

**Original objective:**
> 상담 통계 Server Actions 및 타입 정의 구현. Phase 21 대시보드의 데이터 소스 역할을 하는 Server Actions를 생성합니다. 선생님별/학생별 통계, 유형별 분포, 월별 추이 데이터를 Prisma 쿼리로 집계합니다.

**What was delivered:**
- ✅ src/types/statistics.ts: 5개 인터페이스 + 2개 타입 정의
- ✅ src/lib/actions/counseling-stats.ts: 4개 Server Actions + 1개 유틸 함수
- ✅ RBAC 적용: TEACHER는 자신의 데이터만, TEAM_LEADER는 팀 내, MANAGER/DIRECTOR는 전체 조회
- ✅ 타입 체크 및 Lint 통과
- ✅ 빌드 성공

**Variance:** 계획대로 정확히 구현되었습니다. Prisma groupBy 대신 findMany + Map 집계 패턴을 사용한 것은 더 나은 유연성을 위한 선택입니다.

## Tasks Completed

### Task 1: 통계 타입 정의 생성
**Status:** ✅ Complete
**Output:** src/types/statistics.ts (57 lines)

**What was built:**
- TeacherMonthlyStats: 선생님별 월간 통계 (teacherId, teacherName, year, month, sessionCount, typeBreakdown)
- StudentCumulativeStats: 학생별 누적 통계 (studentId, studentName, totalSessions, lastSessionDate, typeBreakdown)
- TypeDistribution: 유형별 분포 (type, count, percentage)
- MonthlyTrend: 월별 추이 (year, month, label, count, byType)
- DatePreset: 날짜 프리셋 ('1M' | '3M' | '6M' | '1Y')
- DateRange: 날짜 범위 (start, end)

**Verification:** npx tsc --noEmit 통과

**Commit:** d156833

---

### Task 2: 상담 통계 Server Actions 구현
**Status:** ✅ Complete
**Output:** src/lib/actions/counseling-stats.ts (382 lines)

**What was built:**

1. **getTeacherMonthlyStatsAction(params?: { dateFrom?, dateTo? })**
   - 선생님별 월간 상담 횟수 집계
   - 유형별 세부 분포 포함 (typeBreakdown)
   - RBAC: TEACHER는 자신만, TEAM_LEADER는 팀 내, MANAGER/DIRECTOR는 전체
   - 정렬: 최신 연월순 → 선생님 이름순

2. **getStudentCumulativeStatsAction(params?: { teacherId? })**
   - 학생별 누적 상담 횟수 집계
   - 마지막 상담 날짜 포함
   - RBAC: TEACHER는 자신 담당 학생만 조회 가능
   - 정렬: 상담 횟수 내림차순

3. **getCounselingTypeDistributionAction(params?: { dateFrom?, dateTo?, teacherId? })**
   - 상담 유형별 분포 (ACADEMIC, CAREER, PSYCHOLOGICAL, BEHAVIORAL)
   - percentage 계산 포함 (소수점 1자리)
   - RBAC: TEACHER는 자신의 상담만
   - 4개 유형 모두 0이라도 반환 (빈 상태 처리 용이)

4. **getMonthlyTrendAction(params?: { months?, teacherId? })**
   - 월별 상담 추이 (기본값 6개월)
   - 빈 월도 count: 0으로 초기화하여 반환 (차트 연속성 확보)
   - byType으로 유형별 세부 분포 포함 (optional)
   - RBAC: TEACHER는 자신의 상담만
   - 정렬: 시간순 (오래된 월부터)

5. **getDateRangeFromPreset(preset: DatePreset): DateRange**
   - 유틸리티 함수 (export)
   - '1M' → 최근 1개월, '3M' → 3개월, '6M' → 6개월, '1Y' → 1년
   - date-fns의 startOfMonth, endOfMonth, subMonths 활용

**RBAC 구현:**
- verifySession()으로 세션 확인
- getRBACPrisma(session)으로 RBAC 적용된 Prisma 인스턴스 획득
- TEACHER는 자신의 데이터만, teacherId 필터 강제 검증

**타입 안전성:**
- Prisma.CounselingSessionWhereInput으로 whereClause 타입 지정
- ESLint `no-explicit-any` 규칙 준수

**Verification:**
- npx tsc --noEmit 통과
- npm run lint 통과 (미사용 import 수정 후)
- npm run build 성공

**Commit:** 6d675a1, c8c7dd1

---

## Technical Details

### Architecture Decisions

**1. Prisma groupBy 대신 findMany + Map 집계**
- groupBy는 include를 지원하지 않아 teacher.name 등 관련 데이터를 가져올 수 없음
- findMany로 필요한 데이터를 모두 조회한 후 JavaScript Map으로 집계
- 장점: 유연한 데이터 변환, 복잡한 집계 로직 가능
- 단점: 대용량 데이터 시 메모리 사용량 증가 (현재 규모에서는 문제 없음)

**2. 빈 월 데이터 초기화**
- getMonthlyTrendAction에서 요청한 months만큼 빈 월 구조를 미리 생성
- 실제 데이터로 덮어쓰는 방식
- 프론트엔드에서 추가 전처리 없이 바로 Recharts에 사용 가능

**3. Percentage 계산**
- getCounselingTypeDistributionAction에서 서버 사이드에서 계산
- Math.round((count / total) * 1000) / 10으로 소수점 1자리 반올림
- 클라이언트 로직 단순화, 일관된 반올림 규칙

### Implementation Patterns

**RBAC 패턴 (Phase 11-02 표준):**
```typescript
const session = await verifySession()
if (!session) {
  return { success: false, error: "인증이 필요합니다." }
}

const rbacDb = getRBACPrisma(session)

// RBAC이 자동 적용된 Prisma 인스턴스 사용
const sessions = await rbacDb.counselingSession.findMany({ ... })
```

**날짜 범위 계산 패턴:**
```typescript
import { startOfMonth, endOfMonth, subMonths } from "date-fns"

const months = 6
const now = new Date()
const startDate = startOfMonth(subMonths(now, months - 1))
const endDate = endOfMonth(now)
```

**타입 안전한 whereClause 패턴:**
```typescript
const whereClause: Prisma.CounselingSessionWhereInput = {}

if (params?.dateFrom || params?.dateTo) {
  whereClause.sessionDate = {}
  if (params.dateFrom) {
    whereClause.sessionDate.gte = new Date(params.dateFrom)
  }
  if (params.dateTo) {
    whereClause.sessionDate.lte = new Date(params.dateTo)
  }
}
```

### API Examples

**선생님별 월간 통계 조회:**
```typescript
const result = await getTeacherMonthlyStatsAction({
  dateFrom: "2026-01-01",
  dateTo: "2026-01-31"
})

if (result.success) {
  console.log(result.data)
  // [
  //   {
  //     teacherId: "...",
  //     teacherName: "김선생",
  //     year: 2026,
  //     month: 1,
  //     sessionCount: 15,
  //     typeBreakdown: { ACADEMIC: 8, CAREER: 4, PSYCHOLOGICAL: 2, BEHAVIORAL: 1 }
  //   },
  //   ...
  // ]
}
```

**학생별 누적 통계 조회:**
```typescript
const result = await getStudentCumulativeStatsAction({
  teacherId: "teacher-id-123" // optional
})

if (result.success) {
  console.log(result.data)
  // [
  //   {
  //     studentId: "...",
  //     studentName: "홍길동",
  //     totalSessions: 12,
  //     lastSessionDate: new Date("2026-02-03"),
  //     typeBreakdown: { ACADEMIC: 7, CAREER: 3, PSYCHOLOGICAL: 2, BEHAVIORAL: 0 }
  //   },
  //   ...
  // ]
}
```

**상담 유형별 분포 조회:**
```typescript
const result = await getCounselingTypeDistributionAction({
  dateFrom: "2026-01-01",
  dateTo: "2026-02-04",
  teacherId: "teacher-id-123"
})

if (result.success) {
  console.log(result.data)
  // [
  //   { type: "ACADEMIC", count: 45, percentage: 52.3 },
  //   { type: "CAREER", count: 20, percentage: 23.3 },
  //   { type: "PSYCHOLOGICAL", count: 15, percentage: 17.4 },
  //   { type: "BEHAVIORAL", count: 6, percentage: 7.0 }
  // ]
}
```

**월별 추이 조회:**
```typescript
const result = await getMonthlyTrendAction({
  months: 3,
  teacherId: "teacher-id-123"
})

if (result.success) {
  console.log(result.data)
  // [
  //   {
  //     year: 2025,
  //     month: 12,
  //     label: "2025-12",
  //     count: 8,
  //     byType: { ACADEMIC: 4, CAREER: 2, PSYCHOLOGICAL: 1, BEHAVIORAL: 1 }
  //   },
  //   {
  //     year: 2026,
  //     month: 1,
  //     label: "2026-01",
  //     count: 0,
  //     byType: { ACADEMIC: 0, CAREER: 0, PSYCHOLOGICAL: 0, BEHAVIORAL: 0 }
  //   },
  //   {
  //     year: 2026,
  //     month: 2,
  //     label: "2026-02",
  //     count: 15,
  //     byType: { ACADEMIC: 8, CAREER: 4, PSYCHOLOGICAL: 2, BEHAVIORAL: 1 }
  //   }
  // ]
}
```

## Next Phase Readiness

**What's ready for next phase:**
- ✅ 4개 Server Actions가 export되어 대시보드 컴포넌트에서 호출 가능
- ✅ 타입 정의가 완료되어 TypeScript 자동완성 지원
- ✅ RBAC이 적용되어 권한 기반 데이터 조회 보장
- ✅ date-fns가 설치되어 날짜 필터링 유틸리티 사용 가능

**Blockers:** None

**Concerns:**
- 대용량 데이터 시 findMany + Map 집계의 성능 이슈 가능성 (현재 규모에서는 문제 없음, 추후 페이지네이션 고려)
- 빈 월 초기화 로직이 getMonthlyTrendAction에만 적용됨 (다른 Actions는 데이터 있는 항목만 반환)

**Next steps (Plan 21-02):**
- StatisticsCards 컴포넌트 구현 (4개 요약 카드)
- getTeacherMonthlyStatsAction과 getMonthlyTrendAction 호출하여 현황 표시

## Decisions Made

| Decision | Rationale | Impact | Alternatives Considered |
|----------|-----------|--------|-------------------------|
| Prisma groupBy 대신 findMany + Map 집계 | groupBy는 include를 지원하지 않아 관련 데이터(teacher.name 등)를 가져올 수 없음 | 코드가 약간 길어지지만 유연성 확보, 복잡한 집계 로직 가능 | Prisma groupBy + 별도 teacher 조회, Raw SQL JOIN |
| 빈 월 데이터 초기화 (getMonthlyTrendAction) | 차트에서 연속적인 추이를 표시하려면 데이터가 없는 월도 표시 필요 | 프론트엔드에서 추가 전처리 없이 바로 Recharts에 사용 가능 | 프론트엔드에서 빈 월 채우기 |
| Server-side percentage 계산 | 클라이언트에서 매번 계산하는 것보다 서버에서 한 번 계산이 효율적 | 일관된 반올림 규칙 적용, 클라이언트 로직 단순화 | 클라이언트 사이드 계산 |
| Prisma.CounselingSessionWhereInput 타입 사용 | ESLint no-explicit-any 규칙 준수, 타입 안전성 확보 | 컴파일 타임 오류 검출, IDE 자동완성 지원 | any 타입 사용 (ESLint 경고 발생) |

## Deviations from Plan

**Auto-fixed Issues:**
None - 계획대로 정확히 구현되었습니다.

**Architecture/Implementation Changes:**
- Prisma groupBy 대신 findMany + Map 집계 사용 (더 나은 유연성)

## Lessons Learned

### What Went Well
- Phase 14의 analytics.ts 패턴 재사용으로 빠른 구현
- Prisma.CounselingSessionWhereInput으로 타입 안전성 확보
- date-fns의 startOfMonth/endOfMonth 패턴이 날짜 범위 계산에 효과적

### What Could Be Improved
- groupBy 패턴 대신 findMany + Map 집계를 사용했는데, 대용량 데이터에서는 성능 이슈 가능 (추후 모니터링 필요)

### Surprises
- Prisma groupBy가 include를 지원하지 않아서 findMany + Map 집계로 전환 필요
- 빈 월 초기화 로직이 의외로 코드를 많이 단순화시킴 (프론트엔드에서 처리 안 해도 됨)

## Related Work

**Depends on:**
- Phase 11-02: RBAC Prisma Extensions (verifySession, getRBACPrisma)
- Phase 14: PerformanceDashboard (analytics.ts 패턴 참조)
- Phase 16: CounselingSession 모델 (Prisma schema)
- Phase 17: Reservation Server Actions (RBAC 패턴 참조)

**Enables:**
- Plan 21-02: StatisticsCards 구현 (4개 요약 카드)
- Plan 21-03: CounselingTrendChart (월별 추이 차트)
- Plan 21-04: CounselingTypeChart (유형별 도넛 차트)
- Plan 21-05: TeacherStatsTable (선생님별 테이블)

**Parallel work:**
- None (이 Plan은 다른 Plan의 선행 조건)

## References

**Files:**
- src/types/statistics.ts (created)
- src/lib/actions/counseling-stats.ts (created)
- src/lib/actions/analytics.ts (referenced)
- prisma/schema.prisma (CounselingSession 모델)

**Commits:**
- d156833: feat(21-01): 상담 통계 타입 정의 추가
- 6d675a1: feat(21-01): 상담 통계 Server Actions 구현
- c8c7dd1: fix(21-01): 미사용 db import 제거

**Documentation:**
- .planning/phases/21-statistics-dashboard/21-CONTEXT.md
- .planning/phases/21-statistics-dashboard/21-RESEARCH.md
- Phase 14 PerformanceDashboard 패턴

---

**Completed:** 2026-02-04
**Duration:** 3분 51초
**Plan Type:** execute
**Autonomous:** true
