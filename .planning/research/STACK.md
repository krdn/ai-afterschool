# Technology Stack

**Project:** AI AfterSchool (학원 학생 관리 시스템)
**Researched:** 2026-01-27

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js | 15.x | Full-stack framework (App Router) | **HIGH confidence** - 이미 결정됨 (README 명시). 서버 컴포넌트와 서버 액션으로 API 엔드포인트 없이 데이터 처리 가능. SSR로 SEO와 초기 로딩 최적화. |
| React | 19.x | UI 라이브러리 | **HIGH** - Next.js 15의 표준 React 버전. Server Components와 Server Actions 지원. |
| JavaScript | ES2024 | 프로그래밍 언어 | **HIGH** - README에 명시된 기술 스택. TypeScript보다 러닝커브 낮음. |
| Tailwind CSS | 3.4.x | 스타일링 | **HIGH** - 2026년 Next.js 프로젝트의 사실상 표준. 빠른 개발, 일관된 디자인 시스템 구축 용이. |

### Database & ORM

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| PostgreSQL | 16.x | 주 데이터베이스 | **HIGH** - 학생 정보는 구조화된 관계형 데이터. 성적, 상담 기록, 출석 등 복잡한 조인 필요. ACID 보장으로 데이터 무결성 중요. 50-200명 규모에 충분한 성능. Docker 컨테이너로 운영 서버(192.168.0.5)에 배포 용이. |
| Prisma | 7.x | ORM | **MEDIUM** - 스키마 우선 접근으로 초보자 친화적. 타입 안전성 제공(JavaScript에서도 JSDoc으로 활용 가능). 마이그레이션 자동화. Drizzle보다 DX 우수하나 성능은 약간 떨어짐. 50-200명 규모에서는 성능 차이 무의미. |

**Alternative considered:** Drizzle ORM - SQL에 가까운 접근, 성능 우수하나 러닝커브 높음. 서버리스 최적화는 이 프로젝트에 불필요.

### Authentication & Authorization

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Clerk | Latest | 인증 및 사용자 관리 | **MEDIUM** - 2026년 Next.js 멀티테넌트 인증의 추천 솔루션. Organization 기능으로 학원(조직) 내 다중 선생님 계정 관리 용이. 역할 기반 권한 관리 내장. Next.js App Router 네이티브 지원. 무료 티어로 시작 가능(월 10,000 MAU). |

**Alternatives considered:**
- NextAuth.js (Auth.js) - 무료 오픈소스지만 설정 복잡. 조직/역할 관리 직접 구현 필요.
- WorkOS AuthKit - 엔터프라이즈 수준 기능, 과한 면 있음.

### UI Component Library

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| shadcn/ui | Latest | UI 컴포넌트 | **HIGH** - 2026년 Next.js의 사실상 표준. npm 패키지가 아닌 코드 복사 방식으로 커스터마이징 용이. Radix UI 기반으로 접근성 우수. Tailwind CSS와 완벽 통합. Server Components 지원. |
| Radix UI | Latest | Headless UI primitives | **HIGH** - shadcn/ui의 기반. Dialog, Dropdown, Select 등 인터랙티브 컴포넌트의 접근성과 키보드 내비게이션 자동 처리. |

### Form Handling & Validation

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React Hook Form | 7.x | 폼 상태 관리 | **HIGH** - 언컨트롤드 컴포넌트로 리렌더링 최소화. 성능 우수. shadcn/ui Form 컴포넌트와 통합. |
| Zod | 3.x | 스키마 검증 | **HIGH** - TypeScript 기반이지만 JavaScript에서도 런타임 검증 가능. React Hook Form의 @hookform/resolvers로 통합. 에러 메시지 커스터마이징 용이. |

### AI & Image Analysis

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| OpenAI API (GPT-4o) | gpt-4o | 관상/손금 이미지 분석, 학습 전략/진로 제안 | **HIGH** - Vision API로 이미지 분석 가능. $2.50/1M 입력 토큰, $10/1M 출력 토큰. 50-200명 학생 규모에서 비용 합리적. API로 쉽게 통합. |
| OpenAI API (GPT-4o-mini) | gpt-4o-mini | 간단한 텍스트 분석, MBTI 해석 | **HIGH** - $0.15/1M 입력, $0.60/1M 출력. 비용 효율적. 성향 요약 등 가벼운 작업용. |

