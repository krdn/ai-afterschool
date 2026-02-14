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
