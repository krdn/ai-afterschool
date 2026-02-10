---
phase: quick-002
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/actions/calculation-analysis.ts
  - src/app/(dashboard)/students/[id]/saju/actions.ts
  - src/components/students/saju-analysis-panel.tsx
autonomous: true

must_haves:
  truths:
    - "해석 결과가 있을 때 '쉽게 풀이' 버튼이 표시된다"
    - "버튼 클릭 시 AI가 전문 해석을 쉬운 문장으로 변환한다"
    - "전문 해석과 쉽게 풀이를 토글로 전환할 수 있다"
    - "생성 중 로딩 스피너가 표시된다"
    - "같은 세션 내에서는 재호출 없이 캐시된 결과를 보여준다"
    - "현재 선택된 provider/model을 사용한다"
  artifacts:
    - path: "src/lib/actions/calculation-analysis.ts"
      provides: "simplifyInterpretation 서버 액션"
      contains: "simplifyInterpretation"
    - path: "src/app/(dashboard)/students/[id]/saju/actions.ts"
      provides: "simplifyInterpretationAction 클라이언트 래퍼"
      contains: "simplifyInterpretationAction"
    - path: "src/components/students/saju-analysis-panel.tsx"
      provides: "쉽게 풀이 토글 UI"
      contains: "simplifiedText"
  key_links:
    - from: "src/components/students/saju-analysis-panel.tsx"
      to: "src/app/(dashboard)/students/[id]/saju/actions.ts"
      via: "simplifyInterpretationAction 호출"
      pattern: "simplifyInterpretationAction"
    - from: "src/app/(dashboard)/students/[id]/saju/actions.ts"
      to: "src/lib/actions/calculation-analysis.ts"
      via: "simplifyInterpretation import"
      pattern: "simplifyInterpretation"
    - from: "src/lib/actions/calculation-analysis.ts"
      to: "src/lib/ai/router.ts"
      via: "generateWithProvider/generateWithSpecificProvider"
      pattern: "generateWith(Provider|SpecificProvider)"
---

<objective>
사주 해석 결과에 "쉽게 풀이" 기능을 추가하여, AI가 전문 사주 용어를 초등학생~중학생도 이해할 수 있는 쉬운 문장으로 변환해주는 토글 기능을 구현한다.

Purpose: 사주 해석의 전문 용어가 학부모/학생에게 어렵기 때문에, 한 번의 클릭으로 일상 언어로 풀어주는 기능이 필요하다.
Output: 서버 액션 1개 추가, UI 토글 버튼 추가, DB 변경 없음
</objective>

<execution_context>
@/home/gon/.claude/get-shit-done/workflows/execute-plan.md
@/home/gon/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/lib/actions/calculation-analysis.ts
@src/app/(dashboard)/students/[id]/saju/actions.ts
@src/components/students/saju-analysis-panel.tsx
@src/lib/ai/router.ts
@src/lib/ai/providers/types.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: simplifyInterpretation 서버 액션 추가</name>
  <files>
    src/lib/actions/calculation-analysis.ts
    src/app/(dashboard)/students/[id]/saju/actions.ts
  </files>
  <action>
1. `src/lib/actions/calculation-analysis.ts`에 `simplifyInterpretation` 함수 추가:

```typescript
export async function simplifyInterpretation(
  interpretation: string,
  provider: string
): Promise<{ text: string; usedProvider: string; usedModel?: string }> {
  const session = await verifySession()

  const SIMPLIFY_PROMPT = `아래 사주 해석을 초등학생~중학생도 이해할 수 있도록 쉽게 풀어주세요.

규칙:
- 사주 전문 용어(예: 오행, 천간, 지지, 상관, 편인 등) 대신 일상 언어를 사용하세요
- 핵심 메시지 위주로 간결하게 정리하세요
- 학생에게 도움이 되는 조언은 구체적이고 실천 가능하게 표현하세요
- 마크다운 형식을 유지하되, 쉬운 표현으로 바꿔주세요
- "~해요", "~이에요" 체를 사용하세요

