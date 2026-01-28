# Roadmap: AI AfterSchool

## Overview

AI AfterSchool을 학생 정보 관리 기반 위에 전통 분석(사주, 성명학), 심리 분석(MBTI), AI 이미지 분석(관상, 손금)을 단계적으로 쌓아 올려 맞춤형 학습 전략 및 진로 가이드를 제공하는 차별화된 입시 컨설팅 시스템으로 구축합니다. 핵심은 저위험 계산 기반 분석을 먼저 검증하고, 고위험 AI 기능은 핵심 가치 확인 후 추가하는 것입니다.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Authentication** - 선생님 인증 및 학생 정보 관리 기반 구축
- [x] **Phase 2: File Infrastructure** - 학생 사진 및 분석용 이미지 업로드 기능
- [ ] **Phase 3: Calculation Analysis** - 사주팔자 및 성명학 분석 제공
- [ ] **Phase 4: MBTI Analysis** - 설문 기반 MBTI 성향 분석 제공
- [ ] **Phase 5: AI Image Analysis** - AI 기반 관상 및 손금 분석 제공
- [ ] **Phase 6: AI Integration** - 통합 성향 분석 및 맞춤형 학습/진로 전략 제공
- [ ] **Phase 7: Reports** - 종합 상담 보고서 PDF 출력

## Phase Details

### Phase 1: Foundation & Authentication
**Goal**: 선생님이 학생 정보를 안전하게 등록하고 관리할 수 있다
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, STUD-01, STUD-03, STUD-04, STUD-05, STUD-06, STUD-07
**Success Criteria** (what must be TRUE):
  1. 선생님이 이메일/비밀번호로 로그인하고 세션이 브라우저 재시작 후에도 유지된다
  2. 선생님이 비밀번호를 잊었을 때 이메일 링크로 재설정할 수 있다
  3. 여러 선생님이 각자 계정으로 동시 접속하여 학생을 관리할 수 있다
  4. 학생 기본 정보(이름, 생년월일, 연락처, 학교, 학년, 목표 대학/학과, 혈액형)를 등록할 수 있다
  5. 학생 목록을 조회하고 이름/학교로 검색할 수 있다
  6. 학생 상세 정보를 조회할 수 있다
**Plans**: 7 plans

Plans:
- [x] 01-01-PLAN.md — 프로젝트 설정 및 DB 스키마
- [x] 01-02-PLAN.md — 인증 인프라 (세션, DAL, Middleware)
- [x] 01-03-PLAN.md — 로그인/로그아웃 기능
- [x] 01-04-PLAN.md — 학생 CRUD 기능
- [x] 01-05-PLAN.md — 비밀번호 재설정
- [x] 01-06-PLAN.md — 학생 목록 UI (TanStack Table)
- [x] 01-07-PLAN.md — 통합 검증

### Phase 2: File Infrastructure
**Goal**: 학생 사진 및 관상/손금 분석용 이미지를 저장하고 조회할 수 있다
**Depends on**: Phase 1
**Requirements**: STUD-02
**Success Criteria** (what must be TRUE):
  1. 학생 프로필 사진을 업로드하고 학생 상세 페이지에서 확인할 수 있다
  2. 관상 분석용 얼굴 사진을 업로드할 수 있다
  3. 손금 분석용 손바닥 사진을 업로드할 수 있다
  4. 업로드된 이미지가 자동으로 적절한 크기로 리사이징된다
**Plans**: 4 plans

Plans:
- [x] 02-01-PLAN.md — 스토리지/업로드 방식 결정
- [x] 02-02-PLAN.md — Cloudinary 저장소 및 이미지 메타데이터 저장
- [x] 02-03-PLAN.md — 학생 이미지 업로드 UI 및 상세 페이지 표시
- [x] 02-04-PLAN.md — 업로드 흐름 검증

### Phase 3: Calculation Analysis
**Goal**: 생년월일시 기반 사주팔자와 이름 기반 성명학 분석을 제공한다
**Depends on**: Phase 1
**Requirements**: CALC-01, CALC-02
**Success Criteria** (what must be TRUE):
  1. 학생의 생년월일시를 입력하면 정확한 사주팔자(천간지지)가 계산된다
  2. 사주 해석이 한글로 제공된다 (오행, 십성 등)
  3. 학생 이름의 한글/한자 획수가 계산되고 수리(원격, 형격, 이격, 정격) 분석이 제공된다
  4. 분석 결과가 학생 프로필에 저장되고 언제든 조회할 수 있다
