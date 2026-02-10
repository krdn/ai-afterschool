---
phase: quick-003
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - prisma/schema.prisma
  - prisma/migrations/YYYYMMDD_rename_saju_to_analysis_prompt_preset/migration.sql
  - src/lib/db/analysis-prompt-preset.ts
  - src/lib/db/saju-prompt-preset.ts
  - src/lib/ai/face-prompts.ts
  - src/lib/ai/palm-prompts.ts
  - src/lib/ai/mbti-prompts.ts
  - src/app/(dashboard)/admin/analysis-prompts/actions.ts
  - src/app/(dashboard)/admin/saju-prompts/actions.ts
  - src/components/admin/tabs/analysis-prompts-tab.tsx
  - src/components/admin/tabs/saju-prompts-tab.tsx
  - src/components/admin/admin-tabs-wrapper.tsx
  - src/app/(dashboard)/admin/page.tsx
  - src/components/students/face-analysis-panel.tsx
  - src/components/students/palm-analysis-panel.tsx
  - src/components/students/mbti-analysis-panel.tsx
  - src/components/students/face-help-dialog.tsx
  - src/components/students/palm-help-dialog.tsx
  - src/components/students/mbti-help-dialog.tsx
  - src/components/students/prompt-selector.tsx
autonomous: true
must_haves:
  truths:
    - "관리자가 관상/손금/MBTI 프롬프트를 추가/수정/삭제/활성화 토글 할 수 있다"
    - "관리자 'AI 프롬프트' 탭에서 사주/관상/손금/MBTI 서브탭을 전환할 수 있다"
    - "학생 분석 패널에서 관상/손금/MBTI 프롬프트를 선택할 수 있다"
    - "학생 분석 패널에서 관상/손금/MBTI 도움말을 볼 수 있다"
    - "기존 사주 프롬프트 시스템이 정상 동작한다 (회귀 없음)"
  artifacts:
    - path: "prisma/schema.prisma"
      provides: "AnalysisPromptPreset 모델 (analysisType 컬럼 포함)"
      contains: "model AnalysisPromptPreset"
    - path: "src/lib/db/analysis-prompt-preset.ts"
      provides: "analysisType별 CRUD 함수"
      exports: ["getActivePresetsByType", "getAllPresetsByType", "createPreset", "updatePreset", "deletePreset"]
    - path: "src/lib/ai/face-prompts.ts"
      provides: "관상 분석 내장 프롬프트 정의"
    - path: "src/lib/ai/palm-prompts.ts"
      provides: "손금 분석 내장 프롬프트 정의"
    - path: "src/lib/ai/mbti-prompts.ts"
      provides: "MBTI 분석 내장 프롬프트 정의"
    - path: "src/components/admin/tabs/analysis-prompts-tab.tsx"
      provides: "4개 분석 유형 서브탭이 있는 통합 프롬프트 관리 UI"
    - path: "src/components/students/face-help-dialog.tsx"
      provides: "관상 분석 도움말 다이얼로그"
    - path: "src/components/students/palm-help-dialog.tsx"
      provides: "손금 분석 도움말 다이얼로그"
    - path: "src/components/students/mbti-help-dialog.tsx"
      provides: "MBTI 분석 도움말 다이얼로그"
  key_links:
    - from: "src/components/admin/tabs/analysis-prompts-tab.tsx"
      to: "src/app/(dashboard)/admin/analysis-prompts/actions.ts"
      via: "서버 액션 호출"
      pattern: "createPresetAction|updatePresetAction|deletePresetAction"
    - from: "src/app/(dashboard)/admin/analysis-prompts/actions.ts"
      to: "src/lib/db/analysis-prompt-preset.ts"
      via: "DB CRUD 함수 호출"
      pattern: "getActivePresetsByType|getAllPresetsByType"
    - from: "src/components/students/face-analysis-panel.tsx"
      to: "src/components/students/prompt-selector.tsx"
      via: "프롬프트 선택 컴포넌트 임베드"
      pattern: "PromptSelector"
---

<objective>
관상/손금/MBTI 분석에 프롬프트 관리 시스템을 추가하고, 관리자 대시보드를 통합하며, 각 분석 패널에 프롬프트 선택기와 도움말 기능을 제공한다.

