# Pitfalls Research

**Domain:** Issue Management & Auto DevOps Pipeline (Addition to Existing Next.js App)
**Researched:** 2026-02-11
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: GitHub API Rate Limit Exhaustion

**What goes wrong:**
앱이 GitHub API 호출 한도를 초과하여 이슈 생성, 브랜치 확인, PR 상태 조회 등 모든 GitHub 통합 기능이 중단됩니다. 특히 Sentry에서 대량의 에러가 발생하면 짧은 시간 내에 수백 건의 API 호출이 발생할 수 있습니다.

**Why it happens:**
- Personal Access Token(PAT) 사용 시 시간당 5,000회 제한
- GitHub Actions의 GITHUB_TOKEN은 저장소당 시간당 1,000회로 더 제한적
- 에러 발생 시마다 이슈 생성, 중복 확인, 라벨 추가 등 여러 API 호출이 연쇄적으로 발생
- Rate limit 헤더를 확인하지 않고 무한 재시도

**How to avoid:**
1. **GitHub App 사용**: PAT 대신 GitHub App으로 인증하면 설치당 최소 5,000회/시간 (Enterprise는 15,000회/시간)
2. **Rate limit 모니터링**: 응답 헤더의 `X-RateLimit-Remaining` 확인 후 임계값(예: 100) 이하 시 알림
3. **로컬 캐싱**: 이슈 목록, 브랜치 목록 등 변경이 적은 데이터는 5-10분 캐시
4. **배치 처리**: 이슈 생성 요청을 큐에 모아 30초 간격으로 배치 생성
5. **Exponential backoff**: Rate limit 초과 시 1분, 2분, 4분... 식으로 대기 후 재시도

**Warning signs:**
- GitHub API 응답에 `403 Forbidden` 및 `"rate limit exceeded"` 메시지
- Sentry 에러 급증 시 이슈 생성 지연 발생
- 응답 헤더 `X-RateLimit-Remaining` 값이 100 이하

**Phase to address:**
Phase 1 (Infrastructure Setup) - GitHub App 등록 및 인증 구조 설계 시 반드시 포함

---

### Pitfall 2: GitHub Token 노출 및 권한 과다 부여

**What goes wrong:**
GitHub Personal Access Token이 코드, 로그, 에러 메시지에 노출되거나, 필요 이상의 권한(repo, admin:org 등)을 부여하여 탈취 시 전체 저장소가 위험에 노출됩니다.

**Why it happens:**
- 개발 중 .env 파일을 실수로 커밋
- 에러 로그에 API 요청 헤더 전체가 기록됨
- "간편함"을 위해 full repo access 권한 부여
- PAT 만료 설정을 "No expiration"으로 설정

**How to avoid:**
1. **GitHub App 우선**: PAT 대신 GitHub App 사용 시 토큰 수명 8시간 (installation access token은 1시간)
2. **최소 권한 원칙**: issues:write, contents:read만 부여 (repo:full 대신)
3. **Fine-grained PAT 사용**: Classic PAT 대신 fine-grained PAT으로 저장소 및 권한 범위 제한
4. **환경 변수 검증**: `.env` 파일이 `.gitignore`에 포함되었는지 pre-commit hook으로 확인
5. **토큰 로테이션**: 90일마다 자동 만료 설정 및 갱신 프로세스 구축
6. **로그 필터링**: GitHub API 요청 로그 시 Authorization 헤더 마스킹 필수

**Warning signs:**
- GitHub security alert - "Personal access token exposed"
- .env 파일이 git history에 존재
- Sentry 로그에 "Authorization: Bearer ghp_..." 문자열 발견

**Phase to address:**
Phase 1 (Infrastructure Setup) - 초기 GitHub 연동 설정 시 반드시 검증

---

### Pitfall 3: Webhook Signature 검증 누락으로 인한 위조 요청 처리

**What goes wrong:**
공격자가 위조된 webhook payload를 전송하여 존재하지 않는 이슈로 배포를 트리거하거나, 악의적인 코드 변경을 main 브랜치에 자동 머지시킬 수 있습니다.

**Why it happens:**
- "내부 네트워크라 안전하다"는 잘못된 가정 (192.168.0.5도 같은 네트워크 내 다른 기기에서 접근 가능)
- Signature 검증 로직 구현의 복잡성으로 "나중에" 추가 계획
- `==` 연산자로 비교하여 timing attack에 취약
- Replay attack 방어 없음 (동일한 payload를 여러 번 전송)

