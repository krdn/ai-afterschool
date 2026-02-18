# AI AfterSchool

## What This Is

학원에서 대학입시를 목표로 학생을 효율적으로 관리하기 위한 AI 기반 학생 관리 시스템. 학원 선생님/관리자가 학생 정보를 등록하고, AI가 다양한 성향 분석(MBTI, 사주, 성명학, 관상/손금)을 제공하며, 이를 바탕으로 맞춤형 학습 전략과 진로 가이드를 제안한다. 상담 시 활용할 수 있는 종합 보고서 출력 기능을 제공한다.

**현재 상태:** v4.0 AI Smart Chat 진행 중.

## Core Value

**학생 정보 통합 관리를 기반으로 AI 성향 분석 및 맞춤형 학습/진로 제안 제공** — 학생 데이터가 없으면 분석도 제안도 불가능하다. 학생 정보 관리가 모든 기능의 기반이다.

## Latest Shipped: v2.1.1 E2E Test Compliance (SHIPPED 2026-02-07)

**Delivered:** E2E 테스트 인프라 구축과 테스트 호환성 확보로 안정적인 테스트 기반 마련 (34/34 requirements)

## Current Milestone: v4.0 AI Smart Chat

**Goal:** AI 채팅에서 @멘션으로 시스템 데이터(학생, 선생님, 학급, 분석 결과 등)를 참조하여 맞춤형 AI 응답을 제공하는 컨텍스트 인식 채팅 시스템

**Target features:**
- @멘션 시스템 (학생, 선생님, 학급 등 엔티티 자동완성 및 데이터 로딩)
- 시스템 데이터 컨텍스트 주입 (사주, MBTI, VARK, 상담기록, 궁합 등을 시스템 프롬프트에 동적 포함)
- 멘션 기반 동적 시스템 프롬프트 생성 (엔티티별 데이터 수집 및 프롬프트 조합)
- 채팅 내 엔티티 프리뷰 (멘션된 학생/선생님의 요약 정보 인라인 표시)
- 다중 엔티티 컨텍스트 (한 메시지에서 여러 학생/선생님 동시 참조)
- 채팅 세션별 컨텍스트 기억 (세션 내에서 이전에 멘션된 데이터 유지)

## Current State

**Version:** v2.1.1 E2E Test Compliance (SHIPPED 2026-02-07)

**Delivered Features:**
- **v1.0 MVP 모든 기능 포함:**
  - 선생님 인증 (이메일/비밀번호 로그인, 비밀번호 재설정, 다중 계정 지원)
  - 학생 정보 관리 (기본 정보 CRUD, 사진 업로드, 검색/정렬/페이지네이션)
  - 전통 분석 (사주팔자, 성명학, MBTI 설문)
  - AI 이미지 분석 (관상/손금 사진 업로드 후 Claude Vision API 분석)
  - 통합 성향 분석 (모든 분석 결과 종합 및 성격 요약 카드)
  - AI 맞춤형 제안 (학습 전략 및 진로 가이드 자동 생성)
  - 종합 보고서 PDF (한글 지원 전문 레이아웃)

- **v1.1 프로덕션 준비 기능:**
  - Docker Compose 프로덕션 환경 (멀티스테이지 빌드)
  - Caddy 리버스 프록시와 자동 SSL/TLS
  - MinIO S3 호환 스토리지와 PDF 저장소 추상화
  - 헬스체크 엔드포인트 (/api/health)
  - 무중단 배포 및 자동 롤백
  - 데이터베이스 마이그레이션 자동화
  - 연결 풀링 및 N+1 쿼리 최적화
  - Next.js Image 최적화 (WebP/AVIF)
  - Sentry 오류 추적
  - 구조화된 로깅 (Pino)
  - 데이터베이스 백업 자동화

**Tech Stack:**
- Next.js 15 (App Router)
- Prisma + PostgreSQL
- MinIO (S3-compatible PDF storage)
- Cloudinary (이미지 저장)
- Claude API (AI 분석)
- @react-pdf/renderer (PDF 생성)
- TanStack Table (테이블 UI)
- Docker + Docker Compose
- Caddy (리버스 프록시)
- Sentry (오류 추적)
- Pino (로깅)

**v2.0 Teacher Management 기능:**
  - 선생님 관리 (CRUD, 성향 분석, 계층 구조)
  - 팀 단위 데이터 분리 (원장/팀장/매니저/선생님)
  - 선생님-학생 궁합 분석
  - AI 자동 배정 제안
  - 성과 분석 및 선생님 추천
  - 다중 LLM 지원 (Ollama, Gemini, ChatGPT, Claude)
  - Admin 설정 기능

