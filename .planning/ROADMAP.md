# Roadmap: AI AfterSchool

## Milestones

- ✅ **v1.0 MVP** - Phases 1-7 (shipped 2026-01-30)
- ✅ **v1.1 Production Readiness** - Phases 8-10 (shipped 2026-01-30)
- ✅ **v2.0 Teacher Management** - Phases 11-15 (shipped 2026-02-02)
- ✅ **v2.1 Parent Counseling Management** - Phases 16-22 (shipped 2026-02-05)
- ✅ **v2.1.1 E2E Test Compliance** - Phases 23-28 (shipped 2026-02-07)
- 🚧 **v3.0 Issue Management & Auto DevOps Pipeline** - Phases 29-34 (in progress)
- ✅ **v4.0 Universal LLM Hub** - Phase 35 (shipped 2026-02-12)
- 🚧 **v4.0 AI Smart Chat** - Phases 36-40 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-7) - SHIPPED 2026-01-30</summary>

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
**Plans**: 7 plans

Plans:
- [x] 11-01: Teacher database schema (Teacher 모델, Role 열거형, Team 관계)
- [x] 11-02: Team-based RBAC implementation (Prisma Client Extensions, RLS)
- [x] 11-03: Session extension (role, teamId JWT 포함)
- [x] 11-04: Teacher CRUD operations (기본 정보 생성, 수정, 삭제)
- [x] 11-05: Teacher list UI (검색, 필터, 페이지네이션)
- [x] 11-06: Teacher detail page (기본 정보, 소속 팀 표시)
- [x] 11-07: Database migration (학생 테이블 teamId 추가, NOT VALID 제약조건)

### Phase 12: Teacher Analysis & Team Data Access
**Goal**: 선생님 성향 분석 및 기존 분석 모듈 재사용
**Plans**: 8 plans

Plans:
- [x] 12-01: Teacher analysis database schema (Teacher*Analysis 모델)
- [x] 12-02: Teacher analysis DB functions (CRUD 모듈)
- [x] 12-03: Teacher analysis Server Actions (분석 실행)
- [x] 12-04: Teacher analysis UI components (분석 패널)
- [x] 12-05: Teacher profile page integration (통합 상세 페이지)
- [x] 12-06: Teacher input fields & N+1 optimization (생년월일시/한자 추가, 쿼리 최적화)
- [x] 12-07: Teacher face analysis (관상 분석)
- [x] 12-08: Teacher palm analysis (손금 분석)

### Phase 13: Compatibility Analysis & Matching
**Goal**: 선생님-학생 궁합 분석 및 자동 배정 제안
**Plans**: 8 plans

Plans:
- [x] 13-01: Compatibility scoring algorithm (CompatibilityResult 모델, calculateCompatibilityScore 순수 함수, DB CRUD)
- [x] 13-02: Compatibility calculation Server Action & API (calculateCompatibilityAction, POST /api/compatibility/calculate)
- [x] 13-03: AI automatic assignment algorithm (탐욕 알고리즘, AssignmentProposal 모델, generateAutoAssignments)
- [x] 13-04: Student-specific teacher recommendations (/students/[id]/matching 페이지, TeacherRecommendationList)
- [x] 13-05: Manual student assignment & auto-assignment application (ManualAssignmentForm, BatchAssignment)
- [x] 13-06: Fairness metrics implementation (Disparity Index, ABROCA, Distribution Balance, /matching/fairness)
- [x] 13-07: Auto-assignment proposal page (/matching, /matching/auto-assign)
- [x] 13-08: Teacher recommendation UI components (CompatibilityScoreCard, CompatibilityRadarChart)

### Phase 14: Performance Analytics & Team Insights
**Goal**: 선생님 성과 분석 및 팀 구성 분석
**Plans**: 9 plans

Plans:
- [x] 14-01: Performance database schema (GradeHistory, CounselingSession, StudentSatisfaction 모델)
- [x] 14-02: Teacher student list view (담당 학생 목록 페이지, TeacherStudentList 컴포넌트)
- [x] 14-03: Grade improvement algorithm (성적 향상률 계산, 통제 변수 적용, TDD)
- [x] 14-04: Counseling & satisfaction tracking (상담 기록, 만족도 조사 폼)
- [x] 14-05: Performance dashboard (성과 대시보드, Recharts 시각화)
- [x] 14-06: Team composition analysis (성향 다양성, 전문성 커버리지 분석)
- [x] 14-07: Analytics page data fetching (Analytics 페이지 데이터 연결)
- [x] 14-08: PerformanceDashboard real data integration (성과 대시보드 실제 데이터 연동)
- [x] 14-09: Student learning tab UI (학생 성적 관리 탭, 추이 차트, CRUD)

