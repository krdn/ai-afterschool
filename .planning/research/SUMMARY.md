# Project Research Summary

**Project:** AI AfterSchool - 학원 학생 관리 시스템
**Domain:** Educational Academy Management with AI-based Personality Analysis
**Researched:** 2026-01-27
**Confidence:** MEDIUM-HIGH

## Executive Summary

AI AfterSchool은 50-200명 규모 대학입시 학원을 위한 학생 관리 시스템으로, **전통적 학원 관리 기능과 AI 기반 성향 분석을 결합한 차별화된 입시 컨설팅 플랫폼**입니다. 기존 학원 관리 시스템(출결, 수강료, 학부모 소통)은 무료 솔루션이 다수 존재하는 레드오션이지만, MBTI, 사주팔자, 관상, 손금, 성명학 등 다각도 성향 분석을 학습 전략 및 진로 가이드와 연결하는 AI 컨설팅 기능은 시장에 존재하지 않는 독보적 차별화 요소입니다.

권장 접근법은 **Next.js 15 App Router 기반 풀스택 모놀리식 아키텍처**로 시작하는 것입니다. PostgreSQL로 구조화된 학생 데이터를 관리하고, OpenAI Vision API를 활용한 관상/손금 분석, 자체 계산 로직 기반 사주/성명학 분석을 모듈식으로 구성합니다. 50-200명 규모에서는 과도한 최적화(마이크로서비스, Redis 캐싱, 메시지 큐)가 불필요하며, Server Components와 Server Actions만으로 충분한 성능을 제공합니다.

핵심 리스크는 **3가지**입니다. 첫째, 한국 개인정보보호법 준수(14세 미만 학부모 동의, 최소 수집 원칙, 5년 보관 후 자동 삭제). 둘째, 사주팔자 계산의 정확도(태양시 변환, 역사적 서머타임 처리, 절기 분 단위 계산). 셋째, AI 분석(특히 관상/손금)의 신뢰도와 일관성(이미지 품질 게이팅, 신뢰도 점수 표시, 재분석 일관성 검증). 이 세 가지는 시스템 전체의 신뢰도를 결정하므로 초기 설계부터 철저히 대응해야 합니다.

## Key Findings

### Recommended Stack

Next.js 15 App Router를 중심으로 한 모던 풀스택 아키텍처가 최적입니다. 프로젝트 명세에 명시된 JavaScript를 사용하며, Server Components로 SSR 초기 로딩 최적화와 SEO를 확보하고, Server Actions로 API 엔드포인트 없이 타입 안전한 데이터 변경이 가능합니다. 데이터베이스는 PostgreSQL 16을 선택하여 학생 정보, 성적, 상담 기록 등 구조화된 관계형 데이터의 복잡한 조인과 ACID 보장을 처리합니다. Prisma ORM은 스키마 우선 접근으로 초보자 친화적이며 마이그레이션을 자동화합니다.

**Core technologies:**
- **Next.js 15 + React 19**: Full-stack framework with App Router — 서버 컴포넌트와 서버 액션으로 API 없는 데이터 처리, SSR로 초기 로딩 최적화
- **PostgreSQL 16 + Prisma 7**: Relational database & ORM — 구조화된 학생 데이터의 복잡한 관계 관리, ACID 보장, 50-200명 규모 충분 성능
- **Clerk**: Authentication & multi-tenant — Organization 기능으로 학원 내 다중 선생님 계정 및 역할 관리, Next.js 15 네이티브 지원
- **shadcn/ui + Tailwind CSS**: UI components & styling — 2026년 Next.js 사실상 표준, 코드 복사 방식으로 커스터마이징 용이, Server Components 지원
- **OpenAI API (GPT-4o/mini)**: AI image & text analysis — Vision API로 관상/손금 이미지 분석, 학습 전략/진로 제안 생성, 한국어 지원 우수
- **Cloudinary**: Image storage & CDN — 학생 사진, 손금/관상 이미지 저장, 자동 리사이징, 무료 티어 25GB
- **@react-pdf/renderer**: PDF report generation — React 컴포넌트로 상담 보고서 레이아웃 작성, 서버 사이드 생성 가능