**Plans**: 3 plans

Plans:
- [x] 03-01-PLAN.md — 분석 저장 스키마와 상태 UI
- [x] 03-02-PLAN.md — 사주 계산 엔진 및 결과 패널
- [ ] 03-03-PLAN.md — 성명학 계산 및 결과 표시

### Phase 4: MBTI Analysis
**Goal**: 설문 기반으로 학생의 MBTI 성향을 판정하고 제공한다
**Depends on**: Phase 1
**Requirements**: CALC-03
**Success Criteria** (what must be TRUE):
  1. 선생님이 학생을 대신하여 MBTI 설문(60+ 문항)을 진행할 수 있다
  2. 설문 완료 후 MBTI 유형(예: ENFP)이 판정된다
  3. 각 차원(E/I, S/N, T/F, J/P)의 선호도 점수가 백분율로 표시된다
  4. MBTI 결과가 학생 프로필에 저장되고 언제든 조회할 수 있다
**Plans**: TBD

Plans:
- [ ] TBD during planning

### Phase 5: AI Image Analysis
**Goal**: AI 기반으로 관상 및 손금 분석을 제공한다
**Depends on**: Phase 2
**Requirements**: AIAN-01, AIAN-02
**Success Criteria** (what must be TRUE):
  1. 업로드된 얼굴 사진을 분석하여 AI 관상 해석을 제공한다
  2. 업로드된 손바닥 사진을 분석하여 AI 손금 해석을 제공한다
  3. 이미지 품질이 낮거나 부적합할 경우 분석을 거부하고 재업로드를 요청한다
  4. AI 분석은 "전통 해석 참고용 엔터테인먼트" 면책 조항과 함께 표시된다
  5. 분석 결과가 학생 프로필에 저장되고 언제든 조회할 수 있다
**Plans**: TBD

Plans:
- [ ] TBD during planning

### Phase 6: AI Integration
**Goal**: 모든 분석 결과를 통합하여 맞춤형 학습 전략 및 진로 가이드를 제공한다
**Depends on**: Phase 3, Phase 4, Phase 5
**Requirements**: AIREC-01, AIREC-02, AIREC-03, REPT-02, REPT-03
**Success Criteria** (what must be TRUE):
  1. 모든 분석 결과(사주, 성명학, MBTI, 관상, 손금)를 하나의 통합 성향 분석으로 요약하여 제공한다
  2. 학생 성향 기반으로 AI가 맞춤형 학습 전략(학습 스타일, 과목별 접근법)을 제안한다
  3. 학생 성향 기반으로 AI가 적성 학과 및 진로 가이드를 제안한다
  4. 학생 성향 요약 카드를 한눈에 볼 수 있다
  5. 과거 분석 결과 이력을 저장하고 조회할 수 있다
  6. 일부 분석 데이터가 없어도 사용 가능한 데이터만으로 제안을 생성한다
**Plans**: TBD

Plans:
- [ ] TBD during planning

### Phase 7: Reports
**Goal**: 종합 상담 보고서를 PDF로 출력하여 학부모 상담에 활용할 수 있다
**Depends on**: Phase 6
**Requirements**: REPT-01
**Success Criteria** (what must be TRUE):
  1. 학생의 모든 분석 결과와 AI 제안을 포함한 종합 보고서를 PDF로 생성할 수 있다
  2. PDF는 전문적인 레이아웃으로 학부모 제공용으로 적합하다
  3. PDF 생성은 비동기로 처리되어 UI가 블로킹되지 않는다
  4. 동일 학생의 보고서 중복 생성 시 캐싱으로 재사용한다
**Plans**: TBD

Plans:
- [ ] TBD during planning

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Authentication | 7/7 | Complete | 2026-01-28 |
| 2. File Infrastructure | 4/4 | Complete | 2026-01-28 |
| 3. Calculation Analysis | 2/3 | In progress | - |
| 4. MBTI Analysis | 0/TBD | Not started | - |
| 5. AI Image Analysis | 0/TBD | Not started | - |
| 6. AI Integration | 0/TBD | Not started | - |
| 7. Reports | 0/TBD | Not started | - |
