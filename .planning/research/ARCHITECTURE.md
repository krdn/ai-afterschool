# Architecture Research

**Domain:** 학원 학생 관리 시스템 with 선생님 관리, 다중 LLM, 궁합 분석
**Researched:** 2026-01-27 (Updated: 2026-01-30 for v2.0 Teacher Management)
**Confidence:** HIGH (Existing codebase analysis + verified patterns)

## Executive Summary

AI AfterSchool v2.0은 기존 Next.js 15 App Router + Prisma + PostgreSQL 아키텍처에 **선생님 관리, 다중 LLM 지원, 궁합 분석**을 통합합니다. 핵심은 **기존 아키텍처와 호환되는 방식으로 계층적 접근 제어(RBAC), LLM 추상화 계층, 선생님-학생 궁합 분석 모듈**을 추가하는 것입니다.

기존 Server Components + Server Actions 패턴을 유지하며, 새로운 Teacher 엔티티는 Student와 유사한 방식으로 분석 결과를 저장합니다. 다중 LLM은 **Provider Adapter 패턴**으로 통합하여 기존 Claude API 호출에 최소한의 변경만 필요하게 합니다.

**Core architectural principles (v1.x + v2.0 extensions):**
1. **Student Data as Source of Truth** - 모든 분석과 제안은 학생 정보 기반 (기존)
2. **Teacher as Analysis Subject** - 선생님도 성향 분석 대상, 학생과 동일한 모듈 재사용 (신규)
3. **Modular AI Services** - 각 분석 기능은 독립적 모듈 (기존)
4. **LLM Provider Abstraction** - 다중 LLM 지원, 실패 시 폴백 (신규)
5. **Team-Based Data Isolation** - 팀 단위 데이터 접근 제어 (신규)
6. **Server-Side Heavy** - 민감한 데이터와 AI 처리는 서버에서 (기존)
7. **Feature-Based Organization** - 도메인별로 코드 구조화 (기존)

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Presentation Layer                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐ │
│  │Student Pages │  │Teacher Pages │  │Admin Pages   │  │Auth Pages     │ │
│  │(기존)        │  │(v2.0 신규)   │  │(v2.0 신규)   │  │(기존)         │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬────────┘ │
│         │                 │                 │                 │           │
│         └─────────────────┴─────────────────┴─────────────────┘           │
│                                  ↓                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                           Server Actions Layer                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐│
│  │ Student CRUD │  │ Teacher CRUD │  │Compatibility │  │   Settings    ││
│  │(기존)        │  │(v2.0 신규)   │  │(v2.0 신규)   │  │(v2.0 신규)    ││
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬────────┘│
│         │                 │                 │                 │          │
└─────────┴─────────────────┴─────────────────┴─────────────────┴──────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Business Logic Layer                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐│
│  │   Analysis   │  │ Compatibility│  │  LLM Router  │  │  Access       ││
│  │   Modules    │  │   Algorithm  │  │  (v2.0 신규) │  │  Control      ││
│  │(기존)        │  │(v2.0 신규)   │  │              │  │(v2.0 신규)    ││
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬────────┘│
│         │                 │                 │                 │          │
└─────────┴─────────────────┴─────────────────┴─────────────────┴──────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Data Access Layer                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐│
│  │    Prisma    │  │  PostgreSQL  │  │   Cloudinary │  │   MinIO       ││
│  │    ORM       │  │   Database   │  │   (Images)   │  │   (PDFs)      ││
│  └──────────────┘  └──────────────┘  └──────────────┘  └───────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                         External Services Layer                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐│
│  │  Claude  │  │  Ollama  │  │ Gemini   │  │ ChatGPT  │  │  etc.      ││
│  │   API    │  │ (Local)  │  │   API    │  │   API    │  │            ││
│  │(기존)    │  │(v2.0 신규)│  │(v2.0 신규)│  │(v2.0 신규)│  │            ││
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities (v1.x + v2.0)

| Component | Responsibility | Typical Implementation | Version |
|-----------|----------------|------------------------|---------|
| **Student Management** | 학생 CRUD, 검색, 팀 할당 | Server Actions + Prisma | v1.0 (확장 예정) |
| **Teacher Management** | 선생님 CRUD, 계층 구조, 팀 접근 제어 | Server Actions + Prisma | v2.0 (신규) |
| **LLM Provider Router** | 다중 LLM 제공자 선택 및 실패 시 폴백 | Adapter pattern with unified interface | v2.0 (신규) |
| **Compatibility Analysis** | 선생님-학생 성향 궁합 계산 | Modular algorithm service | v2.0 (신규) |
| **Access Control (RBAC)** | 팀 기반 데이터 접근 제어 | Middleware + Server Actions guard | v2.0 (신규) |
| **Analysis Modules** | MBTI, 사주, 관상, 손금, 성명학 분석 | Reusable calculation functions | v1.0 (재사용) |
| **PDF Storage** | 분석 보고서 PDF 저장 | MinIO/S3-compatible storage | v1.1 (기존) |
| **Image Storage** | 학생/선생님 사진 저장 | Cloudinary | v1.0 (재사용) |

