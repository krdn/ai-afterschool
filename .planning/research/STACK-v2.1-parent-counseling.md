# Technology Stack: v2.1 Parent Counseling

**Project:** AI AfterSchool (학부모 상담 예약/기록 시스템)
**Milestone:** v2.1 Parent Counseling Management
**Researched:** 2026-02-04
**Overall Confidence:** HIGH

## Executive Summary

학부모 상담 예약/기록 시스템은 **기존 스택만으로 대부분 구현 가능**합니다. 유일한 추가 사항은 상담 예약 날짜 선택 UX 개선을 위한 **react-day-picker + shadcn/ui Calendar/DatePicker** 컴포넌트입니다. 상담 기록, 통계 기능은 이미 기본 구현이 완료되어 있어(CounselingSession 모델, actions, 컴포넌트), UI/UX 개선과 기능 확장에 집중하면 됩니다.

**Key Point:** 신규 라이브러리 추가 최소화. 기존 스택 활용 극대화.

---

## Current State Analysis

### Already Implemented (Reusable)

| Feature | Status | Location |
|---------|--------|----------|
| **CounselingSession 모델** | Complete | `prisma/schema.prisma:443-463` |
| **상담 기록 CRUD actions** | Complete | `src/lib/actions/performance.ts` |
| **상담 목록/필터 페이지** | Complete | `src/app/(dashboard)/counseling/page.tsx` |
| **상담 기록 폼** | Complete | `src/components/counseling/CounselingSessionForm.tsx` |
| **상담 통계 조회** | Complete | `src/lib/actions/analytics.ts` (getCounselingStats) |
| **date-fns** | v4.1.0 | 날짜 처리 |
| **React Hook Form + Zod** | v7.71.1 / v4.3.6 | 폼 검증 |
| **Recharts** | v3.7.0 | 통계 차트 |
| **shadcn/ui components** | Installed | Button, Card, Select, Input, Form, Table, Tabs, Badge 등 |

### Missing (Need to Add)

| Component | Why Needed | Solution |
|-----------|------------|----------|
| **Calendar** | 상담 예약 날짜 시각화 | shadcn/ui calendar |
| **DatePicker** | 상담 날짜 선택 UX 개선 | shadcn/ui date-picker |
| **Popover** | DatePicker 의존성 | shadcn/ui popover |
| **react-day-picker** | Calendar/DatePicker 기반 | npm dependency |

---

## New Technologies for v2.1

### UI Components (Required)

| Technology | Version | Purpose | Confidence |
|------------|---------|---------|------------|
| **react-day-picker** | ^9.13.0 | shadcn/ui Calendar 기반 라이브러리 | **HIGH** |
| **@radix-ui/react-popover** | ^1.1.6 | DatePicker 드롭다운 컨테이너 | **HIGH** |

#### react-day-picker v9.13.0

**선택 이유:**
- shadcn/ui Calendar 컴포넌트의 공식 기반 라이브러리
- 이미 사용 중인 date-fns v4와 완벽 호환 (dependencies로 포함)
- 접근성(WCAG 2.1) 지원
- 한국어 로케일 네이티브 지원 (`ko` locale)
- TypeScript 완전 지원
- 6M+ weekly downloads, 6.4K GitHub stars

**주요 v9 기능:**
- date-fns가 peer dependency에서 dependency로 변경 (설치 간소화)
- 타임존 지원
- 드롭다운 연/월 선택
- 개선된 커스텀 컴포넌트 지원
- CSS 변수 기반 스타일링

