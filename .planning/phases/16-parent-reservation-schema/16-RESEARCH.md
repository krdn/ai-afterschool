# Phase 16: Parent & Reservation Database Schema - Research

**Researched:** 2026-02-04
**Domain:** Prisma ORM Schema Design, PostgreSQL Multi-Tenant Isolation, Reservation Workflow
**Confidence:** HIGH

## Summary

Phase 16은 학부모 정보 및 상담 예약 데이터 모델을 구축하는 단계입니다. 핵심은 **기존 RBAC 패턴을 따르면서도 새로운 요구사항(복수 학부모 관리, 주 연락처 이중 저장, 예약 상태 전이)을 올바르게 구현**하는 것입니다. 사용자 결정사항(CONTEXT.md)에 따라 Parent와 ParentCounselingReservation 두 개의 독립된 모델을 생성하고, Student FK를 통한 간접 팀 격리 방식을 적용합니다.

**Key Findings:**
- **Prisma 7.3.0 이미 사용 중**: 현재 프로젝트가 Prisma 7.3.0을 사용하고 있으며, Prisma Client Extensions 패턴이 Phase 11에서 이미 구현됨
- **ON DELETE CASCADE 패턴 확립**: Phase 14에서 성과 분석 모델에 `onDelete: Cascade` 결정. 학생 삭제 시 관련 데이터 자동 정리
- **Student FK를 통한 간접 격리**: Parent와 Reservation은 Student를 참조. 기존 RBAC Extension이 Student를 필터링하므로 추가 Extension 불필요
- **Shadow Database 이슈 지속**: 프로젝트에서 7회 발생. `npx prisma db push` 워크어라운드 계속 사용 (Prisma 공식 문서 권장)
- **인덱스 전략**: Prisma 공식 블로그에 따르면 외래 키, WHERE 절, ORDER BY 절에 사용되는 필드는 반드시 인덱싱 필요

**Primary recommendation:** Parent와 ParentCounselingReservation 모델을 schema.prisma에 추가. Student FK로 간접 격리 구현. 외래 키에 `onDelete: Cascade` 적용. 복합 인덱스로 쿼리 최적화. `db push` 명령어로 마이그레이션.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **Prisma** | 7.3.0 | ORM | 프로젝트에서 이미 사용 중. Client Extensions로 RBAC 구현 |
| **PostgreSQL** | 16.x | Database | Row-Level Security로 DB 레벨 격리. 현재 사용 중 |
| **@prisma/adapter-pg** | 7.3.0 | PostgreSQL Adapter | 프로젝트에서 이미 사용 중 |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **date-fns** | 4.1.0 | Date Handling | DateTime 조작 및 타임존 처리 (이미 사용 중) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Student FK 간접 격리 | Parent/Reservation에 teamId 직접 추가 | 간접 격리가 더 간단. 중복 데이터 없음 |
| ON DELETE CASCADE | ON DELETE SET NULL | CASCADE가 Phase 14 결정사항. 고아 레코드 방지 |
| db push | migrate dev | Shadow DB 이슈로 db push 계속 사용 (7회 이력) |

**Installation:**
```bash
# 추가 설치 필요 없음 - 기존 스택 사용
# Prisma 7.3.0, date-fns 4.1.0 이미 설치됨
```

## Architecture Patterns

### Recommended Project Structure

```
prisma/
├── schema.prisma                  # Parent, ParentCounselingReservation 모델 추가
└── migrations/                    # db push로 생성 (shadow DB 이슈 대응)

src/
├── lib/
│   └── db/
│       ├── rbac.ts                # 기존 RBAC Extensions (수정 불필요)
│       └── index.ts               # Prisma client (기존)
└── app/
    └── (dashboard)/
        └── students/
            └── [id]/              # 향후 Phase 18에서 학부모 UI 추가
```

### Pattern 1: Student FK를 통한 간접 팀 격리

**What:** Parent와 Reservation은 Student를 참조. Student의 teamId로 팀 격리 자동 적용

**When to use:** 새 모델이 기존 팀 격리 모델(Student/Teacher)을 FK로 참조할 때