## Recommended Project Structure (v2.0)

```
src/
├── app/
│   ├── (auth)/                    # 인증 관련 페이지 (기존 v1.0)
│   ├── (dashboard)/
│   │   ├── students/              # 학생 관리 (기존 v1.0)
│   │   ├── teachers/              # 선생님 관리 (v2.0 신규)
│   │   │   ├── page.tsx           # 선생님 목록
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx       # 선생님 상세
│   │   │   │   ├── edit/          # 선생님 정보 수정
│   │   │   │   ├── mbti/          # 선생님 MBTI 분석
│   │   │   │   ├── compatibility/ # 궁합 분석 결과
│   │   │   │   └── students/      # 배정된 학생 목록
│   │   │   └── new/               # 선생님 등록
│   │   ├── admin/                 # 원장 전용 관리 페이지 (v2.0 신규)
│   │   │   ├── settings/          # LLM 설정, 팀 관리
│   │   │   ├── teams/             # 팀 관리
│   │   │   └── analytics/         # 성과 분석
│   │   └── matching/              # 학생-선생님 매칭 (v2.0 신규)
│   │       ├── page.tsx           # 매칭 대시보드
│   │       └── [studentId]/       # 학생별 추천 선생님
│   └── api/                       # API Routes (최소화, 기존)
│
├── lib/
│   ├── actions/
│   │   ├── students.ts            # 학생 Server Actions (기존 v1.0)
│   │   ├── teachers.ts            # 선생님 Server Actions (v2.0 신규)
│   │   ├── compatibility.ts       # 궁합 분석 Actions (v2.0 신규)
│   │   ├── matching.ts            # 배정/매칭 Actions (v2.0 신규)
│   │   └── settings.ts            # 설정 Actions (v2.0 신규)
│   ├── ai/
│   │   ├── claude.ts              # Claude API (기존 v1.0 → 리팩토링)
│   │   ├── providers/             # LLM Provider Abstraction (v2.0 신규)
│   │   │   ├── base.ts            # Base provider interface
│   │   │   ├── claude.ts          # Claude adapter (래핑)
│   │   │   ├── ollama.ts          # Ollama adapter
│   │   │   ├── gemini.ts          # Gemini adapter
│   │   │   ├── openai.ts          # ChatGPT adapter
│   │   │   └── router.ts          # Provider router with fallback
│   │   └── prompts/               # AI 프롬프트 (기존 v1.0 + 궁합 분석 프롬프트 추가)
│   ├── analysis/
│   │   ├── mbti-scoring.ts        # MBTI 계산 (기존 v1.0, 재사용)
│   │   ├── saju.ts                # 사주 계산 (기존 v1.0, 재사용)
│   │   ├── compatibility.ts       # 궁합 알고리즘 (v2.0 신규)
│   │   └── team-balance.ts        # 팀 성향 밸런스 분석 (v2.0 신규)
│   ├── db/
│   │   ├── db.ts                  # Prisma client (기존 v1.0)
│   │   ├── student-analysis.ts    # 학생 분석 DAL (기존 v1.0)
│   │   ├── teacher-analysis.ts    # 선생님 분석 DAL (v2.0 신규)
│   │   ├── compatibility.ts       # 궁합 분석 DAL (v2.0 신규)
│   │   └── access-control.ts      # 팀 기반 접근 제어 (v2.0 신규)
│   ├── middleware/
│   │   ├── rbac.ts                # Role-Based Access Control (v2.0 신규)
│   │   └── team-isolation.ts      # 팀 데이터 격리 (v2.0 신규)
│   ├── session.ts                 # 세션 관리 (기존 v1.0, 역할/팀 정보 추가)
│   └── dal.ts                     # Data Access Layer (기존 v1.0, 확장)
│
├── types/
│   ├── teacher.ts                 # 선생님 타입 (v2.0 신규)
│   ├── compatibility.ts           # 궁합 분석 타입 (v2.0 신규)
│   └── llm.ts                     # LLM Provider 타입 (v2.0 신규)
│
└── middleware.ts                  # Next.js Middleware (기존 v1.0, /teachers, /admin 추가)
```

### Structure Rationale

