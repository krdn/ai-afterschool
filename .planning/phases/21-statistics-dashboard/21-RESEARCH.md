# Phase 21: Statistics & Dashboard - Research

**Researched:** 2026-02-04
**Domain:** Dashboard development, data visualization, statistics aggregation
**Confidence:** HIGH

## Summary

상담 통계 및 후속 조치 대시보드를 구현하기 위한 연구입니다. Phase 14에서 이미 Recharts를 도입했으며, 이번 Phase에서는 도넛 차트, 영역 차트를 추가하고 CSV 내보내기 및 날짜 필터링 기능을 구현합니다.

핵심 기술 스택은 이미 프로젝트에 존재하며 검증되었습니다:
- **Recharts 3.7.0**: 라인 차트, 영역 차트, 도넛 차트
- **date-fns 4.1.0**: 날짜 범위 필터링 및 계산
- **lucide-react 0.563.0**: 대시보드 아이콘
- **shadcn/ui**: Card, Badge, Select 등 UI 컴포넌트

Phase 14의 PerformanceDashboard 패턴을 재사용하되, 상담 도메인에 맞게 확장합니다. CSV 내보내기는 외부 라이브러리 없이 Blob API로 구현하며, 날짜 필터는 date-fns의 startOfMonth/endOfMonth를 활용합니다.

**Primary recommendation:** Phase 14의 검증된 Recharts 패턴을 재사용하고, 도넛 차트(innerRadius 사용)와 영역 차트(AreaChart 컴포넌트)를 추가하며, CSV 내보내기는 Blob API로 구현합니다.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | 3.7.0 | 데이터 시각화 (차트) | Phase 14에서 이미 사용 중, React 생태계 표준 |
| date-fns | 4.1.0 | 날짜 계산 및 필터링 | Phase 18-19에서 이미 사용 중, 가볍고 트리 쉐이킹 지원 |
| lucide-react | 0.563.0 | 아이콘 | 프로젝트 전반에서 사용 중, 1000+ 아이콘 제공 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui Card | latest | 카드 레이아웃 | 대시보드 섹션 래핑 |
| shadcn/ui Badge | latest | 상태 표시 | 후속 조치 지연 상태 강조 |
| shadcn/ui Select | latest | 필터 드롭다운 | 기간/선생님/유형 필터 |
| Native Blob API | - | CSV 내보내기 | 외부 라이브러리 불필요 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Blob API (CSV) | react-csv | react-csv는 추가 번들 사이즈, Blob API는 0 의존성 |
| Recharts | Chart.js | Chart.js는 React 네이티브가 아님, Recharts가 더 선언적 |
| date-fns | moment.js | moment.js는 deprecated, date-fns가 더 가볍고 모던 |

**Installation:**
```bash
# 모두 이미 설치됨
npm install recharts date-fns lucide-react
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   └── dashboard/
│       └── statistics/
│           └── page.tsx           # 통계 대시보드 페이지
├── components/
│   ├── dashboard/
│   │   ├── StatisticsCards.tsx    # 요약 카드 4개
│   │   ├── CounselingTrendChart.tsx    # 월별 추이 라인/영역 차트
│   │   ├── CounselingTypeChart.tsx     # 유형별 도넛 차트
│   │   ├── TeacherStatsTable.tsx       # 선생님별 테이블+바
│   │   └── FollowUpList.tsx            # 후속 조치 목록
│   └── ui/
│       └── (shadcn 컴포넌트들)
├── lib/
│   └── actions/
│       └── counseling-stats.ts    # 통계 집계 서버 액션
└── types/
    └── statistics.ts              # 통계 타입 정의
```

### Pattern 1: Dashboard Card Summary Pattern
**What:** 요약 카드를 통해 핵심 메트릭을 한눈에 표시
**When to use:** 대시보드 상단에 KPI 표시 시
**Example:**
```typescript
// Source: Phase 14 PerformanceDashboard.tsx (lines 176-218)
// 기존 패턴 재사용
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
        <Calendar className="w-4 h-4" />
        이번 달 상담
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold">{monthlyCount}</div>
    </CardContent>
  </Card>
  {/* 3개 더 반복 */}
</div>
```

