# Requirements: AI AfterSchool

**Defined:** 2026-01-27
**Core Value:** 학생 정보 통합 관리를 기반으로 AI 성향 분석 및 맞춤형 학습/진로 제안 제공

## v1 Requirements

### Authentication (인증)

- [x] **AUTH-01**: 선생님이 이메일/비밀번호로 로그인할 수 있다
- [x] **AUTH-02**: 선생님이 이메일 링크로 비밀번호를 재설정할 수 있다
- [x] **AUTH-03**: 브라우저 새로고침 후에도 로그인이 유지된다
- [x] **AUTH-04**: 여러 선생님이 각자 계정으로 접속할 수 있다

### Student Management (학생 관리)

- [x] **STUD-01**: 학생 기본 정보를 등록할 수 있다 (이름, 생년월일, 연락처)
- [x] **STUD-02**: 학생 사진을 업로드할 수 있다
- [x] **STUD-03**: 학생 학업 정보를 등록할 수 있다 (학교, 학년, 목표 대학/학과)
- [x] **STUD-04**: 학생 목록을 조회할 수 있다
- [x] **STUD-05**: 학생을 이름/학교로 검색할 수 있다
- [x] **STUD-06**: 학생 상세 정보를 조회할 수 있다
- [x] **STUD-07**: 학생 혈액형을 등록할 수 있다

### Calculation Analysis (계산 기반 분석)

- [x] **CALC-01**: 생년월일시 기반 사주팔자를 계산하고 해석을 제공한다
- [x] **CALC-02**: 한글/한자 이름의 획수 및 수리(원격, 형격, 이격, 정격) 분석을 제공한다
- [x] **CALC-03**: MBTI 설문을 진행하고 성격 유형을 판정한다

### AI Analysis (AI 기반 분석)

- [x] **AIAN-01**: 얼굴 사진을 업로드하면 AI가 관상 분석을 제공한다
- [x] **AIAN-02**: 손바닥 사진을 업로드하면 AI가 손금 분석을 제공한다

### AI Recommendations (AI 제안)

- [ ] **AIREC-01**: 모든 분석 결과를 종합한 통합 성향 분석을 제공한다
- [ ] **AIREC-02**: 성향 기반 맞춤형 학습 전략을 AI가 제안한다
- [ ] **AIREC-03**: 성향 기반 학과/직업 진로 가이드를 AI가 제안한다

### Reports (보고서)

- [ ] **REPT-01**: 종합 상담 보고서를 PDF로 출력할 수 있다
- [ ] **REPT-02**: 학생 성향 요약 카드를 한눈에 볼 수 있다
- [ ] **REPT-03**: 과거 분석 결과 이력을 저장하고 조회할 수 있다

## v2 Requirements

### Academy Management (학원 관리)

- **ACAD-01**: 학생 출결을 관리할 수 있다
- **ACAD-02**: 수강료를 관리할 수 있다
- **ACAD-03**: 학부모와 소통할 수 있다 (메시지, 알림)

### Data Collection (데이터 수집)

- **DATA-01**: 대학/학과 정보를 자동 수집할 수 있다
- **DATA-02**: 입시 정보 사이트를 연동할 수 있다

### User Expansion (사용자 확장)

- **USER-01**: 학생 본인이 직접 정보를 입력할 수 있다
- **USER-02**: 학부모 전용 포털을 제공한다

## Out of Scope

| Feature | Reason |
|---------|--------|
| 출결 관리 | AI 차별화 검증 후 v2에서 추가 |
| 수강료 관리 | AI 차별화 검증 후 v2에서 추가 |
| 학부모 소통 | AI 차별화 검증 후 v2에서 추가 |
| 대학/학과 정보 자동 수집 | v1은 핵심 기능 집중 |
| 학생 본인 직접 입력 | v1은 선생님/관리자만 사용 |
| 모바일 앱 | 웹 우선, 모바일은 추후 검토 |
| 실시간 채팅 | 핵심 가치와 무관, 복잡도 증가 |
| LMS/동영상 강의 | 기존 솔루션 활용 권장 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 1 | Complete |
| STUD-01 | Phase 1 | Complete |
| STUD-02 | Phase 2 | Complete |
| STUD-03 | Phase 1 | Complete |
| STUD-04 | Phase 1 | Complete |
| STUD-05 | Phase 1 | Complete |
| STUD-06 | Phase 1 | Complete |
| STUD-07 | Phase 1 | Complete |
| CALC-01 | Phase 3 | Complete |
| CALC-02 | Phase 3 | Complete |
| CALC-03 | Phase 4 | Complete |
| AIAN-01 | Phase 5 | Complete |
| AIAN-02 | Phase 5 | Complete |
| AIREC-01 | Phase 6 | Pending |
| AIREC-02 | Phase 6 | Pending |
| AIREC-03 | Phase 6 | Pending |
| REPT-01 | Phase 7 | Pending |
| REPT-02 | Phase 6 | Pending |
| REPT-03 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 20 total
- Mapped to phases: 20
- Unmapped: 0 ✓

---
*Requirements defined: 2026-01-27*
*Last updated: 2026-01-29 after Phase 5 completion*