- **`lib/ai/providers/`**: LLM 제공자별 구현을 분리하여 단일 책임 원칙 준수. 새로운 제공자 추가 시 기존 코드 변경 최소화.
- **`lib/actions/teachers.ts`**: 학생 Server Actions 패턴을 그대로 따라 일관성 유지. `verifySessionWithTeam()`으로 인증 + `teacherId` 또는 `teamId`로 접근 제어.
- **`lib/middleware/rbac.ts`**: Middleware와 Server Actions 양쪽에서 사용하는 공통 권한 검증 로직. DRY 원칙 준수.
- **`lib/db/teacher-analysis.ts`**: 학생 분석 DAL과 동일한 패턴으로 선생님 성향 분석 저장. 코드 재사용성 극대화.
- **`app/(dashboard)/teachers/`**: 학생 페이지 구조와 유사하게 구성하여 사용자 경험 일관성 확보.

## Architectural Patterns (v2.0 Extensions)

### Pattern 1: LLM Provider Adapter (v2.0 신규)

**What:** 다양한 LLM 제공자(Claude, Ollama, Gemini, ChatGPT)를 통합 인터페이스로 추상화하는 패턴.

**When to use:**
- 외부 API 의존성 최소화 (vendor lock-in 방지)
- 비용 최적화 (싼 모델로 우선 시도, 실패 시 고품질 모델로 폴백)
- 로컬/클라우드 하이브리드 (Ollama 로컬 우선, Claude 클라우드 폴백)

**Trade-offs:**
- ✅ 장점: 제공자 교체 용이, 실패 처리 유연, 비용 최적화 가능
- ❌ 단점: 추상화 계층 추가로 복잡도 증가, 제공자별 고유 기능 사용 제한

**Example:**
```typescript
// lib/ai/providers/base.ts
export interface LLMProvider {
  name: string;
  generateText(params: GenerateTextParams): Promise<LLMResponse>;
  generateImage(params: GenerateImageParams): Promise<LLMImageResponse>;
  isAvailable(): Promise<boolean>;
}

export interface GenerateTextParams {
  prompt: string;
  maxTokens?: number;
  model?: string;
}

// lib/ai/providers/router.ts
export class LLMRouter {
  private providers: LLMProvider[] = [];

  constructor(config: LLMConfig) {
    // Initialize providers based on config
    if (config.ollama?.enabled) {
      this.providers.push(new OllamaProvider(config.ollama));
    }
    if (config.gemini?.enabled) {
      this.providers.push(new GeminiProvider(config.gemini));
    }
    if (config.openai?.enabled) {
      this.providers.push(new OpenAIProvider(config.openai));
    }
    if (config.anthropic?.enabled) {
      this.providers.push(new ClaudeProvider(config.anthropic));
    }
  }

  async generateText(params: GenerateTextParams, preferredProvider?: string): Promise<LLMResponse> {
    // Try preferred provider first, then fallback
    const orderedProviders = this.orderProviders(preferredProvider);

    for (const provider of orderedProviders) {
      try {
        if (await provider.isAvailable()) {
          return await provider.generateText(params);
        }
      } catch (error) {
        console.warn(`${provider.name} failed, trying next...`, error);
        continue;
      }
    }

    throw new Error('All LLM providers failed');
  }

  private orderProviders(preferred?: string): LLMProvider[] {
    if (preferred) {
      const provider = this.providers.find(p => p.name === preferred);
      if (provider) {
        return [provider, ...this.providers.filter(p => p.name !== preferred)];
      }
    }
    return [...this.providers];
  }
}

// 기존 코드와의 호환성 유지
// lib/ai/claude.ts (기존) → lib/ai/providers/router.ts로 리팩토링
export const llmRouter = new LLMRouter({
  ollama: { baseUrl: process.env.OLLAMA_BASE_URL || 'http://192.168.0.5:11434', enabled: true },
  gemini: { apiKey: process.env.GEMINI_API_KEY, enabled: false },
  openai: { apiKey: process.env.OPENAI_API_KEY, enabled: false },
  anthropic: { apiKey: process.env.ANTHROPIC_API_KEY, enabled: true },
});

// 기존 Claude API 호출을 router로 대체
// Before: anthropic.messages.create(...)
// After: llmRouter.generateText(...)
```

### Pattern 2: Team-Based Data Isolation (v2.0 신규)

**What:** 팀(학원 조직) 단위로 데이터를 격리하는 패턴. 원장은 전체 접근, 팀장은 소속 팀만 접근.

**When to use:**
- 다중 사용자 시스템에서 데이터 프라이버시 보장
- 계층적 조직 구조 (원장 > 팀장 > 매니저 > 선생님)
- 단일 Prisma 데이터베이스에서 논리적 데이터 분리 필요

