# Requirements: AI AfterSchool v2.1

**Defined:** 2026-02-04
**Core Value:** 학생 정보 통합 관리를 기반으로 AI 성향 분석 및 맞춤형 학습/진로 제안 제공

## v2.1 Requirements

학부모 상담 관리 시스템. 선생님 중심 운영, 내부 기록 전용.

### 학부모 정보 관리

- [ ] **PARENT-01**: 학생별 학부모 정보 등록 (이름, 연락처, 관계)
- [ ] **PARENT-02**: 복수 학부모 지원 (부/모/보호자)
- [ ] **PARENT-03**: 주 연락처 지정 기능

### 상담 예약 관리

- [ ] **RESERVE-01**: 상담 예약 등록 (날짜, 시간, 학부모, 주제)
- [ ] **RESERVE-02**: 예약 상태 관리 (예약됨/완료/취소/불참)
- [ ] **RESERVE-03**: 예약 목록 조회 및 검색
- [ ] **RESERVE-04**: 예약 수정 및 삭제
- [ ] **RESERVE-05**: 예약 -> 완료 -> 기록 워크플로우

### 캘린더 뷰

- [ ] **CALENDAR-01**: 월간 캘린더 뷰로 예약 현황 시각화
- [ ] **CALENDAR-02**: 주간 캘린더 뷰
- [ ] **CALENDAR-03**: 날짜 클릭 시 해당 일 상담 목록 표시

### 상담 이력 조회

- [ ] **HISTORY-01**: 학생별 상담 이력 목록
- [ ] **HISTORY-02**: 학생 상세 페이지 내 상담 탭 추가
- [ ] **HISTORY-03**: 다음 예약된 상담 표시
- [ ] **HISTORY-04**: 빠른 상담 기록 버튼

### 상담 통계

- [ ] **STATS-01**: 선생님별 월간 상담 횟수
- [ ] **STATS-02**: 학생별 누적 상담 횟수
- [ ] **STATS-03**: 상담 유형별 분포 차트
- [ ] **STATS-04**: 월별 상담 추이 차트

### AI 기능

- [ ] **AI-01**: 상담 시 학생 성향 분석 정보 자동 표시
- [ ] **AI-02**: 선생님-학생 궁합 점수 참조
- [ ] **AI-03**: AI 기반 상담 내용 요약문 초안 생성

### 후속 조치 관리

- [ ] **FOLLOWUP-01**: 오늘/이번 주 후속 조치 대시보드
- [ ] **FOLLOWUP-02**: 지연된 후속 조치 하이라이트
- [ ] **FOLLOWUP-03**: 후속 조치 완료 체크

## Future Requirements (v2.2+)

### 출결/수강료 관리

- **ATTEND-01**: 출석 체크 기능
- **ATTEND-02**: 보강 수업 관리
- **FEE-01**: 수강료 청구서 발행
- **FEE-02**: 수납 및 미납 관리

### 외부 연동

- **NOTIFY-01**: 카카오톡 알림톡 연동
- **NOTIFY-02**: 이메일 자동 발송
- **SYNC-01**: 외부 캘린더 동기화

## Out of Scope

| Feature | Reason |
|---------|--------|
| 학부모 직접 접속/예약 | 선생님 중심 운영, 학부모 계정 관리 복잡성 회피 |
| SMS/카카오톡/이메일 알림 | 내부 기록 전용, 외부 연동 비용/복잡성 회피 |
| 외부 캘린더 동기화 | 내부 전용 시스템, 단순성 유지 |
| 화상 상담 기능 | 대면 상담 중심, 별도 도구 사용 |
| 상담 템플릿 | v2.1에서 제외, 단순성 유지 |
| 상담료 결제/정산 | 학원 수강료에 포함, 별도 정산 불필요 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PARENT-01 | Phase 16 | Pending |
| PARENT-02 | Phase 16 | Pending |
| PARENT-03 | Phase 16 | Pending |
| RESERVE-01 | Phase 16 | Pending |
| RESERVE-02 | Phase 16 | Pending |
| RESERVE-03 | Phase 17 | Pending |
| RESERVE-04 | Phase 17 | Pending |
| RESERVE-05 | Phase 17 | Pending |
| CALENDAR-01 | Phase 19 | Pending |
| CALENDAR-02 | Phase 19 | Pending |
| CALENDAR-03 | Phase 18 | Pending |
| HISTORY-01 | Phase 20 | Pending |
| HISTORY-02 | Phase 20 | Pending |
| HISTORY-03 | Phase 20 | Pending |
| HISTORY-04 | Phase 18 | Pending |
| STATS-01 | Phase 21 | Pending |
| STATS-02 | Phase 21 | Pending |
| STATS-03 | Phase 21 | Pending |
| STATS-04 | Phase 21 | Pending |
| AI-01 | Phase 22 | Pending |
| AI-02 | Phase 22 | Pending |
| AI-03 | Phase 22 | Pending |
| FOLLOWUP-01 | Phase 21 | Pending |
| FOLLOWUP-02 | Phase 21 | Pending |
| FOLLOWUP-03 | Phase 21 | Pending |

**Coverage:**
- v2.1 requirements: 25 total
- Mapped to phases: 25
- Unmapped: 0

---
*Requirements defined: 2026-02-04*
*Last updated: 2026-02-04 after roadmap creation*
