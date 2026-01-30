# Roadmap: AI AfterSchool

## Overview

AI AfterSchool는 학생 정보 통합 관리를 기반으로 AI 성향 분석 및 맞춤형 학습/진로 제안을 제공하는 학원 관리 시스템입니다. v1.0에서 학생 중심의 기본 기능을 구축했고, v1.1에서 프로덕션 준비(배포 자동화, 모니터링, 성능 최적화)를 완료했습니다. v2.0에서는 다중 선생님 지원, 팀 기반 접근 제어, 선생님-학생 궁합 분석, AI 기반 최적 배정 시스템을 추가하여 단일 선생님이 아닌 학원 조직 전체를 관리할 수 있는 시스템으로 확장합니다.

## Milestones

- ✅ **v1.0 MVP** - Phases 1-7 (shipped 2026-01-29)
- ✅ **v1.1 Production Readiness** - Phases 8-10 (shipped 2026-01-30)
- 🚧 **v2.0 Teacher Management** - Phases 11-15 (in development)

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

### 🚧 v2.0 Teacher Management (In Development)

**Milestone Goal:** 다중 선생님 지원, 팀 기반 접근 제어, 선생님-학생 궁합 분석, AI 기반 최적 배정 시스템, 다중 LLM 지원

#### Phase 11: Teacher Infrastructure & Access Control
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

**Key concerns addressed:**
- Data leakage between teams (Prisma Client Extensions + PostgreSQL RLS)
- Migration FK failures (NOT VALID constraints)
- Middleware-only authentication bypass (defense in depth)

Plans:
- [ ] 11-01-PLAN.md — Teacher database schema (Teacher 모델, Role 열거형, Team 관계)
- [ ] 11-02-PLAN.md — Team-based RBAC implementation (Prisma Client Extensions, RLS)
- [ ] 11-03-PLAN.md — Session extension (role, teamId JWT 포함)
- [ ] 11-04-PLAN.md — Teacher CRUD operations (기본 정보 생성, 수정, 삭제)
- [ ] 11-05-PLAN.md — Teacher list UI (검색, 필터, 페이지네이션)
- [ ] 11-06-PLAN.md — Teacher detail page (기본 정보, 소속 팀 표시)
- [ ] 11-07-PLAN.md — Database migration (학생 테이블 teamId 추가, NOT VALID 제약조건)

#### Phase 12: Teacher Analysis & Team Data Access
**Goal**: 선생님 성향 분석 및 기존 분석 모듈 재사용
**Depends on**: Phase 11
**Requirements**: TEACH-04
**Success Criteria** (what must be TRUE):
  1. 선생님에 대해 MBTI, 사주, 성명학, 관상, 손금 분석이 가능하다
  2. 선생님 분석 결과가 학생 분석과 동일한 형식으로 저장된다
  3. 선생님 프로필 페이지에서 모든 분석 결과가 통합 표시된다
  4. 팀 기반 쿼리 최적화로 N+1 문제가 발생하지 않는다
**Plans**: TBD

**Reuses existing modules:**
- MBTI scoring (mbti-scoring)
- Saju calculation (saju)
- Name numerology (name-numerology)
- Face/Palm reading (Claude Vision)

Plans:
- [ ] 12-01: Teacher MBTI analysis (기존 설문 시스템 재사용)
- [ ] 12-02: Teacher saju analysis (기존 사주 계산 모듈 재사용)
- [ ] 12-03: Teacher name analysis (기존 성명학 모듈 재사용)
- [ ] 12-04: Teacher face/palm analysis (Claude Vision API 재사용)
- [ ] 12-05: Teacher integrated analysis UI (통합 프로필 페이지)
- [ ] 12-06: Team-based query optimization (Prisma include, N+1 방지)

#### Phase 13: Compatibility Analysis & Matching
**Goal**: 선생님-학생 궁합 분석 및 자동 배정 제안
**Depends on**: Phase 12
**Requirements**: MATCH-01, MATCH-02, MATCH-03, MATCH-04
**Success Criteria** (what must be TRUE):
  1. 선생님-학생 궁합 점수가 가중 평균(MBTI 25%, 학습 스타일 25%, 사주 20%, 성명학 15%, 부하 분산 15%)으로 계산된다
  2. 선생님이 학생을 수동으로 배정할 수 있다
  3. AI가 궁합과 부하 분산을 고려하여 자동 배정 제안을 생성한다
  4. 학생별로 적합한 선생님 순위와 추천 이유가 표시된다
  5. 궁합 분석 결과가 편향되지 않았는지 공정성 메트릭으로 검증된다
