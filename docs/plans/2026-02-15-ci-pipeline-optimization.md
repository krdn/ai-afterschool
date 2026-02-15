# CI/CD 파이프라인 최적화 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** E2E 테스트를 배포 게이트로 전환하고, 56분 → 15분 이내로 단축

**Architecture:** `ai-qa.yml`에 sharding/캐시를 추가하고, `deploy.yml`을 `workflow_run` 트리거로 변경하여 QA 성공 시에만 배포 실행. Playwright config에서 timeout/retry를 조정.

**Tech Stack:** GitHub Actions, Playwright, Next.js

---

### Task 1: Playwright 설정 최적화

**Files:**
- Modify: `playwright.config.ts:15-19`

**Step 1: timeout과 retries 변경**

`playwright.config.ts`에서 아래 부분을 수정:

```typescript
// 변경 전 (15-19줄):
retries: process.env.CI ? 1 : 0,
workers: process.env.CI ? 2 : undefined,
timeout: process.env.CI ? 120000 : 30000,

// 변경 후:
retries: 0,
workers: process.env.CI ? 2 : undefined,
timeout: process.env.CI ? 60_000 : 30_000,
```

변경 이유:
- `retries: 0` — 배포 게이트 모드에서 flaky 테스트는 retry로 숨기지 않고 즉시 실패 처리
- `timeout: 60_000` — 120초에서 60초로 단축. 정상 테스트는 30초 이내에 완료됨
- `trace: 'on-first-retry'`는 retries: 0이면 의미 없으므로 `'retain-on-failure'`로 변경

`trace` 설정도 변경:
```typescript
// 변경 전 (29줄):
trace: 'on-first-retry',

// 변경 후:
trace: 'retain-on-failure',
```

**Step 2: 변경 확인**

Run: `cat playwright.config.ts | head -35`
Expected: retries: 0, timeout: 60_000, trace: 'retain-on-failure' 확인

**Step 3: 커밋**

```bash
git add playwright.config.ts
git commit -m "perf: Playwright timeout 60초로 단축 및 retry 제거

배포 게이트 모드 전환 — flaky 테스트 즉시 실패 처리
- timeout: 120s → 60s
- retries: 1 → 0
- trace: on-first-retry → retain-on-failure

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2: AI QA Pipeline에 Sharding 및 캐시 추가

**Files:**
- Modify: `.github/workflows/ai-qa.yml`

**Step 1: E2E job에 matrix sharding 추가**

`ai-qa.yml`의 e2e job을 아래로 교체:

```yaml
  # E2E 테스트 (DB + 앱 서버 필요) — Dependabot PR에서는 skip
  e2e:
    if: github.actor != 'dependabot[bot]'
    timeout-minutes: 20
    runs-on: ubuntu-latest
    needs: unit
    strategy:
      fail-fast: false
      matrix:
        shardIndex: [1, 2, 3]
        shardTotal: [3]

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: ai_afterschool_test
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U postgres"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    env:
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/ai_afterschool_test
      SESSION_SECRET: ci-test-session-secret-minimum-32-characters-long
      NEXT_PUBLIC_APP_URL: http://localhost:3000
      NODE_ENV: test

    steps:
    - uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Generate Prisma Client
      run: npx prisma generate

    - name: Run Prisma Migrations
      run: npx prisma migrate deploy

    - name: Seed Test Data
      run: npm run db:seed:test

    - name: Install Playwright Browsers
      run: npx playwright install --with-deps chromium

    - name: Cache Next.js build
      uses: actions/cache@v4
      with:
        path: .next/cache
        key: nextjs-${{ hashFiles('package-lock.json') }}-${{ hashFiles('src/**') }}
        restore-keys: |
          nextjs-${{ hashFiles('package-lock.json') }}-

    - name: Build Application
      run: npm run build
      env:
        NEXT_PUBLIC_APP_URL: http://localhost:3000

    - name: Run E2E Tests (Shard ${{ matrix.shardIndex }}/${{ matrix.shardTotal }})
      run: npx playwright test --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}
      env:
        CI: true

    - name: Upload Playwright Report
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: playwright-report-shard-${{ matrix.shardIndex }}
        path: playwright-report/
        retention-days: 30
