# Security Hardening Phase 1 - Design Document

## Date: 2026-02-15

## Goal
CI/CD 파이프라인과 Next.js 애플리케이션에 기본 보안 점검을 추가하여,
의존성 취약점, 웹 공격, 라이브러리 보안 이슈를 자동으로 감지한다.

## Scope (Phase 1)

### 1. GitHub Actions npm audit
- `ai-qa.yml`에 `security` job 추가 (unit과 병렬 실행)
- `npm audit --audit-level=high` — high 이상 취약점 시 실패
- 의존성 설치 후 바로 실행

### 2. Security Headers (next.config.ts)
- `headers()` 함수 추가
- 5개 헤더: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy
- 모든 경로에 적용 (`/:path*`)

### 3. Dependabot
- `.github/dependabot.yml` 생성
- npm 패키지 주 1회 검사
- PR 최대 5개 제한

## Files Changed
- `.github/workflows/ai-qa.yml` — security job 추가
- `next.config.ts` — headers() 함수 추가
- `.github/dependabot.yml` — 신규 생성

## Out of Scope (Phase 2+)
- Rate Limiting, ESLint 보안 플러그인, 로그인 실패 제한
- CodeQL, CSP, 보안 이벤트 로깅