**Sources:**
- [npm: react-day-picker](https://www.npmjs.com/package/react-day-picker)
- [React DayPicker Docs](https://daypicker.dev)
- [shadcn/ui Calendar](https://ui.shadcn.com/docs/components/calendar)

#### @radix-ui/react-popover v1.1.6

**선택 이유:**
- shadcn/ui date-picker 필수 의존성
- 이미 프로젝트에서 다른 @radix-ui 컴포넌트 사용 중:
  - @radix-ui/react-select (v2.2.6)
  - @radix-ui/react-label (v2.1.8)
  - @radix-ui/react-slot (v1.2.4)
- 일관된 접근성 패턴

---

## Installation

### Step 1: shadcn/ui Components (Recommended)

```bash
# shadcn CLI가 의존성 자동 설치
npx shadcn@latest add calendar popover
```

이 명령어가 자동 생성/설치하는 것들:
- `src/components/ui/calendar.tsx`
- `src/components/ui/popover.tsx`
- npm dependencies: react-day-picker, @radix-ui/react-popover

### Step 2: Manual Install (Only if needed)

```bash
# shadcn CLI 문제 시 수동 설치
npm install react-day-picker@^9.13.0 @radix-ui/react-popover@^1.1.6
```

---

## Integration Points

### 기존 스택과의 통합

| Existing Library | Integration |
|------------------|-------------|
| **date-fns v4.1.0** | react-day-picker v9가 date-fns를 포함. 버전 호환됨. `format`, `parse` 함수 공유 |
| **React Hook Form v7.71.1** | DatePicker를 `Controller`로 감싸서 폼 통합 |
| **Zod v4.3.6** | 기존 `counselingSchema` 날짜 검증 확장 |
| **shadcn/ui Select** | 시간 선택 드롭다운에 재사용 |
| **Recharts v3.7.0** | 상담 통계 차트에 기존 패턴 재사용 |
| **TanStack Table v8.21.3** | 상담 목록 테이블 정렬/필터에 재사용 |

### Code Integration Pattern

```typescript
// 기존 Input type="date" 대체 예시
// Before (현재 CounselingSessionForm.tsx)
<Input type="date" {...form.register("sessionDate")} />

// After (DatePicker 적용)
<Controller
  control={form.control}
  name="sessionDate"
  render={({ field }) => (
    <DatePicker
      date={field.value ? new Date(field.value) : undefined}
      onSelect={(date) => field.onChange(date?.toISOString().split('T')[0])}
    />
  )}
/>
```

---

## Prisma Schema Considerations

### 현재 CounselingSession 모델 (변경 불필요)

```prisma
model CounselingSession {
  id                String          @id @default(cuid())
  studentId         String
  teacherId         String
  sessionDate       DateTime        // 상담 실시일
  duration          Int             // 상담 시간 (분)
  type              CounselingType  // ACADEMIC, CAREER, PSYCHOLOGICAL, BEHAVIORAL
  summary           String          // 상담 내용 요약
  followUpRequired  Boolean         @default(false)
  followUpDate      DateTime?       // 후속 조치 예정일
  satisfactionScore Int?            // 만족도 (1-5)
  // ... timestamps, relations
}
```

**현재 모델로 충분한 이유:**
- `sessionDate`: 상담 실시일 (과거/현재)
- `followUpDate`: 다음 상담 예정일 (미래) - 예약 기능에 활용 가능
- 운영 방식이 "선생님 중심, 내부 기록"이므로 외부 예약 시스템 불필요

### Optional Enhancement (Only if Needed)

요구사항 확장 시 고려할 필드:

```prisma
model CounselingSession {
  // ... existing fields

  // 예약 관리 확장 (선택적)
  status            String?        @default("completed") // scheduled, completed, cancelled
  parentName        String?        // 학부모 이름 (내부 기록용)
  parentPhone       String?        // 학부모 연락처 (내부 기록용)
  notes             String?        // 추가 메모
}
```

**권장:** 초기에는 기존 스키마 유지, 필요 시 점진적 확장

---

## NOT Recommended

### Libraries to Avoid

| Library | Reason |
|---------|--------|
| **FullCalendar** | 복잡한 이벤트 캘린더 불필요. 번들 크기 200KB+. 단순 날짜 선택에 과잉 |
| **react-big-calendar** | 드래그앤드롭 일정 관리 불필요. 선생님 내부 기록 용도에 부적합 |
| **react-datepicker** | shadcn/ui 스타일과 불일치. react-day-picker가 공식 권장 |
| **moment.js** | date-fns 이미 사용 중. moment는 deprecated 경향, 번들 크기 큼 |
| **Twilio/SMS API** | 운영 방식: "외부 알림 없음" 명시 |
| **카카오 알림톡 API** | 운영 방식: "학부모 직접 접속 없음" 명시 |
| **socket.io/실시간** | 실시간 알림 불필요. Server Actions + revalidatePath 충분 |

### Anti-Patterns to Avoid

| Pattern | Reason | Alternative |
|---------|--------|-------------|
| 새로운 상태 관리 라이브러리 | React useState + Server Actions로 충분 | 기존 패턴 유지 |
| 복잡한 캘린더 뷰 | 선생님 중심 단순 기록 용도 | 리스트 + DatePicker |
| 외부 알림 시스템 | 요구사항에 명시적으로 제외됨 | 대시보드 표시로 충분 |
| 별도 예약 테이블 | CounselingSession.followUpDate로 충분 | 기존 모델 활용 |

---

## Bundle Impact

### Expected Changes

| Addition | Estimated Size | Justification |
|----------|---------------|---------------|
| react-day-picker | ~45KB gzipped | 캘린더 필수 기능, tree-shakeable |
| @radix-ui/react-popover | ~8KB gzipped | DatePicker 필수 의존성 |
| **Total** | **~53KB** | 기존 번들 대비 미미한 증가 |

### Optimization

```typescript
// dynamic import for calendar (optional)
const Calendar = dynamic(
  () => import('@/components/ui/calendar').then(mod => mod.Calendar),
  { ssr: false, loading: () => <Input type="date" /> }
)
```

---

## Development Timeline Impact

| Phase | Effort | Notes |
|-------|--------|-------|
| 컴포넌트 설치 | 10분 | `npx shadcn add calendar popover` |
| DatePicker 적용 | 1-2시간 | 기존 Input 교체 |
| 캘린더 뷰 추가 | 2-4시간 | 선택적 기능 |
| 통계 차트 확장 | 2-4시간 | 기존 Recharts 패턴 활용 |

**총 예상:** 기존 구현 활용으로 1-2일 내 완료 가능

---

## Confidence Assessment

| Area | Confidence | Evidence |
|------|------------|----------|
| react-day-picker 버전 | HIGH | npm registry 직접 확인 (v9.13.0, 2026-01) |
| shadcn/ui 통합 방식 | HIGH | 공식 문서 확인 |
| date-fns 호환성 | HIGH | package.json 확인 (v4.1.0), rdp v9 문서 확인 |
| 기존 구현 재사용 | HIGH | 소스 코드 직접 분석 |
| 스키마 변경 불필요 | MEDIUM | 요구사항 명확화 필요 |

---

## Sources

- [shadcn/ui Calendar Documentation](https://ui.shadcn.com/docs/components/calendar) - 공식 설치 가이드
- [shadcn/ui Date Picker Documentation](https://ui.shadcn.com/docs/components/date-picker) - 구현 패턴
- [react-day-picker npm](https://www.npmjs.com/package/react-day-picker) - 버전 정보
- [React DayPicker v9 Docs](https://daypicker.dev) - API 문서
- [7 Best shadcn/ui Date Picker Components (2026)](https://www.jqueryscript.net/blog/best-shadcn-ui-date-picker.html) - 비교 분석
- 프로젝트 소스 코드 직접 분석:
  - `/home/gon/projects/ai/ai-afterschool/package.json`
  - `/home/gon/projects/ai/ai-afterschool/prisma/schema.prisma`
  - `/home/gon/projects/ai/ai-afterschool/src/components/counseling/`
  - `/home/gon/projects/ai/ai-afterschool/src/lib/actions/performance.ts`
  - `/home/gon/projects/ai/ai-afterschool/src/lib/actions/analytics.ts`

---

*Researched: 2026-02-04*
*Confidence: HIGH*