**How to avoid:**
1. **HMAC-SHA256 검증 필수**: GitHub webhook secret으로 `X-Hub-Signature-256` 헤더 검증
2. **Timing-safe 비교**: `crypto.timingSafeEqual()` 사용 (Node.js), `==` 연산자 금지
3. **Replay attack 방어**: `X-GitHub-Delivery` 헤더의 고유 ID를 Redis에 저장 (TTL 10분), 중복 요청 거부
4. **IP 화이트리스트**: GitHub Meta API (`https://api.github.com/meta`)에서 webhook IP 목록 조회 후 허용
5. **SSL 검증 활성화**: GitHub webhook 설정에서 "Verify SSL" 활성화 (자체 서명 인증서 사용 금지)

**Warning signs:**
- 동일한 payload로 여러 배포가 트리거됨
- GitHub에 존재하지 않는 commit SHA로 배포 시도
- webhook endpoint에 비정상적인 트래픽 급증

**Phase to address:**
Phase 2 (Webhook Infrastructure) - Webhook 엔드포인트 구현 시 첫 번째 작업

---

### Pitfall 4: Auto-Deploy 무한 루프 (CI가 자기 자신을 트리거)

**What goes wrong:**
GitHub Actions가 코드를 자동으로 커밋하면 다시 CI가 트리거되고, 이것이 또 다시 커밋을 생성하여 무한 루프가 발생합니다. 예: 빌드 시 package-lock.json 업데이트 → 커밋 → 다시 빌드 → 무한 반복.

**Why it happens:**
- CI에서 생성한 커밋도 push 이벤트를 트리거
- `[skip ci]` 같은 skip 메커니즘 미사용
- Bot 계정 구분 없이 동일 GitHub token 사용
- 브랜치 보호 규칙 없이 main에 직접 push

**How to avoid:**
1. **커밋 메시지에 skip 키워드**: `[skip ci]`, `[ci skip]` 포함 시 GitHub Actions 건너뜀
2. **Bot 계정 분리**: GitHub Actions bot 커밋은 `if: github.actor != 'github-actions[bot]'` 조건으로 스킵
3. **Event source 추적**: webhook payload의 `changeSource` 필드로 API 호출 vs 수동 변경 구분
4. **Event ID 추적**: 고유 event ID를 Redis에 저장하여 동일 이벤트 중복 처리 방지 (TTL 1시간)
5. **브랜치 보호**: main 브랜치는 direct push 금지, PR + approval 필수

**Warning signs:**
- GitHub Actions가 짧은 시간 내 동일 workflow를 수십 번 실행
- Git history에 "Auto-commit from CI" 커밋이 연속으로 100개 이상
- GitHub Actions 월 사용량이 비정상적으로 급증

**Phase to address:**
Phase 3 (Auto-Deploy Pipeline) - CI/CD workflow 구현 첫 단계에서 방지 로직 포함

---

### Pitfall 5: Sentry 에러로 GitHub Issue 스팸 생성 (동일 에러 100건 → 이슈 100개)

**What goes wrong:**
프로덕션에서 동일한 에러가 반복 발생하면 중복 확인 로직 없이 GitHub 이슈가 수백 개 생성되어 이슈 트래커가 무용지물이 되고, GitHub API rate limit도 빠르게 소진됩니다.

**Why it happens:**
- Sentry의 issue ID와 GitHub issue를 매핑하지 않음
- 에러 fingerprint 기반 중복 확인 미구현
- "같은 에러"의 정의가 모호함 (stacktrace, error message, context 중 어디까지?)
- Sentry webhook이 모든 occurrence마다 트리거 설정

**How to avoid:**
1. **Sentry Issue ID 매핑**: DB에 `SentryIssue` 테이블 생성 - `sentryIssueId (unique)`, `githubIssueNumber`, `status`
2. **Fingerprint 기반 중복 확인**: Sentry의 `fingerprint` 배열을 해시하여 동일 에러 여부 판단
3. **임계값 설정**: 동일 Sentry issue가 10회 이상 발생 시에만 GitHub issue 생성
4. **Auto-resolve 연동**: Sentry issue가 resolved되면 GitHub issue도 자동 close
5. **Webhook 필터링**: Sentry webhook 설정에서 "New issue" 이벤트만 구독, "Every occurrence" 제외