Purpose: 사주 분석에만 있던 프롬프트 관리/선택/도움말 기능을 관상/손금/MBTI에도 동일하게 제공하여 분석 관점을 다양화하고 관리자가 커스터마이징할 수 있게 한다.
Output: DB 마이그레이션 + 통합 프롬프트 CRUD + 관리자 서브탭 UI + 분석 패널 프롬프트 선택기/도움말
</objective>

<execution_context>
@/home/gon/.claude/get-shit-done/workflows/execute-plan.md
@/home/gon/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@prisma/schema.prisma
@src/lib/ai/saju-prompts.ts
@src/lib/db/saju-prompt-preset.ts
@src/app/(dashboard)/admin/saju-prompts/actions.ts
@src/components/admin/tabs/saju-prompts-tab.tsx
@src/components/admin/admin-tabs-wrapper.tsx
@src/app/(dashboard)/admin/page.tsx
@src/components/students/saju-analysis-panel.tsx
@src/components/students/prompt-selector.tsx
@src/components/students/saju-help-dialog.tsx
@src/components/students/face-analysis-panel.tsx
@src/components/students/palm-analysis-panel.tsx
@src/components/students/mbti-analysis-panel.tsx
@src/lib/ai/prompts.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: DB 마이그레이션 - SajuPromptPreset을 AnalysisPromptPreset으로 일반화</name>
  <files>
    prisma/schema.prisma
    prisma/migrations/ (새 마이그레이션)
    src/lib/db/analysis-prompt-preset.ts
    src/lib/db/saju-prompt-preset.ts
  </files>
  <action>
1. prisma/schema.prisma 수정:
   - `SajuPromptPreset` 모델을 `AnalysisPromptPreset`으로 리네임
   - `analysisType String @default("saju")` 컬럼 추가 (saju, face, palm, mbti 중 하나)
   - `@@map("analysis_prompt_presets")` 추가 (DB 테이블명)
   - `@@unique([promptKey, analysisType])` 복합 유니크 제약 추가 (같은 키도 분석 유형이 다르면 허용)
   - 기존 `promptKey @unique` 제약을 제거하고 위 복합 유니크로 대체
   - `@@index([analysisType, isActive])` 인덱스 추가

2. Prisma 마이그레이션 생성:
   - `npx prisma migrate dev --name rename_saju_to_analysis_prompt_preset`
   - 마이그레이션 SQL이 자동 생성되면 확인 후 적용
   - 기존 데이터의 analysisType은 자동으로 "saju" (default)

3. src/lib/db/analysis-prompt-preset.ts 생성:
   - 기존 saju-prompt-preset.ts 패턴을 그대로 따르되, analysisType 매개변수 추가
   - 타입 정의: `AnalysisType = "saju" | "face" | "palm" | "mbti"`
   - `AnalysisPromptPresetData` 타입 (기존 SajuPromptPresetData + analysisType)
   - `getActivePresetsByType(analysisType)` - 특정 유형의 활성 프리셋
   - `getAllPresetsByType(analysisType)` - 특정 유형의 전체 프리셋 (관리자용)
   - `getPresetByKey(promptKey, analysisType)` - 단일 조회
   - `createPreset(input)` - 생성 (input에 analysisType 필수)
   - `updatePreset(id, input)` - 수정
   - `deletePreset(id)` - 삭제 (내장은 비활성)
   - `seedBuiltInPresets(definitions, analysisType)` - 시드
   - Prisma 모델명은 `analysisPromptPreset`으로 접근

4. src/lib/db/saju-prompt-preset.ts 수정:
   - 기존 함수들을 analysis-prompt-preset.ts의 래퍼로 변환
   - `getActivePresets()` -> `getActivePresetsByType("saju")`
   - `getAllPresets()` -> `getAllPresetsByType("saju")`
   - 기존 타입 export는 유지하여 하위 호환 보장 (SajuPromptPresetData를 AnalysisPromptPresetData의 re-export로)
   - 기존 import 경로를 사용하는 코드가 깨지지 않도록 보장

주의: 마이그레이션 시 기존 SajuPromptPreset 테이블 이름이 "SajuPromptPreset"이므로, ALTER TABLE RENAME + ADD COLUMN 형태가 되어야 함. Prisma가 자동 생성하는 마이그레이션이 DROP+CREATE 방식이면 데이터 손실 우려. 마이그레이션 SQL을 반드시 확인하고, 필요시 수동 SQL로 작성할 것.
  </action>
  <verify>