**Tech Stack:**
- Next.js 15 (App Router)
- Prisma + PostgreSQL
- MinIO (S3-compatible PDF storage)
- Cloudinary (이미지 저장)
- Vercel AI SDK (다중 LLM 지원)
- @react-pdf/renderer (PDF 생성)
- TanStack Table (테이블 UI)
- Recharts (차트 시각화)
- Docker + Docker Compose
- Caddy (리버스 프록시)
- Sentry (오류 추적)
- Pino (로깅)

**Codebase Stats:**
- ~40,000 lines of TypeScript/JSX
- 128 plans across 22 phases (v1.0: 36, v1.1: 22, v2.0: 40, v2.1: 30)
- Integration health score: 92%

**v2.1 Parent Counseling Management 기능:**
  - 학부모 정보 관리 (복수 학부모, 주 연락처)
  - 상담 예약 시스템 (CRUD, 상태 관리, 자동 세션 연결)
  - 캘린더 시각화 (월간/주간 뷰)
  - 학생 페이지 상담 통합
  - 상담 통계 대시보드
  - 후속 조치 관리
  - AI 상담 지원 (성향 표시, 궁합 점수, AI 요약)

**Known Issues (Minor Technical Debt):**
- 2개 `<img>` 태그가 Next.js Image를 사용하지 않음 (face-analysis-panel.tsx, student-image-tabs.tsx)
- 여러 컴포넌트에서 사용하지 않는 import 존재
- 자동 알림 (health check degradation) - 수동 모니터링 필요

**v2.1.1 기술 부채 (수락됨):**
- E2E 테스트 커버리지 20.7% (18/87 통과) — Admin data-testid 누락, 타임아웃 이슈
- Admin 페이지 data-testid 누락 (12개 테스트 실패: system-logs-table, audit-logs-table 등)
- 타임아웃 설정 미최적화 (15개 테스트 실패: 분석/대시보드 페이지 로드)
- Analysis 탭 data-testid 부족 (text=MBTI 같은 취약한 셀렉터 사용)
- 분석 이력 기능 제약 (@unique 제약으로 1개 레코드만 표시, 별도 이력 테이블 필요)

## Requirements

### Validated

- [x] 선생님 로그인/인증 (다중 계정 지원) — v1.0
- [x] 학생 기본 정보 등록 (이름, 생년월일, 연락처, 사진) — v1.0
- [x] 학생 학업 정보 등록 (학교, 학년, 목표 대학/학과) — v1.0
- [x] 학생 목록 조회 및 검색 — v1.0
- [x] 학생 상세 정보 조회 — v1.0
- [x] MBTI 분석 (설문 기반) — v1.0
- [x] 사주 분석 (생년월일시 기반 사주팔자 계산) — v1.0
- [x] 성명학 분석 (한글/한자 이름 획수 및 수리 분석) — v1.0
- [x] 관상 분석 (사진 업로드 기반 AI 분석) — v1.0
- [x] 손금 분석 (손바닥 사진 업로드 기반 AI 분석) — v1.0
- [x] 통합 성향 분석 (모든 분석 결과 종합) — v1.0
- [x] AI 학습 전략 제안 (성향 기반 공부 방법 추천) — v1.0
- [x] AI 진로 가이드 (성향 기반 학과/직업 추천) — v1.0
- [x] 상담 보고서 출력 (종합 성향 및 제안 리포트) — v1.0

**v1.1 프로덕션 준비:**
- [x] Docker Compose 프로덕션 환경 구성 — v1.1
- [x] Caddy 리버스 프록시와 자동 SSL/TLS — v1.1
- [x] `/api/health` 엔드포인트 — v1.1
- [x] `.dockerignore`로 환경변수 파일 제외 — v1.1
- [x] 환경별 설정 파일 분리 (.env.development, .env.production) — v1.1
- [x] 무중단 배포 전략 — v1.1
- [x] 배포 실패 시 자동 롤백 — v1.1
- [x] MinIO S3 호환 스토리지 — v1.1
- [x] PDF 저장소 추상화 (로컬/S3 전환 가능) — v1.1
- [x] PDF 데이터 마이그레이션 — v1.1
- [x] Presigned URL PDF 다운로드 — v1.1
- [x] `prisma migrate deploy` 자동화 — v1.1
- [x] Prisma 연결 풀링 (connection_limit=10) — v1.1
- [x] Prisma include로 N+1 쿼리 해결 — v1.1
- [x] 데이터베이스 복합 인덱스 — v1.1
- [x] Next.js Image 최적화 (WebP/AVIF) — v1.1
- [x] Promise.all() 병렬 데이터 페칭 — v1.1
- [x] 코드 스플리팅 최적화 (번들 분석) — v1.1
- [x] Sentry 오류 추적 — v1.1
- [x] 데이터베이스 백업 자동화 — v1.1
- [x] JSON 구조화된 로깅 (요청 ID 추적) — v1.1
- [x] fetchReportData() 함수 중복 해제 — v1.1
- [x] Phase 1 VERIFICATION.md 생성 — v1.1

