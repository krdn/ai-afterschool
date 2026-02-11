# Project Research Summary

**Project:** AI AfterSchool - Issue Management & Auto DevOps Pipeline
**Domain:** Internal DevOps Tooling for School Management SaaS
**Researched:** 2026-02-11
**Confidence:** HIGH

## Executive Summary

AI AfterSchool v3.0은 기존 학원 관리 시스템에 **이슈 관리 및 자동 DevOps 파이프라인**을 추가하는 마일스톤입니다. 사용자(DIRECTOR 역할)가 앱 내에서 버그/기능 요청을 등록하면 GitHub Issues에 자동 생성되고, 이슈 유형에 따른 브랜치 자동 생성, PR 머지 시 자동 배포, 배포 실패 시 롤백까지 전체 라이프사이클을 자동화합니다.

권장 접근법은 **기존 Next.js 15 App Router 패턴을 최대한 활용**하되, GitHub API 통합을 위해 `octokit` 통합 SDK, 스크린샷 캡처를 위해 `modern-screenshot`만 추가하는 것입니다. 기존 Sentry, Prisma, GitHub Actions 인프라는 확장만 하면 됩니다. 총 비용 증가 $0, 새 의존성 4개(`octokit`, `@octokit/webhooks`, `@octokit/auth-app`, `modern-screenshot`)입니다.

핵심 리스크는 **3가지**입니다. 첫째, GitHub API rate limit 관리(시간당 5,000회 제한, Sentry 에러 급증 시 소진 가능). 둘째, Webhook 서명 검증 누락으로 인한 보안 위협(위조 요청으로 배포 트리거). 셋째, Sentry 에러의 GitHub Issue 스팸 생성(중복 확인 로직 없이 동일 에러 100건 → 이슈 100개). 이 세 가지는 각 Phase에서 첫 번째 작업으로 방지 로직을 구현해야 합니다.

## Key Findings

### Recommended Stack

기존 스택(Next.js 15, Prisma, PostgreSQL, Sentry)이 이미 견고하며, **4개 의존성만 추가**합니다. 모든 패키지가 TypeScript 네이티브이므로 `@types/*` 불필요합니다.

**Core technologies:**
- **octokit** (^5.0.5): GitHub API 통합 SDK — REST + GraphQL, TypeScript 네이티브, 하나의 패키지로 모든 GitHub 작업
- **@octokit/webhooks** (^14.0.0): Webhook 이벤트 핸들링 — 타입 안전 페이로드 파싱, HMAC-SHA256 서명 검증 내장
- **@octokit/auth-app** (^8.0.0): GitHub App 인증 — JWT + 설치 토큰 관리, PAT보다 안전
- **modern-screenshot** (^4.6.8): DOM-to-image 변환 — html2canvas보다 3배 빠름, 20KB gzipped, TypeScript 네이티브

**Anti-recommendations:** Probot(과함), @octokit/rest(통합 SDK로 대체), html2canvas(느림), dom-to-image(유지보수 중단)

### Expected Features

**Must have (table stakes):**
- 이슈 보고 모달 — 헤더 영역 버튼, Radix UI Dialog 패턴 활용
- 스크린샷 캡처 — modern-screenshot으로 DOM 캡처, MinIO에 업로드
- 이슈 유형 분류 — 버그/기능수정/기능추가/UI/UX개선/기타
- GitHub Issue 생성 — octokit으로 자동 생성, 라벨 자동 태깅
- 브랜치 자동 생성 — `fix/issue-{number}-{slug}`, `feat/issue-{number}-{slug}`
- 이슈 라이프사이클 추적 — 등록→브랜치→PR→테스트→배포 상태 관리
- 이슈 대시보드 — 목록 조회, 필터링, 상태 표시

**Should have (competitive):**
- 에러 자동 수집 (Sentry → GitHub Issue) — 중복 제거 + rate limiting 필수
- CI/CD 파이프라인 상태 표시 — GitHub Actions webhook 연동
- 에러 중복 방지 — fingerprint 기반 중복 확인
- Issue-to-Deploy 타임라인 — 라이프사이클 시각화

**Defer (v2+):**
- 자동 롤백 — 헬스체크 + 워크플로우 오케스트레이션 복잡도 높음
- 스마트 에러 중복 제거 (ML 기반) — 단순 fingerprint로 시작
- 스크린샷 어노테이션 — 캡처 기능 검증 후 추가

### Architecture Approach