---
${interpretation}`

  let llmResult
  if (provider === 'auto') {
    llmResult = await generateWithProvider({
      featureType: 'saju_analysis',
      prompt: SIMPLIFY_PROMPT,
      teacherId: session.userId,
      maxOutputTokens: 2048,
    })
  } else {
    llmResult = await generateWithSpecificProvider(provider as ProviderName, {
      featureType: 'saju_analysis',
      prompt: SIMPLIFY_PROMPT,
      teacherId: session.userId,
      maxOutputTokens: 2048,
    })
  }

  return {
    text: llmResult.text,
    usedProvider: llmResult.provider,
    usedModel: llmResult.model,
  }
}
```

- `verifySession()`으로 인증 확인 (기존 패턴 동일)
- 기존 `runSajuAnalysis`와 동일한 provider 분기 패턴 사용 (`auto` vs 특정 provider)
- `humanizeLLMError` 재사용을 위해 에러 처리는 클라이언트에서 try/catch로 처리
- featureType은 `saju_analysis` 재사용 (별도 타입 불필요)

2. `src/app/(dashboard)/students/[id]/saju/actions.ts`에 클라이언트 래퍼 추가:

```typescript
import { runSajuAnalysis, simplifyInterpretation } from "@/lib/actions/calculation-analysis"

export async function simplifyInterpretationAction(
  interpretation: string,
  provider: string
) {
  return simplifyInterpretation(interpretation, provider)
}
```

기존 import에 `simplifyInterpretation` 추가하고, 래퍼 함수를 export한다.
  </action>
  <verify>
`npx tsc --noEmit` 타입 에러 없이 통과. `simplifyInterpretation`과 `simplifyInterpretationAction`이 정상적으로 export되는지 확인.
  </verify>
  <done>
서버 액션이 interpretation 텍스트와 provider를 받아 AI로 쉬운 풀이를 생성하여 반환한다.
  </done>
</task>

<task type="auto">
  <name>Task 2: 사주 해석 패널에 "쉽게 풀이" 토글 UI 추가</name>
  <files>
    src/components/students/saju-analysis-panel.tsx
  </files>
  <action>
`saju-analysis-panel.tsx`의 해석 섹션(3. 해석)에 "쉽게 풀이" 토글 기능을 추가한다.

1. **State 추가** (기존 state 선언부 근처):

```typescript
const [simplifiedText, setSimplifiedText] = useState<string | null>(null)
const [isSimplifying, setIsSimplifying] = useState(false)
const [showSimplified, setShowSimplified] = useState(false)
const [simplifyError, setSimplifyError] = useState<string | null>(null)
```

2. **Import 추가**:
- `simplifyInterpretationAction`을 기존 actions import에 추가
- `Sparkles` 아이콘을 lucide-react에서 추가 import

3. **핸들러 함수 추가** (handleRunAnalysis 근처):

```typescript
const handleSimplify = async () => {
  if (!analysis?.interpretation) return

  // 캐시가 있으면 바로 토글
  if (simplifiedText) {
    setShowSimplified(!showSimplified)
    return
  }

  // AI로 생성
  setIsSimplifying(true)
  setSimplifyError(null)
  try {
    const res = await simplifyInterpretationAction(
      analysis.interpretation,
      selectedProvider === 'built-in' ? 'auto' : selectedProvider
    )
    setSimplifiedText(res.text)
    setShowSimplified(true)
  } catch (error) {
    console.error('Failed to simplify interpretation:', error)
    setSimplifyError('쉽게 풀이 생성에 실패했습니다. 다시 시도해주세요.')
  } finally {
    setIsSimplifying(false)
  }
}
```

주의: provider가 `built-in`이면 `auto`로 대체한다 (내장 알고리즘은 텍스트 변환 불가).

4. **캐시 초기화**: `handleRunAnalysis`의 `startTransition` 콜백 맨 앞에 캐시 리셋 추가:

```typescript
setSimplifiedText(null)
setShowSimplified(false)
setSimplifyError(null)
```

새로운 분석 실행 시 이전 쉽게 풀이 캐시를 초기화한다.

5. **UI 수정** - "3. 해석" 섹션 헤더 영역:

기존 `<h3>` 옆 providerLabel/promptLabel 뱃지들 다음, 미리보기/원문 토글 버튼 앞에 "쉽게 풀이" 버튼을 추가한다.

