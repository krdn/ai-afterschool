---
phase: quick-001
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/actions/student-analysis-tab.ts
  - src/components/students/tabs/analysis-tab.tsx
  - src/components/students/saju-analysis-panel.tsx
autonomous: true

must_haves:
  truths:
    - "사주 분석 실행 후 해석 섹션에 사용 모델(provider/model) 정보가 표시된다"
    - "페이지 리프레시 후에도 모델 정보가 유지된다"
    - "분석을 새로 실행하면 새 모델 정보로 갱신된다"
  artifacts:
    - path: "src/lib/actions/student-analysis-tab.ts"
      provides: "SajuAnalysisHistory에서 최신 항목의 usedProvider/usedModel 조회"
      contains: "sajuAnalysisHistory"
    - path: "src/components/students/saju-analysis-panel.tsx"
      provides: "props로 받은 모델 정보를 providerLabel 초기값으로 설정"
      contains: "lastUsedProvider"
    - path: "src/components/students/tabs/analysis-tab.tsx"
      provides: "모델 정보를 SajuAnalysisPanel에 props로 전달"
      contains: "lastUsedProvider"
  key_links:
    - from: "src/lib/actions/student-analysis-tab.ts"
      to: "prisma.sajuAnalysisHistory"
      via: "findFirst with orderBy createdAt desc"
      pattern: "sajuAnalysisHistory\\.findFirst"
    - from: "src/components/students/tabs/analysis-tab.tsx"
      to: "src/components/students/saju-analysis-panel.tsx"
      via: "lastUsedProvider/lastUsedModel props"
      pattern: "lastUsedProvider"
---

<objective>
사주 해석 결과의 사용 모델 정보(provider/model)를 DB에서 조회하여 페이지 리프레시 후에도 영구 표시되도록 수정한다.

Purpose: 현재 useState로만 관리되는 모델 정보가 리프레시 시 사라지는 문제를 해결
Output: 리프레시 후에도 "해석" 섹션에 모델 뱃지가 유지됨
</objective>

<execution_context>
@/home/gon/.claude/get-shit-done/workflows/execute-plan.md
@/home/gon/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@prisma/schema.prisma (SajuAnalysis: line 103, SajuAnalysisHistory: line 117)
@src/lib/actions/student-analysis-tab.ts (getStudentAnalysisData 함수)
@src/components/students/tabs/analysis-tab.tsx (중간 컨테이너, props 전달)
@src/components/students/saju-analysis-panel.tsx (UI, providerLabel/promptLabel 상태 관리)
</context>

<tasks>

<task type="auto">
  <name>Task 1: 서버 액션에서 최신 SajuAnalysisHistory의 모델 정보 조회</name>
  <files>src/lib/actions/student-analysis-tab.ts</files>
  <action>
`getStudentAnalysisData` 함수에서 SajuAnalysisHistory 테이블의 최신 항목을 조회하여 usedProvider/usedModel을 반환한다.

1. `StudentAnalysisData` 타입에 `lastUsedProvider: string | null`과 `lastUsedModel: string | null` 필드를 추가한다.

2. `getStudentAnalysisData` 함수 내 두 번째 `Promise.all` (faceAnalysis, palmAnalysis, mbtiAnalysis 조회하는 부분)에 최신 SajuAnalysisHistory 조회를 추가한다:
   ```ts
   db.sajuAnalysisHistory.findFirst({
     where: { studentId },
     orderBy: { createdAt: 'desc' },
     select: { usedProvider: true, usedModel: true }
   })
   ```

3. 반환 객체에 `lastUsedProvider`와 `lastUsedModel`을 추가한다. history가 null이면 둘 다 null로 반환한다.

4. catch 블록의 기본 반환값에도 `lastUsedProvider: null, lastUsedModel: null`을 추가한다.

5. student가 null일 때의 early return에도 동일하게 추가한다.
  </action>
  <verify>
`npx tsc --noEmit` 으로 타입 에러 없음 확인. IDE에서 StudentAnalysisData 타입에 lastUsedProvider/lastUsedModel 필드가 보이는지 확인.
  </verify>
  <done>
