# Feature Landscape: 선생님 관리 시스템, 궁합 분석, 다중 사용자 환경

**Domain:** Academy Teacher Management & Compatibility Analysis System
**Target Users:** Academy Directors, Team Managers, Teachers managing 50-200 students
**Researched:** 2026-01-30
**Confidence:** MEDIUM (WebSearch verified with multiple sources, domain-specific patterns from educational management systems)

## Executive Summary

v2.0 선생님 관리 시스템은 세 가지 핵심 축으로 구성됩니다:
1. **선생님 관리** (Teacher Management) - 선생님 정보 CRUD, 성향 분석, 계층 구조 관리
2. **팀 기반 데이터 접근 제어** (Team-Based Access Control) - 원장/팀장/매니저/선생님 역할별 권한 분리
3. **AI 기반 궁합 분석 및 배정** (Compatibility Analysis & Assignment) - 선생님-학생 궁합 분석, 자동 배정 제안

본 시스템의 핵심 차별화는 **성향 분석 기반의 선생님-학생 궁합 매칭과 AI 자동 배정**입니다.

---

## Table Stakes Features

다중 선생님 환경에서 사용자가 기대하는 필수 기능. 없으면 제품이 불완전하게 느껴짐.

### 1. Teacher Information Management (선생님 정보 관리)

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| 기본 정보 등록 (이름, 이메일, 연락처, 사진) | 모든 관리 시스템의 기초 | Low | None | 학생 정보 관리와 동일한 패턴 |
| 소속 팀 관리 | 조직 구조 파악 필수 | Low | 팀 정보 | 팀장/원장 구분 |
| 선생님 계정 생성 및 인증 | 보안 및 접근 제어 필수 | Medium | 기본 정보 등록 | 기존 선생님 인증 시스템 활용 |
| 선생님 목록 조회 및 검색 | 다수 선생님 관리 시 필수 | Medium | 기본 정보 등록 | 이름, 팀, 역할별 필터링 |
| 선생님 상세 정보 조회 | 개별 선생님 데이터 관리 | Low | 기본 정보 등록 | 성향 분석 결과 포함 |

