# 이슈 자동 해결 파이프라인 테스트 가이드

> 날짜: 2026-02-14
> 브랜치: `feat/llm` → `main` 머지 후 테스트 가능

## 개요

이슈 등록 → Claude Code 자동 수정 → 테스트 → PR 생성 → 관리자 승인 → 자동 머지 → 운영 배포까지의 전체 파이프라인을 테스트하는 가이드.

### 파이프라인 흐름

```
이슈 등록 (앱 UI)
  └→ createIssue() → DB + GitHub Issue + 브랜치 + repository_dispatch
       └→ auto-fix.yml (self-hosted runner)
            ├→ Claude Code CLI로 코드 수정
            ├→ Unit/Lint/Build/E2E 테스트
            └→ PR 생성 (auto-fix 라벨)
                 └→ 관리자 Approve
                      └→ auto-merge.yml → squash 머지
                           └→ deploy.yml → 운영 배포
```

---

## 1. 사전 준비 (Prerequisites)

### 1.1 운영 서버 환경변수 추가

192.168.0.5의 `.env`에 `INTERNAL_API_SECRET` 추가:

```bash
ssh gon@192.168.0.5

# 시크릿 생성
INTERNAL_SECRET=$(openssl rand -hex 32)
echo "생성된 시크릿: $INTERNAL_SECRET"

# .env에 추가
cd /home/gon/projects/ai/ai-afterschool
echo "INTERNAL_API_SECRET=$INTERNAL_SECRET" >> .env

# 확인
grep INTERNAL_API_SECRET .env
```

> **중요**: 이 값을 GitHub Secrets의 `INTERNAL_API_SECRET`과 동일하게 설정해야 합니다.

### 1.2 feat/llm 브랜치를 main에 머지

`repository_dispatch` 워크플로우는 **기본 브랜치(main)에 워크플로우 파일이 있어야** 트리거됩니다.

```bash
cd /home/gon/projects/ai/ai-afterschool

git checkout main
git merge feat/llm
git push origin main
```

### 1.3 GitHub Secrets 설정

GitHub repo > Settings > Secrets and variables > Actions > New repository secret

| Secret | 설명 | 값 |
|--------|------|-----|
| `ANTHROPIC_API_KEY` | Claude API 키 | `sk-ant-...` |
| `INTERNAL_API_SECRET` | 내부 API 인증 (1.1에서 생성한 값) | `openssl rand -hex 32` 결과 |
| `APP_URL` | 운영 앱 URL | `http://192.168.0.5:3001` |
| `REVIEWER_USERNAME` | PR 리뷰어 GitHub 사용자명 | `krdn` |
| `DATABASE_URL_TEST` | 테스트용 DB URL | `postgresql://user:pass@192.168.0.5:5436/test_db` |
| `SERVER_HOST` | 배포 서버 IP (기존) | `192.168.0.5` |

> 기존에 설정된 `SSH_PRIVATE_KEY`, `SERVER_USER`, `SERVER_PORT`는 이미 있을 수 있습니다.

### 1.4 Self-hosted Runner 설치

로컬 머신(192.168.0.8)에서 실행:

```bash
# 1. GitHub에서 Runner 토큰 발급
#    GitHub repo > Settings > Actions > Runners > New self-hosted runner
#    → 토큰 복사

# 2. 설치 스크립트 실행
cd /home/gon/projects/ai/ai-afterschool
RUNNER_TOKEN=<발급받은 토큰> \
GITHUB_OWNER=<GitHub 사용자명> \
GITHUB_REPO=ai-afterschool \
./scripts/setup-runner.sh

# 3. 상태 확인
sudo /home/gon/actions-runner/svc.sh status
```

설치 후 GitHub repo > Settings > Actions > Runners에서 `ai-afterschool-runner`가 **Idle** 상태인지 확인합니다.

Runner에 필요한 추가 소프트웨어:
- **Claude Code CLI**: `npm i -g @anthropic-ai/claude-code`
- **Node.js 20**: 이미 설치되어 있어야 함
- **Playwright 브라우저**: 워크플로우에서 자동 설치