**Example:**
```typescript
// Source: 프로젝트 기존 패턴 (Phase 11-02)
// src/lib/db/rbac.ts - 이미 구현된 패턴

export function createTeamFilteredPrisma(
  teamId: string | null,
  role: TeacherRole
) {
  if (role === 'DIRECTOR') {
    return db
  }

  return db.$extends({
    query: {
      $allOperations({ model, args, query }) {
        // Student와 Teacher 모델에 teamId 필터 적용
        if ((model === 'Teacher' || model === 'Student') && teamId) {
          args.where = {
            ...args.where,
            teamId,
          }
        }
        return query(args)
      },
    },
  })
}

// Parent/Reservation은 Student FK로 연결되므로
// Student 필터링 시 자동으로 격리됨
// 예: db.parent.findMany({ where: { student: { teamId } } })
```

### Pattern 2: 주 연락처 이중 저장 (Denormalization)

**What:** Student.primaryParentId FK + Parent.isPrimary 플래그로 주 연락처 관리

**When to use:** 빠른 조회(FK)와 학부모 관점 관리(플래그) 모두 필요할 때

**Example:**
```typescript
// Source: 사용자 결정사항 (CONTEXT.md)
// schema.prisma

model Student {
  id              String   @id @default(cuid())
  primaryParentId String?  // FK to Parent (nullable - 학부모 미등록 허용)
  primaryParent   Parent?  @relation("StudentPrimaryParent", fields: [primaryParentId], references: [id], onDelete: SetNull)
  parents         Parent[] @relation("StudentParents")
  // ... 기존 필드
}

model Parent {
  id        String   @id @default(cuid())
  studentId String
  student   Student  @relation("StudentParents", fields: [studentId], references: [id], onDelete: Cascade)
  isPrimary Boolean  @default(false)
  // ... 학부모 정보 필드

  studentAsPrimary Student[] @relation("StudentPrimaryParent")
}

// 주 연락처 조회 - 빠른 FK 조인
const student = await db.student.findUnique({
  where: { id },
  include: { primaryParent: true }
})

// 학부모 목록에서 주 연락처 표시
const parents = await db.parent.findMany({
  where: { studentId },
  orderBy: { isPrimary: 'desc' } // 주 연락처가 맨 위
})
```

**주의사항:**
- Denormalization 패턴으로 데이터 정합성 유지 필요
- 주 연락처 변경 시 이전 학부모의 `isPrimary` false로 변경 + Student의 `primaryParentId` 업데이트
- 트랜잭션으로 원자성 보장

### Pattern 3: Enum + 기타 텍스트 필드

**What:** 열거형에 OTHER 값 포함 + relationOther 선택적 텍스트 필드

**When to use:** 고정된 선택지 + 사용자 정의 입력 모두 지원할 때

**Example:**
```typescript
// Source: PostgreSQL Enum 문서 + 사용자 결정사항
// schema.prisma

enum ParentRelation {
  FATHER
  MOTHER
  GRANDFATHER
  GRANDMOTHER
  OTHER
}

model Parent {
  relation      ParentRelation
  relationOther String?        // OTHER 선택 시에만 사용
}

// 검증 로직 (Server Action)
if (data.relation === 'OTHER' && !data.relationOther?.trim()) {
  return { error: '기타 관계를 입력해주세요' }
}
if (data.relation !== 'OTHER' && data.relationOther) {
  // 불필요한 데이터 제거
  data.relationOther = null
}
```

### Pattern 4: 예약 상태 전이 규칙

**What:** SCHEDULED에서만 COMPLETED/CANCELLED/NO_SHOW로 전환 가능

**When to use:** 상태 전이에 비즈니스 로직이 있을 때

**Example:**
```typescript
// Source: 워크플로우 문서 + 사용자 결정사항
// schema.prisma

enum ReservationStatus {
  SCHEDULED
  COMPLETED
  CANCELLED
  NO_SHOW
}

// Server Action에서 상태 전이 검증
async function updateReservationStatus(
  id: string,
  newStatus: ReservationStatus
) {
  const reservation = await db.parentCounselingReservation.findUnique({
    where: { id },
    select: { status: true }
  })

  // 최종 상태는 변경 불가
  const finalStatuses = ['COMPLETED', 'CANCELLED', 'NO_SHOW']
  if (finalStatuses.includes(reservation.status)) {
    return { error: '이미 완료/취소된 예약은 수정할 수 없습니다' }
  }

  // SCHEDULED에서만 전이 가능
  if (reservation.status !== 'SCHEDULED') {
    return { error: '예약 상태에서만 변경 가능합니다' }
  }

  await db.parentCounselingReservation.update({
    where: { id },
    data: { status: newStatus }
  })
}
```

