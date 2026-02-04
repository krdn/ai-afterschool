# Architecture Research: 학부모 상담 관리 시스템

## Executive Summary

AI AfterSchool v2.1 학부모 상담 관리 기능은 **기존 아키텍처를 90% 이상 재사용**할 수 있습니다. Phase 14에서 이미 `CounselingSession` 모델과 상담 기록/조회 기능이 구현되어 있어, v2.1에서는 **학부모 상담 예약 기능 추가**와 **기존 UI/UX 개선**에 집중해야 합니다.

**핵심 발견:** 기존 CounselingSession 모델이 성과 분석용으로 설계되어 있어 학부모 상담 예약 전용 필드(학부모 연락처, 예약 상태, 시간대)가 부족합니다. 새 모델 `ParentCounselingReservation`을 추가하거나 기존 모델을 확장해야 합니다.

---

## Integration Points

### Database Layer

#### 기존 모델 (재사용 가능)

```prisma
// 현재 CounselingSession 모델 - 이미 구현됨
model CounselingSession {
  id                String          @id @default(cuid())
  studentId         String
  teacherId         String
  sessionDate       DateTime        // 상담일
  duration          Int             // 상담 시간 (분)
  type              CounselingType  // ACADEMIC, CAREER, PSYCHOLOGICAL, BEHAVIORAL
  summary           String          // 상담 내용 요약
  followUpRequired  Boolean         @default(false)
  followUpDate      DateTime?       // 후속 조치 예정일
  satisfactionScore Int?            // 만족도 점수 (1-5)
  // ... relations
}
```

**현재 상태:**
- 상담 유형: `ACADEMIC`, `CAREER`, `PSYCHOLOGICAL`, `BEHAVIORAL`
- 상담 기록 CRUD 완료
- 후속 조치 관리 완료
- 만족도 점수 기록 완료

#### 새 모델 추가 필요: ParentCounselingReservation

```prisma
// 학부모 상담 예약 전용 모델 (신규)
model ParentCounselingReservation {
  id                String                    @id @default(cuid())
  studentId         String
  teacherId         String
  reservationDate   DateTime                  // 예약 날짜
  startTime         String                    // 시작 시간 (예: "14:00")
  endTime           String                    // 종료 시간 (예: "14:30")
  status            ReservationStatus         @default(SCHEDULED)
  parentName        String                    // 학부모 이름
  parentPhone       String?                   // 학부모 연락처
  parentRelation    ParentRelation            @default(MOTHER)
  counselingType    CounselingType            // 상담 유형
  notes             String?                   // 예약 메모
  counselingSessionId String?                 // 연결된 상담 기록 (완료 시)
  createdAt         DateTime                  @default(now())
  updatedAt         DateTime                  @updatedAt

  student           Student                   @relation(fields: [studentId], references: [id], onDelete: Cascade)
  teacher           Teacher                   @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  counselingSession CounselingSession?        @relation(fields: [counselingSessionId], references: [id])

  @@index([teacherId, reservationDate])
  @@index([studentId, reservationDate])
  @@index([status, reservationDate])
}

enum ReservationStatus {
  SCHEDULED   // 예정
  COMPLETED   // 완료
  CANCELLED   // 취소
  NO_SHOW     // 노쇼
}

enum ParentRelation {
  FATHER
  MOTHER
  GUARDIAN
  OTHER
}
```

**설계 결정 근거:**
1. **별도 모델 vs 기존 모델 확장**: 별도 모델 선택
   - 예약과 기록은 다른 라이프사이클 (예약 -> 완료/취소 -> 기록)
   - 기존 CounselingSession에 영향 없이 기능 추가 가능
   - 예약 상태 관리가 명확해짐

2. **시간 필드 분리**: `startTime`/`endTime` 문자열 사용
   - DateTime으로 하면 날짜 중복 저장
   - 시간대 처리 간소화
   - 달력 UI 연동 용이

#### Student 모델 확장 (선택적)

```prisma
// Student 모델에 학부모 정보 추가 (선택적)
model Student {
  // ... 기존 필드

  // 학부모 정보 (선택적 - 예약 시 기본값으로 사용)
  parentName        String?
  parentPhone       String?
  parentRelation    ParentRelation?

  // ... 기존 relations
  parentCounselingReservations ParentCounselingReservation[]
}
```

### Server Actions Layer

#### 기존 액션 (재사용)

