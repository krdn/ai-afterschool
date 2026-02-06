# Phase 23: data-testid Infrastructure - Research

**Researched:** 2026-02-06
**Domain:** E2E Testing Infrastructure (Playwright + React/Next.js)
**Confidence:** HIGH

## Summary

Phase 23은 기존 컴포넌트에 data-testid 속성을 추가하여 E2E 테스트의 안정성을 확보하는 단계입니다. 현재 프로젝트는 tests/utils/selectors.ts에 data-testid 기반 셀렉터 상수가 이미 정의되어 있지만, 실제 컴포넌트에서는 대부분 구현되지 않아 74건의 E2E 테스트가 실패하고 있습니다.

Playwright와 React Testing Library 커뮤니티에서는 2026년 현재 data-testid를 "신뢰할 수 있는 최후의 수단(reliable fallback)" 셀렉터로 권장하고 있습니다. 우선순위는 getByRole > getByLabel > getByPlaceholder > getByTestId 순서이지만, 동적 컨텐츠나 복잡한 UI에서는 data-testid가 가장 안정적입니다.

**Primary recommendation:** 시맨틱 네이밍 규칙(feature-element-action)을 따르는 data-testid를 모든 주요 인터랙티브 요소에 추가하고, Server Component와 Client Component 모두에 동일하게 적용합니다.

## Standard Stack

### Core Testing Infrastructure
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Playwright | ~1.48+ | E2E testing framework | 이미 프로젝트에 설치됨, Playwright는 getByTestId() 네이티브 지원 |
| @testing-library/react | (선택) | Component testing | data-testid는 Testing Library 패턴과 100% 호환 |

### Naming Convention Libraries (Optional)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None needed | - | data-testid는 표준 HTML 속성 | 외부 라이브러리 불필요 |

### Build-time Tools (Optional for Production)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| babel-plugin-react-remove-properties | ^0.3.0 | Strip data-testid in production | 프로덕션 빌드 크기 최적화가 필요한 경우 |

**Installation:**
```bash
# 추가 설치 불필요 - data-testid는 표준 HTML 속성
# 프로덕션 최적화가 필요하면:
npm install --save-dev babel-plugin-react-remove-properties
```

## Architecture Patterns

### Recommended Naming Convention

**Pattern:** `{domain}-{element}-{detail?}`

```typescript
// 좋은 예
data-testid="student-card"
data-testid="student-name-input"
data-testid="counseling-calendar-view"
data-testid="llm-usage-chart"
data-testid="compatibility-score"

// 나쁜 예
data-testid="card1"           // 너무 일반적
data-testid="input"           // 컨텍스트 없음
data-testid="div-wrapper"     // 구현 디테일 노출
```

**Domain prefixes (이 프로젝트용):**
- `student-*`: 학생 관련 컴포넌트
- `admin-*`: 관리자 페이지 요소
- `counseling-*`: 상담 관련 UI
- `analysis-*`: 분석 탭 요소
- `matching-*`: 매칭/궁합 UI
- `performance-*`: 성과 대시보드

### Pattern 1: Interactive Element Marking
**What:** 모든 클릭/입력 가능한 요소에 data-testid 추가
**When to use:** 버튼, 링크, 입력 필드, 셀렉트 박스, 체크박스 등
**Example:**
```tsx
// Source: tests/utils/selectors.ts + 프로젝트 패턴
<Button data-testid="student-save-button" type="submit">
  저장
</Button>

<Input
  data-testid="student-name-input"
  name="name"
  placeholder="학생 이름"
/>

<Select data-testid="grade-filter">
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="4">4학년</SelectItem>
  </SelectContent>
</Select>
```

### Pattern 2: Container/Card Marking
**What:** 리스트 아이템, 카드, 테이블 행 등 반복되는 컨테이너에 data-testid
**When to use:** 동적 리스트, 검색 결과, 카드 그리드
**Example:**
```tsx
// Source: tests/e2e/student.spec.ts 패턴
{students.map((student) => (
  <Card key={student.id} data-testid="student-card">
    <CardHeader>
      <CardTitle data-testid="student-name">{student.name}</CardTitle>
    </CardHeader>
    <CardContent>
      <div data-testid="student-grade">학년: {student.grade}</div>
      <div data-testid="student-school">{student.school}</div>
    </CardContent>
  </Card>
))}
```

