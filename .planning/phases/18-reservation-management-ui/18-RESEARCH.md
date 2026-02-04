# Phase 18: Reservation Management UI - Research

**Researched:** 2026-02-04
**Domain:** React 19 + Next.js 15 + shadcn/ui pattern
**Confidence:** HIGH

## Summary

이번 연구는 Phase 18 "예약 관리 UI" 구현을 위한 기술적 접근 방식과 표준 패턴을 조사했습니다. 주요 연구 영역은 DatePicker 라이브러리, 시간 슬롯 그리드 UI, 상태 배지 컴포넌트, 확인 다이얼로그 패턴, 그리고 토스트 알림입니다.

**기존 프로젝트 상태:**
- Next.js 15.5.10 + React 19.2.3 사용 중
- Tailwind CSS 4.x, shadcn/ui 기반 (tabs, badge, button, card 등 존재)
- `date-fns` 4.1.0 설치됨
- Sonner 토스트 라이브러리 2.0.7 사용 중
- react-hook-form 7.71.1 + Zod 4.3.6 사용

**주요 발견:**
1. **DatePicker:** shadcn/ui Calendar는 react-day-picker v9를 기반으로 하며, 프로젝트에서는 아직 설치되지 않음. `npm install react-day-picker` 필요.
2. **시간 슬롯:** 30분 단위 슬롯 검증은 Phase 17 Server Actions에서 이미 구현됨 (`validate30MinuteSlot` 함수). UI는 커스텀 그리드로 구현 권장.
3. **상태 배지:** 기존 Badge 컴포넌트에 status variants 추가 필요 (blue/green/gray/orange).
4. **확인 다이얼로그:** shadcn/ui의 AlertDialog 패턴을 사용하거나 Radix UI의 AlertDialog를 설치 필요.
5. **토스트:** 기존 Sonner 설정 활용, 커스텀 아이콘과 테마 적용됨.

**Primary recommendation:** react-day-picker v9와 shadcn/ui Calendar 조합으로 DatePicker 구현, 커스텀 시간 슬롯 그리드는 Tailwind CSS Grid로 구현, AlertDialog는 Radix UI 기반 shadcn/ui 패턴 사용.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-day-picker | v9 (latest) | Date/calendar selection | shadcn/ui Calendar의 기반이며, WCAG 2.1 AA 준수, TypeScript 지원 |
| date-fns | 4.1.0 (installed) | Date manipulation | react-day-picker의 의존성, 이미 프로젝트에 설치됨 |
| sonner | 2.0.7 (installed) | Toast notifications | 이미 프로젝트에서 사용 중, 테마 및 커스텀 아이콘 설정됨 |
| react-hook-form | 7.71.1 (installed) | Form validation | 기존 패턴과 일관성, Zod 통합 지원 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/react-dialog | not installed | Alert/Confirm dialog | 확인 다이얼로그 구현 시 설치 필요 |
| @radix-ui/react-popover | not installed | Calendar dropdown | DatePicker를 popover로 표시 시 설치 (선택사항) |
| class-variance-authority | installed | Component variants | Badge status variants 구현 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-day-picker | Crisli Picker | Crisli는 최신 라이브러리이지만 커뮤니티 규모가 작음, shadcn/ui 생태계와의 통합성 고려 |
| 커스텀 시간 슬롯 | MUI X DateTimePicker | MUI는 추가 의존성이 큼, Tailwind CSS Grid로 충분히 구현 가능 |

**Installation:**
```bash
# 필수: DatePicker
npm install react-day-picker

# 선택사항: AlertDialog 컴포넌트 (shadcn/ui CLI 또는 수동 설치)
npx shadcn@latest add alert-dialog
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── counseling/
│   │   ├── CounselingHistoryList.tsx    # 기존 (상담 기록)
│   │   ├── CounselingSessionCard.tsx    # 기존
│   │   ├── CounselingSessionForm.tsx    # 기존
│   │   ├── ReservationManagementTabs.tsx   # NEW: 탭 컨테이너
│   │   ├── ReservationCalendar.tsx      # NEW: DatePicker + 날짜 선택
│   │   ├── ReservationList.tsx          # NEW: 예약 목록 (카드형)
│   │   ├── ReservationCard.tsx          # NEW: 예약 카드
│   │   ├── ReservationForm.tsx          # NEW: 예약 등록 폼
│   │   ├── TimeSlotGrid.tsx             # NEW: 시간 슬롯 그리드
│   │   └── ReservationStatusActions.tsx # NEW: 상태 변경 액션
│   └── ui/
│       ├── badge.tsx                    # 기존, status variants 추가
│       ├── calendar.tsx                 # NEW: shadcn/ui Calendar
│       ├── alert-dialog.tsx             # NEW: 확인 다이얼로그
│       └── tabs.tsx                     # 기존, 탭 UI에 사용
```

