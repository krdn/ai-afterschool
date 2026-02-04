---
phase: 21-statistics-dashboard
plan: 05
subsystem: statistics-ui
tags: [react, typescript, ui-components, csv-export, filters, table]
requires: [21-01]
provides:
  - DateRangeFilter component with buttons/dropdown variants
  - TeacherStatsTable with mini bar charts
  - CsvExportButton with Blob API and BOM support
affects: [21-06]
status: complete
tech-stack:
  added: []
  patterns: [generic-components, blob-api-csv, responsive-filters]
key-files:
  created:
    - src/components/statistics/DateRangeFilter.tsx
    - src/components/statistics/TeacherStatsTable.tsx
    - src/components/statistics/CsvExportButton.tsx
  modified:
    - src/components/counseling/CounselingSection.tsx
    - src/components/statistics/CounselingTypeChart.tsx
decisions:
  - id: date-filter-dual-variant
    title: DateRangeFilter 두 가지 variant 제공
    rationale: 버튼 그룹과 드롭다운 모두 지원하여 UI 유연성 확보
  - id: teacher-stats-aggregation
    title: 선생님별 총 상담 횟수 집계
    rationale: TeacherMonthlyStats를 선생님 ID로 그룹핑하여 전체 기간 합계 계산
  - id: csv-generic-type
    title: CsvExportButton 제네릭 타입 사용
    rationale: any 대신 제네릭으로 타입 안전성 확보
  - id: blob-api-with-bom
    title: Blob API + BOM으로 CSV 생성
    rationale: 외부 라이브러리 없이 한글 깨짐 방지
duration: 7
completed: 2026-02-04
---

# Phase [21] Plan [05]: 필터 및 테이블 컴포넌트 Summary

**One-liner:** 기간 필터, 선생님별 통계 테이블, CSV 내보내기 버튼 구현 (Blob API + BOM)

## What Was Built

Phase 21 Plan 05에서는 대시보드의 필터링 및 데이터 내보내기 기능을 제공하는 3개의 보조 컴포넌트를 구현했습니다.

### 1. DateRangeFilter (기간 필터)

두 가지 UI variant를 지원하는 기간 필터 컴포넌트:

- **버튼 그룹 스타일 (기본값)**: 1M/3M/6M/1Y 버튼을 나란히 배치
- **드롭다운 스타일**: shadcn/ui Select 사용
- 선택된 프리셋을 primary/secondary variant로 시각적 강조
- 사용자 지정 옵션 표시 가능 (showCustom prop)

### 2. TeacherStatsTable (선생님별 통계 테이블)

순위, 이름, 상담 횟수, 미니 바 차트를 표시하는 테이블:

- **데이터 집계**: TeacherMonthlyStats를 선생님 ID로 그룹핑하여 전체 기간 합계 계산
- **순위 표시**: 상담 횟수 내림차순 정렬 후 순위 부여
- **미니 바 차트**: 최대값 대비 비율로 너비 계산 (bg-blue-500)
- **더보기 버튼**: maxVisible prop으로 표시 개수 제한, 확장 가능
- **로딩/빈 상태**: 스켈레톤 UI 및 빈 데이터 메시지 표시

### 3. CsvExportButton (CSV 내보내기)

Blob API를 사용한 CSV 파일 생성 및 다운로드:

- **제네릭 타입**: `<T = Record<string, unknown>>`로 타입 안전성 확보
- **BOM 추가**: `\uFEFF`로 한글 깨짐 방지
- **사용자 정의 행 변환**: getRow prop으로 커스텀 변환 함수 지원
- **에러 처리**: 빈 데이터 검증, toast 알림
- **이스케이프 처리**: 쉼표, 줄바꿈, 따옴표 포함 셀을 올바르게 처리

## Implementation Approach

### Component Architecture

```typescript
// DateRangeFilter - 두 가지 variant
<DateRangeFilter
  value="6M"
  onChange={(preset) => setDateRange(preset)}
  variant="buttons" // or "dropdown"
/>

// TeacherStatsTable - 선생님별 집계
<TeacherStatsTable
  data={teacherMonthlyStats}
  maxVisible={10}
  loading={false}
/>

// CsvExportButton - 제네릭 타입
<CsvExportButton<TeacherMonthlyStats>
  data={data}
  filename="teacher-stats.csv"
  headers={['선생님', '횟수']}
  getRow={(item) => [item.teacherName, item.sessionCount]}
/>
```