### Pattern 3: Chart/Visualization Marking
**What:** 차트, 그래프, 통계 표시 컴포넌트에 data-testid
**When to use:** 데이터 시각화 요소, 메트릭 카드
**Example:**
```tsx
// Source: tests/e2e/admin.spec.ts 요구사항
<Card data-testid="usage-chart">
  <CardHeader>
    <CardTitle>토큰 사용량 추이</CardTitle>
  </CardHeader>
  <CardContent>
    <LineChart data={dailyUsage} />
  </CardContent>
</Card>

<div className="stats-grid">
  <div data-testid="total-tokens" className="metric-card">
    {formatNumber(totalTokens)}
  </div>
  <div data-testid="estimated-cost" className="metric-card">
    ₩{formatCurrency(cost)}
  </div>
</div>
```

### Pattern 4: Tab Navigation
**What:** 탭 버튼과 탭 컨텐츠 영역에 data-testid 추가
**When to use:** Tabs 컴포넌트 (shadcn/ui Tabs 포함)
**Example:**
```tsx
// Source: tests/e2e/analysis.spec.ts 패턴
<Tabs defaultValue="saju">
  <TabsList>
    <TabsTrigger value="saju" data-testid="saju-tab">
      사주분석
    </TabsTrigger>
    <TabsTrigger value="mbti" data-testid="mbti-tab">
      MBTI
    </TabsTrigger>
  </TabsList>
  <TabsContent value="saju" data-testid="saju-content">
    {/* 사주 분석 내용 */}
  </TabsContent>
</Tabs>
```

### Pattern 5: Loading/Error States
**What:** 로딩 스피너, 에러 메시지, 빈 상태 컴포넌트에 data-testid
**When to use:** 비동기 작업, 조건부 렌더링
**Example:**
```tsx
// Source: 프로젝트 패턴
{loading && (
  <div data-testid="analysis-loading" className="flex justify-center">
    <Spinner />
  </div>
)}

{error && (
  <Alert data-testid="error-message" variant="destructive">
    <AlertDescription>{error}</AlertDescription>
  </Alert>
)}

{students.length === 0 && (
  <EmptyState data-testid="students-empty" />
)}
```

### Pattern 6: Server Component + Client Component 혼용
**What:** Next.js 15 Server Component와 Client Component 모두에 data-testid 동일하게 적용
**When to use:** RSC + 인터랙티브 요소 혼재 시
**Example:**
```tsx
// Server Component (page.tsx)
export default async function StudentsPage() {
  const students = await getStudents()

  return (
    <div className="container" data-testid="students-page">
      <h1>학생 관리</h1>
      <StudentTable data={students} />  {/* Client Component */}
    </div>
  )
}

// Client Component (student-table.tsx)
'use client'
export function StudentTable({ data }: Props) {
  return (
    <div data-testid="student-table">
      {data.map(student => (
        <div key={student.id} data-testid="student-row">
          {student.name}
        </div>
      ))}
    </div>
  )
}
```

### Anti-Patterns to Avoid
- **Dynamic/Generated IDs:** `data-testid={student-${Math.random()}}` - 테스트 불가능
- **Implementation Details:** `data-testid="div-wrapper-3"` - 구조 변경 시 깨짐
- **Too Generic:** `data-testid="button"` - 여러 버튼 중 구분 불가
- **Redundant with name:** `<input name="email" data-testid="email" />` - name으로 충분
- **CSS Classes as testid:** `data-testid="text-blue-500"` - 스타일과 테스트 혼용 금지

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 셀렉터 상수 관리 | 각 테스트에 하드코딩 | `tests/utils/selectors.ts` 파일 활용 | 이미 존재하는 중앙화된 셀렉터 상수 파일 사용 |
| 동적 셀렉터 생성 | 템플릿 문자열 반복 | `dynamicSelectors` 헬퍼 함수 | selectors.ts에 이미 `studentRow()` 등 정의됨 |
| Playwright 설정 | getByTestId 커스텀 구현 | Playwright 내장 `page.getByTestId()` | 네이티브 메서드가 더 안정적 |
| Production 최적화 | 수동으로 data-testid 제거 | babel-plugin-react-remove-properties | 자동화된 빌드 타임 제거 |

