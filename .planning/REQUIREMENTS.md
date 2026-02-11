# Requirements: AI AfterSchool v3.0

**Defined:** 2026-02-11
**Core Value:** 앱 내에서 이슈를 등록하고, GitHub Issue → 브랜치 → 수정 → 테스트 → 배포까지의 전체 DevOps 라이프사이클을 자동화

## v3.0 Requirements

Requirements for v3.0 milestone. Each maps to roadmap phases.

### 이슈 보고 (Issue Reporting)

- [ ] **ISSUE-01**: DIRECTOR 역할 사용자가 헤더 영역의 버튼을 클릭하여 이슈 보고 모달을 열 수 있다
- [ ] **ISSUE-02**: 사용자가 이슈 제목, 설명, 카테고리(버그/기능수정/기능추가/UI개선/기타)를 입력하여 이슈를 등록할 수 있다
- [ ] **ISSUE-03**: 사용자가 이슈 등록 시 현재 화면의 스크린샷을 캡처하여 첨부할 수 있다
- [ ] **ISSUE-04**: 스크린샷이 MinIO에 업로드되고 GitHub Issue 본문에 이미지 URL로 삽입된다
- [ ] **ISSUE-05**: 이슈 등록 시 사용자 컨텍스트(역할, 페이지 URL)가 자동으로 이슈 본문에 포함된다

### GitHub 연동 (GitHub Integration)

- [ ] **GH-01**: 이슈 등록 시 GitHub REST API를 통해 현재 레포지토리에 Issue가 자동 생성된다
- [ ] **GH-02**: GitHub Issue에 카테고리 기반 라벨(bug, feature, improvement, ui-ux, etc.)이 자동 태깅된다
- [ ] **GH-03**: GitHub Issue 생성 시 이슈 유형에 따라 브랜치가 자동 생성된다 (fix/issue-{N}-{slug}, feat/issue-{N}-{slug})
- [ ] **GH-04**: GitHub webhook을 통해 이슈 상태 변경(close, label, comment)이 로컬 DB에 자동 동기화된다
- [ ] **GH-05**: Webhook 수신 시 HMAC-SHA256 서명 검증을 수행하여 위조 요청을 차단한다
- [ ] **GH-06**: DIRECTOR가 수동으로 GitHub에서 로컬 DB로 이슈를 일괄 동기화할 수 있다

### 에러 자동 수집 (Error Auto-Collection)

- [ ] **ERR-01**: 프로덕션 환경에서 발생하는 runtime 에러(error/fatal 수준)가 자동으로 GitHub Issue로 생성된다
- [ ] **ERR-02**: 동일 에러의 중복 이슈 생성을 fingerprint 기반으로 방지한다
- [ ] **ERR-03**: 에러 이슈에 스택트레이스, 요청 URL, 사용자 에이전트 등 기술 컨텍스트가 포함된다
- [ ] **ERR-04**: 에러 이슈에 'sentry', 'auto-created' 라벨이 자동 태깅되어 수동 이슈와 구분된다
- [ ] **ERR-05**: 에러 이슈 생성이 Sentry 에러 리포팅을 블로킹하지 않는다 (fire-and-forget)

### CI/CD 파이프라인 (Auto DevOps)

- [ ] **CICD-01**: `auto-deploy` 라벨이 있는 PR이 main에 머지되면 자동으로 배포가 트리거된다
- [ ] **CICD-02**: 배포 성공 시 관련 GitHub Issue에 "배포 완료" 코멘트가 자동 추가된다
- [ ] **CICD-03**: 배포 실패 시 롤백이 실행되고 PR에 "배포 실패/롤백" 코멘트가 추가된다
- [ ] **CICD-04**: PR 본문의 `closes #N` 구문으로 연결된 이슈가 머지 시 자동 클로즈된다
- [ ] **CICD-05**: CI가 자기 자신을 트리거하는 무한 루프가 방지된다 ([skip ci] + bot 계정 구분)

### 이슈 대시보드 (Dashboard)

