# Pitfalls Research: v2.0 선생님 관리, 다중 사용자, 궁합 분석 추가

**Domain:** 선생님 관리, 다중 사용자, 궁합 분석 시스템 추가
**Researched:** 2026-01-30
**Confidence:** MEDIUM

## Executive Summary

이 연구는 기존 단일 선생님/단일 팀 시스템에 다중 선생님, 계층 구조, 궁합 분석, 다중 LLM 기능을 추가할 때 발생할 수 있는 주요 실수를 식별합니다. **가장 치명적인 위험은 데이터 누설, 마이그레이션 실패, AI 알고리즘 편향**이며, 이는 보안 사고, 시스템 다운, 법적 문제로 이어질 수 있습니다.

핵심 예방 전략:
1. **Prisma middleware + PostgreSQL RLS**로 데이터베이스 레벨 강제 격리
2. **NOT VALID 옵션**으로 무중단 마이그레이션
3. **Fairness metrics**으로 AI 알고리즘 편향 정량 측정
4. **LLM Gateway**로 비용/성능 제어

## Critical Pitfalls

### Pitfall 1: 데이터 누설 (Data Leakage)

**What goes wrong:**
선생님이 자신이 속한 팀이 아닌 다른 팀의 학생/선생님 데이터에 접근할 수 있게 되는 심각한 보안 문제가 발생합니다. 단일 `teacher_id` 필터만으로는 계층적 권한(원장/팀장/매니저/선생님)을 처리할 수 없습니다.

**Why it happens:**
- 기존 단일 사용자 시스템에서는 `teacherId` 필터만으로 충분했음
- 팀 단위 데이터 분리를 추가할 때 API 계층과 데이터베이스 계층 양쪽에서 필터링을 구현해야 함
- Prisma 쿼리에서 `where` 절 누락, 혹은 잘못된 권한 체크 로직
- Row-Level Security (RLS) 미구현 시 쿼리 실수로 다른 팀 데이터 노출
- CVE-2024-10976: PostgreSQL RLS가 서브쿼리에서 사용자 ID 변경을 무시하는 취약점

**How to avoid:**
1. **Prisma Middleware로 자동 필터링**: 모든 쿼리에 자동으로 팀/소속 기반 필터 적용
2. **Row-Level Security (RLS)**: PostgreSQL RLS 정책으로 데이터베이스 레벨에서 강제 격리
3. **API 라우트별 권한 체크**: 모든 API 엔드포인트에서 명시적으로 권한 확인
4. **테스트 케이스**: 다른 팀 데이터 접근 시도에 대한 테스트 작성

**Warning signs:**
- 개발 중에 "실수로" 다른 팀 데이터가 보인 경험
- API 응답에 `teacherId`가 그대로 노출됨
- Prisma 쿼리에 `where: { teacherId: session.userId }`가 누락된 곳이 있음
- "그 선생님 데이터 왜 보여?"라는 사용자 리포트

**Phase to address:**
Phase 11 (선생님 인프라) - Prisma middleware 및 RLS 구현

---

### Pitfall 2: Next.js Middleware만으로 인증/인가 처리

**What goes wrong:**
Next.js middleware만으로 인증/인가를 처리하면 인증 우회 취약점이 발생합니다. middleware는 모든 요청을 가로채지 못하며, API 라우트, 페이지 레벨에서 추가 체크가 필요합니다.

**Why it happens:**
- Middleware가 API 라우트를 통과하지 않음 (matcher 설정 제외)
- `matcher` 설정으로도 `/api/*` 경로를 완전히 커버할 수 없음
- 커뮤니티에서 "middleware.ts로만 인증 처리하면 안 된다"는 경고가 있음
- Context sharing 문제로 middleware와 app 간 데이터 공유 어려움
- CVE-2025-29927: Next.js middleware authentication bypass vulnerability

