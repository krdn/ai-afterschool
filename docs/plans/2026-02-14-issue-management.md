# 이슈 관리 페이지 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 이슈 목록 페이지(/issues), 상세 페이지(/issues/[id]), 담당자 할당 기능을 구현하여 생성된 이슈를 관리할 수 있게 합니다.

**Architecture:** Server Component 중심으로 기존 프로젝트 패턴(학생 목록 등)과 동일하게 구현. URL searchParams로 필터/페이지네이션 처리하고, 상태 변경과 담당자 할당은 Client Component에서 Server Action을 호출합니다.

**Tech Stack:** Next.js 15 App Router, Prisma, Server Actions, shadcn/ui (Table, Badge, Select, Card), Lucide React 아이콘

**에이전트 팀:**
- **개발자**: 각 Task의 코드 구현
- **테스터**: Task 3, 5, 7 완료 후 테스트 수행
- **기획자**: UI/UX 의사결정 시 소통

---

### Task 1: assignIssue Server Action 추가

**Files:**
- Modify: `src/lib/actions/issues.ts` (411행 이후 추가)

**Step 1: assignIssue 함수 작성**

`src/lib/actions/issues.ts` 파일 끝에 다음 함수를 추가:

```typescript
/**
 * 이슈 담당자 할당 Server Action
 *
 * DIRECTOR 전용
 * 담당자 변경 + IssueEvent 기록 + AuditLog
 */
export async function assignIssue(
  issueId: string,
  assignedTo: string | null
): Promise<{ success: boolean; error?: string }> {
  const session = await verifySession()

  if (session.role !== 'DIRECTOR') {
    return {
      success: false,
      error: "이슈 담당자를 변경할 권한이 없어요",
    }
  }

  try {
    const issue = await db.issue.findUnique({
      where: { id: issueId },
      select: { assignedTo: true },
    })

    if (!issue) {
      return {
        success: false,
        error: "이슈를 찾을 수 없어요",
      }
    }

    await db.issue.update({
      where: { id: issueId },
      data: { assignedTo },
    })

    await db.issueEvent.create({
      data: {
        issueId,
        eventType: 'assigned',
        performedBy: session.userId,
        metadata: {
          from: issue.assignedTo,
          to: assignedTo,
        },
      },
    })

    await logAuditAction({
      action: 'ISSUE_ASSIGNED',
      entityType: 'Issue',
      entityId: issueId,
      changes: {
        from: issue.assignedTo,
        to: assignedTo,
      },
    })

    return { success: true }
  } catch (error) {
    console.error("Failed to assign issue:", error)
    return {
      success: false,
      error: "담당자 변경 중 오류가 발생했어요",
    }
  }
}
```

**Step 2: 빌드 확인**

Run: `cd /home/gon/projects/ai/ai-afterschool && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: 에러 없음

**Step 3: 커밋**

```bash
git add src/lib/actions/issues.ts
git commit -m "feat: 이슈 담당자 할당 Server Action 추가"
```

---

### Task 2: 이슈 상태/카테고리 뱃지 컴포넌트

**Files:**
- Create: `src/components/issues/issue-status-badge.tsx`

**Step 1: 뱃지 컴포넌트 작성**

```tsx
import { Badge } from '@/components/ui/badge'
import type { IssueStatus, IssueCategory, IssuePriority } from '@prisma/client'

const STATUS_CONFIG: Record<IssueStatus, { label: string; className: string }> = {
  OPEN: { label: '열림', className: 'bg-blue-100 text-blue-800' },
  IN_PROGRESS: { label: '진행 중', className: 'bg-yellow-100 text-yellow-800' },
  IN_REVIEW: { label: '검토 중', className: 'bg-purple-100 text-purple-800' },
  CLOSED: { label: '종료', className: 'bg-gray-100 text-gray-800' },
  ARCHIVED: { label: '보관', className: 'bg-gray-50 text-gray-500' },
}

