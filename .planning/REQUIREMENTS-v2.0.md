# Requirements: AI AfterSchool v2.0

**Defined:** 2026-01-30
**Core Value:** 학생 정보 통합 관리를 기반으로 AI 성향 분석 및 맞춤형 학습/진로 제안 제공

## v2.0 Requirements

선생님 관리 시스템을 위한 요구사항. 다중 선생님 지원, 계층적 관리 구조, 선생님-학생 궁합 분석, AI 기반 최적 배정 시스템을 포함.

### 선생님 관리 (TEACH)

- [ ] **TEACH-01**: 선생님 기본 정보 관리 (이름, 이메일, 연락처, 사진, 소속 팀)
- [ ] **TEACH-02**: 선생님 계층 구조 (원장 > 팀장 > 매니저 > 선생님)
- [ ] **TEACH-03**: 팀 단위 데이터 접근 제어 (원장: 전체, 팀장: 소속 팀만)
- [ ] **TEACH-04**: 선생님 성향 분석 (MBTI, 사주, 성명학, 관상, 손금)
- [ ] **TEACH-05**: 선생님 목록 조회 및 검색
- [ ] **TEACH-06**: 선생님 상세 정보 조회

### 궁합 분석 및 배정 (MATCH)

- [ ] **MATCH-01**: 수동 학생 배정 (선생님에게 학생 할당)
- [ ] **MATCH-02**: 선생님-학생 궁합 분석 (AI 기반 가중 평균: MBTI 25%, 학습 스타일 25%, 사주 20%, 성명학 15%, 부하 분산 15%)
- [ ] **MATCH-03**: AI 자동 배정 제안 (궁합 최대화 + 부하 분산 최적화)
- [ ] **MATCH-04**: 학생별 선생님 추천 (개인화된 순위 및 추천 이유)

### 성과 분석 (PERF)

- [ ] **PERF-01**: 선생님별 담당 학생 목록 조회
- [ ] **PERF-02**: 다차원 성과 분석 (성적 향상률, 상담 횟수, 학생 만족도, 통제 변수)
- [ ] **PERF-03**: 팀 구성 분석 (성향 다양성, 전문성 커버리지)

### AI 설정 (AI)

- [ ] **AI-01**: Admin 설정 기능 (원장 전용, LLM 선택 등 시스템 설정)
- [ ] **AI-02**: 다중 LLM 설정 (Ollama 로컬, Gemini, ChatGPT, Claude)

## v2.1 Requirements

다음 마일스톤으로 미룸.

- 출결/수강료 관리
- 학부모 포털
- 대학/학과 데이터베이스

## Out of Scope

명시적 제외 사항. 범위 크리프 방지.

| Feature | Reason |
|---------|--------|
| 프랜차이즈 분원 관리 | 단일 학원에 집중 |
| 실시간 채팅 | 외부 메신저 활용 유도 |
| 과도하게 세밀한 권한 시스템 | 4단계 역할로 충분 |
| 데이터 부족한 예측 분석 | 규칙 기반으로 충분 |
| 복잡한 시간표 관리 | 별도 도구 또는 v2.1 |

## Traceability

어떤 단계가 어떤 요구사항을 커버하는지. 로드맵 생성 시 업데이트.

| Requirement | Phase | Status |
|-------------|-------|--------|
| TEACH-01 | Phase 11 | Pending |
| TEACH-02 | Phase 11 | Pending |
| TEACH-03 | Phase 11 | Pending |
| TEACH-04 | Phase 12 | Pending |
| TEACH-05 | Phase 11 | Pending |
| TEACH-06 | Phase 11 | Pending |
| MATCH-01 | Phase 13 | Pending |
| MATCH-02 | Phase 13 | Pending |
| MATCH-03 | Phase 13 | Pending |
| MATCH-04 | Phase 13 | Pending |
| PERF-01 | Phase 14 | Pending |
| PERF-02 | Phase 14 | Pending |
| PERF-03 | Phase 14 | Pending |
| AI-01 | Phase 15 | Pending |
| AI-02 | Phase 15 | Pending |

**Coverage:**
- v2.0 requirements: 14 total
- Mapped to phases: 0 (로드맵 생성 시 업데이트)
- Unmapped: 14 ⚠️

---
*Requirements defined: 2026-01-30*
*Last updated: 2026-01-30 after initial definition*