**Warning signs:**
- GitHub에 동일 제목의 이슈가 10개 이상 연속 생성
- Sentry dashboard에 "Resolved" 상태지만 GitHub issue는 Open
- API rate limit 경고가 Sentry 에러 급증 시점과 일치

**Phase to address:**
Phase 4 (Sentry Integration) - Sentry webhook handler 구현 시 필수 검증 로직

---

### Pitfall 6: Screenshot 캡처 시 CORS 및 크로스 오리진 리소스 문제

**What goes wrong:**
html2canvas로 스크린샷 캡처 시 외부 이미지, iframe, 웹폰트 등이 CORS 오류로 렌더링되지 않거나, canvas가 "tainted"되어 toDataURL() 호출이 SecurityError로 실패합니다.

**Why it happens:**
- 외부 도메인 이미지를 `crossorigin="anonymous"` 없이 로드
- 크로스 오리진 iframe은 브라우저 보안 정책상 접근 불가
- 웹폰트 서버가 CORS 헤더를 제공하지 않음
- SVG 내부에 외부 리소스 참조

**How to avoid:**
1. **이미지 프록시**: 외부 이미지는 자체 서버로 프록시하여 동일 오리진으로 제공 (`/api/image-proxy?url=...`)
2. **Crossorigin 속성**: `<img crossorigin="anonymous" src="...">` 명시적 설정
3. **Iframe 대신 서버 렌더링**: 크로스 오리진 iframe은 캡처 불가 → 서버에서 Puppeteer로 대체
4. **폰트 로컬 호스팅**: Google Fonts 대신 self-hosted fonts 사용
5. **대체 라이브러리 고려**: html2canvas 성능 이슈 시 `modern-screenshot` (3배 빠름) 또는 서버 사이드 Puppeteer

**Warning signs:**
- 스크린샷에 이미지 대신 빈 박스 표시
- 브라우저 콘솔에 "Tainted canvases may not be exported" 에러
- 특정 페이지에서만 스크린샷 실패

**Phase to address:**
Phase 5 (Screenshot Feature) - 초기 POC 단계에서 외부 리소스 처리 전략 수립

---

### Pitfall 7: RBAC와 GitHub 이슈 권한 불일치

**What goes wrong:**
TEACHER 역할이 Sentry 에러를 보고 GitHub issue를 생성하려 하지만, 시스템 내부에서는 DIRECTOR만 이슈 생성 권한이 있어 일부 사용자만 기능 사용 가능. 또는 반대로 모든 사용자가 GitHub에 직접 이슈를 만들어 중복 및 스팸 발생.

**Why it happens:**
- 기존 RBAC 정책을 GitHub 통합에 반영하지 않음
- "GitHub 이슈 생성 권한"을 새로운 permission으로 정의하지 않음
- UI에서 역할별로 버튼 표시 여부만 제어 (API는 무방비)
- GitHub 저장소 권한과 앱 내 권한의 매핑 부재

**How to avoid:**
1. **Permission 정의**: `issues.create`, `issues.assign`, `deploy.trigger` 등 신규 권한 추가
2. **역할별 매핑**:
   - DIRECTOR: 모든 권한
   - TEAM_LEADER: issues.create, issues.assign
   - MANAGER: issues.view
   - TEACHER: issues.view
3. **API 미들웨어 검증**: `requirePermission('issues.create')` 미들웨어로 API 엔드포인트 보호
4. **UI 일관성**: 권한 없는 사용자에게는 "이슈 생성" 버튼 숨김 + disabled 상태
5. **감사 로그**: 이슈 생성, 배포 트리거 등 민감한 작업은 audit log 기록

**Warning signs:**
- TEACHER 역할 사용자가 403 에러로 이슈 생성 실패
- GitHub에 알 수 없는 사용자가 생성한 이슈 증가
- 역할별로 기능 접근이 일관되지 않음

**Phase to address:**
Phase 1 (Infrastructure Setup) - RBAC 확장 설계 시 권한 정의 포함

---

### Pitfall 8: 데이터베이스 스키마 설계 오류 (GitHub Issue ID를 Primary Key로 사용)

