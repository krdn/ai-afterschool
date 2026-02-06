# Roadmap: AI AfterSchool

## Overview

AI AfterSchool는 학생 정보 통합 관리를 기반으로 AI 성향 분석 및 맞춤형 학습/진로 제안을 제공하는 학원 관리 시스템입니다. v1.0에서 학생 중심의 기본 기능을 구축했고, v1.1에서 프로덕션 준비(배포 자동화, 모니터링, 성능 최적화)를 완료했습니다. v2.0에서는 다중 선생님 지원, 팀 기반 접근 제어, 선생님-학생 궁합 분석, AI 기반 최적 배정 시스템을 추가하여 단일 선생님이 아닌 학원 조직 전체를 관리할 수 있는 시스템으로 확장합니다. v2.1에서는 학부모 상담 예약/기록 시스템을 추가하여 체계적인 상담 관리 및 통계를 제공합니다.

## Milestones

- ✅ **v1.0 MVP** - Phases 1-7 (shipped 2026-01-29)
- ✅ **v1.1 Production Readiness** - Phases 8-10 (shipped 2026-01-30)
- ✅ **v2.0 Teacher Management** - Phases 11-15 (shipped 2026-02-02)
- ✅ **v2.1 Parent Counseling Management** - Phases 16-22 (shipped 2026-02-05)
- 🔧 **v2.1.1 E2E Test Compliance** - Phases 23-28 (in progress)
- 📋 **v2.2 Attendance & Tuition** - Phases 29+ (planned)

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
  5. 학생 상세 페이지에서 성적 추이 차트와 성적 관리 UI가 제공된다
**Plans**: 9 plans
**Status**: Complete (2026-02-06)

Plans:
- [x] 14-01-PLAN.md — Performance database schema (GradeHistory, CounselingSession, StudentSatisfaction 모델)
- [x] 14-02-PLAN.md — Teacher student list view (담당 학생 목록 페이지, TeacherStudentList 컴포넌트)
- [x] 14-03-PLAN.md — Grade improvement algorithm (성적 향상률 계산, 통제 변수 적용, TDD)
- [x] 14-04-PLAN.md — Counseling & satisfaction tracking (상담 기록, 만족도 조사 폼)
- [x] 14-05-PLAN.md — Performance dashboard (성과 대시보드, Recharts 시각화)
- [x] 14-06-PLAN.md — Team composition analysis (성향 다양성, 전문성 커버리지 분석)
- [x] 14-07-PLAN.md — Analytics page data fetching (Analytics 페이지 데이터 연결)
- [x] 14-08-PLAN.md — PerformanceDashboard real data integration (성과 대시보드 실제 데이터 연동)
- [x] 14-09-PLAN.md — Student learning tab UI (학생 성적 관리 탭, 추이 차트, CRUD)

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

<details>
<summary>✅ v2.1 Parent Counseling Management (Phases 16-22) - SHIPPED 2026-02-05</summary>

**Milestone Goal:** 선생님 중심의 학부모 상담 예약/기록 시스템 구축으로 체계적인 상담 관리 및 통계 제공

- [x] Phase 16: Parent & Reservation Database Schema (1/1 plans) — completed 2026-02-04
- [x] Phase 17: Reservation Server Actions (4/4 plans) — completed 2026-02-04
- [x] Phase 18: Reservation Management UI (5/5 plans) — completed 2026-02-04
- [x] Phase 19: Calendar View (3/3 plans) — completed 2026-02-04
- [x] Phase 20: Student Page Integration (3/3 plans) — completed 2026-02-04
- [x] Phase 21: Statistics & Dashboard (7/7 plans) — completed 2026-02-04
- [x] Phase 22: AI Integration (7/7 plans) — completed 2026-02-05

**See full details:** `.planning/milestones/v2.1-ROADMAP.md`

</details>

<details>
<summary>🔧 v2.1.1 E2E Test Compliance (Phases 23-28) - IN PROGRESS</summary>

