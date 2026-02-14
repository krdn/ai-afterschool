# 이슈 자동 해결 파이프라인 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 이슈 등록 시 Claude Code가 자동으로 코드를 수정하고, 테스트를 통과하면 PR을 생성하여 관리자 승인 후 운영 배포까지 자동 진행하는 파이프라인 구축

**Architecture:** GitHub Actions self-hosted runner에서 Claude Code CLI를 실행하여 이슈 분석→코드 수정→테스트→PR 생성을 자동화. `createIssue()` 서버 액션에서 `repository_dispatch` 이벤트를 발행하여 워크플로우를 트리거하고, 각 단계마다 내부 API로 이슈 상태를 동기화한다.

**Tech Stack:** Next.js 15, GitHub Actions, Claude Code CLI, Octokit, Prisma, Playwright, Vitest

**설계 문서:** `docs/plans/2026-02-14-auto-fix-pipeline-design.md`

---

## Task 1: 내부 이벤트 API 엔드포인트 생성

파이프라인의 각 단계에서 이슈 상태를 업데이트하기 위한 내부 API.
GitHub Actions에서 이 API를 호출하여 DB의 Issue 상태와 IssueEvent를 기록한다.

**Files:**
- Create: `src/app/api/internal/issues/[id]/events/route.ts`

**Step 1: 내부 API 라우트 작성**

