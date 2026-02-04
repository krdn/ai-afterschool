# Roadmap: AI AfterSchool

## Overview

AI AfterSchool는 학생 정보 통합 관리를 기반으로 AI 성향 분석 및 맞춤형 학습/진로 제안을 제공하는 학원 관리 시스템입니다. v1.0에서 학생 중심의 기본 기능을 구축했고, v1.1에서 프로덕션 준비(배포 자동화, 모니터링, 성능 최적화)를 완료했습니다. v2.0에서는 다중 선생님 지원, 팀 기반 접근 제어, 선생님-학생 궁합 분석, AI 기반 최적 배정 시스템을 추가하여 단일 선생님이 아닌 학원 조직 전체를 관리할 수 있는 시스템으로 확장합니다. v2.1에서는 학부모 상담 예약/기록 시스템을 추가하여 체계적인 상담 관리 및 통계를 제공합니다.

## Milestones

- ✅ **v1.0 MVP** - Phases 1-7 (shipped 2026-01-29)
- ✅ **v1.1 Production Readiness** - Phases 8-10 (shipped 2026-01-30)
- ✅ **v2.0 Teacher Management** - Phases 11-15 (shipped 2026-02-02)
- **v2.1 Parent Counseling Management** - Phases 16-22 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-7) - SHIPPED 2026-01-29</summary>

### Phase 1: Foundation & Authentication
**Goal**: 프로젝트 기반 구축과 선생님 인증 시스템
**Plans**: 7 plans

Plans:
- [x] 01-01: Project scaffolding (Next.js 15, Prisma, PostgreSQL)
- [x] 01-02: Database schema design (Student, Teacher, User models)
- [x] 01-03: Authentication system (email/password login)
- [x] 01-04: Session management (JWT, middleware)
- [x] 01-05: Password reset (email-based recovery)
- [x] 01-06: Multi-account support (multiple teachers)
- [x] 01-07: Authentication UI components

### Phase 2: File Infrastructure
**Goal**: 파일 업로드 인프라 구축
**Plans**: 4 plans

Plans:
- [x] 02-01: Cloudinary integration setup
- [x] 02-02: Image upload API endpoints
- [x] 02-03: File validation and security
- [x] 02-04: Upload UI components

### Phase 3: Calculation Analysis
**Goal**: 전통적 성향 분석 (사주, 성명학)
**Plans**: 4 plans

Plans:
- [x] 03-01: Saju analysis (사주팔자 계산, 오행, 십성)
- [x] 03-02: Name numerology (성명학 획수 및 수리 분석)
- [x] 03-03: Analysis result storage
- [x] 03-04: Analysis UI components

### Phase 4: MBTI Analysis
**Goal**: MBTI 성격 유형 분석
**Plans**: 4 plans

Plans:
- [x] 04-01: MBTI survey form
- [x] 04-02: MBTI scoring algorithm
- [x] 04-03: Result interpretation
- [x] 04-04: MBTI UI components

### Phase 5: AI Image Analysis
**Goal**: AI 이미지 분석 (관상, 손금)
**Plans**: 5 plans

Plans:
- [x] 05-01: Claude Vision API integration
- [x] 05-02: Face reading analysis (관상)
- [x] 05-03: Palm reading analysis (손금)
- [x] 05-04: Image upload workflows
- [x] 05-05: Analysis result display

### Phase 6: AI Integration
**Goal**: AI 기반 맞춤형 제안 통합
**Plans**: 5 plans

Plans:
- [x] 06-01: Claude API text integration
- [x] 06-02: Learning strategy recommendations
- [x] 06-03: Career guide recommendations
- [x] 06-04: Unified analysis aggregation
- [x] 06-05: Recommendation UI components

### Phase 7: Reports
**Goal**: 종합 상담 보고서 PDF 출력
**Plans**: 7 plans

Plans:
- [x] 07-01: PDF template design (한글 폰트)
- [x] 07-02: @react-pdf/renderer integration
- [x] 07-03: Report generation API
- [x] 07-04: PDF download functionality
- [x] 07-05: Report layout optimization
- [x] 07-06: Report data aggregation
- [x] 07-07: Report UI workflow