**Plans**: TBD

**Key concerns addressed:**
- Algorithmic bias (fairness metrics, human-in-the-loop)
- Lack of explainability (transparent weights, reasoning)

Plans:
- [ ] 13-01: Compatibility scoring algorithm (가중 평균 계산)
- [ ] 13-02: Manual student assignment (선생님-학생 배정 UI)
- [ ] 13-03: AI automatic assignment suggestions (최적화 알고리즘)
- [ ] 13-04: Student-specific teacher recommendations (개인화된 순위)
- [ ] 13-05: Compatibility report UI (궁합 분석 시각화 - Recharts)
- [ ] 13-06: Fairness metrics implementation (ABROCA, Disparity Index)

#### Phase 14: Performance Analytics & Team Insights
**Goal**: 선생님 성과 분석 및 팀 구성 분석
**Depends on**: Phase 13
**Requirements**: PERF-01, PERF-02, PERF-03
**Success Criteria** (what must be TRUE):
  1. 선생님별 담당 학생 목록과 성적 변화 추이가 표시된다
  2. 다차원 성과 분석(성적 향상률, 상담 횟수, 학생 만족도)이 가능하다
  3. 팀 구성 분석(성향 다양성, 전문성 커버리지) 결과가 시각화된다
  4. 통제 변수(학생 초기 성적, 출석률)가 고려된 공정한 평가가 제공된다
**Plans**: TBD

**Key concerns addressed:**
- Single-metric bias (multi-dimensional evaluation)
- Unfair teacher comparison (control variables)

Plans:
- [ ] 14-01: Teacher student list view (담당 학생 목록)
- [ ] 14-02: Grade improvement tracking (성적 향상률 계산)
- [ ] 14-03: Counseling history tracking (상담 횟수, 이력)
- [ ] 14-04: Student satisfaction metrics (학생 만족도 조사)
- [ ] 14-05: Multi-dimensional performance dashboard (Recharts 시각화)
- [ ] 14-06: Team composition analysis (성향 다양성, 전문성 커버리지)
- [ ] 14-07: Control variable normalization (공정한 비교를 위한 정규화)

#### Phase 15: Multi-LLM Integration & Smart Routing
**Goal**: 다중 LLM 지원 및 비용 최적화 라우팅
**Depends on**: Phase 14
**Requirements**: AI-01, AI-02
**Success Criteria** (what must be TRUE):
  1. Ollama(로컬), Gemini, ChatGPT, Claude 중에서 LLM을 선택할 수 있다
  2. 원장이 Admin 설정 페이지에서 LLM API 키와 기본 모델을 설정할 수 있다
  3. LLM 장애 시 자동으로 다른 제공자로 failover가 동작한다
  4. 비용 기반 스마트 라우팅(Ollama 우선 → Claude 폴백)으로 비용이 절감된다
  5. 토큰 사용량과 비용 추적 대시보드가 제공된다
**Plans**: TBD

**Key concerns addressed:**
- Cost explosion (token tracking, cost alerts, smart routing)
- Vendor lock-in (unified interface)
- Rate limiting (queue system)

Plans:
- [ ] 15-01: Vercel AI SDK integration (통일된 LLM 인터페이스)
- [ ] 15-02: LLM provider router (Claude, Gemini, OpenAI, Ollama)
- [ ] 15-03: Admin settings UI (LLM 선택, API 키 관리)
- [ ] 15-04: Automatic failover implementation (장애 시 폴백)
- [ ] 15-05: Smart routing (비용 기반 우선순위)
- [ ] 15-06: Token usage tracking (사용량 모니터링)
- [ ] 15-07: Cost alert dashboard (비용 추적 및 알림)
- [ ] 15-08: Ollama Docker networking (192.168.0.5:11434 연결)

## Progress

**Execution Order:**
Phases execute in numeric order: 11 → 12 → 13 → 14 → 15

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
| 11. Teacher Infrastructure & Access Control | v2.0 | 0/7 | Not started | - |
| 12. Teacher Analysis & Team Data Access | v2.0 | 0/6 | Not started | - |
| 13. Compatibility Analysis & Matching | v2.0 | 0/6 | Not started | - |
| 14. Performance Analytics & Team Insights | v2.0 | 0/7 | Not started | - |
| 15. Multi-LLM Integration & Smart Routing | v2.0 | 0/8 | Not started | - |

**Overall Progress:** 58/92 plans complete (63.04%)

---
*Last updated: 2026-01-30*