### Pattern 1: DatePicker with shadcn/ui Calendar + react-day-picker

**What:** 날짜 선택을 위한 캘린더 컴포넌트로 월 단위 탐색 제공

**When to use:** 예약 날짜 선택이 필요한 모든 화면

**Example:**
```typescript
// Source: https://daypicker.dev/, https://ui.shadcn.com/docs/components/calendar
"use client"

import { DayPicker } from "react-day-picker"
import "react-day-picker/style.css"
import { ko } from "date-fns/locale"

interface ReservationCalendarProps {
  selected: Date | undefined
  onSelect: (date: Date | undefined) => void
  disabled?: (date: Date) => boolean
}

export function ReservationCalendar({ selected, onSelect, disabled }: ReservationCalendarProps) {
  return (
    <DayPicker
      mode="single"
      selected={selected}
      onSelect={onSelect}
      disabled={disabled}
      locale={ko}
      className="rounded-md border"
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        // ... more classNames for styling
      }}
    />
  )
}
```

**Key features:**
- `mode="single"`: 단일 날짜 선택
- `locale={ko}`: 한국어 로케일
- `disabled` prop: 과거 날짜 또는 예약 불가능한 날짜 비활성화
- `classNames` prop: Tailwind CSS로 스타일링

### Pattern 2: Time Slot Grid with Tailwind CSS

**What:** 30분 단위 시간 슬롯을 그리드로 표시하는 컴포넌트

**When to use:** 예약 시간 선택 UI

**Example:**
```typescript
"use client"

import { format } from "date-fns"

interface TimeSlotGridProps {
  selectedDate: Date | undefined
  selectedTime: string | undefined
  onSelectTime: (time: string) => void
  reservedSlots: string[] // "09:00", "09:30", ... format
  startHour?: number // 기본값: 9
  endHour?: number   // 기본값: 18
}

export function TimeSlotGrid({
  selectedDate,
  selectedTime,
  onSelectTime,
  reservedSlots,
  startHour = 9,
  endHour = 18,
}: TimeSlotGridProps) {
  // 30분 단위 슬롯 생성
  const slots: string[] = []
  for (let hour = startHour; hour < endHour; hour++) {
    slots.push(`${String(hour).padStart(2, "0")}:00`)
    slots.push(`${String(hour).padStart(2, "0")}:30`)
  }

  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
      {slots.map((slot) => {
        const isReserved = reservedSlots.includes(slot)
        const isSelected = selectedTime === slot

        return (
          <button
            key={slot}
            type="button"
            disabled={isReserved}
            onClick={() => onSelectTime(slot)}
            className={`
              px-3 py-2 text-sm rounded-lg font-medium transition-all
              ${isSelected
                ? "bg-blue-600 text-white shadow-md"
                : isReserved
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300"
              }
            `}
          >
            {slot}
          </button>
        )
      })}
    </div>
  )
}
```

**Key features:**
- Tailwind CSS Grid (`grid-cols-4 sm:grid-cols-6 md:grid-cols-8`)로 반응형 레이아웃
- `reservedSlots`로 이미 예약된 시간 비활성화
- 30분 단위 슬롯 자동 생성 (00분, 30분)
- 접근성: `<button type="button">` 사용

### Pattern 3: Status Badge with Variants

**What:** 예약 상태를 컬러 배지로 표시

**When to use:** 예약 카드, 목록, 상세 화면