기존 아키텍처 패턴(Server Actions for 내부, API Routes for 외부)을 그대로 따릅니다. GitHub webhook은 외부 공개 엔드포인트이므로 API Route로, 이슈 CRUD는 Server Action으로 구현합니다. 데이터는 Dual-Layer(로컬 PostgreSQL + GitHub Issues 동기화)로 관리하여 빠른 쿼리와 GitHub 장애 내성을 확보합니다.

**Major components:**
1. **Issue UI** — 헤더 `<IssueButton />` (DIRECTOR 전용) + 이슈 폼 모달 + 이슈 목록 페이지
2. **GitHub API Integration** — `src/lib/actions/issues.ts` (Server Actions), `src/app/api/github/webhooks/route.ts` (Webhook)
3. **Database Models** — `Issue` (로컬 캐시), `IssueEvent` (webhook 이벤트 + 활동 로그)
4. **Sentry Extension** — `beforeSend` 훅 확장, 프로덕션 에러 → GitHub Issue 자동 생성
5. **GitHub Actions Enhancement** — PR 머지 시 자동 배포, 이슈 코멘트, 롤백 알림

### Critical Pitfalls

1. **GitHub API Rate Limit 소진** — GitHub App 인증(PAT보다 rate limit 높음), `X-RateLimit-Remaining` 모니터링, 로컬 캐싱, exponential backoff. Phase 1에서 방지.
2. **Webhook 서명 검증 누락** — HMAC-SHA256 + `crypto.timingSafeEqual()` 필수, replay attack 방어(`X-GitHub-Delivery` ID 저장). Phase 1에서 방지.
3. **Sentry 이슈 스팸** — fingerprint 기반 중복 확인, 동일 에러 임계값(10회) 초과 시에만 생성, Sentry webhook "New issue" 이벤트만 구독. Phase 3에서 방지.
4. **Auto-Deploy 무한 루프** — `[skip ci]` 패턴, bot 계정 구분(`github.actor != 'github-actions[bot]'`), event ID 중복 방지. Phase 4에서 방지.
5. **Screenshot CORS 문제** — 이미지 프록시, `crossorigin="anonymous"` 속성, modern-screenshot 사용(html2canvas보다 CORS 처리 우수). Phase 2에서 방지.

## Implications for Roadmap

연구 결과 기반 권장 Phase 구조입니다. **DB 기반 → GitHub API → UI → 자동화** 순서로 의존성을 따릅니다.

### Phase 29: Database & GitHub API 기반 구축
**Rationale:** 모든 기능의 기반. DB 스키마 없이 이슈 저장 불가, GitHub API 없이 이슈 생성 불가.
**Delivers:** Issue/IssueEvent Prisma 모델, GitHub API 클라이언트(octokit), Server Actions(createIssue, listIssues), 환경 변수 설정
**Addresses:** 이슈 생성/조회 핵심 로직
**Avoids:** DB 스키마 오류(독립 PK + nullable GitHub ID), Token 보안(환경 변수 분리)

### Phase 30: 이슈 UI & 스크린샷
**Rationale:** Phase 29의 API 위에 사용자 인터페이스 구축. 스크린샷은 이슈 보고의 핵심 UX.
**Delivers:** IssueButton 컴포넌트(헤더), IssueForm 모달, 스크린샷 캡처(modern-screenshot), 이슈 목록 페이지
**Uses:** octokit, modern-screenshot, Radix UI Dialog
**Implements:** Header 통합, RBAC(DIRECTOR 전용)

### Phase 31: Sentry 에러 → 자동 이슈 생성
**Rationale:** 수동 이슈 보고(Phase 30) 검증 후, 자동 에러 수집 추가. 중복 방지 로직 필수.
**Delivers:** beforeSend 훅 확장, fingerprint 기반 중복 확인, 에러→이슈 자동 생성, rate limiting
**Avoids:** 이슈 스팸(fingerprint + 임계값), Sentry blocking(fire-and-forget)

### Phase 32: Webhook & 이슈 동기화
**Rationale:** GitHub에서 발생하는 이슈 변경(close, label, comment)을 앱에 반영. Dual-layer 동기화 완성.
**Delivers:** Webhook API Route, 서명 검증(HMAC-SHA256), IssueEvent 기록, 수동 동기화 액션
**Avoids:** Webhook 위조(서명 검증), replay attack(delivery ID 추적)