**Sources:**
- [Teacher Leadership and Organizational Structure](http://ed.brocku.ca/~crutherford/home/Presentations_files/Teacher%20Leadership%20and%20organizational%20structure.pdf)
- [Private School Org Structure Guide](https://www.organimi.com/private-schoool-organizational-structure/)

### 2. Role-Based Access Control (역할 기반 접근 제어)

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| 역할 정의 (원장, 팀장, 매니저, 선생님) | 조직 계층 구조 반영 | Low | None | 4단계 계층 구조 |
| 역할별 권한 부여 | 데이터 접근 제어 필수 | Medium | 역할 정의 | 팀 데이터만 접근 등 |
| 팀 단위 데이터 분리 | 프라이버시 및 보안 | High | 역할 정의, 팀 정보 | 원장: 전체, 팀장: 소속 팀 |
| 인증된 사용자 세션 관리 | 다중 사용자 환경 필수 | Medium | 기존 인증 시스템 | 세션 만료, 재인증 |
| 권한 검증 미들웨어 | 모든 API 요청 보호 | Medium | 역할 정의 | Next.js middleware 활용 |

**Sources:**
- [Building Multi-Tenant Authorization with Dynamic Hierarchical RBAC](https://medium.com/@gskiran526/building-a-multi-tenant-authorization-service-with-dynamic-hierarchical-rbac-my-startup-journey-763d92e776fa)
- [Multi-Tenant LMS with Granular Role-Based Permissions](https://blog.braincert.com/what-is-a-multi-tenant-lms-a-complete-beginners-guide/)
- [Next.js Multi-Tenant Guide](https://nextjs.org/docs/app/guides/multi-tenant)
- [next-saas-rbac GitHub Repository](https://github.com/rcmonteiro/next-saas-rbac)

### 3. Student Assignment Management (학생 배정 관리)

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| 수동 학생 배정 (선생님 → 학생) | 기본 배정 기능 | Low | 선생님, 학생 정보 | 1:N 관계 (한 선생님 → 다수 학생) |
| 배정 현황 조회 | 현재 배정 상태 파악 | Medium | 배정 데이터 | 선생님별 학생 수, 학생별 담당 |
| 배정 변경 및 해제 | 유연한 관리 | Low | 배정 현황 | 이력 관리 필요 |
| 선생님별 학생 수 제한 | 부하 분산 | Low | 배정 현황 | 최대/최소 학생 수 설정 |

**Sources:**
- [Teacher Assignment Problem Solutions](https://ink.library.smu.edu.sg/context/sis_research/article/5005/viewcontent/Solving_the_Teacher_Assignment_Problem_b.pdf)
- [Multi-Objective Workload Allocation](http://paper.ijcsns.org/07_book/202009/20200908.pdf)

### 4. Teacher Performance Tracking (선생님 성과 추적)

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| 담당 학생 성적 변화 추적 | 선생님 효과성 측정 | Medium | 성적 데이터, 배정 정보 | 배정 전/후 비교 |
| 상담 이력 관리 | 선생님 활동 기록 | Low | 상담 데이터 | 학생별 상담 횟수, 내용 |
| 성과 리포트 생성 | 원장용 통계 | Medium | 모든 성과 데이터 | 팀/개별별 집계 |
| 선생님 프로필 성과 표시 | 선생님 정보 제공 | Low | 성과 데이터 | 요약 지표 표시 |

**Sources:**
- [Building a Ranking System for Lecturers Based on Student Evaluations](https://cyberleninka.ru/article/n/building-a-ranking-system-for-lecturers-based-on-student-evaluations-in-teaching-a-specific-course-a-case-study-at-a-university-in-1)
- [TEACHER RANKING SYSTEM](https://ictactjournals.in/paper/IJSC_Vol_8_Iss_2_Paper_2_1589_1596.pdf)

### 5. Multi-LLM Configuration (다중 LLM 설정)

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| LLM 제공자 등록 (Ollama, Gemini, ChatGPT, Claude) | 다양한 AI 모델 활용 | Medium | None | API 키 관리 |
| LLM 모델 선택 인터페이스 | 사용자 모델 선택 | Low | LLM 제공자 등록 | 기본 모델 설정 |
| API 키 및 설정 관리 | 보안 및 설정 | Low | LLM 제공자 등록 | 환경 변수 또는 DB 저장 |
| LLM 장애 조치 (failover) | 안정성 확보 | Medium | 다중 LLM 등록 | 한 모델 실패 시 다른 모델로 전환 |
| 사용량 모니터링 | 비용 및 성능 관리 | Medium | LLM 제공자 등록 | 토큰 수, 요청 수 추적 |

**Sources:**
- [One-API - LLM API Management System](https://github.com/songquanpeng/one-api)
- [Multi-Provider Chat App with LiteLLM](https://medium.com/@richardhightower/multi-provider-chat-app-litellm-streamlit-ollama-gemini-claude-perplexity-and-modern-llm-afd5218c7eab)
- [ThunderAI Addon Supporting Multiple LLMs](https://services.addons.thunderbird.net/zh-cn/thunderbird/addon/thunderai/)

---

## Differentiators

제품을 차별화하는 기능. 기대되지 않지만 가치가 있음.

### 1. Teacher Personality Analysis (선생님 성향 분석)

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| 선생님 MBTI 분석 | 선생님 성격 유형 파악 | Medium | MBTI 설문, AI 모델 | 학생 MBTI와 동일한 방식 |
| 선생님 사주 분석 | 전통적 성향 파악 | High | 생년월일시, 사주 DB | 학생 사주와 동일한 방식 |
| 선생님 성명학 분석 | 이름 기반 성향 파악 | Medium | 이름, 성명학 DB | 학생 성명학과 동일한 방식 |
| 선생님 관상/손금 분석 (선택) | 이미지 기반 성향 파악 | High | 사진 업로드, AI Vision | 학생과 동일한 방식 |
| 선생님 통합 성향 리포트 | 모든 분석 종합 | Medium | 모든 성향 분석 | 학생과 동일한 방식 |

**Value:** 선생님-학생 궁합 분석의 기초 데이터 제공. 학생 관리와 동일한 성향 분석 체계 적용으로 일관성 확보.

**Sources:**
- 기존 학생 성향 분석 시스템 (v1.0)
- [Recommender Systems for Teachers: A Systematic Literature Review](https://www.mdpi.com/2227-7102/14/7/723)

### 2. Teacher-Student Compatibility Analysis (선생님-학생 궁합 분석)

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| MBTI 궁합 분석 | 성격 유형별 상호작용 예측 | High | 선생님/학생 MBTI | 16유형별 궁합 매트릭스 |
| 사주 궁합 분석 | 전통적 궁합 판단 | High | 선생님/학생 사주 | 오행, 십신 조화 분석 |
| 성향 유사도/보완성 분석 | 성격 조합 평가 | High | 모든 성향 데이터 | AI 기반 유사度 계산 |
| 통합 궁합 점수 | 다각도 분석 종합 | High | 모든 궁합 분석 | 가중합 또는 ML 모델 |
| 궁합 리포트 생성 | 시각화된 궁합 결과 | Medium | 모든 궁합 분석 | PDF 출력 가능 |

**Value:** 기존 학원 시스템에 없는 **독보적 차별화 요소**. "맞춤형 선생님 배정"을 통해 학습 효과 극대화.

**Sources:**
- [An Educational System for Personalized Teacher Recommendation](https://arxiv.org/abs/2107.07124)
- [Self-Optimizing Teacher and Auto-Matching Student Model](https://dl.acm.org/doi/10.1145/3718091)
- [AI-Powered Education: Transforming Teacher-Student Relationships](https://onlinelibrary.wiley.com/doi/10.1111/ejed.70351)

### 3. AI-Based Automatic Assignment (AI 기반 자동 배정)

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| 궁합 기반 자동 배정 | 최적의 선생님-학생 쌍 추천 | High | 궁합 분석 | 최대 궁합 합 알고리즘 |
| 부하 분산 고려 배정 | 선생님별 학생 수 균형 | High | 선생님별 학생 수 | Min-max 최적화 |
| 선호도 반영 (선택) | 선생님/학생 선호도 고려 | High | 선호도 데이터 | 선호도 매트릭스 |
| 배정 시나리오 제안 | 여러 배정 옵션 제시 | Medium | 모든 배정 알고리즘 | 원장이 최종 선택 |
| 배정 결과 예측 | 배정 후 예상 성과 시뮬레이션 | High | 성과 데이터, 궁합 | ML 기반 예측 모델 |

**Value:** 원장의 의사결정 지원. "누구에게 이 학생을 맡길까?"라는 고민을 AI가 자동화.

**Sources:**
- [Solving the Teacher Assignment Problem](https://ink.library.smu.edu.sg/context/sis_research/article/5005/viewcontent/Solving_the_Teacher_Assignment_Problem_b.pdf)
- [Algorithm for Automation of Teacher-Course Allotment](https://www.researchgate.net/publication/370797375_Algorithm_for_automation_of_the_teacher-course_allotment)
- [An Automated Task Assignment System for University Lecturers](https://ph03.tci-thaijo.org/index.php/pitjournal/article/download/722/2348/12087)

### 4. Team Composition Analysis (팀 구성 분석)

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| 팀내 성향 다양성 분석 | 팀의 균형 평가 | Medium | 팀원 성향 데이터 | MBTI 분포, 사주 오행 균형 |
| 팀 전문성 커버리지 분석 | 전분야 커버 여부 확인 | Medium | 선생님 전문 분야 (선택) | 과목/강점 분야 매핑 |
| 팀 성과 시각화 | 팀별 비교 | Medium | 팀별 학생 성과 | 리더보드, 차트 |
| 팀 구성 개선 제안 | 최적의 팀 구조 추천 | High | 모든 팀 데이터 | AI 기반 조합 최적화 |

**Value:** 팀장/원장이 팀의 강점과 약점을 파악하고, 팀 구성을 최적화.

**Sources:**
- [Management and Personnel Hierarchy in Education Management](https://www.researchgate.net/publication/372656710_Manager_and_Personnel_Hierarchy_in_Education_Management)
- [Organisation Design Guide for School Leaders](https://www.education.vic.gov.au/hrweb/Documents/Org-Design-Guide.pdf)

### 5. Student-Specific Teacher Recommendation (학생별 선생님 추천)

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| 학생 성향 기반 추천 | 학생에게 맞는 선생님 순위 | High | 학생/선생님 성향, 궁합 | 개인화된 순위 리스트 |
| 추천 이유 설명 | 왜 이 선생님이 맞는지? | Medium | 궁합 분석 | 자연어 설명 생성 |
| 추천 결과 비교 | 여러 후보 비교 | Medium | 추천 리스트 | 표 형식 비교 뷰 |
| 추천 배정 일괄 적용 | 한 번에 여러 학생 배정 | Medium | 추천 리스트 | 대량 배정 기능 |

**Value:** 학생별 최적의 선생님 찾기. "이 학생은 어떤 선생님과 잘 맞을까?" 자동화.

**Sources:**
- [Recommender System in Academic Choices of Higher Education](https://ieeexplore.ieee.org/iel7/6287639/10380310/10444757.pdf)
- [Career Compass AI-Powered Guidance System](https://www.techrxiv.org/users/942048/articles/1322433-career-compass-an-ai-powered-career-guidance-system-based-on-interests-skills-and-soft-skill-profiling)

---

## Anti-Features

명시적으로 구축하지 **말아야** 할 기능. 이 도메인에서 흔한 실수.

### 1. Over-Complex Multi-Academy Franchise Management

**Why Avoid:**
- v2.0은 단일 학원 내 선생님 관리에 집중해야 함
- 프랜차이즈/분원 관리 기능은 복잡도 급증
- 사용자 혼란 가중 (어떤 학원의 데이터인지?)

**What to Do Instead:**
- 단일 학원에 최적화된 팀 구조만 지원
- 필요시 학원별로 독립적인 인스턴스 배포

**Sources:**
- [Multi-Academy Trust Software](https://www.theaccessgroup.com/en-gb/education/sectors/trusts/) (대규모 신뢰에만 해당)

### 2. Real-Time Chat/Messaging Between Teachers

**Why Avoid:**
- 학원 선생님들은 대면 소통이 주요
- 카카오톡 등 외부 메신저로 충분
- 실시간 채팅 구현 복잡도 높음 (웹소켓, 메시지 큐)

**What to Do Instead:**
- 공지사항 게시판 (일방향)
- 배정/성과 알림 (푸시 또는 이메일)
- 기존 소통 도구 활용 유도

**Sources:**
- [Best Classroom Management Software 2026](https://www.capterra.com/classroom-management-software/) (채팅보다는 출결/성적 관리 중심)

### 3. Overly Granular Permission System

**Why Avoid:**
- 4단계 계층(원장/팀장/매니저/선생님)으로 충분
- 세밀한 권한(읽기/쓰기/삭제/승인 등)은 관리 복잡
- 교육 기관 특성상 단순한 권한 구조가 효율적

**What to Do Instead:**
- 역할별 기본 권한 (원장: 전체, 팀장: 팀, 매니저: 팀, 선생님: 본인)
- 데이터 접근 범위 제어 (팀 기반)
- 단순한 CRUD 권한 (전체 읽기 vs. 제한된 쓰기)

**Sources:**
- [Granular Role-Based Permissions in Multi-Tenant LMS](https://blog.braincert.com/what-is-a-multi-tenant-lms-a-complete-beginners-guide/) (과도한 세분화 경고)

### 4. Predictive Analytics Without Sufficient Data

**Why Avoid:**
- 50-200명 규모는 ML 모델 학습에 데이터 부족
- 과도한 예측 기능은 신뢰성 저하
- "빈 잔에 물 붓기" 안티패턴

**What to Do Instead:**
- 규칙 기반 배정 (궁합 점수 + 부하 분산)
- 기술 통계 (평균, 분포, 추세)
- 데이터 축적 후 점진적 ML 도입

**Sources:**
- [AI in Student Management Systems](https://www.nature.com/articles/s41598-025-19159-4) (데이터 필요성 강조)

### 5. Complex Scheduling/Time Slot Management

**Why Avoid:**
- v2.0은 배정에 집중, 시간표 관리는 별도 도메인
- 학원 시간표는 복잡 (과목, 교실, 시간대 충돌)
- 기존 시간표 소프트웨어 활용 권장

**What to Do Instead:**
- 선생님-학생 관계(배정)만 관리
- 시간표는 외부 도구 연동 또는 v2.1로 미룸
- 단순한 "담당 선생님" 개념만 유지

**Sources:**
- [Top Academy Management Software](https://pjsofttech.com/blog/top-5-academy-management-software) (시간표는 별도 모듈)

---

## Feature Dependencies

```
Core Teacher Data (선생님 기본 정보)
├── Team Assignment (소속 팀 관리)
├── Teacher Authentication (선생님 인증)
│   └── Role-Based Access Control (역할 기반 접근 제어)
│       ├── Team-Based Data Isolation (팀 단위 데이터 분리)
│       └── Permission Middleware (권한 검증 미들웨어)
├── Teacher Personality Analysis (선생님 성향 분석)
│   ├── MBTI Analysis (선생님 MBTI)
│   ├── Saju Analysis (선생님 사주)
│   ├── Name Analysis (선생님 성명학)
│   └── Integrated Teacher Personality Report (선생님 통합 성향 리포트)
└── Student Assignment (학생 배정)
    ├── Manual Assignment (수동 배정)
    └── Automatic Assignment (자동 배정)
        ├── Teacher-Student Compatibility Analysis (선생님-학생 궁합 분석)
        │   ├── MBTI Compatibility (MBTI 궁합)
        │   ├── Saju Compatibility (사주 궁합)
        │   ├── Personality Similarity (성향 유사도/보완성)
        │   └── Integrated Compatibility Score (통합 궁합 점수)
        ├── Workload Balancing (부하 분산)
        │   └── Teacher Student Count Limits (선생님별 학생 수 제한)
        └── Assignment Recommendation (배정 추천)
            └── Assignment Scenarios (배정 시나리오)

Teacher Performance Tracking (선생님 성과 추적)
├── Student Grade Tracking (담당 학생 성적 변화)
├── Counseling History (상담 이력)
└── Performance Reports (성과 리포트)

Team Composition Analysis (팀 구성 분석)
├── Team Diversity Metrics (팀내 성향 다양성)
├── Team Coverage Analysis (팀 전문성 커버리지)
└── Team Performance Visualization (팀 성과 시각화)

Multi-LLM Configuration (다중 LLM 설정)
├── LLM Provider Registration (LLM 제공자 등록)
├── API Key Management (API 키 관리)
├── Model Selection Interface (모델 선택 인터페이스)
└── LLM Failover (LLM 장애 조치)

Student-Specific Teacher Recommendation (학생별 선생님 추천)
├── Personalized Ranking (개인화된 순위)
├── Recommendation Explanation (추천 이유 설명)
└── Comparison View (후보 비교)
```

**Critical Path (MVP 필수):**
1. Core Teacher Data → 2. Teacher Authentication & RBAC → 3. Team-Based Data Isolation → 4. Student Assignment → 5. Teacher-Student Compatibility Analysis → 6. Automatic Assignment

**Parallel Tracks:**
- Teacher Personality Analysis (학생 성향 분석과 병행 구현 가능)
- Multi-LLM Configuration (독립적으로 구현 가능)
- Performance Tracking (데이터 축적 후 구현 가능)

---

## MVP Recommendation

**v2.0은 다중 선생님 지원과 궁합 분석 검증이 핵심이므로, "차별화 요소를 먼저 구현"하는 전략을 권장합니다.**

### Phase 1 (Core Teacher Management & Access Control)
1. ✅ **선생님 기본 정보 관리** (이름, 이메일, 연락처, 사진, 소속 팀)
2. ✅ **선생님 계정 생성 및 인증** (기존 시스템 활용)
3. ✅ **역할 정의** (원장, 팀장, 매니저, 선생님)
4. ✅ **역할별 권한 부여** (팀 데이터 접근 제어)
5. ✅ **팀 단위 데이터 분리** (Prisma 쿼리 필터링)

**Rationale:**
- 다중 선생님 지원의 기반이 되는 보안/접근 제어 먼저 구현
- v1.0 선생님 인증 시스템 확장
- 데이터 프라이버시 보장

### Phase 2 (Teacher Analysis & Assignment)
6. ✅ **선생님 성향 분석** (MBTI, 사주, 성명학) - 학생과 동일한 방식
7. ✅ **학생 수동 배정** (선생님 → 학생 1:N 관계)
8. ✅ **선생님-학생 궁합 분석** (MBTI, 사주 기반)
9. ✅ **AI 자동 배정 제안** (궁합 + 부하 분산)
10. ✅ **학생별 선생님 추천** (맞춤 순위)

**Rationale:**
- 차별화 핵심 기능 구현
- 선생님 성향 분석은 학생과 동일한 방식으로 일관성 확보
- 궁합 분석의 정확도와 유용성 검증

### Phase 3 (Advanced Features)
11. 선생님 성과 추적 (담당 학생 성적 변화)
12. 팀 구성 분석 (성향 다양성, 전문성 커버리지)
13. 다중 LLM 설정 (Ollama, Gemini, ChatGPT, Claude)
14. 배정 결과 예측 (ML 기반)

**Rationale:**
- 시스템 안정화 후 고급 기능 추가
- 데이터 축적 후 ML 도입
- 사용자 피드백 기반 우선순위 조정

### Defer to Post-MVP

- **프랜차이즈 분원 관리**: 단일 학원 검증 후 확장 (v3.0)
- **실시간 채팅**: 외부 메신저 활용 유도
- **복잡한 시간표 관리**: 별도 도구 또는 v2.1
- **예측 분석**: 데이터 충적 후 도입

---

## Complexity Analysis

| Feature Category | Development Complexity | AI Model Complexity | Data Requirements | Maintenance Cost |
|------------------|------------------------|---------------------|-------------------|------------------|
| Teacher Management | Low | None | 선생님 기본 정보 | Low |
| RBAC | Medium-High | None | 역할, 권한, 팀 데이터 | Medium |
| **Teacher Personality Analysis** | **Medium** | **Medium** | **선생님 성향 데이터** | **Medium** |
| **Compatibility Analysis** | **High** | **High** | **선생님+학생 성향, 궁합 알고리즘** | **High** |
| **Automatic Assignment** | **High** | **High** | **궁합, 부하 분산 알고리즘** | **Medium** |
| Performance Tracking | Medium | None | 성적, 상담 이력 | Medium |
| Team Composition Analysis | Medium | Low-Medium | 팀원 성향 데이터 | Low |
| Multi-LLM Configuration | Medium | None | LLM API 키, 설정 | Medium |
| Student-Specific Recommendation | High | High | 모든 궁합 데이터 | High |

**Highest Risk:**
- **RBAC 복잡도**: 팀 단위 데이터 분리 구현 시 버그 발생 가능성 (보안 리스크)
- **궁합 분석 정확도**: MBTI/사주 궁합의 과학적 검증 부족, 전문가 감수 필요
- **자동 배정 알고리즘**: 궁합 vs 부하 분산 트레이드오프, 최적화 문제

---

## Market Positioning

### Table Stakes만 구현 시
- 기존 학원 관리 프로그램과 유사한 수준
- 선생님 관리 기능은 이미 많은 솔루션에서 제공
- 차별화 요소 없음

### Differentiators 포함 시
- **독보적 포지셔닝**: "AI 기반 선생님-학생 궁합 분석 및 자동 배정 시스템"
- **프리미엄 가격 정당화**: 학원 운영의 효율성과 학습 성과 향상 기여
- **브랜드 가치**: "첨단 AI 기술로 최적의 선생님-학생 쌍을 찾는 학원"

**Recommendation:**
MVP부터 Differentiators(궁합 분석, 자동 배정) 중심으로 구축하여 시장 차별화를 먼저 확보.

---

## Implementation Notes

### 1. Team-Based Data Isolation (팀 단위 데이터 분리)

**Prisma Query Filter Pattern:**
```typescript
// 모든 쿼리에서 자동으로 팀 필터링
const teachers = await prisma.teacher.findMany({
  where: {
    teamId: user.teamId, // 팀장/매니저는 자신의 팀만
    // 원장은 모든 팀 접근
  }
});
```

**Next.js Middleware Pattern:**
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const user = await getUser(request);
  if (user.role === 'TEAM_LEADER') {
    // 팀 데이터만 접근 가능하도록 헤더 추가
    request.headers.set('x-team-id', user.teamId);
  }
}
```

**Sources:**
- [Implementing Multi-Tenancy in Next.js with Prisma](https://qaffaf.medium.com/implementing-multi-tenancy-in-a-next-js-4f2608633a38)
- [Security Best Practices for Next.js Prisma SaaS](https://makerkit.dev/docs/nextjs-prisma/security)

### 2. Compatibility Analysis Algorithm (궁합 분석 알고리즘)

**Simple Approach (규칙 기반):**
```typescript
function calculateCompatibility(teacher: Personality, student: Personality): number {
  const mbtiScore = mbtiCompatibility(teacher.mbti, student.mbti); // 0-100
  const sajuScore = sajuCompatibility(teacher.saju, student.saju); // 0-100
  const nameScore = nameCompatibility(teacher.name, student.name); // 0-100

  // 가중평균
  return (mbtiScore * 0.4) + (sajuScore * 0.4) + (nameScore * 0.2);
}
```

**Advanced Approach (ML 기반):**
- 과거 배정 데이터와 성과로 학습
- 특징: MBTI 차이, 사주 오행 조화, 성격 유사도, 선생님 경력 등
- 모델: Random Forest, XGBoost, 또는 Neural Network

**Sources:**
- [Self-Optimizing Teacher and Auto-Matching Student Model](https://dl.acm.org/doi/10.1145/3718091) (Transformer encoder 활용)

### 3. Automatic Assignment Algorithm (자동 배정 알고리즘)

**Optimization Problem:**
- 목적 함수: 전체 궁합 합最大化
- 제약 조건:
  - 각 선생님의 학생 수 ≤ 최대 capacity
  - 각 선생님의 학생 수 ≥ 최소 capacity (부하 분산)
  - 각 학생은 정확히 1명의 선생님에게 배정

**Algorithm Options:**
1. **Greedy Approach** (빠르지만 최적이 아닐 수 있음)
   - 궁합 점수가 높은 순으로 배정
   - 선생님 capacity 확인 후 배정

2. **Hungarian Algorithm** (최적이지만 1:1 배정만 지원)
   - 선생님-학생 쌍의 비용 행렬
   - O(n³) 시간 복잡도

3. **Integer Linear Programming** (최적 + 다중 제약)
   - PuLP, Google OR-Tools 활용
   - 복잡한 제약 조건 처리 가능

**Sources:**
- [Solving the Teacher Assignment Problem](https://ink.library.smu.edu.sg/context/sis_research/article/5005/viewcontent/Solving_the_Teacher_Assignment_Problem_b.pdf)
- [Algorithm for Automation of Teacher-Course Allotment](https://www.researchgate.net/publication/370797375_Algorithm_for_automation_of_the_teacher-course_allotment)
- [Hungarian Algorithm for Teacher Assignment](https://scispace.com/pdf/algorithms-and-data-structures-for-automated-teaching-530dk2mq5g.pdf)

### 4. Multi-LLM Provider Management (다중 LLM 제공자 관리)

**Unified Interface Pattern:**
```typescript
interface LLMProvider {
  name: string;
  type: 'ollama' | 'openai' | 'anthropic' | 'google';
  apiKey: string;
  baseUrl: string;
  models: string[];
}

async function callLLM(provider: LLMProvider, prompt: string, model: string): Promise<string> {
  switch (provider.type) {
    case 'ollama':
      return await callOllama(provider.baseUrl, model, prompt);
    case 'openai':
      return await callOpenAI(provider.apiKey, model, prompt);
    // ...
  }
}
```

**Failover Strategy:**
```typescript
async function callLLMWithFailover(providers: LLMProvider[], prompt: string, model: string): Promise<string> {
  for (const provider of providers) {
    try {
      return await callLLM(provider, prompt, model);
    } catch (error) {
      console.error(`${provider.name} failed, trying next...`);
      // 다음 제공자 시도
    }
  }
  throw new Error('All LLM providers failed');
}
```

**Sources:**
- [One-API Architecture](https://github.com/songquanpeng/one-api) (통합 API 패턴 참조)
- [Multi-Provider Chat App with LiteLLM](https://medium.com/@richardhightower/multi-provider-chat-app-litellm-streamlit-ollama-gemini-claude-perplexity-and-modern-llm-afd5218c7eab)

---

## Sources Summary

**Teacher Management & Access Control:**
- [Building Multi-Tenant Authorization with Dynamic Hierarchical RBAC](https://medium.com/@gskiran526/building-a-multi-tenant-authorization-service-with-dynamic-hierarchical-rbac-my-startup-journey-763d92e776fa)
- [Multi-Tenant LMS with Granular Role-Based Permissions](https://blog.braincert.com/what-is-a-multi-tenant-lms-a-complete-beginners-guide/)
- [Next.js Multi-Tenant Guide](https://nextjs.org/docs/app/guides/multi-tenant)
- [next-saas-rbac GitHub Repository](https://github.com/rcmonteiro/next-saas-rbac)
- [Implementing Multi-Tenancy in Next.js with Prisma](https://qaffaf.medium.com/implementing-multi-tenancy-in-a-next-js-4f2608633a38)
- [Security Best Practices for Next.js Prisma SaaS](https://makerkit.dev/docs/nextjs-prisma/security)

**Teacher Assignment Algorithms:**
- [Solving the Teacher Assignment Problem](https://ink.library.smu.edu.sg/context/sis_research/article/5005/viewcontent/Solving_the_Teacher_Assignment_Problem_b.pdf)
- [Algorithm for Automation of Teacher-Course Allotment](https://www.researchgate.net/publication/370797375_Algorithm_for_automation_of_the_teacher-course_allotment)
- [An Automated Task Assignment System for University Lecturers](https://ph03.tci-thaijo.org/index.php/pitjournal/article/download/722/2348/12087)
- [Multi-Objective Workload Allocation](http://paper.ijcsns.org/07_book/202009/20200908.pdf)
- [Hungarian Algorithm for Teacher Assignment](https://scispace.com/pdf/algorithms-and-data-structures-for-automated-teaching-530dk2mq5g.pdf)

**AI-Based Matching & Compatibility:**
- [An Educational System for Personalized Teacher Recommendation](https://arxiv.org/abs/2107.07124)
- [Self-Optimizing Teacher and Auto-Matching Student Model](https://dl.acm.org/doi/10.1145/3718091)
- [AI-Powered Education: Transforming Teacher-Student Relationships](https://onlinelibrary.wiley.com/doi/10.1111/ejed.70351)
- [AI in Student Management Systems](https://www.nature.com/articles/s41598-025-19159-4)

**Teacher Performance & Recommendation Systems:**
- [Building a Ranking System for Lecturers Based on Student Evaluations](https://cyberleninka.ru/article/n/building-a-ranking-system-for-lecturers-based-on-student-evaluations-in-teaching-a-specific-course-a-case-study-at-a-university-in-1)
- [TEACHER RANKING SYSTEM](https://ictactjournals.in/paper/IJSC_Vol_8_Iss_2_Paper_2_1589_1596.pdf)
- [Recommender Systems for Teachers: A Systematic Literature Review](https://www.mdpi.com/2227-7102/14/7/723)
- [Recommender System in Academic Choices of Higher Education](https://ieeexplore.ieee.org/iel7/6287639/10380310/10444757.pdf)

**Multi-LLM Management:**
- [One-API - LLM API Management System](https://github.com/songquanpeng/one-api)
- [Multi-Provider Chat App with LiteLLM](https://medium.com/@richardhightower/multi-provider-chat-app-litellm-streamlit-ollama-gemini-claude-perplexity-and-modern-llm-afd5218c7eab)
- [ThunderAI Addon Supporting Multiple LLMs](https://services.addons.thunderbird.net/zh-cn/thunderbird/addon/thunderai/)

**Academy Organization Structure:**
- [Teacher Leadership and Organizational Structure](http://ed.brocku.ca/~crutherford/home/Presentations_files/Teacher%20Leadership%20and%20organizational%20structure.pdf)
- [Private School Org Structure Guide](https://www.organimi.com/private-schoool-organizational-structure/)
- [Management and Personnel Hierarchy in Education Management](https://www.researchgate.net/publication/372656710_Manager_and_Personnel_Hierarchy_in_Education_Management)
- [Organisation Design Guide for School Leaders](https://www.education.vic.gov.au/hrweb/Documents/Org-Design-Guide.pdf)

**Data Security & Privacy:**
- [Data Security in 2026 and Beyond](https://www.proofpoint.com/us/resources/webinars/data-security-2026-and-beyond-whats-evolving-and-whats-enduring-featuring)
- [Tech Outlook 2026: What Higher Ed Tech Leaders Expect](https://campustechnology.com/articles/2026/01/29/tech-outlook-2026-what-higher-ed-tech-leaders-expect-this-year.aspx)

---

## Quality Gate Checklist

- [x] **Categories are clear** (table stakes vs differentiators vs anti-features)
- [x] **Complexity noted for each feature** (Low/Medium/High + AI model complexity)
- [x] **Dependencies between features identified** (Dependency tree diagram included)
- [x] **MVP recommendation provided** (Phased approach with rationale)
- [x] **Market positioning analyzed** (Table stakes vs differentiators impact)
- [x] **Sources documented** (Multiple sources with URLs)
- [x] **Anti-features justified** (Clear explanation of why to avoid)
- [x] **Implementation notes included** (Specific patterns and algorithms)

---

**Confidence Level: MEDIUM**
- Teacher management features: HIGH (established patterns from educational systems)
- RBAC implementation: HIGH (Next.js + Prisma patterns verified)
- Compatibility analysis: MEDIUM (emerging field, limited validation data)
- Automatic assignment algorithms: HIGH (academic research available, but practical validation needed)
- Multi-LLM management: HIGH (One-API pattern proven)
- Anti-features: MEDIUM (inferred from best practices, domain-specific considerations)

**Recommendation for Next Steps:**
1. Prototype RBAC with team-based data isolation (security critical)
2. Validate MBTI/사주 궁합 알고리즘 with domain experts (명리학 전문가)
3. Interview 2-3 학원 원장님 to validate feature priorities and assignment workflow
4. Benchmark automatic assignment algorithms (Greedy vs Hungarian vs ILP) with sample data
5. Evaluate One-API architecture for multi-LLM management (consider integration vs. custom implementation)