### Pattern 2: Date Range Filter Pattern
**What:** date-fns로 날짜 범위 필터링
**When to use:** 월간/분기별 데이터 필터링 시
**Example:**
```typescript
// Source: date-fns documentation (verified 2026-02-04)
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

function getDateRange(preset: '1M' | '3M' | '6M' | '1Y') {
  const now = new Date();
  const months = { '1M': 1, '3M': 3, '6M': 6, '1Y': 12 }[preset];

  return {
    start: startOfMonth(subMonths(now, months - 1)),
    end: endOfMonth(now)
  };
}

// 데이터 필터링
const filteredData = counselingSessions.filter(session => {
  const sessionDate = new Date(session.sessionDate);
  return sessionDate >= range.start && sessionDate <= range.end;
});
```

### Pattern 3: CSV Export without Library
**What:** Blob API로 CSV 다운로드 구현
**When to use:** 테이블 데이터 내보내기 시
**Example:**
```typescript
// Source: https://dev.to/graciesharma/implementing-csv-data-export-in-react-without-external-libraries-3030
function exportToCSV(data: CounselingSession[], filename: string) {
  // CSV 헤더 및 데이터 변환
  const csvString = [
    ['날짜', '학생', '선생님', '유형', '시간(분)', '만족도'],
    ...data.map(item => [
      new Date(item.sessionDate).toLocaleDateString('ko-KR'),
      item.student.name,
      item.teacher.name,
      item.type,
      item.duration,
      item.satisfactionScore || '-'
    ])
  ]
  .map(row => row.join(','))
  .join('\n');

  // BOM 추가 (한글 깨짐 방지)
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvString], { type: 'text/csv;charset=utf-8;' });

  // 다운로드 트리거
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || 'counseling-stats.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
```

### Pattern 4: Recharts Donut Chart Pattern
**What:** PieChart의 innerRadius로 도넛 차트 생성
**When to use:** 비율/분포 표시 시
**Example:**
```typescript
// Source: https://www.geeksforgeeks.org/reactjs/create-a-donut-chart-using-recharts-in-reactjs/
import { PieChart, Pie, Tooltip, Cell, ResponsiveContainer } from 'recharts';

const COUNSELING_TYPE_COLORS = {
  ACADEMIC: '#3b82f6',    // 학습 - 파랑
  CAREER: '#10b981',      // 진로 - 초록
  PSYCHOLOGICAL: '#f59e0b', // 생활 - 주황
  BEHAVIORAL: '#8b5cf6'   // 기타 - 보라
};

<ResponsiveContainer width="100%" height={300}>
  <PieChart>
    <Pie
      data={typeDistribution}
      dataKey="count"
      nameKey="type"
      cx="50%"
      cy="50%"
      outerRadius={100}
      innerRadius={60}  // 도넛 효과
      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
    >
      {typeDistribution.map((entry, index) => (
        <Cell key={`cell-${index}`} fill={COUNSELING_TYPE_COLORS[entry.type]} />
      ))}
    </Pie>
    <Tooltip />
  </PieChart>
</ResponsiveContainer>
```

### Pattern 5: Line/Area Chart Toggle Pattern
**What:** 같은 데이터를 LineChart ↔ AreaChart로 전환
**When to use:** 사용자에게 시각화 옵션 제공 시
**Example:**
```typescript
// Source: Phase 14 GradeTrendChart.tsx 패턴 확장
import { LineChart, AreaChart, Line, Area, XAxis, YAxis } from 'recharts';

const [chartType, setChartType] = useState<'line' | 'area'>('line');

const ChartComponent = chartType === 'line' ? LineChart : AreaChart;
const DataComponent = chartType === 'line' ? Line : Area;

<ResponsiveContainer width="100%" height={300}>
  <ChartComponent data={trendData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="month" />
    <YAxis />
    <Tooltip />
    <DataComponent
      type="monotone"
      dataKey="count"
      stroke="#3b82f6"
      fill={chartType === 'area' ? '#3b82f6' : undefined}
      fillOpacity={chartType === 'area' ? 0.6 : undefined}
    />
  </ChartComponent>
</ResponsiveContainer>
```

