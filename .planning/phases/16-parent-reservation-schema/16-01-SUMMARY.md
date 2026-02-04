---
phase: 16-parent-reservation-schema
plan: 01
status: complete
completed: 2026-02-04
duration: 2min
subsystem: database-schema
tags: [prisma, postgresql, parent, reservation, schema]

dependencies:
  requires: []
  provides: [parent-model, reservation-model, student-parent-relation]
  affects: [phase-17, phase-18, phase-20]

tech-stack:
  added: []
  patterns: [indirect-rbac-isolation, denormalized-primary-parent, enum-with-other]

key-files:
  created:
    - prisma/schema.prisma: Parent, ParentCounselingReservation models
  modified:
    - prisma/schema.prisma: Student, Teacher, CounselingSession extensions

decisions:
  - id: indirect-isolation
    what: Student FK로 간접 팀 격리
    why: 기존 RBAC Extension 재사용. Parent/Reservation에 teamId 중복 저장 불필요
    impact: 새 모델에 RBAC Extension 추가 작업 없음
  - id: primary-parent-dual-storage
    what: Student.primaryParentId FK + Parent.isPrimary 이중 저장
    why: 빠른 조회(FK 조인)와 학부모 관점 관리(플래그) 모두 지원
    impact: 주 연락처 변경 시 두 필드 모두 업데이트 필요
  - id: reservation-cascade
    what: ParentCounselingReservation FK에 onDelete Cascade 적용
    why: 학생/선생님/학부모 삭제 시 예약도 자동 삭제 (고아 레코드 방지)
    impact: Phase 14 결정사항과 일관성 유지
  - id: counseling-session-optional
    what: counselingSessionId nullable로 설정
    why: 모든 상담이 예약에서 시작하는 건 아님 (즉석 상담 지원)
    impact: 예약 완료 시에만 CounselingSession 연결
---

# Phase 16 Plan 01: Parent & Reservation Database Schema Summary

**학부모 상담 예약 시스템의 데이터 기반 구축. Parent 및 ParentCounselingReservation Prisma 모델 정의 및 DB 반영 완료**

## What Was Built

### Parent 모델
- **필드**: id, studentId, name, phone, email?, relation, relationOther?, note?, isPrimary, createdAt, updatedAt
- **관계**: Student 1:N (StudentParents), Student 1:1 (StudentPrimaryParent), ParentCounselingReservation 1:N
- **인덱스**: studentId, (studentId, isPrimary) 복합 인덱스
- **격리 방식**: Student FK로 간접 팀 격리 (기존 RBAC Extension 재사용)

### ParentCounselingReservation 모델
- **필드**: id, scheduledAt, studentId, teacherId, parentId, topic, status, counselingSessionId?, createdAt, updatedAt
- **관계**: Student, Teacher, Parent (onDelete: Cascade), CounselingSession? (onDelete: SetNull)
- **인덱스**: studentId, teacherId, parentId, scheduledAt, (studentId, scheduledAt), (teacherId, scheduledAt)
- **상태**: SCHEDULED → COMPLETED/CANCELLED/NO_SHOW 전이 (앱 레벨 검증)

### Enum 타입
- **ParentRelation**: FATHER, MOTHER, GRANDFATHER, GRANDMOTHER, OTHER
- **ReservationStatus**: SCHEDULED, COMPLETED, CANCELLED, NO_SHOW

### 기존 모델 확장
- **Student**: primaryParentId FK, primaryParent, parents, counselingReservations 관계 추가
- **Teacher**: counselingReservations 관계 추가
- **CounselingSession**: reservation 역참조 추가

## Technical Approach

### RBAC 적용 (간접 격리 패턴)
```typescript
// Parent와 Reservation은 Student FK로 연결
// 기존 RBAC Extension이 Student 필터링 → 자동 격리
// 새 Extension 추가 불필요

// 예: 학부모 조회 시 Student include로 팀 필터 적용
const parents = await db.parent.findMany({
  where: { student: { teamId } }, // Student 필터링으로 간접 격리
  include: { student: true }
})
```