**What goes wrong:**
GitHub issue number를 primary key로 사용하면 로컬 개발 환경과 프로덕션 환경에서 ID 충돌이 발생하거나, GitHub API 장애 시 로컬 이슈 생성이 불가능해집니다.

**Why it happens:**
- "GitHub issue number는 고유하니까 PK로 쓰면 편하겠다"는 잘못된 가정
- 로컬 ID와 외부 시스템 ID의 분리 필요성 간과
- GitHub API에 의존적인 설계 (오프라인 동작 불가)
- 마이그레이션 시 ID 충돌 위험

**How to avoid:**
1. **독립적인 PK 사용**: `id: String @id @default(cuid())` (로컬 고유 ID)
2. **GitHub ID는 Foreign Key**: `githubIssueNumber: Int? @unique` (nullable, unique constraint)
3. **상태 관리 분리**: `status` 필드로 로컬 상태 관리 (DRAFT, SYNCED, FAILED)
4. **Sync 로직**: GitHub API 장애 시에도 로컬 DB에 이슈 저장 → 나중에 sync
5. **Composite Index**: `@@index([githubIssueNumber, status])` 로 조회 성능 최적화

**Warning signs:**
- 로컬 개발 환경에서 이슈 생성 시 "Unique constraint violation" 에러
- GitHub API 다운타임 시 앱 전체가 이슈 기능 사용 불가
- 프로덕션과 스테이징 DB 간 데이터 복사 시 ID 충돌

**Phase to address:**
Phase 1 (Infrastructure Setup) - 데이터베이스 스키마 설계 단계

---

### Pitfall 9: 환경별 GitHub Token 관리 실패 (개발/스테이징/프로덕션)

**What goes wrong:**
개발 환경에서 프로덕션 GitHub token을 사용하여 실수로 프로덕션 저장소에 테스트 이슈 100개를 생성하거나, 반대로 프로덕션에서 개발 token을 사용하여 권한 부족 에러 발생.

**Why it happens:**
- .env 파일을 환경별로 분리하지 않음 (.env.local, .env.production 미사용)
- Docker 이미지에 하드코딩된 token 포함
- 환경 변수 이름이 동일하여 구분 불가 (`GITHUB_TOKEN`)
- CI/CD에서 환경별 secret 주입 누락

**How to avoid:**
1. **환경별 .env 파일**:
   - `.env.local` (개발용 - 테스트 저장소)
   - `.env.production` (프로덕션용 - 실제 저장소)
2. **환경 변수 네이밍**: `GITHUB_TOKEN_DEV`, `GITHUB_TOKEN_PROD` 분리
3. **런타임 검증**: `process.env.NODE_ENV`에 따라 올바른 token 사용 여부 체크
4. **GitHub Actions Secrets**: Repository secrets에 환경별로 저장 (`DEV_GITHUB_TOKEN`, `PROD_GITHUB_TOKEN`)
5. **Token 범위 제한**: 개발 token은 테스트 저장소에만 접근 가능하도록 fine-grained PAT 설정

**Warning signs:**
- 프로덕션 저장소에 "[TEST]" prefix가 붙은 이슈 발견
- 로컬 개발 시 "Resource not accessible by integration" 에러
- CI/CD 로그에 잘못된 저장소 이름 출력

**Phase to address:**
Phase 1 (Infrastructure Setup) - 환경 변수 설정 가이드 작성 시 포함

---

### Pitfall 10: 브랜치 자동 생성 후 Stale Branch 방치

**What goes wrong:**
이슈마다 자동으로 `issue-123-fix-login-bug` 브랜치를 생성하지만, PR merge 후에도 브랜치를 삭제하지 않아 수백 개의 stale branch가 쌓여 저장소 관리가 혼란스러워집니다.

**Why it happens:**
- GitHub 설정에서 "Automatically delete head branches" 비활성화
- 로컬에서 생성한 브랜치는 PR merge 시 자동 삭제되지 않음
- 브랜치 정리 자동화 스크립트 부재
- "나중에 참고할 수도"라는 잘못된 가정