**How to avoid:**
1. **Defense in Depth**: Middleware를 첫 번째 레이어로 사용, API/페이지 레벨에서 추가 체크
2. **Server Component에서 세션 확인**: 모든 protected 페이지에서 `getCurrentUser()` 호출
3. **API Route Handler에서 권한 확인**: 각 API 라우트에서 명시적으로 `session.userId` 체크
4. **RBAC Helper 함수**: `hasRole(user, 'admin')` 같은 유틸리티로 중앙 집중 관리

**Warning signs:**
- `middleware.ts`만 보고 "인증 완료"라고 생각함
- API 라우트 핸들러에 `const session = await getSession()` 체크가 없음
- 테스트에서 middleware를 우회하는 요청이 성공함
- "왜 이 API 직접 호출되지?"라는 보고

**Phase to address:**
Phase 11 (선생님 인프라) - RBAC 시스템 구현 시

---

### Pitfall 3: 마이그레이션 중 외래 키 제약 조건 실패

**What goes wrong:**
기존 `Student` 테이블에 `teamId` 외래 키를 추가하려 할 때, orphaned 레코드(팀이 없는 학생)가 있으면 마이그레이션이 실패합니다. 또한 테이블 전체 스캔으로 인해 프로덕션에서 장시간 다운타임 발생.

**Why it happens:**
- 현재 모든 학생이 단일 선생님 소속이나, 팀 개념이 없음
- `ALTER TABLE ADD FOREIGN KEY`는 기존 데이터를 검증하여 제약 조건 위반 시 실패
- PostgreSQL은 외래 키 추가 시 AccessExclusiveLock을 획득하여 모든 읽기/쓰기 차단
- 대규모 테이블에서는 검증에 시간이 오래 걸림 (50명 학생이라도 200개 관계 레코드)

**How to avoid:**
1. **NOT VALID 옵션 사용**: `ALTER TABLE ADD CONSTRAINT ... NOT VALID`로 검증 건너뛰기
2. **테이블 스캔 없이 컬럼 추가**: 먼저 nullable 컬럼으로 추가, 데이터 마이그레이션 후 NOT NULL 적용
3. **단계적 마이그레이션**:
   - 단계 1: `teamId` 컬럼 추가 (nullable, no FK)
   - 단계 2: 기존 데이터에 `teamId` 값 설정 (기존 teacher 팀으로)
   - 단계 3: Foreign key 제약 조건 추가 (NOT VALID)
   - 단계 4: `VALIDATE CONSTRAINT`로 백그라운드 검증
4. **Rollback 계획**: 마이그레이션 실패 시 복구 스크립트 준비

**Warning signs:**
- Prisma migrate 실행 시 "constraint violation" 에러
- 마이그레이션 스크립트가 실행 중에 멈춤 (테이블 크기에 따라 수분~수십분)
- 개발 환경에서는 되는데 운영 환경에서는 타임아웃
- "학생 데이터 다 사라졌어" (LOCK 대기에 의한 타임아웃)

**Phase to address:**
Phase 11 (선생님 인프라) - 데이터베이스 스키마 변경

---

### Pitfall 4: AI 궁합 분석 알고리즘 편향 (Bias)

**What goes wrong:**
AI 기반 선생님-학생 궁합 분석이 특정 성향, 성별, 배경을 가진 학생에게 불리한 결과를 도출하여 편향된 배정이 발생합니다. 이는 교육적 불평등을 야기하고 법적 문제가 될 수 있습니다.

**Why it happens:**
- 과거 학생 성적 데이터로 학습 시, 특정 그룹의 낮은 성과가 편향으로 반영
- 궁합 알고리즘이 MBTI, 사주 등 전통 분석에 과도하게 의존 시 성별/인종별 분포 차이 영향
- 알고리즘 투명성 부족으로 왜 특정 선생님이 추천되는지 설명 불가
- "AI 추천"이라는 권위로 인한 인간 판단 미숙종
- 교육 AI에서 소수자 학생이 과도하게 "위험군"으로 분류되는 문제