**Example:**
```typescript
// src/components/ui/badge.tsx에 status variants 추가
import { cva, type VariantProps } from "class-variance-authority"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-white hover:bg-destructive/80",
        outline: "text-foreground",
        // status variants for reservations
        scheduled: "border-transparent bg-blue-100 text-blue-800",
        completed: "border-transparent bg-green-100 text-green-800",
        cancelled: "border-transparent bg-gray-100 text-gray-800",
        noShow: "border-transparent bg-orange-100 text-orange-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

// 사용 예시
function getStatusVariant(status: ReservationStatus) {
  const variants = {
    SCHEDULED: "scheduled" as const,
    COMPLETED: "completed" as const,
    CANCELLED: "cancelled" as const,
    NO_SHOW: "noShow" as const,
  }
  return variants[status] ?? "default"
}
```

### Pattern 4: Confirmation Dialog with AlertDialog

**What:** 상태 변경 전 사용자 확인을 위한 다이얼로그

**When to use:** 예약 취소, 완료, 노쇼 처리 등 파괴적/변경 작업 전

**Example:**
```typescript
// shadcn/ui AlertDialog 패턴 사용
"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void | Promise<void>
  variant?: "default" | "destructive"
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  variant = "default",
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            variant={variant}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// 사용 예시
function ReservationCard({ reservation }: { reservation: Reservation }) {
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleCancel = async () => {
    const result = await cancelReservationAction(reservation.id)
    if (result.success) {
      toast.success("예약이 취소되었습니다")
    }
  }

  return (
    <div className="card">
      {/* ... card content */}
      <button onClick={() => setDialogOpen(true)}>취소</button>

      <ConfirmDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="예약 취소 확인"
        description={`${reservation.student.name} 학부모 상담 예약을 취소하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmLabel="예약 취소"
        onConfirm={handleCancel}
        variant="destructive"
      />
    </div>
  )
}
```

### Pattern 5: Toast Notifications with Sonner

**What:** 액션 결과를 사용자에게 피드백

**When to use:** 예약 생성, 수정, 삭제, 상태 변경 후

**Example:**
```typescript
// 이미 프로젝트에 설정된 Toaster 사용
import { toast } from "sonner"

// 성공
toast.success("예약이 완료되었습니다")

// 에러
toast.error("예약 생성 중 오류가 발생했습니다")

