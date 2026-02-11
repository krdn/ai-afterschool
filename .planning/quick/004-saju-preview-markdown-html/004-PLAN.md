---
phase: 004-saju-preview-markdown-html
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/students/prompt-preview-dialog.tsx
autonomous: true
must_haves:
  truths:
    - 프롬프트 미리보기 대화상자에서 markdown이 HTML 형식으로 렌더링됨
    - 기존 whitespace-pre-wrap 스타일의 raw markdown 표시가 제거됨
  artifacts:
    - path: src/components/students/prompt-preview-dialog.tsx
      provides: "MarkdownRenderer를 사용한 HTML 렌더링"
      contains: "MarkdownRenderer"
  key_links:
    - from: prompt-preview-dialog.tsx
      to: MarkdownRenderer
      via: "import 및 component 사용"
---

<objective>
사주분석 > 해석 미리보기 기능에서 markdown 문서를 HTML 형식으로 보기 좋게 렌더링하도록 수정

Purpose: 사용자가 프롬프트 미리보기를 볼 때 raw markdown 대신 포맷팅된 HTML을 볼 수 있도록 UX 개선
Output: MarkdownRenderer 컴포넌트를 사용하는 prompt-preview-dialog.tsx
</objective>

<execution_context>
@~/.config/opencode/get-shit-done/workflows/execute-plan.md
@~/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/components/students/prompt-preview-dialog.tsx
@src/components/ui/markdown-renderer.tsx
</context>

<tasks>

<task type="auto">
  <name>MarkdownRenderer 적용하여 미리보기 렌더링 개선</name>
  <files>src/components/students/prompt-preview-dialog.tsx</files>
  <action>
    prompt-preview-dialog.tsx의 프롬프트 원문 보기 섹션을 수정:
    
    1. MarkdownRenderer 컴포넌트 import 추가:
       ```typescript
       import { MarkdownRenderer } from "@/components/ui/markdown-renderer"
       ```
    
    2. 기존의 `<pre>` 태그 블록(98-100줄)을 MarkdownRenderer로 교체:
       - 기존:
         ```tsx
         <pre className="text-xs leading-5 text-gray-700 whitespace-pre-wrap break-words font-mono bg-gray-50 rounded-md p-3 border">
           {previewText}
         </pre>
         ```
       - 변경:
         ```tsx
         <div className="rounded-md border border-gray-200 bg-white">
           <MarkdownRenderer content={previewText} />
         </div>
         ```
    
    3. 불필요한 font-mono, whitespace-pre-wrap 등의 raw markdown 스타일 제거
    
    4. 로딩 상태와 빈 상태는 유지
  </action>
  <verify>
    npm run build
  </verify>
  <done>
    - MarkdownRenderer가 정상 import되고 사용됨
    - previewText가 HTML 형식으로 렌더링됨
    - 빌드 에러 없음
  </done>
</task>

</tasks>

<verification>
- [ ] prompt-preview-dialog.tsx에 MarkdownRenderer import 존재
- [ ] <pre> 태그가 MarkdownRenderer로 교첵됨
- [ ] npm run build 성공
</verification>

<success_criteria>
- 프롬프트 미리보기 대화상자에서 markdown 문서가 HTML 형식으로 보기 좋게 표시됨
- 기존 기능(정보 탭, 로딩 상태)이 정상 작동함
</success_criteria>

<output>
After completion, create `.planning/quick/004-saju-preview-markdown-html/004-01-SUMMARY.md`
</output>