**How to avoid:**
1. **페어니스 메트릭 도입**: ABROCA, Disparity Index 등으로 알고리즘 편향 정량 측정
2. **보호 속성 제외**: 궁합 계산에 성별, 인종, 사회경제적 지표 제외
3. **인간 검증 계층**: AI 추천 후 원장/팀장의 최종 승인 프로세스
4. **설명 가능성**: "왜 이 선생님이 추천되었나?"에 대한 이유 제공 (성향 조합, 강점 매칭 등)
5. **정기 편향 감사**: 분기별로 궁합 배정 결과 편향 분석

**Warning signs:**
- 특정 성향의 학생이 항상 동일한 유형의 선생님에게 배정됨
- 여학생이 남학생보다 낮은 궁합 점수를 받는 경향
- "왜 이 추천이 나왔나?"에 대해 설명할 수 없음
- 보고서에 편향 분석 결과가 없음
- 특정 선생님이 항상 "좋은 학생"만 배정받음

**Phase to address:**
Phase 13 (궁합 분석) - 알고리즘 설계 및 검증

---

### Pitfall 5: 다중 LLM 통합 비용 폭증 및 Rate Limiting

**What goes wrong:**
Claude, Gemini, ChatGPT, Ollama를 동시에 사용하다가 예상치 못한 API 비용 폭증과 rate limit 초과로 서비스 중단 발생. 특히 Ollama 로컬 모델의 성능 저하로 전체 시스템 영향.

**Why it happens:**
- 각 LLM 제공자의 rate limit이 다름 (Claude: 50 req/min, Gemini: 60 req/min 등)
- 토큰 기반 과금 시 긴 응답(궁합 분석, 성과 보고서)이 비용 급증
- Ollama 로컬 모델 사용 시 GPU 자원 고갈로 다른 컨테이너 성능 저하
- Fallback 로직이 없어 한 LLM 장애 시 전체 기능 마비
- 비용 추적 미흡으로 어느 LLM이 얼마나 비용을 쓰는지 파악 불가

**How to avoid:**
1. **LLM Gateway 패턴**: 단일 인터페이스로 여러 LLM 관리, rate limiting 및 fallback 자동화
2. **토큰 사용량 추적**: 각 요청마다 토큰 수, 비용 로깅 (DB에 저장, 대시보드로 시각화)
3. **스마트 라우팅**:
   - 저비용 작업: Ollama 로컬 모델 활용
   - 고비용/복잡 작업: Claude/Gemini 사용
4. **비용 알림**: 일일/월별 비용 한도 설정, 초과 시 알림
5. **Queue 시스템**: 긴 작업(보고서 생성)은 백그라운드 job으로 처리

**Warning signs:**
- API 요청이 429 (Too Many Requests) 응답 반환
- 월별 AI API 비용이 예산의 2배 이상
- Ollama 사용 중 전체 서버 응답 속도 저하
- 특정 LLM 장애 시 전체 시스템 다운
- "API 비용이 왜 이렇게 나왔어?" (추적 불가)

**Phase to address:**
Phase 15 (다중 LLM) - LLM Gateway 구현

---

### Pitfall 6: 선생님 성과 분석의 편향된 지표

**What goes wrong:**
선생님 성과를 "학생 성적 향상"으로만 측정하면, 난이도 높은 학생을 맡은 선생님이 불이익을 받습니다. 이는 선생님이 좋은 조건의 학생만 선호하게 만들어 교육적으로 부정적인 결과 초래.

**Why it happens:**
- 성적 데이터만으로는 학생의 시작점, 노력, 외부 요인을 통제 불가
- 일부 선생님은 이미 성적이 좋은 학생만 배정받는 경향
- 단순 성적 비교는 "성적 향상률"이 아닌 "최종 성적"을 보게 됨
- 정량 지표만으로는 선생님의 코칭 능력, 상담 기술 등을 평가 불가
- 교육 AI에서 성과 평가 지표가 학생에게 불리하게 작용하는 문제

**How to avoid:**
1. **다차원 성과 지표**:
   - 학생 성적 향상 (전후 비교)
   - 학생/학부모 만족도 (설문)
   - 학생 유지율 (중도 탈락 방지)
   - 팀 내 기여도 (협업, 멘토링)