**Notable decisions:**
- TypeScript 대신 JavaScript 사용 (프로젝트 명세, 러닝커브 고려)
- Drizzle 대신 Prisma 선택 (DX 우선, 50-200명 규모에서 성능 차이 무의미)
- NextAuth 대신 Clerk 선택 (멀티테넌트 조직/역할 관리 기능 내장)
- Redis/Queue 시스템 제외 (규모에 과함, Next.js 빌트인 캐싱으로 충분)

### Expected Features

전통적 학원 관리 기능은 **table stakes**(없으면 불완전)이지만, 기존 무료 솔루션과 차별화가 어렵습니다. 진짜 경쟁력은 **AI 성향 분석 기반 입시 컨설팅** 기능입니다.

**Must have (table stakes):**
- 학생 정보 관리 (CRUD, 검색, 그룹 관리) — 모든 기능의 기반
- 출결 관리 (출석 체크, 보강 수업) — 학원 운영 핵심
- 수강료 관리 (청구서, 수납, 미납 알림) — 자금 흐름 관리
- 학부모 소통 (공지사항, 개별 메시지) — 정보 전달
- 교육 관리 (수업, 성적, 진도) — 대학입시 핵심 데이터

**Should have (competitive differentiators):**
- **AI 성향 분석** (MBTI, 사주팔자, 관상, 손금, 성명학) — 독보적 차별화, 학생을 깊이 이해하는 시스템으로 포지셔닝
- **학습 전략 추천** (성향별 학습 스타일, 과목별 전략, 약점 진단) — 성향 분석을 실질적 학습 성과로 연결, 학부모 체감 가치
- **진로 가이드** (적성 진로, 대학/학과 추천, 합격 예측) — 대학 입시 컨설팅으로 고도화, 프리미엄 기능
- **상담 리포트 생성** (자동 리포트, 학부모용 시각화, AI 맞춤 조언) — 선생님 업무 간소화, 전문적 인상

**Defer (v2+):**
- 분원 관리 (단일 학원 검증 후 확장)
- 모바일 앱 (반응형 웹 우선)
- 실시간 채팅 (알림으로 충분)
- 화상 수업 (외부 링크로 대체)
- 게임화 요소 (입시 특성상 불필요)

**Anti-features (명시적 제외):**
- 복잡한 멀티학원 관리 (50-200명 규모는 단일 학원 집중)
- 자체 화상회의/LMS (Zoom/YouTube 사용 중)
- 소셜 네트워크 기능 (산만함 유발, 보안 리스크)

### Architecture Approach

**3-tier 아키텍처**를 Next.js App Router의 Server Components와 Server Actions로 모던하게 구현합니다. 핵심 원칙은 **학생 데이터를 진실의 원천**으로 두고, 각 분석 기능(MBTI, 사주, 관상 등)을 독립적 모듈로 구성하는 것입니다. 계산 가능한 분석(사주, 성명학)은 100% 신뢰도와 0원 비용으로 빠르게 실행되지만, AI 기반 분석(관상, 손금)은 외부 API 의존으로 에러 처리 전략이 다릅니다. 이를 명확히 분리하여 일부 분석 실패 시에도 시스템이 작동하도록 Progressive AI Integration 패턴을 따릅니다.

**Major components:**
1. **Authentication System** — 선생님 로그인/세션 관리, Middleware로 Edge 인증 체크, 모든 DB 쿼리에 teacher_id 필터
2. **Student Management (Level 1 Foundation)** — 학생 CRUD/검색/목록, 모든 기능의 기반, 없으면 Level 2/3 작동 불가
3. **File Upload Service (Level 1)** — 학생 사진, 손금 사진 저장/조회, Cloudinary 또는 S3 통합
4. **Analysis Modules (Level 2 Independent)** — MBTI/사주/성명학/관상/손금 각각 독립 모듈, 서로 의존 없음, 병렬 실행 가능
5. **AI Strategy Advisor (Level 3 Synthesis)** — 모든 분석 결과 통합, LLM API로 학습 전략/진로 제안 생성, 사용 가능한 데이터만으로 점진적 제안
6. **Report Generator (Level 3)** — 종합 보고서 PDF 생성, react-pdf 사용, 비동기 큐로 처리, 캐싱으로 중복 생성 방지