</details>

<details>
<summary>✅ v1.1 Production Readiness (Phases 8-10) - SHIPPED 2026-01-30</summary>

### Phase 8: Production Infrastructure Foundation
**Goal**: Docker 기반 프로덕션 배포 환경 구축
**Plans**: 10 plans

Plans:
- [x] 08-01: Docker Compose production configuration (4 services)
- [x] 08-02: Multi-stage build optimization
- [x] 08-03: Caddy reverse proxy setup
- [x] 08-04: Environment-based configuration
- [x] 08-05: Health check endpoint
- [x] 08-06: Zero-downtime deployment strategy
- [x] 08-07: Automatic rollback on failure
- [x] 08-08: SSL/TLS certificate automation
- [x] 08-09: Production environment variables
- [x] 08-10: Container orchestration

### Phase 9: Performance & Database Optimization
**Goal**: PDF 저장소 마이그레이션 및 DB 성능 최적화
**Plans**: 5 plans

Plans:
- [x] 09-01: MinIO S3-compatible storage setup
- [x] 09-02: PDF storage abstraction layer
- [x] 09-03: PDF data migration (local → S3)
- [x] 09-04: Prisma connection pooling
- [x] 09-05: N+1 query resolution

### Phase 10: Technical Debt Resolution & Monitoring
**Goal**: 프로덕션 모니터링 및 기술 부채 해결
**Plans**: 7 plans

Plans:
- [x] 10-01: Sentry error tracking integration
- [x] 10-02: Structured logging with Pino
- [x] 10-03: Next.js Image optimization
- [x] 10-04: Bundle analyzer integration
- [x] 10-05: Parallel data fetching
- [x] 10-06: Code deduplication (fetchReportData)
- [x] 10-07: Database backup automation

</details>

<details>
<summary>✅ v2.0 Teacher Management (Phases 11-15) - SHIPPED 2026-02-02</summary>

### Phase 11: Teacher Infrastructure & Access Control
**Goal**: 선생님 관리 기반 구축과 팀 기반 RBAC (Role-Based Access Control)
**Depends on**: v1.1 Production Readiness
**Requirements**: TEACH-01, TEACH-02, TEACH-03, TEACH-05, TEACH-06
**Success Criteria** (what must be TRUE):
  1. 원장/팀장/매니저/선생님 역할로 계층적 접근 제어가 동작한다
  2. 팀장은 자신의 팀 데이터만 접근 가능하고 다른 팀 데이터는 볼 수 없다
  3. 선생님 목록에서 검색(이름, 이메일, 팀)과 필터링이 가능하다
  4. 선생님 상세 페이지에서 기본 정보와 소속 팀이 표시된다
  5. 기존 학생 데이터에 팀 외래 키 마이그레이션이 무중단으로 완료된다
**Plans**: 7 plans in 3 waves
**Status**: Complete (2026-01-30)

Plans:
- [x] 11-01-PLAN.md — Teacher database schema (Teacher 모델, Role 열거형, Team 관계)
- [x] 11-02-PLAN.md — Team-based RBAC implementation (Prisma Client Extensions, RLS)
- [x] 11-03-PLAN.md — Session extension (role, teamId JWT 포함)
- [x] 11-04-PLAN.md — Teacher CRUD operations (기본 정보 생성, 수정, 삭제)
- [x] 11-05-PLAN.md — Teacher list UI (검색, 필터, 페이지네이션)
- [x] 11-06-PLAN.md — Teacher detail page (기본 정보, 소속 팀 표시)
- [x] 11-07-PLAN.md — Database migration (학생 테이블 teamId 추가, NOT VALID 제약조건)

### Phase 12: Teacher Analysis & Team Data Access
**Goal**: 선생님 성향 분석 및 기존 분석 모듈 재사용
**Depends on**: Phase 11
**Requirements**: TEACH-04
**Success Criteria** (what must be TRUE):
  1. 선생님에 대해 MBTI, 사주, 성명학 분석이 가능하다
  2. 선생님 분석 결과가 학생 분석과 동일한 형식으로 저장된다
  3. 선생님 프로필 페이지에서 모든 분석 결과가 통합 표시된다
  4. 팀 기반 쿼리 최적화로 N+1 문제가 발생하지 않는다