**Trade-offs:**
- ✅ 장점: 복잡한 데이터베이스 스키마 변경 불필요, 애플리케이션 레벨에서 유연한 제어
- ❌ 단점: 모든 쿼리에 teamId 필터 필수, 실수로 데이터 누출 가능성

**Example:**
```typescript
// prisma/schema.prisma (확장)
model Teacher {
  id              String        @id @default(cuid())
  email           String        @unique
  password        String
  name            String
  role            TeacherRole   @default(TEACHER)
  teamId          String?       // 팀 소속 (null = 원장)
  team            Team?         @relation(fields: [teamId], references: [id])
  students        Student[]
  // ... 기존 필드
}

model Team {
  id          String    @id @default(cuid())
  name        String
  leaderId    String?   // 팀장 선생님 ID
  leader      Teacher?  @relation(fields: [leaderId], references: [id])
  teachers    Teacher[]
  students    Student[]
  createdAt   DateTime  @default(now())
}

model Student {
  // ... 기존 필드
  teamId      String?   // 팀 소속 (선생님 팀 따라감)
  team        Team?     @relation(fields: [teamId], references: [id])
}

enum TeacherRole {
  DIRECTOR    // 원장 (전체 접근)
  TEAM_LEADER // 팀장 (소속 팀 + 하위 팀)
  MANAGER     // 매니저 (소속 팀)
  TEACHER     // 선생님 (본인 데이터만)
}

// lib/middleware/rbac.ts
export async function verifySessionWithTeam() {
  const session = await verifySession();
  if (!session?.userId) return null;

  const teacher = await db.teacher.findUnique({
    where: { id: session.userId },
    include: { team: true },
  });

  if (!teacher) return null;

  return {
    userId: session.userId,
    role: teacher.role,
    teamId: teacher.teamId,
    canAccessAll: teacher.role === 'DIRECTOR',
  };
}

// lib/db/access-control.ts
export function buildTeamAccessFilter(session: SessionWithTeam) {
  if (session.canAccessAll) {
    return {}; // 원장은 전체 접근
  }

  // 팀장, 매니저, 선생님은 소속 팀만
  return { teamId: session.teamId };
}

// Server Actions에서 적용
export async function getTeachers() {
  const session = await verifySessionWithTeam();
  if (!session) throw new Error('Unauthorized');

  return db.teacher.findMany({
    where: buildTeamAccessFilter(session),
    include: { team: true },
  });
}
```

### Pattern 3: Reusable Analysis Modules (v2.0 신규)

**What:** 학생 성향 분석 모듈을 선생님 분석에 재사용하는 패턴. 동일한 계산 로직을 다른 엔티티에 적용.

**When to use:**
- 중복 코드 방지
- 분석 로직 변경 시 일관성 유지
- 선생님-학생 궁합 계산 시 동일한 기반 데이터 필요

**Trade-offs:**
- ✅ 장점: 코드 재사용성, 유지보수성 향상, 일관된 분석 결과
- ❌ 단점: 과도한 추상화로 특정 엔티티 요구사항 반영 어려울 수 있음

**Example:**
```typescript
// 기존 학생 분석 함수
// lib/analysis/mbti-scoring.ts (기존, 변경 없음)
export function calculateMBTIScores(responses: MBTIResponse[]): MBTIScores {
  // ... MBTI 계산 로직
}

// lib/analysis/saju.ts (기존, 변경 없음)
export function calculateSaju(birthDate: Date, birthTime: { hour: number; minute: number }): SajuResult {
  // ... 사주 계산 로직
}

// 선생님 분석에서 재사용
// lib/actions/teachers.ts
export async function analyzeTeacherMBTI(teacherId: string, responses: MBTIResponse[]) {
  const session = await verifySessionWithTeam();
  // ... 권한 검증

  // 기존 모듈 재사용
  const scores = calculateMBTIScores(responses);
  const mbtiType = determineMBTIType(scores);

  // 선생님 분석 결과 저장
  await db.teacherMBTIAnalysis.create({
    data: {
      teacherId,
      responses,
      scores,
      mbtiType,
      calculatedAt: new Date(),
    },
  });
}

// lib/actions/compatibility.ts
export async function calculateCompatibility(studentId: string, teacherId: string) {
  const session = await verifySessionWithTeam();

  // 학생과 선생님 분석 데이터 조회
  const [studentData, teacherData] = await Promise.all([
    getUnifiedPersonalityData(studentId, session.userId),
    getUnifiedTeacherPersonalityData(teacherId, session.userId),
  ]);

  // 궁합 알고리즘 (신규)
  return calculatePersonalityCompatibility(studentData, teacherData);
}

// lib/analysis/compatibility.ts (신규)
export function calculatePersonalityCompatibility(
  student: PersonalityData,
  teacher: PersonalityData
): CompatibilityResult {
  const mbtiCompatibility = compareMBTI(student.mbti, teacher.mbti);
  const sajuCompatibility = compareSajuElements(student.saju, teacher.saju);

  const overallScore = (
    mbtiCompatibility.score * 0.4 +
    sajuCompatibility.score * 0.3 +
    // 다른 요소들...
  );

  return {
    overallScore,
    details: {
      mbti: mbtiCompatibility,
      saju: sajuCompatibility,
    },
    recommendation: generateRecommendation(overallScore),
  };
}
```