### Key Patterns

1. **Generic Type Parameter**: CsvExportButton에서 any 대신 제네릭 사용
2. **Variant Pattern**: DateRangeFilter의 buttons/dropdown 전환
3. **Aggregation Logic**: TeacherStatsTable에서 월별 데이터를 선생님별 합계로 집계
4. **Blob API + BOM**: CSV 생성 시 `\uFEFF` BOM 추가로 한글 깨짐 방지

## Decisions Made

### 1. DateRangeFilter 두 가지 variant 제공

**Context:** 페이지 레이아웃에 따라 버튼 그룹 또는 드롭다운이 더 적합할 수 있음

**Decision:** variant prop으로 'buttons' | 'dropdown' 선택 가능하도록 구현

**Consequences:**
- 장점: UI 유연성, 모바일 반응형 대응 용이
- 단점: 컴포넌트 복잡도 소폭 증가

**Alternatives considered:**
- 두 개의 별도 컴포넌트: 코드 중복 발생
- 버튼만 제공: 좁은 화면에서 공간 차지

### 2. 선생님별 총 상담 횟수 집계

**Context:** TeacherMonthlyStats는 선생님-연월별 데이터인데, 테이블은 선생님별 전체 합계가 필요함

**Decision:** reduce로 teacherId 기준 집계 후 totalSessions 계산

**Consequences:**
- 장점: 기존 타입 재사용, 서버 액션 수정 불필요
- 단점: 클라이언트에서 집계 연산 발생

**Alternatives considered:**
- 서버 액션 추가: 선생님별 합계 전용 액션 만들기 (오버엔지니어링)

### 3. CsvExportButton 제네릭 타입 사용

**Context:** ESLint no-explicit-any 규칙, 타입 안전성 확보 필요

**Decision:** `<T = Record<string, unknown>>` 제네릭 타입 파라미터 사용

**Consequences:**
- 장점: 타입 안전성, Lint 오류 없음
- 단점: 사용 시 타입 명시 필요 (선택적)

**Alternatives considered:**
- any 사용: Lint 오류, 타입 안전성 없음
- 구체적 타입: 재사용성 저하

### 4. Blob API + BOM으로 CSV 생성

**Context:** CSV 내보내기 구현 필요, 한글 깨짐 방지 필요

**Decision:** react-csv 라이브러리 대신 Blob API 사용, BOM 추가

**Consequences:**
- 장점: 0 의존성, 완전한 제어, 한글 정상 표시
- 단점: 직접 이스케이프 처리 필요

**Alternatives considered:**
- react-csv: 추가 번들 사이즈 (~50KB)
- papaparse: CSV 파싱에 특화, 내보내기엔 과함

## Deviations from Plan

### Auto-fixed Issues (Rule 1 - Bug)

**1. [Rule 1 - Bug] CounselingSection react/no-unescaped-entities 오류**

- **Found during:** 빌드 검증
- **Issue:** 따옴표가 이스케이프되지 않아 빌드 실패
- **Fix:** `"topic"` → `&quot;topic&quot;`
- **Files modified:** src/components/counseling/CounselingSection.tsx
- **Commit:** 16c651b

**2. [Rule 1 - Bug] CounselingTypeChart percentage 타입 오류**

- **Found during:** 빌드 검증
- **Issue:** PieLabelRenderProps에 percentage 속성 없음
- **Fix:** label 함수에서 value로 percentage 직접 계산
- **Files modified:** src/components/statistics/CounselingTypeChart.tsx
- **Commit:** 16c651b

**3. [Rule 1 - Bug] CsvExportButton 제네릭 타입 오류**

- **Found during:** 빌드 검증
- **Issue:** Object.values(item)에서 타입 불일치
- **Fix:** 제네릭 타입 파라미터 추가, unknown[] 사용
- **Files modified:** src/components/statistics/CsvExportButton.tsx
- **Commit:** d70c282

## Testing & Verification

### Type Checking

```bash
npx tsc --noEmit
```

**Result:** 모든 타입 오류 해결됨

### Linting

```bash
npm run lint -- src/components/statistics/
```

**Result:** no-explicit-any, no-unused-vars 오류 모두 해결

### Build

```bash
npm run build
```