// 로딩 상태
toast.promise(
  createReservationAction(data),
  {
    loading: "예약 생성 중...",
    success: "예약이 완료되었습니다",
    error: "예약 생성 중 오류가 발생했습니다",
  }
)
```

**Best practices (from WebSearch):**
- 메시지는 간결하게 (1-2줄)
- 동시에 2-3개 이상 토스트 표시 금지
- 타입 적절히 사용 (success, error, info, warning)
- 토스트는 현실을 확인하는 용도, 콘텐츠를 대체하지 않음

### Anti-Patterns to Avoid

- **DatePicker에 Popover 미사용:** shadcn/ui의 Popover와 결합하지 않으면 캘린더가 항상 표시됨. 사용자 경험 저하.
- **시간 슬롯에 `<input type="time">` 사용:** 30분 단위 검증이 어렵고 UX가 좋지 않음. 커스텀 그리드 권장.
- **확인 다이얼로그 생략:** 취소/노쇼 등 파괴적 작업 전 확인 없이 실행하면 실수로 인한 문제 발생.
- **배지 컬러 하드코딩:** `bg-blue-100` 등을 컴포넌트에 직접 작성하지 말고 variants로 중앙 관리.
- **서버 액션 결과를 무시한 UI 업데이트:** `revalidatePath` 후에도 optimistic UI 또는 refresh 필요함.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date selection | 커스텀 캘린더 | react-day-picker | 월/연도 탐색, 로케일, 접근성, 키보드 네비게이션 등 복잡한 요구사항 |
| Form validation | onSubmit에서 수동 검증 | react-hook-form + Zod | Phase 17에서 이미 스키마 구현됨, 재사용 |
| Toast notifications | 커스텀 토스트 | sonner | 이미 프로젝트에 설정됨, 위치, 중복, 타이머 관리 |
| Modal/Dialog | window.confirm() | shadcn/ui AlertDialog | UX 일관성, 스타일링, 접근성 |

**Key insight:** DatePicker는 특히 "간단해 보이지만" 실제로는 월 탐색, 윤년, 요일 계산, 로케일, 키보드 접근성, ARIA 라벨 등 고려해야 할 사항이 매우 많습니다. react-day-picker는 이를 WCAG 2.1 AA 준수로 구현해 둔 상태입니다.

## Common Pitfalls

### Pitfall 1: DatePicker 로케일 미설정

**What goes wrong:** 캘린더가 영어로 표시되거나 요일 표기가 맞지 않음

**Why it happens:** react-day-picker는 기본적으로 English 로케일 사용

**How to avoid:** `locale={ko}` prop 전달 및 date-fns locale import

```typescript
import { ko } from "date-fns/locale"
<DayPicker locale={ko} />
```

**Warning signs:** 캘린더에 "Mon", "Tue" 등 영어 요일이 표시됨

### Pitfall 2: 시간 슬롯 타임존 문제

**What goes wrong:** 예약 시간이 예상과 다르게 저장됨

**Why it happens:** 클라이언트에서 `new Date("2026-02-04T09:00:00")`를 생성할 때 타임존이 로컬 시간으로 해석됨

**How to avoid:**
- ISO 8601 형식의 문자열로 서버에 전송
- 서버에서 `new Date(input)`으로 파싱 시 Prisma/DB가 타임존 처리

**Warning signs:** 테스트 시 예약 시간이 9시간(한국 UTC+9) 어긋남

### Pitfall 3: 상태 변경 후 UI 업데이트 누락

**What goes wrong:** 예약 취소 후 카드가 여전히 "예약됨"으로 표시됨

**Why it happens:** Server Action은 `revalidatePath`를 호출하지만 클라이언트 상태가 즉시 업데이트되지 않을 수 있음

**How to avoid:**
- Optimistic UI: 클릭 시 즉시 상태 변경 후 실패 시 롤백
- 또는 `router.refresh()` 호출
- 또는 상태 변경 성공 후 목록 재조회

```typescript
const handleCancel = async () => {
  // Optimistic update
  setReservations(prev =>
    prev.map(r => r.id === reservation.id ? { ...r, status: "CANCELLED" } : r)
  )

  const result = await cancelReservationAction(reservation.id)
  if (!result.success) {
    // Rollback
    setReservations(prev =>
      prev.map(r => r.id === reservation.id ? { ...r, status: "SCHEDULED" } : r)
    )
    toast.error(result.error)
  } else {
    toast.success("예약이 취소되었습니다")
    router.refresh() // 서버 컴포넌트 revalidate
  }
}
```

**Warning signs:** 상태 변경 후 페이지를 새로고침해야 반영됨

### Pitfall 4: 다이얼로그 트리거 시점 오류

**What goes wrong:** 상태 변경 버튼 클릭 시 다이얼로그 대신 바로 액션 실행됨

**Why it happens:** Event bubbling 또는 `<form>` 내의 버튼이 submit을 트리거함

**How to avoid:**
- 버튼에 `type="button"` 명시
- `onClick`에서 `event.preventDefault()` 호출

```typescript
<button
  type="button"  // 명시적으로 button 타입 지정
  onClick={(e) => {
    e.preventDefault()
    setDialogOpen(true)
  }}
>
  취소
</button>
```

**Warning signs:** 버튼 클릭 시 다이얼로그가 잠깐 보였다가 바로 사라짐

### Pitfall 5: 토스트 메시지 중복 표시

**What goes wrong:** 여러 예약을 연속 취소할 때 토스트가 쌓임

**Why it happens:** Sonner는 자동으로 토스트를 큐에 쌓음

**How to avoid:** 중요하지 않은 작업은 토스트 생략하거나, `toast.dismiss()`로 이전 토스트 닫기

```typescript
// 연속 작업 시
toast.dismiss() // 이전 토스트 닫기
toast.success("예약이 취소되었습니다")
```

**Warning signs:** 화면에 3개 이상의 토스트가 동시에 표시됨

## Code Examples

Verified patterns from official sources:

### DatePicker with Month Navigation

```typescript
// Source: https://daypicker.dev/docs/navigation
"use client"

