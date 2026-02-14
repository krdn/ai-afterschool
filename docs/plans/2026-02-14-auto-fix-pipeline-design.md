# 이슈 자동 해결 파이프라인 설계

> 날짜: 2026-02-14
> 상태: 승인됨

## 개요

이슈 보고에 등록된 이슈를 자동으로 **테스트/검증 → AI 코드 수정 → 테스트 → 관리자 승인 → 운영 배포**까지 처리하는 End-to-End 파이프라인.

## 접근법

**GitHub Actions 중심** — Self-hosted runner에서 Claude Code CLI를 실행하여 모든 과정을 GitHub 에코시스템 내에서 완결.

### 선택 이유
- 기존 deploy.yml, ai-qa.yml 재활용
- 모든 기록이 GitHub에 집중 (단일 진실 소스)
- Self-hosted runner로 로컬 자원(22코어, 30GB) 활용

## 전체 파이프라인 흐름

```
① 이슈 등록 (앱 UI)
   └→ createIssue() → DB 저장 + GitHub Issue + 브랜치 생성
        └→ repository_dispatch 이벤트 발행

② AI 코드 수정 (GitHub Actions - self-hosted runner)
   └→ auto-fix.yml 워크플로우 트리거
        ├→ 이슈 브랜치 체크아웃
        ├→ Claude Code CLI로 이슈 분석 + 코드 수정 (최대 3회 재시도)
        ├→ Unit 테스트 (vitest run)
        ├→ Lint (eslint)
        ├→ 빌드 검증 (next build)
        ├→ E2E 테스트 (playwright test, 카테고리별 범위)
        └→ PR 생성 (자동 리뷰 요청)

③ 관리자 승인 (GitHub PR)
   └→ 관리자가 코드 리뷰 후 Approve
        └→ auto-merge → 자동 머지

④ 운영 배포 (GitHub Actions)
   └→ main 머지 시 deploy.yml 트리거
        └→ 기존 배포 파이프라인 실행

⑤ 상태 동기화
   └→ 각 단계마다 Issue 상태 + IssueEvent 업데이트
        OPEN → IN_PROGRESS → IN_REVIEW → CLOSED
```

## 구성 요소 상세

### 1. createIssue() 수정

기존 `createIssue()` 함수에 `repository_dispatch` 이벤트 발행 추가:

```typescript
// GitHub Issue + 브랜치 생성 후
await octokit.repos.createDispatchEvent({
  owner, repo,
  event_type: 'auto-fix-issue',
  client_payload: {
    issue_number: githubIssueNumber,
    branch_name: branchName,
    category: issue.category,
    title: issue.title,
    description: issue.description,
    screenshot_url: issue.screenshotUrl,
    issue_id: issue.id  // DB ID (상태 동기화용)
  }
});
```

### 2. auto-fix.yml 워크플로우

```yaml
name: Auto Fix Issue
on:
  repository_dispatch:
    types: [auto-fix-issue]

jobs:
  auto-fix:
    runs-on: [self-hosted, linux, ai-fix]
    timeout-minutes: 30
    steps:
      # 1. Setup
      - 이슈 브랜치 체크아웃
      - Node.js 20 설정
      - npm ci
      - Playwright 브라우저 설치

      # 2. AI 코드 수정
      - GitHub Issue 내용 조회
      - Claude Code CLI 실행 (최대 3회 재시도)
      - 변경 파일 커밋 + 푸시

      # 3. 테스트 스위트
      - Unit 테스트 (vitest run)
      - Lint (eslint)
      - 빌드 검증 (next build)
      - E2E 테스트 (카테고리별 범위)

      # 4. PR 생성
      - gh pr create
      - Issue 상태 → IN_REVIEW

      # 5. 실패 처리
      - 실패 시 Issue 코멘트 추가
      - 관리자 알림
```

### 3. E2E 테스트 실행 전략

| 이슈 카테고리 | E2E 범위 |
|-------------|---------|
| BUG | 전체 E2E |
| FEATURE | 전체 E2E |
| UI_UX | 관련 페이지만 |
| SECURITY | 전체 + 인증 집중 |
| PERFORMANCE | 빌드 검증만 |
| 그 외 | Unit + Lint + 빌드만 |

### 4. Claude Code CLI 프롬프트 전략

입력:
- GitHub Issue 제목/설명/카테고리
- 스크린샷 URL (있는 경우)
- userContext (role, url, timestamp)