### Phase 33: 자동 브랜치 생성 & CI/CD 파이프라인
**Rationale:** 이슈 → 브랜치 → PR → 배포 자동화. GitHub Actions 워크플로우 확장.
**Delivers:** 이슈 기반 브랜치 자동 생성, deploy.yml 확장(PR 머지 트리거), 배포 코멘트, 롤백 알림
**Avoids:** Auto-deploy 무한 루프([skip ci] + bot 구분), stale branch(자동 삭제 설정)

### Phase 34: 이슈 대시보드 & 통합 테스트
**Rationale:** 전체 파이프라인 검증, 이슈 라이프사이클 시각화, E2E 테스트.
**Delivers:** 이슈 대시보드(필터/검색/상태), 파이프라인 상태 표시, 통합 테스트, 문서화
**Implements:** Recharts 시각화, 이슈 타임라인

### Phase Ordering Rationale

- **Phase 29 (DB + API) 먼저**: 이슈 저장/생성 없이 UI/자동화 불가
- **Phase 30 (UI) → Phase 31 (Sentry)**: 수동 이슈 보고 검증 후 자동 수집 추가
- **Phase 32 (Webhook)는 Phase 30과 병렬 가능**: 하지만 UI 검증 후 동기화가 더 안전
- **Phase 33 (CI/CD)은 마지막 자동화**: 배포 자동화는 모든 기반 검증 후
- **Phase 34 (대시보드)는 통합**: 모든 데이터 흐름 완성 후 시각화

### Research Flags

Phases needing deeper research:
- **Phase 31:** Sentry beforeSend 훅에서 비동기 처리 패턴, rate limiting 전략
- **Phase 33:** GitHub Actions workflow 조건부 실행, 무한 루프 방지 검증

Phases with standard patterns (skip research-phase):
- **Phase 29:** 표준 Prisma 모델 + octokit 공식 문서 충분
- **Phase 30:** Radix UI Dialog + modern-screenshot 공식 예시 충분
- **Phase 32:** @octokit/webhooks 공식 패턴 충분
- **Phase 34:** 기존 Recharts 패턴 활용

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | **HIGH** | octokit, modern-screenshot 모두 공식 검증, 버전 확인 완료 |
| Features | **HIGH** | GitHub Issues 통합은 확립된 패턴, MVP 범위 명확 |
| Architecture | **HIGH** | 기존 패턴(Server Actions + API Routes) 확장, 새 아키텍처 결정 없음 |
| Pitfalls | **HIGH** | 공식 문서 기반 방지 전략, 보안 취약점 HIGH 신뢰도 |

**Overall confidence:** HIGH

### Gaps to Address

- **GitHub App vs PAT 결정**: STACK.md는 GitHub App 권장, ARCHITECTURE.md는 PAT 사용 예시. Phase 29 계획 시 결정 필요. PAT로 시작하고 rate limit 문제 시 GitHub App 마이그레이션 가능.
- **이미지 업로드 전략**: GitHub API는 이슈에 직접 이미지 업로드 불가. MinIO(기존 인프라)에 업로드 후 URL 삽입 또는 base64 인라인. Phase 30 구현 시 결정.
- **Sentry beforeSend 비동기 패턴**: beforeSend에서 외부 API 호출(GitHub Issue 생성)은 비동기이므로 fire-and-forget 필수. 실패 시 로컬 큐잉 전략 Phase 31에서 상세 설계.

## Sources

### Primary (HIGH confidence)
- [Octokit SDK Documentation](https://github.com/octokit/octokit.js/) — GitHub API 통합
- [@octokit/webhooks Documentation](https://github.com/octokit/webhooks.js) — Webhook 핸들링
- [modern-screenshot npm](https://www.npmjs.com/package/modern-screenshot) — DOM-to-image
- [GitHub Actions Deployment Docs](https://docs.github.com/actions/deployment/about-deployments/deploying-with-github-actions) — CI/CD
- [Sentry Fingerprint Rules](https://docs.sentry.io/concepts/data-management/event-grouping/fingerprint-rules/) — 에러 중복 제거
- [GitHub Webhook Validation](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries) — 서명 검증

### Secondary (MEDIUM confidence)
- [Next.js GitHub Webhook Handler](https://www.karimshehadeh.com/blog/posts/GithubWebhooksAndNextJS) — Next.js + Webhook 통합 패턴
- [GitHub Actions Docker Compose Deployment](https://ecostack.dev/posts/automated-docker-compose-deployment-github-actions/) — Docker 배포 자동화
- [html2canvas vs modern-screenshot](https://npm-compare.com/html2canvas,modern-screenshot) — 스크린샷 라이브러리 비교

---
*Research completed: 2026-02-11*
*Ready for roadmap: yes*