### Phase 15: Multi-LLM Integration & Smart Routing
**Goal**: 다중 LLM 지원 및 비용 최적화 라우팅
**Plans**: 8 plans

Plans:
- [x] 15-01: Vercel AI SDK integration & DB schema (패키지 설치, 타입 정의, Prisma 모델)
- [x] 15-02: LLM provider router (generateWithProvider, 사용량 추적)
- [x] 15-03: Admin settings UI (제공자 카드, 기능별 매핑)
- [x] 15-04: Automatic failover (FailoverError, 로깅, 기존 코드 마이그레이션)
- [x] 15-05: Smart routing (비용 기반 정렬, 예산 설정 UI)
- [x] 15-06: Token usage tracking (월별 집계, Cron 엔드포인트)
- [x] 15-07: Cost dashboard (Recharts 차트, 인앱 알림)
- [x] 15-08: Ollama Docker networking (연결 유틸리티, 상태 확인)

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
<summary>✅ v2.1.1 E2E Test Compliance (Phases 23-28) - SHIPPED 2026-02-07</summary>

**Milestone Goal:** E2E 테스트 인프라 구축과 테스트 호환성 확보로 안정적인 테스트 기반 마련 (34/34 requirements)

**Phases:**
- [x] Phase 23: data-testid Infrastructure (2/2 plans) — completed 2026-02-06
- [x] Phase 24: Missing Routes Creation (4/4 plans) — completed 2026-02-07
- [x] Phase 25: Student, Analysis & Report UI Enhancement (4/4 plans) — completed 2026-02-07
- [x] Phase 26: Counseling & Matching UI Enhancement (4/4 plans) — completed 2026-02-07
- [x] Phase 27: RBAC, Auth & Error Handling (4/4 plans) — completed 2026-02-07
- [x] Phase 28: Integration Verification & Test Alignment (8/8 plans) — complete, 40-53% pass rate (implemented)

**See full details:** `.planning/milestones/v2.1.1-ROADMAP.md`

</details>

### 🚧 v3.0 Issue Management & Auto DevOps Pipeline (In Progress)

**Milestone Goal:** 앱 내에서 이슈를 등록하고, GitHub Issue 생성 → 브랜치 생성 → 수정 작업 → 테스트 → 배포까지의 전체 DevOps 파이프라인을 자동화

#### Phase 29: Database & GitHub API Foundation
**Goal**: 이슈 저장 기반 및 GitHub API 통합
**Depends on**: Phase 28
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05, GH-01, GH-02, GH-03
**Success Criteria** (what must be TRUE):
  1. DIRECTOR 역할 사용자가 앱에서 이슈를 생성하면 로컬 DB에 저장되고 GitHub Issue가 자동 생성된다
  2. GitHub Issue에 카테고리 기반 라벨이 자동 태깅된다 (bug, feature, improvement, ui-ux, etc.)
  3. 이슈 유형에 따라 브랜치가 자동 생성된다 (fix/issue-N-slug, feat/issue-N-slug)
  4. GitHub API rate limit이 임계값 이하로 떨어지면 경고가 표시된다
  5. 모든 이슈 생성 작업이 AuditLog에 기록된다
**Plans**: 3 plans

Plans:
- [x] 29-01-PLAN.md -- Prisma 스키마 (Issue, IssueEvent 모델 + enum + 마이그레이션)
- [x] 29-02-PLAN.md -- GitHub 클라이언트 기반 (Octokit + 유틸리티 + 상수)
- [x] 29-03-PLAN.md -- GitHub 서비스 + Issue Server Actions (CRUD, 라벨, 브랜치)