**Key patterns:**
- **Server Actions for Mutations**: Form submission, 데이터 변경, 파일 업로드는 모두 Server Actions로 처리 (API Routes 불필요)
- **Feature-Based Organization**: `/src/features/{domain}/` 구조로 응집도 높고 결합도 낮은 모듈화
- **Separation of Calculation vs AI**: 결정론적 계산(사주)과 비결정론적 AI(관상)를 다른 에러 처리 전략으로 구분
- **Progressive AI Integration**: 일부 분석 실패해도 사용 가능한 데이터로 제안 생성, 점진적 가치 제공

### Critical Pitfalls

연구에서 식별된 12개 pitfalls 중 시스템 신뢰도를 결정하는 상위 5개입니다.

1. **개인정보보호법 위반** — 14세 미만 학부모 동의 필수, 최소 수집 원칙, 5년 후 자동 삭제, 접근 로그 기록. Phase 1 인증 설계 시 법률 검토 필수. 위반 시 최대 징역 3년 또는 벌금 3천만원.

2. **사주팔자 계산 부정확** — 태양시 변환(서울 127°E, KST 135°E 기준 약 30분 차이), 역사적 서머타임 처리(1948-1988 한국 12회), 절기 분 단위 정밀 계산, 만세력 데이터 활용. 부정확 시 전체 시스템 신뢰도 붕괴. Phase 2 사주 구현 전 전문가 자문 필요.

3. **AI 관상/손금 신뢰도 낮음** — 이미지 품질 게이팅(해상도/조명/선명도), 일관성 테스트(같은 사진 95% 동일 결과), 신뢰도 점수 표시(<70% 시 분석 거부), 2-3장 다른 시점 사진 요구. 엔터테인먼트임을 명시. Phase 4-5 이미지 분석은 핵심 기능 검증 후 추가.

4. **Next.js 인증 취약점 (CVE-2025-29927)** — Middleware만 의존 금지, 모든 Server Action에서 권한 재검증, httpOnly 쿠키 사용, Clerk/NextAuth 등 검증된 라이브러리 사용. 학생 데이터 무단 접근 시 법적 책임. Phase 1 인증은 보안 우선.

5. **MBTI 재현성 부족** — 검증된 60-93문항 세트 사용, 선호도 명확성 점수 표시(e.g., 65% Extraversion), 60% 미만 시 경계선 경고, 테스트-재테스트 신뢰도 >0.80 검증. 부정확 시 학부모/학생 신뢰 상실. Phase 3 MBTI는 심리학 검증 필요.

## Implications for Roadmap

연구 결과를 기반으로 한 권장 단계 구조입니다. **차별화 요소를 먼저 검증**하는 전략을 따릅니다.

### Phase 1: Foundation & Authentication
**Rationale:** 학생 데이터 없이는 분석 불가능. 인증/보안은 재작업 비용 높음. 개인정보보호법 준수는 법적 필수사항.

**Delivers:**
- 선생님 로그인 (Clerk 통합)
- 학생 CRUD (이름, 생년월일시, 기본 정보)
- 개인정보보호법 준수 (동의 관리, 접근 로그)

**Addresses:**
- Table stakes: 학생 정보 관리
- Critical pitfall: 개인정보보호법 위반, 인증 취약점

**Stack:** Next.js 15, Clerk, PostgreSQL, Prisma

**Research flag:** LOW — 인증/DB는 표준 패턴, 다만 한국 법률 검토 필요

---

### Phase 2: Calculation-Based Analysis (사주 & 성명학)
**Rationale:** 외부 의존 없음, 신뢰도 100%, 빠른 구현. 차별화 핵심 기능이지만 위험도 낮음. AI 분석 전 검증 가능.

**Delivers:**
- 사주팔자 계산 (만세력 로직, 태양시 변환)
- 성명학 분석 (한자 획수 DB, 천격/인격/지격 계산)
- 분석 결과 저장 및 조회

**Addresses:**
- Differentiator: AI 성향 분석 (계산 기반 부분)
- Critical pitfall: 사주 계산 정확도, 한자 인코딩

**Stack:** date-fns (한국 로케일), 자체 만세력 로직, Korean-Name-Hanja-Charset 데이터셋

**Research flag:** HIGH — 천문학 계산 복잡도 높음, 사주 전문가 자문 필요, 기존 소프트웨어(만세력닷컴) 대비 검증 필수

---

### Phase 3: MBTI Analysis & First Integration
**Rationale:** 과학적 검증도 높은 성향 분석 추가. 사주+MBTI 결합 리포트로 차별화 가치 검증.

