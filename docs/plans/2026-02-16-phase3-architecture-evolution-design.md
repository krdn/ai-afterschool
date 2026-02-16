# Phase 3: 아키텍처 진화 설계

> **작성일**: 2026-02-16
> **대상**: ai-afterschool (Next.js 15.5 + React 19.2 + Prisma 7)
> **범위**: DDD 전환, 분석 모델 통합, i18n 인프라, SSE 실시간 알림

---

## 1. DDD 점진적 모듈화

### 목표
`lib/actions/` 44개 파일과 `lib/db/` 24개 파일을 도메인별로 재구성.
기존 import path는 re-export로 호환 유지.

### 도메인 분류

```
src/lib/actions/
├── student/           # 학생 도메인
│   ├── crud.ts        ← students.ts, student.ts 통합
│   ├── analysis.ts    ← analysis.ts, zodiac-analysis.ts, calculation-analysis.ts 등
│   ├── survey.ts      ← mbti-survey.ts, vark-survey.ts
│   └── index.ts       # barrel export
├── teacher/           # 교사 도메인
│   ├── crud.ts        ← teacher.ts
│   ├── analysis.ts    ← teacher-analysis.ts, teacher-face/palm-analysis.ts
│   └── index.ts
├── counseling/        # 상담 도메인
│   ├── session.ts     ← counseling.ts, counseling-ai.ts
│   └── index.ts
├── auth/              # 인증 도메인
│   ├── login.ts       ← auth.ts
│   └── index.ts
├── admin/             # 관리 도메인
│   ├── prompts.ts     ← admin 관련
│   ├── providers.ts   ← provider 관련
│   └── index.ts
├── matching/          # 매칭 도메인
│   └── index.ts
└── _legacy/           # 기존 파일 re-export (점진 제거)
    ├── students.ts    → export * from '../student/crud'
    └── ...
```

### 호환성 전략
- `_legacy/` 폴더에서 기존 경로로 re-export
- 새 코드는 도메인 경로 사용: `import { getStudents } from '@/lib/actions/student'`
- 점진적으로 `_legacy/` import를 새 경로로 마이그레이션
- `lib/db/`도 동일 도메인 구조 적용

---

## 2. 분석 모델 다형성 통합

### 현재 (10개 테이블, 60~70% 중복)

| 학생 모델 | 교사 모델 | 중복도 |
|-----------|-----------|--------|
| SajuAnalysis | TeacherSajuAnalysis | 95% |
| NameAnalysis | TeacherNameAnalysis | 95% |
| MbtiAnalysis | TeacherMbtiAnalysis | 100% |
| FaceAnalysis | TeacherFaceAnalysis | 95% |
| PalmAnalysis | TeacherPalmAnalysis | 100% |

### 통합 스키마

```prisma
enum SubjectType {
  STUDENT
  TEACHER
}

model SajuAnalysis {
  id            String      @id @default(cuid())
  subjectType   SubjectType
  subjectId     String
  inputSnapshot Json?
  result        Json?
  interpretation String?
  usedProvider  String?
  usedModel     String?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@unique([subjectType, subjectId])
  @@index([subjectType, subjectId])
}
```

동일 패턴을 NameAnalysis, MbtiAnalysis, FaceAnalysis, PalmAnalysis에 적용.

### 마이그레이션 전략
1. SubjectType enum + 통합 스키마 추가
2. 데이터 마이그레이션 SQL: Teacher 테이블 → 통합 테이블에 INSERT (subjectType='TEACHER')
3. 기존 Student 데이터에 subjectType='STUDENT' 설정
4. Teacher 전용 테이블 drop
5. DB 함수 제네릭화: `getAnalysis(analysisType, subjectType, subjectId)`

### 영향 범위
- Prisma 스키마: 5개 테이블 통합
- DB 함수: 10쌍 → 5개 제네릭 함수
- Server Actions: 교사 분석 관련 수정
- 컴포넌트: props 인터페이스 변경

---

## 3. i18n 인프라 (next-intl)

### 기술 선택: next-intl
- Next.js 15 App Router 전용
- Server/Client Component 모두 지원
- TypeScript 타입 안전 메시지 키

### 구조

```
src/
├── i18n/
│   ├── request.ts       # Next.js 15 서버 설정
│   ├── routing.ts       # 라우팅 설정 (ko 기본, en 추가)
│   └── navigation.ts    # Link, redirect, usePathname 래퍼
├── messages/
│   ├── ko.json          # 한국어 (기본 언어)
│   └── en.json          # 영어
└── middleware.ts         # locale 감지 로직 추가
```

### 적용 범위
- UI 라벨, 버튼 텍스트, 에러/토스트 메시지 추출
- JSDoc 주석: 한국어 유지 (코드 주석 컨벤션)
- 대상: 195개 컴포넌트 중 50~60%

### URL 전략
- 경로 기반: `/ko/students`, `/en/students`
- 기본 locale `ko`는 prefix 생략 가능 (`/students` = `/ko/students`)

### 사용 패턴

```tsx
// Server Component
import { getTranslations } from 'next-intl/server'
const t = await getTranslations('StudentPage')
return <h1>{t('title')}</h1>

// Client Component
import { useTranslations } from 'next-intl'
const t = useTranslations('StudentPage')
return <button>{t('delete')}</button>
```

---

## 4. SSE 실시간 알림

### 대상 이벤트
AI 분석 완료 알림 (사주, MBTI, VARK, 관상, 수상, 이름풀이, 별자리)

### 아키텍처

```
AI 분석 완료 → Server Action → DB 저장
                            → EventBus.emit('analysis:complete', payload)
                                     ↓
Client ← SSE /api/events ← EventBus.on('analysis:complete')
              ↓
         Toast 알림 표시
```

### 구현 요소

1. **EventBus** (`src/lib/events/event-bus.ts`)
   - 인메모리 EventEmitter (서버 사이드 싱글톤)
   - 이벤트 타입 정의

2. **SSE 엔드포인트** (`src/app/api/events/route.ts`)
   - 인증된 사용자만 접근 (verifySession)
   - ReadableStream으로 이벤트 스트림
   - 30초 heartbeat

3. **클라이언트 훅** (`src/lib/hooks/use-event-source.ts`)
   - EventSource API 래퍼
   - 자동 재연결 (exponential backoff)
   - 연결 상태 관리

4. **Toast 연동** (`src/components/common/notification-provider.tsx`)
   - 알림 도착 시 토스트 표시
   - Dashboard layout에 통합

### 이벤트 타입

```typescript
type AnalysisCompleteEvent = {
  type: 'analysis:complete'
  analysisType: 'saju' | 'mbti' | 'vark' | 'face' | 'palm' | 'name' | 'zodiac'
  subjectType: 'STUDENT' | 'TEACHER'
  subjectId: string
  subjectName: string
  timestamp: string
}
```

---

## 실행 순서

| 순서 | 항목 | 의존성 | 예상 영향 |
|------|------|--------|----------|
| 1 | 분석 모델 통합 | 없음 | 스키마 변경 (가장 근본적) |
| 2 | DDD 모듈화 | 모델 통합 후 | 파일 구조 재편 |
| 3 | SSE 실시간 알림 | DDD 후 | 새 기능 추가 |
| 4 | i18n 인프라 | 독립적 | 모든 컴포넌트 영향 |

분석 모델 통합 → DDD 순서로 진행해야 도메인 구조에 통합된 모델이 반영됩니다.
i18n은 독립적이지만 마지막에 진행하는 것이 안정적입니다 (다른 변경이 안정화된 후 문자열 추출).