**Plans**: 8 plans in 6 waves
**Status**: Complete (2026-01-30)

Plans:
- [x] 12-01-PLAN.md — Teacher analysis database schema (Teacher*Analysis 모델)
- [x] 12-02-PLAN.md — Teacher analysis DB functions (CRUD 모듈)
- [x] 12-03-PLAN.md — Teacher analysis Server Actions (분석 실행)
- [x] 12-04-PLAN.md — Teacher analysis UI components (분석 패널)
- [x] 12-05-PLAN.md — Teacher profile page integration (통합 상세 페이지)
- [x] 12-06-PLAN.md — Teacher input fields & N+1 optimization (생년월일시/한자 추가, 쿼리 최적화)
- [x] 12-07-PLAN.md — Teacher face analysis (관상 분석)
- [x] 12-08-PLAN.md — Teacher palm analysis (손금 분석)

### Phase 13: Compatibility Analysis & Matching
**Goal**: 선생님-학생 궁합 분석 및 자동 배정 제안
**Depends on**: Phase 12
**Requirements**: MATCH-01, MATCH-02, MATCH-03, MATCH-04
**Success Criteria** (what must be TRUE):
  1. 선생님-학생 궁합 점수가 가중 평균(MBTI 25%, 학습 스타일 25%, 사주 20%, 성명학 15%, 부하 분산 15%)으로 계산된다
  2. 선생님이 학생을 수동으로 배정할 수 있다
  3. AI가 궁합과 부하 분산을 고려하여 자동 배정 제안을 생성한다
  4. 학생별로 적합한 선생님 순위와 추천 이유가 표시된다
  5. 궁합 분석 결과가 편향되지 않았는지 공정성 메트릭으로 검증된다
**Plans**: 8 plans in 5 waves
**Status**: Complete (2026-01-31)

Plans:
- [x] 13-01-PLAN.md — Compatibility scoring algorithm (CompatibilityResult 모델, calculateCompatibilityScore 순수 함수, DB CRUD)
- [x] 13-02-PLAN.md — Compatibility calculation Server Action & API (calculateCompatibilityAction, POST /api/compatibility/calculate)
- [x] 13-03-PLAN.md — AI automatic assignment algorithm (탐욕 알고리즘, AssignmentProposal 모델, generateAutoAssignments)
- [x] 13-04-PLAN.md — Student-specific teacher recommendations (/students/[id]/matching 페이지, TeacherRecommendationList)
- [x] 13-05-PLAN.md — Manual student assignment & auto-assignment application (ManualAssignmentForm, BatchAssignment)
- [x] 13-06-PLAN.md — Fairness metrics implementation (Disparity Index, ABROCA, Distribution Balance, /matching/fairness)
- [x] 13-07-PLAN.md — Auto-assignment proposal page (/matching, /matching/auto-assign)
- [x] 13-08-PLAN.md — Teacher recommendation UI components (CompatibilityScoreCard, CompatibilityRadarChart)

### Phase 14: Performance Analytics & Team Insights
**Goal**: 선생님 성과 분석 및 팀 구성 분석
**Depends on**: Phase 13
**Requirements**: PERF-01, PERF-02, PERF-03
**Success Criteria** (what must be TRUE):
  1. 선생님별 담당 학생 목록과 성적 변화 추이가 표시된다
  2. 다차원 성과 분석(성적 향상률, 상담 횟수, 학생 만족도)이 가능하다
  3. 팀 구성 분석(성향 다양성, 전문성 커버리지) 결과가 시각화된다
  4. 통제 변수(학생 초기 성적, 출석률)가 고려된 공정한 평가가 제공된다
**Plans**: 8 plans
**Status**: Complete (2026-01-31)