### 주 연락처 이중 저장 (Denormalization)
```typescript
// Student.primaryParentId FK: 빠른 조회 (FK 조인)
const student = await db.student.findUnique({
  where: { id },
  include: { primaryParent: true } // 주 연락처 즉시 조회
})

// Parent.isPrimary 플래그: 학부모 관점 관리
const parents = await db.parent.findMany({
  where: { studentId },
  orderBy: { isPrimary: 'desc' } // 주 연락처가 맨 위
})
```

### ON DELETE 정책
- **CASCADE**: Parent (studentId), Reservation (studentId, teacherId, parentId) - 학생/선생님/학부모 삭제 시 관련 데이터 자동 정리
- **SET NULL**: Student (primaryParentId), Reservation (counselingSessionId) - FK 삭제 시 null로 설정

## Deviations from Plan

**Auto-fixed Issues:**

None - 계획대로 정확히 실행됨

## Performance Notes

### 실행 시간
- **총 소요**: ~2분
- **Task 1** (스키마 수정): ~1분
- **Task 2** (DB 마이그레이션): ~1분 (db push 183ms)

### 인덱스 전략
- **외래 키 인덱스**: studentId, teacherId, parentId (조인 성능)
- **복합 인덱스**: (studentId, isPrimary) - 주 연락처 조회, (studentId, scheduledAt), (teacherId, scheduledAt) - 일정 조회
- **단일 인덱스**: scheduledAt - 전체 예약 일정 조회

## Next Phase Readiness

### Phase 17 (Reservation Server Actions)에 필요한 것들:
- ✅ Parent 모델 (학부모 CRUD)
- ✅ ParentCounselingReservation 모델 (예약 CRUD)
- ✅ Student.primaryParentId FK (주 연락처 조회)
- ✅ 인덱스 (쿼리 최적화 준비)

### Phase 18 (Reservation Management UI)에 필요한 것들:
- ✅ ParentRelation enum (학부모 관계 선택)
- ✅ ReservationStatus enum (예약 상태 표시)
- ✅ 모든 관계 정의 (UI에서 join 쿼리 가능)

### Phase 20 (Student Page Integration)에 필요한 것들:
- ✅ Student.parents, counselingReservations 관계 (학생 페이지에서 학부모 및 예약 목록 표시)
- ✅ Student.primaryParent 관계 (주 연락처 빠른 표시)

### Blockers/Concerns
- **없음**: 모든 테이블/인덱스 생성 완료. Prisma Client 재생성 완료
- **주의사항**: 주 연락처 변경 시 Student.primaryParentId와 Parent.isPrimary 모두 업데이트 필요 (트랜잭션)
- **예약 상태 전이**: 앱 레벨 검증 구현 필요 (Phase 17). DB 레벨 제약조건 없음

## Files Changed

### Created
None (스키마 변경만)

### Modified
- `prisma/schema.prisma` (71줄 추가, 3줄 삭제)
  - ParentRelation, ReservationStatus enum 추가
  - Parent, ParentCounselingReservation 모델 추가
  - Student, Teacher, CounselingSession 모델 확장

## Lessons Learned

### What Worked Well
1. **간접 격리 패턴**: Student FK로 연결하여 기존 RBAC Extension 재사용. 추가 Extension 작업 불필요
2. **db push 사용**: Shadow DB 이슈 없이 183ms에 마이그레이션 완료 (7회 이력 있는 문제 회피)
3. **복합 인덱스**: 조회 패턴에 최적화된 복합 인덱스 설계 (studentId + isPrimary, studentId + scheduledAt 등)

### Potential Improvements
1. **주 연락처 자동 승계**: Phase 17에서 학부모 삭제 시 다음 학부모로 자동 승계 로직 구현 필요
2. **예약 시간 중복 검증**: Phase 17에서 선생님별 시간 중복 방지 로직 추가 필요
3. **상태 전이 검증**: Phase 17에서 SCHEDULED → COMPLETED/CANCELLED/NO_SHOW 전이 규칙 앱 레벨 검증

### Risks Mitigated
- ✅ Shadow DB 이슈: db push 사용으로 회피
- ✅ RBAC 적용 누락: Student FK 간접 격리로 기존 패턴 재사용
- ✅ ON DELETE CASCADE: Phase 14 결정사항과 일관성 유지

---

*Completed: 2026-02-04*
*Duration: ~2 minutes*
*Commits: 156d120, f1841dc*