**Key insight:** Playwright는 getByTestId()를 네이티브로 지원하며, playwright.config.ts에서 testIdAttribute로 커스터마이징 가능합니다. 직접 구현할 필요가 없습니다.

## Common Pitfalls

### Pitfall 1: shadcn/ui 컴포넌트에 data-testid 전달 누락
**What goes wrong:** shadcn/ui의 Button, Input 등에 data-testid를 prop으로 전달했으나 실제 DOM에 렌더링되지 않음
**Why it happens:** shadcn/ui 컴포넌트는 Radix UI 기반이며, 일부는 `asChild` prop이나 내부 구조로 인해 data-testid가 전파되지 않을 수 있음
**How to avoid:**
- 컴포넌트 정의 확인: `src/components/ui/*.tsx`의 forwardRef와 props spreading 검증
- 필요시 명시적으로 `...props` 또는 `data-testid` prop 추가
- 테스트 실행 후 실제 DOM 검증 (`page.locator('[data-testid="..."]').evaluate(el => el.outerHTML)`)
**Warning signs:**
- `getByTestId()` 호출 시 `Error: locator not found`
- 브라우저 개발자 도구에서 data-testid 속성이 DOM에 없음

### Pitfall 2: Server Component hydration 후 data-testid 손실
**What goes wrong:** Server Component가 렌더링한 data-testid가 Client Component로 hydration되면서 사라짐
**Why it happens:** Next.js 15에서 RSC와 Client Component 경계에서 props가 직렬화되지 않는 경우
**How to avoid:**
- data-testid는 직렬화 가능한 문자열이므로 일반적으로 안전함
- 컴포넌트 경계에서 명시적으로 props 전달 확인
- "use client" 지시문 위치 확인 (최상위 vs 중첩)
**Warning signs:**
- SSR 시 data-testid 존재하지만 클라이언트 렌더링 후 사라짐
- Playwright `waitForLoadState('networkidle')` 후에도 셀렉터 실패

### Pitfall 3: 동적 리스트에서 중복 data-testid
**What goes wrong:** 여러 학생 카드에 모두 `data-testid="student-card"` 사용 시 first()만 선택됨
**Why it happens:** data-testid는 고유할 필요는 없지만, 특정 항목 선택이 어려움
**How to avoid:**
- **Option A (권장):** 공통 data-testid + 텍스트 기반 필터링
  ```ts
  page.locator('[data-testid="student-card"]').filter({ hasText: '김철수' })
  ```
- **Option B:** 인덱스 기반 선택 (취약하지만 간단)
  ```ts
  page.locator('[data-testid="student-card"]').nth(2)
  ```
- **Option C:** 고유 ID 포함 (동적 생성 시 주의)
  ```tsx
  <Card data-testid={`student-card-${student.id}`}>
  ```
**Warning signs:**
- `.first()`에 의존하는 테스트가 많음
- 특정 학생 선택이 불안정함

### Pitfall 4: Tests와 selectors.ts 불일치
**What goes wrong:** 테스트는 `[data-testid="current-provider"]`를 기대하지만 컴포넌트는 `[data-testid="active-provider"]` 사용
**Why it happens:** tests/utils/selectors.ts와 실제 구현이 동기화되지 않음
**How to avoid:**
- selectors.ts를 "단일 진실 공급원(SSOT)"로 사용
- 컴포넌트 구현 전 selectors.ts 먼저 검토
- 테스트 실패 시 selectors.ts부터 확인
**Warning signs:**
- 새 컴포넌트 추가 후 기존 테스트 실패
- 네이밍 관련 오류 메시지