| 파일 | 액션 | 용도 |
|------|------|------|
| `performance.ts` | `recordCounselingAction` | 상담 기록 생성 |
| `performance.ts` | `updateCounselingAction` | 상담 기록 수정 |
| `performance.ts` | `deleteCounselingAction` | 상담 기록 삭제 |

#### 새 액션 필요

```typescript
// src/lib/actions/parent-counseling.ts (신규)

// 예약 관련
export async function createReservationAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState>

export async function updateReservationAction(
  reservationId: string,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState>

export async function cancelReservationAction(
  reservationId: string
): Promise<ActionState>

export async function completeReservationAction(
  reservationId: string,
  counselingData: FormData
): Promise<ActionState>

// 조회 관련
export async function getUpcomingReservationsAction(
  teacherId: string,
  options?: { days?: number }
): Promise<Reservation[]>

export async function getReservationsByStudentAction(
  studentId: string
): Promise<Reservation[]>

// 통계 관련
export async function getCounselingStatsAction(
  teacherId: string,
  options?: { startDate?: Date; endDate?: Date }
): Promise<CounselingStats>
```

#### 기존 패턴 재사용

```typescript
// 기존 패턴 - performance.ts에서 복사
export async function createReservationAction(
  prevState: ActionState,
  formData: FormData
) {
  const session = await verifySession() // DAL 재사용
  if (!session) {
    return { error: "인증이 필요합니다." }
  }

  // RBAC: TEACHER는 자신의 학생만 접근 가능
  if (session.role === "TEACHER") {
    const rbacDb = getRBACPrisma(session) // RBAC 재사용
    const student = await rbacDb.student.findFirst({
      where: { id: studentId },
    })
    if (!student) {
      return { error: "해당 학생에 대한 권한이 없습니다." }
    }
  }

  // ... 예약 생성 로직

  revalidatePath(`/counseling`) // 캐시 무효화 패턴 재사용
  revalidatePath(`/students/${studentId}`)
  return { success: true }
}
```

### UI Components Layer

#### 기존 컴포넌트 (재사용)

| 컴포넌트 | 위치 | 용도 |
|----------|------|------|
| `CounselingSessionForm` | `components/counseling/` | 상담 기록 폼 (수정 필요) |
| `CounselingSessionCard` | `components/counseling/` | 상담 카드 UI |
| `CounselingHistoryList` | `components/counseling/` | 상담 이력 목록 |
| `NewCounselingClient` | `components/counseling/` | 새 상담 클라이언트 |

#### 새 컴포넌트 필요

```
src/components/counseling/
├── ReservationForm.tsx          # 예약 등록/수정 폼
├── ReservationCard.tsx          # 예약 카드 UI
├── ReservationList.tsx          # 예약 목록 (상태별 필터)
├── ReservationCalendar.tsx      # 달력 뷰 (선택적)
├── UpcomingReservations.tsx     # 다가오는 예약 위젯
├── CounselingStatsCard.tsx      # 통계 카드
└── ParentInfoForm.tsx           # 학부모 정보 입력 폼
```

#### UI 컴포넌트 재사용

```tsx
// 기존 UI 컴포넌트 완전 재사용 가능
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
```

### Page Structure

#### 기존 페이지 (수정)

```
src/app/(dashboard)/counseling/
├── page.tsx           # 상담 목록 -> 탭 추가 (예약/기록)
└── new/
    └── page.tsx       # 새 상담 기록 -> 예약에서 전환 가능
```

#### 새 페이지 필요

```
src/app/(dashboard)/counseling/
├── page.tsx                     # 메인 (탭: 예약/기록/통계)
├── new/
│   └── page.tsx                 # 새 상담 기록
├── reservations/
│   ├── page.tsx                 # 예약 목록
│   └── new/
│       └── page.tsx             # 새 예약 등록
├── [id]/
│   └── page.tsx                 # 상담 상세 (예약/기록 통합)
└── stats/
    └── page.tsx                 # 상담 통계 페이지
```

#### 학생 상세 페이지 확장

```tsx
// src/app/(dashboard)/students/[id]/page.tsx
// 기존 페이지에 상담 이력 섹션 추가

<section>
  <h2 className="text-2xl font-bold mb-4">상담 이력</h2>
  <CounselingHistoryPanel studentId={student.id} />
</section>

<section>
  <h2 className="text-2xl font-bold mb-4">예약된 상담</h2>
  <UpcomingReservationsPanel studentId={student.id} />
</section>
```

