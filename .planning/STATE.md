# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-30)

**Core value:** 학생 정보 통합 관리를 기반으로 AI 성향 분석 및 맞춤형 학습/진로 제안 제공
**Current focus:** Phase 15 - Multi-LLM Integration & Smart Routing

## Current Position

Phase: 15 of 15 (Multi-LLM Integration & Smart Routing)
Plan: 2 of 8 in current phase
Status: In progress
Last activity: 2026-01-31 — Completed 15-02-PLAN.md (LLM router & usage tracking)

Progress: [████████████████████████░] 97.9% (93/95 plans complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 93
- Average duration: ~4.5 min
- Total execution time: ~7 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1-7 (v1.0) | 36 | 254 min | ~7 min |
| 8-10 (v1.1) | 22 | ~102 min | ~5 min |
| 11 (v2.0) | 7 | 26 min | ~4 min |
| 12 (v2.0) | 8 | 20 min | ~2.5 min |
| 13 (v2.0) | 8 | 13 min | ~1.6 min |
| 14 (v2.0) | 8 | 25 min | ~3.1 min |
| 15 (v2.0) | 2 | 9 min | ~4.5 min |

**Recent Trend:**
- Last 5 plans: LLM router & usage tracking (15-02), Vercel AI SDK integration (15-01), PerformanceDashboard 실제 데이터 연동 (14-08), Analytics 페이지 데이터 연결 (14-07), 팀 구성 분석 (14-06)
- Trend: Phase 15 progressing, router and tracking services complete

*Updated after Phase 15-02 completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [11-01] Role enum with default TEACHER for zero-downtime migration - Existing teachers get TEACHER role, promoted later by admin
- [11-01] Nullable teamId on Teacher/Student for gradual team rollout - Teams assigned in future plans without schema changes
- [11-01] FK with ON DELETE SET NULL for referential integrity - Prevents orphaned records when Team deleted
- [11-02] Prisma Client Extensions over deprecated Middleware - $allOperations pattern for automatic teamId filtering
- [11-02] PostgreSQL RLS with quoted identifiers for case sensitivity - "teamId" vs teamid to prevent folding
- [11-02] Defense in Depth: App-layer (Prisma Extensions) + DB-layer (RLS) for tenant isolation
- [11-03] verifySession as RLS entry point - All DB queries must go through verifySession which calls setRLSSessionContext
- [11-03] Backward-compatible JWT payload - Role defaults to TEACHER, teamId defaults to null for existing sessions
- [11-04] Explicit RBAC checks in Server Actions - Clear permission model with role-based CRUD matrix (Directors full access, users self-update)
- [11-04] Form state pattern for validation errors - Field-specific and _form errors for user feedback
- [11-05] Client-side filtering for teacher list - TanStack Table with useMemo for instant search/filter response
- [11-05] Dynamic team filter dropdown - Extracted from teacher data instead of separate API call
- [11-06] Next.js 15 params as Promise - Dynamic route params must be typed as Promise and awaited before use
- [11-06] Client component pattern for teacher detail - 'use client' directive for interactive UI elements (buttons, links)
- [11-07] Student.teamId migration already completed in 11-01 - Verification confirmed 6/6 students with NULL teamId (data preserved)
- [11-07] Docker-based backup strategy - Using docker exec with pg_dump for PostgreSQL backups
- [12-01] Teacher*Analysis models mirror Student*Analysis structure exactly - Enables code reuse for teacher personality analysis calculations
- [12-01] ON DELETE CASCADE for Teacher analysis relationships - Automatic cleanup when Teacher deleted
- [12-01] Manual migration workaround for shadow database sync issue - Same pattern as Phase 11-01 (monitor for future migrations)
- [12-03] Teacher model extended with nameHanja, birthDate, birthTimeHour, birthTimeMinute - Nullable fields for backward compatibility with existing teachers
- [12-03] Server Actions reuse pure analysis functions - calculateSaju, calculateNameNumerology, scoreMbti work for both Student and Teacher
- [12-04] Teacher analysis panels mirror Student panel structure exactly - MbtiResultsDisplay component is Student/Teacher agnostic, same conditional rendering pattern
- [12-04] Mock MBTI responses for testing - Real survey form deferred to future plan, placeholder modal for direct input
- [12-07] TeacherFaceAnalysis mirrors FaceAnalysis structure exactly - Same fields for complete code reuse (imageUrl, result, status, errorMessage, version, analyzedAt)
- [12-07] AI face analysis is pure function - Claude Vision API logic works for both Student and Teacher without modification
- [12-08] Teacher palm analysis mirrors Student palm analysis pattern exactly - upsertTeacherPalmAnalysis, runTeacherPalmAnalysis, TeacherPalmPanel all mirror Student equivalents
- [12-08] Hand field for left/right palm distinction - Toggle UI in component, hand parameter passed to AI analysis
- [12-05] Teacher detail page integrates all 5 analysis panels (MBTI, Saju, Name, Face, Palm) - Type casting Prisma JsonValue to component-expected types at boundary
- [12-05] Teacher image URLs sourced from analysis records - Unlike Student with separate images table, Teacher face/palm analysis stores imageUrl directly
- [12-06] Teacher analysis fields already added in Phase 12-03 - Plan 12-06 verified all infrastructure complete (nameHanja, birthDate, birthTimeHour, birthTimeMinute, N+1 optimization)
- [13-01] CompatibilityResult 모델 생성: teacherId-studentId unique 제약조건, overallScore(0-100), breakdown(항목별 점수), reasons(추천 이유)
- [13-01] 가중 평균 궁합 알고리즘: MBTI 25%, 학습 스타일 25%, 사주 20%, 성명학 15%, 부하 분산 15%
- [13-01] 학습 스타일 유도: MBTI percentages에서 VARK 스타일 유도 (별도 설문 없음)
- [13-01] 호환도 서브 모듈: MBTI, 학습 스타일, 사주, 성명학 각각 순수 함수로 유사도 계산 (0-1 범위)
- [13-02] 궁합 분석 Server Actions: analyzeCompatibility (단일), batchAnalyzeCompatibility (일괄, 병렬 처리)
- [13-02] REST API 엔드포인트: POST /api/compatibility/calculate, Zod 검증, HTTP 상태 코드 분리
- [13-02] 수동 배정 Server Actions: assignStudentToTeacher, reassignStudent (RBAC: DIRECTOR, TEAM_LEADER만)
- [13-03] Greedy 자동 배정 알고리즘: O(students × teachers) 복잡도로 최적 배정, 부하 분산 최적화
- [13-03] AssignmentProposal 모델: 제안 저장 (assignments/summary Json 필드, status pending/approved/rejected)
- [13-03] Promise.all 일괄 업데이트: applyAssignmentProposal에서 성능 최적화
- [13-04] getTeacherRecommendations Server Action: 학생별 팀 내 모든 Teacher의 궁합 점수 계산, score.overall 내림차순 정렬
- [13-04] Teacher role filtering: TEACHER, MANAGER, TEAM_LEADER만 추천 목록에 포함 (DIRECTOR 제외)
- [13-04] Current teacher highlighting: 현재 배정된 선생님을 추천 목록에서 시각적으로 구분
- [13-06] Disparity Index: 학교별 평균 점수 차이를 (max-min)/100으로 정규화하여 집단 간 편향 측정
- [13-06] ABROCA: 히스토그램(10 bins) 기반 L1 distance로 점수 분포 편향 측정
- [13-06] Distribution Balance: 1 - (stdDev/mean) 공식으로 선생님별 배정 균형 정도 표현
- [13-06] Fairness thresholds: Disparity Index > 0.2, ABROCA > 0.3, Distribution Balance < 0.7 시 경고
- [13-08] Compatibility UI components: Used styled spans instead of Badge (not available), custom progress bars instead of shadcn/ui Progress
- [13-08] Recharts radar chart: 5-sided visualization with ResponsiveContainer for mobile compatibility
- [14-01] teacherId nullable in GradeHistory - Supports unassigned/self-study cases, maintains flexibility
- [14-01] ON DELETE SET NULL for GradeHistory.teacherId - Preserves grade records when teacher deleted (historical data integrity)
- [14-01] ON DELETE CASCADE for counseling/satisfaction models - Automatic cleanup when student/teacher deleted
- [14-01] NormalizedScore calculated at write time - Stores 0-100 range for consistent analysis without recalculation
- [14-01] Composite indexes on [studentId, subject, testDate] - Enables efficient querying of student grade history with time-series tracking
- [14-02] TanStack Table pattern from Phase 11-05 reused for student list consistency
- [14-02] Grade color coding: red (<60), yellow (<80), green (>=80) for visual performance indicators
- [14-02] RBAC inline checks in page component for immediate access control
- [14-03] Control variable adjustment thresholds: HIGH initial grades (≥90) get +10% boost, LOW initial grades (<60) get -10% penalty for fair comparison
- [14-03] Confidence calculation formula: Math.min(1, (dataPoints - 1) / 3) ensures 4+ data points yield high confidence (>0.8)
- [14-03] Trend classification: Based on 10% thresholds (UP > 10%, STABLE ±10%, DOWN < -10%) following educational research
- [14-03] Linear interpolation for missing data: Fills gaps > 30 days between monthly data points for smooth visualization
- [14-03] TDD cycle: RED → GREEN with atomic commits (test/feat/refactor pattern)
- [14-06] Shannon Diversity Index for team composition: Used normalized entropy calculation (0-100 range) with log(n) normalization for consistent diversity scoring across MBTI (16), VARK (4), 오행 (5), subjects (5), grades (6)
- [14-06] 5-axis radar chart visualization: Combined MBTI, VARK, 오행, subjects, grades into single radar with ideal team reference (80 points)
- [14-06] Priority-based recommendation system: High (weak subjects, low diversity <30), Medium (weak grades, moderate diversity 30-50), Low (good practices, high diversity >70)
- [14-06] Color-coded expertise coverage heatmap: Red (weak, <50% of average), Yellow (adequate, 50-100% of average), Green (sufficient, >=average)
- [v2.0] 팀 단위 데이터 분리: 보안 및 프라이버시 보장을 위해 Prisma middleware + PostgreSQL RLS 적용
- [v2.0] 선생님 성향 분석: 학생과 동일한 방식으로 궁합 계산 (기존 분석 모듈 재사용)
- [v2.0] LLM 전체 공통 설정: 관리 용이성 및 비용 효율성을 위해 Vercel AI SDK로 통합
- [14-07] Analytics page data fetching pattern: Fetch teachers first, then get individual metrics; Update dashboard to accept data props; Type narrowing with "data" in result
- [15-01] Vercel AI SDK unified interface: ai, @ai-sdk/anthropic, @ai-sdk/openai, @ai-sdk/google, ollama-ai-provider-v2 for multi-provider support
- [15-01] ollama-ai-provider-v2 over v1: Zod v4 compatibility required v2 package
- [15-01] AES-256-GCM for API key encryption: iv:authTag:encrypted format stored in LLMConfig.apiKeyEncrypted
- [15-02] Vercel AI SDK v6 uses maxOutputTokens (not maxTokens) and inputTokens/outputTokens (not promptTokens/completionTokens)
- [15-02] Feature-based routing with default fallback order: ollama -> anthropic -> openai -> google

### Pending Todos

None yet.

### Blockers/Concerns

**From Phase 14 verification:**
- None - All gaps successfully closed by plans 14-07 and 14-08

**From Phase 14-04 execution:**
- None - all tasks completed as specified.

**From Phase 12-05 execution:**
- Teacher profile edit form needed: Existing teachers have null `birthDate`, `birthTimeHour`, `birthTimeMinute`, `nameHanja` fields. Saju and Name analysis panels show "cannot analyze" messages until populated.
- Teacher image storage missing: No TeacherImage model exists (unlike Student). Face/Palm analysis expects image upload functionality which may not be implemented yet.

**From Phase 12-04 execution:**
- Teacher data migration needed: Existing teachers have null birthDate and nameHanja - analysis will fail until populated. May need data entry UI or bulk import.
- MBTI survey form not implemented: Current panels use mock responses. Real /teachers/[id]/mbti survey page needed in future plan for production use.

**From Phase 12-07/12-08 execution:**
- Shadow database sync issue: Recurred again (5th occurrence). Same ReportPDF table missing error. Manual workaround pattern continues to work. Becoming a predictable pattern - should investigate shadow database configuration.

**From Phase 13-07 execution:**
- Schema constraint issue: Current schema has teacherId as non-nullable String, which conflicts with "unassigned student" concept. Would need schema migration to support true unassigned student workflow (nullable teacherId).

**From Phase 13-03 execution:**
- Shadow database sync issue: Recurred again (7th occurrence). `npx prisma migrate dev` failed with ReportPDF table missing error. Workaround: Used `npx prisma db push` instead. Pattern continues to be predictable.
- Greedy 알고리즘 한계: 지역 최적해(Local optimum)에 빠질 수 있으나 대부분의 실무 사례에서 충분히 좋은 결과를 제공

**From Phase 13-01 execution:**
- Shadow database sync issue: Recurred again (6th occurrence). `npx prisma migrate dev` failed with ReportPDF table missing error. Workaround: Used `npx prisma db push` instead. Pattern continues to be predictable.

**From Phase 11-05 execution:**
- None identified

**From Phase 11-04 execution:**
- None identified

**From Phase 11-02 execution:**
- Session module must call setRLSSessionContext before every DB query - RESOLVED: Now integrated in verifySession
- Server Actions must use getRBACPrisma instead of raw db - RESOLVED: Teacher/Team actions use explicit RBAC checks

**From Phase 11-01 execution:**
- Shadow database sync issue: Prisma migrate dev failed due to ReportPDF table missing in shadow DB. Workaround: Manual migration creation and apply. Monitor for future migrations.

**From Phase 11 planning:**
- Ollama Docker networking: Docker 컨테이너에서 192.168.0.5:11434 접속 가능성 확인 필요 (Phase 15)
- Korean saju compatibility validation: 학술적 검증 부족으로 도메인 전문가 상담 필요 (Phase 13)

## Session Continuity

Last session: 2026-01-31 16:45 KST
Stopped at: Completed 15-02-PLAN.md (LLM router & usage tracking)
Resume file: None

---
*Last updated: 2026-01-31*
