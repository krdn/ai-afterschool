# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-04)

**Core value:** 학생 정보 통합 관리를 기반으로 AI 성향 분석 및 맞춤형 학습/진로 제안 제공
**Current focus:** v2.1 - Parent Counseling Management (Phase 16-17)

## Current Position

Phase: 18 - Reservation Management UI
Plan: 03 of 04 (Plan 18-03 완료)
Status: In progress
Last activity: 2026-02-04 — Completed 18-03-PLAN.md

Progress: [██░░░░░░░░░░░░░░░░░░░░░░░] 20% (2/7 phases complete, 3/4 plans in Phase 18)

**v2.1 학부모 상담 관리 시스템**
- Phase 16: Parent & Reservation Database Schema (✅ complete)
- Phase 17: Reservation Server Actions (✅ complete)
  - Plan 17-01: 예약 생성 Server Actions (✅)
  - Plan 17-02: 예약 목록 조회 및 검색 (✅)
  - Plan 17-03: 예약 수정/삭제 (✅)
  - Plan 17-04: 예약 상태 변경 (✅)
- Phase 18: Reservation Management UI (in progress)
  - Plan 18-01: Badge variants 추가 (✅)
  - Plan 18-02: DatePicker 컴포넌트 생성 (✅)
  - Plan 18-03: 예약 등록 폼 (pending)
  - Plan 18-04: 예약 관리 페이지 (pending)
- Phase 19: Calendar View (pending)
- Phase 20: Student Page Integration (pending)
- Phase 21: Statistics & Dashboard (pending)
- Phase 22: AI Integration (pending)

## Performance Metrics

**Velocity:**
- Total plans completed: 102 (v1.0-v2.1)
- Average duration: ~4.3 min
- Total execution time: ~7.5 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1-7 (v1.0) | 36 | 254 min | ~7 min |
| 8-10 (v1.1) | 22 | ~102 min | ~5 min |
| 11 (v2.0) | 7 | 26 min | ~4 min |
| 12 (v2.0) | 8 | 20 min | ~2.5 min |
| 13 (v2.0) | 8 | 13 min | ~1.6 min |
| 14 (v2.0) | 8 | 25 min | ~3.1 min |
| 15 (v2.0) | 8 | 35 min | ~4.4 min |
| 16 (v2.1) | 1 | 2 min | ~2 min |
| 17 (v2.1) | 4 | 8 min | ~2 min |
| 18 (v2.1) | 3 | 2 min | ~0.7 min |

**Recent Trend:**
- v2.0 complete: 40 plans in ~119 min (~3 min/plan average)
- v2.1 started: Phase 16-18 (8 plans) in 12 min (~1.5 min/plan average)
- Velocity improved significantly from v1.0 (7 min) to v2.0-v2.1 (~2-3 min)

*Updated after Phase 18-03 completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