- [ ] **DASH-01**: DIRECTOR가 앱 내에서 등록된 이슈 목록을 조회할 수 있다
- [ ] **DASH-02**: 이슈를 상태(open/closed), 카테고리, 소스(수동/Sentry) 기준으로 필터링할 수 있다
- [ ] **DASH-03**: 이슈 제목/설명으로 검색할 수 있다
- [ ] **DASH-04**: 각 이슈의 라이프사이클 상태(등록→브랜치→PR→테스트→배포)를 시각적으로 확인할 수 있다
- [ ] **DASH-05**: 이슈-배포 파이프라인의 전체 현황을 대시보드에서 파악할 수 있다

### 인프라 & 보안 (Infrastructure & Security)

- [ ] **INFRA-01**: Issue, IssueEvent 데이터베이스 모델이 Prisma 스키마에 추가된다
- [ ] **INFRA-02**: GitHub API 호출 시 rate limit 헤더를 모니터링하고 임계값 이하 시 경고를 표시한다
- [ ] **INFRA-03**: 이슈 생성, 배포 트리거 등 민감 작업이 감사 로그(AuditLog)에 기록된다
- [ ] **INFRA-04**: GitHub 토큰이 환경 변수로만 관리되고 클라이언트 코드에 노출되지 않는다
- [ ] **INFRA-05**: DIRECTOR 이외의 역할은 이슈 생성 및 배포 트리거 기능에 접근할 수 없다

## Future Requirements (v3.1+)

Deferred to future release. Tracked but not in current roadmap.

### 고급 기능 (Advanced)

- **ADV-01**: 스크린샷 어노테이션 도구 (화살표, 텍스트, 블러 마스킹)
- **ADV-02**: 헬스체크 기반 자동 롤백 (배포 후 건강 검진 실패 시 자동 되돌리기)
- **ADV-03**: ML 기반 스마트 에러 중복 제거 (스택트레이스 유사도 분석)
- **ADV-04**: 이슈 자동 할당 (카테고리/전문 분야 기반)
- **ADV-05**: Slack/이메일 알림 연동 (이슈 등록, 배포 완료/실패)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| 실시간 이슈 채팅 | GitHub Comments로 충분, 복잡도 대비 가치 낮음 |
| 커스텀 이슈 템플릿 빌더 | 고정 템플릿으로 충분, 템플릿 과잉 방지 |
| 비디오 레코딩 | 파일 크기/스토리지 문제, 스크린샷+설명으로 충분 |
| 앱 내 코드 리뷰 | GitHub PR 기능 재구현, 비효율적 |
| 이슈별 수동 배포 트리거 | CI/CD 보장 위반, 브랜치 기반 배포만 허용 |
| TEACHER/MANAGER 역할 이슈 생성 | v3.0은 DIRECTOR 전용, 역할 확장은 v3.1 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| ISSUE-01 | — | Pending |
| ISSUE-02 | — | Pending |
| ISSUE-03 | — | Pending |
| ISSUE-04 | — | Pending |
| ISSUE-05 | — | Pending |
| GH-01 | — | Pending |
| GH-02 | — | Pending |
| GH-03 | — | Pending |
| GH-04 | — | Pending |
| GH-05 | — | Pending |
| GH-06 | — | Pending |
| ERR-01 | — | Pending |
| ERR-02 | — | Pending |
| ERR-03 | — | Pending |
| ERR-04 | — | Pending |
| ERR-05 | — | Pending |
| CICD-01 | — | Pending |
| CICD-02 | — | Pending |
| CICD-03 | — | Pending |
| CICD-04 | — | Pending |
| CICD-05 | — | Pending |
| DASH-01 | — | Pending |
| DASH-02 | — | Pending |
| DASH-03 | — | Pending |
| DASH-04 | — | Pending |
| DASH-05 | — | Pending |
| INFRA-01 | — | Pending |
| INFRA-02 | — | Pending |
| INFRA-03 | — | Pending |
| INFRA-04 | — | Pending |
| INFRA-05 | — | Pending |

**Coverage:**
- v3.0 requirements: 31 total
- Mapped to phases: 0
- Unmapped: 31 ⚠️

---
*Requirements defined: 2026-02-11*
*Last updated: 2026-02-11 after initial definition*