Plans:
- [x] 14-01-PLAN.md — Performance database schema (GradeHistory, CounselingSession, StudentSatisfaction 모델)
- [x] 14-02-PLAN.md — Teacher student list view (담당 학생 목록 페이지, TeacherStudentList 컴포넌트)
- [x] 14-03-PLAN.md — Grade improvement algorithm (성적 향상률 계산, 통제 변수 적용, TDD)
- [x] 14-04-PLAN.md — Counseling & satisfaction tracking (상담 기록, 만족도 조사 폼)
- [x] 14-05-PLAN.md — Performance dashboard (성과 대시보드, Recharts 시각화)
- [x] 14-06-PLAN.md — Team composition analysis (성향 다양성, 전문성 커버리지 분석)
- [x] 14-07-PLAN.md — Analytics page data fetching (Analytics 페이지 데이터 연결)
- [x] 14-08-PLAN.md — PerformanceDashboard real data integration (성과 대시보드 실제 데이터 연동)

### Phase 15: Multi-LLM Integration & Smart Routing
**Goal**: 다중 LLM 지원 및 비용 최적화 라우팅
**Depends on**: Phase 14
**Requirements**: AI-01, AI-02
**Success Criteria** (what must be TRUE):
  1. Ollama(로컬), Gemini, ChatGPT, Claude 중에서 LLM을 선택할 수 있다
  2. 원장이 Admin 설정 페이지에서 LLM API 키와 기본 모델을 설정할 수 있다
  3. LLM 장애 시 자동으로 다른 제공자로 failover가 동작한다
  4. 비용 기반 스마트 라우팅(Ollama 우선 → Claude 폴백)으로 비용이 절감된다
  5. 토큰 사용량과 비용 추적 대시보드가 제공된다
**Plans**: 8 plans in 4 waves
**Status**: Complete (2026-02-02)

Plans:
- [x] 15-01-PLAN.md — Vercel AI SDK integration & DB schema (패키지 설치, 타입 정의, Prisma 모델)
- [x] 15-02-PLAN.md — LLM provider router (generateWithProvider, 사용량 추적)
- [x] 15-03-PLAN.md — Admin settings UI (제공자 카드, 기능별 매핑)
- [x] 15-04-PLAN.md — Automatic failover (FailoverError, 로깅, 기존 코드 마이그레이션)
- [x] 15-05-PLAN.md — Smart routing (비용 기반 정렬, 예산 설정 UI)
- [x] 15-06-PLAN.md — Token usage tracking (월별 집계, Cron 엔드포인트)
- [x] 15-07-PLAN.md — Cost dashboard (Recharts 차트, 인앱 알림)
- [x] 15-08-PLAN.md — Ollama Docker networking (연결 유틸리티, 상태 확인)

</details>

### v2.1 Parent Counseling Management (In Progress)

**Milestone Goal:** 선생님 중심의 학부모 상담 예약/기록 시스템 구축으로 체계적인 상담 관리 및 통계 제공
**Started:** 2026-02-04

#### Phase 16: Parent & Reservation Database Schema
**Goal**: 학부모 정보 및 상담 예약 데이터 모델 구축
**Depends on**: v2.0 Teacher Management
**Requirements**: PARENT-01, PARENT-02, PARENT-03, RESERVE-01, RESERVE-02
**Success Criteria** (what must be TRUE):
  1. 학생별로 복수의 학부모 정보(이름, 연락처, 관계)를 등록할 수 있다
  2. 학부모 중 한 명을 주 연락처로 지정할 수 있다
  3. 상담 예약 데이터(날짜, 시간, 학부모, 주제)가 저장된다
  4. 예약 상태(SCHEDULED/COMPLETED/CANCELLED/NO_SHOW)가 관리된다
**Plans**: 1 plan in 1 wave
**Status**: Complete (2026-02-04)

Plans:
- [x] 16-01-PLAN.md — Parent & ParentCounselingReservation Prisma 모델 정의 및 DB 마이그레이션

**Key concerns to address:**
- 기존 CounselingSession 모델과 분리하여 예약 전용 모델 생성
- RBAC 적용으로 팀 간 데이터 격리 보장