import { DayPicker } from "react-day-picker"
import "react-day-picker/style.css"
import { ko } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"

export function ReservationCalendar() {
  const [month, setMonth] = useState(new Date())

  return (
    <DayPicker
      mode="single"
      month={month}
      onMonthChange={setMonth}
      locale={ko}
      classNames={{
        nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        // ... more classNames
      }}
      components={{
        Icon: ({ orientation, ...props }) =>
          orientation === "left" ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          ),
      }}
    />
  )
}
```

### Form with react-hook-form + Server Action

```typescript
// Source: https://dev.to/a1guy/react-19-deep-dive-forms-actions
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createReservationAction, type CreateReservationInput } from "@/lib/actions/reservations"
import { createReservationSchema } from "@/lib/validations/reservations"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function ReservationForm() {
  const router = useRouter()
  const form = useForm<CreateReservationInput>({
    resolver: zodResolver(createReservationSchema),
  })

  const onSubmit = async (data: CreateReservationInput) => {
    const result = await createReservationAction(data)

    if (result.success) {
      toast.success("예약이 완료되었습니다")
      router.push("/counseling?tab=reservations")
      router.refresh()
    } else {
      if (result.fieldErrors) {
        // 필드별 에러 표시
        Object.entries(result.fieldErrors).forEach(([field, errors]) => {
          form.setError(field as keyof CreateReservationInput, {
            type: "manual",
            message: errors?.[0],
          })
        })
      } else {
        toast.error(result.error || "예약 생성 중 오류가 발생했습니다")
      }
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* form fields */}
      <button type="submit">예약하기</button>
    </form>
  )
}
```

### Reservation Card Layout

```typescript
// Source: Based on existing CounselingSessionCard pattern
interface ReservationCardProps {
  reservation: ReservationWithRelations
  onCancel: () => void
  onComplete: () => void
  onNoShow: () => void
}