#### Phase 30: Issue UI & Screenshot
**Goal**: 이슈 보고 UI 및 스크린샷 캡처
**Depends on**: Phase 29
**Requirements**: ISSUE-01, ISSUE-02, ISSUE-03, ISSUE-04, ISSUE-05
**Success Criteria** (what must be TRUE):
  1. DIRECTOR 역할 사용자가 헤더 버튼을 클릭하여 이슈 보고 모달을 열 수 있다
  2. 사용자가 제목, 설명, 카테고리를 입력하여 이슈를 등록할 수 있다
  3. 사용자가 현재 화면의 스크린샷을 캡처하여 이슈에 첨부할 수 있다
  4. 스크린샷이 MinIO에 업로드되고 GitHub Issue 본문에 이미지 URL로 삽입된다
  5. 사용자 컨텍스트(역할, 페이지 URL)가 자동으로 이슈 본문에 포함된다
**Plans**: 4 plans

Plans:
- [ ] 30-01: 스크린샷 및 이미지 업로드 인프라 (modern-screenshot + MinIO)
- [ ] 30-02: 스크린샷 캡처 및 미리보기 UI 컴포넌트
- [ ] 30-03: 이슈 입력 폼과 모달 컴포넌트
- [ ] 30-04: 헤더 버튼 통합 및 최종 연결

#### Phase 31: Sentry Error Auto-Collection
**Goal**: 런타임 에러 자동 수집 → GitHub Issue 생성
**Depends on**: Phase 30
**Requirements**: ERR-01, ERR-02, ERR-03, ERR-04, ERR-05
**Success Criteria** (what must be TRUE):
  1. 프로덕션 환경에서 발생하는 runtime 에러가 자동으로 GitHub Issue로 생성된다
  2. 동일 에러의 중복 이슈 생성이 fingerprint 기반으로 방지된다
  3. 에러 이슈에 스택트레이스, 요청 URL, 사용자 에이전트 등 기술 컨텍스트가 포함된다
  4. 에러 이슈에 'sentry', 'auto-created' 라벨이 자동 태깅되어 수동 이슈와 구분된다
  5. 에러 이슈 생성이 Sentry 에러 리포팅을 블로킹하지 않는다 (fire-and-forget)
**Plans**: TBD

Plans:
- [ ] 31-01: TBD

#### Phase 32: Webhook & Issue Sync
**Goal**: GitHub webhook 연동 및 이슈 동기화
**Depends on**: Phase 31
**Requirements**: GH-04, GH-05, GH-06
**Success Criteria** (what must be TRUE):
  1. GitHub에서 이슈 상태가 변경되면 로컬 DB에 자동 동기화된다 (close, label, comment)
  2. Webhook 수신 시 HMAC-SHA256 서명 검증이 수행되어 위조 요청이 차단된다
  3. Webhook 이벤트가 IssueEvent 테이블에 기록되어 활동 로그를 확인할 수 있다
  4. DIRECTOR가 수동으로 GitHub에서 로컬 DB로 이슈를 일괄 동기화할 수 있다
  5. Replay attack이 delivery ID 추적으로 방지된다
**Plans**: TBD

Plans:
- [ ] 32-01: TBD

#### Phase 33: CI/CD Pipeline
**Goal**: 자동 배포 파이프라인 (PR → 테스트 → 배포)
**Depends on**: Phase 32
**Requirements**: CICD-01, CICD-02, CICD-03, CICD-04, CICD-05
**Success Criteria** (what must be TRUE):
  1. `auto-deploy` 라벨이 있는 PR이 main에 머지되면 자동으로 배포가 트리거된다
  2. 배포 성공 시 관련 GitHub Issue에 "배포 완료" 코멘트가 자동 추가된다
  3. 배포 실패 시 롤백이 실행되고 PR에 "배포 실패/롤백" 코멘트가 추가된다
  4. PR 본문의 `closes #N` 구문으로 연결된 이슈가 머지 시 자동 클로즈된다
  5. CI가 자기 자신을 트리거하는 무한 루프가 방지된다 ([skip ci] + bot 계정 구분)
**Plans**: TBD

Plans:
- [ ] 33-01: TBD