### Anti-Patterns to Avoid

- **기존 CounselingSession 모델 재사용**: v2.1 연구에서 명시적으로 별도 모델 생성 결정. 성과 분석 로직 오염 방지
- **Parent/Reservation에 teamId 직접 추가**: Student FK로 간접 격리가 더 간단하고 중복 데이터 없음
- **주 연락처 단일 저장 (FK만 또는 플래그만)**: 이중 저장으로 빠른 조회와 학부모 관점 관리 모두 지원
- **Enum에 사용자 정의 값 직접 저장**: OTHER + relationOther 패턴으로 타입 안정성 유지

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 팀 격리 Extension | Parent/Reservation용 새 Extension | 기존 Student FK 활용 | Student 필터링으로 자동 격리됨 |
| 날짜/시간 조작 | 직접 계산 | date-fns | 타임존, 날짜 연산 edge case 처리 |
| 마이그레이션 | migrate dev 강제 | db push | Shadow DB 이슈로 7회 실패 이력 |
| 상태 전이 검증 | UI에서만 검증 | Server Action + 트랜잭션 | DB 레벨 제약조건 없으므로 앱 레벨 검증 필수 |

**Key insight:** Prisma는 상태 전이를 DB 레벨에서 강제하는 기능이 없음. Server Action에서 현재 상태를 조회 후 검증 로직 구현 필요.

## Common Pitfalls

### Pitfall 1: RBAC Extension 누락으로 팀 격리 위반

**What goes wrong:** Parent/Reservation 모델에 RBAC 적용을 깜빡하면 다른 팀 학생의 학부모 정보 노출

**Why it happens:** 새 모델 추가 시 기존 RBAC 패턴 적용 누락

**How to avoid:** Student FK로 간접 격리. 기존 Extension이 Student 필터링하므로 추가 코드 불필요. 단, 쿼리 시 Student include 또는 where 조건 반드시 포함

**Warning signs:**
- Parent/Reservation 쿼리에 studentId 조건 없음
- 전체 Parent 목록 조회하는 코드 (팀 필터 없이)
- 테스트에서 다른 팀 데이터가 조회됨

### Pitfall 2: 주 연락처 삭제 시 자동 승계 미구현

**What goes wrong:** 주 연락처를 삭제했는데 다음 학부모로 자동 승계 안 되면 Student.primaryParentId가 null로 남음

**Why it happens:** 단순 DELETE 쿼리만 실행. 승계 로직 누락

**How to avoid:**
- Parent의 primaryParentId FK에 `onDelete: SetNull` 설정 (삭제 시 null로)
- Server Action에서 삭제 후 다음 학부모를 주 연락처로 자동 지정
- 트랜잭션으로 원자성 보장

**Warning signs:**
- 학부모 삭제 후 주 연락처가 없음
- Student.primaryParentId가 존재하지 않는 Parent ID 참조

### Pitfall 3: Enum + OTHER 패턴에서 relationOther 검증 누락

**What goes wrong:** relation이 OTHER인데 relationOther가 비어있거나, OTHER가 아닌데 relationOther에 값이 있음

**Why it happens:** 클라이언트 검증만 하고 서버 검증 누락

**How to avoid:**
- Server Action에서 Zod 스키마로 검증
- `refine`으로 relation과 relationOther 관계 검증
- DB 저장 전 불필요한 relationOther 제거 (null로)

**Warning signs:**
- OTHER 선택 시 relationOther 필드가 비어있는 레코드
- FATHER/MOTHER인데 relationOther에 값이 있는 레코드

### Pitfall 4: 예약 상태 전이 규칙 위반

**What goes wrong:** 이미 완료/취소된 예약을 다시 수정하거나, SCHEDULED가 아닌 상태에서 전이

**Why it happens:** UI에서만 버튼 비활성화. Server Action에서 검증 누락

**How to avoid:**
- Server Action에서 현재 상태 조회 후 전이 가능 여부 검증
- 최종 상태(COMPLETED/CANCELLED/NO_SHOW)는 변경 불가
- 트랜잭션으로 동시 수정 방지

