# Phase 38: Autocomplete UI & ChatInput Integration - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

교사가 채팅 입력창에 @를 입력하면 자동완성 드롭다운이 열리고, 엔티티를 선택하여 멘션을 삽입할 수 있으며, 한국어 IME 조합 중에도 정상 작동한다. Phase 37의 검색 API를 소비하고, Phase 36의 서버 파이프라인에 mentions[]를 전달한다.

메시지 렌더링(멘션 칩 표시, 팝오버)은 Phase 39에서 처리한다.

</domain>

<decisions>
## Implementation Decisions

### 드롭다운 UI 디자인
- 그룹 헤더 + 구분선으로 학생/선생님/학급 섹션 구분 (Slack 멘션 드롭다운 스타일)
- 각 항목: 이름 + 서브레이블만 표시 (아바타 없음)
  - 학생: '홍길동 · 3학년 방과후초'
  - 선생님: '김철수 · TEACHER'
  - 학급: 'A반 · 5명'

### Claude's Discretion — 드롭다운 UI
- 최대 표시 개수 (타입별 또는 전체)
- 빈 결과 상태 메시지 vs 드롭다운 숨김

### 입력 & 멘션 삽입 동작
- Phase 36의 "Parse on Submit" 결정 유지 — 입력창 내 멘션 표시 방식은 Claude 재량

### Claude's Discretion — 입력/멘션
- @트리거 타이밍 (@ 즉시 vs @ + 1자 이상)
- 멘션 텍스트 표시 방식 (평문 vs 시각적 칩)
- 다중 멘션 지원 여부
- 멘션 삽입 후 커서 동작 (공백 자동 삽입 여부)

### 한국어 IME & 키보드 인터랙션
- 키보드 탐색: ↑↓ Enter Esc 기본 4종 필수 지원

### Claude's Discretion — IME/키보드
- IME 조합 중 드롭다운 동작 (차단 vs 실시간 검색) — Success Criteria에서 compositionstart~compositionend 차단 명시
- 디바운스 타이밍 (200ms 기준, 조정 가능)
- 드롭다운 열린 상태에서 Enter 동작 (항목 선택 vs 메시지 전송)

### 라이브러리 선택 & fallback 전략
- UI 레퍼런스: Slack 스타일 멘션 드롭다운

### Claude's Discretion — 라이브러리
- react-mentions-ts vs @ariakit/react vs 직접 구현 — 스파이크 테스트 결과 기반 판단
- 스파이크 성공/실패 판단 기준
- 외부 라이브러리 vs 직접 구현 선택

</decisions>

<specifics>
## Specific Ideas

- Slack의 @ 멘션 드롭다운을 레퍼런스로 삼아 그룹 헤더 + 구분선 스타일 적용
- 아바타 없이 이름 + 서브레이블로 간결하게 유지
- Phase 36의 "Parse on Submit" 아키텍처 결정과 일관성 유지

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 38-autocomplete-ui-chatinput-integration*
*Context gathered: 2026-02-19*