---

## Data Flow

### 예약 -> 완료 플로우

```
┌─────────────────────────────────────────────────────────────────────┐
│                      학부모 상담 관리 데이터 플로우                    │
└─────────────────────────────────────────────────────────────────────┘

1. 예약 등록
   ┌─────────────┐    ┌──────────────────┐    ┌────────────────────┐
   │ 예약 폼 입력 │ -> │ createReservation│ -> │ ParentCounseling   │
   │ (Teacher)   │    │ Action           │    │ Reservation (DB)   │
   └─────────────┘    └──────────────────┘    └────────────────────┘
                                                 status: SCHEDULED

2. 상담 완료 처리
   ┌─────────────┐    ┌──────────────────┐    ┌────────────────────┐
   │ 완료 버튼   │ -> │ completeReserva- │ -> │ Update Reservation │
   │ + 기록 입력 │    │ tionAction       │    │ status: COMPLETED  │
   └─────────────┘    └──────────────────┘    └────────────────────┘
                              │
                              ▼
                      ┌──────────────────┐    ┌────────────────────┐
                      │ recordCounseling │ -> │ CounselingSession  │
                      │ Action (기존)    │    │ (기존 모델 재사용)  │
                      └──────────────────┘    └────────────────────┘

3. 이력 조회
   ┌─────────────┐    ┌──────────────────┐    ┌────────────────────┐
   │ 학생 상세   │ -> │ getCounseling-   │ -> │ CounselingSession  │
   │ 페이지      │    │ Sessions (기존)  │    │ + Reservation      │
   └─────────────┘    └──────────────────┘    └────────────────────┘

4. 통계 계산
   ┌─────────────┐    ┌──────────────────┐    ┌────────────────────┐
   │ 통계 페이지 │ -> │ getCounseling-   │ -> │ Aggregation:       │
   │             │    │ StatsAction      │    │ - 월별 횟수        │
   └─────────────┘    └──────────────────┘    │ - 유형별 분포      │
                                              │ - 평균 시간        │
                                              └────────────────────┘
```

### RBAC 권한 플로우

```
┌─────────────────────────────────────────────────────────────────────┐
│                         RBAC 권한 체계 (기존 재사용)                  │
└─────────────────────────────────────────────────────────────────────┘

DIRECTOR (원장)
  └─> 모든 팀의 모든 상담 조회/관리

TEAM_LEADER (팀장)
  └─> 소속 팀의 모든 상담 조회/관리

MANAGER (매니저)
  └─> 소속 팀의 모든 상담 조회/관리

TEACHER (선생님)
  └─> 자신이 담당하는 학생의 상담만 조회/관리

// 기존 패턴 그대로 적용
const rbacDb = getRBACPrisma(session)
const reservations = await rbacDb.parentCounselingReservation.findMany({
  where: {
    // RBAC 필터가 자동 적용됨
  }
})
```

---

## Suggested Build Order

### Phase 1: DB 스키마 확장 (1일)

**목표:** 예약 관리를 위한 데이터베이스 스키마 추가

1. `ParentCounselingReservation` 모델 추가
2. `ReservationStatus`, `ParentRelation` enum 추가
3. Prisma 마이그레이션 생성 및 적용
4. 기존 CounselingSession과 연결 관계 설정

**파일:**
- `prisma/schema.prisma`
- `prisma/migrations/[timestamp]_add_parent_counseling_reservation.sql`

### Phase 2: Server Actions 구현 (2일)

**목표:** 예약 CRUD 및 상태 전환 로직 구현

1. `src/lib/actions/parent-counseling.ts` 생성
2. 예약 생성/수정/취소 액션
3. 예약 완료 -> 상담 기록 연결 액션
4. 기존 `performance.ts` 액션과 통합
5. Zod 스키마 추가 (`src/lib/validations/reservation.ts`)

**의존성:**
- Phase 1 완료 필요
- 기존 RBAC/DAL 패턴 재사용

### Phase 3: 예약 관리 UI (2일)

**목표:** 예약 등록/목록/관리 화면 구현

1. `ReservationForm.tsx` - 예약 등록 폼
2. `ReservationCard.tsx` - 예약 카드 UI
3. `ReservationList.tsx` - 예약 목록 (상태 필터)
4. `/counseling/reservations` 페이지
5. `/counseling/reservations/new` 페이지

