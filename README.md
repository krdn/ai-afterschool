# AI AfterSchool

> 초·중·고 학원에서 대학입시를 목표로 학생을 효율적으로 관리하기 위해 AI를 활용한 다양한 서비스 제공

## 📋 목차 (Table of Contents)

- [프로젝트 개요](#-프로젝트-개요)
- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [프로젝트 구조](#-프로젝트-구조)
- [개발 환경 설정](#-개발-환경-설정)
- [데이터베이스](#-데이터베이스)
- [개발 가이드](#-개발-가이드)

## 🎯 프로젝트 개요

학생의 성적 향상과 진로 탐색을 돕기 위해 다양한 성향 분석 도구를 통합적으로 제공합니다. AI가 학생의 데이터를 종합 분석하여 맞춤형 학습 전략을 제안합니다.

### 핵심 가치
- **통합적 성향 분석**: 사주, 성명학, MBTI, 관상, 손금 분석을 통합
- **AI 기반 인사이트**: Anthropic Claude API를 활용한 개인별 맞춤형 분석
- **실시간 진행률 관리**: MBTI 설문 자동 저장으로 중단되어도 이어서 작성

## ✨ 주요 기능

### 1. 학생 성향 분석

| 분석 유형 | 설명 | 기술 |
|-----------|------|------|
| **사주 분석** | 생년월일시 기반 사주팔자(年月日時) 자동 계산 | 태양력/음력 변환, 절기 계산 |
| **성명학 분석** | 한글/한자 성명 획수 및 수리(원격/형격/이격/정격) 분석 | 한자 자동 변환, 획수 DB |
| **관상 분석** | 학생 사진 업로드 시 성향 키워드 추출 | Claude Vision API |
| **손금 분석** | 손바닥 사진 업로드 시 성향 분석 | Claude Vision API |
| **MBTI 분석** | 60문항 설문 및 자동 저장, 실시간 진행률 표시 | Zod 검증, Debounce |
| **통합 성향 분석** | 위 모든 정보를 기반으로 AI가 종합 성향 판단 | Claude Integration Prompts |

### 2. 학습 전략 추천 (개발 중)
- 통합 성향 분석 결과 기반 맞춤형 학습 전략
- 학생 성격에 맞는 학습 방법 제안

## 🛠 기술 스택

### Frontend
| 기술 | 버전 | 용도 |
|------|------|------|
| **Next.js** | 15.5 | App Router, Server Actions |
| **React** | 19.2 | UI 라이브러리 |
| **TypeScript** | 5.x | 타입 안전성 |
| **Tailwind CSS** | 4.x | 스타일링 |
| **Radix UI** | latest | 접근 가능한 컴포넌트 |
| **React Hook Form** | 7.71 | 폼 관리 |
| **Zod** | 4.3 | 스키마 검증 |

### Backend
| 기술 | 버전 | 용도 |
|------|------|------|
| **Node.js** | 20.x | 런타임 |
| **Prisma** | 7.3 | ORM |
| **PostgreSQL** | latest | 데이터베이스 |

### AI & External Services
| 서비스 | 용도 |
|--------|------|
| **Anthropic Claude** | AI 이미지 분석, 통합 성향 분석 |
| **Cloudinary** | 이미지 저장/관리 |
| **Resend** | 이메일 발송 (비밀번호 재설정) |

### Development Tools
| 도구 | 용도 |
|------|------|
| **ESLint** | 린팅 |
| **Vitest** | 테스트 |
| **Playwright** | E2E 테스트 |
| **tsx** | TypeScript 실행 |

## 📁 프로젝트 구조

```
ai-afterschool/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # 인증 레이아웃 (로그인, 비밀번호 재설정)
│   │   ├── (dashboard)/       # 대시보드 레이아웃
│   │   │   └── students/      # 학생 관리 페이지
│   │   └── api/               # API 라우트 (Cloudinary 서명 등)
│   ├── components/            # React 컴포넌트
│   │   ├── students/          # 학생 관련 컴포넌트
│   │   ├── ui/                # 재사용 UI 컴포넌트
│   │   └── layout/            # 레이아웃 컴포넌트
│   ├── lib/
│   │   ├── actions/           # Server Actions
│   │   │   ├── auth.ts        # 인증 관련
│   │   │   ├── students.ts    # 학생 CRUD
│   │   │   ├── mbti-survey.ts # MBTI 설문
│   │   │   ├── ai-image-analysis.ts # AI 이미지 분석
│   │   │   └── personality-integration.ts # 통합 성향 분석
│   │   ├── analysis/          # 분석 로직
│   │   │   ├── saju.ts        # 사주 계산
│   │   │   ├── name-numerology.ts # 성명학
│   │   │   ├── dst-kr.ts      # 한국 표준시
│   │   │   ├── solar-terms.ts # 절기 계산
│   │   │   └── mbti-scoring.ts # MBTI 점수 계산
│   │   ├── ai/
│   │   │   ├── claude.ts      # Claude API 클라이언트
│   │   │   ├── prompts.ts     # AI 프롬프트
│   │   │   └── integration-prompts.ts # 통합 분석 프롬프트
│   │   ├── db/                # DB 헬퍼 함수
│   │   ├── validations/       # Zod 스키마
│   │   └── utils.ts           # 유틸리티
│   ├── middleware.ts          # Next.js 미들웨어 (인증)
│   └── types/                 # TypeScript 타입 정의
├── prisma/
│   ├── schema.prisma          # DB 스키마
│   └── seed.ts               # 초기 데이터
├── .planning/                # 프로젝트 계획 (GSD 방법론)
│   └── phases/               # 개발 단계별 계획
└── public/                   # 정적 파일
```

## 🚀 개발 환경 설정

### 사전 요구사항
- Node.js 20+
- PostgreSQL 데이터베이스
- Anthropic API Key

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env` 파일 생성:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ai_afterschool"

# Anthropic Claude
ANTHROPIC_API_KEY="your_anthropic_api_key"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
CLOUDINARY_UPLOAD_PRESET="your_upload_preset"

# NextAuth
NEXTAUTH_SECRET="your_nextauth_secret"
NEXTAUTH_URL="http://localhost:3000"

# Resend (이메일)
RESEND_API_KEY="your_resend_api_key"
```

### 3. 데이터베이스 설정
```bash
# Prisma Client 생성
npx prisma generate

# 마이그레이션 실행
npx prisma migrate dev

# 시드 데이터 삽입 (선택)
npm run seed
```

### 4. 개발 서버 실행
```bash
npm run dev
```
→ http://localhost:3000

## 🗄 데이터베이스

### 주요 모델

| 모델 | 설명 |
|------|------|
| **Teacher** | 교사 계정 |
| **Student** | 학생 기본 정보 |
| **SajuAnalysis** | 사주 분석 결과 |
| **NameAnalysis** | 성명학 분석 결과 |
| **MbtiSurveyDraft** | MBTI 설문 임시 저장 |
| **MbtiAnalysis** | MBTI 분석 결과 |
| **FaceAnalysis** | 관상 분석 결과 |
| **PalmAnalysis** | 손금 분석 결과 |
| **PersonalitySummary** | 통합 성향 요약 |
| **StudentImage** | 학생 사진 (Cloudinary URL) |

### Prisma Studio
```bash
npx prisma studio
```
→ http://localhost:5555

## 📚 개발 가이드

### 커밋 컨벤션
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 작성/수정
refactor: 코드 리팩토링
test: 테스트 추가/수정
chore: 빌드, 설정 등 기타 작업
```

### GitHub Issue Labels
이 프로젝트는 카테고리별 라벨 시스템을 사용합니다:

| 카테고리 | 예시 |
|----------|------|
| **작업 유형** | `feat`, `fix`, `refactor`, `docs`, `test`, `chore` |
| **기능 영역** | `area:students`, `area:ai`, `area:backend`, `area:database` |
| **우선순위** | `priority:critical`, `priority:high`, `priority:medium`, `priority:low` |
| **상태** | `status:in-progress`, `status:review`, `status:blocked` |

## 📌 현재 진행 상황

| 단계 | 상태 | 설명 |
|------|------|------|
| 01. 인증 시스템 | ✅ 완료 | 교사 로그인, 비밀번호 재설정 |
| 02. 파일 인프라 | ✅ 완료 | Cloudinary 이미지 업로드 |
| 03. 사주/성명학 | ✅ 완료 | 사주, 성명학 분석 구현 |
| 04. MBTI 분석 | ✅ 완료 | 설문, 자동 저장, 분석 |
| 05. AI 이미지 분석 | ✅ 완료 | 관상, 손금 분석 |
| 06. 통합 성향 분석 | 🚧 진행 중 | 모든 분석 통합, 맞춤형 학습 전략 |

## 🤝 기여 방법

1. 이슈를 생성하고 라벨을 지정하세요
2. 기능 브랜치를 생성하세요: `git checkout -b feat/feature-name`
3. 변경 사항을 커밋하세요: `git commit -m "feat: add feature"`
4. 브랜치에 푸시하세요: `git push origin feat/feature-name`
5. Pull Request를 생성하세요

## 📄 라이선스

Copyright © 2025 AI AfterSchool
