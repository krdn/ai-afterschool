# Phase 26: Counseling & Matching UI Enhancement - Research

**Researched:** 2026-02-07
**Domain:** UI/UX Enhancement - Search, Filter, History Tracking
**Confidence:** HIGH

## Summary

Phase 26는 상담/매칭/성과 페이지의 UX 강화를 목표로 합니다. 검색, 필터링, 이력 추적 기능을 추가하여 사용자가 데이터를 더 효율적으로 찾고 분석할 수 있게 합니다. 새로운 기능 추가 없이 기존 페이지의 UI/UX를 개선하는 데 중점을 둡니다.

**핵심 발견:**
1. 기존 상담 페이지에 이미 검색/필터 UI가 존재하지만, 통합 검색과 명시적 검색이 구현되지 않음
2. AuditLog 시스템이 이미 구현되어 있어 매칭 이력/감사 로그 활용 가능
3. DateRangeFilter 컴포넌트가 이미 존재하여 성과 차트 기간 선택에 재사용 가능
4. shadcn/ui Table 컴포넌트와 Recharts 라이브러리가 프로젝트에 통합되어 있음

**Primary recommendation:** 기존 컴포넌트와 패턴을 최대한 재사용하고, 통합 검색과 명시적 검색만 새로 구현합니다.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### 상담 기록 검색/필터
- **통합 검색**: 학생 이름, 학부모 이름, 상담 주제를 하나의 검색창에서 모두 검색
- **명시적 검색**: Enter 키 또는 검색 버튼 클릭 시 검색 실행 (즉시 검색 아님)
- **다중 필터**: 상담 유형, 날짜 범위, 선생님, 상태 등 복합 필터 제공

#### 상담 알림/리마인더 위젯
- **위치**: 대시보드 페이지 상단에 표시
- **표시 기간**: 오늘부터 7일 이내의 예약된 상담 표시
- **스타일**: 요약 카드 형태 (예: "3개의 예정된 상담") + 클릭 시 목록 펼침

#### 매칭 이력/감사 로그
- **표시 형식**: 테이블 형태 (변경 일시, 변경자, 변경 내용)
- **필터링**: 다중 필터 제공 (날짜 범위, 변경자, 변경 유형)
- **상세 보기**: 행 클릭 시 이전/후 값을 비교하는 변경 상세 모달 표시

#### 자동 배정 결과 및 성과 차트
- **배정 결과**: 요약 카드 형태로 표시 (배정된 학생 수, 제외된 학생, 성공/실패 카운트)
- **기간 선택**: 프리셋 버튼으로 제공 (오늘, 최근 7일, 최근 30일, 최근 3개월, 전체)

### Specific Ideas
- 상담 검색은 기존 CounselingSessionCard 목록 위쪽에 배치
- 알림 위젯은 대시보드 최상단에 Alert 형태로 배치하여 눈에 잘 띄게
- 매칭 이력은 /matching/history 또는 /matching 페이지 내 탭으로 제공
- 성과 차트 기간 선택은 DateRangeFilter 컴포넌트(기존)를 프리셋 버튼 그룹으로 사용

### Deferred Ideas (OUT OF SCOPE)
없음 — 논의가 Phase 범위 내에서 유지됨
</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **Next.js** | 15.5.10 | React Framework | App Router, Server Components, RSC |
| **React** | 19.2.3 | UI Library | Latest stable version with Server Components |
| **TypeScript** | 5.x | Type Safety | Strongly typed codebase |
| **Prisma** | 7.3.0 | ORM | Type-safe database access |
| **shadcn/ui** | Latest | Component Library | Radix UI + Tailwind CSS components |
| **Tailwind CSS** | 4.x | Styling | Utility-first CSS framework |

