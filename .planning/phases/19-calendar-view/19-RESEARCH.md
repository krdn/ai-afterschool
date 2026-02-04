# Phase 19: Calendar View - Research

**Researched:** 2026-02-04
**Domain:** React calendar visualization with react-day-picker v9
**Confidence:** HIGH

## Summary

Phase 19는 상담 예약 캘린더 시각화를 구현하는 단계입니다. react-day-picker v9와 date-fns v4를 활용하여 월간/주간 캘린더 뷰에서 예약 현황을 시각화해야 합니다.

**핵심 발견:**
1. **react-day-picker v9의 `components` prop과 `modifiers`**를 활용하여 날짜 셀에 예약 표시기(dot/badge) 추가 가능
2. **Custom `DayButton` 또는 `DayContent` 컴포넌트**로 예약 건수 표시 가능
3. **Korean locale (`ko`)**은 date-fns v4에서 기본 지원되며 `import { ko } from "date-fns/locale"`로 사용
4. **주간 뷰**는 react-day-picker의 week selection 패턴을 활용하거나 별도 시간 슬롯 그리드로 구현

**주요 권장사항:** react-day-picker의 Custom Components API를 활용하여 `DayButton` 컴포넌트를 확장하고, `modifiers`로 예약된 날짜를 표시하는 방식을 사용하세요.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-day-picker | 9.13.0 | Date picker/calendar component | React 표준 라이브러리, 접근성 우수, TypeScript 지원 |
| date-fns | 4.1.0 | Date manipulation & formatting | Modular, immutable, 한국어 로케일 지원 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| clsx / cn | 기존 사용 | Class name utilities | Tailwind 스타일링을 위해 이미 프로젝트에 있음 |
| Recharts | Phase 14에서 도입 | 차트 시각화 | 통계 대시보드(Phase 21)를 위해 이미 있음 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-day-picker | FullCalendar | FullCalendar는 더 강력하지만 용량이 크고 복잡함. 간단한 예약 캘린더에는 과함 |
| react-day-picker | @schedule-x/react | 전용 스케줄러지만 러닝 커브가 있고 별도 의존성 추가 필요 |

**Installation:**
```bash
# 이미 설치됨 (package.json 확인됨)
# date-fns@4.1.0, react-day-picker@9.13.0
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── counseling/
│   │   ├── ReservationCalendar.tsx      # 기존 단일 날짜 선택 캘린더
│   │   ├── ReservationCalendarMonth.tsx # [NEW] 월간 캘린더 뷰 (예약 표시)
│   │   ├── ReservationCalendarWeek.tsx  # [NEW] 주간 캘린더 뷰 (시간대별)
│   │   └── TimeSlotGrid.tsx             # [FROM 18-03] 기존 시간 슬롯 그리드
│   └── ui/
│       └── calendar.tsx                 # shadcn/ui Calendar (참고용)
├── lib/
│   ├── db/
│   │   └── reservations.ts              # [FROM 17] getReservations 함수 활용
│   └── utils/
│       └── calendar.ts                  # [NEW] 캘린더 유틸리티 함수
```

### Pattern 1: Custom DayButton with Reservation Count
**What:** `DayButton` 컴포넌트를 확장하여 날짜 셀 내부에 예약 건수를 표시
**When to use:** 월간 캘린더 뷰에서 각 날짜의 예약 현황을 시각화할 때
**Example:**
```typescript
// Source: https://daypicker.dev/guides/custom-components
import { DayButtonProps, DayPicker, UI, useDayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";

interface ReservationDayButtonProps extends DayButtonProps {
  reservationCount?: number;
}

function ReservationDayButton(props: ReservationDayButtonProps) {
  const { components, classNames } = useDayPicker();
  const { day, reservationCount = 0, ...buttonProps } = props;

  return (
    <components.DayButton
      {...buttonProps}
      day={day}
      className={cn(
        classNames[UI.DayButton],
        "relative h-14 w-14" // 높이를 늘려서 컨텐츠 공간 확보
      )}
    >
      <span>{day.date.getDate()}</span>
      {reservationCount > 0 && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
          {Array.from({ length: Math.min(reservationCount, 3) }).map((_, i) => (
            <span
              key={i}
              className="h-1 w-1 rounded-full bg-primary"
              aria-hidden="true"
            />
          ))}
        </div>
      )}
    </components.DayButton>
  );
}
```