### Pitfall 5: Calendar/Date Picker 같은 서드파티 위젯
**What goes wrong:** react-day-picker, date-fns 기반 캘린더 컴포넌트에 data-testid 추가 불가
**Why it happens:** 서드파티 라이브러리가 커스텀 props를 받지 않음
**How to avoid:**
- **Wrapper 사용:** 컴포넌트를 div로 감싸고 wrapper에 data-testid
  ```tsx
  <div data-testid="reservation-calendar">
    <Calendar {...calendarProps} />
  </div>
  ```
- **Role/Text 셀렉터 병용:** `page.getByRole('button', { name: '2024년 2월' })`
- **Fallback 전략:** selectors.ts에 복합 셀렉터 정의
**Warning signs:**
- 라이브러리 컴포넌트에 data-testid 전달 시 TypeScript 에러
- 캘린더 내부 버튼이 선택되지 않음

## Code Examples

### Example 1: Student Card Component (Card 리스트)
```tsx
// Source: src/components/students/student-table.tsx 개선안
'use client'

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import Link from "next/link"

interface StudentCardProps {
  student: {
    id: string
    name: string
    grade: number
    school: string
  }
}

export function StudentCard({ student }: StudentCardProps) {
  return (
    <Link href={`/students/${student.id}`}>
      <Card data-testid="student-card" className="hover:shadow-lg transition">
        <CardHeader>
          <CardTitle data-testid="student-name">
            {student.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div data-testid="student-grade" className="text-sm text-gray-600">
            {student.grade}학년
          </div>
          <div data-testid="student-school" className="text-sm text-gray-500">
            {student.school}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
```

### Example 2: Admin LLM Settings Page (SELECT + INPUT)
```tsx
// Source: src/app/(dashboard)/admin/llm-settings/page.tsx 개선안
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LLMSettingsPage() {
  const currentProvider = "Ollama"

  return (
    <div className="container py-6">
      <h1>LLM 설정</h1>

      {/* Current provider display */}
      <div className="mb-4">
        <Label>현재 활성 제공자</Label>
        <div data-testid="current-provider" className="text-lg font-semibold">
          {currentProvider}
        </div>
      </div>

      {/* Provider selection */}
      <div className="space-y-2">
        <Label htmlFor="provider-select">제공자 선택</Label>
        <Select data-testid="provider-select" defaultValue="ollama">
          <SelectTrigger id="provider-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ollama">Ollama (Local)</SelectItem>
            <SelectItem value="anthropic">Claude (Anthropic)</SelectItem>
            <SelectItem value="openai">GPT (OpenAI)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* API Key input */}
      <div className="space-y-2">
        <Label htmlFor="api-key">API 키</Label>
        <Input
          id="api-key"
          name="apiKey"
          type="password"
          data-testid="api-key-input"
          placeholder="sk-..."
        />
      </div>
    </div>
  )
}
```

### Example 3: Usage Chart Component (차트 메트릭)
```tsx
// Source: src/app/(dashboard)/admin/llm-usage/usage-charts.tsx 개선안
'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"

interface UsageChartsProps {
  dailyData: DailyUsageData[]
  totalTokens: number
  estimatedCost: number
}

export function UsageCharts({ dailyData, totalTokens, estimatedCost }: UsageChartsProps) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>총 토큰 사용량</CardTitle>
          </CardHeader>
          <CardContent>
            <div data-testid="total-tokens" className="text-3xl font-bold">
              {totalTokens.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>예상 비용</CardTitle>
          </CardHeader>
          <CardContent>
            <div data-testid="estimated-cost" className="text-3xl font-bold">
              ₩{estimatedCost.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Chart */}
      <Card data-testid="usage-chart">
        <CardHeader>
          <CardTitle>일별 토큰 사용량 추이</CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart width={600} height={300} data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="inputTokens" stroke="#3b82f6" />
            <Line type="monotone" dataKey="outputTokens" stroke="#10b981" />
          </LineChart>
        </CardContent>
      </Card>
    </div>
  )
}
```

