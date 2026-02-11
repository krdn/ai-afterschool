---
phase: quick-006
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/ui/markdown-renderer.tsx
  - src/components/students/saju-analysis-panel.tsx
autonomous: true

must_haves:
  truths:
    - "사주 해석 미리보기에서 마크다운이 올바르게 렌더링됨"
    - "HTML 태그가 있는 경우에도 정상 표시됨"
    - "줄바꿈과 서식이 의도대로 표시됨"
  artifacts:
    - path: "src/components/ui/markdown-renderer.tsx"
      provides: "개선된 마크다운 렌더러"
      changes: "prose 클래스 추가, HTML 지원, 스타일 개선"
    - path: "src/components/students/saju-analysis-panel.tsx"
      provides: "개선된 해석 미리보기"
      changes: "MarkdownRenderer 사용 방식 개선"
  key_links:
    - from: "saju-analysis-panel.tsx"
      to: "MarkdownRenderer"
      pattern: "viewMode.*rendered"
---

<objective>
사주분석 3.해석 미리보기의 마크다운/HTML 렌더링 문제를 해결합니다.

Purpose: 사용자가 사주 해석 결과를 볼 때 마크다운 서식이 제대로 표시되어 가독성을 향상시킵니다.
Output: 개선된 MarkdownRenderer 컴포넌트 및 해석 미리보기 UI
</objective>

<execution_context>
@~/.config/opencode/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/STATE.md
@src/components/ui/markdown-renderer.tsx
@src/components/students/saju-analysis-panel.tsx
</context>

<tasks>

<task type="auto">
  <name>MarkdownRenderer 개선 - prose 스타일 및 HTML 지원 추가</name>
  <files>src/components/ui/markdown-renderer.tsx</files>
  <action>
    MarkdownRenderer 컴포넌트를 개선하여 다음 문제를 해결합니다:

    1. **prose 클래스 추가**: Tailwind Typography 스타일 적용
       - `prose prose-sm max-w-none` 클래스를 래퍼 div에 추가
       - 기존 스타일 클래스와 함께 사용

    2. **HTML 태그 지원**: 해석 내용에 HTML이 포함된 경우 렌더링
       - `rehype-raw` 플러그인 추가 (이미 설치되어 있음)
       - HTML 태그가 있으면 안전하게 렌더링

    3. **줄바꿈 처리 개선**: 
       - `\n`을 `<br />`로 변환하거나 remark-breaks 플러그인 사용
       - 문단 간격 일관성 유지

    4. **컴포넌트 스타일 미세 조정**:
       - h1, h2 태그의 margin 조정
       - 리스트 스타일 개선
       - 코드 블록 배경색 조정

    참고: 다른 패널들(name-analysis-panel, teacher-name-panel 등)은 이미 `prose prose-sm max-w-none`을 사용하고 있어 이를 참고합니다.
  </action>
  <verify>
    - TypeScript 컴파일 오류 없음: `npm run build` 또는 `npx tsc --noEmit`
    - 마크다운 렌더러에 prose 클래스 적용 확인
  </verify>
  <done>
    - MarkdownRenderer에 prose 스타일 적용됨
    - HTML 태그 지원 추가됨
    - 줄바꿈 처리 개선됨
  </done>
</task>

<task type="auto">
  <name>사주 해석 미리보기 컨테이너 스타일 개선</name>
  <files>src/components/students/saju-analysis-panel.tsx</files>
  <action>
    사주분석 패널의 해석 미리보기 영역 스타일을 개선합니다:

    1. **미리보기 컨테이너 클래스 확인**:
       - 현재: `className="rounded-md border border-gray-200 bg-white p-4"`
       - prose 스타일이 MarkdownRenderer 낶部에서 적용되므로 컨테이너는 유지

    2. **스크롤 처리 추가** (필요한 경우):
       - 해석 내용이 길 경우 스크롤 가능하도록
       - `max-h-[500px] overflow-y-auto` 클래스 추가 고려

    3. **쉽게 풀이 섹션 스타일 통일**:
       - simplifiedText도 동일한 MarkdownRenderer로 렌더링
       - 스타일 일관성 유지

    4. **빈 내용 처리**:
       - interpretation이 비어있거나 공백만 있는 경우 처리
       - `?.trim()` 체크 추가
  </action>
  <verify>
    - 렌더링된 해석 미리보기 UI 확인
    - 스타일 변경사항 적용 확인
  </verify>
  <done>
    - 해석 미리보기 컨테이너 스타일 개선됨
    - 긴 내용 스크롤 처리됨
    - 쉽게 풀이 섹션 스타일 통일됨
  </done>
</task>

<task type="auto">
  <name>빌드 및 린트 검증</name>
  <files></files>
  <action>
    변경사항이 정상적으로 작동하는지 검증합니다:

    1. **린트 검사**: `npm run lint`
    2. **타입 검사**: `npx tsc --noEmit`
    3. **빌드 검증**: `npm run build`

    오류가 있으면 수정합니다.
  </action>
  <verify>
    - `npm run lint` 통과
    - `npx tsc --noEmit` 통과
    - `npm run build` 성공
  </verify>
  <done>
    - 모든 검증 통과
    - 코드 품질 유지됨
  </done>
</task>

</tasks>

<verification>
- [ ] MarkdownRenderer에 prose 클래스 적용됨
- [ ] HTML 태그가 정상적으로 렌더링됨
- [ ] 마크다운 서식(제목, 리스트, 강조 등)이 올바르게 표시됨
- [ ] 사주 해석 미리보기에서 모든 서식이 의도대로 보임
- [ ] 린트 및 빌드 오류 없음
</verification>

<success_criteria>
- 사주분석 3.해석 미리보기에서 마크다운이 올바르게 렌더링됨
- HTML 태그가 있는 경우에도 정상 표시됨
- 줄바꿈과 서식이 의도대로 표시됨
- 다른 분석 패널(이름, 띠 등)과 렌더링 품질이 일치함
</success_criteria>

<output>
After completion, create `.planning/quick/006-saju-preview-format-fix/006-SUMMARY.md`
</output>
