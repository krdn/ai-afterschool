# Technology Stack

**Project:** AI AfterSchool - Issue Management & Auto DevOps Features
**Researched:** 2026-02-11

## Executive Summary

이 연구는 Issue Management 및 Auto DevOps 기능을 위한 **최소한의 타겟 스택 추가사항**을 식별합니다. 기존 Next.js 15 + Prisma + Sentry 스택은 이미 견고합니다. GitHub API 통합, 브라우저 스크린샷, 웹훅 처리를 위해 **단 4개의 새 의존성만 추가**합니다.

**핵심 결정:** 단순성과 미래 대응성을 위해 `@octokit/rest`가 아닌 `octokit` 통합 SDK 사용.

## Recommended Stack

### 1. GitHub API Integration

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **octokit** | ^5.0.5 | GitHub API 클라이언트 (REST + GraphQL) | 올인원 SDK, TypeScript 네이티브, 하나의 패키지로 REST와 GraphQL 모두 지원 |
| **@octokit/webhooks** | ^14.0.0 | 웹훅 이벤트 핸들링 | 타입 안전 웹훅 페이로드 파싱, 서명 검증 내장 |
| **@octokit/auth-app** | ^8.0.0 | GitHub App 인증 | JWT + 설치 토큰 관리, App 기반 인증에 필수 |

**근거:**
- **`octokit` vs `@octokit/rest`**: 통합 `octokit` 패키지(v5.0.5)는 REST API, GraphQL, 플러그인 지원을 포함합니다. `@octokit/rest`(v22.0.1)는 REST만 지원하며 웹훅/인증을 위한 수동 조합이 필요합니다.
- **TypeScript 우선**: 모든 패키지가 네이티브 TypeScript 선언을 제공하므로 `@types/*` 패키지가 필요 없습니다.
- **유지보수 활발**: 모든 패키지가 최근 3-5개월 내 퍼블리시되어 활발히 유지보수 중입니다.
- **Next.js 15 호환**: App Router와 호환되며 특별한 어댑터가 필요 없습니다.

**설치:**
```bash
npm install octokit @octokit/webhooks @octokit/auth-app
```

### 2. Browser Screenshot Capture

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **modern-screenshot** | ^4.6.8 | 클라이언트 사이드 DOM-to-image 변환 | html-to-image의 활발히 유지보수되는 포크, html2canvas보다 빠름, TypeScript 네이티브 |

**검토된 대안:**

| Library | Version | Why Not |
|---------|---------|---------|
| **html2canvas** | ^1.4.1 | 느림, 번들 크기 큼, 오래된 코드베이스(2014) |
| **dom-to-image** | ^2.6.0 | **피할 것**: 2018년 이후 유지보수 중단, 미해결 버그 |
| **html-to-image** | ^1.11.13 | 좋지만, modern-screenshot이 성능 개선된 유지보수 포크 |

**근거:**
- **성능**: 벤치마크 결과 `modern-screenshot`이 큰 DOM 트리에서 렌더 속도와 메모리 사용 면에서 `html2canvas`를 능가합니다.
- **최신성**: 11일 전(2026-01-31) 퍼블리시, 활발한 개발.
- **출력 형식**: PNG, JPEG, SVG, Blob/Base64 변형 지원.
- **번들 크기**: 경량 (~20KB gzipped vs html2canvas ~40KB).
- **사용량**: 주간 다운로드 575,697회, npm 레지스트리에 64개 의존 패키지.

**설치:**
```bash
npm install modern-screenshot
```

**사용 예시:**
```typescript
import { domToBlob } from 'modern-screenshot';

async function captureScreenshot(element: HTMLElement) {
  const blob = await domToBlob(element, {
    quality: 0.95,
    scale: 2, // 레티나 디스플레이용 2배
  });
  return blob;
}
```

### 3. Webhook Signature Verification (선택적 헬퍼)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **webhook-signature** | ^1.0.0 | 통합 웹훅 서명 검증 | 다중 제공자 지원(GitHub, Stripe, Slack), 보일러플레이트 감소 |