**Warning signs:**
- 완료된 예약이 다시 SCHEDULED로 변경됨
- 상태 전이 로그가 비정상적 (CANCELLED → COMPLETED 같은 경로)

### Pitfall 5: Shadow Database 동기화 실패로 마이그레이션 중단

**What goes wrong:** `migrate dev` 명령어가 shadow database 생성 실패로 중단

**Why it happens:** 클라우드 DB 환경에서 database 생성 권한 없음. 프로젝트에서 7회 발생

**How to avoid:**
- `npx prisma db push` 사용 (shadow DB 불필요)
- Prisma 공식 문서에서 shadow DB 이슈 시 db push 권장
- 프로덕션은 migrate deploy 사용

**Warning signs:**
- "Prisma Migrate could not create the shadow database" 에러
- 마이그레이션이 반복적으로 실패

### Pitfall 6: 인덱스 누락으로 쿼리 성능 저하

**What goes wrong:** 외래 키나 자주 조회되는 필드에 인덱스가 없어서 대량 데이터 시 느려짐

**Why it happens:** Prisma는 외래 키에 자동으로 인덱스 생성하지 않음 (PostgreSQL도 마찬가지)

**How to avoid:**
- 모든 외래 키에 `@@index` 추가
- WHERE 절에 사용되는 필드 인덱싱
- 복합 조회 패턴에는 복합 인덱스 사용
- 예: `@@index([studentId, isPrimary])` - 학생별 주 연락처 조회 최적화

**Warning signs:**
- 학부모/예약 목록 조회가 느려짐
- DB 로그에서 Seq Scan (순차 스캔) 발생

## Code Examples

Verified patterns from official sources:

### Parent 모델 (학부모 정보)

```prisma
// Source: Prisma Schema Reference + 사용자 결정사항
// prisma/schema.prisma

enum ParentRelation {
  FATHER
  MOTHER
  GRANDFATHER
  GRANDMOTHER
  OTHER
}

model Parent {
  id            String         @id @default(cuid())
  studentId     String
  name          String         // 학부모 이름
  phone         String         // 전화번호
  email         String?        // 이메일 (선택)
  relation      ParentRelation // 관계
  relationOther String?        // OTHER 선택 시 직접 입력
  note          String?        // 메모 (선택)
  isPrimary     Boolean        @default(false) // 주 연락처 여부
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  // Relations
  student              Student                      @relation("StudentParents", fields: [studentId], references: [id], onDelete: Cascade)
  studentAsPrimary     Student[]                    @relation("StudentPrimaryParent")
  counselingReservations ParentCounselingReservation[]

  // Indexes
  @@index([studentId])
  @@index([studentId, isPrimary]) // 주 연락처 조회 최적화
}
```

### ParentCounselingReservation 모델 (상담 예약)

```prisma
// Source: Prisma Schema Reference + 사용자 결정사항
// prisma/schema.prisma

enum ReservationStatus {
  SCHEDULED  // 예약됨
  COMPLETED  // 완료
  CANCELLED  // 취소
  NO_SHOW    // 불참
}

model ParentCounselingReservation {
  id                  String            @id @default(cuid())
  scheduledAt         DateTime          // 예약 일시
  studentId           String
  teacherId           String
  parentId            String
  topic               String            // 상담 주제
  status              ReservationStatus @default(SCHEDULED)
  counselingSessionId String?           @unique // 완료 시 CounselingSession FK (선택)
  createdAt           DateTime          @default(now())
  updatedAt           DateTime          @updatedAt

  // Relations
  student          Student           @relation(fields: [studentId], references: [id], onDelete: Cascade)
  teacher          Teacher           @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  parent           Parent            @relation(fields: [parentId], references: [id], onDelete: Cascade)
  counselingSession CounselingSession? @relation(fields: [counselingSessionId], references: [id], onDelete: SetNull)

  // Indexes
  @@index([studentId])
  @@index([teacherId])
  @@index([parentId])
  @@index([scheduledAt])
  @@index([studentId, scheduledAt]) // 학생별 예약 일정 조회 최적화
  @@index([teacherId, scheduledAt]) // 선생님별 예약 일정 조회 최적화
}
```

### Student 모델 확장 (주 연락처 FK)

