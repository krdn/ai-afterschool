# AGENTS.md

이 저장소에서 작업하는 AI 코딩 에이전트는 다음 가이드라인을 따라야 합니다.

## 빌드/린트/테스트 명령어

```bash
# 개발
npm run dev              # Next.js 개발 서버 시작

# 빌드
npm run build            # 프로덕션 빌드
npm run analyze          # 번들 크기 분석 (ANALYZE=true)

# 린트
npm run lint             # ESLint 실행

# 테스트
npm run test             # 모든 테스트 실행 (vitest run)
npx vitest run <경로>    # 특정 테스트 파일 실행
npx vitest run --reporter=verbose  # 상세 출력
```

## 코드 스타일 가이드라인

### 임포트
- `@/` 별칭 사용: `import { db } from "@/lib/db"`
- 임포트 그룹 순서: React/Next → 외부 라이브러리 → 내장 (@/) → 상대 경로
- 타입 임포트 사용: `import type { Student } from "@prisma/client"`

### 포맷팅
- 2칸 들여쓰기
- 세미콜론 필수
- 문자열은 작은따옴표
- 후행 쉼표 없음 (기존 패턴 따르기)
- 최대 줄 길이: 100자 (권장)

### 타입 및 네이밍
- **타입/인터페이스**: PascalCase (`StudentData`, `ApiResponse`)
- **함수**: camelCase (`getStudentById`)
- **컴포넌트**: PascalCase (`StudentCard`)
- **상수**: UPPER_SNAKE_CASE (진정한 상수에만 사용)
- **파일**: kebab-case (`student-utils.ts`)
- **열거형**: PascalCase 이름, UPPER_SNAKE_CASE 값

### 리액트 컴포넌트
- 함수 선언 사용: `function Button({ ... })`
- Props 인터페이스는 `Props` 접미사: `ButtonProps`
- 기본적으로 서버 컴포넌트, 필요할 때만 `'use client'`
- 서버 액션은 파일 상단에 `'use server'`

### 에러 처리
- 서버 액션은 `{ success: true, data }` 또는 `{ success: false, error }` 반환
- Zod로 검증 스키마 작성: `src/lib/validations/`
- pino 로거로 에러 기록: `import { logger } from "@/lib/logger"`
- 에러 메시지에 민감한 데이터 노출 금지

### 데이터베이스 (Prisma)
- RBAC 래퍼 사용: `getRBACPrisma(session)`로 권한 인식 쿼리
- 관리자 작업은 `import { db } from "@/lib/db"`로 원시 DB 접근
- DB 작업 전 Zod로 입력 검증

### 스타일링 (Tailwind v4 + shadcn)
- `cn()` 유틸리티 사용: `@/lib/utils`에서 조걶 클래스
- cva로 컴포넌트 변형: `class-variance-authority`
- shadcn/ui 컴포넌트: `src/components/ui/`
- 커스텀 컴포넌트는 shadcn 패턴 따르기

### 테스트 (Vitest)
- 테스트 위치: `tests/**/*.test.ts`
- 설정 파일: `tests/setup.ts`
- `describe`/`it` 패턴 사용
- 외부 서비스 모킹, 엣지 케이스 테스트

### 파일 구조
```
src/
  app/           # Next.js App Router
    (auth)/      # 인증 라우트 (login, reset)
    (dashboard)/ # 메인 앱 라우트
    api/         # API 라우트
  components/    # 리액트 컴포넌트
    ui/          # shadcn 컴포넌트
  lib/           # 유틸리티
    actions/     # 서버 액션
    db/          # 데이터베이스 함수
    validations/ # Zod 스키마
    ai/          # AI/LLM 통합
    analysis/    # 분석 알고리즘
  hooks/         # 커스텀 리액트 훅
```

### 환경 변수
- `scripts/validate-env.ts`에서 검증
- `.env` 파일은 절대 커밋하지 않음
- 빌드 전 `validate:env` 스크립트 실행

### 로깅
- pino 로거 사용: `import { logger } from "@/lib/logger"`
- 민감한 필드 자동 마스킹 (password, token, apiKey)
- 레벨: debug (개발), info (프로덕션), error는 항상

### 보안
- 서버 액션에서 `verifySession()`으로 RBAC 검사
- DAL에서 세션 검증: `src/lib/dal.ts`
- 처리 전 Zod로 입력 검증
- Sentry로 에러 추적 (next.config.ts에 설정)

### 언어 및 커뮤니케이션
- **모든 사용자 메시지와 문서는 한국어로 작성**
- UI 텍스트, 에러 메시지, 주석 모두 한국어 사용
- 코드 내 문자열 리터럴은 한국어 (예: `"학생을 등록필볼게요"`)
- 외부 API 응답이나 라이브러리 문서 제외하고 모든 출력 한국어로 작성
