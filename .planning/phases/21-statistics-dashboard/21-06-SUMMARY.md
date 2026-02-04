---
phase: 21
plan: 06
subsystem: dashboard
tags: [dashboard, statistics, charts, follow-up, server-component]

requires:
  - "21-01: 상담 통계 Server Actions"
  - "21-02: 후속 조치 Server Actions"
  - "21-03: 차트 컴포넌트"
  - "21-04: 후속 조치 목록"
  - "21-05: 필터 및 테이블 컴포넌트"

provides:
  - "/dashboard/statistics 페이지"
  - "2열 그리드 대시보드 레이아웃"
  - "Server Component 데이터 초기화 패턴"

affects:
  - "21-07: 테스트 및 검증 (브라우저 확인 필요)"

tech-stack:
  added: []
  patterns:
    - "Server Component + Client Component 데이터 전달"
    - "날짜 유틸리티 분리 (Server Action 호환)"
    - "타입 가드로 undefined 방지"

key-files:
  created:
    - "src/app/(dashboard)/dashboard/statistics/layout.tsx"
    - "src/app/(dashboard)/dashboard/statistics/page.tsx"
    - "src/components/statistics/StatisticsDashboard.tsx"
    - "src/lib/utils/date-range.ts"
  modified:
    - "src/lib/actions/counseling-stats.ts"

decisions:
  - id: "21-06-layout"
    title: "간단한 wrapper 레이아웃"
    rationale: "(dashboard) 레이아웃을 상속하므로 추가 레이아웃 불필요"
  - id: "21-06-server-init"
    title: "Server Component로 초기 데이터 fetch"
    rationale: "SSR로 빠른 초기 렌더링, SEO 최적화"
  - id: "21-06-date-util"
    title: "getDateRangeFromPreset 유틸리티 분리"
    rationale: "\"use server\" 파일에서 동기 함수 export 불가, 별도 파일로 분리"

metrics:
  duration: 5
  tasks: 3
  commits: 4
  completed: 2026-02-04
---

# Phase 21 Plan 06: 페이지 통합 Summary

**One-liner:** Server Component로 초기 데이터를 fetch하고 2열 그리드 대시보드로 통계와 후속 조치를 통합 표시

## What Was Built

통계 대시보드 페이지를 구현하여 Plan 21-01 ~ 21-05의 모든 컴포넌트를 하나의 대시보드로 통합했습니다.

### 주요 구현 사항

1. **대시보드 레이아웃 (layout.tsx)**
   - Metadata 설정 (title, description)
   - 간단한 wrapper 레이아웃 ((dashboard) 레이아웃 상속)

2. **대시보드 메인 컴포넌트 (StatisticsDashboard.tsx)**
   - 2열 그리드 레이아웃 (왼쪽: 통계/차트, 오른쪽: 후속조치)
   - datePreset 상태로 기간 필터 관리
   - 필터 변경 시 통계 데이터 재fetch (useEffect)
   - 후속 조치 완료 처리 (completeFollowUpAction)
   - CSV 내보내기 데이터 준비
   - 반응형 레이아웃 (모바일: 세로 스택, 데스크탑: 3열 그리드)

3. **통계 대시보드 페이지 (page.tsx)**
   - Server Component로 초기 데이터 fetch
   - 병렬 데이터 로딩 (Promise.all)
   - 요약 카드용 메트릭 계산:
     - 이번 달 상담 횟수
     - 대기 예약 수 (SCHEDULED)
     - 지연 후속조치 수
     - 완료율 (상담 / (상담 + 대기) * 100)
   - StatisticsDashboard로 초기 데이터 전달

4. **날짜 유틸리티 분리 (date-range.ts)**
   - getDateRangeFromPreset 함수를 별도 파일로 분리
   - "use server" 파일에서 동기 함수 export 불가 문제 해결

### 레이아웃 구조