**v2.1 결정:**
- [v2.1] 선생님 중심 운영: 학부모 계정 없이 선생님이 모든 상담 관리
- [v2.1] 내부 기록 전용: 외부 알림 없이 시스템에만 기록
- [v2.1] ParentCounselingReservation 별도 모델: 기존 CounselingSession과 분리하여 예약 전용 책임 부여
- [v2.1] react-day-picker + shadcn/ui Calendar: 날짜 선택 UX 개선 (45KB gzipped)
- [16-01] Student FK 간접 격리: Parent/Reservation은 Student를 참조하여 기존 RBAC Extension 재사용
- [16-01] 주 연락처 이중 저장: Student.primaryParentId FK + Parent.isPrimary 플래그로 빠른 조회와 관리 모두 지원
- [16-01] ON DELETE CASCADE: Parent/Reservation FK에 Cascade 적용 (Phase 14 결정사항과 일관성)
- [17-01] 30분 단위 시간 슬롯 검증: Zod 커스텀 규칙으로 분이 0 또는 30인지 확인
- [17-01] 트랜잭션 기반 중복 검증: 같은 선생님의 같은 시간대 예약을 CANCELLED 상태 제외하고 확인
- [17-01] Prisma 타입 사용: ESLint 오류 방지를 위해 any 대신 Prisma.ParentCounselingReservationWhereInput 사용
- [17-03] Hard delete for SCHEDULED reservations: Prisma cascade로 연관 데이터 자동 정리
- [17-03] 상태 기반 수정/삭제 제어: SCHEDULED 상태만 수정/삭제 가능 (COMPLETED/CANCELLED/NO_SHOW 불가)
- [17-03] 부분 수정 지원: 모든 필드 선택적 (scheduledAt, studentId, parentId, topic)
- [17-04] COMPLETED 전환 시 CounselingSession 자동 생성: 트랜잭션으로 원자성 보장
- [17-04] 상태 전환 제어: SCHEDULED 상태에서만 COMPLETED/CANCELLED/NO_SHOW로 전환 가능
- [17-04] CounselingSession 기본값: duration 30분, type ACADEMIC (필요시 변경 가능)
- [18-01] Badge 상태 variants: scheduled(blue), completed(green), cancelled(gray), noShow(orange) + dark mode 지원
- [18-02] react-day-picker v9 DatePicker: 한국어 로케일, Tailwind 스타일링, 단일 날짜 선택 모드
- [18-03] getStudentsAction 추가: StudentWithParents 타입으로 학부모 정보 포함 반환
- [18-03] 예약된 슬롯 필터링: CANCELLED/NO_SHOW 상태 제외하여 실제 예약만 비활성화
- [18-03] 학생/학부모 의존성: selectedStudentId 변경 시 selectedParentId 초기화

**v2.0 결정 (영향 있음):**
- [11-02] Prisma Client Extensions over deprecated Middleware - $allOperations pattern for automatic teamId filtering
- [11-02] PostgreSQL RLS with quoted identifiers for case sensitivity - "teamId" vs teamid to prevent folding
- [11-02] Defense in Depth: App-layer (Prisma Extensions) + DB-layer (RLS) for tenant isolation
- [11-03] verifySession as RLS entry point - All DB queries must go through verifySession which calls setRLSSessionContext
- [14-01] ON DELETE CASCADE for counseling/satisfaction models - Automatic cleanup when student/teacher deleted
- [15-01] Vercel AI SDK unified interface: ai, @ai-sdk/anthropic, @ai-sdk/openai, @ai-sdk/google, ollama-ai-provider-v2 for multi-provider support
- [15-04] 기존 Claude 직접 호출을 모두 통합 라우터로 마이그레이션

### Pending Todos

None yet.

### Blockers/Concerns

**From v2.1 Research:**
- Shadow database sync issue: 반복 발생 중 (7회). `npx prisma db push` 워크어라운드 계속 사용.
- Schema constraint issue: Current schema has teacherId as non-nullable String, which conflicts with "unassigned student" concept.

**From Phase 12-05 execution:**
- Teacher profile edit form needed: Existing teachers have null `birthDate`, `birthTimeHour`, `birthTimeMinute`, `nameHanja` fields.

**From v2.1 Research - Key Pitfalls to Avoid:**
1. 기존 CounselingSession 모델 오용 - 예약 필드를 기존 모델에 추가하면 성과 분석 로직 오염
2. 새 모델에 RBAC 적용 누락 - 다른 팀 학생 정보 노출 위험
3. 예약 시간 중복 검증 누락 - 더블 부킹 발생
4. 기존 상담 페이지 UI 파괴 - 점진적 통합 필요
5. 날짜/시간 처리 일관성 부족 - 타임존 명시적 처리

## Session Continuity

Last session: 2026-02-04 13:54 KST
Stopped at: Completed Phase 18 Plan 03 (예약 등록 폼 UI 구현)
Resume file: None

---
*Last updated: 2026-02-04 (Phase 18-03 완료)*