**How to avoid:**
1. **GitHub 설정 활성화**: Repository Settings → "Automatically delete head branches" 체크
2. **브랜치 명명 규칙**: `issue-{number}-{slug}` 형식으로 통일 → 스크립트로 정리 용이
3. **Stale branch cleanup**: GitHub Actions로 매주 merged된 브랜치 자동 삭제
4. **보호 브랜치 제외**: `main`, `develop` 등은 삭제 대상에서 제외
5. **알림 시스템**: 30일 이상 활동 없는 브랜치는 Slack 알림 후 삭제

**Warning signs:**
- `git branch -r` 출력에 100개 이상의 원격 브랜치
- GitHub Insights → Network 그래프가 복잡하게 얽힘
- 새 브랜치 생성 시 "similar branch exists" 경고

**Phase to address:**
Phase 3 (Auto-Deploy Pipeline) - 브랜치 관리 정책 수립 단계

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Personal Access Token 대신 간단히 구현 | 1시간 개발 절약 | Rate limit 문제, 토큰 탈취 위험, 권한 관리 어려움 | Never - GitHub App 필수 |
| Webhook signature 검증 생략 | 30분 개발 절약 | 보안 취약점, 위조 요청으로 인한 시스템 오작동 | Never - 첫날부터 구현 |
| 스크린샷을 클라이언트만으로 처리 (서버 사이드 없음) | 인프라 비용 절약 | CORS 문제, 브라우저 호환성, 성능 이슈 | MVP 단계 - 추후 Puppeteer 추가 |
| 동일 에러 중복 확인 없이 무조건 이슈 생성 | 로직 단순화 | 이슈 스팸, API rate limit 소진 | Never - fingerprint 기반 중복 확인 필수 |
| 모든 역할에 이슈 생성 권한 부여 | RBAC 확장 생략 | 권한 관리 혼란, 의도치 않은 이슈 생성 | Never - 초기부터 권한 정의 |
| 환경별 token 분리 없이 하나의 .env 사용 | 설정 간편화 | 프로덕션 오염, 개발 중 실수 위험 | Never - 환경 분리 필수 |
| Auto-deploy 무한 루프 방지 로직 없이 배포 | 빠른 기능 구현 | CI/CD 비용 폭증, 시스템 불안정 | Never - [skip ci] 패턴 필수 |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| GitHub API | Rate limit 확인 없이 무제한 호출 | `X-RateLimit-Remaining` 헤더 확인 후 임계값 이하 시 큐잉 |
| Sentry Webhook | 모든 occurrence마다 이슈 생성 | "New issue" 이벤트만 구독 + fingerprint 중복 확인 |
| html2canvas | CORS 에러 무시하고 캡처 시도 | 외부 이미지 프록시 + crossorigin 속성 설정 |
| GitHub Webhook | Signature 검증 없이 payload 신뢰 | HMAC-SHA256 검증 + timing-safe 비교 |
| Docker 배포 | 이미지에 .env 포함하여 빌드 | ARG로 빌드타임 변수 주입, ENV는 런타임 |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| html2canvas로 복잡한 DOM 캡처 | 10개 위젯 캡처에 21초 소요 | modern-screenshot 사용 (7초) 또는 서버 사이드 Puppeteer | DOM 노드 1000개 이상 |
| GitHub API 동기 호출 (순차 처리) | 이슈 10개 생성에 5초 이상 | Promise.all로 병렬 처리 (rate limit 감안) | 이슈 5개 이상 동시 처리 |
| Webhook payload 전체를 로그에 기록 | 로그 저장소 빠르게 고갈 | payload 요약만 기록 (id, type, 200자 이내) | 하루 webhook 100건 이상 |
| 모든 Sentry 이벤트를 DB에 저장 | 하루 수천 건의 레코드 증가 | 임계값 초과한 이슈만 저장 (10회 이상 발생) | 일 평균 에러 500건 이상 |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| GitHub token을 클라이언트 코드에 노출 | 전체 저장소 탈취 위험 | 서버 사이드 API로만 GitHub 호출, 환경 변수 사용 |
| Webhook endpoint에 인증 없음 | 위조 요청으로 배포 트리거 | HMAC-SHA256 signature 검증 + IP 화이트리스트 |
| Auto-deploy 시 코드 리뷰 없이 main merge | 악성 코드가 프로덕션 배포 | 브랜치 보호 + PR approval 필수 |
| 에러 메시지에 민감 정보 포함하여 이슈 생성 | 개인정보, API 키 노출 | 이슈 생성 전 민감 정보 마스킹 (이메일, 토큰 등) |
| RBAC 검증 없이 deploy endpoint 공개 | 누구나 배포 트리거 가능 | requirePermission 미들웨어 + DIRECTOR 역할만 허용 |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| 스크린샷 캡처 중 UI 블로킹 | 사용자가 앱이 멈췄다고 오해 | 로딩 인디케이터 + 백그라운드 처리 |
| 이슈 생성 실패 시 에러만 표시 | 사용자가 왜 실패했는지 모름 | "GitHub API rate limit 초과. 1분 후 다시 시도해주세요" 구체적 메시지 |
| 배포 트리거 후 즉각 피드백 없음 | 배포가 시작됐는지 확인 불가 | "배포 시작됨. GitHub Actions에서 진행 상황 확인 가능" 토스트 메시지 |
| 이슈 생성 폼에서 GitHub 저장소 선택 불가 | 잘못된 저장소에 이슈 생성 | 환경별 저장소 자동 매핑 + 확인 다이얼로그 |
| 중복 이슈인지 사용자가 판단해야 함 | 같은 이슈를 여러 번 생성 | 시스템이 자동으로 중복 확인 후 기존 이슈 링크 표시 |

