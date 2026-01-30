---
phase: 13-compatibility-analysis-matching
plan: 03
subsystem: optimization, database
tags: [auto-assignment, greedy, load-balancing, prisma, compatibility]

# Dependency graph
requires:
  - phase: 13-01
    provides: CompatibilityResult 모델, calculateCompatibilityScore 함수, 궁합 점수 계산 알고리즘
  - phase: 13-02
    provides: Server Actions & API, RBAC 기반 궁합 분석, 수동 배정 기능
provides:
  - AssignmentProposal Prisma 모델 (자동 배정 제안 저장)
  - Greedy 기반 자동 배정 알고리즘 (O(students × teachers) 복잡도)
  - AssignmentProposal CRUD DB 함수 (생성, 조회, 적용, 거절)
affects: [13-04, 13-05, 13-06, 13-07, 13-08]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Greedy algorithm with load balancing for assignment optimization
    - Prisma Json 타입 활용 (assignments, summary 필드)
    - Promise.all 일괄 업데이트로 성능 최적화
    - verifySession로 인증 및 RBAC 확인

key-files:
  created:
    - prisma/schema.prisma (AssignmentProposal 모델 추가)
    - src/lib/optimization/auto-assignment.ts (Greedy 자동 배정 알고리즘)
    - src/lib/db/assignment.ts (AssignmentProposal CRUD 함수)
  modified:
    - prisma/schema.prisma (Teacher, Team 모델에 relation 추가)

key-decisions:
  - "Greedy 알고리즘 선택: 단순하고 효과적인 O(students × teachers) 복잡도"
  - "부하 분산: teacherLoads Map으로 선생님별 학생 수 추적, maxLoad 제약조건 적용"
  - "Prisma Json 타입: assignments, summary를 유연한 Json으로 저장하여 스키마 변경 최소화"
  - "Promise.all 일괄 업데이트: applyAssignmentProposal에서 성능 최적화"

patterns-established:
  - "Pattern: 자동 배정 알고리즘은 verifySession으로 인증 후 DB 조회"
  - "Pattern: Prisma JsonValue는 as unknown as Type으로 캐스팅하여 타입 안전성 확보"
  - "Pattern: 제안 생성 시 요약(summary)을 함께 계산하여 저장"

# Metrics
duration: 4min
completed: 2026-01-30
---

# Phase 13 Plan 3: AI 자동 배정 알고리즘 구현 요약

**Greedy 기반 자동 배정 알고리즘으로 궁합 최대화와 부하 분산 최적화를 달성하고 AssignmentProposal DB 모델로 제안 저장/관리 기능 제공**

## Performance

- **Duration:** 4 min (240s)
- **Started:** 2026-01-30T12:20:44Z
- **Completed:** 2026-01-30T12:24:37Z
- **Tasks:** 3
- **Files modified:** 1 file modified (schema), 2 files created

## Accomplishments

- **AssignmentProposal 모델**: id, name, teamId(nullable), proposedBy, assignments(Json), summary(Json), status(pending/approved/rejected) 포함
- **Greedy 자동 배정 알고리즘**: O(students × teachers) 복잡도, 각 Student마다 최고 궁합의 Teacher 선택, 부하 제약조건 적용
- **AssignmentProposal CRUD**: createAssignmentProposal(요약 계산), getAssignmentProposal, listAssignmentProposals(필터링), applyAssignmentProposal(일괄 업데이트)
- **부하 분산 최적화**: teacherLoads Map으로 현재 부하 추적, maxLoad = ceil(averageLoad × 1.2) 제약조건

## Task Commits

Each task was committed atomically:

1. **Task 1: AssignmentProposal 데이터베이스 모델 추가** - `e5543ce` (feat)
2. **Task 2: Greedy 자동 배정 알고리즘 구현** - `68e7b0c` (feat)
3. **Task 3: AssignmentProposal CRUD 모듈 구현** - `3d049dc` (feat)

**Plan metadata:** (pending)

## Files Created/Modified

- `prisma/schema.prisma` - AssignmentProposal 모델 추가, Teacher/Team 모델에 relation 추가
- `src/lib/optimization/auto-assignment.ts` - generateAutoAssignment(Greedy 알고리즘), calculateLoadStats, summarizeAssignments
- `src/lib/db/assignment.ts` - createAssignmentProposal, getAssignmentProposal, listAssignmentProposals, applyAssignmentProposal, rejectAssignmentProposal

## Decisions Made

1. **Greedy 알고리즘 선택**: EMO(Evolutionary Multi-objective Optimization) 대신 단순한 Greedy 사용 - O(students × teachers) 복잡도로 충분히 좋은 결과, 구현 및 유지보수 용이
2. **부하 분산 가중치**: 부하 분산 점수는 calculateCompatibilityScore에서 15% 가중치로 계산되며, Greedy 알고리즘에서는 maxLoad 제약조건으로 강제 적용
3. **Prisma Json 타입 활용**: assignments({studentId, teacherId, score}[])와 summary({totalStudents, averageScore, teacherLoads})를 Json으로 저장하여 스키마 변경 없이 유연한 데이터 저장
4. **일괄 업데이트 최적화**: applyAssignmentProposal에서 Promise.all로 Student.teacherId를 일괄 업데이트하여 대용량 배정 시 성능 향상

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Shadow database sync issue 해결**
- **Found during:** Task 1 (Prisma migration)
- **Issue:** `npx prisma migrate dev` 실패 - "The underlying table for model `ReportPDF` does not exist" (7번째 발생)
- **Fix:** `npx prisma db push`로 마이그레이션 우회 적용 후 `npx prisma generate` 실행
- **Files modified:** prisma/schema.prisma (커밋 완료)
- **Verification:** DB 테이블 생성 확인, TypeScript 타입 체크 통과
- **Committed in:** e5543ce (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Shadow database sync issue는 예상된 문제로 기존 패턴대로 해결. 계획에 영향 없음.

## Issues Encountered

- **Shadow database sync issue (7회)**: Prisma migrate dev가 ReportPDF 테이블 누락으로 실패. `npx prisma db push`로 우회 후 해결. Phase 11-01, 12-01, 13-01과 동일한 패턴으로 지속적으로 발생 중.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**What's ready:**
- AssignmentProposal 모델과 CRUD 함수 완료로 자동 배정 제안 저장/조회/적용 가능
- Greedy 자동 배정 알고리즘 완료로 궁합 기반 최적 배정 생성 가능
- 부하 분산 최적화 로직 포함으로 선생님별 학생 수 균형 확보

**What's next:**
- Phase 13-04에서 자동 배정 제안 Server Actions 구현 필요 (generateAssignmentProposal, applyAssignmentProposal)
- Phase 13-05에서 자동 배정 UI/UX 구현 필요 (제안 생성, 미리보기, 승인/거절)

**Blockers/Concerns:**
- Teacher 분석 데이터 부족: 기존 선생님들의 birthDate, nameHanja, MBTI 데이터가 null인 경우가 많아 궁합 점수 계산이 부정확할 수 있음 (Phase 12-05, 13-01에서 이미 식별됨)
- Greedy 알고리즘 한계: 지역 최적해(Local optimum)에 빠질 수 있으나, 대부분의 실무 사례에서 충분히 좋은 결과를 제공

---
*Phase: 13-compatibility-analysis-matching*
*Completed: 2026-01-30*