- `npx prisma migrate status` 오류 없음
- `npx prisma generate` 성공
- `npx prisma db push --dry-run` 스키마 drift 없음
- TypeScript 컴파일: `npx tsc --noEmit --pretty` 기존 saju-prompt-preset.ts import 에러 없음
  </verify>
  <done>
- AnalysisPromptPreset 모델이 schema.prisma에 존재하며 analysisType 컬럼 포함
- 마이그레이션 적용 완료, 기존 사주 데이터 보존 (analysisType="saju")
- analysis-prompt-preset.ts가 analysisType별 CRUD 제공
- saju-prompt-preset.ts가 하위 호환 래퍼로 동작
  </done>
</task>

<task type="auto">
  <name>Task 2: 관상/손금/MBTI 내장 프롬프트 정의 파일 생성</name>
  <files>
    src/lib/ai/face-prompts.ts
    src/lib/ai/palm-prompts.ts
    src/lib/ai/mbti-prompts.ts
  </files>
  <action>
사주 프롬프트(saju-prompts.ts) 패턴을 따라 3개 분석 유형의 내장 프롬프트 정의 파일을 생성한다.

**공통 구조** (각 파일 동일한 패턴):
- 타입: `FacePromptId` / `PalmPromptId` / `MbtiPromptId` (리터럴 유니온)
- 타입: `FacePromptMeta` / `PalmPromptMeta` / `MbtiPromptMeta` (AnalysisPromptMeta와 동일 구조)
- `getPromptOptions()` - UI 드롭다운용 메타 목록
- `getBuiltInSeedData()` - DB seed용 데이터 배열 (analysisType 포함)

**1. src/lib/ai/face-prompts.ts:**
- default: "기본 관상 해석" - 기존 FACE_READING_PROMPT(src/lib/ai/prompts.ts)를 템플릿으로 변환. 플레이스홀더: `{학생정보}` (이름, 학년, 학교)
- "face-personality": "관상으로 보는 성격 심층 분석" - 이목구비별 성격 특성을 세밀하게 분석, 대인관계 스타일, 감정 표현 방식
- "face-academic": "관상 기반 학업 적성 분석" - 집중력, 사고력, 창의력 관점에서 학업 적성과 추천 학습법

**2. src/lib/ai/palm-prompts.ts:**
- default: "기본 손금 해석" - 기존 PALM_READING_PROMPT를 템플릿으로 변환. 플레이스홀더: `{학생정보}`, `{손종류}` (왼손/오른손)
- "palm-talent": "손금으로 보는 재능 발견" - 두뇌선/감정선 중심으로 타고난 재능과 잠재력 분석
- "palm-future": "손금으로 보는 미래 운세" - 운명선, 생명선 중심으로 학업/진로 방향성

**3. src/lib/ai/mbti-prompts.ts:**
- default: "기본 MBTI 해석" - MBTI 유형별 기본 성격, 강점/약점, 학업 스타일
- "mbti-learning": "MBTI별 학습 전략" - 유형별 최적 공부법, 시간 관리, 그룹스터디 적합도
- "mbti-career": "MBTI 기반 진로 탐색" - 유형별 적합 직업군, 대학 학과 추천, 활동 제안
- "mbti-relationship": "MBTI 대인관계 가이드" - 교사-학생 소통법, 또래 관계, 갈등 해결

각 프롬프트의 `promptTemplate`은 실제 AI에 전달할 수 있는 수준의 상세한 한국어 프롬프트로 작성한다.
`{학생정보}` 플레이스홀더를 포함하되, 관상/손금은 이미지 기반이므로 사주데이터 대신 `{분석요청사항}` 플레이스홀더를 사용한다.
MBTI는 `{MBTI유형}`, `{MBTI비율}` 플레이스홀더를 사용한다.

각 파일은 200-400줄 범위. saju-prompts.ts (732줄)보다 간결하게 작성하되 프롬프트 품질은 유지.
  </action>
  <verify>
- `npx tsc --noEmit --pretty` 타입 에러 없음
- 각 파일에서 `getPromptOptions()` 호출 시 메타 배열 반환 확인 (import 테스트)
- 각 파일에서 `getBuiltInSeedData()` 호출 시 seed 배열 반환 확인
  </verify>
  <done>
