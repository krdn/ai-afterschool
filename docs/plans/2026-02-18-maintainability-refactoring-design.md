# 유지보수성 개선 리팩토링 설계

**날짜**: 2026-02-18
**접근법**: Bottom-Up (데이터 계층 → 서버 액션 → 에러 처리 → 컴포넌트)
**목표**: 코드 중복 제거, 파일 크기 정상화, 일관된 패턴 적용

---

## 현재 문제 요약

| 문제 | 영향 영역 | 심각도 |
|------|----------|--------|
| 데이터 조회 로직 중복 | 3+ 파일 | P0 |
| 800줄+ 대형 파일 4개 | 유지보수 난도 | P0 |
| `as unknown as` 타입 캐스팅 | 런타임 안정성 | P0 |
| 에러 처리 전략 불일치 | 디버깅 난도 | P1 |
| 거대 컴포넌트 (812줄, 809줄) | UI 유지보수 | P2 |

---

## Phase 1: 공유 데이터 조회 함수 추출

### 목표
매칭/궁합 분석에서 반복되는 DB 조회 로직을 하나의 공유 모듈로 추출

### 신규 파일
- `src/lib/db/matching/fetch-analysis.ts` — 분석 데이터 일괄 조회 함수
- `src/lib/db/matching/types.ts` — 반환 타입 정의 (타입 캐스팅 제거)
- `src/lib/db/matching/index.ts` — 배럴 export

### 핵심 함수

```typescript
// 단일 대상의 모든 분석 결과 조회
fetchSubjectAnalyses(subjectId: string, subjectType: SubjectType)
  → { mbti, saju, name, zodiac, vark }

// 선생님-학생 쌍의 분석 데이터 일괄 조회
fetchPairAnalyses(teacherId: string, studentId: string)
  → { teacher: SubjectAnalyses, student: SubjectAnalyses }

// 선생님 목록 + 분석 데이터 일괄 조회 (배치용)
fetchTeachersWithAnalyses(classId: string)
  → Map<string, { teacher: Teacher, analyses: SubjectAnalyses }>
```

### 수정 파일
- `src/lib/actions/admin/llm-compatibility.ts` — 공유 함수 사용으로 전환
- `src/lib/actions/matching/compatibility.ts` — 공유 함수 사용으로 전환
- `src/lib/actions/matching/assignment.ts` — 공유 함수 사용으로 전환
- `src/lib/analysis/name-compatibility.ts` — 타입 가드 함수 강화

### 예상 효과
- 중복 코드 ~120줄 제거
- 타입 안전성 향상 (캐스팅 제거)
- DB 조회 로직 변경 시 수정 포인트 1곳

---

## Phase 2: 대형 Server Action 분해

### 대상 1: reservations.ts (836줄)

분할 구조:
```
src/lib/actions/counseling/
├── reservations.ts              → 재export (하위 호환)
├── reservation-queries.ts       — 조회 로직 (findMany, 필터링, 통계)
├── reservation-mutations.ts     — 생성/수정/삭제/상태 변경
└── reservation-validation.ts    — 시간 충돌 검사, 비즈니스 규칙
```

### 대상 2: universal-router.ts (710줄)

분할 구조:
```
src/lib/ai/
├── universal-router.ts          → 핵심 라우팅만 남김
├── router-fallback.ts           — 폴백/재시도 전략
└── router-config.ts             — 모델 매핑, 설정 상수
```

### 대상 3: provider-registry.ts (721줄)

분할 구조:
```
src/lib/ai/
├── provider-registry.ts         → 등록/조회만 남김
├── registry-sync.ts             — DB 동기화 로직
└── registry-validation.ts       — 제공자/모델 검증
```

### 예상 효과
- 최대 파일 크기 300줄 이하로 정상화
- 각 파일이 단일 책임 원칙(SRP) 준수

---

## Phase 3: 에러 처리 통일

### 신규 파일
- `src/lib/errors/app-error.ts` — 커스텀 에러 클래스 계층
- `src/lib/errors/action-result.ts` — Server Action 표준 반환 타입

### 에러 클래스 계층

```typescript
AppError (base)
├── NotFoundError        — 리소스 없음
├── ValidationError      — 입력 검증 실패
├── AuthorizationError   — 권한 부족
├── ExternalServiceError — LLM/외부 API 오류
└── DatabaseError        — DB 작업 실패
```

### Server Action 표준 반환 타입

```typescript
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string }
```

### 적용 범위
- 모든 Server Actions에서 try-catch + ActionResult 사용
- console.error → 중앙 로깅 함수로 대체
- 기존 throw 패턴은 ActionResult로 전환

---

## Phase 4: 거대 컴포넌트 개선

### 대상 1: provider-form.tsx (812줄)

```
src/components/admin/llm-providers/
├── provider-form.tsx            → 메인 폼 (조합만)
├── hooks/
│   ├── use-provider-form.ts     — 폼 상태 & 제출 로직
│   └── use-model-sync.ts       — 모델 동기화 로직
└── sections/
    ├── auth-section.tsx         — 인증 설정 섹션
    ├── model-section.tsx        — 모델 목록 섹션
    └── test-section.tsx         — 연결 테스트 섹션
```

### 대상 2: llm-recommender.tsx (809줄)

```
src/components/help/
├── llm-recommender.tsx          → 메인 레이아웃 (조합만)
├── hooks/
│   ├── use-recommendation.ts    — 추천 로직
│   └── use-filter-state.ts     — 필터 상태 관리
└── sections/
    ├── filter-panel.tsx         — 필터 패널
    ├── result-list.tsx          — 추천 결과 목록
    └── comparison-view.tsx      — 비교 뷰
```

### 예상 효과
- 컴포넌트당 200줄 이하로 정상화
- 로직과 UI 분리로 테스트 용이성 향상

---

## 실행 순서 및 의존성

```
Phase 1 (데이터 조회) ← 현재 수정 중인 파일과 연결
    ↓
Phase 2 (Server Action 분해) ← Phase 1의 공유 함수 사용
    ↓
Phase 3 (에러 처리) ← Phase 2 완료 후 적용이 자연스러움
    ↓
Phase 4 (컴포넌트) ← 독립적이지만 마지막이 안전
```

각 Phase 완료 시 커밋 + 테스트 통과 확인 후 다음 Phase 진행

---

## 성공 기준

- [ ] 800줄 이상 파일 0개
- [ ] 데이터 조회 중복 0건
- [ ] `as unknown as` 캐스팅 매칭 영역에서 제거
- [ ] 모든 Server Actions에서 일관된 에러 처리
- [ ] 기존 34/34 단위 테스트 통과 유지
- [ ] E2E 동작 변화 없음
