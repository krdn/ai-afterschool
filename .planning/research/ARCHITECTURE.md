# Architecture Patterns

**Domain:** 학원 학생 관리 시스템 with AI 성향 분석
**Researched:** 2026-01-27
**Overall confidence:** MEDIUM (verified with multiple 2026 sources, but specific AI integration patterns require validation)

## Executive Summary

학원 학생 관리 시스템은 **3-tier 아키텍처**를 기반으로 구성하되, Next.js App Router의 Server Components와 Server Actions를 활용한 모던 풀스택 패턴을 채택합니다. 핵심은 **학생 정보 관리를 중심으로 데이터가 흐르고**, AI 분석 기능들이 모듈식으로 연결되는 구조입니다.

**핵심 아키텍처 원칙:**
1. **Student Data as Source of Truth** - 모든 분석과 제안은 학생 정보 기반
2. **Modular AI Services** - 각 분석 기능(MBTI, 사주, 관상 등)은 독립적 모듈
3. **Server-Side Heavy** - 민감한 데이터와 AI 처리는 서버에서
4. **Feature-Based Organization** - 도메인별로 코드 구조화

## Recommended Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                       │
│  Next.js App Router (Server Components + Client Components)     │
│                                                                   │
│  /app/                                                           │
│  ├── (auth)/           # 인증 그룹                               │
│  ├── (dashboard)/      # 대시보드 그룹                           │
│  │   ├── students/     # 학생 관리                              │
│  │   ├── analysis/     # 성향 분석                              │
│  │   └── reports/      # 보고서                                 │
│  └── api/              # API Routes (필요시)                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                        APPLICATION LAYER                         │
│  Server Actions + Business Logic                                │
│                                                                   │
│  /src/features/                                                  │
│  ├── students/         # 학생 CRUD 로직                          │
│  ├── auth/             # 인증 로직                               │
│  ├── analysis/         # 분석 오케스트레이션                     │
│  │   ├── mbti/                                                   │
│  │   ├── saju/                                                   │
│  │   ├── name-study/                                             │
│  │   ├── face/                                                   │
│  │   └── palm/                                                   │
│  └── reports/          # 보고서 생성                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                           DATA LAYER                             │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ PostgreSQL   │  │ File Storage │  │ External AI  │          │
│  │              │  │ (Local/S3)   │  │ APIs         │          │
│  │ - 학생 정보   │  │              │  │              │          │
│  │ - 분석 결과   │  │ - 학생 사진   │  │ - 관상 분석   │          │
│  │ - 사용자      │  │ - 손금 사진   │  │ - 손금 분석   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

## Component Boundaries

| Component | Responsibility | Communicates With | Notes |
|-----------|---------------|-------------------|-------|
| **Authentication System** | 선생님 로그인/세션 관리 | Database, Middleware | NextAuth.js 또는 AuthKit 권장 |
| **Student Management** | 학생 CRUD, 검색, 목록 | Database, File Storage | 모든 기능의 기반 |
| **File Upload Service** | 사진 업로드/저장/조회 | File Storage, Student Management | 학생 사진, 손금 사진 처리 |
| **MBTI Analysis** | 설문 기반 MBTI 판정 | Database | 자체 로직, 외부 API 불필요 |
| **Saju Calculator** | 사주팔자 계산 | Database | 만세력 로직 필요 (1900-2050) |
| **Name Study Calculator** | 성명학 획수/수리 분석 | Database | 한글/한자 획수 DB 필요 |
| **Face Analysis Service** | 관상 AI 분석 | File Storage, External AI API | 이미지 → AI → 키워드 |
| **Palm Analysis Service** | 손금 AI 분석 | File Storage, External AI API | 이미지 → AI → 성향 |
| **Report Generator** | 종합 보고서 PDF 생성 | All Analysis Modules, Database | Puppeteer 또는 react-pdf |
| **AI Strategy Advisor** | 학습 전략/진로 제안 | Analysis Results, LLM API | GPT-4 등 활용 |

### Component 의존성 계층

```
Level 1 (Foundation):
  - Authentication System
  - Student Management
  - File Upload Service

Level 2 (Analysis - Independent):
  - MBTI Analysis
  - Saju Calculator
  - Name Study Calculator
  - Face Analysis Service
  - Palm Analysis Service

Level 3 (Synthesis):
  - AI Strategy Advisor
  - Report Generator
```

**Level 1이 없으면 Level 2, 3 작동 불가. Level 2 모듈들은 서로 독립적.**

## Data Flow

### 1. Student Registration Flow

```
선생님 입력
  ↓
[Server Action] createStudent()
  ↓
Validate → Store in DB → Upload Photo (optional)
  ↓
Return Student ID
  ↓
Redirect to Student Detail Page
```