getStudentAnalysisData 호출 시 최신 SajuAnalysisHistory의 usedProvider/usedModel이 함께 반환된다.
  </done>
</task>

<task type="auto">
  <name>Task 2: analysis-tab에서 모델 정보 전달 및 saju-analysis-panel에서 초기값 적용</name>
  <files>src/components/students/tabs/analysis-tab.tsx, src/components/students/saju-analysis-panel.tsx</files>
  <action>
**analysis-tab.tsx 수정:**

1. `data` 상태의 타입에 `lastUsedProvider: string | null`과 `lastUsedModel: string | null`을 추가한다.
2. 초기값에 `lastUsedProvider: null, lastUsedModel: null`을 추가한다.
3. `SajuAnalysisPanel` 컴포넌트에 `lastUsedProvider={data.lastUsedProvider}`, `lastUsedModel={data.lastUsedModel}` props를 전달한다.

**saju-analysis-panel.tsx 수정:**

1. `SajuAnalysisPanelProps` 타입에 `lastUsedProvider?: string | null`과 `lastUsedModel?: string | null`을 추가한다.

2. 컴포넌트의 props 디스트럭처링에 `lastUsedProvider`, `lastUsedModel`을 추가한다.

3. `providerLabel` useState의 초기값을 다음 로직으로 설정한다:
   - `lastUsedProvider`가 존재하면(값이 있으면):
     - `lastUsedModel`이 존재하고 'default'가 아니면: `${lastUsedProvider} (${lastUsedModel})`
     - 그 외: `lastUsedProvider` 그대로
   - 없으면 `null`

   구현 예시:
   ```ts
   const [providerLabel, setProviderLabel] = useState<string | null>(() => {
     if (!lastUsedProvider) return null
     const model = lastUsedModel && lastUsedModel !== 'default' ? ` (${lastUsedModel})` : ''
     return `${lastUsedProvider}${model}`
   })
   ```

4. `handleRunAnalysis`에서 `setProviderLabel(null)` 호출은 그대로 유지 (분석 실행 시 기존 뱃지 초기화 후, 결과 도착 시 새 값으로 설정하는 현재 로직 유지).

주의: `promptLabel`은 이번 스코프에서 다루지 않는다. SajuAnalysisHistory에 promptId는 있지만 프롬프트 이름을 resolve하려면 추가 로직이 필요하므로, 모델 정보만 우선 처리한다.
  </action>
  <verify>
1. `npx tsc --noEmit` 타입 에러 없음
2. `npm run build` 빌드 성공
3. 브라우저에서 사주 분석이 있는 학생 페이지 접속 -> 해석 섹션에 모델 뱃지 표시 확인
4. 페이지 리프레시(F5) -> 모델 뱃지가 여전히 표시되는지 확인
5. 사주 분석 재실행 -> 새 모델 정보로 뱃지 갱신 확인
  </verify>
  <done>
- 페이지 로드 시 DB에서 조회한 모델 정보가 해석 섹션의 뱃지로 표시된다
- 리프레시 후에도 뱃지가 유지된다
- 새로 분석을 실행하면 뱃지가 새 모델 정보로 갱신된다
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` - 타입 체크 통과
2. `npm run build` - 빌드 성공
3. 사주 분석이 있는 학생 페이지에서:
   - 페이지 로드 시 해석 섹션에 모델 뱃지(예: "openai (gpt-4o)") 표시
   - F5 리프레시 후에도 동일 뱃지 유지
   - 사주 분석 재실행 시 뱃지가 새 결과로 갱신
4. 사주 분석이 없는 학생 페이지에서 뱃지 미표시 (오류 없음)
</verification>

<success_criteria>
- 사주 해석이 있는 학생 페이지에서 리프레시 후에도 모델 정보 뱃지가 영구 표시된다
- DB 마이그레이션 없이 기존 SajuAnalysisHistory 테이블 활용
- 기존 분석 실행 흐름에 영향 없음
</success_criteria>

<output>
After completion, create `.planning/quick/001-saju-model-display/001-SUMMARY.md`
</output>