### Pattern 2: Modifiers for Reserved Days
**What:** `modifiers` prop으로 예약된 날짜에 CSS 클래스 적용
**When to use:** 예약된 날짜를 시각적으로 강조할 때
**Example:**
```typescript
// Source: https://daypicker.dev/guides/custom-modifiers
import { DayPicker } from "react-day-picker";
import { isSameDay } from "date-fns";

interface ReservationCalendarProps {
  reservedDates: Date[]; // 예약된 날짜 배열
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
}

export function ReservationCalendarMonth({
  reservedDates,
  selected,
  onSelect,
}: ReservationCalendarProps) {
  return (
    <DayPicker
      mode="single"
      selected={selected}
      onSelect={onSelect}
      locale={ko}
      modifiers={{
        reserved: reservedDates, // 예약된 날짜에 "reserved" modifier 적용
      }}
      modifiersClassNames={{
        reserved: "bg-primary/10 border-primary/50", // Tailwind 스타일
      }}
      classNames={{
        day: cn(
          "h-14 w-14 p-0 font-normal flex items-center justify-center rounded-md",
          "hover:bg-accent hover:text-accent-foreground",
          "transition-colors relative"
        ),
      }}
    />
  );
}
```

### Pattern 3: Weekly View with Time Slots
**What:** 주간 뷰에서 시간대별 예약 현황을 표시하는 시간 슬롯 그리드
**When to use:** CALENDAR-02 요구사항을 충족할 때
**Example:**
```typescript
// Source: https://daypicker.dev/guides/custom-selections (week selection)
import { startOfWeek, endOfWeek, format } from "date-fns";
import { ko } from "date-fns/locale";

interface ReservationCalendarWeekProps {
  weekStart: Date; // 주간 뷰 기준 날짜
  reservations: Array<{
    scheduledAt: Date;
    student: { name: string };
  }>;
}

// 영업시간 (9:00 ~ 18:00, 30분 단위)
const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
];

export function ReservationCalendarWeek({
  weekStart,
  reservations,
}: ReservationCalendarWeekProps) {
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const weekDates: Date[] = [];
  let current = startOfWeek(weekStart, { weekStartsOn: 1 });
  while (current <= weekEnd) {
    weekDates.push(current);
    current = new Date(current.getTime() + 86400000); // +1 day
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* 요일 헤더 */}
      <div className="grid grid-cols-8 border-b bg-muted">
        <div className="p-2 text-sm font-medium text-center">시간</div>
        {weekDates.map((date) => (
          <div key={date.toISOString()} className="p-2 text-center">
            <div className="text-xs text-muted-foreground">
              {format(date, "E", { locale: ko })}
            </div>
            <div className="text-sm font-medium">
              {format(date, "M/d", { locale: ko })}
            </div>
          </div>
        ))}
      </div>

      {/* 시간 슬롯 그리드 */}
      <div className="max-h-96 overflow-y-auto">
        {TIME_SLOTS.map((time) => (
          <div key={time} className="grid grid-cols-8 border-b">
            <div className="p-2 text-xs text-muted-foreground text-center">
              {time}
            </div>
            {weekDates.map((date) => {
              const slotDateTime = new Date(
                `${format(date, "yyyy-MM-dd")}T${time}:00`
              );
              const reservation = reservations.find((r) =>
                isSameDay(r.scheduledAt, slotDateTime) &&
                r.scheduledAt.getHours() === slotDateTime.getHours()
              );

              return (
                <div
                  key={date.toISOString()}
                  className={cn(
                    "p-2 border-l text-xs text-center",
                    reservation && "bg-primary/10 font-medium"
                  )}
                >
                  {reservation?.student.name ?? "-"}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Anti-Patterns to Avoid
- **전체 캘린더를 직접 구현**: react-day-picker의 Custom Components를 활용하세요. HTML table/grid를 직접 만들면 접근성과 키보드 네비게이션 구현이 복잡합니다.
- **modifiers 대신 inline 스타일링만 사용**: `modifiersClassNames`와 Tailwind variants를 조합하여 유지보수 가능한 스타일링을 하세요.
- **로케일 하드코딩**: `format(date, "yyyy년 M월 d일", { locale: ko })` 형식을 사용하고, 다국어 지원이 필요하면 context로 관리하세요.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Calendar month grid | HTML table 직접 구현 | react-day-picker `DayPicker` | 접근성(ARIA), 키보드 네비게이션, 포커스 관리가 이미 구현됨 |
| Date formatting | `toLocaleDateString()` 직접 사용 | date-fns `format()` with locale | 일관된 포맷, 한국어 로케일, 타임존 지원 |
| Week calculation | 직접 날짜 계산 | date-fns `startOfWeek`, `endOfWeek` | DST, 월말/월초 edge case 처리됨 |
| Time slot generation | 매번 계산 | 상수 배열 `TIME_SLOTS` | 일관된 30분 단위 슬롯 보장 |

**Key insight:** react-day-picker v9의 Custom Components API는 기본 동작(접근성, 포커스, modifier)을 유지하면서 UI를 확장할 수 있게 설계되었습니다. `useDayPicker` hook으로 기본 컴포넌트를 활용하세요.

## Common Pitfalls

### Pitfall 1: Korean Locale Import Path
**What goes wrong:** `import { ko } from "date-fns/locale"`가 v4에서도 작동하는지 불확실
**Why it happens:** date-fns v4는 최근 버전이고 문서가 부족할 수 있음
**How to avoid:** 프로젝트에서 이미 사용 중인 `ReservationCalendar.tsx`를 확인 (`import { ko } from "date-fns/locale"`가 작동 중)
**Warning signs:** 타입 에러 `Module '"date-fns/locale"' has no exported member 'ko'`

### Pitfall 2: DayButton Custom Component에서 Props Forwarding 누락
**What goes wrong:** 커스텀 `DayButton`에서 `ref`, `aria-*`, 이벤트 핸들러를 전달하지 않음
**Why it happens:** 공식 문서의 "Compose with the defaults" 패턴을 따르지 않음
**How to avoid:** 반드시 `useDayPicker()` hook으로 `components.DayButton`을 래핑하여 기본 동작 유지
**Warning signs:** 키보드 네비게이션 동작 안 함, 스크린 리더가 날짜를 읽지 않음

### Pitfall 3: Modifier와 Custom Components 중복 사용
**What goes wrong:** `modifiers`와 `modifiersClassNames`로 예약 표시하면서 동시에 `DayButton`에서도 표시하려 함
**Why it happens:** 두 API의 역할을 명확히 이해하지 못함
**How to avoid:** `modifiers`는 간단한 CSS 클래스 적용, Custom Components는 복잡한 렌더링(건수 표시 등)에만 사용
**Warning signs:** 같은 기능을 두 곳에서 구현하게 됨

### Pitfall 4: 주간 뷰에서 시간대별 예약 매칭 오류
**What goes wrong:** `scheduledAt` DateTime과 시간 슬롯이 정확히 매칭되지 않음
**Why it happens:** 날짜 비교 시 시간/분/초 무시, 타임존 문제
**How to avoid:** `isSameDay(r.scheduledAt, slotDateTime)` + 시간대별 필터링, KST 명시적 처리
**Warning signs:** 예약이 표시되지 않거나 잘못된 슬롯에 표시됨

## Code Examples

Verified patterns from official sources:

### Custom DayButton with Content Extension
```typescript
// Source: https://daypicker.dev/guides/custom-components
import { DayButtonProps, DayPicker, UI, useDayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";

function CustomDayButton(props: DayButtonProps) {
  const { components, classNames } = useDayPicker();
  return (
    <components.DayButton
      {...props}
      className={cn(classNames[UI.DayButton], "my-custom-class")}
    >
      <span>{props.day.date.getDate()}</span>
      <small aria-hidden>★</small> {/* 추가 컨텐츠 */}
    </components.DayButton>
  );
}

export function WrappedDayExample() {
  return <DayPicker components={{ DayButton: CustomDayButton }} />;
}
```

### Modifiers for Reserved Days
```typescript
// Source: https://daypicker.dev/guides/custom-modifiers
import { DayPicker } from "react-day-picker";

const bookedDays = [
  new Date(2024, 5, 8),
  new Date(2024, 5, 9),
  { from: new Date(2024, 5, 15), to: new Date(2024, 5, 20) }
];

export function ModifiersCustom() {
  return (
    <DayPicker
      defaultMonth={new Date(2024, 5)}
      modifiers={{ booked: bookedDays }}
      modifiersClassNames={{ booked: "bg-primary/10" }}
    />
  );
}
```

### Korean Locale Formatting
```typescript
// Source: https://date-fns.org/docs/format + 기존 코드 확인
import { format } from "date-fns";
import { ko } from "date-fns/locale";

const date = new Date(2026, 0, 15);

// Full date format in Korean
const formatted = format(date, "yyyy년 M월 d일 EEEE", { locale: ko });
// Result: "2026년 1월 15일 목요일"

// react-day-picker locale prop
<DayPicker locale={ko} />
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-day-picker v8 | react-day-picker v9 | 2024 | Custom Components API 개선, `components` prop 구조 변경 |
| date-fns v3 | date-fns v4 | 2024-09 | 타임존 지원 개선, 한국어 로케일 호환 유지 |
| Inline styling | Tailwind + `classNames` prop | Phase 18 | 이미 프로젝트에서 Tailwind 패턴 사용 중 |

**Deprecated/outdated:**
- react-day-picker v8: v9로 마이그레이션 완료됨 (기존 코드는 v9 사용)
- `formatters` prop: Custom Components로 대체 권장

## Open Questions

1. **주간 뷰 구현 방식**
   - What we know: react-day-picker에는 전용 "주간 뷰" 모드가 없음
   - What's unclear: 월간 캘린더에서 주를 선택하는 방식 vs 별도 시간 슬롯 그리드
   - Recommendation: CALENDAR-02 요구사항을 확인 후 별도 `ReservationCalendarWeek` 컴포넌트로 구현 (Pattern 3 참조)

2. **예약 건수 표시 UI 패턴**
   - What we know: dot indicators 또는 숫자 badge 가능
   - What's unclear: 사용자가 3건 이상의 예약을 어떻게 인지해야 하는지
   - Recommendation: 3개까지만 표시하고 그 이상은 "+N" 표시 또는 tooltip

## Sources

### Primary (HIGH confidence)
- [/gpbl/react-day-picker](https://context7.com/gpbl/react-day-picker) - Custom Components, Modifiers, Week Selection
- [daypicker.dev - Custom Components Guide](https://daypicker.dev/guides/custom-components) - `components` prop, `useDayPicker` hook
- [daypicker.dev - Custom Modifiers Guide](https://daypicker.dev/guides/custom-modifiers) - `modifiers`, `modifiersClassNames`
- [daypicker.dev - Custom Selections (Week)](https://daypicker.dev/guides/custom-selections) - Week selection pattern

### Secondary (MEDIUM confidence)
- [date-fns Format Documentation](https://date-fns.org/docs/format) - Date formatting with locale
- [Web search: date-fns Korean locale](https://github.com/date-fns/date-fns/blob/main/docs/i18n.md) - Korean locale support
- [Web search: React calendar weekly view](https://dhtmlx.com/blog/best-react-scheduler-components-dhtmlx-bryntum-syncfusion-daypilot-fullcalendar/) - Weekly calendar patterns

### Tertiary (LOW confidence)
- [GitHub Discussion: Custom Day component](https://github.com/gpbl/react-day-picker/discussions/2069) - Community discussion (unverified)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - react-day-picker v9, date-fns v4는 공식 문서와 프로젝트 package.json으로 확인
- Architecture: HIGH - Context7과 공식 문서의 예제로 검증됨
- Pitfalls: MEDIUM - 일부는 WebSearch 기반이나 공식 문서로 검증 가능

**Research date:** 2026-02-04
**Valid until:** 2026-03-04 (30일 - react-day-picker v9와 date-fns v4는 안정적이지만 월간 업데이트 확인 권장)