지시사항:
- 이슈를 분석하고 최소한의 코드 변경으로 수정
- 기존 코드 패턴/컨벤션 유지
- 수정 내용에 대한 회귀 테스트 추가 권장
- 보안 취약점 도입 금지

허용 도구 제한:
```bash
claude -p "프롬프트" \
  --allowedTools "Edit,Read,Write,Glob,Grep,Bash(npm test),Bash(npm run lint),Bash(npm run build)"
```

## Self-hosted Runner

- **위치**: 192.168.0.8 (로컬 개발 머신)
- **라벨**: `[self-hosted, linux, ai-fix]`
- **워크 디렉토리**: `/home/gon/actions-runner`
- **설치**: systemd 서비스로 등록

## 보안

| 항목 | 대책 |
|------|------|
| ANTHROPIC_API_KEY | GitHub Secrets에 저장 |
| GITHUB_TOKEN | Actions 기본 제공 |
| DB 접근 | 테스트용 별도 DB (test_db) |
| 코드 수정 범위 | Claude Code allowedTools 제한 |
| PR 머지 | Approve 없이 머지 불가 |
| Runner 격리 | 별도 사용자 계정 |

## 상태 동기화

### 단계별 상태 매핑

| 파이프라인 단계 | Issue 상태 | IssueEvent |
|---------------|-----------|------------|
| 이슈 등록 | OPEN | created |
| AI 수정 시작 | IN_PROGRESS | auto_fix_started |
| AI 수정 성공 | IN_PROGRESS | auto_fix_completed |
| 테스트 통과 + PR | IN_REVIEW | pr_created |
| AI 수정 실패 | OPEN | auto_fix_failed |
| PR Approve + 머지 | CLOSED | merged_and_deployed |

### 이벤트 기록 방식

앱에 내부 API 엔드포인트 추가:
```
POST /api/internal/issues/[id]/events
Headers: { Authorization: Bearer <INTERNAL_API_SECRET> }
Body: { eventType, metadata, performedBy }
```

## 구현 범위

### 신규 생성
- `.github/workflows/auto-fix.yml` — AI 수정 워크플로우
- `src/app/api/internal/issues/[id]/events/route.ts` — 내부 이벤트 API
- `scripts/auto-fix-prompt.md` — Claude Code 프롬프트 템플릿

### 수정
- `src/lib/actions/issues.ts` — `createIssue()`에 repository_dispatch 추가
- `src/lib/github/services.ts` — `createDispatchEvent()` 함수 추가

### 인프라 설정
- Self-hosted runner 설치 (192.168.0.8)
- GitHub Secrets 설정 (ANTHROPIC_API_KEY, INTERNAL_API_SECRET)
- Branch protection rules (main 브랜치 PR Approve 필수)

## 설정 체크리스트

### GitHub Secrets (필수)

| Secret | 설명 | 예시 |
|--------|------|------|
| `ANTHROPIC_API_KEY` | Claude Code API 키 | `sk-ant-...` |
| `INTERNAL_API_SECRET` | 내부 API 인증 시크릿 | `openssl rand -hex 32` |
| `APP_URL` | 운영 앱 URL | `http://192.168.0.5:3001` |
| `REVIEWER_USERNAME` | PR 리뷰어 GitHub 사용자명 | `krdn` |
| `DATABASE_URL_TEST` | 테스트용 DB URL | `postgresql://...test_db` |
| `SERVER_HOST` | 배포 서버 IP (기존) | `192.168.0.5` |
| `SERVER_PORT` | 배포 서버 SSH 포트 (기존) | `22` |
| `SERVER_USER` | 배포 서버 사용자 (기존) | `gon` |
| `SSH_PRIVATE_KEY` | SSH 개인키 (기존) | PEM 형식 |

### 운영 서버 .env 추가

```bash
# /home/gon/projects/ai/ai-afterschool/.env.production 에 추가
INTERNAL_API_SECRET=<openssl rand -hex 32 결과>
```

### Self-hosted Runner 설치

```bash
# 192.168.0.8에서 실행
cd /home/gon/projects/ai/ai-afterschool
RUNNER_TOKEN=<GitHub에서 발급> \
GITHUB_OWNER=<owner> \
GITHUB_REPO=<repo> \
./scripts/setup-runner.sh
```

### Branch Protection Rules

GitHub repo > Settings > Branches > main:
- [x] Require a pull request before merging
- [x] Require approvals (1)
- [x] Require status checks to pass before merging
