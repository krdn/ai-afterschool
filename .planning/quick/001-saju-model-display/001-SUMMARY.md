---
phase: quick-001
plan: "01"
subsystem: analysis
tags:
  - saju-analysis
  - model-display
  - persistence
  - ui-enhancement
dependency_graph:
  requires:
    - SajuAnalysisHistory 테이블 (usedProvider, usedModel 컬럼)
    - getStudentAnalysisData 서버 액션
    - SajuAnalysisPanel 컴포넌트
  provides:
    - 리프레시 후에도 유지되는 사주 분석 모델 정보 표시
  affects:
    - src/lib/actions/student-analysis-tab.ts
    - src/components/students/tabs/analysis-tab.tsx
    - src/components/students/saju-analysis-panel.tsx
tech_stack:
  added: []
  patterns:
    - DB 기반 상태 초기화 (useState lazy initialization)
    - Props drilling을 통한 서버 데이터 전달
    - Nullish coalescing을 통한 안전한 기본값 처리
key_files:
  created: []
  modified:
    - src/lib/actions/student-analysis-tab.ts
    - src/components/students/tabs/analysis-tab.tsx
    - src/components/students/saju-analysis-panel.tsx
decisions:
  - promptLabel은 스코프 제외 (추가 로직 필요)
  - 모델 정보만 우선 처리 (provider + model)
  - useState lazy initialization으로 초기값 설정
metrics:
  duration: 3.7분
  tasks: 2
  files: 3
  commits: 2
  lines_added: 32
  lines_removed: 9
completed_date: 2026-02-10
---

# Quick Task 001-01: 사주 모델 정보 DB 기반 영구 표시

**한 줄 요약:** SajuAnalysisHistory에서 최신 usedProvider/usedModel을 조회하여 페이지 리프레시 후에도 해석 섹션의 모델 뱃지가 유지되도록 개선

## 배경

현재 사주 해석 결과의 모델 정보(provider/model)가 `useState`로만 관리되어 페이지 리프레시 시 사라지는 문제가 있었습니다. 이는 사용자가 어떤 모델로 분석했는지 확인할 수 없게 만들고, 분석 이력 추적에도 불편을 초래했습니다.

## 구현 내용

### Task 1: 서버 액션에서 최신 SajuAnalysisHistory 모델 정보 조회

**파일:** `src/lib/actions/student-analysis-tab.ts`

1. **StudentAnalysisData 타입 확장**
   - `lastUsedProvider: string | null` 필드 추가
   - `lastUsedModel: string | null` 필드 추가

2. **getStudentAnalysisData 함수 수정**
   ```ts
   const [faceAnalysis, palmAnalysis, mbtiAnalysis, sajuHistory] = await Promise.all([
     // ... 기존 쿼리들
     db.sajuAnalysisHistory.findFirst({
       where: { studentId },
       orderBy: { createdAt: 'desc' },
       select: { usedProvider: true, usedModel: true }
     })
   ])
   ```

3. **반환 객체에 필드 추가**
   - 정상 경로: `sajuHistory?.usedProvider ?? null`, `sajuHistory?.usedModel ?? null`
   - 에러 경로, early return 경로: 모두 `null`로 통일

**커밋:** `ca12904` - feat(quick-001): 서버 액션에서 최신 SajuAnalysisHistory 모델 정보 조회

### Task 2: 모델 정보를 props로 전달하고 초기값 적용

**파일:** `src/components/students/tabs/analysis-tab.tsx`, `src/components/students/saju-analysis-panel.tsx`

1. **analysis-tab.tsx 수정**
   - `data` 상태 타입에 `lastUsedProvider`, `lastUsedModel` 필드 추가
   - 초기값에 `null` 설정
   - `SajuAnalysisPanel`에 props로 전달:
     ```tsx
     lastUsedProvider={data.lastUsedProvider}
     lastUsedModel={data.lastUsedModel}
     ```

2. **saju-analysis-panel.tsx 수정**
   - `SajuAnalysisPanelProps` 타입에 optional 필드 추가
   - `providerLabel` useState를 lazy initialization으로 변경:
     ```ts
     const [providerLabel, setProviderLabel] = useState<string | null>(() => {
       if (!lastUsedProvider) return null
       const model = lastUsedModel && lastUsedModel !== 'default' ? ` (${lastUsedModel})` : ''
       return `${lastUsedProvider}${model}`
     })
     ```
   - 기존 분석 실행 로직(`handleRunAnalysis`)은 그대로 유지

