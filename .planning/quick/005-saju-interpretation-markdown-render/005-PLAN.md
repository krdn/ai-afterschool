---
phase: quick
plan: 005
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/students/saju-history-panel.tsx
autonomous: true

must_haves:
  truths:
    - "사주 분석 이력 패널에서 해석 결과가 마크다운 형식으로 렌더링되어 표시됨"
    - "# 사주 분석, ## 1. 일주 분석 등의 마크다운 문법이 HTML로 변환되어 보임"
  artifacts:
    - path: "src/components/students/saju-history-panel.tsx"
      provides: "MarkdownRenderer를 사용한 해석 결과 렌더링"
      contains: "import { MarkdownRenderer }"
  key_links:
    - from: "saju-history-panel.tsx"
      to: "MarkdownRenderer"
      via: "component import and usage"
---

<objective>
사주 분석 이력 패널(saju-history-panel.tsx)에서 해석 결과가 raw markdown 형태로 보이는 문제를 수정하여 MarkdownRenderer를 적용한다.

**Purpose:** 사용자가 사주 분석 이력을 확인할 때 마크다운 문법(#, ##, ** 등)이 렌더링된 HTML 형태로 보이도록 개선
**Output:** 수정된 saju-history-panel.tsx 컴포넌트
</objective>

<execution_context>
@~/.config/opencode/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@src/components/students/saju-history-panel.tsx

## 문제 상황
- 사주 분석 이력 패널에서 "해석 결과" 영역의 텍스트가 마크다운 문법 그대로 표시됨
- 예: "# 사주 분석 및 학생에게 도움이 되는 해석", "## 1. 일주 분석" 등이 그대로 보임
- saju-analysis-panel.tsx는 이미 MarkdownRenderer를 사용하고 있음 (정상 작동)
- saju-history-panel.tsx는 raw text로만 표시하고 있음 (문제 발생)

## 참고: 이미 적용된 패턴
- prompt-preview-dialog.tsx: `<MarkdownRenderer content={previewText} />` 사용
- saju-analysis-panel.tsx: `<MarkdownRenderer content={analysis.interpretation} />` 사용
- analysis-history-detail-dialog.tsx: `<MarkdownRenderer content={item.interpretation} />` 사용
</context>

<tasks>

<task type="auto">
  <name>사주 이력 패널에 MarkdownRenderer 적용</name>
  <files>src/components/students/saju-history-panel.tsx</files>
  <action>
    1. 파일 상단에 MarkdownRenderer import 추가:
       `import { MarkdownRenderer } from "@/components/ui/markdown-renderer"`
    
    2. 해석 결과 표시 부분(약 line 155-158)을 수정:
       - 기존: `<div className="text-xs leading-5 text-gray-700 whitespace-pre-wrap max-h-[300px] overflow-y-auto">{item.interpretation}</div>`
       - 변경: `<div className="max-h-[300px] overflow-y-auto"><MarkdownRenderer content={item.interpretation} /></div>`
    
    3. 스타일 일관성 유지:
       - max-h-[300px]와 overflow-y-auto는 유지하여 스크롤 가능하도록 함
       - MarkdownRenderer가 자체 스타일을 가지므로 text-xs 등의 텍스트 스타일은 제거
  </action>
  <verify>
    grep -n "MarkdownRenderer" src/components/students/saju-history-panel.tsx
    # 결과: import 문과 사용처가 모두 포함되어야 함
  </verify>
  <done>
    - MarkdownRenderer import 추가됨
    - 해석 결과 영역이 MarkdownRenderer로 감싸져 있음
    - 마크다운 문법이 HTML로 렌더링되어 표시됨
  </done>
</task>

</tasks>

<verification>
- [ ] `grep -n "MarkdownRenderer" src/components/students/saju-history-panel.tsx`로 import 확인
- [ ] 수정된 코드에서 interpretation이 MarkdownRenderer의 content prop으로 전달됨
- [ ] npm run lint로 문법 오류 없음 확인
</verification>

<success_criteria>
- 사주 분석 이력 패널의 "해석 결과" 영역에서 마크다운 문법이 렌더링된 HTML로 표시됨
- # → h1, ## → h2, ** → bold 등 마크다운 문법이 올바르게 변환됨
</success_criteria>

<output>
After completion, create `.planning/quick/005-saju-interpretation-markdown-render/005-SUMMARY.md`
</output>