#### Phase 34: Issue Dashboard & Integration Testing
**Goal**: 이슈 대시보드 및 전체 파이프라인 통합 테스트
**Depends on**: Phase 33
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, DASH-05
**Success Criteria** (what must be TRUE):
  1. DIRECTOR가 앱 내에서 등록된 이슈 목록을 조회할 수 있다
  2. 이슈를 상태(open/closed), 카테고리, 소스(수동/Sentry) 기준으로 필터링할 수 있다
  3. 이슈 제목/설명으로 검색할 수 있다
  4. 각 이슈의 라이프사이클 상태(등록→브랜치→PR→테스트→배포)를 시각적으로 확인할 수 있다
  5. 이슈-배포 파이프라인의 전체 현황을 대시보드에서 파악할 수 있다
**Plans**: TBD

Plans:
- [ ] 34-01: TBD

<details>
<summary>✅ v4.0 Universal LLM Hub (Phase 35) - SHIPPED 2026-02-12</summary>

**Milestone Goal:** 기존 정적인 LLM 설정을 범용 Universal LLM Hub로 전환하여 시중의 모든 LLM(상용/로컬)을 동적으로 등록하고, 기능별로 유연하게 연결하는 미래지향적 시스템 구축

#### Phase 35: Universal LLM Hub
**Goal**: 범용 LLM Hub 시스템 구축
**Depends on**: Phase 15 (기존 Multi-LLM Integration)
**Requirements**: LLM-HUB-01~09
**Success Criteria** (what must be TRUE):
  1. 관리자가 템플릿을 선택하여 새 LLM 제공자를 3클릭으로 등록할 수 있다
  2. 제공자 등록 시 API 키 발급 방법이 인라인으로 안내된다
  3. 기능별(학습분석, 관상분석 등)로 LLM을 태그 기반 또는 직접 지정으로 매핑할 수 있다
  4. 매핑 결과를 미리 보고 테스트할 수 있다
  5. 기존 generateWithProvider() 호출이 새 시스템으로 자동 전환된다 (하위호환)
  6. 일반인이 "어떤 LLM을 선택해야 할지" 위자드를 통해 추천받을 수 있다
  7. 모든 설정에 대한 인라인 도움말과 종합 헬프 센터가 제공된다
**Plans**: 9 plans

Plans:
- [x] 35-01: Database Schema Migration (Provider, Model, FeatureMapping 테이블)
- [x] 35-02: Core Types & Provider Registry Foundation
- [x] 35-03: Provider Template System & Registration API
- [x] 35-04: Feature Mapping System (Tag-based + Direct)
- [x] 35-05: LLM Router Integration (Legacy Migration)
- [x] 35-06: Admin Dashboard UI - Provider Management
- [x] 35-07: Admin Dashboard UI - Feature Mapping Settings
- [x] 35-08: Help System (Inline + Help Center + Recommendations)
- [x] 35-09: Testing & Validation

</details>

### 🚧 v4.0 AI Smart Chat (In Progress)

**Milestone Goal:** AI 채팅에서 @멘션으로 시스템 데이터(학생, 선생님, 학급, 분석 결과 등)를 참조하여 맞춤형 AI 응답을 제공하는 컨텍스트 인식 채팅 시스템

#### Phase 36: Server-side Foundation
**Goal**: 교사가 @멘션을 포함한 메시지를 전송하면 서버가 RBAC를 적용하여 엔티티 데이터를 조회하고 AI 시스템 프롬프트에 안전하게 주입한다
**Depends on**: Phase 35
**Requirements**: MENT-03, MENT-04, CTX-01, CTX-02, CTX-03, CTX-04, CTX-05
**Success Criteria** (what must be TRUE):
  1. @멘션이 포함된 채팅 메시지 전송 시 서버가 엔티티 ID/타입 목록을 파싱하여 DB에서 데이터를 조회한다
  2. 조회된 엔티티 데이터가 토큰 예산(~800토큰/엔티티) 내로 요약되어 AI 시스템 프롬프트에 주입된다
  3. 교사는 자신의 팀에 속하지 않은 학생/선생님을 멘션해도 해당 데이터가 조회되지 않는다 (RBAC)
  4. 상담 노트 등 자유 텍스트 필드가 XML 경계 마킹으로 감싸져 Prompt Injection을 방어한다
  5. 전송된 메시지의 ChatMessage 레코드에 mentionedEntities JSON 메타데이터가 저장된다
**Plans**: 4 plans