## Data Flow (v2.0 Updates)

### Request Flow: 선생님 관리

```
[User: 선생님 목록 조회]
    ↓
[GET /teachers → Server Component]
    ↓
[Page Component → getTeachers() Server Action]
    ↓
[verifySessionWithTeam() → JWT 검증 + 팀 정보 조회]
    ↓
[buildTeamAccessFilter() → role 기반 필터 생성]
    ↓
[db.teacher.findMany({ where: { teamId: session.teamId } })]
    ↓
[Prisma → PostgreSQL 쿼리 실행]
    ↓
[Teachers → Page Component 렌더링]
```

### Request Flow: 궁합 분석

```
[User: 선생님-학생 궁합 분석 요청]
    ↓
[POST /compatibility → Server Action]
    ↓
[verifySessionWithTeam() → 권한 검증]
    ↓
[getUnifiedPersonalityData(studentId) → 학생 성향 조회]
    ↓
[getUnifiedTeacherPersonalityData(teacherId) → 선생님 성향 조회]
    ↓
[calculatePersonalityCompatibility() → 궁합 알고리즘 실행]
    │
    ├─→ compareMBTI() → MBTI 유형 비교
    ├─→ compareSajuElements() → 사주 오행 조화 확인
    └─→ [기타 비교 로직]
    ↓
[Compatibility Score + Recommendation 생성]
    ↓
[DB 저장 (선택사항)]
    ↓
[결과 반환 → UI 표시]
```

### Request Flow: 다중 LLM

```
[User: AI 분석 요청 (학습 전략 생성)]
    ↓
[Server Action: generateLearningStrategy()]
    ↓
[llmRouter.generateText(params, 'ollama')]
    ↓
[OllamaProvider → 로컬 Ollama API 호출]
    │
    ├─→ 성공 → 결과 반환
    │
    └─→ 실패 → 다음 제공자 시도
         ↓
         [GeminiProvider → Gemini API 호출]
         │
         ├─→ 성공 → 결과 반환
         │
         └─→ 실패 → 다음 제공자 시도
              ↓
              [ClaudeProvider → Claude API 호출 (기존)]
              ↓
              [결과 반환]
```

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Claude API** | LLMRouterAdapter | 기존 `anthropic` 클라이언트를 `ClaudeProvider`로 래핑. 환경변수 `ANTHROPIC_API_KEY` 사용 |
| **Ollama** | HTTP fetch to `192.168.0.5:11434` | 로컬 서버 배포. 네트워크 접근 가능 확인 필요. 모델 사전 다운로드 필요 |
| **Gemini API** | GoogleAuthAdapter | `@google/generative-ai` 패키지 사용. 환경변수 `GEMINI_API_KEY` |
| **ChatGPT (OpenAI)** | OpenAIAdapter | `openai` 패키지 사용. 환경변수 `OPENAI_API_KEY` |
| **Cloudinary** | 기존 통합 유지 | 선생님 프로필/사진 저장에 재사용 |
| **MinIO** | 기존 통합 유지 | 선생님 분석 PDF 저장에 재사용 |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **Student ↔ Teacher modules** | Direct function calls (Server Actions) | 궁합 분석 시 서로의 데이터 조회. Prisma relation으로 최적화 |
| **LLM Router ↔ AI modules** | Provider interface | `generateText()` 통합 메서드. 각 AI 모듈은 LLM 제공자 무관 |
| **Access Control ↔ All modules** | Guard functions | `verifySessionWithTeam()`을 모든 Server Action 시작에 호출. Middleware에서도 사용 |
| **UI ↔ Server Actions** | `useActionState` / `useFormState` | React 19 Server Components와 통합. 폼 제출 후 자동 리다이렉트 |

## New vs Modified Components (v2.0)

### New Components (v2.0)