**v2.0 선생님 관리 시스템:**
- [x] 선생님 기본 정보 관리 (이름, 이메일, 연락처, 사진, 소속 팀) — v2.0
- [x] 선생님 계층 구조 (원장 > 팀장 > 매니저 > 선생님) — v2.0
- [x] 팀 단위 데이터 접근 제어 (원장: 전체, 팀장: 소속 팀만) — v2.0
- [x] 선생님 성향 분석 (MBTI, 사주, 성명학, 관상, 손금) — v2.0
- [x] 선생님-학생 궁합 분석 (AI 기반) — v2.0
- [x] 학생 배정 기능 (선생님에게 학생 할당) — v2.0
- [x] AI 자동 배정 제안 (궁합 + 부하 분산) — v2.0
- [x] 선생님 성과 분석 (학생 성과 추적) — v2.0
- [x] 팀 구성 분석 (성향 조합, 전분야 커버리지) — v2.0
- [x] 학생별 선생님 추천 (맞춤 순위) — v2.0
- [x] 다중 LLM 설정 (Ollama 로컬, Gemini, ChatGPT, Claude) — v2.0
- [x] Admin 설정 기능 (원장 전용) — v2.0
- [x] 선생님 목록 조회 및 검색 — v2.0
- [x] 선생님 상세 정보 조회 — v2.0

**v2.1 학부모 상담 관리 시스템:**
- [x] 학부모 상담 예약 등록 (날짜, 시간, 상담 유형, 학부모 연락처) — v2.1
- [x] 상담 예약 목록 조회 및 관리 (예정/완료/취소 상태) — v2.1
- [x] 상담 내용 기록 (상담 요약, 논의 사항, 후속 조치) — v2.1
- [x] 학생별 상담 이력 조회 (시간순 정렬, 검색/필터) — v2.1
- [x] 선생님별 상담 통계 (월별 상담 횟수, 상담 유형 분포) — v2.1
- [x] 학생별 상담 통계 (총 상담 횟수, 최근 상담일) — v2.1
- [x] 다가오는 상담 예약 대시보드 — v2.1
- [x] AI 상담 지원 (성향 표시, 궁합 점수, AI 요약 생성) — v2.1

**v2.1.1 E2E 테스트 준수:**
- [x] 학생/분석/Admin 페이지 data-testid 추가 — v2.1.1
- [x] 누락 라우트 생성 (/teachers/me, /admin, /teams, /students/[id]/report) — v2.1.1
- [x] 학생/분석/리포트 UI 보강 (alt 속성, 서브탭 분리, 에러 처리) — v2.1.1
- [x] 상담/매칭/성과 UI 보강 (검색, 필터, 이력 추적) — v2.1.1
- [x] RBAC 및 에러 처리 강화 (AccessDeniedPage, NotFoundPage, 토큰 에러) — v2.1.1
- [x] E2E 테스트 기반 확립 (data-testid 195개, TEST-MAINTENANCE.md) — v2.1.1

### Active

**v4.0 AI Smart Chat:**
- [ ] @멘션 자동완성 시스템 (학생, 선생님, 학급 검색 및 선택)
- [ ] 엔티티별 데이터 수집기 (학생/선생님의 분석 결과, 상담기록, 궁합 등 통합 조회)
- [ ] 동적 시스템 프롬프트 생성기 (멘션된 엔티티 데이터를 AI 프롬프트에 주입)
- [ ] 채팅 내 엔티티 프리뷰 UI (멘션된 엔티티의 요약 카드 인라인 표시)
- [ ] 다중 엔티티 컨텍스트 지원 (한 메시지에서 여러 엔티티 동시 참조)
- [ ] 세션 컨텍스트 유지 (채팅 세션 내 멘션 히스토리 관리)

### Out of Scope