#### Phase 17: Reservation Server Actions
**Goal**: 상담 예약 비즈니스 로직 구현
**Depends on**: Phase 16
**Requirements**: RESERVE-03, RESERVE-04, RESERVE-05
**Success Criteria** (what must be TRUE):
  1. 예약 목록을 조회하고 검색(학생명, 날짜, 상태)할 수 있다
  2. 예약 정보를 수정하고 삭제할 수 있다
  3. 예약 완료 시 CounselingSession으로 자동 연결되어 상담 기록이 생성된다
  4. 예약 시간 중복이 서버에서 검증되어 더블 부킹이 방지된다
**Plans**: 4 plans in 2 waves
**Status**: Complete (2026-02-04)

Plans:
- [x] 17-01-PLAN.md — 예약 생성 Server Actions (Zod 스키마, 중복 검증, RBAC)
- [x] 17-02-PLAN.md — 예약 목록 조회 및 검색 (teacherId 필터링, 날짜/상태 필터)
- [x] 17-03-PLAN.md — 예약 수정 및 삭제 (SCHEDULED 상태 확인)
- [x] 17-04-PLAN.md — 상태 전환 및 CounselingSession 연결 (COMPLETED 시 세션 자동 생성)

#### Phase 18: Reservation Management UI
**Goal**: 예약 등록 및 목록 관리 화면 구현
**Depends on**: Phase 17
**Requirements**: CALENDAR-03, HISTORY-04
**Success Criteria** (what must be TRUE):
  1. 예약 등록 폼에서 날짜/시간을 DatePicker로 선택할 수 있다
  2. 예약 목록에서 상태별 필터링과 검색이 가능하다
  3. 예약 카드에서 상태 변경(완료/취소) 액션을 실행할 수 있다
  4. 날짜 클릭 시 해당 일의 상담 목록이 표시된다
**Plans**: 5 plans in 4 waves
**Status**: Ready for execution

Plans:
- [ ] 18-01-PLAN.md — Badge 컴포넌트에 상태 variants 추가
- [ ] 18-02-PLAN.md — ReservationCalendar 컴포넌트 생성 (react-day-picker)
- [ ] 18-03-PLAN.md — 예약 등록 폼 + TimeSlotGrid 구현
- [ ] 18-04-PLAN.md — 예약 카드 + 예약 목록 구현
- [ ] 18-05-PLAN.md — 페이지 통합 및 전체 워크플로우 연결

**Key concerns to address:**
- shadcn/ui Calendar + react-day-picker 통합
- 기존 UI 컴포넌트 패턴 재사용

#### Phase 19: Calendar View
**Goal**: 상담 예약 캘린더 시각화
**Depends on**: Phase 18
**Requirements**: CALENDAR-01, CALENDAR-02
**Success Criteria** (what must be TRUE):
  1. 월간 캘린더 뷰에서 날짜별 예약 건수가 시각화된다
  2. 주간 캘린더 뷰에서 시간대별 예약 현황이 표시된다
  3. 캘린더에서 예약된 날짜가 시각적으로 구분된다
**Plans**: TBD
**Status**: Pending

**Key concerns to address:**
- react-day-picker 한국어 로케일 설정
- date-fns v4 호환성 확인

#### Phase 20: Student Page Integration
**Goal**: 학생 상세 페이지에 상담 기능 통합
**Depends on**: Phase 19
**Requirements**: HISTORY-01, HISTORY-02, HISTORY-03
**Success Criteria** (what must be TRUE):
  1. 학생 상세 페이지에 상담 탭이 추가되어 전체 상담 이력이 표시된다
  2. 학생별 상담 이력이 시간순으로 정렬되어 조회된다
  3. 다음 예약된 상담이 학생 페이지 상단에 표시된다
**Plans**: TBD
**Status**: Pending

**Key concerns to address:**
- 기존 학생 상세 페이지 UI 유지하며 탭 추가
- 회귀 테스트로 기존 기능 보호