### Example 4: Analysis Tabs (탭 네비게이션)
```tsx
// Source: src/app/(dashboard)/students/[id]/page.tsx 개선안
'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SajuAnalysisPanel } from "@/components/students/saju-analysis-panel"
import { MbtiAnalysisPanel } from "@/components/students/mbti-analysis-panel"

export default function StudentAnalysisPage({ studentId }: { studentId: string }) {
  const [loading, setLoading] = useState(false)

  return (
    <div className="container py-6">
      <Tabs defaultValue="saju">
        <TabsList>
          <TabsTrigger value="saju" data-testid="saju-tab">
            사주분석
          </TabsTrigger>
          <TabsTrigger value="mbti" data-testid="mbti-tab">
            MBTI
          </TabsTrigger>
          <TabsTrigger value="name" data-testid="name-tab">
            성명학
          </TabsTrigger>
        </TabsList>

        <TabsContent value="saju">
          {loading ? (
            <div data-testid="analysis-loading" className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : (
            <SajuAnalysisPanel studentId={studentId} />
          )}
        </TabsContent>

        <TabsContent value="mbti">
          <MbtiAnalysisPanel studentId={studentId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

### Example 5: Counseling Calendar (캘린더 뷰)
```tsx
// Source: src/components/counseling/ReservationCalendarView.tsx 개선안
'use client'