```typescript
// src/app/api/internal/issues/[id]/events/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET

/**
 * POST /api/internal/issues/[id]/events
 *
 * 파이프라인에서 이슈 상태를 업데이트하는 내부 API
 * INTERNAL_API_SECRET으로 인증
 *
 * Body:
 *   eventType: string (auto_fix_started, auto_fix_completed, auto_fix_failed, pr_created, merged_and_deployed)
 *   metadata?: object
 *   status?: IssueStatus (상태 변경 시)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 인증 체크
  const authHeader = request.headers.get('authorization')
  if (!INTERNAL_API_SECRET || authHeader !== `Bearer ${INTERNAL_API_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const { eventType, metadata, status } = body

    if (!eventType) {
      return NextResponse.json({ error: 'eventType is required' }, { status: 400 })
    }

    // 이슈 존재 확인
    const issue = await db.issue.findUnique({ where: { id } })
    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 })
    }

    // 트랜잭션: 이벤트 기록 + 상태 업데이트 (있는 경우)
    await db.$transaction(async (tx) => {
      // IssueEvent 기록
      await tx.issueEvent.create({
        data: {
          issueId: id,
          eventType,
          performedBy: issue.createdBy, // 파이프라인 이벤트는 생성자 기준
          metadata: metadata ?? undefined,
        },
      })

      // 상태 변경 (요청된 경우)
      if (status) {
        await tx.issue.update({
          where: { id },
          data: {
            status,
            ...(status === 'CLOSED' && { closedAt: new Date() }),
          },
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Internal event API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

**Step 2: 빌드 검증**

Run: `npx next build 2>&1 | tail -20`
Expected: 빌드 성공 (exit 0)

**Step 3: 커밋**

```bash
git add src/app/api/internal/issues/[id]/events/route.ts
git commit -m "feat: 이슈 자동 해결 파이프라인용 내부 이벤트 API 추가

파이프라인 각 단계에서 Issue 상태와 IssueEvent를 업데이트하는 내부 API.
INTERNAL_API_SECRET으로 인증하며, 트랜잭션으로 이벤트+상태를 원자적으로 처리.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: GitHub services에 repository_dispatch 함수 추가

`createIssue()`에서 GitHub Actions 워크플로우를 트리거하기 위한 `repository_dispatch` 이벤트 발행 함수.

**Files:**
- Modify: `src/lib/github/services.ts` (맨 아래에 함수 추가)

**Step 1: dispatchAutoFix 함수 추가**

`src/lib/github/services.ts` 파일 끝에 다음 함수를 추가:

```typescript
/**
 * 이슈 자동 수정 파이프라인 트리거
 *
 * repository_dispatch 이벤트를 발행하여 auto-fix.yml 워크플로우를 시작한다.
 * GitHub 미설정이거나 실패 시 null 반환 (파이프라인 트리거는 optional).
 */
export async function dispatchAutoFix(params: {
  issueNumber: number
  branchName: string
  category: IssueCategory
  title: string
  description?: string
  screenshotUrl?: string
  issueId: string
}): Promise<boolean> {
  if (!isGitHubConfigured()) {
    return false
  }

  try {
    const octokit = getOctokit()
    const { owner, repo } = getRepoConfig()

    await octokit.rest.repos.createDispatchEvent({
      owner,
      repo,
      event_type: 'auto-fix-issue',
      client_payload: {
        issue_number: params.issueNumber,
        branch_name: params.branchName,
        category: params.category,
        title: params.title,
        description: params.description || '',
        screenshot_url: params.screenshotUrl || '',
        issue_id: params.issueId,
      },
    })

    await logSystemAction({
      level: 'INFO',
      message: `자동 수정 파이프라인 트리거: Issue #${params.issueNumber}`,
      context: { issueNumber: params.issueNumber, branchName: params.branchName },
    })

    return true
  } catch (error) {
    await logSystemAction({
      level: 'WARN',
      message: '자동 수정 파이프라인 트리거 실패 (무시하고 진행)',
      context: {
        error: error instanceof Error ? error.message : String(error),
        issueNumber: params.issueNumber,
      },
    })
    return false
  }
}
```

**Step 2: 빌드 검증**

Run: `npx next build 2>&1 | tail -20`
Expected: 빌드 성공

**Step 3: 커밋**

```bash
git add src/lib/github/services.ts
git commit -m "feat: 자동 수정 파이프라인 dispatch 함수 추가

repository_dispatch 이벤트를 발행하여 auto-fix.yml 워크플로우를 트리거.
실패 시에도 이슈 생성 흐름에 영향 없음 (graceful degradation).

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: createIssue()에 파이프라인 트리거 연동

기존 `createIssue()` 서버 액션에서 GitHub Issue+브랜치 생성 후 `dispatchAutoFix()`를 호출.

**Files:**
- Modify: `src/lib/actions/issues.ts` (import 추가 + 브랜치 생성 후 dispatch 호출)

**Step 1: import에 dispatchAutoFix 추가**

`src/lib/actions/issues.ts` 6번 줄의 import에 `dispatchAutoFix` 추가:

```typescript
import { createGitHubIssue, ensureLabel, createIssueBranch, generateIssueBody, dispatchAutoFix } from "@/lib/github/services"
```

**Step 2: 브랜치 생성 후 파이프라인 트리거 코드 추가**

`createIssue()` 함수 내에서 `githubBranchName` 할당 직후(157번 줄 근처), `} else {` 앞에 파이프라인 트리거 코드 추가:

```typescript
            // 자동 수정 파이프라인 트리거
            if (branchName && githubIssueNumber) {
              await dispatchAutoFix({
                issueNumber: githubIssueNumber,
                branchName,
                category: category as IssueCategory,
                title,
                description: description || undefined,
                screenshotUrl: screenshotUrl || undefined,
                issueId: issue.id,
              })
            }
```

이 코드는 `createIssueBranch()` 성공 후, `IssueEvent: branch_created` 기록 다음에 삽입한다.

**Step 3: 빌드 검증**

Run: `npx next build 2>&1 | tail -20`
Expected: 빌드 성공

**Step 4: 커밋**

```bash
git add src/lib/actions/issues.ts
git commit -m "feat: createIssue에서 자동 수정 파이프라인 트리거 연동

GitHub Issue + 브랜치 생성 성공 후 repository_dispatch 이벤트 발행.
파이프라인 트리거 실패 시에도 이슈 생성 흐름에 영향 없음.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: Claude Code 프롬프트 템플릿 작성

Claude Code CLI에 전달할 프롬프트 템플릿. 이슈 내용을 분석하고 코드를 수정하는 지시사항.

**Files:**
- Create: `scripts/auto-fix-prompt.md`

**Step 1: 프롬프트 템플릿 작성**

```markdown
# 이슈 자동 수정 프롬프트

이 프로젝트의 GitHub Issue를 분석하고 코드를 수정해주세요.

## 이슈 정보

- **제목**: {{ISSUE_TITLE}}
- **설명**: {{ISSUE_DESCRIPTION}}
- **카테고리**: {{ISSUE_CATEGORY}}
- **스크린샷**: {{SCREENSHOT_URL}}

## 지시사항

1. 이슈 내용을 분석하여 원인을 파악하세요
2. 최소한의 코드 변경으로 문제를 해결하세요
3. 기존 코드 패턴과 컨벤션을 따르세요
4. 변경 시 관련 테스트를 추가하거나 수정하세요
5. 보안 취약점을 도입하지 마세요

## 프로젝트 정보

- Next.js 15 + Prisma + PostgreSQL
- 테스트: vitest (unit), playwright (e2e)
- 코드 검증: `npm test` (unit), `npm run lint` (eslint), `npm run build` (빌드)

## 완료 조건

- 코드 수정이 완료되면 변경 사항을 설명하는 커밋 메시지를 작성하세요
- 커밋 메시지는 한국어로 작성하세요
- 커밋 타입: feat/fix/docs/refactor/test 중 적절한 것 사용
```

**Step 2: 커밋**

```bash
git add scripts/auto-fix-prompt.md
git commit -m "feat: Claude Code 자동 수정 프롬프트 템플릿 추가

이슈 정보를 주입하여 Claude Code CLI에 전달하는 프롬프트 템플릿.
카테고리, 설명, 스크린샷 등의 컨텍스트를 포함.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: auto-fix.yml GitHub Actions 워크플로우 생성

핵심 파이프라인 워크플로우. repository_dispatch → AI 수정 → 테스트 → PR 생성.

**Files:**
- Create: `.github/workflows/auto-fix.yml`

**Step 1: 워크플로우 파일 작성**

```yaml
name: Auto Fix Issue

on:
  repository_dispatch:
    types: [auto-fix-issue]

env:
  NODE_VERSION: '20'
  ISSUE_NUMBER: ${{ github.event.client_payload.issue_number }}
  BRANCH_NAME: ${{ github.event.client_payload.branch_name }}
  ISSUE_CATEGORY: ${{ github.event.client_payload.category }}
  ISSUE_TITLE: ${{ github.event.client_payload.title }}
  ISSUE_DESCRIPTION: ${{ github.event.client_payload.description }}
  SCREENSHOT_URL: ${{ github.event.client_payload.screenshot_url }}
  ISSUE_ID: ${{ github.event.client_payload.issue_id }}

jobs:
  auto-fix:
    runs-on: [self-hosted, linux, ai-fix]
    timeout-minutes: 30

    steps:
      # ── 1. Setup ──
      - name: Checkout issue branch
        uses: actions/checkout@v4
        with:
          ref: ${{ env.BRANCH_NAME }}
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      # ── 2. 상태 업데이트: IN_PROGRESS ──
      - name: Update issue status to IN_PROGRESS
        if: ${{ env.ISSUE_ID != '' }}
        run: |
          curl -sf -X POST \
            "${{ secrets.APP_URL }}/api/internal/issues/${{ env.ISSUE_ID }}/events" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer ${{ secrets.INTERNAL_API_SECRET }}" \
            -d '{
              "eventType": "auto_fix_started",
              "status": "IN_PROGRESS",
              "metadata": { "runId": "${{ github.run_id }}" }
            }' || echo "Status update failed (non-critical)"

      # ── 3. AI 코드 수정 ──
      - name: Prepare prompt
        id: prompt
        run: |
          PROMPT=$(cat scripts/auto-fix-prompt.md)
          PROMPT="${PROMPT//\{\{ISSUE_TITLE\}\}/${{ env.ISSUE_TITLE }}}"
          PROMPT="${PROMPT//\{\{ISSUE_DESCRIPTION\}\}/${{ env.ISSUE_DESCRIPTION }}}"
          PROMPT="${PROMPT//\{\{ISSUE_CATEGORY\}\}/${{ env.ISSUE_CATEGORY }}}"
          PROMPT="${PROMPT//\{\{SCREENSHOT_URL\}\}/${{ env.SCREENSHOT_URL }}}"
          echo "prompt<<PROMPT_EOF" >> $GITHUB_OUTPUT
          echo "$PROMPT" >> $GITHUB_OUTPUT
          echo "PROMPT_EOF" >> $GITHUB_OUTPUT

      - name: Run Claude Code
        id: claude
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          MAX_ATTEMPTS=3
          ATTEMPT=0
          SUCCESS=false

          while [ $ATTEMPT -lt $MAX_ATTEMPTS ] && [ "$SUCCESS" = false ]; do
            ATTEMPT=$((ATTEMPT + 1))
            echo "=== Claude Code 실행 (시도 $ATTEMPT/$MAX_ATTEMPTS) ==="

            claude -p "${{ steps.prompt.outputs.prompt }}" \
              --allowedTools "Edit,Read,Write,Glob,Grep,Bash(npm test),Bash(npm run lint)" \
              --max-turns 20 \
              --output-format json > /tmp/claude-output.json 2>&1 || true

            # 변경 파일 확인
            CHANGED=$(git diff --name-only)
            if [ -n "$CHANGED" ]; then
              echo "변경된 파일: $CHANGED"
              SUCCESS=true
            else
              echo "변경 사항 없음. 재시도..."
              sleep 5
            fi
          done

          if [ "$SUCCESS" = false ]; then
            echo "claude_success=false" >> $GITHUB_OUTPUT
            echo "::error::Claude Code가 코드를 수정하지 못했습니다 ($MAX_ATTEMPTS회 시도)"
            exit 1
          fi

          echo "claude_success=true" >> $GITHUB_OUTPUT

      - name: Commit AI changes
        if: steps.claude.outputs.claude_success == 'true'
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add -A
          git commit -m "fix: 이슈 #${{ env.ISSUE_NUMBER }} 자동 수정

          Claude Code에 의한 자동 수정
          이슈: ${{ env.ISSUE_TITLE }}
          카테고리: ${{ env.ISSUE_CATEGORY }}

          Co-Authored-By: Claude <noreply@anthropic.com>"
          git push origin ${{ env.BRANCH_NAME }}

      # ── 4. 테스트 스위트 ──
      - name: Run unit tests
        run: npm test

      - name: Run lint
        run: npm run lint

      - name: Build verification
        run: npm run build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL_TEST }}
          SESSION_SECRET: test-secret
          NEXT_PUBLIC_APP_URL: http://localhost:3000

      - name: Run E2E tests (category-based)
        id: e2e
        continue-on-error: true
        run: |
          CATEGORY="${{ env.ISSUE_CATEGORY }}"
          case "$CATEGORY" in
            BUG|FEATURE|SECURITY)
              echo "전체 E2E 테스트 실행"
              npx playwright test
              ;;
            UI_UX)
              echo "UI 관련 E2E 테스트 실행"
              npx playwright test --grep "ui|visual|layout"
              ;;
            PERFORMANCE)
              echo "E2E 스킵 (빌드 검증만)"
              ;;
            *)
              echo "기본 E2E 스킵"
              ;;
          esac

      # ── 5. PR 생성 ──
      - name: Create Pull Request
        if: success()
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          PR_URL=$(gh pr create \
            --base main \
            --head "${{ env.BRANCH_NAME }}" \
            --title "fix: 이슈 #${{ env.ISSUE_NUMBER }} - ${{ env.ISSUE_TITLE }}" \
            --body "$(cat <<'PR_EOF'
          ## 자동 수정 PR

          **이슈:** #${{ env.ISSUE_NUMBER }} - ${{ env.ISSUE_TITLE }}
          **카테고리:** ${{ env.ISSUE_CATEGORY }}

          ### 수정 내용
          Claude Code에 의해 자동 생성된 수정사항입니다.
          코드 리뷰 후 Approve하면 자동으로 머지 및 배포됩니다.

          ### 테스트 결과
          - Unit 테스트: ✅ 통과
          - Lint: ✅ 통과
          - 빌드: ✅ 통과
          - E2E: ${{ steps.e2e.outcome == 'success' && '✅ 통과' || '⚠️ 일부 실패 (확인 필요)' }}

          ---
          🤖 이 PR은 이슈 자동 해결 파이프라인에 의해 생성되었습니다.
          PR_EOF
          )" \
            --label "auto-fix" \
            --reviewer "${{ secrets.REVIEWER_USERNAME }}" 2>&1)

          echo "PR 생성됨: $PR_URL"
          echo "pr_url=$PR_URL" >> $GITHUB_OUTPUT

      - name: Update issue status to IN_REVIEW
        if: success() && env.ISSUE_ID != ''
        run: |
          curl -sf -X POST \
            "${{ secrets.APP_URL }}/api/internal/issues/${{ env.ISSUE_ID }}/events" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer ${{ secrets.INTERNAL_API_SECRET }}" \
            -d '{
              "eventType": "pr_created",
              "status": "IN_REVIEW",
              "metadata": { "runId": "${{ github.run_id }}" }
            }' || echo "Status update failed (non-critical)"

      # ── 6. 실패 처리 ──
      - name: Handle failure
        if: failure() && env.ISSUE_ID != ''
        run: |
          curl -sf -X POST \
            "${{ secrets.APP_URL }}/api/internal/issues/${{ env.ISSUE_ID }}/events" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer ${{ secrets.INTERNAL_API_SECRET }}" \
            -d '{
              "eventType": "auto_fix_failed",
              "status": "OPEN",
              "metadata": { "runId": "${{ github.run_id }}", "error": "파이프라인 실패" }
            }' || echo "Status update failed (non-critical)"

      - name: Comment on GitHub Issue (failure)
        if: failure()
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          gh issue comment ${{ env.ISSUE_NUMBER }} \
            --body "⚠️ **자동 수정 실패**

          파이프라인이 이슈를 자동으로 수정하지 못했습니다.
          수동 개입이 필요합니다.

          - Run ID: [${{ github.run_id }}](${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }})
          - 브랜치: \`${{ env.BRANCH_NAME }}\`"
```

**Step 2: 커밋**

```bash
git add .github/workflows/auto-fix.yml
git commit -m "feat: 이슈 자동 수정 GitHub Actions 워크플로우 추가

repository_dispatch 트리거 → Claude Code 실행 → 테스트 → PR 생성.
카테고리별 E2E 범위 조정, 최대 3회 재시도, 실패 시 이슈 코멘트.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 6: auto-merge.yml 워크플로우 생성

PR이 Approve되면 자동으로 머지하고, 머지 후 이슈 상태를 CLOSED로 업데이트하는 워크플로우.

**Files:**
- Create: `.github/workflows/auto-merge.yml`

**Step 1: 워크플로우 파일 작성**

```yaml
name: Auto Merge Approved PRs

on:
  pull_request_review:
    types: [submitted]

jobs:
  auto-merge:
    if: >
      github.event.review.state == 'approved' &&
      contains(github.event.pull_request.labels.*.name, 'auto-fix')
    runs-on: ubuntu-latest

    steps:
      - name: Enable auto-merge
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          gh pr merge ${{ github.event.pull_request.number }} \
            --repo ${{ github.repository }} \
            --squash \
            --auto

      - name: Extract issue ID from branch
        id: extract
        run: |
          BRANCH="${{ github.event.pull_request.head.ref }}"
          # 브랜치명에서 이슈 번호 추출: fix/issue-42-제목 → 42
          ISSUE_NUM=$(echo "$BRANCH" | grep -oP 'issue-\K\d+')
          echo "issue_number=$ISSUE_NUM" >> $GITHUB_OUTPUT

      - name: Close GitHub Issue
        if: steps.extract.outputs.issue_number != ''
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          gh issue close ${{ steps.extract.outputs.issue_number }} \
            --repo ${{ github.repository }} \
            --comment "✅ 이슈가 자동 수정 파이프라인에 의해 해결되었습니다.

          PR: #${{ github.event.pull_request.number }}
          머지 완료 → 운영 배포가 자동으로 진행됩니다."
```

**Step 2: 커밋**

```bash
git add .github/workflows/auto-merge.yml
git commit -m "feat: PR 승인 시 자동 머지 워크플로우 추가

auto-fix 라벨이 붙은 PR이 Approve되면 자동 squash 머지.
머지 후 GitHub Issue 자동 종료 및 코멘트.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 7: Self-hosted Runner 설치 스크립트 작성

로컬 머신(192.168.0.8)에 GitHub Actions self-hosted runner를 설치하는 가이드 스크립트.

**Files:**
- Create: `scripts/setup-runner.sh`

**Step 1: 설치 스크립트 작성**

```bash
#!/bin/bash
# GitHub Actions Self-hosted Runner 설치 스크립트
# 실행 위치: 192.168.0.8 (로컬 개발 머신)
#
# 사전 요구사항:
# 1. GitHub repo > Settings > Actions > Runners > New self-hosted runner
#    에서 토큰을 발급받아 RUNNER_TOKEN 환경변수로 전달
# 2. Claude Code CLI가 설치되어 있어야 함 (npm i -g @anthropic-ai/claude-code)
#
# 사용법:
#   RUNNER_TOKEN=<token> GITHUB_OWNER=<owner> GITHUB_REPO=<repo> ./scripts/setup-runner.sh

set -euo pipefail

# 설정
RUNNER_DIR="${RUNNER_DIR:-/home/gon/actions-runner}"
RUNNER_NAME="${RUNNER_NAME:-ai-afterschool-runner}"
RUNNER_LABELS="self-hosted,linux,ai-fix"
RUNNER_VERSION="2.321.0"  # https://github.com/actions/runner/releases 에서 최신 버전 확인

# 필수 환경변수 체크
: "${RUNNER_TOKEN:?RUNNER_TOKEN 환경변수가 필요합니다}"
: "${GITHUB_OWNER:?GITHUB_OWNER 환경변수가 필요합니다}"
: "${GITHUB_REPO:?GITHUB_REPO 환경변수가 필요합니다}"

echo "=== GitHub Actions Self-hosted Runner 설치 ==="
echo "디렉토리: $RUNNER_DIR"
echo "이름: $RUNNER_NAME"
echo "라벨: $RUNNER_LABELS"

# 1. 디렉토리 생성
mkdir -p "$RUNNER_DIR"
cd "$RUNNER_DIR"

# 2. Runner 다운로드
echo ">>> Runner 다운로드 (v$RUNNER_VERSION)..."
curl -o actions-runner-linux-x64.tar.gz -L \
  "https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz"
tar xzf actions-runner-linux-x64.tar.gz
rm actions-runner-linux-x64.tar.gz

# 3. Runner 설정
echo ">>> Runner 설정..."
./config.sh \
  --url "https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}" \
  --token "$RUNNER_TOKEN" \
  --name "$RUNNER_NAME" \
  --labels "$RUNNER_LABELS" \
  --work "_work" \
  --replace

# 4. systemd 서비스 설치
echo ">>> systemd 서비스 설치..."
sudo ./svc.sh install "$USER"
sudo ./svc.sh start

echo ""
echo "=== 설치 완료 ==="
echo "상태 확인: sudo ./svc.sh status"
echo "로그 확인: journalctl -u actions.runner.${GITHUB_OWNER}-${GITHUB_REPO}.${RUNNER_NAME} -f"
echo ""
echo "필요한 GitHub Secrets:"
echo "  ANTHROPIC_API_KEY     - Claude Code API 키"
echo "  INTERNAL_API_SECRET   - 내부 API 인증 시크릿"
echo "  APP_URL               - 앱 URL (예: http://192.168.0.5:3001)"
echo "  REVIEWER_USERNAME     - PR 리뷰어 GitHub 사용자명"
echo "  DATABASE_URL_TEST     - 테스트용 DB URL"
```

**Step 2: 실행 권한 부여**

Run: `chmod +x scripts/setup-runner.sh`

**Step 3: 커밋**

```bash
git add scripts/setup-runner.sh
git commit -m "feat: Self-hosted runner 설치 스크립트 추가

GitHub Actions self-hosted runner를 로컬 머신에 설치하는 스크립트.
systemd 서비스 등록, 필요한 Secrets 목록 안내 포함.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 8: .env 및 GitHub Secrets 설정 가이드

필요한 환경변수와 GitHub Secrets 설정을 문서화.

**Files:**
- Modify: `docs/plans/2026-02-14-auto-fix-pipeline-design.md` (하단에 설정 체크리스트 추가)

**Step 1: 설정 체크리스트 추가**

설계 문서 하단에 다음 내용 추가:

```markdown
## 설정 체크리스트

### GitHub Secrets (필수)

| Secret | 설명 | 예시 |
|--------|------|------|
| `ANTHROPIC_API_KEY` | Claude Code API 키 | `sk-ant-...` |
| `INTERNAL_API_SECRET` | 내부 API 인증 시크릿 (랜덤 생성) | `openssl rand -hex 32` |
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
```

**Step 2: 커밋**

```bash
git add docs/plans/2026-02-14-auto-fix-pipeline-design.md
git commit -m "docs: 자동 수정 파이프라인 설정 체크리스트 추가

GitHub Secrets, 환경변수, Runner 설치, Branch Protection 설정 가이드.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 요약

| Task | 파일 | 설명 |
|------|------|------|
| 1 | `src/app/api/internal/issues/[id]/events/route.ts` | 내부 이벤트 API |
| 2 | `src/lib/github/services.ts` | dispatchAutoFix 함수 |
| 3 | `src/lib/actions/issues.ts` | createIssue에 트리거 연동 |
| 4 | `scripts/auto-fix-prompt.md` | Claude Code 프롬프트 |
| 5 | `.github/workflows/auto-fix.yml` | AI 수정 워크플로우 |
| 6 | `.github/workflows/auto-merge.yml` | 자동 머지 워크플로우 |
| 7 | `scripts/setup-runner.sh` | Runner 설치 스크립트 |
| 8 | 설계 문서 업데이트 | 설정 체크리스트 |

## 의존성 순서

```
Task 1 (API) ──┐
Task 2 (dispatch) ──┤
                    ├── Task 3 (연동) → Task 5 (워크플로우) → Task 6 (자동 머지)
Task 4 (프롬프트) ──┘
Task 7 (Runner)  ── 독립 (인프라)
Task 8 (설정)    ── 독립 (문서)
```

- Task 1, 2, 4는 병렬 진행 가능
- Task 3은 Task 2에 의존 (import)
- Task 5는 Task 1, 3, 4에 의존 (API + dispatch + 프롬프트 참조)
- Task 6은 Task 5 이후
- Task 7, 8은 독립적