### Pattern 6: Follow-Up Status Badge Pattern
**What:** 지연 상태를 시각적으로 강조
**When to use:** 후속 조치 목록 표시 시
**Example:**
```typescript
// Phase 18-19 Badge 컴포넌트 활용
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';

function getFollowUpBadge(followUpDate: Date | null, completed: boolean) {
  if (completed) {
    return <Badge variant="outline">완료</Badge>;
  }

  if (!followUpDate) {
    return <Badge variant="secondary">없음</Badge>;
  }

  const isOverdue = new Date() > followUpDate;

  if (isOverdue) {
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        지연
      </Badge>
    );
  }

  return <Badge variant="default">예정</Badge>;
}
```

### Anti-Patterns to Avoid
- **ResponsiveContainer 없이 차트 렌더링**: 부모 높이가 없으면 차트가 안 보임
- **CSV 생성 시 BOM 누락**: 한글이 깨져서 엑셀에서 안 보임
- **대시보드 카드가 5개 이상**: 초기 뷰가 복잡해져 UX 저하
- **로딩 상태 없이 빈 차트 표시**: 데이터 로딩 중인지 없는지 구분 불가

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 날짜 범위 계산 | 수동 Date 연산 | date-fns startOfMonth/endOfMonth | 타임존, 윤년, DST 처리 복잡 |
| CSV 생성 | 문자열 concat | Blob API + BOM | 특수문자, 줄바꿈, 인코딩 처리 |
| 차트 반응형 | 직접 resize 리스너 | ResponsiveContainer | 성능 최적화, 정확한 크기 계산 |
| 아이콘 | SVG 직접 임포트 | lucide-react | 트리 쉐이킹, 일관된 스타일 |

**Key insight:** 날짜 계산과 CSV 생성은 간단해 보이지만 엣지 케이스가 많습니다. 검증된 라이브러리와 표준 API를 사용하세요.

## Common Pitfalls

### Pitfall 1: ResponsiveContainer Height Issue
**What goes wrong:** 차트가 렌더링되지 않거나 높이가 0으로 표시됨
**Why it happens:** ResponsiveContainer는 부모의 명시적 높이가 필요한데, div에 height를 지정 안 함
**How to avoid:** ResponsiveContainer의 부모에 height를 명시하거나, ResponsiveContainer에 직접 height 지정
**Warning signs:**
- 차트 컴포넌트는 렌더되는데 화면에 안 보임
- 브라우저 개발자 도구에서 height: 0px로 표시

```typescript
// ❌ Bad - 부모 높이 없음
<Card>
  <CardContent>
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>...</LineChart>
    </ResponsiveContainer>
  </CardContent>
</Card>

// ✅ Good - 명시적 높이 지정
<Card>
  <CardContent>
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>...</LineChart>
    </ResponsiveContainer>
  </CardContent>
</Card>

// ✅ Good - 부모에 높이 지정
<Card>
  <CardContent className="h-[300px]">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>...</LineChart>
    </ResponsiveContainer>
  </CardContent>
</Card>
```

### Pitfall 2: CSV 한글 깨짐
**What goes wrong:** CSV 다운로드 후 엑셀에서 열면 한글이 깨짐
**Why it happens:** BOM(Byte Order Mark)이 없어서 인코딩을 UTF-8로 인식 못함
**How to avoid:** CSV 문자열 앞에 `\uFEFF` (BOM) 추가
**Warning signs:**
- CSV 파일이 생성되지만 한글이 물음표나 깨진 문자로 표시
- 메모장에서는 보이는데 엑셀에서만 깨짐

```typescript
// ❌ Bad - BOM 없음
const blob = new Blob([csvString], { type: 'text/csv' });

// ✅ Good - BOM 추가
const BOM = '\uFEFF';
const blob = new Blob([BOM + csvString], { type: 'text/csv;charset=utf-8;' });
```

### Pitfall 3: 날짜 비교 시 시간 무시 안 함
**What goes wrong:** 같은 날짜인데 시간 때문에 필터에서 제외됨
**Why it happens:** Date 객체는 시간까지 포함하므로, `sessionDate === today`는 거의 false
**How to avoid:** date-fns의 `isSameDay`, `startOfDay`, `endOfDay` 사용
**Warning signs:**
- "오늘" 필터가 비어 있음
- 날짜 범위 끝 날짜의 데이터가 누락됨