import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function ReservationCalendarView() {
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [showDetail, setShowDetail] = useState(false)

  return (
    <div data-testid="calendar-view" className="space-y-4">
      {/* Calendar Component (Wrapper 필요) */}
      <div data-testid="reservation-calendar">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            setSelectedDate(date)
            setShowDetail(true)
          }}
        />
      </div>

      {/* Detail Modal */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent data-testid="counseling-detail-modal">
          <DialogHeader>
            <DialogTitle>상담 상세</DialogTitle>
          </DialogHeader>
          <div>
            {selectedDate && (
              <p>선택된 날짜: {selectedDate.toLocaleDateString()}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

### Example 6: Compatibility Score (궁합 점수)
```tsx
// Source: src/components/compatibility/compatibility-score-card.tsx 개선안
'use client'

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

interface CompatibilityScoreCardProps {
  score: number
  breakdown: {
    mbti: number
    learningStyle: number
    saju: number
  }
}

export function CompatibilityScoreCard({ score, breakdown }: CompatibilityScoreCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>궁합 점수</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Overall Score */}
        <div data-testid="compatibility-score" className="text-4xl font-bold text-center mb-4">
          {score.toFixed(1)}
        </div>

        {/* Breakdown */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>MBTI</span>
            <span data-testid="compatibility-mbti">{breakdown.mbti}</span>
          </div>
          <div className="flex justify-between">
            <span>학습 스타일</span>
            <span data-testid="compatibility-learning">{breakdown.learningStyle}</span>
          </div>
          <div className="flex justify-between">
            <span>사주</span>
            <span data-testid="compatibility-saju">{breakdown.saju}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

### Example 7: Performance Metrics Card (성과 메트릭)
```tsx
// Source: src/components/analytics/PerformanceMetricsGrid.tsx 개선안
'use client'

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"

interface MetricCardProps {
  label: string
  value: number
  unit: string
  trend?: number
}

export function MetricCard({ label, value, unit, trend }: MetricCardProps) {
  return (
    <Card data-testid="metric-card">
      <CardHeader>
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span data-testid="metric-value" className="text-2xl font-bold">
            {value.toFixed(1)}
          </span>
          <span className="text-sm text-gray-500">{unit}</span>
        </div>

        {trend !== undefined && (
          <div data-testid="metric-trend" className={`flex items-center gap-1 text-sm mt-2 ${
            trend >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span>{Math.abs(trend).toFixed(1)}%</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CSS 클래스 셀렉터 (.btn-primary) | data-testid 속성 | ~2020 | 스타일 변경과 테스트 격리 |
| ID 속성 (#student-card-1) | data-testid + 텍스트 필터 | ~2021 | 동적 ID 문제 해결 |
| XPath 셀렉터 | Playwright getByTestId() | 2022+ | 가독성과 안정성 향상 |
| 프로덕션에 data-testid 포함 | Babel plugin으로 제거 | ~2023 | 번들 크기 최적화 |
| getByTestId 우선 사용 | getByRole 우선, testid는 fallback | 2024+ | 접근성과 테스트 동시 개선 |

**Deprecated/outdated:**
- CSS 클래스 기반 셀렉터: 스타일 변경 시 테스트 깨짐 (Tailwind 프로젝트에서 특히 취약)
- data-test (no id): 일부 레거시 프로젝트 사용, 2026년엔 data-testid가 표준
- 하드코딩된 인덱스: `.nth(3)` 보다 명시적 testid가 안전

## Open Questions

1. **프로덕션 빌드에서 data-testid 제거 여부**
   - What we know: babel-plugin-react-remove-properties로 자동 제거 가능
   - What's unclear: 프로젝트 정책 (SEO/접근성 도구가 data-* 사용 여부)
   - Recommendation: Phase 23에서는 제거하지 않고 유지, v2.2.0에서 최적화 검토

2. **동적 생성 컴포넌트의 testid 전략**
   - What we know: 동적 form builder, 플러그인 시스템은 testid 추가 어려움
   - What's unclear: 프로젝트에 동적 생성 UI가 있는지 확인 필요
   - Recommendation: 현재는 정적 컴포넌트 위주이므로 Pattern 1-7로 충분

3. **shadcn/ui 업데이트 시 data-testid 유지**
   - What we know: shadcn/ui는 복사해서 사용하는 방식 (node_modules 아님)
   - What's unclear: 향후 shadcn/ui 컴포넌트 업데이트 시 testid 병합 전략
   - Recommendation: src/components/ui/*.tsx에 직접 추가하므로 Git으로 추적 가능

## Sources

### Primary (HIGH confidence)
- Playwright Official Documentation - Locators: https://playwright.dev/docs/locators
- Testing Library - ByTestId: https://testing-library.com/docs/queries/bytestid/
- 프로젝트 내부 파일:
  - tests/utils/selectors.ts: 기존 셀렉터 상수 정의
  - tests/e2e/student.spec.ts: 실제 테스트 패턴
  - tests/e2e/admin.spec.ts: Admin 페이지 테스트 요구사항
  - tests/e2e/analysis.spec.ts: 분석 탭 테스트 패턴

### Secondary (MEDIUM confidence)
- [BrowserStack - 15 Playwright Selector Best Practices in 2026](https://www.browserstack.com/guide/playwright-selectors-best-practices): data-testid가 "intentionally stable attributes"로 권장됨
- [DEV Community - Test ID Best Practices Guide](https://dev.to/rahucode/test-id-best-practices-guide-react-typescript-nextjs-pfm): feature-element-action 네이밍 패턴 검증
- [Kent C. Dodds - Making your UI tests resilient to change](https://kentcdodds.com/blog/making-your-ui-tests-resilient-to-change): getByRole 우선, data-testid는 fallback 전략
- [Next.js Official - Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components): Next.js 15 RSC 패턴

### Tertiary (LOW confidence)
- [Medium - Next.js 15 and Beyond (2026)](https://medium.com/@beenakumawat003/next-js-15-and-beyond-the-future-of-full-stack-react-in-2026-advanced-guide-with-deep-insights-d7253dc46205): 일반적인 Next.js 15 가이드 (data-testid 직접 언급 없음)
- shadcn/ui 공식 문서: data-testid 관련 구체적 가이드 없음 (Radix UI 기반이므로 표준 HTML 속성 지원 확인 필요)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Playwright는 이미 설치됨, data-testid는 표준 HTML 속성
- Architecture patterns: HIGH - 프로젝트의 기존 테스트 파일과 selectors.ts 직접 분석
- Pitfalls: MEDIUM - shadcn/ui와 Next.js 15 RSC 조합은 실제 테스트 필요
- Code examples: HIGH - 프로젝트 실제 구조 기반으로 작성

**Research date:** 2026-02-06
**Valid until:** 2026-09-06 (180 days) - data-testid는 안정적인 표준 패턴이므로 장기 유효
