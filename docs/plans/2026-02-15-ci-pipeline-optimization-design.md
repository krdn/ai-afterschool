# CI/CD 파이프라인 최적화 설계

**날짜**: 2026-02-15
**목표**: E2E 테스트 56분 → 15분 이내, E2E를 배포 게이트로 전환

## 문제 분석

### 현재 상태
- `ai-qa.yml`과 `deploy.yml`이 `on: push`로 동시 트리거
- E2E 실패해도 Deploy 진행됨 (게이트 역할 미수행)
- E2E 56분 소요 (전체 QA 파이프라인의 93%)

### 소요 시간 분석 (E2E job)
| Step | 소요 시간 |
|------|----------|
| npm ci | ~29초 |
| Playwright install | ~27초 |
| Next.js build | ~2분 |
| **E2E 테스트 실행** | **~56분** |

### 원인
1. timeout 120s + retry 1 → 실패 테스트당 최대 4분
2. worker 2개로만 실행 (sharding 미적용)
3. Next.js build 캐시 미사용
4. Deploy와 QA가 독립 실행 (게이트 역할 불가)

## 설계

### 1. 파이프라인 통합 (QA → Deploy 게이트)

`deploy.yml` 트리거를 `on: push` → `on: workflow_run`으로 변경:

```yaml
on:
  workflow_run:
    workflows: ["AI QA Pipeline"]
    types: [completed]
    branches: [main]
  workflow_dispatch:
```

Deploy job 조건:
```yaml
if: >
  github.event_name == 'workflow_dispatch' ||
  (github.event.workflow_run.conclusion == 'success')
```

- QA 성공 시에만 Deploy 실행
- `workflow_dispatch`로 수동 배포 유지
- `paths-ignore` 제거 (QA 트리거에 의존)

### 2. Playwright Sharding (3분할 병렬)

GitHub Actions matrix로 3개 shard 병렬 실행:

```yaml
e2e:
  strategy:
    fail-fast: false
    matrix:
      shardIndex: [1, 2, 3]
      shardTotal: [3]
  steps:
    - run: npx playwright test --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}
```

- 56분 / 3 ≈ ~19분 (runner 오버헤드 감안)
- `fail-fast: false`로 모든 shard 완료까지 실행 (리포트 수집)

### 3. Timeout/Retry 조정

```typescript
// playwright.config.ts
timeout: process.env.CI ? 60_000 : 30_000,  // 120s → 60s
retries: 0,  // 게이트 모드: 실패 즉시 차단
```

- 배포 게이트이므로 flaky 테스트를 retry로 숨기지 않음
- 실패 시 즉시 차단하여 시간 절약

### 4. Next.js Build 캐시

```yaml
- uses: actions/cache@v4
  with:
    path: .next/cache
    key: nextjs-${{ hashFiles('package-lock.json') }}-${{ hashFiles('src/**') }}
    restore-keys: nextjs-${{ hashFiles('package-lock.json') }}-
```

- 캐시 히트 시 빌드 ~40초 (현재 ~2분)
- `src/**` 해시로 소스 변경 감지

## 예상 결과

| 항목 | Before | After |
|------|--------|-------|
| E2E 총 시간 | 56분 | ~12-15분 |
| 배포 게이트 | 없음 | QA 통과 필수 |
| Build 시간 | ~2분 | ~40초 (캐시 히트) |
| 실패 테스트 대기 | 최대 4분/개 | 최대 1분/개 |

## 변경 파일

1. `.github/workflows/ai-qa.yml` — sharding, build 캐시, npm 캐시 추가
2. `.github/workflows/deploy.yml` — workflow_run 트리거로 변경
3. `playwright.config.ts` — timeout/retry 조정