| Component | Type | Purpose |
|-----------|------|---------|
| `lib/ai/providers/` | Module | LLM 제공자 추상화 계층 |
| `lib/actions/teachers.ts` | Server Actions | 선생님 CRUD, 분석, 배정 |
| `lib/actions/compatibility.ts` | Server Actions | 궁합 분석, 매칭 |
| `lib/actions/settings.ts` | Server Actions | LLM 설정, 팀 관리 |
| `lib/analysis/compatibility.ts` | Algorithm | 선생님-학생 궁합 계산 |
| `lib/middleware/rbac.ts` | Guard | 역할 기반 접근 제어 |
| `lib/db/teacher-analysis.ts` | DAL | 선생님 분석 데이터 CRUD |
| `lib/db/access-control.ts` | DAL | 팀 기반 데이터 필터 |
| `app/(dashboard)/teachers/` | Pages | 선생님 관리 UI |
| `app/(dashboard)/admin/` | Pages | 원장 전용 설정 UI |

### Modified Components (v1.x → v2.0)

| Component | Changes | Impact |
|-----------|---------|--------|
| `lib/session.ts` | `SessionPayload`에 `role`, `teamId` 추가 | 세션 크기 약간 증가, JWT claims 확장 |
| `lib/ai/claude.ts` | `ClaudeProvider`로 리팩토링 | 기존 코드와 호환성 유지 (동일 API) |
| `lib/dal.ts` | `verifySession()` → `verifySessionWithTeam()` 선택적 사용 | 기존 동작 유지, 새 함수는 추가 기능 |
| `prisma/schema.prisma` | `TeacherRole` enum, `Team` 모델, `Teacher.teamId` 추가 | 마이그레이션 필요 |
| `src/middleware.ts` | `protectedRoutes`에 `/teachers`, `/admin` 추가 | 라우트 보안 강화 |

### Unchanged Components (재사용)

| Component | Reuse Context |
|-----------|----------------|
| `lib/analysis/mbti-scoring.ts` | 선생님 MBTI 분석에 그대로 재사용 |
| `lib/analysis/saju.ts` | 선생님 사주 분석에 그대로 재사용 |
| `lib/analysis/name-numerology.ts` | 선생님 성명학 분석에 그대로 재사용 |
| `lib/actions/personality-integration.ts` | 선생님 성격 요약 생성에 재사용 (`after()` 패턴) |
| `lib/pdf/generator.ts` | 선생님 분석 PDF 생성에 재사용 |
| `lib/storage/factory.ts` | 선생님 이미지/PDF 저장에 재사용 |

## Suggested Build Order (v2.0)

### Phase 1: Database & Access Control (기반)
1. **Prisma 스키마 확장** - `TeacherRole`, `Team`, `Teacher.teamId` 추가
2. **마이그레이션 실행** - `prisma migrate dev`
3. **RBAC 구현** - `lib/middleware/rbac.ts`, `lib/db/access-control.ts`
4. **세션 확장** - `SessionPayload`에 `role`, `teamId` 추가

**Why first:** 모든 기능이 데이터 접근 제어에 의존. RBAC가 없으면 데이터 누출 위험.

### Phase 2: Teacher Management (핵심)
1. **선생님 CRUD** - `lib/actions/teachers.ts`
2. **선생님 목록/상세 페이지** - `app/(dashboard)/teachers/`
3. **선생님 성향 분석** - 기존 분석 모듈 재사용
4. **선생님 권한 검증** - 모든 Server Action에 `verifySessionWithTeam()` 추가

**Why second:** 학생-선생님 궁합 분석의 전제. 선생님 데이터가 없으면 비교 불가.

### Phase 3: LLM Provider Abstraction (기술적 기반)
1. **LLM Provider 인터페이스** - `lib/ai/providers/base.ts`
2. **Claude 어댑터** - `lib/ai/providers/claude.ts` (기존 코드 래핑)
3. **Ollama 어댑터** - `lib/ai/providers/ollama.ts`
4. **Router 구현** - `lib/ai/providers/router.ts`
5. **기존 Claude 호출 리팩토링** - `lib/ai/claude.ts` → router 사용

**Why third:** 다음 단계(궁합 분석)에서 AI 제안 생성 시 다양한 LLM 활용 가능. 기술 부채 방지.

### Phase 4: Compatibility Analysis (차별화 기능)
1. **궁합 알고리즘** - `lib/analysis/compatibility.ts`
2. **궁합 분석 Server Actions** - `lib/actions/compatibility.ts`
3. **AI 배정 제안** - LLM으로 최적 매칭 추천
4. **궁합 결과 UI** - `app/(dashboard)/students/[id]/compatibility/`

**Why fourth:** 선생님 데이터 + LLM 기반이 준비된 후 실행. v2.0의 핵심 차별화 기능.

### Phase 5: Admin & Settings (관리 기능)
1. **LLM 제공자 설정** - `lib/actions/settings.ts`
2. **팀 관리** - 팀 생성, 팀장 배정
3. **성과 분석 대시보드** - 선생님별 학생 성적 추적
4. **Admin 페이지** - `app/(dashboard)/admin/`