export function ReservationCard({ reservation, onCancel, onComplete, onNoShow }: ReservationCardProps) {
  const statusVariant = getStatusVariant(reservation.status)
  const statusLabel = getStatusLabel(reservation.status)

  return (
    <div className="border rounded-lg p-4 space-y-3 shadow-sm hover:shadow-md transition-shadow">
      {/* Header: Date and Status */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">
          {format(new Date(reservation.scheduledAt), "M월 d일 E요일 HH:mm", { locale: ko })}
        </span>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusVariant}`}>
          {statusLabel}
        </span>
      </div>

      {/* Details */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">{reservation.student.name}</span>
          <span className="text-gray-400">·</span>
          <span className="text-gray-600">{reservation.parent.relation}</span>
        </div>
        <div className="text-sm text-gray-700">{reservation.topic}</div>
      </div>

      {/* Actions: only for SCHEDULED */}
      {reservation.status === "SCHEDULED" && (
        <div className="flex gap-2 pt-2 border-t">
          <button
            type="button"
            onClick={onComplete}
            className="flex-1 px-3 py-1.5 text-sm rounded-md bg-green-50 text-green-700 hover:bg-green-100"
          >
            완료
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-3 py-1.5 text-sm rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onNoShow}
            className="flex-1 px-3 py-1.5 text-sm rounded-md bg-orange-50 text-orange-700 hover:bg-orange-100"
          >
            노쇼
          </button>
        </div>
      )}
    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `<input type="date">` | react-day-picker v9 | 2024-2025 | WCAG 준수, 로케일, 커스터마이징 용이 |
| window.confirm() | shadcn/ui AlertDialog | 2023-2024 | UX 일관성, 스타일링, 접근성 |
| 수동 토스트 관리 | Sonner | 2024+ | 자동 위치, 중복 관리, 테마 지원 |
| CSS-in-JS 스타일링 | Tailwind CSS + CVA | 2023+ | variants로 컴포넌트 스타일 중앙 관리 |

**Deprecated/outdated:**
- react-datepicker: 더 이상 활발히 유지되지 않음, react-day-picker 권장
- @radix-ui/react-dialog v0.x: v1.x로 업그레이드 필요

## Open Questions

Things that couldn't be fully resolved:

1. **선생님별 운영 시간 설정 UI**
   - What we know: Phase 18 CONTEXT.md에서 "선생님 설정이 없는 경우 기본 운영 시간 적용"이라고 명시
   - What's unclear: 선생님 설정을 어디서 관리하는지 (선생님 상세 페이지? 별도 설정 페이지?)
   - Recommendation: Phase 18 범위 밖일 수 있음, 기본 운영 시간(09:00~18:00)으로 먼저 구현 후 추후 확장

2. **예약 등록 폼의 페이지 전환 방식**
   - What we know: CONTEXT.md에서 "페이지 내 전환 (목록 → 폼 → 목록)"이라고 명시
   - What's unclear: URL 변경 없는 전환인지, `/counseling/new` 같은 별도 경로인지
   - Recommendation: 상태 기반 전환 (`view: "list" | "form"`)으로 구현하여 SPA 느낌 제공

3. **다중 예약 처리 (같은 시간에 여러 학생)**
   - What we know: Phase 17에서 중복 예약 검증(`createReservationWithConflictCheck`) 구현됨
   - What's unclear: 선생님이 같은 시간에 여러 예약을 허용하고 싶은 경우 (대기자 명단 등)
   - Recommendation: Phase 18에서는 중복 방지를 기본으로, 추후 요구사항에 따라 대기자 기능 추가

## Sources

### Primary (HIGH confidence)
- [react-day-picker](https://daypicker.dev/) - Official documentation, features, examples
- [shadcn/ui Calendar](https://ui.shadcn.com/docs/components/calendar) - Component integration guide
- [shadcn/ui AlertDialog](https://ui.shadcn.com/docs/components/radix/alert-dialog) - Dialog patterns
- [date-fns](https://date-fns.org/) (installed v4.1.0) - Date formatting, locale
- [sonner](https://sonner.emilkowal.ski/) (installed v2.0.7) - Toast notifications
- Project files:
  - `/home/gon/projects/ai/ai-afterschool/src/lib/actions/reservations.ts` - Server Actions
  - `/home/gon/projects/ai/ai-afterschool/src/lib/validations/reservations.ts` - Zod schemas
  - `/home/gon/projects/ai/ai-afterschool/src/components/counseling/*.tsx` - Existing counseling UI patterns
  - `/home/gon/projects/ai/ai-afterschool/src/components/ui/*.tsx` - UI components

### Secondary (MEDIUM confidence)
- [Medium: Implementing a Date Picker with ShadCN and React DayPicker](https://medium.com/@hrynkevych/implementing-a-date-picker-with-shadcn-and-react-day-picker-87e198c4df0c) - Implementation guide
- [dev.to: React 19 Deep Dive — Forms & Actions](https://dev.to/a1guy/react-19-deep-dive-forms-actions-with-useformstate-useformstatus-and-useoptimistic-4kdg) - React 19 form patterns
- [Medium: Sonner Modern Toast Notifications Done Right](https://medium.com/@rivainasution/shadcn-ui-react-series-part-19-sonner-modern-toast-notifications-done-right-903757c5681f) - Toast best practices
- [Tailwind CSS Gap Documentation](https://tailwindcss.com/docs/gap) - Grid spacing
- [Tailwind CSS v4 Tutorial 2026 - Grid System](https://www.youtube.com/watch?v=NF1n2vtvrCM) - Responsive grid patterns

### Tertiary (LOW confidence)
- [StackOverflow: Time slot 30 min interval](https://stackoverflow.com/questions/66742133/how-to-create-a-custom-component-to-select-time-in-30-mins-of-interval) - Community pattern
- [Crisli Picker](https://rupok.github.io/crisli-picker/) - Alternative time picker (not verified)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - react-day-picker 공식 문서 및 shadcn/ui 문서 확인
- Architecture: HIGH - 프로젝트 기존 패턴 분석 및 React 19 공식 문서 확인
- Pitfalls: MEDIUM - 일부는 WebSearch 기반이나 React 19 패턴은 공식 문서 검증

**Research date:** 2026-02-04
**Valid until:** 2026-03-06 (30일 - 안정적인 라이브러리)

**Phase directory:** `.planning/phases/18-reservation-management-ui/`