### 2. Analysis Request Flow

```
선생님이 분석 요청 (학생 선택)
  ↓
[Server Component] Load Student Data
  ↓
분석 타입별 분기:
  ├─ MBTI: Survey → Calculate → Store
  ├─ Saju: Birthday → Calculate (만세력) → Store
  ├─ Name Study: Name → Calculate (획수) → Store
  ├─ Face: Photo → AI API → Parse → Store
  └─ Palm: Photo → AI API → Parse → Store
  ↓
Store Analysis Result in DB
  ↓
Display Result + Update UI
```

### 3. Report Generation Flow

```
선생님이 보고서 요청
  ↓
[Server Action] generateReport(studentId)
  ↓
Query:
  - Student Info
  - All Analysis Results
  - AI Strategy Recommendations
  ↓
Render HTML Template with Data
  ↓
Convert to PDF (Puppeteer/react-pdf)
  ↓
Stream PDF to Browser
```

### 4. AI Strategy Recommendation Flow

```
Trigger: After all analyses complete
  ↓
[Server Action] generateStrategy(studentId)
  ↓
Aggregate All Analysis Results
  ↓
Call LLM API (GPT-4) with:
  - Student profile
  - Analysis results
  - Prompt template
  ↓
Parse LLM Response
  ↓
Store Recommendations in DB
  ↓
Display to Teacher
```

## Patterns to Follow

### Pattern 1: Server Actions for Mutations

**What:** Next.js 15+ App Router의 Server Actions를 모든 데이터 변경에 사용

**When:** Form submission, 데이터 생성/수정/삭제, 파일 업로드

**Why:**
- Type-safe, 클라이언트 번들 크기 감소
- Progressive enhancement 지원
- API Routes 불필요

**Example:**
```typescript
// src/features/students/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'

export async function createStudent(formData: FormData) {
  const name = formData.get('name') as string
  const birthday = formData.get('birthday') as string

  // Validate
  if (!name || !birthday) {
    return { error: '필수 정보를 입력해주세요' }
  }

  // Insert to DB
  const student = await db.student.create({
    data: { name, birthday }
  })

  // Revalidate cache
  revalidatePath('/students')

  return { success: true, studentId: student.id }
}
```

### Pattern 2: Feature-Based Module Organization

**What:** 기능(feature)별로 관련 코드를 함께 배치

**When:** 프로젝트 구조 설계 시

**Why:**
- 응집도 높음, 결합도 낮음
- 코드 찾기 쉬움
- 기능 단위로 테스트/배포 가능

**Structure:**
```
src/features/
├── students/
│   ├── components/
│   │   ├── StudentForm.tsx
│   │   └── StudentList.tsx
│   ├── actions.ts        # Server Actions
│   ├── queries.ts        # DB Queries
│   └── types.ts          # TypeScript Types
├── analysis/
│   ├── mbti/
│   ├── saju/
│   └── ...
```

### Pattern 3: Separation of Calculation vs AI

**What:** 계산 가능한 분석(사주, 성명학)과 AI 기반 분석(관상, 손금)을 명확히 구분

**When:** 분석 모듈 설계 시

**Why:**
- 계산 로직: 신뢰성 100%, 비용 0, 속도 빠름
- AI 분석: 신뢰성 변동, API 비용, 속도 느림
- 다른 에러 처리 전략 필요

**Implementation:**
```typescript
// Calculation-based (Deterministic)
export async function calculateSaju(birthday: Date) {
  // Pure function - always same output for same input
  return sajuAlgorithm(birthday)
}

// AI-based (Non-deterministic)
export async function analyzeFace(imageUrl: string) {
  try {
    const result = await aiService.analyze(imageUrl)
    return result
  } catch (error) {
    // Retry logic, fallback, error handling
    return { error: 'AI 분석 실패', retry: true }
  }
}
```

### Pattern 4: Multi-Tenant Authentication via Middleware

**What:** Next.js Middleware로 선생님 세션 검증 및 학생 데이터 접근 제어

**When:** 다중 선생님 계정 구현 시

**Why:**
- Edge에서 빠르게 인증 체크
- 모든 route에 자동 적용
- DB 쿼리에 teacher_id 자동 필터

**Example:**
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const session = await getSession(request)

  if (!session) {
    return NextResponse.redirect('/login')
  }

  // Add teacher_id to headers for downstream use
  const headers = new Headers(request.headers)
  headers.set('x-teacher-id', session.teacherId)

  return NextResponse.next({ headers })
}