Plans:
- [ ] 36-01: 멘션 타입 정의 + Prisma 스키마 변경 (MentionItem/MentionedEntity 타입, ChatMessage.mentionedEntities 컬럼)
- [ ] 36-02: mention-resolver.ts (RBAC 포함 학생/선생님/팀 엔티티 데이터 DB 조회 + 요약)
- [ ] 36-03: context-builder.ts (토큰 예산 관리 + XML 경계 마킹 + Prompt Injection 방어)
- [ ] 36-04: /api/chat/route.ts 통합 (mentions[] 수신, dynamic system prompt 주입, mentionedEntities 저장)

#### Phase 37: Autocomplete Search API
**Goal**: 교사가 @를 입력할 때 이름 검색으로 학생, 선생님, 학급 3가지 엔티티 타입을 빠르게 찾을 수 있는 독립적인 검색 레이어가 동작한다
**Depends on**: Phase 36
**Requirements**: MENT-06
**Success Criteria** (what must be TRUE):
  1. GET /api/chat/mentions/search?q=홍&types=student,teacher,team 호출 시 팀 내 엔티티가 타입별로 반환된다
  2. 2자 미만 쿼리는 빈 결과를 반환하고 불필요한 DB 조회가 발생하지 않는다
  3. 검색 결과에 학생(grade, school), 선생님(role), 학급(team name) 구분용 서브레이블이 포함된다
  4. 팀 외부 엔티티는 RBAC에 의해 검색 결과에서 제외된다
**Plans**: TBD

Plans:
- [ ] 37-01: /api/chat/mentions/search GET route (AbortController 취소 지원, Promise.all 병렬 쿼리, RBAC)

#### Phase 38: Autocomplete UI & ChatInput Integration
**Goal**: 교사가 채팅 입력창에 @를 입력하면 자동완성 드롭다운이 열리고, 엔티티를 선택하여 멘션을 삽입할 수 있으며, 한국어 IME 조합 중에도 정상 작동한다
**Depends on**: Phase 37
**Requirements**: MENT-01, MENT-02, MENT-05, UI-01
**Success Criteria** (what must be TRUE):
  1. 교사가 채팅 입력창에 @를 입력하면 학생/선생님/학급 검색 드롭다운이 200ms 디바운스로 나타난다
  2. 드롭다운이 학생/선생님/학급 그룹 헤더로 구분되어 표시되며 키보드(↑↓ Enter Esc)로 조작할 수 있다
  3. 드롭다운에서 엔티티를 선택하면 입력창에 @이름 멘션이 삽입되고 커서가 올바른 위치에 유지된다
  4. 한국어 IME 조합 중(compositionstart~compositionend)에는 드롭다운이 열리지 않아 오작동이 없다
**Plans**: TBD

Plans:
- [ ] 38-01: react-mentions-ts@5.4.7 설치 + Tailwind v4 통합 스파이크 (실패 시 @ariakit/react fallback)
- [ ] 38-02: use-mention.ts 훅 (자동완성 상태, 디바운스 페치, AbortController, IME 감지)
- [ ] 38-03: MentionDropdown 컴포넌트 (타입별 그룹, 키보드 네비게이션, 빈 결과 메시지)
- [ ] 38-04: ChatInput.tsx 수정 (MentionTextarea 통합, onSend(prompt, mentions[], providerId?) 시그니처)
- [ ] 38-05: useChatStream.ts + ChatPage.tsx 수정 (mentions[] POST body 전달, activeMentions 상태)

#### Phase 39: Message Rendering & UX Polish
**Goal**: 전송된 채팅 메시지에서 @멘션이 시각적 칩으로 렌더링되며, 칩을 클릭하면 엔티티 요약 정보를 팝오버로 확인할 수 있다
**Depends on**: Phase 38
**Requirements**: UI-02, UI-03
**Success Criteria** (what must be TRUE):
  1. 전송된 메시지의 @이름 텍스트가 배경색이 있는 시각적 칩으로 표시되어 일반 텍스트와 구분된다
  2. 멘션 칩을 클릭하면 해당 엔티티의 핵심 정보(이름, 역할/학년, 최신 분석 요약)가 팝오버로 표시된다
  3. AI 응답 스트리밍 중에는 드롭다운이 비활성화되어 입력이 차단되지 않는다
  4. 드롭다운이 뷰포트 하단에 걸리는 경우 자동으로 위쪽에 열려 잘림이 없다