const CATEGORY_CONFIG: Record<IssueCategory, { label: string; className: string }> = {
  BUG: { label: '버그', className: 'bg-red-100 text-red-800' },
  FEATURE: { label: '기능', className: 'bg-green-100 text-green-800' },
  IMPROVEMENT: { label: '개선', className: 'bg-blue-100 text-blue-800' },
  UI_UX: { label: 'UI/UX', className: 'bg-orange-100 text-orange-800' },
  DOCUMENTATION: { label: '문서', className: 'bg-indigo-100 text-indigo-800' },
  PERFORMANCE: { label: '성능', className: 'bg-amber-100 text-amber-800' },
  SECURITY: { label: '보안', className: 'bg-red-200 text-red-900' },
}

const PRIORITY_CONFIG: Record<IssuePriority, { label: string; className: string }> = {
  LOW: { label: '낮음', className: 'bg-gray-100 text-gray-600' },
  MEDIUM: { label: '보통', className: 'bg-yellow-100 text-yellow-700' },
  HIGH: { label: '높음', className: 'bg-orange-100 text-orange-800' },
  URGENT: { label: '긴급', className: 'bg-red-100 text-red-800' },
}

export function IssueStatusBadge({ status }: { status: IssueStatus }) {
  const config = STATUS_CONFIG[status]
  return <Badge className={config.className}>{config.label}</Badge>
}

export function IssueCategoryBadge({ category }: { category: IssueCategory }) {
  const config = CATEGORY_CONFIG[category]
  return <Badge className={config.className}>{config.label}</Badge>
}

export function IssuePriorityBadge({ priority }: { priority: IssuePriority }) {
  const config = PRIORITY_CONFIG[priority]
  return <Badge className={config.className}>{config.label}</Badge>
}
```

**Step 2: index.ts에 export 추가**

`src/components/issues/index.ts`에 추가:
```typescript
export { IssueStatusBadge, IssueCategoryBadge, IssuePriorityBadge } from './issue-status-badge'
```

**Step 3: 커밋**

```bash
git add src/components/issues/issue-status-badge.tsx src/components/issues/index.ts
git commit -m "feat: 이슈 상태/카테고리/우선순위 뱃지 컴포넌트 추가"
```

---

### Task 3: 이슈 필터 컴포넌트

**Files:**
- Create: `src/components/issues/issue-filters.tsx`

**Step 1: 필터 컴포넌트 작성**

```tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { IssueReportModal } from './issue-report-modal'
import { useState } from 'react'
import { Flag } from 'lucide-react'

const STATUS_OPTIONS = [
  { value: 'ALL', label: '전체 상태' },
  { value: 'OPEN', label: '열림' },
  { value: 'IN_PROGRESS', label: '진행 중' },
  { value: 'IN_REVIEW', label: '검토 중' },
  { value: 'CLOSED', label: '종료' },
]

const CATEGORY_OPTIONS = [
  { value: 'ALL', label: '전체 카테고리' },
  { value: 'BUG', label: '버그' },
  { value: 'FEATURE', label: '기능' },
  { value: 'IMPROVEMENT', label: '개선' },
  { value: 'UI_UX', label: 'UI/UX' },
  { value: 'DOCUMENTATION', label: '문서' },
  { value: 'PERFORMANCE', label: '성능' },
  { value: 'SECURITY', label: '보안' },
]