2. **통제 변수 반영**: 학생 시작 성적, 과외 횟수, 출석률 등을 통제한 "상대적 향상" 계산
3. **정성적 피드백**: 학생/동료 선생님 피드백 포함
4. **편향 감사**: 성과 분석 결과가 특정 유형의 선생님에게만 유리하지 않은지 검증
5. **개선-focused**: 평가 결과가 처벌이 아닌 "성장 계획"의 기반

**Warning signs:**
- 성적 좋은 학생만 맡은 선생님이 항상 최고 성과 등급
- 경력 선생님이 신임 선생님보다 항상 낮은 점수
- 성과 지표가 "성적 평균" 하나뿐임
- 선생님이 "어려운 학생은 안 받고 싶다"고 말함
- "공정하지 않아"라는 불만

**Phase to address:**
Phase 14 (성과 분석) - 성과 지표 설계

---

### Pitfall 7: Prisma 쿼리 N+1 문제로 성능 저하

**What goes wrong:**
팀 목록을 가져올 때, 각 팀의 선생님 수, 학생 수를 계산하기 위해 별도 쿼리를 실행하여 N+1 문제 발생. 팀이 10개면 11개 쿼리 실행으로 페이지 로딩 지연.

**Why it happens:**
- Prisma의 `include`를 사용하지 않고 관계 데이터를 따로 조회
- 각 팀마다 `await prisma.teacher.count({ where: { teamId: team.id } })` 실행
- Prisma middleware 필터링이 각 쿼리마다 중복 실행
- Next.js Server Component에서 `Promise.all()`로 병렬화하지 않음

**How to avoid:**
1. **Prisma include로 한 번에 로드**: `include: { teachers: true, students: true }`
2. **집계 쿼리 분리**: `_count`를 사용하여 카운트를 메인 쿼리에 포함
3. **데이터베이스 인덱스**: `teamId` 컬럼에 인덱스 추가
4. **쿼리 로깅**: Prisma middleware로 모든 쿼리 로깅, N+1 탐지
5. **로딩 상태 UI**: 데이터 로딩 중 skeleton 표시로 사용자 경험 개선

**Warning signs:**
- 브라우저 Network 탭에서 동일한 패턴의 쿼리가 N번 반복됨
- 페이지 로딩이 2초 이상 걸림
- Prisma 로그에 `SELECT * FROM Teacher WHERE teamId = $1`이 10번 반복됨
- 데이터베이스 CPU 사용率이 급증
- "팀 페이지 너무 느려"라는 불만