```prisma
// Source: 기존 schema.prisma + 사용자 결정사항
// prisma/schema.prisma

model Student {
  id              String   @id @default(cuid())
  primaryParentId String?  // 주 연락처 FK (nullable - 학부모 미등록 허용)

  // Relations
  primaryParent   Parent?  @relation("StudentPrimaryParent", fields: [primaryParentId], references: [id], onDelete: SetNull)
  parents         Parent[] @relation("StudentParents")
  counselingReservations ParentCounselingReservation[]

  // ... 기존 필드

  // Indexes (기존 인덱스 유지 + 추가)
  @@index([primaryParentId])
}
```

### Teacher 모델 확장 (예약 관계)

```prisma
// Source: 기존 schema.prisma
// prisma/schema.prisma

model Teacher {
  // ... 기존 필드

  // Relations
  counselingReservations ParentCounselingReservation[]

  // ... 기존 관계
}
```

### CounselingSession 모델 확장 (예약 역참조)

```prisma
// Source: 기존 schema.prisma + 사용자 결정사항
// prisma/schema.prisma

model CounselingSession {
  // ... 기존 필드

  // Relations (기존 관계 유지 + 추가)
  reservation ParentCounselingReservation? // 예약으로부터 생성된 경우

  // ... 기존 관계
}
```

### 주 연락처 자동 승계 로직

```typescript
// Source: Denormalization 패턴 + 프로젝트 트랜잭션 패턴
// src/lib/actions/parents.ts (예상)

async function deleteParent(parentId: string) {
  return await db.$transaction(async (tx) => {
    // 1. 삭제할 학부모 정보 조회
    const parent = await tx.parent.findUnique({
      where: { id: parentId },
      select: { studentId: true, isPrimary: true }
    })

    if (!parent) {
      return { error: '학부모를 찾을 수 없습니다' }
    }

    // 2. 학부모 삭제 (Student.primaryParentId는 onDelete: SetNull로 자동 null)
    await tx.parent.delete({ where: { id: parentId } })

    // 3. 주 연락처였다면 다음 학부모로 승계
    if (parent.isPrimary) {
      const nextParent = await tx.parent.findFirst({
        where: { studentId: parent.studentId },
        orderBy: { createdAt: 'asc' } // 가장 먼저 등록된 학부모
      })

      if (nextParent) {
        // 새 주 연락처 지정
        await tx.parent.update({
          where: { id: nextParent.id },
          data: { isPrimary: true }
        })
        await tx.student.update({
          where: { id: parent.studentId },
          data: { primaryParentId: nextParent.id }
        })
      }
      // nextParent가 없으면 primaryParentId는 null로 유지 (학부모 0명)
    }

    return { success: true }
  })
}
```

### 예약 상태 전이 검증