### UI Components (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **@radix-ui/react-tabs** | ^2.2.6 | Tab navigation | Multi-view content switching |
| **@radix-ui/react-dialog** | (shadcn) | Modal/Dialog | Detailed view modals |
| **@radix-ui/react-select** | ^2.2.6 | Dropdown selects | Filter dropdowns |
| **@tanstack/react-table** | ^8.21.3 | Data tables | Complex data tables with sorting/filtering |
| **recharts** | ^3.7.0 | Charts | Performance trend charts |
| **lucide-react** | ^0.563.0 | Icons | Consistent icon system |
| **sonner** | ^2.0.7 | Toast notifications | User feedback |
| **date-fns** | ^4.1.0 | Date utilities | Date range calculations |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **zod** | ^4.3.6 | Schema validation | Form validation, type safety |
| **clsx** | ^2.1.1 | Conditional classes | Dynamic className composition |
| **tailwind-merge** | ^3.4.0 | Tailwind merge | Merging Tailwind classes |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| shadcn/ui Table | MUI Table, AG Grid | shadcn/ui is lighter, more customizable with Tailwind |
| Recharts | Chart.js, D3.js | Recharts has better React integration, simpler API |
| Custom search | Algolia, Fuse.js | Custom search is sufficient for this scale, no external dependency |

**Installation:**
```bash
# No new packages required - all dependencies already installed
npm install  # Just ensuring existing packages are up to date
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── counseling/
│   │   ├── CounselingSearchBar.tsx      # NEW: 통합 검색 컴포넌트
│   │   ├── CounselingSessionList.tsx    # MODIFY: 검색/필터 연동
│   │   └── UpcomingCounselingWidget.tsx # NEW: 알림 위젯
│   ├── matching/
│   │   ├── MatchingHistoryTab.tsx       # NEW: 매칭 이력 탭
│   │   ├── MatchingAuditTable.tsx       # NEW: 감사 로그 테이블
│   │   └── AssignmentResultCard.tsx     # NEW: 배정 결과 카드
│   ├── statistics/
│   │   ├── DateRangeFilter.tsx          # EXISTING: 기간 필터 (재사용)
│   │   └── PerformanceTrendChart.tsx    # MODIFY: 기간 선택 추가
│   └── ui/
│       ├── table.tsx                    # EXISTING: shadcn/ui Table
│       ├── dialog.tsx                   # EXISTING: Modal component
│       └── alert.tsx                    # EXISTING: Alert component
├── lib/
│   ├── actions/
│   │   ├── counseling-search.ts         # NEW: 통합 검색 액션
│   │   ├── matching-history.ts          # NEW: 매칭 이력 조회
│   │   └── reservations.ts              # EXISTING: 예약 관련 액션
│   └── db/
│       ├── audit.ts                     # EXISTING: 감사 로그 조회
│       └── reservations.ts              # EXISTING: 예약 DB 함수
└── types/
    ├── counseling.ts                    # NEW: 상담 검색 타입
    └── matching.ts                      # NEW: 매칭 이력 타입
```

### Pattern 1: Server Components + Client Components Split
**What:** Next.js 15 App Router 패턴으로, 데이터 페칭은 Server Component에서, 상호작용은 Client Component에서 처리

**When to use:** 모든 페이지 구현 시

**Example:**
```typescript
// Server Component (page.tsx)
export default async function CounselingPage({
  searchParams,
}: PageProps) {
  const sessions = await getCounselingSessions(searchParams)

  return (
    <div>
      <CounselingSearchBarClient initialParams={searchParams} />
      <CounselingSessionList sessions={sessions} />
    </div>
  )
}

// Client Component (검색/필터 상태 관리)
'use client'
export function CounselingSearchBarClient({ initialParams }) {
  const [searchQuery, setSearchQuery] = useState(initialParams.query || '')
  const [filters, setFilters] = useState(initialParams)

  const handleSearch = () => {
    // URLSearchParams로 검색 실행
    const params = new URLSearchParams()
    if (searchQuery) params.set('query', searchQuery)
    // ... 기타 필터
    router.push(`/counseling?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSearch}>
      <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      <Button type="submit">검색</Button>
    </form>
  )
}
```

### Pattern 2: Controlled Search with Explicit Submission
**What:** 사용자가 Enter 키를 누르거나 검색 버튼을 클릭할 때만 검색을 실행하는 패턴

**When to use:** 통합 검색 구현 시 (즉시 검색 아님)

**Example:**
```typescript
'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