#### Phase 21: Statistics & Dashboard
**Goal**: 상담 통계 및 후속 조치 대시보드
**Depends on**: Phase 20
**Requirements**: STATS-01, STATS-02, STATS-03, STATS-04, FOLLOWUP-01, FOLLOWUP-02, FOLLOWUP-03
**Success Criteria** (what must be TRUE):
  1. 선생님별 월간 상담 횟수가 표시된다
  2. 학생별 누적 상담 횟수가 표시된다
  3. 상담 유형별 분포가 차트로 시각화된다
  4. 월별 상담 추이가 라인 차트로 표시된다
  5. 오늘/이번 주 후속 조치 목록이 대시보드에 표시된다
  6. 지연된 후속 조치가 하이라이트로 강조된다
  7. 후속 조치 완료 체크가 가능하다
**Plans**: TBD
**Status**: Pending

**Key concerns to address:**
- 기존 Recharts 패턴 재사용
- 후속 조치 알림 로직 구현

#### Phase 22: AI Integration
**Goal**: AI 기반 상담 지원 기능
**Depends on**: Phase 21
**Requirements**: AI-01, AI-02, AI-03
**Success Criteria** (what must be TRUE):
  1. 상담 시 학생의 기존 성향 분석 정보가 자동으로 표시된다
  2. 선생님-학생 궁합 점수가 상담 화면에서 참조 가능하다
  3. AI가 상담 내용 요약문 초안을 생성할 수 있다
**Plans**: TBD
**Status**: Pending

**Key concerns to address:**
- 기존 LLM 라우터(Phase 15) 활용
- 요약 생성 프롬프트 설계

## Progress

**Execution Order:**
Phases execute in numeric order: 16 → 17 → 18 → 19 → 20 → 21 → 22

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation & Authentication | v1.0 | 7/7 | Complete | 2026-01-28 |
| 2. File Infrastructure | v1.0 | 4/4 | Complete | 2026-01-28 |
| 3. Calculation Analysis | v1.0 | 4/4 | Complete | 2026-01-28 |
| 4. MBTI Analysis | v1.0 | 4/4 | Complete | 2026-01-29 |
| 5. AI Image Analysis | v1.0 | 5/5 | Complete | 2026-01-29 |
| 6. AI Integration | v1.0 | 5/5 | Complete | 2026-01-29 |
| 7. Reports | v1.0 | 7/7 | Complete | 2026-01-29 |
| 8. Production Infrastructure Foundation | v1.1 | 10/10 | Complete | 2026-01-30 |
| 9. Performance & Database Optimization | v1.1 | 5/5 | Complete | 2026-01-30 |
| 10. Technical Debt Resolution & Monitoring | v1.1 | 7/7 | Complete | 2026-01-30 |
| 11. Teacher Infrastructure & Access Control | v2.0 | 7/7 | Complete | 2026-01-30 |
| 12. Teacher Analysis & Team Data Access | v2.0 | 8/8 | Complete | 2026-01-30 |
| 13. Compatibility Analysis & Matching | v2.0 | 8/8 | Complete | 2026-01-31 |
| 14. Performance Analytics & Team Insights | v2.0 | 8/8 | Complete | 2026-01-31 |
| 15. Multi-LLM Integration & Smart Routing | v2.0 | 8/8 | Complete | 2026-02-02 |
| 16. Parent & Reservation Database Schema | v2.1 | 1/1 | Complete | 2026-02-04 |
| 17. Reservation Server Actions | v2.1 | 4/4 | Complete | 2026-02-04 |
| 18. Reservation Management UI | v2.1 | 0/5 | Ready | — |
| 19. Calendar View | v2.1 | 0/? | Pending | — |
| 20. Student Page Integration | v2.1 | 0/? | Pending | — |
| 21. Statistics & Dashboard | v2.1 | 0/? | Pending | — |
| 22. AI Integration | v2.1 | 0/? | Pending | — |

**Overall Progress:** 103/115+ plans complete (v1.0-v2.0: 100%, v2.1: 3/7 phases, 5 plans ready)

---
*Last updated: 2026-02-04 (Phase 18 planned)*