### 1.5 Branch Protection Rules 설정

GitHub repo > Settings > Branches > Add branch protection rule:

- **Branch name pattern**: `main`
- [x] Require a pull request before merging
  - [x] Require approvals: **1**
- [x] Require status checks to pass before merging

### 1.6 auto-fix 라벨 생성

GitHub repo > Issues > Labels > New label:

- **Label name**: `auto-fix`
- **Color**: `#0E8A16` (초록색 추천)

---

## 2. 테스트 절차 (Step-by-Step)

### Step 1: 환경변수 확인

운영 서버에서 앱이 `INTERNAL_API_SECRET`을 인식하는지 확인:

```bash
# 운영 서버에서 앱 재시작 (Docker)
ssh gon@192.168.0.5
cd /home/gon/projects/ai/ai-afterschool
docker compose -f docker-compose.prod.yml restart app
```

### Step 2: 코드 Push 및 배포

`feat/llm` 브랜치의 변경사항이 main에 반영된 후 운영 배포:

```bash
# 이미 1.2에서 머지했다면, deploy.yml이 자동 트리거됨
# 또는 수동 배포:
VERSION=v2.2.0 docker compose -f docker-compose.prod.yml up -d --no-build
```

### Step 3: GitHub Secrets 등록 확인

GitHub repo > Settings > Secrets에서 6개 항목이 모두 등록되었는지 확인:
- `ANTHROPIC_API_KEY`
- `INTERNAL_API_SECRET`
- `APP_URL`
- `REVIEWER_USERNAME`
- `DATABASE_URL_TEST`
- `SERVER_HOST`

### Step 4: Self-hosted Runner 상태 확인

```bash
# 로컬 머신에서
sudo /home/gon/actions-runner/svc.sh status

# 또는 GitHub에서
# repo > Settings > Actions > Runners → "Idle" 상태 확인
```

### Step 5: 내부 API 수동 테스트

앱의 내부 API가 정상 동작하는지 먼저 확인:

```bash
# 존재하지 않는 ID로 404 확인
curl -s -X POST \
  "http://192.168.0.5:3001/api/internal/issues/nonexistent/events" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <INTERNAL_API_SECRET 값>" \
  -d '{"eventType":"test"}'
# 예상 응답: {"error":"Issue not found"} (404)

# 인증 실패 확인
curl -s -X POST \
  "http://192.168.0.5:3001/api/internal/issues/test/events" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer wrong-secret" \
  -d '{"eventType":"test"}'
# 예상 응답: {"error":"Unauthorized"} (401)
```

### Step 6: 테스트 이슈 등록