- 대학/학과 정보 자동 수집 — 선생님/학생 관리에 집중
- 학생 본인 직접 입력 — 선생님/관리자만 사용
- 학부모 포털 — 선생님 중심 운영으로 결정
- 모바일 앱 — 웹 우선, 모바일은 추후 검토
- 출결/수강료 관리 — v3.1 이후로 미룸
- 카카오톡 알림톡 — v2.1은 내부 기록에 집중
- 이메일 자동 발송 — v2.1은 선생님이 직접 연락
- 실시간 채팅 — 핵심 가치와 무관, 복잡도 증가
- LMS/동영상 강의 — 기존 솔루션 활용 권장

## Context

### Before v1.0 (Greenfield)

- 새로 시작하는 학원으로, 기존 학생 관리 시스템이 없음
- 50~200명 규모의 중규모 학원
- 성향 분석 결과는 학습 전략 제안, 진로 가이드, 상담 자료로 활용
- 관상/손금 분석은 AI 이미지 분석 기능 필요 (API 또는 자체 모델)
- 사주/성명학은 전통적인 계산 로직 구현 필요

### After v1.1 (Brownfield - Production Ready)

**사용 가능한 데이터 (v1.0 + 추가):**
- 학생 기본 정보 (이름, 생년월일, 연락처, 사진, 학교, 학년, 목표 대학/학과, 혈액형)
- 사주 분석 결과 (천간지지, 오행, 십성)
- 성명학 분석 결과 (획수, 수리)
- MBTI 결과 (유형, 차원별 점수)
- 관상/손금 분석 결과 (AI 해석)
- 통합 성향 분석 (AI 요약)
- AI 맞춤형 제안 (학습 전략, 진로 가이드)
- PDF 보고서 이력

**사용 가능한 인프라 (v1.0 + 추가):**
- Prisma + PostgreSQL 데이터베이스 (연결 풀링 최적화)
- MinIO S3 호환 스토리지 (PDF 저장)
- Cloudinary 이미지 저장소 (최적화됨)
- Claude API 통합 (Text + Vision)
- @react-pdf/renderer PDF 생성
- Next.js App Router 아키텍처
- Docker Compose 프로덕션 환경 (4 서비스)
- Caddy 리버스 프록시 (자동 SSL)
- Sentry 오류 추적
- Pino 구조화된 로깅
- 데이터베이스 백업 자동화

**기술 부채 (해결됨):**
- ✅ fetchReportData() 함수 중복 → 공유 모듈로 추출 완료
- ✅ PDF 저장소 로컬 파일시스템 → S3 호환 추상화 완료
- ✅ VERIFICATION.md 파일 누락 → Phase 1 retrospective verification 완료

**남은 사소한 기술 부채 (비차단):**
- 2개 `<img>` 태그가 Next.js Image 미사용
- 여러 컴포넌트에서 사용하지 않는 import 존재
- Health check degradation 자동 알림 (수동 모니터링 필요)

## Constraints

- **Tech Stack**: Next.js (App Router) + Docker — README에 명시된 기술 스택
- **Language**: JavaScript — README 기준 (실제 구현은 TypeScript)
- **Users**: 학원 선생님/관리자 전용 (다중 사용자)
- **Scale**: 50~200명 학생 관리 규모
- **LLM Support**: Ollama (192.168.0.5), Gemini, ChatGPT, Claude

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 학생 정보 관리를 먼저 구현 | 모든 분석/제안 기능의 기반이 됨 | ✓ 성공 — 모든 기능이 학생 데이터를 참조 |
| 저위험 계산 분석 먼저, AI 기능 나중에 | 사주/성명학은 결정론적, AI는 실험적 | ✓ 성공 — MBTI/사주/성명학 먼저 안정화 |
| Cloudinary 이미지 저장 | 클라이언트 업로드, CDN 제공 | ✓ 성공 — 위젯 통합으로 간단한 구현 |
| Claude API 통합 (Text + Vision) | 하나의 API로 모든 AI 기능 | ✓ 성공 — 통합된 API 사용 |
| @react-pdf/renderer PDF 생성 | React 컴포넌트로 PDF 작성 | ✓ 성공 — 한글 폰트 지원, 템플릿화 |
| after() API 비동기 패턴 | UI 블로킹 방지 | ✓ 성공 — 모든 AI 기능에 적용 |
| Zod 검증 스키마 | 타입 안전성 보장 | ✓ 성공 — AI 응답 검증에 활용 |
| 대학 정보 수집은 v2로 미룸 | v1은 핵심 기능에 집중 | — Pending — v1.1에서 재검토 |
| 선생님별 개별 계정 사용 | 여러 선생님이 동시 사용 | ✓ 성공 — 다중 계정 분리 확인 |