```

주요 변경사항:
- `timeout-minutes: 60` → `20` (shard당 20분이면 충분)
- `strategy.matrix` 추가 — 3개 shard 병렬 실행
- `fail-fast: false` — 모든 shard의 리포트 수집
- `actions/cache@v4` — Next.js build 캐시
- artifact name에 shard 번호 추가 (중복 방지)

**Step 2: push 트리거에 워크플로 파일 경로 추가**

`ai-qa.yml`의 `on.push.paths`에 워크플로 자체 변경도 감지하도록 추가:

```yaml
on:
  push:
    paths:
      - 'src/**'
      - 'tests/**'
      - 'prisma/**'
      - '.github/workflows/ai-qa.yml'
      - 'playwright.config.ts'
  pull_request:
    branches: [ main ]
  workflow_dispatch:
```

**Step 3: 변경 확인**

Run: `cat .github/workflows/ai-qa.yml`
Expected: matrix sharding, cache step, timeout 20분 확인

**Step 4: 커밋**

```bash
git add .github/workflows/ai-qa.yml
git commit -m "perf: E2E 테스트 3-shard 병렬 실행 및 Next.js build 캐시 추가

- matrix sharding (3분할) → 56분 → ~15분 예상
- actions/cache로 .next/cache 캐시
- timeout 60분 → 20분
- 트리거 paths에 워크플로/playwright 설정 추가

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: Deploy 워크플로를 QA 게이트로 전환

**Files:**
- Modify: `.github/workflows/deploy.yml`

**Step 1: 트리거를 workflow_run으로 변경**

`deploy.yml` 전체를 아래로 교체:

```yaml
name: Deploy to Production

on:
  workflow_run:
    workflows: ["AI QA Pipeline"]
    types: [completed]
    branches: [main]
  workflow_dispatch:

env:
  REMOTE_DIR: /home/gon/projects/ai/ai-afterschool

jobs:
  deploy:
    # QA 성공 시에만 배포, 또는 수동 트리거
    if: >
      github.event_name == 'workflow_dispatch' ||
      (github.event.workflow_run.conclusion == 'success')
    runs-on: ubuntu-latest
    timeout-minutes: 20

    steps:
      - name: Deploy to server
        id: deploy
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.SERVER_HOST }}
          port: ${{ secrets.SERVER_PORT }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script_stop: true
          command_timeout: 15m
          script: |
            cd /home/gon/projects/ai/ai-afterschool
            git pull origin main
            ./scripts/deploy.sh --force --tag=${{ github.event.workflow_run.head_sha || github.sha }}

      - name: Rollback on failure
        if: failure() && steps.deploy.outcome == 'failure'
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.SERVER_HOST }}
          port: ${{ secrets.SERVER_PORT }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /home/gon/projects/ai/ai-afterschool
            ./scripts/rollback.sh --force

      - name: Verify rollback health
        if: failure() && steps.deploy.outcome == 'failure'
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.SERVER_HOST }}
          port: ${{ secrets.SERVER_PORT }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            curl -f http://localhost:3001/api/health || exit 1

      - name: Fail workflow on deploy error
        if: failure() && steps.deploy.outcome == 'failure'
        run: exit 1
```

주요 변경사항:
- `on.push` → `on.workflow_run` (AI QA Pipeline 완료 시 트리거)
- `if` 조건: QA 성공 또는 수동 트리거
- `--tag` 인자: `workflow_run.head_sha`를 우선 사용 (workflow_run 이벤트에서는 `github.sha`가 다를 수 있음)
- `paths-ignore` 제거 (더 이상 push 트리거가 아님)

**Step 2: 변경 확인**

Run: `cat .github/workflows/deploy.yml`
Expected: workflow_run 트리거, if 조건 확인

**Step 3: 커밋**

```bash
git add .github/workflows/deploy.yml
git commit -m "feat: Deploy를 QA 게이트로 전환 — E2E 통과 후에만 배포

- on.push → on.workflow_run (AI QA Pipeline 성공 시)
- workflow_dispatch 유지 (수동 배포)
- head_sha 참조로 정확한 커밋 배포 보장

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: 전체 검증

**Step 1: 워크플로 YAML 문법 검증**

Run: `npx yaml-lint .github/workflows/ai-qa.yml .github/workflows/deploy.yml 2>/dev/null || python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ai-qa.yml')); yaml.safe_load(open('.github/workflows/deploy.yml')); print('YAML OK')"`
Expected: YAML OK

**Step 2: Playwright config 검증**

Run: `npx playwright test --list 2>&1 | head -5`
Expected: 테스트 목록 출력 (config 파싱 정상)

**Step 3: 설계 문서 커밋**

```bash
git add docs/plans/2026-02-15-ci-pipeline-optimization-design.md docs/plans/2026-02-15-ci-pipeline-optimization.md
git commit -m "docs: CI/CD 파이프라인 최적화 설계 및 구현 계획 문서

Co-Authored-By: Claude <noreply@anthropic.com>"
```