**Phase to address:**
Phase 12 (팀 데이터 접근 제어) - Prisma 쿼리 최적화

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| API 라우트에서만 권한 체크, DB 레벨 무시 | 개발 빠름, Prisma middleware 작성 안 함 | 데이터베이스 직접 접근 시 보안 구멍 | 프로토타입만, 운영에는 절대 안 됨 |
| 모든 선생님을 동일한 "teacher" 역할로 관리 | RBAC 테이블/로직 없이 간단 | 원장/팀장/매니저 구현 시 전면 재작성 | MVP만, v2에서는 역할 기반 권한 필수 |
| AI 궁합 점수만 저장, 이유 미저장 | DB 스키마 간단, 저장 공간 절약 | 사용자 질문에 답변 불가, 신뢰도 저하 | 초기 개발만, 운영에는 근거 저장 필수 |
| 하드코딩된 LLM API 키 | 별도 설정 관리 안 함, 개발 빠름 | 키 교체 불가, 비용 추적 불가, 보안 리스크 | 로컬 개발만, 운영에는 환경 변수/DB 저장 필수 |
| 궁합 분석 결과 캐싱 안 함 | 구현 간단, 항상 최신 데이터 | AI API 비용 폭증, 응답 지연 | NEVER - 항상 캐싱 구현 필요 |
| 팀 변경 시 즉시 적용 | 별도 승인 프로세스 없음 | 실수로 다른 팀으로 이동, 데이터 혼선 | 개발만, 운영에는 승인 프로세스 필수 |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| **Claude API** | 토큰 제한 확인 안 하고 대량 요청 | Rate limiting middleware, fallback 로직 구현 |
| **Gemini API** | 비용 토큰 계산 안 하고 긴 프롬프트 사용 | 입력/출력 토큰 추적, 비용 알림 설정 |
| **Ollama (로컬)** | GPU 메모리 확인 안 하고 여러 모델 로드 | 모델 언로드/로드 관리, 리소스 모니터링 |
| **PostgreSQL RLS** | Prisma client로 RLS 테스트 안 함 | `prisma.test()`로 RLS 정책 검증 |
| **Next.js Auth** | middleware만으로 만족, API route 체크 누락 | Middleware + API/페이지 레벨 이중 체크 |
| **Prisma Migrate** | NOT VALID 없이 FK 추가 | NOT VALID + 백그라운드 검증으로 무중단 마이그레이션 |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| **선생님-학생 1:N 관계만** | 팀별 통계 쿼리가 10초 이상 걸림 | 집계 테이블(materialized view) 도입 | 선생님 20명, 학생 200명 이상 |
| **AI 분석 매번 호출** | 동일한 학생 분석을 여러 번 요청 | 분석 결과 캐싱 (TTL: 30일) | 일일 50회 이상 분석 요청 |
| **Prisma 트랜잭션 미사용** | 선생님-학생 할당 중 데이터 불일치 | `prisma.$transaction()`으로 원자성 보장 | 동시 할당 요청 5회/초 이상 |
| **Client-side 필터링** | 팀 목록 페이지에서 1000명 선생님 로딩 | Server-side pagination, 검색 API | 선생님 50명 이상 |
| **Sync API 호출** | AI 분석 대기 중 페이지 프리징 | `after()` API 패턴, 진행 바 표시 | AI 응답 시간 5초 이상 |
| **Ollama GPU 자원** | 로컬 LLM 사용 중 다른 컨테이너 느려짐 | GPU 리소스 모니터링, 모델 언로드 | 동시 3개 이상 모델 로드 |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| **다른 팀 학생 ID로 조회 가능** | 개인정보 유출, 프라이버시 침해 | Prisma middleware로 모든 쿼리에 자동 필터 적용 |
| **API 응답에 teacherId 노출** | 시스템 구조 추측 가능, 공격 표면 증가 | 직렬화 계층에서 민감 필드 제거 |
| **세션에 권한 정보 미저장** | 매 요청마다 DB 조회로 성능 저하 + IDOR 위험 | 세션에 `userId`, `role`, `teamId` 캐싱 |
| **원장 권한 확인 누락** | 일반 선생님이 Admin 설정 접근 가능 | 각 API route에서 명시적 역할 체크 |
| **AI 프롬프트에 학생 개인정보 포함** | LLM 제공자 로그에 민감 정보 남음 | PI(개인정보) 식별 후 가명처리/마스킹 |
| **RLS 정책 서브쿼리 사용** | CVE-2024-10976 취약점으로 우회 가능 | RLS 정책에 서브쿼리 사용 자제, 테스트 강화 |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| **"AI 추천 결과가 나왔습니다"만 표시** | 선생님이 왜 추천되었는지 몰라 신뢰 저하 | "왜 이 선생님이 당신에게 맞나?"에 대한 3가지 이유 명시 |
| **팀 변경 시 별도 승인 없이 즉시 적용** | 실수로 다른 팀으로 이동, 데이터 혼선 | 팀 변경 요청 → 승인 프로세스 → 적용 |
| **성과 보고서가 너무 길어 읽기 어려움** | 핵심 인사이트 파악 불가, 활용 안 함 | 1페이지 요약 + 상세 보고서 분리 |
| **선생님 검색이 이름으로만 가능** | "성격이 비슷한 선생님 찾기" 등 불가능 | 다차원 필터: 성향, 경력, 전공, 팀 등 |
| **분석 중 프로그레스 바 없음** | 사용자가 멈춘 것으로 착각, 새로고침 반복 | 실시간 진행률(10% → 50% → 완료) 표시 |
| **선생님 프로필에 성향 분석만** | 학생 매칭에 필요한 정보 부족 | 성향 + 강점 약점 + 선호 학생 유형 + 배정 사례 |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **팀 데이터 분리**: API에서만 필터링하고 DB 레벨 RLS 미구현 — 데이터베이스 직접 접근 시 누설
- [ ] **권한 체크**: middleware만 체크하고 API route 누락 — middleware 우회 가능 경로 존재
- [ ] **마이그레이션**: 개발 환경에서 성공, 운영 데이터로 테스트 안 함 — orphaned 레코드로 실패
- [ ] **AI 궁합 분석**: 점수만 제공, 근거 없음 — 사용자 신뢰 획득 불가
- [ ] **다중 LLM**: API 키만 변경, fallback/queue 미구현 — 한 LLM 장애 시 전체 다운
- [ ] **성과 분석**: 성적 데이터만 사용, 편향 검증 없음 — 특정 선생님에게 불리
- [ ] **캐싱**: 개발 환경에서는 빨라서 캐시 안 넣음 — 운영에서 API 비용 폭증
- [ ] **RLS 테스트**: 수동으로만 확인, 자동화 테스트 없음 — CVE-2024-10976 같은 취약점 미탐지

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| **데이터 누설 발견** | HIGH (2-3일, 법적 리스크) | 1) 즉시 영향받은 사용자에게 알림 2) 접근 로그 분석 3) RLS 강제 적용 4) 펜트레이션 테스트 5) 법적 자문 |
| **마이그레이션 실패로 다운** | MEDIUM (4-8시간) | 1) 즉시 이전 버전으로 롤백 (Docker) 2) orphaned 레코드 정리 스크립트 실행 3) NOT VALID로 재시도 4) 오프피크 타임에 재시도 |
| **AI 알고리즘 편향 발견** | HIGH (1-2주, 재학습) | 1) 즉시 알고리즘 사용 중단 2) 영향받은 배정 재검토 3) 페어니스 메트릭 도입 4) 편향 제거 후 재학습 5) 재개 |
| **LLM 비용 폭증** | MEDIUM (1-2일) | 1) 문제 LLM 사용 중단 2) 캐싱 강화 3) 비용 한도 설정 4) 더 저렴한 모델로 전환 5) 비용 알림 설정 |
| **성과 분석 불만** | LOW (1주, 조정) | 1) 영향받은 선생님 피드백 수집 2) 지표 재검토 3) 편향 감사 4) 새 지표로 롤아웃 5) 커뮤니케이션 |
| **Prisma N+1 발견** | LOW (1-2일) | 1) 쿼리 로그로 문제 원인 파악 2) include/_count로 리팩토링 3) 인덱스 추가 4) 성능 테스트 5) 배포 |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 데이터 누설 | Phase 11 (선생님 인프라) | Prisma middleware + RLS 테스트: 다른 팀 사용자로 상대 팀 데이터 조회 시도 → 403 확인 |
| Middleware만 의존 | Phase 11 (선생님 인프라) | Integration test: middleware 우회 경로로 protected API 호출 시 401/403 확인 |
| 마이그레이션 FK 실패 | Phase 11 (선생님 인프라) | Staging 환경에서 운영 데이터 복제 후 마이그레이션 실행, orphaned 레코드 검증 |
| AI 알고리즘 편향 | Phase 13 (궁합 분석) | Fairness metric 계산: ABROCA, Disparity Index 통과 여부 확인, 편향 보고서 작성 |
| 다중 LLM 비용 폭증 | Phase 15 (다중 LLM) | Cost tracking: 일일/월별 비용 모니터링, 알림 작동 확인, fallback 테스트 |
| 성과 분석 편향 | Phase 14 (성과 분석) | Correlation analysis: 성과 지표와 학생 시작 성적 간 상관관계 검증 |
| Prisma N+1 쿼리 | Phase 12 (팀 데이터 접근 제어) | Query log: Prisma 로그로 쿼리 수 확인, 11개 이상이면 수정, 응답 시간 200ms 미만 확인 |

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation | Priority |
|-------------|---------------|------------|----------|
| Phase 11: 팀 데이터 모델 | RLS 미구현으로 데이터 누설 | Prisma middleware + PostgreSQL RLS 강제 | CRITICAL |
| Phase 11: 마이그레이션 | FK 제약 조건으로 다운타임 | NOT VALID + 백그라운드 검증 | CRITICAL |
| Phase 11: RBAC | Middleware만으로 만족 | Defense in Depth: API/페이지 레벨 체크 | CRITICAL |
| Phase 12: 팀 데이터 접근 제어 | Prisma N+1 쿼리 | include/_count, 쿼리 로깅 | HIGH |
| Phase 13: 궁합 분석 | 알고리즘 편향 | Fairness metrics, 설명 가능성 | HIGH |
| Phase 14: 성과 분석 | 단일 지표 편향 | 다차원 지표, 통제 변수 | MEDIUM |
| Phase 15: 다중 LLM | 비용 폭증, Rate limit | LLM Gateway, 캐싱, 비용 추적 | HIGH |