**Milestone Goal:** E2E 테스트 74건 실패를 0건으로 해소 — 기존 구현된 기능의 테스트 호환성 확보

### Phase 23: data-testid Infrastructure
**Goal**: 모든 기존 컴포넌트에 data-testid 속성 추가 (E2E 테스트 안정성)
**Depends on**: Phase 22
**Requirements**: STU-01, ADM-01, ADM-02, ANL-01, CNS-01, CNS-02, MAT-01, MAT-02, PRF-01
**Plans**: 2 plans in 1 wave
**Status**: Complete (2026-02-06)

Plans:
- [x] 23-01-PLAN.md — 학생/분석/Admin 페이지 data-testid 추가 (STU-01, ANL-01, ADM-01, ADM-02)
- [x] 23-02-PLAN.md — 상담/매칭/성과 페이지 data-testid 추가 (CNS-01, CNS-02, MAT-01, MAT-02, PRF-01)

**Success Criteria** (what must be TRUE):
  1. 학생 관련 주요 컴포넌트(card, 폼 필드, 탭)에 data-testid가 추가되어 E2E 테스트에서 안정적으로 셀렉트 가능하다
  2. Admin LLM 설정 페이지의 주요 요소(current-provider, provider-select)에 data-testid가 추가되어 테스트 가능하다
  3. Admin 토큰 사용량 페이지의 차트와 메트릭에 data-testid가 추가되어 검증 가능하다
  4. 학생 분석 탭(saju-tab, mbti-tab, analysis-loading)에 data-testid가 추가되어 상태 확인 가능하다
  5. 상담 캘린더 뷰와 상세 모달에 data-testid가 추가되어 이벤트 검증 가능하다
  6. 상담 통계 대시보드의 차트와 필터에 data-testid가 추가되어 데이터 확인 가능하다
  7. 궁합 점수 표시 UI(compatibility-score)와 공정성 지표 페이지에 data-testid가 추가되어 계산 결과 검증 가능하다
  8. 성과 대시보드 metric 카드에 data-testid가 추가되어 성과 지표 확인 가능하다

### Phase 24: Missing Routes Creation
**Goal**: 누락된 라우트 페이지 생성 (새 page.tsx 파일)
**Depends on**: Phase 23
**Requirements**: TCH-01, ADM-03, ADM-04, ADM-05, ADM-06, PRF-03, RPT-01
**Success Criteria** (what must be TRUE):
  1. `/teachers/me` 본인 프로필 조회 페이지가 생성되어 세션 기반 자동 리다이렉트로 현재 로그인한 선생님 정보를 표시한다
  2. `/admin` 통합 관리 페이지가 생성되어 6개 탭(LLM 설정, 토큰 사용량, 시스템 상태, 시스템 로그, 데이터베이스, 감사 로그)이 표시된다
  3. Admin 페이지 시스템 상태 탭에서 DB, 캐시, 스토리지 상태를 실시간으로 확인할 수 있다
  4. Admin 페이지 시스템 로그 탭에서 시스템 로그를 시간순으로 조회 가능하다
  5. Admin 페이지 데이터베이스 탭에서 백업 관리 UI를 제공한다
  6. Admin 페이지 감사 로그 탭에서 설정 변경 이력을 추적 가능하다
  7. `/teams` 목록 페이지와 `/teams/[id]` 상세 페이지가 생성되어 팀 정보를 표시한다
  8. `/students/[id]/report` 리포트 탭이 생성되어 리포트 프리뷰 및 PDF 다운로드를 제공한다
**Plans**: 4 plans in 2 waves
**Status**: Complete (2026-02-07)

Plans:
- [x] 24-01-PLAN.md — Prisma 스키마에 로그 모델 추가 및 /teachers/me 리다이렉트 페이지 생성
- [x] 24-02-PLAN.md — 팀 목록 페이지와 팀 상세 페이지 생성
- [x] 24-03-PLAN.md — 통합 Admin 페이지 생성 (6개 탭: LLM 설정, 토큰 사용량, 시스템 상태, 시스템 로그, 데이터베이스, 감사 로그)
- [x] 24-04-PLAN.md — 학생 상세 페이지에 리포트 탭 추가 및 ReportTab 컴포넌트 생성

