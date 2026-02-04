# Phase 22: AI Integration - Context

**Gathered:** 2026-02-05
**Status:** Ready for planning

<domain>
## Phase Boundary

상담 시 선생님이 활용할 수 있는 AI 기반 지원 기능 제공. 기존 성향 분석 정보 표시, 선생님-학생 궁합 점수 참조, AI 기반 상담 내용 요약문 생성을 포함한다. 새로운 분석 기능 추가가 아닌, 기존 데이터를 상담 화면에서 효과적으로 활용하는 것이 핵심.

</domain>

<decisions>
## Implementation Decisions

### 성향 정보 표시
- 전체 분석 결과 표시 (MBTI, 사주, 성명학, 관상, 손금 모두)
- AI가 전체 분석을 1-2문장으로 요약한 "성향 요약 문장" 형태로 표시
- 요약 문장은 학생 분석 완료 시 미리 생성하여 DB에 저장
- 분석 정보가 없는 학생의 경우 "MBTI 분석이 없습니다" + 분석 시작 버튼 표시로 유도

### 궁합 점수 활용
- 숫자 점수(85점)와 함께 "좋은 궁합" 같은 해석 텍스트 함께 표시
- 세부 항목(MBTI, 사주, 학습스타일 등) 점수를 펼쳐볼 수 있게 표시
- 궁합 점수가 낮을 때 "이 학생과는 X 속도로 진행하세요" 같은 주의점/팁 제시
- 궁합 정보가 아직 계산되지 않은 경우 상담 화면 진입 시 필요한 데이터가 있으면 자동 계산

### AI 요약 생성
- 선생님이 "AI 요약" 버튼을 클릭할 때 수동으로 생성 (상담 중)
- 요약 시 상담 내용 + 학생 성향 정보 + 이전 상담 이력까지 고려한 종합 요약 생성
- 생성된 요약은 별도 필드(aiSummary)로 분리 저장 (summary 필드와 구분)
- 요약문 수정 가능 + "AI 요약 다시 생성" 재생성 옵션 둘 다 제공

### 정보 접근 패턴
- AI 지원 정보(성향, 궁합)는 상담 폼 옆에 사이드 패널로 항상 표시
- 사이드 패널은 기본 열림 상태로 시작
- 패널 내 정보 순서: 성향 요약 → 궁합 점수 → AI 요약 버튼

### Claude's Discretion
- 모바일 화면에서 사이드 패널 처리 방식 (반응형 UI 최적화)
- 성향 요약 문장의 구체적인 프롬프트 설계
- AI 요약 생성 프롬프트의 세부 구조

</decisions>

<specifics>
## Specific Ideas

- 기존 LLM 라우터(Phase 15) 활용하여 비용 최적화된 요약 생성
- CounselingSession 모델에 aiSummary 필드 추가 (summary와 별도)
- Student 모델에 personalitySummary 필드 추가 (미리 생성된 성향 요약)
- 사이드 패널은 상담 생성/수정 화면에만 표시 (목록 화면에는 불필요)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 22-ai-integration*
*Context gathered: 2026-02-05*