**Delivers:**
- MBTI 설문 (검증된 60+ 문항)
- MBTI 유형 판정 및 선호도 점수
- 통합 성향 리포트 (MBTI + 사주)

**Addresses:**
- Differentiator: AI 성향 분석 (심리학 기반)
- Critical pitfall: MBTI 재현성

**Stack:** React Hook Form + Zod (설문 검증), 자체 점수 계산

**Research flag:** MEDIUM — MBTI 문항 라이선스 확인, 테스트-재테스트 신뢰도 검증 필요

---

### Phase 4: File Upload & AI Strategy
**Rationale:** 이제 분석 데이터 축적됨. 학습 전략 생성으로 실질적 가치 제공. 이미지 분석 준비.

**Delivers:**
- 파일 업로드 서비스 (Cloudinary)
- AI 학습 전략 추천 (GPT-4 API)
- 학습 스타일, 과목별 전략, 약점 진단

**Addresses:**
- Differentiator: 학습 전략 추천
- Table stakes: 학생 사진 관리

**Stack:** Cloudinary (이미지 저장), OpenAI API (전략 생성), TanStack Query (클라이언트 페칭)

**Research flag:** MEDIUM — 프롬프트 엔지니어링 최적화 필요, LLM 비용 예측

---

### Phase 5: Image Analysis (관상 & 손금)
**Rationale:** 고위험 AI 기능은 핵심 검증 후. 선택적 기능으로 위치. 신뢰도 검증 집중.

**Delivers:**
- 관상 분석 (OpenAI Vision API)
- 손금 분석 (OpenAI Vision API)
- 이미지 품질 검증, 신뢰도 점수

**Addresses:**
- Differentiator: AI 성향 분석 (이미지 기반)
- Critical pitfall: AI 신뢰도 낮음, 일관성 부족

**Stack:** OpenAI Vision API, 자체 이미지 품질 검증 로직

**Research flag:** HIGH — AI 정확도 검증 어려움, 윤리/법적 리스크, 면책 조항 필요, 엔터테인먼트 위치 명확화

---

### Phase 6: Essential Management Features
**Rationale:** 차별화 검증 완료 후 전통적 기능 추가. 완전한 학원 관리 시스템으로.

**Delivers:**
- 출결 관리 (출석 체크, 보강 수업)
- 수강료 관리 (청구서, 수납, 미납)
- 학부모 소통 (공지, 알림)

**Addresses:**
- Table stakes: 출결, 수강료, 학부모 소통

**Stack:** 카카오 알림톡 연동 (선택), React Hook Form (폼 처리)

**Research flag:** LOW — 표준 CRUD 패턴, 한국 학원 시스템 벤치마크

---

### Phase 7: Reports & Career Guidance
**Rationale:** 모든 데이터 축적됨. 종합 보고서와 진로 가이드로 컨설팅 가치 완성.

**Delivers:**
- 상담 리포트 PDF 생성 (@react-pdf/renderer)
- 진로 가이드 (대학/학과 추천, 합격 예측)
- 보고서 캐싱 및 비동기 생성

**Addresses:**
- Differentiator: 상담 리포트, 진로 가이드
- Moderate pitfall: PDF 생성 병목

**Stack:** @react-pdf/renderer, BullMQ (비동기 큐), Redis (캐싱, 선택)

**Research flag:** MEDIUM — 대학 입시 정보 DB 연동(유웨이, 진학사), PDF 템플릿 디자인

---

### Phase 8: Analytics & Optimization
**Rationale:** 시스템 안정화 후 데이터 기반 인사이트 제공. 학원 경영 과학화.

**Delivers:**
- 학습 패턴 분석
- 성향-성적 상관관계
- 조기 경고 시스템

**Addresses:**
- Differentiator: 데이터 분석 및 인사이트
- Moderate pitfall: ML 데이터 드리프트

**Stack:** TanStack Query (실시간 데이터), Chart.js/Recharts (시각화)

**Research flag:** LOW — 기본 통계 분석, ML 모델 배포 시 모니터링 표준 패턴

---

### Phase Ordering Rationale

1. **Foundation first (Phase 1)**: 학생 데이터 없이는 분석 불가. 보안/법률 준수는 재작업 비용 최대.