```typescript
// ❌ Bad - 시간 포함 비교
const today = new Date();
const todaySessions = sessions.filter(s => s.sessionDate >= today);

// ✅ Good - startOfDay/endOfDay 사용
import { startOfDay, endOfDay } from 'date-fns';

const todayStart = startOfDay(new Date());
const todayEnd = endOfDay(new Date());
const todaySessions = sessions.filter(s => {
  const date = new Date(s.sessionDate);
  return date >= todayStart && date <= todayEnd;
});

// ✅ Better - isSameDay 사용
import { isSameDay } from 'date-fns';

const todaySessions = sessions.filter(s =>
  isSameDay(new Date(s.sessionDate), new Date())
);
```

### Pitfall 4: Recharts 성능 - 불필요한 리렌더
**What goes wrong:** 차트가 있는 페이지가 느려짐
**Why it happens:** 차트 데이터나 설정 객체를 매 렌더마다 재생성
**How to avoid:** useMemo로 차트 데이터 메모이제이션
**Warning signs:**
- 필터 변경 시 지연 발생
- React DevTools Profiler에서 LineChart 리렌더 횟수 많음

```typescript
// ❌ Bad - 매번 새 배열 생성
function Chart({ sessions }) {
  const data = sessions.map(s => ({ date: s.date, count: s.count }));
  return <LineChart data={data}>...</LineChart>;
}

// ✅ Good - useMemo로 메모이제이션
import { useMemo } from 'react';

function Chart({ sessions }) {
  const data = useMemo(() =>
    sessions.map(s => ({ date: s.date, count: s.count })),
    [sessions]
  );
  return <LineChart data={data}>...</LineChart>;
}
```

### Pitfall 5: Empty State vs Loading State 혼동
**What goes wrong:** 데이터 로딩 중인지 없는지 사용자가 구분 못함
**Why it happens:** 로딩 상태 처리 누락
**How to avoid:** 별도 loading prop으로 스켈레톤 표시
**Warning signs:**
- 페이지 로드 시 "데이터 없음" 깜빡임
- 사용자가 데이터가 없는지 로딩 중인지 혼란

```typescript
// ❌ Bad - 로딩과 빈 상태 구분 없음
function Chart({ data }) {
  if (!data || data.length === 0) {
    return <div>데이터가 없습니다</div>;
  }
  return <LineChart data={data}>...</LineChart>;
}

// ✅ Good - 로딩 상태 분리
function Chart({ data, loading }) {
  if (loading) {
    return <div className="h-[300px] bg-gray-100 animate-pulse rounded" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-gray-500">
        데이터가 충분하지 않습니다
      </div>
    );
  }

  return <LineChart data={data}>...</LineChart>;
}
```

## Code Examples

Verified patterns from official sources:

### Dashboard Summary Card with Icon
```typescript
// Source: Phase 14 PerformanceDashboard.tsx + lucide-react patterns
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, AlertCircle, TrendingUp } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

function StatCard({ title, value, icon, variant = 'default' }: StatCardProps) {
  const colorClass = {
    default: 'text-gray-900',
    success: 'text-green-600',
    warning: 'text-orange-600',
    danger: 'text-red-600'
  }[variant];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${colorClass}`}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

// Usage
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  <StatCard
    title="이번 달 상담"
    value={32}
    icon={<Calendar className="w-4 h-4" />}
  />
  <StatCard
    title="대기 예약"
    value={5}
    icon={<Users className="w-4 h-4" />}
  />
  <StatCard
    title="지연 후속조치"
    value={3}
    icon={<AlertCircle className="w-4 h-4" />}
    variant="danger"
  />
  <StatCard
    title="완료율"
    value="87%"
    icon={<TrendingUp className="w-4 h-4" />}
    variant="success"
  />
</div>
```

### Date Range Preset Filter
```typescript
// Source: date-fns documentation + Phase 14 pattern
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

type DatePreset = '1M' | '3M' | '6M' | '1Y';