## Research Methodology

**Sources Used:**
- WebSearch: 11 queries covering multi-tenant isolation, RLS pitfalls, AI bias, multi-LLM integration, PostgreSQL migration, Next.js security
- Domains covered: Data isolation, authentication security, AI fairness, cost management, database migration
- Confidence level: MEDIUM (some sources from 2024-2025, limited v2.0-specific production data)

**Verification:**
- Multi-tenant data isolation verified against PostgreSQL RLS documentation and recent security research (CVE-2024-10976)
- Next.js middleware vulnerabilities verified against recent security disclosures and community best practices
- AI algorithm bias verified against educational research and fairness metrics literature
- Multi-LLM integration verified against 2025-2026 gateway patterns and cost management best practices
- PostgreSQL migration pitfalls verified against database administration resources

**Gaps:**
- Limited public information on Korean academy management system v2.0 migration patterns
- AI compatibility matching for teacher-student pairing is novel domain, limited production case studies
- Ollama integration patterns in production environments limited (mostly development usage documented)
- No specific research on "궁합 분석" (compatibility analysis) algorithm fairness in Korean educational context

**Confidence Assessment:**
- **Critical Pitfalls (1-3):** HIGH confidence (verified against CVE database, PostgreSQL documentation, security research)
- **AI/ML Pitfalls (4-6):** MEDIUM confidence (based on educational AI research, fairness metrics, but limited domain-specific data)
- **Performance Pitfalls (7):** MEDIUM confidence (common Prisma patterns, but scale-dependent)

