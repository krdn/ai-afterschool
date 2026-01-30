---
phase: 13-compatibility-analysis-matching
plan: 01
subsystem: analysis, database
tags: [compatibility, scoring, prisma, mbti, saju, numerology, learning-style]

# Dependency graph
requires:
  - phase: 12
    provides: Teacher analysis models (TeacherMbtiAnalysis, TeacherSajuAnalysis, TeacherNameAnalysis) and pure analysis functions (calculateSaju, calculateNameNumerology, scoreMbti)
provides:
  - CompatibilityResult Prisma model for storing teacher-student compatibility scores
  - Pure function compatibility scoring algorithm (MBTI 25%, learning style 25%, saju 20%, name 15%, load balance 15%)
  - Four compatibility sub-modules (mbti, learning-style, saju, name compatibility)
  - CompatibilityResult CRUD DB functions
affects: [13-02, 13-03] # Next plans for batch calculation and matching UI

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Pure function reuse for compatibility calculations (calculateSaju, calculateNameNumerology, scoreMbti work for both Student and Teacher)
    - Weighted average scoring with null-safety (returns 0.5 when analysis data missing)
    - Cosine similarity for vector-based compatibility (elements, learning styles)
    - Prisma upsert with unique constraint for teacherId-studentId pairs

key-files:
  created:
    - prisma/schema.prisma (CompatibilityResult model)
    - src/lib/analysis/compatibility-scoring.ts
    - src/lib/analysis/mbti-compatibility.ts
    - src/lib/analysis/learning-style-compatibility.ts
    - src/lib/analysis/saju-compatibility.ts
    - src/lib/analysis/name-compatibility.ts
    - src/lib/db/compatibility-result.ts
  modified: []

key-decisions:
  - "가중 평균 점수 계산: MBTI 25%, 학습 스타일 25%, 사주 20%, 성명학 15%, 부하 분산 15% 균형 배분"
  - "학습 스타일 유도: MBTI percentages에서 VARK 스타일 유도 (별도 설문 없음)"
  - "분석 미완료 시 기본값 0.5 반환: 일부 분석만 있어도 점수 계산 가능"

patterns-established:
  - "Pattern: Compatibility modules follow same pure function pattern as existing analysis modules (calculateSaju, scoreMbti, etc.)"
  - "Pattern: DB CRUD modules follow teacher-saju-analysis pattern (upsert, get, getAll)"

# Metrics
duration: 3min
completed: 2026-01-30
---

# Phase 13 Plan 1: 궁합 분석 알고리즘 구현 요약

**가중 평균 기반 선생님-학생 궁합 점수 계산 알고리즘과 CompatibilityResult 저장소 구축**

## Performance

- **Duration:** 3 min (228s)
- **Started:** 2026-01-30T12:09:56Z
- **Completed:** 2026-01-30T12:13:44Z
- **Tasks:** 4
- **Files modified:** 1 file (schema), 6 files created

## Accomplishments

- **CompatibilityResult 모델**: teacherId-studentId unique 제약조건, overallScore(0-100), breakdown(항목별 점수), reasons(추천 이유) 포함
- **가중 평균 궁합 알고리즘**: MBTI(25%), 학습 스타일(25%), 사주(20%), 성명학(15%), 부하 분산(15%)으로 종합 점수 계산
- **호환도 서브 모듈 4개**: MBTI percentages 기반 학습 스타일 유도, 각 도메인별 유사도 계산 (0-1 범위)
- **CRUD DB 함수**: upsert with unique constraint, 학생/선생님별 전체 조회, include로 relation 데이터 포함

## Task Commits

Each task was committed atomically:

1. **Task 1: 데이터베이스 스키마 추가 (CompatibilityResult 모델)** - `6ca1a8d` (feat)
2. **Task 2-3: 궁합 점수 계산 순수 함수 및 호환도 서브 모듈 구현** - `20de0bb` (feat)
3. **Task 4: CompatibilityResult DB CRUD 모듈 구현** - `a023795` (feat)

**Plan metadata:** (pending)

## Files Created/Modified

- `prisma/schema.prisma` - CompatibilityResult 모델 추가 (teacherId, studentId FK, overallScore, breakdown, reasons)
- `src/lib/analysis/compatibility-scoring.ts` - 가중 평균 궁합 점수 계산 (calculateCompatibilityScore, generateReasons)
- `src/lib/analysis/mbti-compatibility.ts` - MBTI 4차원별 percentages 차이 기반 유사도
- `src/lib/analysis/learning-style-compatibility.ts` - MBTI → VARK 학습 스타일 유도, 코사인 유사도
- `src/lib/analysis/saju-compatibility.ts` - 사주 오행 벡터 코사인 유사도
- `src/lib/analysis/name-compatibility.ts` - 성명학 4격 평균 유사도
- `src/lib/db/compatibility-result.ts` - CompatibilityResult CRUD 함수 (upsert, get, getAll)

## Decisions Made

1. **가중 평균 배분 결정**: MBTI 25%, 학습 스타일 25%, 사주 20%, 성명학 15%, 부하 분산 15%로 배분하여 성향과 학습 스타일에 가장 높은 가중치 부여
2. **학습 스타일 유도 방식**: MBTI percentages에서 VARK 학습 스타일을 유도하여 별도 설문 없이 학습 호환성 계산 (High S+J → Visual, High N+P → Kinesthetic, High E → Auditory, High I → Read/Write)
3. **분석 미완료 시 기본값**: 일부 분석 데이터가 없어도 궁합 점수 계산 가능하도록 null 처리 시 0.5 기본값 반환

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Shadow database sync issue 해결**
- **Found during:** Task 1 (Prisma migration)
- **Issue:** `npx prisma migrate dev` 실패 - "The underlying table for model `ReportPDF` does not exist" (5번째 발생)
- **Fix:** `npx prisma db push`로 마이그레이션 우회 적용 후 `npx prisma generate` 실행
- **Files modified:** prisma/schema.prisma (커밋 완료)
- **Verification:** DB 테이블 생성 확인, TypeScript 타입 체크 통과
- **Committed in:** 6ca1a8d (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Shadow database sync issue는 예상된 문제로 기존 패턴대로 해결. 계획에 영향 없음.

## Issues Encountered

- **Shadow database sync issue (5회)**: Prisma migrate dev가 ReportPDF 테이블 누락으로 실패. `npx prisma db push`로 우회 후 해결. 이전 Phase 11-01, 12-01과 동일한 패턴으로 지속적으로 발생 중.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**What's ready:**
- CompatibilityResult 모델과 CRUD 함수 완료로 궁합 데이터 저장/조회 가능
- 순수 함수 기반 호환도 계산 알고리즘 완료로 Teacher/Student 분석 데이터 재사용 가능
- 4개 호환도 모듈(MBTI, 학습 스타일, 사주, 성명학) 완료로 개별 유사도 계산 가능

**What's next:**
- Phase 13-02에서 배치 작업으로 기존 Teacher-Student 조합의 궁합 점수 계산 필요
- Phase 13-03에서 궁합 기반 매칭 UI/UX 필요

**Blockers/Concerns:**
- Teacher 분석 데이터 부족: 기존 선생님들의 birthDate, nameHanja, MBTI 데이터가 null인 경우가 많아 사주/성명학/MBTI 분석 불가
  - 해결 방안: Teacher profile edit form 또는 bulk data import 필요 (Phase 12-05에서 이미 식별됨)

---
*Phase: 13-compatibility-analysis-matching*
*Completed: 2026-01-30*