```
┌────────────────────────────────────────────────────────────┐
│ 제목 + 날짜 필터 + CSV 내보내기                              │
├────────────────────────────────────────────────────────────┤
│ [이번 달 상담] [대기 예약] [지연 후속조치] [완료율]          │
├───────────────────────────────────┬────────────────────────┤
│ 월별 상담 추이 차트                 │                        │
├───────────────────────────────────┤  후속 조치 목록         │
│ 유형별 분포 차트                    │  (오늘/이번주/전체)    │
├───────────────────────────────────┤                        │
│ 선생님별 통계 테이블                 │                        │
└───────────────────────────────────┴────────────────────────┘
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Server Action 타입 오류**

- **Found during:** Task 3 (빌드 검증 시)
- **Issue:** `getDateRangeFromPreset` 함수가 "use server" 파일에서 export되어 Server Action으로 인식됨. Next.js는 Server Action이 async 함수여야 한다고 요구하여 빌드 실패.
- **Root cause:** "use server" 파일에서 export되는 모든 함수는 Server Action으로 간주되며, Server Action은 async 함수여야 함. `getDateRangeFromPreset`은 동기 유틸리티 함수이므로 별도 파일로 분리 필요.
- **Fix:**
  - `src/lib/utils/date-range.ts` 생성
  - `getDateRangeFromPreset` 함수를 유틸리티 파일로 이동
  - `counseling-stats.ts`에서 해당 함수 제거
  - `StatisticsDashboard.tsx`, `page.tsx`에서 import 경로 수정
- **Files modified:**
  - `src/lib/actions/counseling-stats.ts` (함수 제거)
  - `src/lib/utils/date-range.ts` (신규 생성)
  - `src/components/statistics/StatisticsDashboard.tsx` (import 경로 변경)
  - `src/app/(dashboard)/dashboard/statistics/page.tsx` (import 경로 변경)
- **Commit:** `817b3ce fix(21-06): Server Action 타입 오류 수정`

**2. [Rule 3 - Blocking] TypeScript 타입 체크 오류**

- **Found during:** Task 3 (빌드 검증 시)
- **Issue:** Server Action의 반환 타입에서 `success && data` 패턴 사용 시 TypeScript가 `data`가 `undefined`일 수 있다고 판단하여 빌드 실패.
- **Fix:**
  - `page.tsx`에서 모든 데이터 추출 시 `success && data` 타입 가드 추가
  - `StatisticsDashboard.tsx`에서 `data!` non-null assertion 추가
  - `followUpResult.success && followUpResult.data` 체크 추가
- **Files modified:**
  - `src/app/(dashboard)/dashboard/statistics/page.tsx`
  - `src/components/statistics/StatisticsDashboard.tsx`
- **Commit:** `817b3ce fix(21-06): Server Action 타입 오류 수정`

## Technical Details

### Server Component 데이터 초기화 패턴

```typescript
// Server Component (page.tsx)
const [res1, res2, res3] = await Promise.all([
  serverAction1(),
  serverAction2(),
  serverAction3(),
]);

const data = (res1.success && res1.data) ? res1.data : defaultValue;

return <ClientComponent initialData={data} />
```

### Client Component 필터링 패턴

```typescript
// Client Component (StatisticsDashboard.tsx)
const [datePreset, setDatePreset] = useState<DatePreset>('6M');

useEffect(() => {
  const fetchData = async () => {
    const dateRange = getDateRangeFromPreset(datePreset);
    const results = await Promise.all([
      getTeacherMonthlyStatsAction({ dateFrom, dateTo }),
      getCounselingTypeDistributionAction({ dateFrom, dateTo }),
    ]);
    // 상태 업데이트
  };
  fetchData();
}, [datePreset]);
```

### 완료율 계산 로직

```typescript
const monthlySessionCount = thisMonthStats.reduce((sum, stat) => sum + stat.sessionCount, 0)
const pendingReservationCount = reservationStats?.SCHEDULED ?? 0
const totalThisMonth = monthlySessionCount + pendingReservationCount
const completionRate = totalThisMonth > 0
  ? Math.round((monthlySessionCount / totalThisMonth) * 100)
  : 0
```

## Testing Notes

1. **타입 체크:** ✅ 통과 (`npm run type-check`)
2. **Lint:** ✅ 통과 (기존 경고만 존재)
3. **빌드:** ✅ 성공 (`npm run build`)
4. **브라우저 테스트:** ⏳ 다음 Plan에서 수행 (21-07)

## Next Phase Readiness

### For Plan 21-07 (테스트 및 검증)

**Ready:**
- `/dashboard/statistics` 페이지 접근 가능
- 모든 컴포넌트 통합 완료
- 필터링 및 데이터 재fetch 로직 구현됨

**Requires:**
- 브라우저에서 페이지 접근 확인
- 요약 카드 4개 표시 확인
- 차트 렌더링 확인 (월별 추이, 유형별 분포)
- 테이블 표시 확인 (선생님별 통계)
- 후속 조치 목록 표시 확인
- 필터 변경 시 차트 업데이트 확인
- 후속 조치 완료 처리 확인

**Blockers:**
- None

## Lessons Learned

1. **"use server" 파일 제약:**
   - "use server" 파일에서 export되는 모든 함수는 Server Action으로 간주됨
   - Server Action은 반드시 async 함수여야 함
   - 동기 유틸리티 함수는 별도 파일로 분리 필요

2. **TypeScript 타입 가드:**
   - Server Action 반환 타입에서 `success` 체크만으로는 `data`의 non-undefined 보장 안 됨
   - `success && data` 패턴 또는 non-null assertion (`data!`) 필요

3. **Server Component 초기화 패턴:**
   - Server Component에서 초기 데이터를 fetch하면 SSR로 빠른 초기 렌더링
   - Client Component는 필터링 등 상호작용만 처리
   - 병렬 fetch (Promise.all)로 성능 최적화

## Metadata

**Completed:** 2026-02-04
**Duration:** ~5 minutes
**Task commits:**
- `7d88765` feat(21-06): 통계 대시보드 레이아웃 생성
- `12b7924` feat(21-06): 대시보드 메인 컴포넌트 구현
- `01da576` feat(21-06): 통계 대시보드 페이지 구현
- `817b3ce` fix(21-06): Server Action 타입 오류 수정

**Files created:** 4
**Files modified:** 2
**Lines added:** ~330
**Tests added:** 0 (브라우저 검증 예정)

---

*Phase: 21-statistics-dashboard*
*Plan: 06*
*Status: ✅ Complete*