**v1.1 결정들:**
| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Docker Compose 프로덕션 배포 | 단일 서버 배포에는 충분, 복잡도 낮음 | ✓ 성공 — 4 서비스 구성, 헬스체크 통합 |
| MinIO S3 호환 스토리지 | 셀프 호스팅, 비용 효율적, S3 API 호환 | ✓ 성공 — PDF 추상화, 마이그레이션 완료 |
| Caddy vs Nginx | 자동 SSL 설정 간단, 설정 직관적 | ✓ 성공 — Let's Encrypt 자동 인증서 |
| 연결 풀 제한 10 | Docker 환경 작은 규모 (50-200 학생) | ✓ 성공 — 풀 고갈 없음 |
| Prisma include로 N+1 해결 | 단일 쿼리로 관계 데이터 로드 | ✓ 성공 — 7쿼리 → 1쿼리 (85% 감소) |
| Sentry 오류 추적 | 프로덕션 오류 모니터링 필수 | ✓ 성공 — 다중 런타임 구성 |
| Pino 구조화된 로깅 | JSON 형식, 요청 ID 추적 | ✓ 성공 — 디버깅 용이성 향상 |
| PDF API 프록시 패턴 | Presigned URL 만료 문제 해결 | ✓ 성공 — 1시간 제거, 직접 반환 |
| 코드 중복 공유 모듈 추출 | 유지보수성 향상, 단일 진실 공급원 | ✓ 성공 — 164라인 중복 제거 |

**v2.0 결정들:**
| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 팀 단위 데이터 분리 | 보안 및 프라이버시 보장 | ✓ 성공 — Prisma Extensions + PostgreSQL RLS |
| 선생님 성향 분석 | 학생과 동일한 방식으로 궁합 계산 | ✓ 성공 — 기존 분석 모듈 재사용 |
| LLM 전체 공통 설정 | 관리 용이성 및 비용 효율성 | ✓ 성공 — Vercel AI SDK 통합 |
| 가중 평균 궁합 알고리즘 | MBTI/학습스타일/사주/성명학/부하분산 조합 | ✓ 성공 — 투명한 점수 계산 |
| Greedy 자동 배정 | 단순하지만 효과적인 배정 알고리즘 | ✓ 성공 — O(students × teachers) |
| 공정성 메트릭 | Disparity Index, ABROCA, Distribution Balance | ✓ 성공 — 편향 탐지 가능 |

**v2.1 결정들:**
| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 선생님 중심 운영 | 학부모 계정 없이 선생님이 모든 상담 관리 | ✓ 성공 — 학부모 계정 없이 완전한 상담 관리 시스템 구현 |
| 내부 기록 전용 | 외부 알림 없이 시스템에만 기록 | ✓ 성공 — 외부 연동 없이 내부 기록 시스템으로 완성 |
| Student FK 간접 격리 | 기존 RBAC Extension 재사용 | ✓ 성공 — Parent/Reservation에 teamId 중복 없음 |
| 주 연락처 이중 저장 | 빠른 조회와 관리 모두 지원 | ✓ 성공 — Student.primaryParentId + Parent.isPrimary |
| react-day-picker v9 | 한국어 로케일, Tailwind 스타일링 | ✓ 성공 — 월간/주간 캘린더 모두 구현 |
| 기존 LLM 라우터 활용 | Phase 15 인프라 재사용 | ✓ 성공 — generateWithProvider로 AI 요약 생성 |

**v2.1.1 결정들:**
| Decision | Rationale | Outcome |
|----------|-----------|---------|
| data-testid 네이밍 컨벤션 | kebab-case, [component]-[element] 형식 | ✓ 성공 — 일관된 셀렉터로 E2E 안정성 확보 |
| 최소 변경 원칙 | 기존 UI/스타일 변경 없이 data-testid만 추가 | ✓ 성공 — 회귀 방지 while 테스트 호환성 확보 |
| E2E 테스트 기준선 확립 | 20.7% 통과율로 기준선 마련 | ⚠️ Tech Debt — 점진적 개선 방향, 인증 모듈 80% 달성 |
| auto_generated 테스트 제외 | 문제 많은 자동 생성 테스트를 testIgnore로 제외 | ✓ 성공 — 메인 테스트에 집중, 실행 시간 단축 |
| 통합 검증 결과 수락 | 34/34 요구사항 충족, E2E 흐름 100% 연결 | ✓ 성공 — 기능 코드 완료, 테스트 부채는 차기 마일스톤에서 해결 |

---
*Last updated: 2026-02-18 after v4.0 AI Smart Chat milestone started*