**Why OpenAI:**
- Vision API로 관상/손금 사진 분석 직접 가능
- 프롬프트 엔지니어링으로 성향 분석 로직 구현 (모델 학습 불필요)
- 한국어 지원 우수
- API 호출로 간단 통합, 인프라 관리 불필요

**Alternatives considered:**
- Google Gemini - Vision 기능 있으나 한국 전통 해석(사주, 성명학) 이해도 낮을 수 있음
- 자체 ML 모델 - 학습 데이터 확보 및 유지보수 부담. 50-200명 규모에 과함

### File Upload & Storage

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Cloudinary | Latest | 이미지 저장 및 변환 | **MEDIUM** - 학생 사진, 손금/관상 이미지 저장. 자동 리사이징, 포맷 변환, CDN 제공. 무료 티어 25GB 저장, 25GB 대역폭. Next.js 통합 라이브러리(next-cloudinary) 제공. URL만 DB 저장. |

**Alternative considered:**
- AWS S3 - 저렴하나 추가 설정 필요(CORS, Presigned URL). Cloudinary가 DX 우수.
- 로컬 파일시스템 - Docker 볼륨 관리 복잡, 백업 어려움.

### PDF Generation

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @react-pdf/renderer | 4.x | 상담 보고서 PDF 생성 | **HIGH** - React 컴포넌트로 PDF 레이아웃 작성. Next.js 서버 액션에서 실행 가능. 2.6M 주간 다운로드. React 19 호환. JSX 기반으로 유지보수 용이. |
| react-pdf-tailwind | Latest | Tailwind 스타일 PDF 적용 | **LOW** - Tailwind CSS를 @react-pdf/renderer에서 사용 가능하게 함. 선택적 사용. |

**Alternative considered:**
- jsPDF - 클라이언트 사이드 생성. DOM 기반으로 한글/복잡한 레이아웃 처리 어려울 수 있음.
- Puppeteer - HTML을 PDF로 변환. 무겁고 Docker 이미지 크기 증가.

### State Management

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Zustand | 5.x | 클라이언트 상태 관리 | **MEDIUM** - 번들 사이즈 3KB. 보일러플레이트 최소. Next.js SSR 지원. 학생 목록 필터, UI 상태 등 간단한 전역 상태 관리. React Context보다 성능 우수. |

**When to use:**
- 학생 목록 필터 상태 (학년, 학교 등)
- 사이드바/모달 UI 상태
- 다중 탭 간 상태 공유

**Not needed for:**
- 서버 데이터 (React Query 또는 Next.js 서버 컴포넌트로 처리)
- 폼 상태 (React Hook Form)

**Alternative considered:**
- Jotai - 아토믹 접근, 파인그레인 리렌더링 최적화. 이 프로젝트 규모에 과함.
- Redux Toolkit - 강력하나 보일러플레이트 많음. 50-200명 규모에 불필요.

### Data Fetching & Caching

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| TanStack Query (React Query) | 5.x | 서버 상태 관리 | **MEDIUM** - 캐싱, 리페칭, 낙관적 업데이트 자동화. Next.js 서버 컴포넌트와 병행 사용. 클라이언트 컴포넌트에서 데이터 페칭 시 사용. Prefetching으로 UX 향상. |

**When to use:**
- 클라이언트 사이드 데이터 페칭 (검색, 필터링)
- 실시간성 필요한 데이터 (출석 현황)

**When NOT to use:**
- 정적 데이터는 Next.js 서버 컴포넌트로 직접 페칭

### Special Purpose Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | 4.x | 날짜 처리 | **HIGH** - 생년월일 파싱, 나이 계산, 사주 계산용 날짜 변환. Tree-shakable로 번들 작음. 한국 로케일 지원. |
| @aharris02/bazi-calculator-by-alvamind | Latest | 사주팔자 계산 | **LOW** - npm 패키지로 사주 사주(Year/Month/Day/Hour) 계산. IANA 타임존 지원. 최근 업데이트(2026). **주의:** 교육용이므로 결과 검증 필요. 자체 로직 구현 고려. |
| hangul-js | 0.2.x | 한글 처리 | **LOW** - 한글 초성/중성/종성 분리. 성명학 획수 계산 시 보조 도구. 6년 전 업데이트로 유지보수 우려. 필요 시 자체 구현 검토. |