## "Looks Done But Isn't" Checklist

- [ ] **GitHub 연동**: API rate limit 모니터링 및 알림 설정 완료 여부 확인
- [ ] **Webhook 보안**: HMAC signature 검증 + timing-safe 비교 구현 확인
- [ ] **Auto-Deploy**: [skip ci] 패턴 + event ID 중복 방지 로직 테스트
- [ ] **Sentry 통합**: Fingerprint 기반 중복 확인 + 임계값 설정 검증
- [ ] **스크린샷 기능**: CORS 프록시 + 외부 리소스 처리 전략 검증
- [ ] **RBAC 확장**: issues.create, deploy.trigger 권한 미들웨어 API 테스트
- [ ] **환경 분리**: 개발/프로덕션 token 분리 + 런타임 검증 로직 확인
- [ ] **브랜치 관리**: PR merge 후 자동 삭제 설정 + stale branch cleanup 스케줄 확인
- [ ] **에러 처리**: GitHub API 실패 시 graceful degradation (로컬 저장 후 sync)
- [ ] **감사 로그**: 민감한 작업 (이슈 생성, 배포 트리거) audit log 기록 확인

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Rate limit 초과로 API 호출 중단 | LOW | 1. 남은 시간 대기 (최대 1시간) 2. 캐시된 데이터로 임시 대응 3. GitHub App 마이그레이션 계획 |
| GitHub token 노출 | MEDIUM | 1. 즉시 token revoke 2. 새 token 생성 및 환경 변수 교체 3. Git history에서 token 완전 제거 (BFG Repo-Cleaner) |
| Webhook 위조 요청으로 잘못된 배포 | HIGH | 1. 배포 롤백 (기존 deploy.sh 사용) 2. Webhook signature 검증 구현 3. 배포 이력 audit log 검토 |
| 이슈 스팸 (100개 중복 생성) | LOW | 1. GitHub API로 특정 label 이슈 일괄 close 2. 중복 확인 로직 추가 3. Sentry 임계값 설정 |
| Auto-deploy 무한 루프 | MEDIUM | 1. GitHub Actions workflow 수동 중지 2. [skip ci] 커밋으로 루프 차단 3. Event ID 중복 방지 추가 |
| CORS로 스크린샷 실패 | LOW | 1. 서버 사이드 Puppeteer로 대체 2. 이미지 프록시 구현 3. 사용자에게 fallback UI 제공 |
| RBAC 권한 누락으로 기능 차단 | LOW | 1. 긴급 시 DIRECTOR 역할 임시 부여 2. Permission 정의 추가 3. 역할별 권한 매트릭스 재검토 |
| 환경 혼동으로 프로덕션 오염 | MEDIUM | 1. 프로덕션 저장소 정리 (테스트 이슈 삭제) 2. 환경별 .env 분리 3. CI/CD에 환경 검증 스텝 추가 |
| Stale branch 누적 | LOW | 1. GitHub CLI로 merged 브랜치 일괄 삭제 2. Auto-delete 설정 활성화 3. 정기 cleanup 스케줄 설정 |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| GitHub API Rate Limit 초과 | Phase 1 (Infrastructure Setup) | `X-RateLimit-Remaining` 모니터링 대시보드 확인 |
| Token 노출 및 권한 과다 | Phase 1 (Infrastructure Setup) | GitHub App 인증 사용 + fine-grained 권한 검증 |
| Webhook Signature 검증 누락 | Phase 2 (Webhook Infrastructure) | 위조 payload 테스트 → 403 응답 확인 |
| Auto-Deploy 무한 루프 | Phase 3 (Auto-Deploy Pipeline) | [skip ci] 커밋으로 workflow 중지 확인 |
| Sentry 이슈 스팸 | Phase 4 (Sentry Integration) | 동일 fingerprint 10회 발생 → 이슈 1개만 생성 확인 |
| Screenshot CORS 문제 | Phase 5 (Screenshot Feature) | 외부 이미지 포함 페이지 캡처 테스트 |
| RBAC 권한 불일치 | Phase 1 (Infrastructure Setup) | TEACHER 역할로 이슈 생성 시도 → 403 확인 |
| DB 스키마 설계 오류 | Phase 1 (Infrastructure Setup) | GitHub ID nullable + unique constraint 검증 |
| 환경별 Token 관리 실패 | Phase 1 (Infrastructure Setup) | 개발 환경에서 프로덕션 저장소 접근 차단 확인 |
| Stale Branch 방치 | Phase 3 (Auto-Deploy Pipeline) | PR merge 후 자동 삭제 동작 확인 |