**Plans**: TBD

Plans:
- [ ] 39-01: MentionTag 컴포넌트 (칩 렌더링, 클릭 팝오버, 엔티티 요약 표시)
- [ ] 39-02: ChatMessageItem.tsx 수정 (mentionedEntities 메타데이터로 @Name → MentionTag 치환)
- [ ] 39-03: UX 완성 (스트리밍 중 드롭다운 비활성화, 뷰포트 위치 동적 결정, 빈 결과 메시지)

#### Phase 40: LLMQueryBar Extension
**Goal**: 대시보드 상단 LLMQueryBar에서도 @멘션을 사용할 수 있어, 교사가 메인 채팅 페이지 진입 없이 컨텍스트 인식 AI 질문을 빠르게 할 수 있다
**Depends on**: Phase 39
**Requirements**: UI-04
**Success Criteria** (what must be TRUE):
  1. 대시보드 LLMQueryBar에서 @를 입력하면 Phase 38에서 만든 자동완성 드롭다운이 동일하게 동작한다
  2. LLMQueryBar에서 멘션 포함 메시지 전송 시 Phase 36의 서버 파이프라인이 동일하게 처리한다
  3. LLMQueryBar의 기존 동작(멘션 없는 일반 질문)이 하위 호환성을 유지하며 정상 동작한다
**Plans**: TBD

Plans:
- [ ] 40-01: LLMQueryBar @멘션 통합 (MentionInput 컴포넌트 재사용, props 인터페이스 확장)

## Progress

**Execution Order:**
Phases execute in numeric order: 36 → 37 → 38 → 39 → 40

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation & Authentication | v1.0 | 7/7 | Complete | 2026-01-30 |
| 2. File Infrastructure | v1.0 | 4/4 | Complete | 2026-01-30 |
| 3. Calculation Analysis | v1.0 | 4/4 | Complete | 2026-01-30 |
| 4. MBTI Analysis | v1.0 | 4/4 | Complete | 2026-01-30 |
| 5. AI Image Analysis | v1.0 | 5/5 | Complete | 2026-01-30 |
| 6. AI Integration | v1.0 | 5/5 | Complete | 2026-01-30 |
| 7. Reports | v1.0 | 7/7 | Complete | 2026-01-30 |
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
| 26. Counseling & Matching UI Enhancement | v2.1.1 | 4/4 | Complete | 2026-02-07 |
| 27. RBAC, Auth & Error Handling | v2.1.1 | 4/4 | Complete | 2026-02-07 |
| 28. Integration Verification & Test Alignment | v2.1.1 | 8/8 | Complete | 2026-02-07 |
| 29. Database & GitHub API Foundation | v3.0 | 3/3 | Complete | 2026-02-12 |
| 30. Issue UI & Screenshot | v3.0 | 4/4 | Complete | 2026-02-12 |
| 31. Sentry Error Auto-Collection | v3.0 | 0/TBD | Not started | - |
| 32. Webhook & Issue Sync | v3.0 | 0/TBD | Not started | - |
| 33. CI/CD Pipeline | v3.0 | 0/TBD | Not started | - |
| 34. Issue Dashboard & Integration Testing | v3.0 | 0/TBD | Not started | - |
| 35. Universal LLM Hub | v4.0 | 9/9 | Complete | 2026-02-12 |
| 36. Server-side Foundation | 4/4 | Complete   | 2026-02-18 | - |
| 37. Autocomplete Search API | v4.0 AI Chat | 0/TBD | Not started | - |
| 38. Autocomplete UI & ChatInput Integration | v4.0 AI Chat | 0/TBD | Not started | - |
| 39. Message Rendering & UX Polish | v4.0 AI Chat | 0/TBD | Not started | - |
| 40. LLMQueryBar Extension | v4.0 AI Chat | 0/TBD | Not started | - |

**Overall Progress:** 183/183 plans complete through Phase 35 + v3.0 partial (v1.0-v2.1.1: 100%, v3.0 29-30: complete, v4.0 Phase 35: 100%, Phases 36-40: 0%)

---
*Last updated: 2026-02-19 (v4.0 AI Smart Chat roadmap phases 36-40 added)*