export const config = {
  matcher: ['/students/:path*', '/analysis/:path*']
}
```

### Pattern 5: Progressive AI Integration

**What:** 분석 결과를 단계적으로 수집하고, 사용 가능한 데이터만으로 제안 생성

**When:** 모든 분석이 완료되지 않은 상태에서도 가치 제공

**Why:**
- 일부 분석 실패해도 시스템 사용 가능
- 사용자는 즉시 피드백 받음
- 점진적 개선 가능

**Implementation:**
```typescript
export async function generateStrategy(studentId: string) {
  const analyses = await db.analysis.findMany({
    where: { studentId, completed: true }
  })

  // Work with whatever data is available
  const prompt = buildPrompt(analyses)  // Smart prompt building
  const strategy = await llm.generate(prompt)

  return {
    strategy,
    basedOn: analyses.map(a => a.type),
    missing: getMissingAnalyses(analyses)
  }
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Monolithic Analysis Function

**What:** 모든 분석을 한 함수에서 순차적으로 처리

**Why bad:**
- 한 분석 실패하면 전체 실패
- 사용자는 모든 분석 끝날 때까지 대기
- 재시도 불가능

**Instead:**
```typescript
// BAD
async function analyzeAll(studentId) {
  const mbti = await analyzeMBTI()      // 10초
  const saju = await analyzeSaju()       // 5초
  const face = await analyzeFace()       // 30초
  return { mbti, saju, face }            // 총 45초 대기
}

// GOOD
async function analyzeAll(studentId) {
  // Parallel + independent
  const [mbti, saju, face] = await Promise.allSettled([
    analyzeMBTI(),
    analyzeSaju(),
    analyzeFace()
  ])

  // Handle each result independently
  return results.map(handleResult)
}
```

### Anti-Pattern 2: Client-Side AI API Calls

**What:** 클라이언트에서 직접 AI API 호출

**Why bad:**
- API 키 노출
- CORS 이슈
- 비용 제어 불가
- 에러 처리 어려움

**Instead:** 항상 Server Actions 통해 호출

### Anti-Pattern 3: Hard-Coded Analysis Prompts

**What:** AI 프롬프트를 코드에 직접 하드코딩

**Why bad:**
- 프롬프트 수정 시 재배포 필요
- A/B 테스트 불가
- 버전 관리 어려움

**Instead:**
```typescript
// Store prompts in DB with versioning
const prompt = await db.prompt.findFirst({
  where: { type: 'strategy', active: true },
  orderBy: { version: 'desc' }
})
```

### Anti-Pattern 4: Eager PDF Generation

**What:** 보고서 요청과 동시에 PDF 생성 후 DB 저장

**Why bad:**
- 생성 시간 30초+
- 저장 공간 낭비
- 데이터 변경 시 stale data

**Instead:**
```typescript
// On-demand generation + cache
export async function getReport(studentId: string) {
  const cached = await cache.get(`report:${studentId}`)
  if (cached && !isStale(cached)) {
    return cached
  }

  // Generate fresh
  const pdf = await generatePDF(studentId)
  await cache.set(`report:${studentId}`, pdf, { ttl: 3600 })
  return pdf
}
```

### Anti-Pattern 5: Mixed Calculation Libraries

**What:** 여러 사주/성명학 라이브러리를 섞어서 사용

**Why bad:**
- 계산 결과 불일치
- 디버깅 어려움
- 사용자 혼란

**Instead:** 한 라이브러리 선택 후 일관되게 사용, 버전 고정

## Scalability Considerations

| Concern | At 50 users | At 200 users | At 1000+ users |
|---------|-------------|--------------|----------------|
| **Database** | PostgreSQL (단일 인스턴스) | PostgreSQL + Read Replica | PostgreSQL + Connection Pooling + Caching |
| **File Storage** | Local filesystem (Docker volume) | S3-compatible storage | CDN + S3 |
| **AI Analysis** | Synchronous API calls | Queue system (BullMQ) | Dedicated AI worker servers |
| **Report Generation** | On-demand generation | Generated + cached (Redis) | Pre-generated + versioned |
| **Authentication** | Session-based (DB) | JWT + Redis session store | Distributed session store |

### Critical Scaling Points

**50 → 200명:**
- Local file storage → S3 migration 필요
- AI API rate limits 체크 필요
- DB connection pool 설정

**200 → 1000명:**
- Queue system 도입 (긴 작업 비동기 처리)
- Redis caching layer 추가
- DB 인덱스 최적화
- Monitoring & alerting 필수

## Build Order (Dependency-Based)

이 순서는 컴포넌트 간 의존성을 고려한 구현 순서입니다.

### Phase 1: Foundation (필수 기반)
```
1. Database Schema Setup
2. Authentication System (선생님 로그인)
3. Student Management (CRUD)
   └─ Basic info only (no files yet)
```

**Rationale:** 학생 데이터가 없으면 아무것도 분석할 수 없음

### Phase 2: File Handling (분석 준비)
```
4. File Upload Service
   └─ Student photos
   └─ Palm photos
```

**Rationale:** 관상/손금 분석에 필요

### Phase 3: Calculation-Based Analysis (신뢰도 높음)
```
5. MBTI Analysis (설문)
6. Saju Calculator (사주팔자)
7. Name Study Calculator (성명학)
```

**Rationale:** 외부 의존성 없음, 빠르게 구현 가능, 즉시 가치 제공

### Phase 4: AI-Based Analysis (외부 의존성)
```
8. Face Analysis Service
9. Palm Analysis Service
```

**Rationale:** AI API 통합 필요, 계산 분석 먼저 완료 후 추가

### Phase 5: Synthesis (종합)
```
10. AI Strategy Advisor (학습 전략/진로 제안)
11. Report Generator (PDF 출력)
```

**Rationale:** 모든 분석 결과가 있어야 종합 가능

### Inter-Phase Dependencies

```
Phase 1 ──────────┐
                  ↓
Phase 2 ──────┐   │
              ↓   ↓
Phase 3 ──────┼───┤
              ↓   ↓
Phase 4 ──────┼───┤
              ↓   ↓
Phase 5 ←─────┴───┘
```

**Phase 1, 2는 blocking dependencies. Phase 3, 4는 parallel 가능.**

## Technology Stack Integration Points

### Next.js App Router Specifics

**Server Components (Default):**
- `/app/(dashboard)/students/page.tsx` - 학생 목록 (SSR)
- `/app/(dashboard)/students/[id]/page.tsx` - 학생 상세 (SSR)

**Client Components ('use client'):**
- Form widgets (date picker, file upload)
- Interactive tables/charts
- Modal dialogs

**Server Actions:**
- All mutations (create, update, delete)
- File uploads
- AI API calls

### Database (PostgreSQL)

**ORM 선택:**
- **Prisma** (권장) - Type-safe, migration 관리 우수
- Drizzle - Lighter, SQL-like

**Schema 구조:**
```sql
-- Core tables
teachers (id, email, name, password_hash)
students (id, teacher_id, name, birthday, photo_url)
analyses (id, student_id, type, result_json, completed_at)
recommendations (id, student_id, strategy_text, created_at)

-- Type: 'mbti' | 'saju' | 'name_study' | 'face' | 'palm'
```

### File Storage

**Development:** Local Docker volume (`./data/uploads`)
**Production:** S3-compatible (AWS S3, Cloudflare R2, MinIO)

**File naming:** `{teacherId}/{studentId}/{type}-{timestamp}.{ext}`

### AI/ML Integration

**관상/손금 분석 Options:**

1. **OpenAI Vision API** (추천)
   - GPT-4 Vision으로 이미지 분석
   - Prompt: "Analyze this face/palm for personality traits"
   - Cost: ~$0.01 per image

2. **Custom Model** (advanced)
   - TensorFlow.js / ONNX Runtime Web
   - Pre-trained face/palm model
   - Client-side inference 가능 (privacy)

3. **Third-party Service**
   - FacePlusPlus, AWS Rekognition
   - 특화된 분석 API

**학습 전략/진로 제안:**
- GPT-4 API with structured prompts
- RAG pattern for domain knowledge

## Sources

**HIGH Confidence:**
- [Next.js App Router Official Docs](https://nextjs.org/docs/app)
- [Modern Full Stack Application Architecture Using Next.js 15+](https://softwaremill.com/modern-full-stack-application-architecture-using-next-js-15/)
- [School Management System Database Design - Techprofree](https://www.techprofree.com/school-management-system-project-database-design/)
- [PostgreSQL vs MongoDB in 2026 - Nucamp](https://www.nucamp.co/blog/mongodb-vs-postgresql-in-2026-nosql-vs-sql-for-full-stack-apps)

**MEDIUM Confidence:**
- [Build a Learning Management System in Next.js & Node.js](https://www.sevensquaretech.com/develop-learning-management-system-nextjs-nodejs-github-code/)
- [Next.js PDF Generation Guide](https://medium.com/front-end-weekly/dynamic-html-to-pdf-generation-in-next-js-a-step-by-step-guide-with-puppeteer-dbcf276375d7)
- [Next.js File Upload Best Practices](https://www.pronextjs.dev/next-js-file-uploads-server-side-solutions)
- [Multi-Tenancy with Next.js Guide](https://nextjs.org/docs/app/guides/multi-tenant)

**LOW Confidence (Research Phase Validation Needed):**
- AI face/palm analysis accuracy and implementation patterns
- Korean 사주팔자 calculation algorithm specifics
- Optimal prompt engineering for educational strategy generation

---

**Note:** This architecture is designed for the 50-200 student scale specified in PROJECT.md. For larger scales (1000+), significant changes to caching, queuing, and database architecture would be necessary.