## Sources

**GitHub API & Rate Limits:**
- [A Developer's Guide: Managing Rate Limits for the GitHub API](https://www.lunar.dev/post/a-developers-guide-managing-rate-limits-for-the-github-api)
- [Rate limits for the REST API - GitHub Docs](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)
- [Rate limits for GitHub Apps - GitHub Docs](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/rate-limits-for-github-apps)

**GitHub Apps vs PAT Security:**
- [GitHub Authentication: Personal Access Tokens vs. GitHub Apps](https://michaelkasingye.medium.com/github-authentication-personal-access-tokens-vs-github-apps-0f8fba446fbd)
- [Replacing a GitHub Personal Access Token with a GitHub Application](https://aembit.io/blog/replacing-a-github-personal-access-token-with-a-github-application/)

**Webhook Security:**
- [Validating webhook deliveries - GitHub Docs](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries)
- [Best practices for using webhooks - GitHub Docs](https://docs.github.com/en/webhooks/using-webhooks/best-practices-for-using-webhooks)
- [Webhook Signature Verification: Complete Security Guide](https://inventivehq.com/blog/webhook-signature-verification-guide)

**Auto-Deploy & Infinite Loops:**
- [Deploy Hook triggers infinite deploy loop - Render](https://community.render.com/t/deploy-hook-copy-button-triggers-infinite-deploy-loop/5551)
- [Guideline to prevent looping - Webhooks Google Groups](https://groups.google.com/g/webhooks/c/EtYx8A00iBI)

**Sentry Duplicate Prevention:**
- [Efficient error tracking with Sentry](https://medium.com/@AndrzejSala/efficient-error-tracking-with-sentry-e975c186947c)
- [Introducing Metric Alert notification charts and Duplicate Alerts - Sentry Blog](https://blog.sentry.io/introducing-metric-alert-notification-charts-and-duplicate-alerts/)

**Screenshot CORS & Performance:**
- [Capturing DOM as Image Is Harder Than You Think - monday engineering](https://engineering.monday.com/capturing-dom-as-image-is-harder-than-you-think-how-we-solved-it-at-monday-com/)
- [html2canvas Performance Issues - GitHub](https://github.com/niklasvh/html2canvas/issues/98)
- [What is the best Screenshot API in 2026?](https://scrapfly.io/blog/posts/what-is-the-best-screenshot-api)

**RBAC & GitHub Integration:**
- [Role-based Access Control (RBAC) - Custom Roles - GitHub Roadmap](https://github.com/github/roadmap/issues/111)
- [GitHub access control, security, roles, authorization - Veza](https://veza.com/blog/github-access-control-access-management-security-roles-authorization-more/)

---
*Pitfalls research for: Issue Management & Auto DevOps Pipeline*
*Researched: 2026-02-11*
