# Phase 17: Reservation Server Actions - Context

**Gathered:** 2026-02-04
**Status:** Ready for planning

<domain>
## Phase Boundary

상담 예약 비즈니스 로직 구현 — 예약 CRUD, 중복 검증, 상태 전환, CounselingSession 연결. UI 구현은 Phase 18에서 담당.

</domain>

<decisions>
## Implementation Decisions

### 예약 중복 검증
- **검증 범위**: 선생님별 — 같은 선생님의 예약만 충돌 검사. 다른 선생님은 같은 시간에 예약 가능
- **시간 버퍼**: 없음 — 정확히 같은 시간대만 충돌로 판정 (10:00-10:30과 10:30-11:00은 충돌 아님)
- **시간 단위**: 30분 단위 — 10:00, 10:30, 11:00 등으로만 예약 가능
- **취소된 예약**: 중복 검사에서 제외 — CANCELLED 상태의 예약 시간대에 새 예약 가능

### 상태 전환 규칙
- **완료 조건**: 조건 없음 — 예약 날짜/시간과 무관하게 언제든 COMPLETED로 전환 가능
- **상태 되돌리기**: 불가 — COMPLETED/CANCELLED/NO_SHOW는 최종 상태. 수정 불가
- **CANCELLED vs NO_SHOW**: 수동 선택 — 선생님이 상황에 따라 직접 선택
- **SCHEDULED 수정**: 모든 필드 수정 가능 — 날짜, 시간, 학부모 등 모두 변경 가능

### CounselingSession 연결
- **세션 생성**: 자동 생성 — 예약 COMPLETED 전환 시 CounselingSession 자동 생성 및 연결
- **기본 내용**: 최소 정보만 — 학생, 선생님, 날짜만 채우고 content는 빈 값
- **연결 관계**: 1:1 관계 — 하나의 예약은 하나의 세션만 생성
- **세션 삭제 시**: 예약 상태 유지 — COMPLETED 유지, counselingSessionId만 null로 변경 (ON DELETE SET NULL)

### 에러 응답 형식
- **검증 실패**: 사용자 친화적 메시지 — "해당 시간에 이미 예약이 있습니다" 등 구체적 안내
- **반환 형식**: 기존 패턴 유지 — `{ success: boolean, error?: string, data?: T }` (performance.ts 패턴)
- **권한 오류**: 일반적 메시지 — "접근 권한이 없습니다" (상세 정보 노출 방지)
- **상태 전환 실패**: 구체적 안내 — "이미 완료된 예약은 취소할 수 없습니다" 등 상태별 메시지

### Claude's Discretion
- 트랜잭션 처리 전략 (중복 검사와 생성의 원자성)
- Server Action 함수 분리 구조
- Zod 스키마 설계
- 쿼리 최적화 방식

</decisions>

<specifics>
## Specific Ideas

- 기존 `src/lib/actions/performance.ts` 패턴을 재사용하여 일관성 유지
- RBAC 패턴은 Phase 11에서 구축된 `createTeamFilteredPrisma` 활용
- 상태 전환 시 트랜잭션으로 예약 상태 변경과 CounselingSession 생성을 원자적으로 처리

</specifics>

<deferred>
## Deferred Ideas

None — 논의가 Phase 17 범위 내에서 진행됨

</deferred>

---

*Phase: 17-reservation-server-actions*
*Context gathered: 2026-02-04*