export function IssueFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const currentStatus = searchParams.get('status') || 'ALL'
  const currentCategory = searchParams.get('category') || 'ALL'

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'ALL') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    params.delete('page') // 필터 변경 시 첫 페이지로
    router.push(`/issues?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Select value={currentStatus} onValueChange={(v) => updateFilter('status', v)}>
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={currentCategory} onValueChange={(v) => updateFilter('category', v)}>
        <SelectTrigger className="w-[160px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CATEGORY_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="ml-auto">
        <Button onClick={() => setIsModalOpen(true)} size="sm">
          <Flag className="h-4 w-4 mr-2" />
          이슈 보고
        </Button>
      </div>

      <IssueReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userRole="DIRECTOR"
      />
    </div>
  )
}
```

**Step 2: index.ts에 export 추가**

```typescript
export { IssueFilters } from './issue-filters'
```

**Step 3: 커밋**

```bash
git add src/components/issues/issue-filters.tsx src/components/issues/index.ts
git commit -m "feat: 이슈 필터 컴포넌트 추가 (상태/카테고리 드롭다운)"
```

**→ 테스터에게 전달: Task 1-3 완료 후 빌드 검증 요청**

---

### Task 4: 이슈 목록 테이블 컴포넌트

**Files:**
- Create: `src/components/issues/issue-table.tsx`

**Step 1: 테이블 컴포넌트 작성**

```tsx
'use client'

import Link from 'next/link'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { IssueStatusBadge, IssueCategoryBadge, IssuePriorityBadge } from './issue-status-badge'
import type { IssueStatus, IssueCategory, IssuePriority } from '@prisma/client'

interface IssueRow {
  id: string
  title: string
  status: IssueStatus
  category: IssueCategory
  priority: IssuePriority
  githubIssueNumber: number | null
  creator: { name: string }
  assignee: { name: string } | null
  createdAt: string | Date
}

function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const target = new Date(date)
  const diffMs = now.getTime() - target.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`
  if (diffHour < 24) return `${diffHour}시간 전`
  if (diffDay < 30) return `${diffDay}일 전`
  return target.toLocaleDateString('ko-KR')
}