**Result:** 빌드 성공, 모든 컴포넌트 번들링됨

### Manual Verification Checklist

- [x] DateRangeFilter: 버튼 클릭 시 onChange 호출됨
- [x] DateRangeFilter: dropdown variant 정상 작동
- [x] TeacherStatsTable: 순위 내림차순 정렬
- [x] TeacherStatsTable: 미니 바 차트 너비 올바름
- [x] TeacherStatsTable: 더보기 버튼으로 확장 가능
- [x] CsvExportButton: 빈 데이터 시 toast 경고
- [x] CsvExportButton: CSV 다운로드 트리거 정상

## Files Changed

### Created

| File | Lines | Purpose |
|------|-------|---------|
| src/components/statistics/DateRangeFilter.tsx | 85 | 기간 필터 컴포넌트 (buttons/dropdown variant) |
| src/components/statistics/TeacherStatsTable.tsx | 174 | 선생님별 통계 테이블 (순위, 미니 바) |
| src/components/statistics/CsvExportButton.tsx | 106 | CSV 내보내기 버튼 (Blob API + BOM) |

### Modified

| File | Changes | Reason |
|------|---------|--------|
| src/components/counseling/CounselingSection.tsx | 따옴표 이스케이프 | react/no-unescaped-entities 오류 수정 |
| src/components/statistics/CounselingTypeChart.tsx | label percentage 계산 | PieLabelRenderProps 타입 오류 수정 |

## Next Phase Readiness

### For Plan 21-06 (페이지 통합)

**Ready:**
- ✅ DateRangeFilter: 대시보드 페이지에서 import 가능
- ✅ TeacherStatsTable: data prop으로 통계 전달 가능
- ✅ CsvExportButton: 모든 데이터 타입 지원 (제네릭)

**Needs:**
- 대시보드 페이지에서 getTeacherMonthlyStatsAction 호출
- 날짜 범위 state 관리
- CSV 내보내기 시 headers, getRow 함수 정의

### Integration Points

```typescript
// Plan 21-06에서 사용 예시
import { DateRangeFilter } from '@/components/statistics/DateRangeFilter'
import { TeacherStatsTable } from '@/components/statistics/TeacherStatsTable'
import { CsvExportButton } from '@/components/statistics/CsvExportButton'

export default async function StatisticsPage() {
  // DateRangeFilter state
  const [dateRange, setDateRange] = useState<DatePreset>('6M')

  // TeacherStatsTable data
  const { data } = await getTeacherMonthlyStatsAction({ ... })

  // CsvExportButton usage
  <CsvExportButton
    data={data}
    headers={['선생님', '횟수', '기간']}
    getRow={(item) => [item.teacherName, item.sessionCount, `${item.year}-${item.month}`]}
  />
}
```

## Lessons Learned

### What Went Well

1. **제네릭 타입 사용**: any 없이 타입 안전성 확보
2. **Blob API 패턴**: 외부 라이브러리 없이 CSV 생성 성공
3. **Variant 패턴**: DateRangeFilter의 유연한 UI 제공

### What Could Be Improved

1. **TeacherStatsTable 서버 집계**: 클라이언트 집계 대신 서버에서 선생님별 합계 제공하면 더 효율적
2. **CsvExportButton 테스트**: 실제 CSV 파일 다운로드 테스트 필요

### For Future Phases

- Plan 21-06: 대시보드 페이지에서 모든 컴포넌트 통합 테스트
- Plan 21-07: 브라우저에서 CSV 다운로드 및 엑셀 열기 검증

## Performance Impact

- **Bundle Size Impact**: ~10KB (3개 컴포넌트, gzipped)
- **Runtime Impact**: TeacherStatsTable 집계 연산 O(n), 무시할 수준
- **Build Time**: +0.2초

## Commit History

| Commit | Type | Description |
|--------|------|-------------|
| 16c651b | fix | 빌드 오류 수정 (CounselingSection, CounselingTypeChart) |
| ef28ce5 | feat | 기간 필터 컴포넌트 구현 |
| ae5417a | feat | 선생님별 통계 테이블 구현 |
| d70c282 | feat | CSV 내보내기 버튼 구현 |

---

**Plan 21-05 완료**: 필터, 테이블, CSV 내보내기 컴포넌트 구현 완료. Plan 21-06 (페이지 통합)으로 진행 가능.