```typescript
// Source: 사용자 결정사항 + 트랜잭션 패턴
// src/lib/actions/reservations.ts (예상)

async function updateReservationStatus(
  id: string,
  newStatus: ReservationStatus
) {
  return await db.$transaction(async (tx) => {
    // 1. 현재 상태 조회
    const reservation = await tx.parentCounselingReservation.findUnique({
      where: { id },
      select: { status: true }
    })

    if (!reservation) {
      return { error: '예약을 찾을 수 없습니다' }
    }

    // 2. 최종 상태는 변경 불가
    const finalStatuses: ReservationStatus[] = [
      'COMPLETED',
      'CANCELLED',
      'NO_SHOW'
    ]
    if (finalStatuses.includes(reservation.status)) {
      return { error: '이미 완료/취소된 예약은 수정할 수 없습니다' }
    }

    // 3. SCHEDULED에서만 전이 가능
    if (reservation.status !== 'SCHEDULED') {
      return { error: '예약 상태에서만 변경 가능합니다' }
    }

    // 4. 상태 업데이트
    await tx.parentCounselingReservation.update({
      where: { id },
      data: { status: newStatus }
    })

    return { success: true }
  })
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Prisma Middleware | Prisma Client Extensions | v4.16.0 (2023) | Extensions가 더 유연. Middleware는 deprecated |
| migrate dev 강제 | db push 허용 | Phase 11 (프로젝트) | Shadow DB 이슈 대응. 프로덕션은 migrate deploy |
| 학부모 정보를 CounselingSession에 포함 | ParentCounselingReservation 별도 모델 | v2.1 연구 (2026) | 책임 분리. 성과 분석 로직 오염 방지 |
| 주 연락처 단일 저장 (FK만) | 이중 저장 (FK + 플래그) | v2.1 (2026) | 빠른 조회 + 학부모 관점 관리 모두 지원 |

**Deprecated/outdated:**
- **Prisma Middleware**: v4.16.0부터 deprecated. Prisma Client Extensions 사용 권장
- **Shadow DB 없이 마이그레이션**: 클라우드 환경에서 권한 이슈로 `db push` 사용 증가 (2026)

## Open Questions

1. **CounselingSession 역참조 성능**
   - What we know: ParentCounselingReservation에서 counselingSessionId FK로 연결
   - What's unclear: CounselingSession에서 reservation 역참조 시 1:1 관계인데 필수인지 선택인지
   - Recommendation: 선택적 관계로 설정. 모든 상담이 예약에서 시작하는 건 아니므로 (기존 즉석 상담 유지)

2. **학생당 학부모 최대 4명 제한**
   - What we know: 사용자 결정사항에 최대 4명 명시
   - What's unclear: DB 레벨 제약조건으로 강제할지, 앱 레벨 검증만 할지
   - Recommendation: 앱 레벨 검증으로 충분. DB 제약조건은 복잡하고 유연성 떨어짐

3. **예약 시간 중복 검증**
   - What we know: v2.1 연구에서 더블 부킹 방지 필요
   - What's unclear: 선생님별 시간 중복만 체크할지, 학생별도 체크할지
   - Recommendation: 선생님별 중복만 체크 (같은 시간에 여러 상담 불가). 학생은 여러 선생님과 같은 시간 상담 가능 (실제로는 드묾)

## Sources

### Primary (HIGH confidence)

- [Prisma Schema Reference](https://www.prisma.io/docs/orm/reference/prisma-schema-reference) - 모델, 인덱스, 관계 정의
- [Prisma Null and Undefined](https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/null-and-undefined) - Nullable 필드 처리
- [PostgreSQL Foreign Key Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html) - ON DELETE CASCADE/SET NULL
- [Prisma Indexes for Performance](https://www.prisma.io/blog/improving-query-performance-using-indexes-1-zuLNZwBkuL) - 인덱스 최적화
- [Prisma Shadow Database](https://www.prisma.io/docs/orm/prisma-migrate/understanding-prisma-migrate/shadow-database) - Shadow DB 이슈 해결
- 프로젝트 기존 코드 (src/lib/db/rbac.ts, prisma/schema.prisma) - RBAC 패턴, CASCADE 결정사항

### Secondary (MEDIUM confidence)

- [PostgreSQL ON DELETE CASCADE Guide](https://www.dbvis.com/thetable/postgres-on-delete-cascade-a-guide/) - CASCADE vs SET NULL 선택 기준
- [Prisma Multi-Tenant with RLS](https://medium.com/@francolabuschagne90/securing-multi-tenant-applications-using-row-level-security-in-postgresql-with-prisma-orm-4237f4d4bd35) - 간접 격리 패턴
- [Reservation Workflow Patterns](http://www.taskmanagementsoft.com/products/taskmanagerpro/tutorials/customization-guide/custom-workflow-1.php) - 상태 전이 규칙
- [Database Denormalization Guide](https://www.geeksforgeeks.org/dbms/denormalization-in-databases/) - 이중 저장 패턴

### Tertiary (LOW confidence)

- WebSearch 결과: Database schema best practices 2026 - 일반적인 스키마 설계 원칙 (구체적 패턴 없음)
- WebSearch 결과: Enum with OTHER pattern - 특정 문서 없음. 일반적인 enum 사용법만 확인

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - 프로젝트에서 이미 사용 중인 Prisma 7.3.0, PostgreSQL 16.x
- Architecture: HIGH - 기존 RBAC 패턴 확립됨. Student FK 간접 격리 검증됨
- Pitfalls: HIGH - 프로젝트 이력 (Shadow DB 7회 실패)과 사용자 결정사항 기반
- Code examples: HIGH - Prisma 공식 문서 + 프로젝트 기존 패턴 조합

**Research date:** 2026-02-04
**Valid until:** 2026-03-04 (30일 - Prisma는 안정적, 스키마 패턴은 변화 적음)