**커밋:** `4db5319` - feat(quick-001): 모델 정보를 props로 전달하고 초기값 적용

## 검증 결과

### 타입 체크
```bash
npx tsc --noEmit
```
- ✅ 수정한 파일들에 타입 에러 없음

### 빌드
```bash
npm run build
```
- ✅ 빌드 성공

### 브라우저 검증 절차
1. http://localhost:3000 접속 → 로그인 (admin@afterschool.com)
2. 학생 목록에서 사주 분석이 있는 학생 선택
3. 분석 탭 → 사주 탭 선택
4. 해석 섹션에 모델 뱃지 표시 확인 (예: "openai (gpt-4o)")
5. F5 리프레시 → 뱃지 유지 확인 ✅
6. 사주 분석 재실행 → 새 모델로 뱃지 갱신 확인 ✅

## 기술적 결정

### 1. promptLabel은 스코프 제외
- **이유:** SajuAnalysisHistory에 `promptId`는 저장되지만, 프롬프트 이름을 resolve하려면 추가 쿼리 및 로직 필요
- **결정:** 모델 정보(provider/model)만 우선 처리하여 빠르게 가치 제공

### 2. useState lazy initialization 패턴
- **이유:** props로 받은 초기값을 컴포넌트 첫 렌더링 시에만 적용
- **장점:** 불필요한 재렌더링 방지, 명확한 초기화 로직 분리
- **패턴:**
  ```ts
  const [state, setState] = useState(() => {
    // initialization logic
    return computedInitialValue
  })
  ```

### 3. Nullish coalescing 활용
- `sajuHistory?.usedProvider ?? null` 패턴으로 undefined → null 통일
- TypeScript strict null check 환경에서 안전한 타입 처리

## 영향 분석

### 변경 범위
- ✅ 기존 기능에 영향 없음 (backward compatible)
- ✅ DB 마이그레이션 불필요 (기존 컬럼 활용)
- ✅ 분석 실행 흐름 변경 없음

### 사용자 경험 개선
- **Before:** 리프레시 시 모델 정보 사라짐 → 어떤 모델로 분석했는지 알 수 없음
- **After:** 리프레시 후에도 모델 뱃지 유지 → 분석 이력 명확히 추적 가능

### 성능
- 추가 쿼리 1개 (SajuAnalysisHistory.findFirst)
- 기존 쿼리들과 병렬 실행 (Promise.all)
- 성능 영향 미미 (select로 필요한 필드만 조회)

## 향후 개선 방향

1. **promptLabel 추가**
   - SajuAnalysisHistory에 `promptName` 컬럼 추가 또는
   - 프롬프트 메타데이터 조회 로직 추가

2. **분석 이력 상세 모달에도 모델 정보 표시**
   - 현재는 최신 분석에만 표시
   - 이력 목록에서 각 항목별 모델 정보 표시 가능

3. **모델 뱃지 클릭 시 상세 정보 표시**
   - 모델별 특성, 사용 토큰 수 등 추가 정보 제공

## Self-Check

### 파일 존재 확인
```bash
[ -f "src/lib/actions/student-analysis-tab.ts" ] && echo "FOUND"
[ -f "src/components/students/tabs/analysis-tab.tsx" ] && echo "FOUND"
[ -f "src/components/students/saju-analysis-panel.tsx" ] && echo "FOUND"
```
- ✅ FOUND: src/lib/actions/student-analysis-tab.ts
- ✅ FOUND: src/components/students/tabs/analysis-tab.tsx
- ✅ FOUND: src/components/students/saju-analysis-panel.tsx

### 커밋 존재 확인
```bash
git log --oneline --all | grep ca12904
git log --oneline --all | grep 4db5319
```
- ✅ FOUND: ca12904 feat(quick-001): 서버 액션에서 최신 SajuAnalysisHistory 모델 정보 조회
- ✅ FOUND: 4db5319 feat(quick-001): 모델 정보를 props로 전달하고 초기값 적용

### 빌드 성공 확인
```bash
npm run build
```
- ✅ PASSED: 빌드 성공 (출력 확인됨)

## Self-Check: PASSED

모든 검증 항목을 통과했습니다.

---

**완료 일시:** 2026-02-10 10:34 KST
**소요 시간:** 3.7분
**커밋:** 2개 (ca12904, 4db5319)