- face-prompts.ts: 3개 내장 프롬프트 (default, face-personality, face-academic)
- palm-prompts.ts: 3개 내장 프롬프트 (default, palm-talent, palm-future)
- mbti-prompts.ts: 4개 내장 프롬프트 (default, mbti-learning, mbti-career, mbti-relationship)
- 각 파일에서 getPromptOptions(), getBuiltInSeedData() export
  </done>
</task>

<task type="auto">
  <name>Task 3: 관리자 대시보드 - "AI 프롬프트" 통합 탭으로 변경</name>
  <files>
    src/components/admin/tabs/analysis-prompts-tab.tsx
    src/components/admin/admin-tabs-wrapper.tsx
    src/app/(dashboard)/admin/analysis-prompts/actions.ts
    src/app/(dashboard)/admin/page.tsx
    src/app/(dashboard)/admin/saju-prompts/actions.ts
  </files>
  <action>
1. src/app/(dashboard)/admin/analysis-prompts/actions.ts 생성:
   - 기존 saju-prompts/actions.ts 패턴 그대로 따름
   - `requireAdmin()` 함수 동일
   - `getPresetsByTypeAction(analysisType: AnalysisType)` - 유형별 전체 조회
   - `createPresetAction(input: CreatePresetInput)` - 생성
   - `updatePresetAction(id: string, input: UpdatePresetInput)` - 수정
   - `deletePresetAction(id: string)` - 삭제
   - analysis-prompt-preset.ts의 함수를 호출

2. src/components/admin/tabs/analysis-prompts-tab.tsx 생성:
   - 상단에 4개 서브탭: 사주 | 관상 | 손금 | MBTI (Tabs 컴포넌트 사용)
   - 각 서브탭 선택 시 해당 analysisType의 프리셋 목록을 표시
   - 프리셋 목록/편집 UI는 기존 SajuPromptsTab 로직을 그대로 재활용
   - Props: `initialPresets: Record<AnalysisType, AnalysisPromptPresetData[]>`
   - 내부 상태: `activeType` (현재 서브탭), `presets` (타입별 프리셋), `editing`, `expandedId`
   - 프롬프트 템플릿 편집기의 플레이스홀더 안내를 analysisType에 따라 동적으로 변경:
     - saju: `{학생정보}`, `{사주데이터}`
     - face: `{학생정보}`, `{분석요청사항}`
     - palm: `{학생정보}`, `{손종류}`, `{분석요청사항}`
     - mbti: `{학생정보}`, `{MBTI유형}`, `{MBTI비율}`
   - 서버 액션은 analysis-prompts/actions.ts 사용
   - 서브탭별 색상 테마: 사주(amber), 관상(blue), 손금(purple), MBTI(green)

3. src/components/admin/admin-tabs-wrapper.tsx 수정:
   - "사주 프롬프트" 탭을 "AI 프롬프트"로 텍스트 변경
   - TabsTrigger value를 "saju-prompts" -> "ai-prompts"로 변경
   - testIdMap에 'ai-prompts': 'admin-ai-prompts-page' 추가 (기존 saju-prompts 키 제거)

4. src/app/(dashboard)/admin/page.tsx 수정:
   - import 변경: SajuPromptsTab -> AnalysisPromptsTab
   - import 추가: getBuiltInSeedData from face-prompts, palm-prompts, mbti-prompts
   - import 변경: analysis-prompt-preset.ts 사용
   - Promise.all에서 기존 sajuPromptPresets 로직을:
     - 4가지 유형의 seed를 모두 실행
     - 4가지 유형의 프리셋을 모두 조회
     - `{ saju: [...], face: [...], palm: [...], mbti: [...] }` 형태로 전달
   - AdminTabsContent value="ai-prompts"로 변경
   - `<AnalysisPromptsTab initialPresets={allPresets} />`

5. src/app/(dashboard)/admin/saju-prompts/actions.ts:
   - 기존 파일 유지 (하위 호환). 내부적으로 analysis-prompts/actions.ts로 위임하거나,
     saju-prompt-preset.ts 래퍼를 그대로 사용해도 됨.
     기존 SajuAnalysisPanel에서 이 actions를 직접 사용하지 않으므로 (분석 패널은 별도 actions 사용)
     단순히 유지만 하면 됨.
  </action>
  <verify>
- `npm run build` 성공 (빌드 에러 없음)
- 관리자 페이지 접근 시 "AI 프롬프트" 탭 표시 확인
- 서브탭 전환 시 각 분석 유형의 프리셋 목록 정상 로드
- 기존 사주 프롬프트 데이터가 사주 서브탭에 정상 표시
  </verify>
  <done>