**참고:** `@octokit/webhooks`가 이미 GitHub 서명 검증을 포함합니다. 이 라이브러리는 여러 제공자의 웹훅을 검증해야 할 경우(예: Stripe 결제 + GitHub 이벤트) **선택적**입니다.

**권장사항:** 현재는 **이 의존성을 건너뛰세요**. `@octokit/webhooks`의 내장 검증을 사용하세요. 나중에 추가 웹훅 제공자를 통합할 때만 `webhook-signature`를 추가하세요.

## GitHub Actions Enhancements

**새 의존성 불필요.** 개선사항은 기존 GitHub Actions 기능을 활용합니다:

### 권장 워크플로우 개선사항

| Enhancement | Implementation | Why |
|-------------|----------------|-----|
| **배포 환경** | 보호 규칙이 있는 GitHub Environments 사용 | 퍼블릭 저장소에서 무료, 추가 도구 없이 승인 게이트 |
| **Docker Compose 배포** | `docker/setup-buildx-action@v3` + SSH 배포 | 이미 Docker Compose 사용 중, 기존 deploy.yml 확장 |
| **머지 시 자동 태그** | GitHub Actions `github.ref` + `git tag` | 외부 도구 불필요, 네이티브 Git 작업 |
| **배포 롤백** | 최근 N개 Docker 이미지 저장, 롤백 워크플로우 추가 | 기존 GitHub Container Registry 활용 |

**사용할 주요 Actions:**
```yaml
# .github/workflows/deploy.yml 개선사항
- uses: docker/setup-buildx-action@v3
- uses: docker/build-push-action@v5
  with:
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

**환경 보호 규칙:**
- Settings → Environments → Production으로 이동
- 수동 승인 게이트를 위한 필수 리뷰어 추가
- `main`만 허용하도록 브랜치 제한 설정

## Sentry Integration Enhancements

**새 의존성 불필요.** `@sentry/nextjs` (v10.38.0)가 이미 설치되어 있으며 필요한 모든 기능을 제공합니다.

### 에러 집계 및 중복 제거

| Feature | Implementation | API |
|---------|----------------|-----|
| **커스텀 핑거프린팅** | 클라이언트 사이드 SDK 설정 | `beforeSend` 훅 |
| **그룹핑 규칙** | Project Settings → Fingerprint Rules | 웹 UI 설정 |
| **이슈 검색 API** | REST API `/api/0/projects/{org}/{project}/issues/` | HTTP GET with filters |
| **이슈 생성 API** | REST API `/api/0/projects/{org}/{project}/issues/` | HTTP POST (필요시) |

**구현 전략:**
1. **클라이언트 사이드 그룹핑**: `sentry.client.config.ts`에 `beforeSend` 훅 추가하여 에러 타입/컴포넌트 기반 커스텀 핑거프린트 설정.
2. **서버 사이드 그룹핑**: Sentry UI에서 글로브 패턴을 사용하여 Fingerprint Rules 설정.
3. **자동 이슈 생성**: GitHub 이슈 생성 전 Sentry REST API를 사용하여 이슈 존재 여부 확인(중복 제거).

**커스텀 핑거프린팅 예시:**
```typescript
// sentry.client.config.ts
Sentry.init({
  beforeSend(event, hint) {
    // 모든 API 에러를 엔드포인트 + 상태 코드로 그룹화
    if (event.exception?.values?.[0]?.type === 'APIError') {
      const endpoint = event.contexts?.api?.endpoint;
      const status = event.contexts?.api?.status;
      event.fingerprint = ['api-error', endpoint, status];
    }
    return event;
  },
});
```

**Sentry API 인증:**
```typescript
// 내부 통합 토큰 사용 (Settings → Developer Settings에서 생성)
const SENTRY_AUTH_TOKEN = process.env.SENTRY_AUTH_TOKEN;
const headers = {
  'Authorization': `Bearer ${SENTRY_AUTH_TOKEN}`,
};
```

## Next.js API Route Considerations

### 웹훅 핸들러 패턴 (App Router)

**파일:** `app/api/github/webhooks/route.ts`

**구현:**
```typescript
import { Webhooks } from '@octokit/webhooks';
import { NextRequest, NextResponse } from 'next/server';