export function UnifiedSearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams)

    if (query.trim()) {
      params.set('q', query.trim())
    } else {
      params.delete('q')
    }

    router.push(`/counseling?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSearch} className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="학생 이름, 학부모 이름, 상담 주제 검색..."
          className="pl-10"
          data-testid="unified-search-input"
        />
      </div>
      <Button type="submit" data-testid="search-button">
        검색
      </Button>
    </form>
  )
}
```

### Pattern 3: Multi-Filter Form with URL State
**What:** 복합 필터를 URL 쿼리 파라미터로 관리하여 북마크 가능하고 뒤로 가기가 동작하게 함

**When to use:** 다중 필터 제공 시

**Example:**
```typescript
'use client'

import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { useRouter, useSearchParams } from 'next/navigation'

export function CounselingFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.set('page', '1') // 필터 변경 시 페이지 1로 리셋
    router.push(`/counseling?${params.toString()}`)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Select
        value={searchParams.get('type') || 'all'}
        onValueChange={(v) => updateFilter('type', v)}
      >
        <SelectTrigger>
          <SelectValue placeholder="상담 유형" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체</SelectItem>
          <SelectItem value="ACADEMIC">학업</SelectItem>
          <SelectItem value="CAREER">진로</SelectItem>
        </SelectContent>
      </Select>

      <Input
        type="date"
        value={searchParams.get('startDate') || ''}
        onChange={(e) => updateFilter('startDate', e.target.value)}
      />

      <Input
        type="date"
        value={searchParams.get('endDate') || ''}
        onChange={(e) => updateFilter('endDate', e.target.value)}
      />

      <Button
        variant="outline"
        onClick={() => router.push('/counseling')}
      >
        필터 초기화
      </Button>
    </div>
  )
}
```

### Pattern 4: Alert Widget with Collapsible Content
**What:** shadcn/ui Alert 컴포넌트와 Collapsible을 활용한 요약 위젯

**When to use:** 상담 알림/리마인더 위젯

**Example:**
```typescript
'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

interface UpcomingCounselingWidgetProps {
  reservations: Array<{
    id: string
    scheduledAt: Date
    student: { name: string }
    parent: { name: string }
  }>
}

export function UpcomingCounselingWidget({ reservations }: UpcomingCounselingWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const upcomingCount = reservations.length

  return (
    <Alert data-testid="upcoming-counseling-alert">
      <AlertTitle className="flex items-center justify-between">
        <span>다가오는 상담</span>
        <span className="text-sm font-normal">{upcomingCount}개 예정</span>
      </AlertTitle>
      <AlertDescription asChild>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <div className="space-y-2">
            <p>최근 7일 이내 {upcomingCount}개의 상담이 예정되어 있습니다.</p>

            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full">
                {isOpen ? '접기' : '목록 보기'}
                <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <ul className="space-y-2 mt-2">
                {reservations.map((r) => (
                  <li key={r.id} className="text-sm border-b pb-2">
                    <div className="font-medium">{r.student.name} 학생</div>
                    <div className="text-muted-foreground">
                      {new Date(r.scheduledAt).toLocaleString('ko-KR')}
                    </div>
                  </li>
                ))}
              </ul>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </AlertDescription>
    </Alert>
  )
}
```

### Pattern 5: Audit Log Table with Detail Modal
**What:** shadcn/ui Table과 Dialog를 활용한 감사 로그 테이블

**When to use:** 매칭 이력/감사 로그 UI

**Example:**
```typescript
'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AuditLogEntry } from '@/lib/actions/audit'

export function MatchingAuditTable({ logs }: { logs: AuditLogEntry[] }) {
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null)

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>변경 일시</TableHead>
            <TableHead>변경자</TableHead>
            <TableHead>변경 유형</TableHead>
            <TableHead>변경 내용</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow
              key={log.id}
              onClick={() => setSelectedLog(log)}
              className="cursor-pointer hover:bg-muted"
              data-testid="audit-log-row"
            >
              <TableCell>{new Date(log.createdAt).toLocaleString('ko-KR')}</TableCell>
              <TableCell>{log.teacherName}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded text-xs ${getActionColor(log.action)}`}>
                  {log.action}
                </span>
              </TableCell>
              <TableCell className="truncate max-w-md">
                {formatChanges(log.changes)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>변경 상세</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div>
                <span className="font-medium">변경 일시:</span>{' '}
                {new Date(selectedLog.createdAt).toLocaleString('ko-KR')}
              </div>
              <div>
                <span className="font-medium">변경자:</span>{' '}
                {selectedLog.teacherName}
              </div>
              <div>
                <span className="font-medium">변경 내용:</span>
                <pre className="mt-2 p-4 bg-muted rounded text-sm">
                  {JSON.stringify(selectedLog.changes, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function getActionColor(action: string): string {
  switch (action) {
    case 'CREATE': return 'bg-green-100 text-green-800'
    case 'UPDATE': return 'bg-blue-100 text-blue-800'
    case 'DELETE': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}
```

### Pattern 6: Date Range Presets with Recharts
**What:** 기존 DateRangeFilter 컴포넌트를 확장하여 성과 차트에 기간 선택 추가

**When to use:** 자동 배정 결과 및 성과 차트

**Example:**
```typescript
'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { DateRangeFilter } from '@/components/statistics/DateRangeFilter'
import { getDateRangeFromPreset } from '@/lib/utils/date-range'

type DatePreset = 'TODAY' | '7D' | '30D' | '3M' | 'ALL'

const PRESET_LABELS: Record<DatePreset, string> = {
  'TODAY': '오늘',
  '7D': '최근 7일',
  '30D': '최근 30일',
  '3M': '최근 3개월',
  'ALL': '전체'
}

export function PerformanceTrendChart() {
  const [preset, setPreset] = useState<DatePreset>('7D')
  const [chartData, setChartData] = useState([])

  useEffect(() => {
    // 기간에 따른 데이터 fetch
    const range = getDateRangeFromPreset(preset)
    fetchPerformanceData(range).then(setChartData)
  }, [preset])

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">성과 추이</h3>
        <DateRangeFilter
          value={preset}
          onChange={setPreset}
          variant="buttons"
          presets={['TODAY', '7D', '30D', '3M', 'ALL']}
          labels={PRESET_LABELS}
        />
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="improvement" stroke="#3b82f6" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

### Anti-Patterns to Avoid
- **즉시 검색(Instant Search)**: 사용자 의도와 다르게 불필요한 요청을 많이 보냄. Enter 키나 버튼 클릭 시 검색하도록 구현.
- **URL State 미사용**: 필터 상태를 URL에 반영하지 않으면 북마크/공유/뒤로 가기가 동작하지 않음.
- **Client-side만 필터링**: 대용량 데이터에서는 서버 사이드 필터링이 필요. URL 파라미터를 Server Component로 전달하여 Prisma 쿼리에 반영.
- **Modal/Dialog 무분별한 사용**: 단순 상세 보기도 Modal로 구현하면 모바일에서 UX 저하. 복잡한 상세 보기만 Modal 사용.
- **Loading State 미표시**: 검색/필터 변경 시 로딩 표시가 없으면 사용자 경험 저하. Skeleton UI나 Spinner 표시.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| **Data Tables** | Custom table with sorting/filtering | **@tanstack/react-table** + shadcn/ui Table | 이미 설치됨. 정렬, 필터링, 페이지네이션, 가상화 등 기능 제공 |
| **Dialog/Modal** | Custom modal with backdrop | **shadcn/ui Dialog** (Radix UI) | 접근성(A11y), 포커스 관리, ESC 키 지원 |
| **Date Pickers** | Custom date input | **react-day-picker** (v9.13.0) | 이미 설치됨. 달력 UI, 날짜 범위 선택 |
| **Form Validation** | Custom validation logic | **Zod** + **react-hook-form** | 이미 설치됨. 타입 안전한 스키마 검증 |
| **Toast Notifications** | Custom alert/snackbar | **Sonner** | 이미 설치됨. Promise 지원, stacked toasts |
| **Charts** | Custom SVG charts | **Recharts** | 이미 설치됨. Responsive, 선언적 API |
| **Icons** | Custom SVG icons | **Lucide React** | 이미 설치됨. 1000+ 아이콘, tree-shakeable |
| **Collapsible** | Custom show/hide logic | **shadcn/ui Collapsible** (Radix UI) | A11y, 애니메이션, 키보드 내비게이션 |

**Key insight:** 이 프로젝트는 이미 완전한 shadcn/ui + Radix UI 스택을 가지고 있음. 새로운 UI 컴포넌트를 만들기 전에 shadcn/ui가 이미 제공하는지 확인. Radix UI Primitives는 접근성과 키보드 내비게이션이 이미 구현되어 있음.

## Common Pitfalls

### Pitfall 1: 통합 검색에서 Prisma 쿼리 복잡도 폭증
**What goes wrong:** 학생 이름, 학부모 이름, 상담 주제를 하나의 쿼리로 검색하려면 OR 조건과 관계 쿼리가 필요함

**Why it happens:** 단일 필드 검색과 달리 다중 테이블 조인이 필요함

**How to avoid:**
```typescript
// Bad: 복잡한 OR 조건
const sessions = await db.counselingSession.findMany({
  where: {
    OR: [
      { student: { name: { contains: query } } },
      { student: { parents: { some: { name: { contains: query } } } } },
      { summary: { contains: query } },
    ]
  }
})

// Good: Prisma의 관계 쿼리 활용 + 인덱스 활용
const sessions = await db.counselingSession.findMany({
  where: {
    OR: [
      { student: { name: { contains: query, mode: 'insensitive' } } },
      { summary: { contains: query, mode: 'insensitive' } },
      // 학부모는 별도 쿼리 또는 포함
    ]
  },
  include: {
    student: {
      include: {
        parents: true
      }
    }
  }
})
```

**Warning signs:** 검색 속도가 2초 이상 걸리거나, N+1 쿼리 문제가 발생

### Pitfall 2: AuditLog 변경 내용(JSON) 표시의 가독성 문제
**What goes wrong:** JSON을 그대로 표시하면 사용자가 읽기 어려움

**Why it happens:** changes 필드는 Json 타입으로 구조화되지 않음

**How to avoid:**
```typescript
// Bad: 그대로 표시
<pre>{JSON.stringify(log.changes, null, 2)}</pre>

// Good: 포맷팅 함수 사용
function formatChanges(changes: Record<string, unknown> | null): string {
  if (!changes) return '-'

  return Object.entries(changes)
    .map(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        const { before, after } = value as { before?: unknown; after?: unknown }
        return `${key}: ${JSON.stringify(before)} → ${JSON.stringify(after)}`
      }
      return `${key}: ${JSON.stringify(value)}`
    })
    .join(', ')
}
```

### Pitfall 3: DateRangeFilter 프리셋 확장 시 date-fns 호환성
**What goes wrong:** 'TODAY', '7D' 같은 새로운 프리셋을 추가하면 기존 getDateRangeFromPreset 함수와 호환되지 않음

**Why it happens:** 기존 함수는 '1M', '3M', '6M', '1Y'만 지원함

**How to avoid:**
```typescript
// lib/utils/date-range.ts 확장
import { startOfDay, endOfDay, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import type { DatePreset, DateRange } from '@/types/statistics'

// 기존 DatePreset 타입 확장
export type ExtendedDatePreset = DatePreset | 'TODAY' | '7D' | '30D' | 'ALL'

export function getDateRangeFromPreset(preset: ExtendedDatePreset): DateRange {
  const now = new Date()

  switch (preset) {
    case 'TODAY':
      return { start: startOfDay(now), end: endOfDay(now) }
    case '7D':
      return { start: startOfDay(subDays(now, 7)), end: endOfDay(now) }
    case '30D':
      return { start: startOfDay(subDays(now, 30)), end: endOfDay(now) }
    case 'ALL':
      return { start: new Date(2020, 0, 1), end: endOfDay(now) }
    default:
      // 기존 로직 (1M, 3M, 6M, 1Y)
      const monthsMap: Record<DatePreset, number> = {
        '1M': 1,
        '3M': 3,
        '6M': 6,
        '1Y': 12
      }
      const months = monthsMap[preset as DatePreset]
      const startDate = startOfMonth(subMonths(now, months - 1))
      const endDate = endOfMonth(now)
      return { start: startDate, end: endDate }
  }
}
```

### Pitfall 4: Recharts 성능 저하 (대용량 데이터)
**What goes wrong:** 1000개 이상의 데이터 포인트를 렌더링하면 렌더링 속도 저하

**Why it happens:** Recharts는 기본적으로 모든 데이터 포인트를 SVG로 렌더링함

**How to avoid:**
1. **데이터 샘플링**: 100개 이하로 다운샘플링
2. **Throttling**: 차트 업데이트에 throttle 적용
3. **가상화**: @tanstack/react-virtual과 함께 사용

```typescript
// Bad: 전체 데이터 전달
<LineChart data={allData}>

// Good: 샘플링된 데이터
const sampledData = allData.filter((_, i) => i % Math.ceil(allData.length / 100) === 0)
<LineChart data={sampledData}>
```

**Warning signs:** 차트 렌더링에 1초 이상 걸리거나, 스크롤 시 프리징 발생

### Pitfall 5: Modal/Dialog에서 데이터 미리 fetch
**What goes wrong:** Dialog가 열리기 전에 데이터를 fetch하면 초기 로딩 시간이 길어짐

**Why it happens:** 필요 없는 데이터를 미리 가져오려고 함

**How to avoid:**
```typescript
// Bad: 미리 fetch
const [logs, setLogs] = useState([])
useEffect(() => {
  fetchLogs().then(setLogs)
}, [])

// Good: Dialog 열릴 때 fetch (React Query 또는 간단한 state)
const [selectedLogId, setSelectedLogId] = useState<string | null>(null)
const selectedLog = logs.find(l => l.id === selectedLogId)

// 또는 Dialog 내부에서 fetch
function AuditLogDetailDialog({ logId }: { logId: string }) {
  const [log, setLog] = useState(null)

  useEffect(() => {
    if (logId) fetchLogDetail(logId).then(setLog)
  }, [logId])

  return <DialogContent>{log ? <Detail log={log} /> : <Loading />}</DialogContent>
}
```

### Pitfall 6: 검색/필터 URL 파라미터 누락
**What goes wrong:** 필터를 적용해도 URL이 변경되지 않아 새로고침 시 필터가 리셋됨

**Why it happens:** 상태만 업데이트하고 URL을 업데이트하지 않음

**How to avoid:**
```typescript
// Bad: 상태만 업데이트
const [filters, setFilters] = useState({ type: 'all' })
setFilters({ type: 'ACADEMIC' })

// Good: URL 업데이트
const updateFilter = (key: string, value: string) => {
  const params = new URLSearchParams(searchParams)
  if (value) params.set(key, value)
  else params.delete(key)
  router.push(`/counseling?${params.toString()}`)
}
```

## Code Examples

### 상담 통합 검색 Server Action
```typescript
// lib/actions/counseling-search.ts
'use server'

import { db } from '@/lib/db'
import { verifySession } from '@/lib/dal'
import { getRBACPrisma } from '@/lib/db/rbac'

export interface CounselingSearchParams {
  query?: string
  type?: string
  startDate?: string
  endDate?: string
  teacherId?: string
  followUpRequired?: boolean
}

export async function searchCounselingSessions(params: CounselingSearchParams) {
  const session = await verifySession()
  if (!session) {
    return { success: false, error: '인증되지 않은 요청입니다.' }
  }

  const rbacDb = getRBACPrisma(session)

  // 기본 조건
  const where: any = {}

  // 통합 검색 (학생 이름, 학부모 이름, 요약)
  if (params.query) {
    where.OR = [
      { student: { name: { contains: params.query, mode: 'insensitive' } } },
      { summary: { contains: params.query, mode: 'insensitive' } },
      // 학부모 이름은 student.relation 통해 검색
    ]
  }

  // 상담 유형 필터
  if (params.type && params.type !== 'all') {
    where.type = params.type
  }

  // 날짜 범위 필터
  if (params.startDate || params.endDate) {
    where.sessionDate = {}
    if (params.startDate) where.sessionDate.gte = new Date(params.startDate)
    if (params.endDate) where.sessionDate.lte = new Date(params.endDate)
  }

  // 선생님 필터 (권한에 따라)
  if (session.role === 'TEACHER') {
    where.teacherId = session.userId
  } else if (params.teacherId) {
    where.teacherId = params.teacherId
  }

  // 후속 조치 필터
  if (params.followUpRequired !== undefined) {
    where.followUpRequired = params.followUpRequired
  }

  const sessions = await rbacDb.counselingSession.findMany({
    where,
    include: {
      student: {
        include: {
          parents: true
        }
      },
      teacher: {
        select: {
          id: true,
          name: true,
          role: true
        }
      }
    },
    orderBy: { sessionDate: 'desc' },
    take: 100
  })

  return { success: true, data: sessions }
}
```

### 다가오는 상담 위젯 데이터 fetch
```typescript
// lib/actions/upcoming-counseling.ts
'use server'

import { db } from '@/lib/db'
import { verifySession } from '@/lib/dal'
import { addDays, startOfDay, endOfDay } from 'date-fns'

export async function getUpcomingCounseling() {
  const session = await verifySession()
  if (!session) {
    return { success: false, error: '인증되지 않은 요청입니다.' }
  }

  const now = new Date()
  const sevenDaysLater = addDays(now, 7)

  const reservations = await db.parentCounselingReservation.findMany({
    where: {
      teacherId: session.userId,
      status: 'SCHEDULED',
      scheduledAt: {
        gte: startOfDay(now),
        lte: endOfDay(sevenDaysLater)
      }
    },
    include: {
      student: {
        select: {
          id: true,
          name: true
        }
      },
      parent: {
        select: {
          id: true,
          name: true,
          relation: true
        }
      }
    },
    orderBy: { scheduledAt: 'asc' }
  })

  return { success: true, data: reservations }
}
```

### 매칭 감사 로그 조회 (AuditLog 활용)
```typescript
// lib/actions/matching-history.ts
'use server'

import { db } from '@/lib/db'
import { verifySession } from '@/lib/dal'

export interface MatchingHistoryParams {
  startDate?: string
  endDate?: string
  teacherId?: string
  action?: string
}

export async function getMatchingHistory(params: MatchingHistoryParams) {
  const session = await verifySession()
  if (!session || session.role !== 'DIRECTOR') {
    return { success: false, error: '권한이 없습니다.' }
  }

  const where: any = {
    entityType: 'Student' // 학생 배정 변경만 추적
  }

  // 날짜 범위
  if (params.startDate || params.endDate) {
    where.createdAt = {}
    if (params.startDate) where.createdAt.gte = new Date(params.startDate)
    if (params.endDate) where.createdAt.lte = new Date(params.endDate)
  }

  // 변경자 필터
  if (params.teacherId) {
    where.teacherId = params.teacherId
  }

  // 변경 유형 필터
  if (params.action) {
    where.action = params.action
  }

  const logs = await db.auditLog.findMany({
    where,
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 100
  })

  return { success: true, data: logs }
}
```

### AssignmentProposal 결과 카드 데이터
```typescript
// lib/actions/assignment-results.ts
'use server'

import { db } from '@/lib/db'
import { verifySession } from '@/lib/dal'

export async function getAssignmentResults(proposalId: string) {
  const session = await verifySession()
  if (!session) {
    return { success: false, error: '인증되지 않은 요청입니다.' }
  }

  const proposal = await db.assignmentProposal.findUnique({
    where: { id: proposalId },
    include: {
      proposer: {
        select: {
          id: true,
          name: true
        }
      }
    }
  })

  if (!proposal) {
    return { success: false, error: '제안을 찾을 수 없습니다.' }
  }

  const assignments = proposal.assignments as Array<{
    studentId: string
    teacherId: string
    score: number
  }>

  const summary = proposal.summary as {
    totalStudents: number
    assignedStudents: number
    averageScore: number
    minScore: number
    maxScore: number
  }

  // 제외된 학생 계산
  const allStudents = await db.student.count()
  const excludedCount = allStudents - summary.assignedStudents

  return {
    success: true,
    data: {
      ...summary,
      excludedCount,
      proposerName: proposal.proposer.name,
      createdAt: proposal.createdAt,
      status: proposal.status
    }
  }
}
```

### DateRangeFilter 프리셋 확장
```typescript
// components/statistics/DateRangeFilter.tsx 수정
interface DateRangeFilterProps {
  value: string
  onChange: (preset: string) => void
  variant?: 'buttons' | 'dropdown'
  presets?: string[] // NEW: 커스텀 프리셋 지원
  labels?: Record<string, string> // NEW: 커스텀 라벨 지원
}

export function DateRangeFilter({
  value,
  onChange,
  variant = 'buttons',
  presets = ['1M', '3M', '6M', '1Y'],
  labels
}: DateRangeFilterProps) {
  const PRESET_LABELS = labels || {
    '1M': '최근 1개월',
    '3M': '최근 3개월',
    '6M': '최근 6개월',
    '1Y': '최근 1년',
    'TODAY': '오늘',
    '7D': '최근 7일',
    '30D': '최근 30일',
    'ALL': '전체'
  }

  // ... rest of the component
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom table implementations | **@tanstack/react-table** | Already installed | 정렬, 필터링, 가상화 지원 |
| Basic HTML inputs | **shadcn/ui Form Components** | Already installed | 일관된 스타일, 접근성 |
| Chart.js, D3.js | **Recharts** | Already installed | React 친화적, 선언적 API |
| Custom modal dialogs | **Radix UI Dialog** | Already installed | A11y, 포커스 관리 |
| Manual state management | **URL Search Params** | This phase | 북마크 가능, 뒤로 가기 지원 |
| Client-side filtering | **Server-side filtering** | This phase | 대용량 데이터 지원 |

**Deprecated/outdated:**
- **Class Components**: 함수형 컴포넌트 + Hooks 사용
- **componentDidMount**: useEffect 사용
- **UNSAFE_componentWillReceiveProps**: useEffect + 의존성 배열 사용
- **Redux (context)**: Server Components + URL State 사용
- **React Router**: Next.js App Router 사용

## Open Questions

1. **학부모 이름 검색 최적화**
   - What we know: Student-Parent 관계는 1:N이어서 쿼리가 복잡함
   - What's unclear: 학부모 이름 검색을 별도 쿼리로 할지, 통합 쿼리로 할지
   - Recommendation: 학생 이름과 요약 먼저 검색하고, 결과가 없으면 학부모 이름 검색 (2단계)

2. **매칭 이력 표시 범위**
   - What we know: AuditLog는 모든 변경을 기록
   - What's unclear: 매칭 이력을 어느 기간까지 표시할지 (전체 vs 최근 3개월)
   - Recommendation: 기본값 최근 3개월, 전체 보기 옵션 제공

3. **성과 차트 향상률 계산**
   - What we know: GradeHistory 테이블에 성적 데이터 있음
   - What's unclear: 향상률을 어떻게 정의할지 (전체 평균 vs 개인별)
   - Recommendation: 전체 학생 평균 성적의 월별 변화율

## Sources

### Primary (HIGH confidence)
- **shadcn/ui Table** - https://ui.shadcn.com/docs/components/table
- **Recharts Documentation** - https://recharts.org/en-US/
- **Radix UI Dialog** - https://www.radix-ui.com/primitives/docs/components/dialog
- **date-fns** - https://date-fns.org/docs/Getting-Started
- **Next.js 15 App Router** - https://nextjs.org/docs/app
- **Prisma ORM** - https://www.prisma.io/docs

### Secondary (MEDIUM confidence)
- **Recharts Performance Optimization** - https://recharts.github.io/en-US/guide/performance/
- **@tanstack/react-table** - https://tanstack.com/table/v8/docs/guide/introduction
- **React Hook Form** - https://www.react-hook-form.com/
- **Zod Validation** - https://zod.dev/

### Tertiary (LOW confidence)
- [Recharts vs Chart.js Performance](https://www.oreateai.com/blog/recharts-vs-chartjs-navigating-the-performance-maze-for-big-data-visualizations/4aff3db5050dc635fd25267846922)
- [Best React Chart Libraries 2026](https://www.syncfusion.com/blogs/post/top-5-react-chart-libraries)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - 모든 라이브러리가 이미 프로젝트에 설치되어 있음
- Architecture: HIGH - 기존 패턴과 컴포넌트를 분석하여 제시
- Pitfalls: MEDIUM - 일부는 기존 코드에서 확인했으나, 일부는 예상 기반
- Code examples: HIGH - 기존 코드 스타일을 참고하여 작성

**Research date:** 2026-02-07
**Valid until:** 2026-03-09 (30 days - UI 라이브러리는 안정적이므로)

---

*Research complete: 2026-02-07*
*Next: Planning phase with PLAN.md files*
