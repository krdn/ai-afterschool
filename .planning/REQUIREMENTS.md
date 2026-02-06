# Requirements: AI AfterSchool v2.1.1

**Defined:** 2026-02-06
**Core Value:** E2E 테스트 74건 실패를 0건으로 해소 — 기존 구현된 기능의 테스트 호환성 확보

## v2.1.1 Requirements

### Student Management

- [ ] **STU-01**: 학생 관련 주요 컴포넌트에 data-testid 속성 추가 (student-card, 폼 필드, 탭 등)
- [ ] **STU-02**: 학생 등록 시 이미지 프리뷰의 img alt 속성 정합성 확보
- [ ] **STU-03**: 학생 목록 검색 결과가 테스트에서 검증 가능하도록 텍스트 매칭 개선
- [ ] **STU-04**: 학생 삭제 후 /students 목록으로 리다이렉트 URL 정합성 확보

### Teacher Management

- [ ] **TCH-01**: `/teachers/me` 본인 프로필 조회 페이지 생성 (세션 기반 자동 리다이렉트)
- [ ] **TCH-02**: 일반 선생님이 `/teachers` 관리 페이지 접근 시 적절한 리다이렉트 또는 차단
- [ ] **TCH-03**: 존재하지 않는 선생님 ID 접근 시 404 에러 페이지 표시
- [ ] **TCH-04**: 프로필 사진 업로드 시 용량 초과 에러 메시지 UI

### Admin & System

- [ ] **ADM-01**: LLM 설정 페이지(`/admin/llm-settings`)에 data-testid 추가 (current-provider, provider-select 등)
- [ ] **ADM-02**: 토큰 사용량 페이지(`/admin/llm-usage`)에 data-testid 추가 (usage-chart, total-tokens, estimated-cost)
- [ ] **ADM-03**: 시스템 상태 모니터링 페이지 생성 (`/admin/system-status`) — DB, 캐시, 스토리지 상태 표시
- [ ] **ADM-04**: 시스템 로그 조회 페이지 생성 (`/admin/system-logs`)
- [ ] **ADM-05**: 데이터베이스 백업 관리 페이지 생성 (`/admin/database`)
- [ ] **ADM-06**: 감사 로그 페이지 생성 (`/admin/audit-logs`) — 설정 변경 이력 표시
- [ ] **ADM-07**: 팀장 역할의 제한된 관리 기능 접근 제어 (RBAC 강화)

### Analysis

- [ ] **ANL-01**: 학생 분석 탭에 data-testid 속성 추가 (saju-tab, mbti-tab, analysis-loading 등)
- [ ] **ANL-02**: 분석 탭 내에서 사주/관상/MBTI를 별도 서브탭으로 분리 표시
- [ ] **ANL-03**: AI 분석 API 호출 실패 시 에러 메시지 및 재시도 버튼 UI
- [ ] **ANL-04**: 분석 이력 조회 UI (이전 분석 결과 목록, 상세 보기 모달)

### Counseling

- [ ] **CNS-01**: 상담 캘린더 뷰에 data-testid 추가 (calendar-view, counseling-detail-modal 등)
- [ ] **CNS-02**: 상담 통계 대시보드의 data-testid 및 셀렉터 정합성 확보
- [ ] **CNS-03**: 상담 기록 검색/필터 UI 개선 (검색 입력, 필터 드롭다운)
- [ ] **CNS-04**: 상담 알림/리마인더 위젯 (다가오는 상담 표시)

### Matching

- [ ] **MAT-01**: 궁합 점수 표시 UI에 data-testid 추가 (compatibility-score)
- [ ] **MAT-02**: 공정성 지표 페이지 heading 및 data-testid 추가
- [ ] **MAT-03**: 매칭 이력/감사 로그 UI (변경 이력 테이블)
- [ ] **MAT-04**: 자동 배정 결과 카운트 표시 (배정된 학생 수)

### Performance & Analytics

- [ ] **PRF-01**: 성과 대시보드 metric 카드에 data-testid 추가 (metric-card)
- [ ] **PRF-02**: 향상률 차트 및 기간 선택 UI 개선
- [ ] **PRF-03**: 팀 목록 페이지(`/teams`) 및 팀 상세 페이지(`/teams/[id]`) 생성

### Report & Utility

- [ ] **RPT-01**: 학생 리포트 페이지 생성 (`/students/[id]/report`) — 리포트 프리뷰 및 PDF 다운로드
- [ ] **RPT-02**: PDF 다운로드 버튼 UI 연동 (다운로드 이벤트 처리)
- [ ] **UTL-01**: 학생 목록 이미지에 lazy loading 속성 (loading="lazy") 추가
- [ ] **UTL-02**: Next/Image 컴포넌트의 srcset/width/height 속성 정합성 확보

### Auth

- [ ] **AUTH-01**: 만료/유효하지 않은 비밀번호 재설정 토큰 접근 시 에러 페이지 UI

## Out of Scope

| Feature | Reason |
|---------|--------|
| 새로운 비즈니스 기능 추가 | v2.1.1은 패치 — 기존 기능의 테스트 호환성만 |
| E2E 테스트 코드 수정 | 앱 코드를 테스트에 맞추는 방향 |
| 성능 최적화 | 기능 정합성에 집중 |
| 새 API 엔드포인트 | 기존 Server Actions 활용 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| STU-01 ~ STU-04 | TBD | Pending |
| TCH-01 ~ TCH-04 | TBD | Pending |
| ADM-01 ~ ADM-07 | TBD | Pending |
| ANL-01 ~ ANL-04 | TBD | Pending |
| CNS-01 ~ CNS-04 | TBD | Pending |
| MAT-01 ~ MAT-04 | TBD | Pending |
| PRF-01 ~ PRF-03 | TBD | Pending |
| RPT-01 ~ RPT-02 | TBD | Pending |
| UTL-01 ~ UTL-02 | TBD | Pending |
| AUTH-01 | TBD | Pending |

**Coverage:**
- v2.1.1 requirements: 34 total
- Mapped to phases: 0
- Unmapped: 34

---
*Requirements defined: 2026-02-06*
*Last updated: 2026-02-06 after initial definition*