- 관리자 대시보드에 "AI 프롬프트" 통합 탭 존재
- 사주/관상/손금/MBTI 서브탭 전환 가능
- 각 유형별 CRUD (추가/수정/삭제/활성화 토글) 동작
- 기존 사주 프롬프트 데이터 회귀 없음
  </done>
</task>

<task type="auto">
  <name>Task 4: 분석 패널에 프롬프트 선택기 + 도움말 추가</name>
  <files>
    src/components/students/face-analysis-panel.tsx
    src/components/students/palm-analysis-panel.tsx
    src/components/students/mbti-analysis-panel.tsx
    src/components/students/face-help-dialog.tsx
    src/components/students/palm-help-dialog.tsx
    src/components/students/mbti-help-dialog.tsx
    src/components/students/prompt-selector.tsx
  </files>
  <action>
1. 도움말 다이얼로그 생성 (3개 파일):
   - 기존 saju-help-dialog.tsx 패턴을 그대로 따름
   - 각 파일: `{Type}HelpDialog` 컴포넌트
   - Dialog + ScrollArea로 해당 유형의 프롬프트 목록과 설명 표시
   - `getPromptOptions()` 호출하여 프롬프트 메타 표시

   **face-help-dialog.tsx:**
   - 제목: "관상 분석 프롬프트 가이드"
   - 설명: "각 프롬프트의 관상 분석 관점과 활용 방법을 확인하세요"
   - 사용 팁: Vision 모델 필요, 선명한 정면 사진 권장, 분석 이력에서 비교 가능

   **palm-help-dialog.tsx:**
   - 제목: "손금 분석 프롬프트 가이드"
   - 설명: "각 프롬프트의 손금 분석 관점과 활용 방법을 확인하세요"
   - 사용 팁: Vision 모델 필요, 손바닥이 잘 보이는 사진 권장, 왼손/오른손 선택

   **mbti-help-dialog.tsx:**
   - 제목: "MBTI 분석 프롬프트 가이드"
   - 설명: "각 프롬프트의 MBTI 해석 관점과 활용 방법을 확인하세요"
   - 사용 팁: MBTI 유형이 먼저 입력/설문되어야 AI 해석 가능, 프롬프트로 다양한 관점 분석

2. src/components/students/prompt-selector.tsx 수정:
   - 현재 AnalysisPromptMeta 타입을 import하는데, 이 타입이 saju-prompts.ts에서 옴
   - 프롬프트 선택기가 이미 제네릭하게 작동함 (promptOptions prop으로 받음)
   - 타입만 약간 조정: AnalysisPromptMeta 대신 더 일반적인 `PromptMeta` 타입 사용하거나,
     기존 AnalysisPromptMeta를 그대로 사용 (이미 id, name, shortDescription 등 범용적)
   - 실제로 기존 PromptSelector는 이미 범용적이므로 변경 최소화.
     타입 import 경로만 필요시 조정.

3. src/components/students/face-analysis-panel.tsx 수정:
   - import 추가: PromptSelector, FaceHelpDialog
   - Props에 추가: `promptOptions?: AnalysisPromptMeta[]` (서버에서 전달)
   - state 추가: `selectedPromptId`, `additionalRequest`
   - Header 영역에 PromptSelector + FaceHelpDialog 추가 (ProviderSelector 옆)
   - 프롬프트 선택 시 selectedPromptId 상태 업데이트
   - handleAnalyze 호출 시 selectedPromptId와 additionalRequest를 전달
   - NOTE: 실제 프롬프트 적용은 서버 액션(analyzeFaceImage)에서 처리해야 하지만,
     이 Task에서는 UI만 추가. 서버 액션 수정은 향후 Task 또는 별도 작업.
     대신 프롬프트 선택 UI와 도움말은 완전히 동작하도록 구현.

4. src/components/students/palm-analysis-panel.tsx 수정:
   - face-analysis-panel과 동일한 패턴으로 PromptSelector + PalmHelpDialog 추가
   - Header 영역에 프롬프트 선택기 + 도움말 배치

5. src/components/students/mbti-analysis-panel.tsx 수정:
   - PromptSelector + MbtiHelpDialog 추가
   - MBTI는 "AI로 해석하기" 버튼 근처에 프롬프트 선택기 배치 (분석 결과가 있을 때)
   - 분석 결과 없을 때는 프롬프트 선택기 숨김