interface DateRange {
  start: Date;
  end: Date;
}

function getDateRangeFromPreset(preset: DatePreset): DateRange {
  const now = new Date();
  const monthsMap: Record<DatePreset, number> = {
    '1M': 1,
    '3M': 3,
    '6M': 6,
    '1Y': 12
  };

  const months = monthsMap[preset];
  const startDate = startOfMonth(subMonths(now, months - 1));
  const endDate = endOfMonth(now);

  return { start: startDate, end: endDate };
}

function DateRangeFilter({ value, onChange }: {
  value: DatePreset;
  onChange: (preset: DatePreset) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as DatePreset)}>
      <SelectTrigger className="w-[150px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="1M">최근 1개월</SelectItem>
        <SelectItem value="3M">최근 3개월</SelectItem>
        <SelectItem value="6M">최근 6개월</SelectItem>
        <SelectItem value="1Y">최근 1년</SelectItem>
      </SelectContent>
    </Select>
  );
}
```

### Counseling Type Distribution Donut Chart
```typescript
// Source: Recharts donut chart pattern + project schema
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const COUNSELING_TYPE_LABELS: Record<string, string> = {
  ACADEMIC: '학습',
  CAREER: '진로',
  PSYCHOLOGICAL: '생활',
  BEHAVIORAL: '기타'
};

const COUNSELING_TYPE_COLORS: Record<string, string> = {
  ACADEMIC: '#3b82f6',
  CAREER: '#10b981',
  PSYCHOLOGICAL: '#f59e0b',
  BEHAVIORAL: '#8b5cf6'
};

interface TypeDistribution {
  type: string;
  count: number;
}