## Sources

### Multi-tenant Data Isolation
- [Multi-Tenant Leakage: When Row-Level Security Fails in SaaS](https://medium.com/@instatunnel/multi-tenant-leakage-when-row-level-security-fails-in-saas-da25f40c788c) - CVE-2024-10976
- [Strict Data Isolation in Multi-tenant Systems with PostgreSQL](https://medium.com/@moyo.sore.oluwa/strict-data-isolation-in-multitenant-systems-with-postgresql-aa615052fe80)
- [8 Real-World Challenges in Multi-Tenant Database Architecture (2025)](https://rizqimulki.com/8-real-world-challenges-in-multi-tenant-database-architecture-and-how-to-solve-them-in-2025-ada203064b87)
- [How to Implement PostgreSQL Row Level Security for Multi-Tenant SaaS](https://www.techbuddies.io/2026/01/01/how-to-implement-postgresql-row-level-security-for-multi-tenant-saas/)

### PostgreSQL RLS & RBAC
- [Postgres RLS Implementation Guide - Best Practices](https://www.permit.io/blog/postgres-rls-implementation-guide)
- [How to Use Row-Level Security in PostgreSQL](https://oneuptime.com/blog/post/2026-01-25-use-row-level-security-postgresql/view)
- [PostgreSQL 9.5 - Row level security / ROLE best practices](https://stackoverflow.com/questions/34577784/postgresql-9-5-row-level-security-role-best-practices)

### Next.js Middleware Security
- [Organizations and role-based access control in Next.js (Clerk, Oct 2025)](https://clerk.com/blog/organizations-role-based-access-control-nextjs) - Middleware bypass vulnerability
- [The Hidden Pitfalls of Next.js Permissions (Medium)](https://medium.com/@instatunnel/the-hidden-pitfalls-of-next-js-permissions-and-how-i-solved-them)
- Reddit: [Using middleware VS auth checks on every page](https://www.reddit.com/r/NextJS/comments/) - Community consensus: never rely solely on middleware

### AI Algorithm Bias & Fairness
- [Algorithmic Bias in Education (Springer, 2021)](https://link.springer.com/article/10.1007/s40593-021-00285-9) - 1,126 citations
- [Navigating Fairness, Bias, and Ethics in Educational AI (arXiv, 2024)](https://arxiv.org/html/2407.18745v1)
- [Investigating algorithmic bias in student progress monitoring](https://www.sciencedirect.com/science/article/pii/S2666920X24000705)
- [Avoid Bias in Teacher Performance Evaluations](https://www.frontlineeducation.com/blog/avoid-bias-in-teacher-performance-evaluations/)
- [Fairness, Bias, and Ethics in AI: Student Performance Factors](https://www.researchgate.net/publication/392006131_Fairness_Bias_and_Ethics_in_AI_Exploring_the_Factors_Affecting_Student_Performance)

### Multi-LLM Integration
- [How an LLM Gateway Can Help You Build Better AI Applications (Dev.to, Dec 2025)](https://dev.to/kuldeep_paul/how-an-llm-gateway-can-help-you-build-better-ai-applications-27hf)
- [Why LLM Rate Limits and Throughput Matter (Codeant.ai, Jan 2026)](https://www.codeant.ai/blogs/llm-throughput-rate-limits)
- [AI API Aggregation: Managing Costs And Complexity (CloudZero, Nov 2025)](https://www.cloudzero.com/blog/ai-api-aggregation/)
- [10 Best Practices for Multi-Cloud LLM Security (Latitude.so, Oct 2025)](https://latitude.so/blog/10-best-practices-for-multi-cloud-llm-security/)
- [In-Depth Analysis of AI Gateway (Jimmy Song, Jun 2025)](https://jimmysong.io/blog/ai-gateway-in-depth/)

### PostgreSQL Migration
- [How to efficiently add constraints to existing tables in PostgreSQL](https://www.dbi-services.com/blog/how-to-efficiently-add-constraints-to-existing-tables-in-postgresql/)
- [Postgres: Adding Foreign Keys With Zero Downtime](https://travisofthenorth.com/blog/2017/2/2/postgres-adding-foreign-keys-with-zero-downtime)
- [Avoiding Common Foreign Key Mistakes in SQL Databases (Cockroach Labs, 2025)](https://www.cockroachlabs.com/blog/common-foreign-key-mistakes/)
- [Do you need NOT VALID when adding new foreign key column (DBA StackExchange, 2024)](https://dba.stackexchange.com/questions/343791/do-you-need-not-valid-when-adding-new-foreign-key-column)

### Performance & Architecture
- [PostgreSQL CDC Multi-Tenant Setups Done Right (StreamKap)](https://streamkap.com/resources-and-guides/postgresql-cdc-multi-tenant/)
- [Architectural Considerations for SaaS Application - Tenant Isolation (AWS, July 2025)](https://aws.plainenglish.io/architectural-considerations-for-saas-application-part-1-12-tenant-isolation-3f0412640ec2)

---
*Pitfalls research for: AI AfterSchool v2.0 Teacher Management System*
*Focus: Adding multi-user, team-based access control, and compatibility analysis to existing single-user system*
*Researched: 2026-01-30*