const webhooks = new Webhooks({
  secret: process.env.GITHUB_WEBHOOK_SECRET!,
});

// 이벤트 핸들러 등록
webhooks.on('issues.opened', async ({ payload }) => {
  // 이슈 오픈 이벤트 처리
});

export async function POST(request: NextRequest) {
  const body = await request.text(); // 서명 검증용 원본 본문
  const signature = request.headers.get('x-hub-signature-256');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
  }

  try {
    await webhooks.verifyAndReceive({
      id: request.headers.get('x-github-delivery')!,
      name: request.headers.get('x-github-event') as any,
      signature,
      payload: body,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }
}
```

**중요:** Next.js 15 App Router는 서명 검증을 위해 **원본 요청 본문**에 액세스해야 합니다. 검증 전에 `await request.json()`을 사용하지 마세요.

## Existing Stack (변경 불필요)

이 기존 의존성들은 이미 새 기능을 지원합니다:

| Technology | Version | Used For |
|------------|---------|----------|
| **@sentry/nextjs** | ^10.38.0 | 에러 추적, 이미 통합됨 |
| **next** | ^15.5.10 | 웹훅용 App Router API 라우트 |
| **@prisma/client** | ^7.3.0 | GitHub 이슈 메타데이터, 배포 이력 저장 |
| **zod** | ^4.3.6 | 웹훅 페이로드 검증 |
| **pino** | ^10.3.0 | 웹훅 이벤트 구조화 로깅 |

## Database Schema Additions

**새 데이터베이스 기술 불필요.** 기존 PostgreSQL 스키마 확장:

```prisma
// prisma/schema.prisma 추가사항

model GitHubIssue {
  id            String   @id @default(cuid())
  issueNumber   Int
  issueUrl      String
  title         String
  state         String   // "open" | "closed"
  createdBy     String   // "auto" | userId
  sentryIssueId String?  // Sentry 이슈 링크
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([issueNumber])
  @@index([sentryIssueId])
}

model Deployment {
  id            String   @id @default(cuid())
  version       String
  commitSha     String
  deployedBy    String   // GitHub 사용자명
  status        String   // "pending" | "success" | "failed"
  environment   String   // "production" | "staging"
  deployedAt    DateTime @default(now())

  @@index([commitSha])
  @@index([environment, deployedAt])
}
```

## Environment Variables Required

`.env` 및 `.env.example`에 추가:

```bash
# GitHub Integration
GITHUB_APP_ID=123456
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."
GITHUB_APP_INSTALLATION_ID=78910
GITHUB_WEBHOOK_SECRET=your_webhook_secret_here
GITHUB_REPO_OWNER=your-org
GITHUB_REPO_NAME=ai-afterschool

# Sentry API (자동 이슈 생성용)
SENTRY_AUTH_TOKEN=sntrys_your_token_here
SENTRY_ORG=your-org
SENTRY_PROJECT=ai-afterschool
```

## Installation Commands

```bash
# 핵심 GitHub 통합
npm install octokit@^5.0.5 @octokit/webhooks@^14.0.0 @octokit/auth-app@^8.0.0

# 브라우저 스크린샷
npm install modern-screenshot@^4.6.8

# 타입 정의 (필요시, 대부분 패키지가 타입 포함)
# 추가 @types 패키지 불필요 - 모두 TypeScript 네이티브
```

## Anti-Recommendations

### 추가하지 말 것

| Technology | Why Not |
|------------|---------|
| **Probot** | 단순 웹훅 처리에 과함, Express.js 의존성 추가 |
| **@octokit/rest** | 통합 `octokit` 패키지로 대체됨 |
| **html2canvas** | 느림, 번들 크기 큼, 오래된 코드베이스 |
| **dom-to-image** | 유지보수 중단, 알려진 버그 |
| **GitHub GraphQL API (직접)** | `octokit`이 이미 GraphQL 지원 포함 |
| **별도 웹훅 서버** | Next.js API 라우트가 네이티브로 웹훅 처리 |
| **추가 CI/CD 도구** | 현재 요구사항에 GitHub Actions로 충분 |

## Integration Points

### 1. GitHub 이슈 생성 플로우
```
사용자가 "이슈 보고" 클릭
→ 스크린샷 캡처 (modern-screenshot)
→ Cloudinary에 업로드 (기존)
→ GitHub 이슈 생성 (octokit)
→ 메타데이터 저장 (Prisma)
→ Sentry 이슈 링크 (선택)
```

### 2. Auto DevOps 플로우
```
PR이 main에 머지됨
→ GitHub Actions 트리거
→ Docker 이미지 빌드
→ GHCR에 푸시
→ 운영 서버에 배포 (SSH)
→ 배포 기록 (Prisma)
→ GitHub 이슈에 포스트 (octokit)
```

### 3. 에러-to-이슈 플로우
```
Sentry 에러 캡처
→ 중복 확인을 위한 핑거프린트 체크 (Sentry API)
→ 새 에러 타입인 경우:
  → GitHub 이슈 생성 (octokit)
  → Sentry 이슈 ID 링크 (Prisma)
  → "auto-generated" 라벨 추가
```

## Migration Considerations

### 단계별 롤아웃

| Phase | Changes | Risk |
|-------|---------|------|
| **Phase 1** | 의존성 추가, 기본 GitHub API 통합 | 낮음 - 읽기 전용 작업 |
| **Phase 2** | 웹훅 핸들러, 이슈 생성 | 중간 - 쓰기 작업 |
| **Phase 3** | Auto DevOps 파이프라인 | 중간 - 배포 자동화 |
| **Phase 4** | 에러-to-이슈 자동화 | 낮음 - 선택적 기능 |

### 롤백 계획

모든 새 기능은 **추가적**이며, 중단 변경이 아닙니다:
- 의존성 제거: `npm uninstall octokit @octokit/webhooks @octokit/auth-app modern-screenshot`
- 웹훅 엔드포인트 비활성화: 라우트 핸들러 주석 처리
- GitHub Actions 개선사항 비활성화: 워크플로우 파일 되돌리기

## Performance Considerations

| Concern | Impact | Mitigation |
|---------|--------|-----------|
| **스크린샷 번들 크기** | +20KB gzipped | 코드 스플릿, "이슈 보고" 클릭 시에만 지연 로드 |
| **GitHub API 레이트 제한** | 5,000 요청/시간 (인증됨) | 이슈 메타데이터 캐시, 업데이트는 웹훅 사용 |
| **웹훅 처리 시간** | 이벤트당 <100ms | 비동기 처리, 즉시 200 반환 |
| **Sentry API 호출** | <100 호출/일 | 중복 체크 배치, 핑거프린트 캐시 |

## Security Considerations

| Concern | Solution |
|---------|----------|
| **GitHub App 프라이빗 키** | 환경 변수에 저장, 절대 커밋하지 않음 |
| **웹훅 시크릿 검증** | 처리 전 항상 서명 검증 |
| **Sentry 인증 토큰** | 최소 범위의 내부 통합 토큰 사용 |
| **스크린샷 데이터 노출** | 캡처 전 DOM 정제(민감 필드 제거) |

## Testing Strategy

| Component | Test Type | Tool |
|-----------|-----------|------|
| GitHub API 통합 | 단위 테스트 | Vitest + mocked Octokit |
| 웹훅 핸들러 | 통합 테스트 | Playwright + webhook fixtures |
| 스크린샷 캡처 | E2E 테스트 | Playwright (브라우저 컨텍스트) |
| GitHub Actions 워크플로우 | 수동 테스트 | 스테이징 환경에서 먼저 테스트 |

## Cost Analysis

| Service | Current | New | Increase |
|---------|---------|-----|----------|
| **GitHub Actions** | 무료 (퍼블릭 저장소) | 무료 | $0 |
| **GitHub API** | 무료 | 무료 | $0 |
| **Sentry** | 현재 플랜 | 현재 플랜 | $0 |
| **npm 패키지** | 무료 | 무료 | $0 |
| **합계** | - | - | **$0** |

**참고:** 모든 추가사항은 무료 티어 또는 기존 유료 서비스를 사용합니다.

## Monitoring & Observability

기존 Sentry/Pino 로깅에 추가:

```typescript
// GitHub API 호출 로깅
logger.info({
  action: 'github.issue.created',
  issueNumber: issue.number,
  issueUrl: issue.html_url,
  userId: session.user.id,
});

// 웹훅 이벤트 로깅
logger.info({
  action: 'github.webhook.received',
  event: event.name,
  deliveryId: deliveryId,
});

// 배포 이벤트 로깅
logger.info({
  action: 'deployment.completed',
  version: version,
  environment: 'production',
  duration: deploymentDuration,
});
```

## Sources

### 공식 문서
- [Octokit SDK Documentation](https://github.com/octokit/octokit.js/) - HIGH 신뢰도
- [@octokit/webhooks Documentation](https://github.com/octokit/webhooks.js) - HIGH 신뢰도
- [modern-screenshot npm page](https://www.npmjs.com/package/modern-screenshot) - MEDIUM 신뢰도
- [GitHub Actions Docker Documentation](https://docs.docker.com/build/ci/github-actions/) - HIGH 신뢰도
- [Sentry Fingerprint Rules](https://docs.sentry.io/concepts/data-management/event-grouping/fingerprint-rules/) - HIGH 신뢰도
- [GitHub Actions Deployment Environments](https://docs.github.com/actions/deployment/about-deployments/deploying-with-github-actions) - HIGH 신뢰도

### 비교 및 분석
- [Best HTML to Canvas Solutions in 2025](https://portalzine.de/best-html-to-canvas-solutions-in-2025/) - MEDIUM 신뢰도
- [html2canvas vs modern-screenshot comparison](https://npm-compare.com/html2canvas,modern-screenshot,puppeteer,screenshot-desktop) - MEDIUM 신뢰도
- [GitHub Actions Deployment Best Practices](https://codefresh.io/learn/github-actions/deployment-with-github-actions/) - MEDIUM 신뢰도
- [Next.js GitHub Webhook Handler Guide](https://www.karimshehadeh.com/blog/posts/GithubWebhooksAndNextJS) - MEDIUM 신뢰도

### 커뮤니티 리소스
- [GitHub Actions Docker Compose Deployment](https://ecostack.dev/posts/automated-docker-compose-deployment-github-actions/) - MEDIUM 신뢰도
- [Sentry Custom Fingerprints](https://blog.sentry.io/setting-up-custom-fingerprints/) - HIGH 신뢰도 (공식 블로그)

---

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| GitHub API (octokit) | **HIGH** | 공식 문서, npm 패키지 검증, 버전 확인 |
| Webhooks (@octokit/webhooks) | **HIGH** | 공식 패키지, 널리 사용됨(주간 다운로드 504K) |
| Screenshot (modern-screenshot) | **MEDIUM** | npm 검증, 주간 다운로드 575K, 하지만 공식 문서 제한적 |
| GitHub Actions 개선사항 | **HIGH** | 공식 GitHub 문서, 확립된 패턴 |
| Sentry 통합 | **HIGH** | 이미 Sentry 사용 중, 공식 API 문서, 기존 통합 |

**전체 평가:** HIGH 신뢰도. 모든 권장사항이 공식 패키지, 검증된 버전, 입증된 패턴을 사용합니다. 스크린샷 라이브러리만 커뮤니티 포크라는 이유로 MEDIUM 신뢰도이지만, 강력한 채택 지표와 활발한 유지보수를 보여줍니다.