function CounselingTypeChart({ data }: { data: TypeDistribution[] }) {
  const chartData = data.map(item => ({
    name: COUNSELING_TYPE_LABELS[item.type] || item.type,
    value: item.count,
    type: item.type
  }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>상담 유형별 분포</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              innerRadius={60}
              label={({ name, value }) =>
                `${name}: ${((value / total) * 100).toFixed(1)}%`
              }
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COUNSELING_TYPE_COLORS[entry.type]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [`${value}회`, '']}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

### Follow-Up List with Overdue Highlighting
```typescript
// Source: Project patterns + Badge component
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Calendar, CheckCircle } from 'lucide-react';
import { isBefore, formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface FollowUp {
  id: string;
  studentName: string;
  teacherName: string;
  followUpDate: Date;
  topic: string;
  completed: boolean;
}

function FollowUpList({ items }: { items: FollowUp[] }) {
  const sortedItems = [...items].sort((a, b) =>
    a.followUpDate.getTime() - b.followUpDate.getTime()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>후속 조치 목록</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedItems.map(item => {
            const isOverdue = !item.completed && isBefore(item.followUpDate, new Date());
            const timeAgo = formatDistanceToNow(item.followUpDate, {
              addSuffix: true,
              locale: ko
            });

            return (
              <div
                key={item.id}
                className={`p-3 rounded-lg border ${
                  isOverdue ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {isOverdue && <AlertCircle className="w-4 h-4 text-red-500" />}
                      {item.completed && <CheckCircle className="w-4 h-4 text-green-500" />}
                      <span className="font-medium">{item.studentName}</span>
                      <span className="text-sm text-gray-500">← {item.teacherName}</span>
                    </div>
                    <p className="text-sm text-gray-600">{item.topic}</p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      {timeAgo}
                    </div>
                  </div>
                  <div>
                    {item.completed ? (
                      <Badge variant="outline">완료</Badge>
                    ) : isOverdue ? (
                      <Badge variant="destructive">지연</Badge>
                    ) : (
                      <Badge variant="default">예정</Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {sortedItems.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              후속 조치가 없습니다
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| moment.js | date-fns | 2020+ | 더 작은 번들 사이즈, 트리 쉐이킹 |
| Chart.js | Recharts (React) | 2019+ | React 컴포넌트 모델, 선언적 API |
| react-csv 라이브러리 | Native Blob API | 2023+ | 0 의존성, 더 나은 제어 |
| 복잡한 스켈레톤 라이브러리 | Tailwind animate-pulse | 2021+ | CSS만으로 구현 가능 |

**Deprecated/outdated:**
- **moment.js**: Deprecated, date-fns나 Day.js 사용 권장
- **D3 직접 사용 (React)**: Recharts가 React 래퍼 제공, 더 쉬움
- **react-loading-skeleton 라이브러리**: Tailwind CSS의 animate-pulse로 충분

## Open Questions

Things that couldn't be fully resolved:

1. **Recharts 공식 문서 접근 불가**
   - What we know: GeeksforGeeks와 커뮤니티 예제로 도넛 차트 패턴 확인
   - What's unclear: 최신 Recharts 3.7.0의 새 기능이나 변경사항
   - Recommendation: 기존 Phase 14 패턴이 작동하므로 그대로 사용, 필요시 npm 문서 참조

2. **대용량 데이터 시 성능**
   - What we know: useMemo로 메모이제이션, ResponsiveContainer 최적화
   - What's unclear: 1000개+ 상담 세션을 한 번에 차트에 표시할 때 성능
   - Recommendation: 페이지네이션 또는 월별 집계로 데이터 포인트 줄이기 (계획 단계에서 고려)

3. **CSV 내보내기 시 대용량 파일**
   - What we know: Blob API로 클라이언트 사이드 생성 가능
   - What's unclear: 10,000행+ CSV를 브라우저에서 생성할 때 메모리 문제
   - Recommendation: 현재 범위(최대 1년 데이터)에서는 문제 없음, 미래에 필요하면 서버 사이드 생성으로 전환

## Sources

### Primary (HIGH confidence)
- Phase 14 PerformanceDashboard.tsx - 검증된 Recharts 패턴
- Phase 14 GradeTrendChart.tsx - LineChart 구현 패턴
- Phase 14 MultiSubjectChart.tsx - BarChart 구현 패턴
- prisma/schema.prisma - CounselingSession 모델 구조
- package.json - 설치된 라이브러리 버전 확인

### Secondary (MEDIUM confidence)
- [GeeksforGeeks - Create a Donut Chart using Recharts](https://www.geeksforgeeks.org/reactjs/create-a-donut-chart-using-recharts-in-reactjs/) - 도넛 차트 구현
- [DEV Community - Implementing CSV Data Export in React](https://dev.to/graciesharma/implementing-csv-data-export-in-react-without-external-libraries-3030) - Blob API CSV 내보내기
- [The Road To Enterprise - How to download CSV files in React](https://theroadtoenterprise.com/blog/how-to-download-csv-and-json-files-in-react) - CSV 다운로드 패턴
- [date-fns startOfMonth/endOfMonth - DEV Community](https://dev.to/ilumin/get-first-date-and-last-date-of-months-with-date-fns-45f0) - 날짜 범위 계산
- [Lucide React Guide](https://lucide.dev/guide/packages/lucide-react) - 아이콘 사용법

### Tertiary (LOW confidence)
- WebSearch - Recharts common pitfalls (GitHub issues에서 커뮤니티 문제 확인)
- WebSearch - Dashboard layout best practices 2026 (일반적인 대시보드 UX 패턴)
- WebSearch - React skeleton loading best practices (로딩 상태 UX)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - 모든 라이브러리가 프로젝트에 이미 존재하고 Phase 14에서 검증됨
- Architecture: HIGH - Phase 14의 검증된 패턴을 재사용, 프로젝트 구조에 맞음
- Pitfalls: MEDIUM - Recharts 공식 문서 접근 불가했지만, 커뮤니티 이슈와 기존 코드로 파악

**Research date:** 2026-02-04
**Valid until:** 2026-04-04 (60 days - Recharts는 안정적, 빠른 변화 없음)

---

**Notes:**
- Phase 14의 검증된 Recharts 패턴이 견고하므로 높은 신뢰도로 재사용 가능
- CSV 내보내기는 Blob API로 구현하여 추가 의존성 없음
- 모든 UI 컴포넌트(Card, Badge, Select)는 shadcn/ui로 프로젝트 전반에서 사용 중
- 데이터 모델(CounselingSession, ParentCounselingReservation)은 Prisma schema에 명확히 정의됨