**Korean Name Hanja Stroke Count:**
- **자체 구현 권장** - 전용 라이브러리 없음. [Korean-Name-Hanja-Charset](https://github.com/rutopio/Korean-Name-Hanja-Charset) 데이터셋 활용. 대법원 허용 한자 9,389자 포함. JSON으로 획수 매핑 테이블 구축.

**MBTI Analysis:**
- **자체 구현 또는 OpenAI API** - 별도 라이브러리 불필요. 16개 유형 분류는 설문 결과 점수 계산으로 처리. 해석은 OpenAI API로 생성.

### Development Tools

| Tool | Version | Purpose | Why |
|------|---------|---------|-----|
| ESLint | 9.x | 린터 | **HIGH** - Next.js 기본 설정. 코드 품질 유지. |
| Prettier | 3.x | 코드 포매터 | **HIGH** - 일관된 코드 스타일. ESLint와 통합. |
| Husky | 9.x | Git hooks | **MEDIUM** - 커밋 전 린트 검사. 코드 품질 자동화. |
| Docker | 27.x | 컨테이너화 | **HIGH** - README 명시. 운영 서버(192.168.0.5) 배포. |
| Docker Compose | 2.x | 멀티 컨테이너 관리 | **HIGH** - Next.js + PostgreSQL 통합 관리. |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Database | PostgreSQL | MongoDB | 학생 정보는 구조화된 관계형 데이터. 복잡한 조인과 트랜잭션 필요. NoSQL 이점 없음. |
| ORM | Prisma | Drizzle | Drizzle은 SQL 가까운 접근, 성능 우수. 하지만 Prisma의 DX가 초보자/유지보수에 유리. 50-200명 규모에서 성능 차이 미미. |
| Authentication | Clerk | NextAuth.js | NextAuth는 무료지만 조직/역할 관리 직접 구현. Clerk의 Organization 기능이 멀티테넌트에 최적화. |
| UI Components | shadcn/ui | Material-UI | Material-UI는 디자인 시스템 고정. shadcn/ui는 커스터마이징 용이, 코드 소유권, Tailwind 통합. |
| State Management | Zustand | Redux Toolkit | Redux는 강력하나 보일러플레이트 많음. 이 규모에 과함. Zustand로 충분. |
| AI Image Analysis | OpenAI Vision | Google Gemini | Gemini도 Vision 지원하나 한국 전통 해석 프롬프트 이해도 검증 필요. OpenAI가 한국어 지원 우수. |
| File Storage | Cloudinary | AWS S3 | S3는 저렴하나 설정 복잡(CORS, Presigned URL). Cloudinary가 DX 우수, 변환 기능 내장. |
| PDF Generation | @react-pdf/renderer | jsPDF | jsPDF는 클라이언트 사이드, DOM 기반. 한글 복잡 레이아웃 처리 어려움. @react-pdf/renderer는 React 컴포넌트로 레이아웃 작성, 서버 사이드 생성. |

## What NOT to Use

### 1. TypeScript
- **이유:** README에 JavaScript 명시. 프로젝트 초기 결정 존중.
- **대안:** JSDoc으로 타입 힌트 제공. Prisma가 자동 생성한 타입 활용.

### 2. MongoDB
- **이유:** 학생 정보는 구조화된 관계형 데이터. 성적, 출석, 상담 기록 간 관계 복잡. JOIN 필요. ACID 보장 중요.
- **대안:** PostgreSQL

### 3. NextAuth.js (Auth.js)
- **이유:** 무료 오픈소스지만 멀티테넌트(조직/역할) 직접 구현. 설정 복잡. 학원 관리 시스템에 Clerk의 Organization 기능이 적합.
- **단, 예산 제약 시 고려 가능**

### 4. 자체 ML 모델 학습
- **이유:** 관상/손금 이미지 분석용 모델 학습은 데이터 확보, 학습, 유지보수 부담. 50-200명 규모에 과함.
- **대안:** OpenAI Vision API로 프롬프트 엔지니어링

### 5. GraphQL
- **이유:** Next.js App Router의 Server Actions로 API 엔드포인트 불필요. REST도 과함. 직접 서버 함수 호출.
- **대안:** Server Actions (Server Components에서 직접 DB 쿼리)

### 6. Redis
- **이유:** 50-200명 규모에서 캐싱 레이어 불필요. Next.js 빌트인 캐싱과 React Query로 충분.
- **나중에 고려:** 사용자 1,000명 이상 시 세션/캐싱용 검토.

### 7. Microservices Architecture
- **이유:** 모놀리식으로 시작. 복잡도 불필요. Next.js 단일 앱으로 충분.
- **나중에 고려:** 기능 확장 시 모듈화된 서비스 분리.

## Installation

### 1. Core Dependencies

```bash
# Next.js 프로젝트 생성 (이미 존재)
# npx create-next-app@latest --js --tailwind --app --eslint

# Database & ORM
npm install @prisma/client
npm install -D prisma

# Authentication
npm install @clerk/nextjs

# UI Components (shadcn/ui는 개별 설치)
npx shadcn@latest init
npx shadcn@latest add button input label card form dialog select

# Form & Validation
npm install react-hook-form zod @hookform/resolvers

# State Management
npm install zustand

# Data Fetching
npm install @tanstack/react-query

# Date Utilities
npm install date-fns

# AI
# OpenAI API는 서버 환경변수로 키 설정, fetch로 호출

# File Upload
npm install next-cloudinary

# PDF Generation
npm install @react-pdf/renderer

# Optional: Saju Calculation
npm install @aharris02/bazi-calculator-by-alvamind

# Optional: Hangul Processing
npm install hangul-js
```

### 2. Dev Dependencies

```bash
npm install -D eslint prettier eslint-config-prettier
npm install -D husky lint-staged
```

### 3. Database Setup

```bash
# Prisma 초기화
npx prisma init

# 스키마 작성 후 마이그레이션
npx prisma migrate dev --name init

# Prisma Studio (DB GUI)
npx prisma studio
```

## Environment Variables (.env.local)

```bash
# Database (운영 서버 192.168.0.5)
DATABASE_URL="postgresql://user:password@192.168.0.5:5432/afterschool?schema=public"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# OpenAI API
OPENAI_API_KEY=sk-...

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## Docker Configuration

### Dockerfile (Next.js)

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/afterschool
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      - CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
    depends_on:
      - db
    volumes:
      - ./data:/app/data

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=afterschool
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  pgdata:
```

## Technology Versions (2026년 1월 기준)

| Technology | Recommended Version | Status |
|------------|---------------------|--------|
| Next.js | 15.1.x | **Stable** - App Router 성숙, React 19 지원 |
| React | 19.0.x | **Stable** - Server Components, Actions 안정화 |
| PostgreSQL | 16.6 | **Stable** - LTS 버전 |
| Prisma | 7.2.x | **Stable** - PostgreSQL 16 완벽 지원 |
| Clerk | 6.x | **Stable** - Next.js 15 지원 |
| shadcn/ui | Latest | **Active** - 지속적 업데이트 |
| Tailwind CSS | 3.4.x | **Stable** |
| Zustand | 5.0.x | **Stable** |
| TanStack Query | 5.62.x | **Stable** |
| React Hook Form | 7.54.x | **Stable** |
| Zod | 3.24.x | **Stable** |
| @react-pdf/renderer | 4.2.x | **Stable** - React 19 호환 |
| OpenAI API | gpt-4o, gpt-4o-mini | **Production** |

## Confidence Assessment

| Category | Confidence | Rationale |
|----------|------------|-----------|
| Core Framework (Next.js, React, Tailwind) | **HIGH** | README 명시, 2026년 Next.js 표준 스택. 공식 문서 확인. |
| Database (PostgreSQL) | **HIGH** | 관계형 데이터 요구사항, 다수 소스 일치. |
| ORM (Prisma) | **MEDIUM** | Drizzle과 비교. DX 우선 선택. 성능은 규모에서 무의미. |
| Authentication (Clerk) | **MEDIUM** | 2026년 추천 솔루션 확인. 무료 티어 제약 검증 필요. |
| UI Components (shadcn/ui) | **HIGH** | 2026년 Next.js 사실상 표준. 공식 문서 확인. |
| AI (OpenAI Vision) | **HIGH** | Vision API 공식 문서 확인. 가격 정책 최신. |
| File Storage (Cloudinary) | **MEDIUM** | S3 대비 DX 우수. 무료 티어 제약 검증 필요. |
| PDF (react-pdf/renderer) | **HIGH** | React 19 호환 확인. 활발한 커뮤니티. |
| State Management (Zustand) | **MEDIUM** | 2026년 추천 솔루션. 프로젝트 규모 적합. |
| Saju Library | **LOW** | npm 패키지 존재하나 최신성/정확도 검증 필요. 자체 구현 권장. |
| Hanja Stroke Count | **LOW** | 전용 라이브러리 없음. 자체 구현 필요. |

## Special Considerations for Korean Traditional Analysis

### 1. 사주팔자 (Saju - Four Pillars)
- **라이브러리:** @aharris02/bazi-calculator-by-alvamind (교육용)
- **주의사항:** 결과 정확도 검증 필요. 음력-양력 변환 정확성 중요.
- **권장:** 자체 로직 구현 또는 OpenAI API로 전통 해석 보완
- **타임존:** Asia/Seoul (KST) 필수

### 2. 성명학 (Name Analysis)
- **한자 획수:** [Korean-Name-Hanja-Charset](https://github.com/rutopio/Korean-Name-Hanja-Charset) 데이터셋 활용
- **구현:** JSON 매핑 테이블 자체 구축 (대법원 허용 9,389자)
- **수리 계산:** 천격, 인격, 지격, 외격, 총격 로직 자체 구현

### 3. 관상/손금 (Face/Palm Reading)
- **기술:** OpenAI Vision API (GPT-4o)
- **방식:** 이미지 + 프롬프트로 성향 키워드 추출
- **주의:** 전통적 해석은 프롬프트 엔지니어링 필요. 한국 관상/손금 전문가 자문 권장.

### 4. MBTI
- **라이브러리:** 불필요
- **구현:** 16개 유형 설문 + 점수 계산
- **해석:** OpenAI API로 맞춤형 해석 생성

## Sources

### Official Documentation (HIGH Confidence)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/docs)
- [OpenAI API Pricing](https://openai.com/api/pricing/)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)

### Research & Comparisons (MEDIUM Confidence)
- [Top 5 authentication solutions for Next.js 2026 — WorkOS](https://workos.com/blog/top-authentication-solutions-nextjs-2026)
- [Prisma vs Drizzle ORM in 2026 — Medium](https://medium.com/@thebelcoder/prisma-vs-drizzle-orm-in-2026-what-you-really-need-to-know-9598cf4eaa7c)
- [PostgreSQL vs MySQL vs MongoDB in 2026 — DEV](https://dev.to/pockit_tools/postgresql-vs-mysql-vs-mongodb-in-2026-the-honest-comparison-nobody-asked-for-5fkc)
- [State Management in 2025: Context, Redux, Zustand, or Jotai](https://dev.to/hijazi313/state-management-in-2025-when-to-use-context-redux-zustand-or-jotai-2d2k)
- [Top 6 Open-Source PDF Libraries for React](https://blog.react-pdf.dev/6-open-source-pdf-generation-and-modification-libraries-every-react-dev-should-know-in-2025)

### Community Resources (MEDIUM Confidence)
- [Next.js School Management System Template — GitHub](https://github.com/zxmodren/Nextjs-SchoolManagementSystem-Template)
- [Best Practices of Next.js Development in 2026](https://www.serviots.com/blog/nextjs-development-best-practices)
- [Cloudinary with Next.js](https://cloudinary.com/blog/next-js-cloudinary-upload-transform-moderate-images)

### NPM Packages (Verified)
- [@aharris02/bazi-calculator-by-alvamind](https://www.npmjs.com/package/@aharris02/bazi-calculator-by-alvamind)
- [Korean-Name-Hanja-Charset — GitHub](https://github.com/rutopio/Korean-Name-Hanja-Charset)

---

**Last Updated:** 2026-01-27
**Research Mode:** Ecosystem (Stack)
**Overall Confidence:** MEDIUM-HIGH (핵심 스택 HIGH, 한국 전통 분석 라이브러리 LOW)