2. **Differentiators before table stakes (Phase 2-5)**: 전통적 기능만으로는 무료 솔루션 대비 경쟁 불가. 차별화 가치 먼저 검증.

3. **Low-risk before high-risk (Phase 2 → 5)**: 계산 기반(사주, 성명학) → 검증된 심리학(MBTI) → AI 기반(관상, 손금) 순으로 위험도 상승.

4. **Dependencies drive order**: Phase 1 없이 Phase 2-8 불가, Phase 2-5 병렬 가능하나 통합은 순차 필요.

5. **Avoid critical pitfalls early**: 개인정보보호법(Phase 1), 사주 정확도(Phase 2), MBTI 신뢰도(Phase 3)는 재작업 비용 높음.

6. **Defer costly optimization**: Redis, 메시지 큐, 마이크로서비스는 Phase 7-8까지 불필요. 50-200명 규모는 모놀리스로 충분.

### Research Flags

**Phases needing deeper research:**
- **Phase 2 (사주/성명학):** 천문학 계산 복잡도 높음, 만세력 알고리즘 정확도 검증, 사주 전문가 자문 필요
- **Phase 5 (관상/손금 AI):** 윤리/법적 리스크, 정확도 검증 어려움, 면책 조항 법률 검토, 엔터테인먼트 포지셔닝
- **Phase 7 (진로 가이드):** 대학 입시 DB 연동 복잡도, API 라이선스 비용, 매년 데이터 업데이트 부담

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Authentication):** Clerk/NextAuth 공식 문서 충분, 한국 법률 검토만 필요
- **Phase 3 (MBTI):** 검증된 문항 세트 존재, 점수 계산 알고리즘 명확
- **Phase 6 (출결/수강료):** CRUD 표준 패턴, 한국 학원 시스템 벤치마크 가능
- **Phase 8 (Analytics):** 기본 통계 분석, 시각화 라이브러리 성숙

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | **HIGH** | Next.js, PostgreSQL, Clerk는 2026년 검증된 스택. 공식 문서 충분. 한국 전통 분석 라이브러리만 LOW (자체 구현 필요). |
| Features | **MEDIUM-HIGH** | Table stakes는 HIGH (다수 소스 일치). Differentiators는 MEDIUM (AI 정확도 검증 제한적). MVP 전략 명확. |
| Architecture | **MEDIUM** | Next.js 모던 패턴은 HIGH (공식 문서). AI 통합 패턴은 MEDIUM (프로덕션 사례 제한적). 50-200명 규모 적합성 확신. |
| Pitfalls | **HIGH** | 법률 요구사항 HIGH (공식 정부 소스). 기술 취약점 HIGH (CVE 데이터베이스). AI 실패 MEDIUM (일화적 증거). |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

연구에서 해결되지 않은 영역과 계획/실행 중 처리 방법입니다.

- **사주팔자 알고리즘 정확도**: 기존 소프트웨어(만세력닷컴, 사주카페) 대비 검증 필요. Phase 2 계획 단계에서 명리학 전문가 자문 권장. 최소 100개 샘플 비교 테스트.

- **MBTI 문항 라이선스**: MBTI Foundation 공식 문항 사용 시 라이선스 필요. Phase 3 계획 단계에서 무료 Five Factor Model 기반 대안(IPIP-NEO) 또는 라이선스 확보 결정.

- **관상/손금 법적 리스크**: 외모 기반 판단의 차별 소지, 면책 조항 필요성. Phase 5 계획 단계에서 법률 자문 받고 명시적으로 "전통 해석 엔터테인먼트"로 포지셔닝.

- **LLM API 비용 예측**: 50-200명 학생의 월간 보고서 생성 비용 불명확. Phase 4-7 실행 중 소규모 파일럿으로 비용 측정 후 캐싱 전략 조정.

- **대학 입시 정보 DB**: 유웨이, 진학사 등 입시 정보 API 비용 및 라이선스. Phase 7 계획 단계에서 API 협의 또는 공공 데이터(대입정보포털 어디가) 활용 결정.

- **Docker 프로덕션 배포**: 운영 서버(192.168.0.5) 환경변수 관리, 시크릿 관리 전략. Phase 1 실행 중 Docker secrets 또는 외부 시크릿 관리자 선택.

## Sources

### Primary (HIGH confidence)