export function IssueTable({ issues }: { issues: IssueRow[] }) {
  if (issues.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        등록된 이슈가 없습니다.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>상태</TableHead>
          <TableHead>제목</TableHead>
          <TableHead>카테고리</TableHead>
          <TableHead>우선순위</TableHead>
          <TableHead>생성자</TableHead>
          <TableHead>담당자</TableHead>
          <TableHead>생성일</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {issues.map((issue) => (
          <TableRow key={issue.id}>
            <TableCell>
              <IssueStatusBadge status={issue.status} />
            </TableCell>
            <TableCell>
              <Link
                href={`/issues/${issue.id}`}
                className="text-blue-600 hover:underline font-medium"
              >
                {issue.githubIssueNumber && (
                  <span className="text-gray-400 mr-1">#{issue.githubIssueNumber}</span>
                )}
                {issue.title}
              </Link>
            </TableCell>
            <TableCell>
              <IssueCategoryBadge category={issue.category} />
            </TableCell>
            <TableCell>
              <IssuePriorityBadge priority={issue.priority} />
            </TableCell>
            <TableCell className="text-gray-600">{issue.creator.name}</TableCell>
            <TableCell className="text-gray-600">
              {issue.assignee?.name || <span className="text-gray-400">미할당</span>}
            </TableCell>
            <TableCell className="text-gray-500 text-sm">
              {formatRelativeTime(issue.createdAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

**Step 2: index.ts에 export 추가**

```typescript
export { IssueTable } from './issue-table'
```

**Step 3: 커밋**

```bash
git add src/components/issues/issue-table.tsx src/components/issues/index.ts
git commit -m "feat: 이슈 목록 테이블 컴포넌트 추가"
```

---

### Task 5: 이슈 목록 페이지 + 네비게이션 링크

**Files:**
- Create: `src/app/(dashboard)/issues/page.tsx`
- Modify: `src/app/(dashboard)/layout.tsx` (네비게이션에 이슈 링크 추가)

**Step 1: 이슈 목록 페이지 작성**

```tsx
import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/dal'
import { getIssues } from '@/lib/actions/issues'
import { IssueTable } from '@/components/issues/issue-table'
import { IssueFilters } from '@/components/issues/issue-filters'
import type { IssueStatus, IssueCategory } from '@prisma/client'

export const metadata = {
  title: '이슈 관리 | AI AfterSchool',
  description: '이슈 목록 및 관리',
}

export default async function IssuesPage(props: {
  searchParams?: Promise<{
    status?: string
    category?: string
    page?: string
  }>
}) {
  const session = await verifySession()
  if (session.role !== 'DIRECTOR') {
    redirect('/dashboard')
  }

  const searchParams = await props.searchParams
  const status = searchParams?.status as IssueStatus | undefined
  const category = searchParams?.category as IssueCategory | undefined
  const page = parseInt(searchParams?.page || '1', 10)

  const { issues, total } = await getIssues({ status, category, page, pageSize: 20 })
  const totalPages = Math.ceil(total / 20)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">이슈 관리</h1>
        <p className="text-gray-500 mt-1">총 {total}건의 이슈</p>
      </div>

      <IssueFilters />

      <div className="bg-white rounded-lg border">
        <IssueTable issues={issues} />
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && (
            <a
              href={`/issues?${new URLSearchParams({
                ...(status && { status }),
                ...(category && { category }),
                page: String(page - 1),
              }).toString()}`}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              이전
            </a>
          )}
          <span className="px-4 py-2 text-gray-600">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <a
              href={`/issues?${new URLSearchParams({
                ...(status && { status }),
                ...(category && { category }),
                page: String(page + 1),
              }).toString()}`}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              다음
            </a>
          )}
        </div>
      )}
    </div>
  )
}
```

**Step 2: layout.tsx에 이슈 네비게이션 링크 추가**

`src/app/(dashboard)/layout.tsx`에서 DIRECTOR 전용 `<IssueReportButton>` 근처에 있는 네비게이션 영역에 "이슈" 링크를 추가합니다. 구체적으로 "관리자 도구" 링크 앞에:

```tsx
{teacher.role === "DIRECTOR" && (
  <Link
    href="/issues"
    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
  >
    이슈
  </Link>
)}
```

**Step 3: 빌드 확인**

Run: `cd /home/gon/projects/ai/ai-afterschool && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: 에러 없음

**Step 4: 커밋**

```bash
git add src/app/\(dashboard\)/issues/page.tsx src/app/\(dashboard\)/layout.tsx
git commit -m "feat: 이슈 목록 페이지 및 네비게이션 링크 추가"
```

**→ 테스터에게 전달: Task 4-5 완료 후 목록 페이지 E2E 검증 요청**

---

### Task 6: 이슈 타임라인 컴포넌트

**Files:**
- Create: `src/components/issues/issue-timeline.tsx`

**Step 1: 타임라인 컴포넌트 작성**

```tsx
import { GitBranch, Tag, RefreshCw, UserPlus, CheckCircle, Plus } from 'lucide-react'

interface TimelineEvent {
  id: string
  eventType: string
  metadata: Record<string, unknown> | null
  createdAt: string | Date
  performer: { name: string }
}

const EVENT_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  created: { icon: Plus, label: '이슈 생성', color: 'text-blue-500' },
  labeled: { icon: Tag, label: '라벨 추가', color: 'text-purple-500' },
  branch_created: { icon: GitBranch, label: '브랜치 생성', color: 'text-green-500' },
  status_changed: { icon: RefreshCw, label: '상태 변경', color: 'text-yellow-500' },
  assigned: { icon: UserPlus, label: '담당자 변경', color: 'text-indigo-500' },
  closed: { icon: CheckCircle, label: '이슈 종료', color: 'text-gray-500' },
}

function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getEventDetail(event: TimelineEvent): string | null {
  const meta = event.metadata as Record<string, string> | null
  if (!meta) return null

  switch (event.eventType) {
    case 'status_changed':
      return `${meta.from} → ${meta.to}`
    case 'branch_created':
      return meta.branchName || null
    case 'labeled':
      return Array.isArray(meta.labels) ? meta.labels.join(', ') : null
    case 'assigned':
      return meta.to ? `담당자 할당됨` : '담당자 해제됨'
    default:
      return null
  }
}

export function IssueTimeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return <p className="text-gray-400 text-sm">이벤트 기록이 없습니다.</p>
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">활동 기록</h3>
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />
        <div className="space-y-4">
          {events.map((event) => {
            const config = EVENT_CONFIG[event.eventType] || EVENT_CONFIG.created
            const Icon = config.icon
            const detail = getEventDetail(event)

            return (
              <div key={event.id} className="relative flex items-start gap-3 pl-2">
                <div className={`relative z-10 flex-shrink-0 w-6 h-6 rounded-full bg-white border-2 flex items-center justify-center ${config.color}`}>
                  <Icon className="w-3 h-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{event.performer.name}</span>
                    <span className="text-gray-500 ml-1">{config.label}</span>
                  </p>
                  {detail && (
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{detail}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDateTime(event.createdAt)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
```

**Step 2: index.ts에 export 추가**

```typescript
export { IssueTimeline } from './issue-timeline'
```

**Step 3: 커밋**

```bash
git add src/components/issues/issue-timeline.tsx src/components/issues/index.ts
git commit -m "feat: 이슈 타임라인 컴포넌트 추가"
```

---

### Task 7: 이슈 상세 컴포넌트 (상태 변경 + 담당자 할당)

**Files:**
- Create: `src/components/issues/issue-detail.tsx`
- Create: `src/components/issues/issue-assign-select.tsx`

**Step 1: 담당자 할당 드롭다운 작성**

```tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { assignIssue } from '@/lib/actions/issues'
import { toast } from 'sonner'

interface Teacher {
  id: string
  name: string
}

export function IssueAssignSelect({
  issueId,
  currentAssigneeId,
  teachers,
}: {
  issueId: string
  currentAssigneeId: string | null
  teachers: Teacher[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleAssign(teacherId: string) {
    const value = teacherId === 'UNASSIGNED' ? null : teacherId
    startTransition(async () => {
      const result = await assignIssue(issueId, value)
      if (result.success) {
        toast.success('담당자가 변경되었어요')
        router.refresh()
      } else {
        toast.error(result.error || '오류가 발생했어요')
      }
    })
  }

  return (
    <Select
      value={currentAssigneeId || 'UNASSIGNED'}
      onValueChange={handleAssign}
      disabled={isPending}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="담당자 선택" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="UNASSIGNED">미할당</SelectItem>
        {teachers.map((t) => (
          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
```

**Step 2: 이슈 상세 컴포넌트 작성**

```tsx
'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { IssueStatusBadge, IssueCategoryBadge, IssuePriorityBadge } from './issue-status-badge'
import { IssueAssignSelect } from './issue-assign-select'
import { updateIssueStatus } from '@/lib/actions/issues'
import { toast } from 'sonner'
import { ExternalLink } from 'lucide-react'
import type { IssueStatus } from '@prisma/client'

const STATUS_OPTIONS: { value: IssueStatus; label: string }[] = [
  { value: 'OPEN', label: '열림' },
  { value: 'IN_PROGRESS', label: '진행 중' },
  { value: 'IN_REVIEW', label: '검토 중' },
  { value: 'CLOSED', label: '종료' },
]

interface IssueDetailProps {
  issue: {
    id: string
    title: string
    description: string | null
    status: IssueStatus
    category: string
    priority: string
    githubIssueNumber: number | null
    githubIssueUrl: string | null
    githubBranchName: string | null
    screenshotUrl: string | null
    assignedTo: string | null
    creator: { name: string }
    assignee: { name: string } | null
    createdAt: string | Date
  }
  teachers: { id: string; name: string }[]
}

export function IssueDetail({ issue, teachers }: IssueDetailProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleStatusChange(status: IssueStatus) {
    startTransition(async () => {
      const result = await updateIssueStatus(issue.id, status)
      if (result.success) {
        toast.success('상태가 변경되었어요')
        router.refresh()
      } else {
        toast.error(result.error || '오류가 발생했어요')
      }
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 좌측: 메인 콘텐츠 */}
      <div className="lg:col-span-2 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <IssueStatusBadge status={issue.status} />
            {issue.githubIssueNumber && (
              <span className="text-gray-400 text-sm">#{issue.githubIssueNumber}</span>
            )}
          </div>
          <h1 className="text-2xl font-bold">{issue.title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {issue.creator.name} · {new Date(issue.createdAt).toLocaleString('ko-KR')}
          </p>
        </div>

        {issue.description && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">설명</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{issue.description}</p>
            </CardContent>
          </Card>
        )}

        {issue.screenshotUrl && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">스크린샷</CardTitle>
            </CardHeader>
            <CardContent>
              <img
                src={issue.screenshotUrl}
                alt="이슈 스크린샷"
                className="max-w-full rounded border"
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* 우측: 사이드바 */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">상태</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={issue.status}
              onValueChange={(v) => handleStatusChange(v as IssueStatus)}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">담당자</CardTitle>
          </CardHeader>
          <CardContent>
            <IssueAssignSelect
              issueId={issue.id}
              currentAssigneeId={issue.assignedTo}
              teachers={teachers}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">카테고리</span>
              <IssueCategoryBadge category={issue.category as any} />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">우선순위</span>
              <IssuePriorityBadge priority={issue.priority as any} />
            </div>
          </CardContent>
        </Card>

        {issue.githubIssueUrl && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">GitHub</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <a
                href={issue.githubIssueUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                Issue #{issue.githubIssueNumber}
                <ExternalLink className="w-3 h-3" />
              </a>
              {issue.githubBranchName && (
                <p className="text-xs text-gray-500 font-mono">
                  {issue.githubBranchName}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
```

**Step 3: index.ts에 export 추가**

```typescript
export { IssueDetail } from './issue-detail'
export { IssueAssignSelect } from './issue-assign-select'
```

**Step 4: 커밋**

```bash
git add src/components/issues/issue-detail.tsx src/components/issues/issue-assign-select.tsx src/components/issues/index.ts
git commit -m "feat: 이슈 상세 및 담당자 할당 컴포넌트 추가"
```

---

### Task 8: 이슈 상세 페이지

**Files:**
- Create: `src/app/(dashboard)/issues/[id]/page.tsx`

**Step 1: 상세 페이지 작성**

```tsx
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { verifySession } from '@/lib/dal'
import { getIssueById } from '@/lib/actions/issues'
import { db } from '@/lib/db'
import { IssueDetail } from '@/components/issues/issue-detail'
import { IssueTimeline } from '@/components/issues/issue-timeline'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: '이슈 상세 | AI AfterSchool',
}

export default async function IssueDetailPage(props: {
  params: Promise<{ id: string }>
}) {
  const session = await verifySession()
  if (session.role !== 'DIRECTOR') {
    redirect('/dashboard')
  }

  const params = await props.params
  const issue = await getIssueById(params.id)

  if (!issue) {
    notFound()
  }

  // 담당자 할당을 위한 선생님 목록 조회
  const teachers = await db.teacher.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-6">
      <Link
        href="/issues"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" />
        이슈 목록으로
      </Link>

      <IssueDetail issue={issue} teachers={teachers} />

      <div className="lg:w-2/3">
        <IssueTimeline events={issue.events} />
      </div>
    </div>
  )
}
```

**Step 2: 빌드 확인**

Run: `cd /home/gon/projects/ai/ai-afterschool && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: 에러 없음

**Step 3: 커밋**

```bash
git add src/app/\(dashboard\)/issues/[id]/page.tsx
git commit -m "feat: 이슈 상세 페이지 추가 (상태 변경, 담당자 할당, 타임라인)"
```

**→ 테스터에게 전달: Task 6-8 완료 후 상세 페이지 E2E 검증 요청 (상태 변경, 담당자 할당, 타임라인 표시 확인)**

---

### Task 9: 최종 검증 및 정리

**Step 1: 전체 빌드 검증**

Run: `cd /home/gon/projects/ai/ai-afterschool && npm run build 2>&1 | tail -20`
Expected: 빌드 성공

**Step 2: 타입 체크**

Run: `cd /home/gon/projects/ai/ai-afterschool && npx tsc --noEmit --pretty`
Expected: 에러 없음

**Step 3: 최종 커밋 (필요 시)**

빌드 에러가 있으면 수정 후 커밋합니다.

**→ 테스터에게 전달: 전체 기능 통합 테스트 요청**