**Why last:** 핵심 기능 완료 후 관리 기능 추가. 원장 전용 기능이므로 우선순위 낮음.

## Anti-Patterns to Avoid

### Anti-Pattern 1: 직접 Prisma 쿼리에 teamId 하드코딩 (v2.0)

**What people do:**
```typescript
// ❌ 나쁜 예
export async function getStudents() {
  const session = await verifySession();
  return db.student.findMany({
    where: { teamId: session.teamId }, // teamId 직접 사용
  });
}
```

**Why it's wrong:**
- 원장(DIRECTOR)은 모든 팀 데이터를 봐야 하는데 필터링됨
- 팀장은 하위 팀 데이터도 접근해야 하는데 불가능
- 팀 변경 시 모든 쿼리 수정 필요

**Do this instead:**
```typescript
// ✅ 좋은 예
export async function getStudents() {
  const session = await verifySessionWithTeam();
  return db.student.findMany({
    where: buildTeamAccessFilter(session), // 역할 기반 동적 필터
  });
}
```

### Anti-Pattern 2: LLM 제공자별 조건문 나열 (v2.0)

**What people do:**
```typescript
// ❌ 나쁜 예
export async function generateAIAnalysis(prompt: string, provider: string) {
  if (provider === 'claude') {
    const response = await anthropic.messages.create({ ... });
    return response.content[0].text;
  } else if (provider === 'gemini') {
    const response = await gemini.generateContent({ ... });
    return response.response.text();
  } else if (provider === 'ollama') {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, { ... });
    return response.response;
  }
  // 새 제공자 추가할 때마다 if-else 추가...
}
```

**Why it's wrong:**
- 새 제공자 추가 시마다 함수 수정 필요 (OCP 위반)
- 제공자별 에러 처리 중복
- 테스트 어려움 (모든 제공자 mock 필요)

**Do this instead:**
```typescript
// ✅ 좋은 예
export async function generateAIAnalysis(prompt: string, preferredProvider?: string) {
  return llmRouter.generateText({ prompt }, preferredProvider);
}

// 새 제공자는 LLMProvider 인터페이스 구현으로만 추가
class NewProvider implements LLMProvider {
  async generateText(params: GenerateTextParams) {
    // 구현
  }
}
```

### Anti-Pattern 3: 선생님과 학생 분석 로직 중복 (v2.0)

**What people do:**
```typescript
// ❌ 나쁜 예
// lib/actions/students.ts
export function calculateStudentMBTI(responses: Response[]) {
  // 100줄의 MBTI 계산 로직
}

// lib/actions/teachers.ts
export function calculateTeacherMBTI(responses: Response[]) {
  // 동일한 100줄의 MBTI 계산 로직 복사
}
```

**Why it's wrong:**
- 로직 변경 시 두 곳 모두 수정 (버그 위험)
- 테스트 코드 중복
- 가독성 저하

**Do this instead:**
```typescript
// ✅ 좋은 예
// lib/analysis/mbti-scoring.ts (공통)
export function calculateMBTIScores(responses: Response[]) {
  // 단일 구현
}

// lib/actions/students.ts
export function calculateStudentMBTI(responses: Response[]) {
  return calculateMBTIScores(responses);
}

// lib/actions/teachers.ts
export function calculateTeacherMBTI(responses: Response[]) {
  return calculateMBTIScores(responses); // 재사용
}
```

## Scalability Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1-10 선생님 (현재) | 모놀리식 Next.js 앱 충분. Prisma 연결 풀 기본 설정 (connection_limit=10) |
| 10-50 선생님 | Prisma 연결 풀 증설 (connection_limit=20), 인덱스 최적화 (`teamId`, `teacherId` 복합 인덱스) |
| 50+ 선생님 | 캐싱 계층 추가 (Redis 또는 Upstash Stasher), Server Components 캐싱 전략 |

### Scaling Priorities

1. **First bottleneck:** Prisma N+1 쿼리 (해결됨: v1.1에서 `include` 사용으로 7쿼리 → 1쿼리 최적화)
2. **Second bottleneck:** LLM API 레이턴시 (해결책: `after()` 비동기 패턴 + 프로그레스 인디케이터)
3. **Third bottleneck:** 궁합 분석 계산 복잡도 (해결책: 사전 계산 + 캐싱)

## Sources

### Primary (HIGH confidence)