**Official Documentation:**
- [Next.js Documentation](https://nextjs.org/docs) — App Router, Server Actions, Authentication
- [Prisma Documentation](https://www.prisma.io/docs) — ORM, migrations, PostgreSQL integration
- [Clerk Documentation](https://clerk.com/docs) — Multi-tenant authentication, organizations, roles
- [shadcn/ui Documentation](https://ui.shadcn.com/docs) — UI components, Tailwind integration
- [OpenAI API Pricing](https://openai.com/api/pricing/) — Vision API costs, token limits

**Korean Legal Requirements:**
- [한국 개인정보보호법 교육 분야](https://easylaw.go.kr/CSP/CnpClsMainBtr.laf?popMenu=ov&csmSeq=1702&ccfNo=4&cciNo=1&cnpClsNo=1) — Student data protection laws
- [개인정보보호위원회](https://www.pipc.go.kr/) — Official privacy guidelines

**Security Vulnerabilities:**
- [Next.js CVE-2025-29927 Authorization Bypass](https://www.akamai.com/blog/security-research/march-authorization-bypass-critical-nextjs-detections-mitigations) — Critical auth vulnerability
- [Next.js Security Guide 2025](https://www.turbostarter.dev/blog/complete-nextjs-security-guide-2025-authentication-api-protection-and-best-practices) — Defense in depth patterns

### Secondary (MEDIUM confidence)

**Technology Comparisons:**
- [Top 5 Authentication Solutions for Next.js 2026 — WorkOS](https://workos.com/blog/top-authentication-solutions-nextjs-2026)
- [Prisma vs Drizzle ORM in 2026 — Medium](https://medium.com/@thebelcoder/prisma-vs-drizzle-orm-in-2026-what-you-really-need-to-know-9598cf4eaa7c)
- [PostgreSQL vs MySQL vs MongoDB in 2026 — DEV](https://dev.to/pockit_tools/postgresql-vs-mysql-vs-mongodb-in-2026-the-honest-comparison-nobody-asked-for-5fkc)

**Korean Academy Systems:**
- [무료 학원관리프로그램 랠리즈](https://www.rallyz.co.kr/) — Feature benchmarking
- [어나더클래스 학원관리프로그램](https://www.anotherclass.co.kr/) — Korean academy patterns
- [Best Student Information Systems 2026](https://research.com/software/best-student-information-systems) — Global SIS features

**AI Personality Analysis:**
- [2026년, AI로 사주 보는 법](https://www.marieclairekorea.com/pinpage/2026/01/ai-2026/)
- [사주GPT - AI 사주 타로](https://www.sajugpt.co.kr/) — AI saju market validation
- [성명학 사주풀이 서비스 시스템 특허](https://patents.google.com/patent/KR102502645B1/ko) — Korean traditional analysis system

**Architecture Patterns:**
- [Modern Full Stack Application Architecture Using Next.js 15+](https://softwaremill.com/modern-full-stack-application-architecture-using-next-js-15/)
- [Build a Learning Management System in Next.js & Node.js](https://www.sevensquaretech.com/develop-learning-management-system-nextjs-nodejs-github-code/)

### Tertiary (LOW confidence, needs validation)

**Korean Traditional Analysis:**
- [@aharris02/bazi-calculator-by-alvamind](https://www.npmjs.com/package/@aharris02/bazi-calculator-by-alvamind) — Educational saju calculator (accuracy unverified)
- [Korean-Name-Hanja-Charset — GitHub](https://github.com/rutopio/Korean-Name-Hanja-Charset) — Hanja stroke count dataset
- [ChatGPT 사주 정확도 문제](https://brunch.co.kr/@chatgptsaju/13) — AI saju reliability concerns

**ML Production Pitfalls:**
- [AI Palm Reading Accuracy Issues](https://astrobotlab.com/is-online-palm-reading-accurate-what-ai-can-and-cant-do/) — Palmistry AI limitations
- [Palmistry Machine Learning Research](https://arxiv.org/html/2509.02248v1) — Academic research (limited dataset)
- [Silent ML Production Failures](https://medium.com/codetodeploy/the-silent-mistakes-that-make-your-ml-models-fail-in-production-4fe348acfa6c) — Data drift patterns

---

*Research completed: 2026-01-27*
*Ready for roadmap: yes*