**의존성:**
- Phase 2 완료 필요
- 기존 UI 컴포넌트 재사용

### Phase 4: 기존 상담 페이지 통합 (1일)

**목표:** 기존 상담 관리 페이지와 새 예약 기능 통합

1. `/counseling` 메인 페이지 탭 UI 추가 (예약/기록)
2. 예약 완료 시 상담 기록 폼으로 전환
3. 상담 상세 페이지 (`/counseling/[id]`)
4. 네비게이션 메뉴 업데이트

**의존성:**
- Phase 3 완료 필요

### Phase 5: 학생/선생님 페이지 확장 (1일)

**목표:** 학생/선생님 상세 페이지에 상담 이력 통합

1. 학생 상세 페이지에 상담 이력 섹션 추가
2. 학생 상세 페이지에 다가오는 예약 표시
3. 선생님 상세 페이지에 상담 통계 표시
4. 퀵 액션: 해당 학생 상담 예약 버튼

**의존성:**
- Phase 4 완료 필요

### Phase 6: 통계 및 대시보드 (1일)

**목표:** 상담 통계 분석 및 대시보드 기능

1. `CounselingStatsCard.tsx` - 통계 카드
2. `/counseling/stats` 통계 페이지
3. 월별/유형별 차트 (Recharts 재사용)
4. 다가오는 상담 예약 대시보드 위젯

**의존성:**
- Phase 5 완료 필요
- Recharts 이미 설치됨

### Phase 7: 테스트 및 마무리 (1일)

**목표:** 통합 테스트 및 버그 수정

1. E2E 테스트 시나리오 작성
2. RBAC 권한 검증
3. 엣지 케이스 처리 (동시 예약, 취소 후 재예약 등)
4. 문서화

---

## Integration Checklist

### Database Integration

- [x] 기존 CounselingSession 모델 재사용
- [ ] ParentCounselingReservation 모델 추가
- [ ] 기존 인덱스 패턴 적용
- [ ] onDelete Cascade 설정

### Server Actions Integration

- [x] 기존 `verifySession()` DAL 재사용
- [x] 기존 `getRBACPrisma()` RBAC 재사용
- [x] 기존 `revalidatePath()` 패턴 재사용
- [ ] 새 예약 액션 구현

### UI Integration

- [x] 기존 UI 컴포넌트 재사용 (Card, Button, Select 등)
- [x] 기존 폼 패턴 재사용 (react-hook-form + zod)
- [x] 기존 CounselingSessionForm 확장 가능
- [ ] 새 예약 관련 컴포넌트 구현

### 기존 기능 영향도

| 기존 기능 | 영향 | 조치 |
|----------|------|------|
| CounselingSession 모델 | 없음 | 그대로 유지 |
| 상담 기록 CRUD | 없음 | 그대로 유지 |
| `/counseling` 페이지 | 수정 필요 | 탭 UI 추가 |
| 학생 상세 페이지 | 확장 | 상담 섹션 추가 |
| RBAC 권한 체계 | 없음 | 그대로 적용 |

---

## Confidence Assessment

| 영역 | 신뢰도 | 근거 |
|------|--------|------|
| DB 스키마 | HIGH | 기존 패턴 명확, Prisma 마이그레이션 검증됨 |
| Server Actions | HIGH | 기존 performance.ts 패턴 그대로 재사용 |
| UI Components | HIGH | 기존 컴포넌트 라이브러리 완성도 높음 |
| RBAC 통합 | HIGH | 기존 RBAC 패턴 검증됨 |
| 빌드 순서 | MEDIUM | 의존성 체인 명확하나 예상 시간은 변동 가능 |

---

## Sources

- `/home/gon/projects/ai/ai-afterschool/prisma/schema.prisma` - 기존 Prisma 스키마
- `/home/gon/projects/ai/ai-afterschool/src/lib/actions/performance.ts` - 상담 관련 Server Actions
- `/home/gon/projects/ai/ai-afterschool/src/lib/db/rbac.ts` - RBAC 패턴
- `/home/gon/projects/ai/ai-afterschool/src/app/(dashboard)/counseling/page.tsx` - 기존 상담 페이지
- `/home/gon/projects/ai/ai-afterschool/src/components/counseling/` - 기존 상담 컴포넌트들
- `/home/gon/projects/ai/ai-afterschool/.planning/PROJECT.md` - 프로젝트 문서

---

*Researched: 2026-02-04*
*Confidence: HIGH*