### Phase 25: Student, Analysis & Report UI Enhancement
**Goal**: 학생/분석/리포트 UI 보강 (셀렉터 정합성, 탭 분리, 이미지 최적화)
**Depends on**: Phase 24
**Requirements**: STU-02, STU-03, STU-04, ANL-02, ANL-03, ANL-04, RPT-02, UTL-01, UTL-02
**Success Criteria** (what must be TRUE):
  1. 학생 등록 시 이미지 프리뷰의 img alt 속성이 일관되게 적용되어 접근성이 확보된다
  2. 학생 목록 검색 결과가 테스트에서 텍스트 매칭으로 검증 가능하다
  3. 학생 삭제 후 `/students` 목록으로 정확히 리다이렉트된다
  4. 분석 탭 내에서 사주/관상/MBTI가 별도 서브탭으로 분리 표시되어 각각 개별 접근 가능하다
  5. AI 분석 API 호출 실패 시 에러 메시지 및 재시도 버튼이 표시된다
  6. 분석 이력 조회 UI가 제공되어 이전 분석 결과 목록과 상세 보기 모달이 동작한다
  7. PDF 다운로드 버튼이 이벤트 처리와 연동되어 다운로드가 실행된다
  8. 학생 목록 이미지에 lazy loading 속성이 추가되어 성능이 개선된다
  9. Next/Image 컴포넌트의 srcset/width/height 속성이 정합성 있게 설정된다
**Plans**: 4 plans in 2 waves
**Status**: Complete (2026-02-07)

Plans:
- [x] 25-01-PLAN.md — Student Page UI Enhancement (alt 속성, lazy loading, 검색 data-testid, 삭제 리다이렉트)
- [x] 25-02-PLAN.md — Analysis Tab 서브탭 분리 및 에러 처리 개선 (4개 서브탭, 통일 에러 메시지)
- [x] 25-03-PLAN.md — 분석 이력 조회 UI (이력 Dialog, 상세 보기 모달)
- [x] 25-04-PLAN.md — PDF 다운로드 확인 (다운로드 플로우 검증, toast ID 추가)

### Phase 26: Counseling & Matching UI Enhancement
**Goal**: 상담/매칭/성과 UI 보강 (검색, 필터, 이력 추적)
**Depends on**: Phase 25
**Requirements**: CNS-03, CNS-04, MAT-03, MAT-04, PRF-02
**Success Criteria** (what must be TRUE):
  1. 상담 기록 검색/필터 UI가 제공되어 검색 입력과 필터 드롭다운이 동작한다
  2. 상담 알림/리마인더 위젯이 다가오는 상담을 표시한다
  3. 매칭 이력/감사 로그 UI가 제공되어 변경 이력 테이블이 표시된다
  4. 자동 배정 결과 카운트가 표시되어 배정된 학생 수를 확인 가능하다
  5. 향상률 차트 및 기간 선택 UI가 제공되어 성과 추이를 시각화한다
**Plans**: 4 plans in 1 wave
**Status**: Ready for execution

Plans:
- [ ] 26-01-PLAN.md — 상담 기록 통합 검색/필터 UI (CounselingSearchBar, CounselingFilters, searchCounselingSessions)
- [ ] 26-02-PLAN.md — 상담 알림/리마인더 위젯 (UpcomingCounselingWidget, getUpcomingCounseling)
- [ ] 26-03-PLAN.md — 매칭 이력/감사 로그 UI (MatchingHistoryTab, MatchingAuditTable, getMatchingHistory)
- [ ] 26-04-PLAN.md — 배정 결과 카드 및 성과 차트 기간 선택 (AssignmentResultCard, PerformanceTrendChart, DateRangeFilter 확장)