앱 UI (http://192.168.0.5:3001)에서 테스트 이슈를 등록합니다.

**추천 테스트 이슈:**

| 항목 | 값 |
|------|-----|
| **제목** | `[테스트] 대시보드 환영 메시지 오타 수정` |
| **카테고리** | `BUG` |
| **설명** | `대시보드 페이지의 환영 메시지에서 "환영합니니다"를 "환영합니다"로 수정해주세요.` |
| **스크린샷** | (선택) |

> 의도적으로 단순한 이슈를 등록하여 파이프라인 전체 흐름을 검증합니다.

### Step 7: 파이프라인 실행 확인

이슈 등록 후 자동으로 다음이 실행됩니다:

1. **GitHub Issue 생성** — repo > Issues에서 확인
2. **브랜치 생성** — `fix/issue-<번호>-...` 형식
3. **auto-fix.yml 트리거** — repo > Actions에서 워크플로우 실행 확인
4. **Claude Code 실행** — 워크플로우 로그에서 AI 수정 과정 확인
5. **PR 생성** — repo > Pull requests에서 `auto-fix` 라벨이 붙은 PR 확인

### Step 8: PR 리뷰 및 자동 머지

1. PR의 코드 변경사항을 리뷰
2. **Approve** 클릭
3. `auto-merge.yml`이 트리거되어 자동 squash 머지
4. 머지 완료 시 `deploy.yml`이 트리거되어 운영 배포

---

## 3. 디버깅 가이드

### 3.1 워크플로우 로그 확인

GitHub repo > Actions > Auto Fix Issue 에서 실행 로그를 확인합니다.

주요 확인 포인트:
- **Checkout**: 이슈 브랜치가 정상 체크아웃 되었는지
- **Claude Code 실행**: 프롬프트가 올바르게 주입되었는지
- **변경 파일**: `git diff --name-only` 결과가 비어있지 않은지
- **테스트**: unit/lint/build 각각 통과 여부
- **PR 생성**: `gh pr create` 성공 여부

### 3.2 내부 API 수동 테스트

실제 이슈 ID로 이벤트 기록 테스트:

```bash
# 이슈 ID는 앱 DB에서 확인 (URL의 /issues/[id] 부분)
ISSUE_ID="실제이슈ID"
SECRET="실제시크릿값"

curl -v -X POST \
  "http://192.168.0.5:3001/api/internal/issues/${ISSUE_ID}/events" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SECRET}" \
  -d '{
    "eventType": "auto_fix_started",
    "status": "IN_PROGRESS",
    "metadata": {"runId": "manual-test"}
  }'
```

### 3.3 Runner 상태 확인

```bash
# systemd 서비스 상태
sudo /home/gon/actions-runner/svc.sh status

# 서비스 로그 (실시간)
journalctl -u actions.runner.*.ai-afterschool-runner -f

# Runner 재시작
sudo /home/gon/actions-runner/svc.sh stop
sudo /home/gon/actions-runner/svc.sh start
```

### 3.4 repository_dispatch 수동 트리거

워크플로우를 수동으로 트리거하여 테스트:

```bash
# GitHub Personal Access Token 필요 (repo scope)
curl -X POST \
  "https://api.github.com/repos/<OWNER>/<REPO>/dispatches" \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer <GITHUB_PAT>" \
  -d '{
    "event_type": "auto-fix-issue",
    "client_payload": {
      "issue_number": 1,
      "branch_name": "fix/issue-1-test",
      "category": "BUG",
      "title": "테스트 이슈",
      "description": "테스트 설명",
      "screenshot_url": "",
      "issue_id": "테스트용이슈ID"
    }
  }'
```

> **주의**: 브랜치가 실제로 존재해야 체크아웃 단계에서 실패하지 않습니다.

---

## 4. 주의사항

### 반드시 확인

- `repository_dispatch`는 **main 브랜치에 워크플로우 파일이 있어야** 동작합니다
- Self-hosted runner의 라벨이 `[self-hosted, linux, ai-fix]`와 정확히 일치해야 합니다
- `INTERNAL_API_SECRET`은 운영 서버 `.env`와 GitHub Secrets에 **동일한 값**이어야 합니다

### 비용 관련

- Claude Code CLI 호출당 API 비용 발생 (최대 3회 재시도)
- 테스트 시 단순한 이슈로 시작하여 비용을 최소화하세요

### 보안 관련

- `ANTHROPIC_API_KEY`는 GitHub Secrets에만 보관
- `INTERNAL_API_SECRET`은 `.env`와 GitHub Secrets에만 보관
- Runner의 `_work` 디렉토리에 민감 정보가 남지 않도록 주의

---

## 5. 관련 파일 목록

| 파일 | 역할 |
|------|------|
| `.github/workflows/auto-fix.yml` | AI 수정 워크플로우 (메인 파이프라인) |
| `.github/workflows/auto-merge.yml` | PR 승인 시 자동 머지 |
| `.github/workflows/deploy.yml` | 운영 배포 (main 머지 시 트리거) |
| `src/app/api/internal/issues/[id]/events/route.ts` | 내부 이벤트 API |
| `src/lib/github/services.ts` | `dispatchAutoFix()` 함수 |
| `src/lib/actions/issues.ts` | `createIssue()`에서 파이프라인 트리거 |
| `scripts/auto-fix-prompt.md` | Claude Code 프롬프트 템플릿 |
| `scripts/setup-runner.sh` | Self-hosted runner 설치 스크립트 |
| `docs/plans/2026-02-14-auto-fix-pipeline-design.md` | 설계 문서 |
