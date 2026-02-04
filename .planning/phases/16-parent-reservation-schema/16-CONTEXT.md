# Phase 16: Parent & Reservation Database Schema - Context

**Gathered:** 2026-02-04
**Status:** Ready for planning

<domain>
## Phase Boundary

학부모 정보 및 상담 예약 데이터 모델을 구축합니다. 학생별 복수 학부모 등록, 주 연락처 지정, 상담 예약 데이터 저장, 예약 상태 관리 기능의 데이터베이스 스키마를 설계합니다.

**범위 내:**
- Parent 모델 설계 (학부모 정보)
- ParentCounselingReservation 모델 설계 (예약 정보)
- Student-Parent 관계 정의
- Reservation-CounselingSession 연결
- 팀 격리를 위한 RBAC 적용

**범위 밖:**
- Server Actions (Phase 17)
- UI 컴포넌트 (Phase 18)
- 캘린더 뷰 (Phase 19)

</domain>

<decisions>
## Implementation Decisions

### 학부모 데이터 구조

- **저장 필드:** 이름(name), 전화번호(phone), 이메일(email, optional), 메모(note, optional)
- **학생당 학부모 수:** 최대 4명 (부모 + 조부모 등 확장 보호자 지원)
- **관계 표현:** 열거형 + 기타 옵션
  - `enum ParentRelation { FATHER, MOTHER, GRANDFATHER, GRANDMOTHER, OTHER }`
  - OTHER 선택 시 relationOther 텍스트 필드에 직접 입력

### 주 연락처 관리

- **지정 방식:** 이중 저장 (Student에 primaryParentId FK + Parent에 isPrimary 플래그)
  - 데이터 정합성 보장을 위해 둘 다 유지
- **학부모 미등록 허용:** 학생만 먼저 등록하고 학부모는 나중에 추가 가능 (선택적)
- **첫 등록 시 자동 설정:** 첫 번째 등록된 학부모가 자동으로 주 연락처로 지정
- **주 연락처 삭제 시:** 다음 학부모로 자동 승계 (연락처 공백 방지)

### 예약 데이터 모델

- **필수 필드:**
  - scheduledAt: DateTime (날짜 + 시간)
  - studentId: Student FK
  - teacherId: Teacher FK
  - parentId: Parent FK (어느 학부모와 상담하는지)
  - topic: String (상담 주제)
  - status: ReservationStatus enum
- **시간 단위:** 자유 시간 입력 (DateTime으로 저장, UI에서 제한 없음)
- **기존 CounselingSession 연결:**
  - FK 연결 방식: Reservation 완료 시 CounselingSession 생성하고 counselingSessionId FK로 연결
  - 예약 → 상담 기록 추적 가능
- **상태 전환 규칙:**
  - SCHEDULED에서만 COMPLETED/CANCELLED/NO_SHOW로 전환 가능
  - 완료/취소/노쇼는 최종 상태 (논리적 흐름 보장)

### RBAC 및 팀 격리

- **격리 방식:** Student FK로 간접 격리
  - Parent와 Reservation은 Student를 참조
  - Student의 teamId로 팀 격리 자동 적용
  - 기존 RBAC Prisma Extension이 Student 필터링하면 관련 데이터도 격리됨
- **선생님 접근 범위:** 팀 전체
  - 같은 팀 내 모든 학생의 예약 열람 가능 (협업 용이)
- **예약 수정/삭제 권한:** 팀 내 선생님 모두
  - 예약 생성자가 아니어도 같은 팀 선생님은 수정 가능
- **학부모 정보 접근:** 팀 내 전체 공유
  - 팀 내 선생님은 모든 학생의 학부모 정보 열람 가능

### Claude's Discretion

- 인덱스 설계 및 쿼리 최적화
- 마이그레이션 전략 (NOT VALID 제약조건 사용 여부)
- timestamp 필드 (createdAt, updatedAt) 자동 관리
- 외래 키 삭제 정책 (CASCADE vs SET NULL)

</decisions>

<specifics>
## Specific Ideas

- 기존 CounselingSession 모델과 분리하여 ParentCounselingReservation 별도 모델 생성 (v2.1 연구 결정사항)
- 조부모(GRANDFATHER, GRANDMOTHER)를 기본 열거형에 포함하여 확장 가족 구조 지원
- 주 연락처 이중 저장으로 빠른 조회(Student.primaryParentId)와 학부모 관점 관리(Parent.isPrimary) 모두 가능

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 16-parent-reservation-schema*
*Context gathered: 2026-02-04*