```tsx
{analysis?.interpretation && selectedProvider !== 'built-in' && (
  <button
    type="button"
    disabled={isSimplifying}
    onClick={handleSimplify}
    className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full border transition-colors ${
      showSimplified
        ? 'bg-amber-100 text-amber-700 border-amber-300'
        : 'bg-white text-gray-500 border-gray-200 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200'
    }`}
  >
    {isSimplifying ? (
      <Loader2 className="h-3 w-3 animate-spin" />
    ) : (
      <Sparkles className="h-3 w-3" />
    )}
    쉽게 풀이
  </button>
)}
```

조건: `analysis?.interpretation`이 있고, `selectedProvider !== 'built-in'`일 때만 표시 (내장 알고리즘 결과는 이미 간단하므로 불필요. 또한 built-in 선택 상태에서는 LLM을 호출할 provider가 모호하므로 숨김).

6. **해석 내용 영역 수정** - 기존 interpretation 렌더링 부분:

기존:
```tsx
{analysis?.interpretation ? (
  viewMode === "rendered" ? (
    <div className="rounded-md border ...">
      <MarkdownRenderer content={analysis.interpretation} />
    </div>
  ) : (
    <div className="rounded-md border ...">
      {analysis.interpretation}
    </div>
  )
) : ( ... )}
```

변경: `analysis.interpretation` 대신 표시할 content를 결정하는 변수 사용:

```tsx
const displayContent = showSimplified && simplifiedText ? simplifiedText : analysis?.interpretation
```

이 변수를 `viewMode` 분기의 `<MarkdownRenderer content={...} />`와 원문 표시에 모두 적용한다. 즉 `analysis.interpretation`을 `displayContent`로 교체.

7. **에러 메시지** - 해석 영역 바로 아래에 simplifyError 표시:

```tsx
{simplifyError && (
  <p className="text-xs text-red-500 mt-1">{simplifyError}</p>
)}
```

8. **"쉽게 풀이 중" 배지** (선택): showSimplified가 true일 때 해석 영역 상단에 작은 인디케이터 표시:

```tsx
{showSimplified && simplifiedText && (
  <div className="flex items-center gap-1 mb-2">
    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
      <Sparkles className="inline h-3 w-3 mr-0.5" />
      쉽게 풀이 보기 중
    </span>
  </div>
)}
```

이 배지는 해석 content 표시 영역(`viewMode` 분기) 바로 위에 배치한다.
  </action>
  <verify>
1. `npx tsc --noEmit` 타입 에러 없이 통과
2. `npm run build` 성공 확인
3. 수동 테스트: 학생 상세 > 사주 탭에서 LLM provider 선택 후 분석 실행 > "쉽게 풀이" 버튼 클릭 > 쉬운 문장으로 변환된 결과 확인 > 다시 클릭 시 전문 해석으로 복원
  </verify>
  <done>
- 해석 결과가 있을 때 "쉽게 풀이" 토글 버튼이 해석 헤더에 표시된다
- 클릭 시 로딩 스피너 표시 후 AI가 쉬운 문장으로 변환한 결과를 같은 영역에 보여준다
- 다시 클릭 시 전문 해석으로 전환 (캐시된 결과 사용, 재호출 없음)
- 새 분석 실행 시 캐시가 초기화된다
- built-in provider 선택 시 버튼이 숨겨진다
- 에러 발생 시 에러 메시지가 표시된다
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` - 타입 에러 없음
2. `npm run build` - 빌드 성공
3. UI 확인: LLM provider로 분석 실행 후 "쉽게 풀이" 버튼 동작 확인
4. 토글 동작: 전문 해석 <-> 쉽게 풀이 전환이 자연스럽게 동작
5. 캐시: 같은 세션에서 재클릭 시 API 재호출 없이 즉시 전환
6. 에러 처리: LLM 실패 시 에러 메시지 표시
</verification>

<success_criteria>
- 사주 해석 결과 영역에 "쉽게 풀이" 토글 버튼이 표시된다
- 버튼 클릭 시 AI가 전문 용어를 쉬운 일상 언어로 변환한다
- 전문 해석과 쉽게 풀이를 토글로 전환할 수 있다
- 로딩 중 스피너가 표시된다
- 같은 세션 내에서 캐시가 동작한다
- 빌드 및 타입 체크가 통과한다
</success_criteria>

<output>
After completion, create `.planning/quick/002-saju-easy-explanation/002-SUMMARY.md`
</output>