**Official Documentation:**
- [Next.js Multi-Tenant Guide](https://nextjs.org/docs/app/guides/multi-tenant) — Official patterns for multi-tenant Next.js applications (April 15, 2025)
- [Next.js Documentation](https://nextjs.org/docs) — App Router, Server Actions, Authentication
- [Prisma Documentation](https://www.prisma.io/docs) — ORM, multi-tenant patterns with row-level security
- [Anthropic Claude API](https://docs.anthropic.com/) — Vision API, messages API

**Existing Codebase Analysis:**
- `/mnt/data/projects/ai/ai-afterschool/prisma/schema.prisma` — Current database schema
- `/mnt/data/projects/ai/ai-afterschool/src/lib/actions/students.ts` — Server Actions pattern
- `/mnt/data/projects/ai/ai-afterschool/src/lib/actions/personality-integration.ts` — AI integration pattern
- `/mnt/data/projects/ai/ai-afterschool/src/lib/session.ts` — Session management pattern
- `/mnt/data/projects/ai/ai-afterschool/src/middleware.ts` — Authentication middleware

### Secondary (MEDIUM confidence)

**Multi-LLM Architecture:**
- [Swappable LLM Architectures: Building Flexible AI Systems](https://dmitrygolovach.com/swappable-llm-architectures/) — Adapter pattern for multiple LLM providers (January 5, 2026)
- [Multi-Provider Chat App: LiteLLM, Ollama, Gemini](https://medium.com/@richardhightower/multi-provider-chat-app-litellm-streamlit-ollama-gemini-claude-perplexity-and-modern-llm-afd5218c7eab) — Practical multi-provider integration guide
- [Use multiple models — Interconnects](https://www.interconnects.ai/p/use-multiple-models) — Analysis of using multiple LLM models (January 11, 2026)

**Multi-Tenant Access Control:**
- [Next.js Multi-Tenancy SaaS Template](https://supastarter.dev/nextjs-multi-tenancy-template) — Production-ready multi-tenant starter
- [Building Centralized Action for Large-Scale SaaS](https://dev.to/jackfd120/building-a-centralized-action-for-large-scale-saas-with-nextjs-53p7) — Server Actions with RBAC (December 4, 2025)
- [Multi-Tenant Apps with StackAuth Teams](https://zenstack.dev/blog/stackauth-multitenancy) — Team-based access control patterns (December 7, 2024)

**Ollama Self-Hosted Integration:**
- [Top 5 Local LLM Tools and Models in 2026](https://dev.to/lightningdev123/top-5-local-llm-tools-and-models-in-2026-1ch5) — Ollama as fastest path to local LLMs (January 29, 2026)
- [Local LLM Hosting: Complete 2025 Guide](https://medium.com/@rosgluk/local-llm-hosting-complete-2025-guide-ollama-vllm-localai-jan-lm-studio-more-f98136ce7e4a) — Comprehensive self-hosted LLM comparison (November 2025)
- [How To Run LLMs Locally With Ollama & Next.js](https://tech-multiverse.com/projects/how-to-run-llms-locally-with-ollama-next-js/) — Specific Next.js + Ollama tutorial

### Tertiary (LOW confidence, needs validation)

**Compatibility Analysis Patterns:**
- Domain-specific research needed for Korean personality compatibility algorithms
- Existing MBTI compatibility research is Western-centric
- Saju element compatibility requires domain expert validation

**Team-Based Analytics:**
- [SaaS Architecture Patterns with Next.js](https://vladimirsed-yikh.com/blog/saas-architecture-patterns-nextjs) — General SaaS patterns (July 27, 2025)
- [Next.js 16 Architecture Blueprint](https://medium.com/@sureshdotariya/next-js-16-architecture-blueprint-for-large-scale-applications-build-scalable-saas-multi-tenant-ab0efe9f2dad) — Large-scale patterns (November 2025)

---

**Confidence Level:** HIGH (기존 코드베이스 분석 기반 + 검증된 아키텍처 패턴)

**Research Gaps:**
1. **궁합 분석 알고리즘 정확도:** 한국 성향 분석(MBTI + 사주) 기반 궁합 계산의 학문적 검증 필요. Phase 4 계획 시 도메인 전문가 자문 권장.
2. **Ollama 네트워크 접근:** 192.168.0.5 서버의 Ollama API가 Docker 컨테이너에서 접근 가능한지 검증 필요. Phase 3 실행 전 테스트 권장.
3. **Prisma connection pool 최적화:** 선생님 수 증가에 따른 connection pool sizing 실측 필요. Phase 2 배포 후 모니터링.

**Next Steps:**
1. Phase 1: RBAC 구현 → 기존 학생 데이터에도 `teamId` 추가 필요성 검토
2. Phase 3: Ollama API 연결 테스트 → 로컬/원격 서버 간 네트워크 확인
3. Phase 4: 궁합 알고리즘 프로토타입 → 기존 학생-선생님 데이터로 소규모 테스트

---

*Architecture research completed: 2026-01-30*
*Ready for roadmap: yes*