Header 레이아웃 패턴 (관상/손금):
```
[아이콘 + 제목] [도움말] ────────── [프롬프트선택기] [제공자선택기]
```

MBTI는 기존 레이아웃 유지하되 AI 해석 영역에 프롬프트 선택기 추가:
```
[AI 해석 섹션]
[프롬프트 선택기] [제공자 선택기] [AI로 해석하기 버튼]
[도움말 버튼]
```
  </action>
  <verify>
- `npm run build` 성공
- 타입 체크 통과: `npx tsc --noEmit --pretty`
- 학생 상세 > 관상/손금/MBTI 탭에서 프롬프트 선택기 및 도움말 버튼 표시 확인
- 도움말 버튼 클릭 시 다이얼로그 열림
- 프롬프트 드롭다운에서 옵션 목록 표시
  </verify>
  <done>
- 관상 패널: 프롬프트 선택기 + 도움말 + 추가 요청 입력란 표시
- 손금 패널: 프롬프트 선택기 + 도움말 + 추가 요청 입력란 표시
- MBTI 패널: AI 해석 영역에 프롬프트 선택기 + 도움말 표시
- 각 도움말에 해당 유형의 프롬프트 목록과 설명 표시
- 기존 사주 분석 패널 동작에 영향 없음
  </done>
</task>

<task type="auto">
  <name>Task 5: 학생 상세 페이지 데이터 연결 + 전체 빌드 검증</name>
  <files>
    src/app/(dashboard)/students/[id]/page.tsx (또는 분석 탭 로딩 위치)
  </files>
  <action>
1. 학생 상세 페이지에서 분석 탭 데이터 로딩 부분 확인:
   - 관상/손금/MBTI 패널에 promptOptions prop을 전달하기 위해,
     서버 컴포넌트에서 각 유형의 활성 프리셋을 조회하여 전달
   - `getActivePresetsByType("face")`, `getActivePresetsByType("palm")`, `getActivePresetsByType("mbti")` 호출
   - 각 패널 컴포넌트에 `promptOptions` prop으로 전달
   - 사주 패널의 기존 `getMergedPromptOptionsAction` 패턴 참고

2. 전체 빌드 검증:
   - `npm run build` 실행하여 전체 프로젝트 빌드 성공 확인
   - 기존 사주 분석 관련 페이지/컴포넌트 회귀 없음 확인
   - 관리자 페이지 빌드 성공 확인
   - TypeScript 타입 에러 없음 확인

3. 기존 saju-prompts/actions.ts 하위 호환 확인:
   - 사주 분석 패널이 여전히 정상 동작하는지 import 경로 추적하여 확인
   - saju-prompt-preset.ts 래퍼가 정상 동작하는지 확인
  </action>
  <verify>
- `npm run build` 성공 (0 에러)
- `npx tsc --noEmit --pretty` 성공
- `npm run lint` 주요 에러 없음 (경고는 허용)
  </verify>
  <done>
- 전체 프로젝트 빌드 성공
- 학생 상세 페이지에서 관상/손금/MBTI 패널에 프롬프트 옵션 전달
- 기존 사주 분석 시스템 회귀 없음
- 관리자 AI 프롬프트 탭 정상 렌더링
  </done>
</task>

</tasks>

<verification>
1. DB 마이그레이션: `npx prisma migrate status` 정상, AnalysisPromptPreset 모델 존재
2. 관리자 페이지: "AI 프롬프트" 탭에서 4개 서브탭 전환 가능, CRUD 동작
3. 분석 패널: 관상/손금/MBTI 각각 프롬프트 선택기 + 도움말 표시
4. 하위 호환: 사주 분석 패널 기존 동작 유지, saju-prompt-preset.ts 래퍼 동작
5. 빌드: `npm run build` 성공
</verification>

<success_criteria>
- AnalysisPromptPreset 모델에 analysisType 컬럼 존재하고 기존 사주 데이터 보존됨
- 관리자가 4가지 분석 유형의 프롬프트를 각각 관리할 수 있음
- 학생 분석 패널 3개에 프롬프트 선택기와 도움말이 추가됨
- 전체 빌드 성공, 기존 기능 회귀 없음
</success_criteria>

<output>
After completion, create `.planning/quick/003-face-palm-mbti/003-SUMMARY.md`
</output>