### Phase 27: RBAC, Auth & Error Handling
**Goal**: RBAC 접근 제한 강화 및 엣지 케이스 처리
**Depends on**: Phase 26
**Requirements**: TCH-02, TCH-03, TCH-04, ADM-07, AUTH-01
**Success Criteria** (what must be TRUE):
  1. 일반 선생님이 `/teachers` 관리 페이지 접근 시 적절한 리다이렉트 또는 차단이 동작한다
  2. 존재하지 않는 선생님 ID 접근 시 404 에러 페이지가 표시된다
  3. 프로필 사진 업로드 시 용량 초과 에러 메시지 UI가 표시된다
  4. 팀장 역할의 제한된 관리 기능 접근 제어가 강화되어 타 팀 데이터 접근이 차단된다
  5. 만료/유효하지 않은 비밀번호 재설정 토큰 접근 시 에러 페이지 UI가 표시된다

### Phase 28: Integration Verification & Test Alignment
**Goal**: 통합 검증 및 테스트 수정 (전체 E2E 실행, 남은 셀렉터 수정)
**Depends on**: Phase 27
**Requirements**: 모든 v2.1.1 요구사항 (STU-01~04, TCH-01~04, ADM-01~07, ANL-01~04, CNS-01~04, MAT-01~04, PRF-01~03, RPT-01~02, UTL-01~02, AUTH-01)
**Success Criteria** (what must be TRUE):
  1. 전체 E2E 테스트 스위트가 실행되어 74건 실패가 0건으로 해소된다
  2. 모든 data-testid 셀렉터가 테스트와 정합성 있게 매칭된다
  3. 누락된 라우트 페이지가 모두 생성되어 404 에러가 발생하지 않는다
  4. UI 정합성 이슈(alt 속성, 이미지 최적화, 리다이렉트)가 모두 해결된다
  5. RBAC 및 에러 처리가 강화되어 엣지 케이스에서도 안정적으로 동작한다
  6. 통합 테스트 실행 후 모든 요구사항이 충족되어 v2.1.1 마일스톤 완료가 확인된다

</details>

### v2.2 Attendance & Tuition (Planned)

📋 *To be defined with `/gsd:new-milestone`*

## Progress

**Execution Order:**
Phases execute in numeric order: 23 → 24 → 25 → 26 → 27 → 28

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
| 14. Performance Analytics & Team Insights | v2.0 | 9/9 | Complete | 2026-02-06 |
| 15. Multi-LLM Integration & Smart Routing | v2.0 | 8/8 | Complete | 2026-02-02 |
| 16. Parent & Reservation Database Schema | v2.1 | 1/1 | Complete | 2026-02-04 |
| 17. Reservation Server Actions | v2.1 | 4/4 | Complete | 2026-02-04 |
| 18. Reservation Management UI | v2.1 | 5/5 | Complete | 2026-02-04 |
| 19. Calendar View | v2.1 | 3/3 | Complete | 2026-02-04 |
| 20. Student Page Integration | v2.1 | 3/3 | Complete | 2026-02-04 |
| 21. Statistics & Dashboard | v2.1 | 7/7 | Complete | 2026-02-04 |
| 22. AI Integration | v2.1 | 7/7 | Complete | 2026-02-05 |
| 23. data-testid Infrastructure | v2.1.1 | 2/2 | Complete | 2026-02-06 |
| 24. Missing Routes Creation | v2.1.1 | 4/4 | Complete | 2026-02-07 |
| 25. Student, Analysis & Report UI Enhancement | v2.1.1 | 4/4 | Complete | 2026-02-07 |
| 26. Counseling & Matching UI Enhancement | v2.1.1 | 4/4 | Ready | — |
| 27. RBAC, Auth & Error Handling | v2.1.1 | 0/? | Pending | — |
| 28. Integration Verification & Test Alignment | v2.1.1 | 0/? | Pending | — |

**Overall Progress:** 141/145 plans complete (v1.0-v2.1: 100%) | v2.1.1: 4/6 complete (67%)

---
*Last updated: 2026-02-07 (Phase 26 planned: 4 plans in 1 wave)*
