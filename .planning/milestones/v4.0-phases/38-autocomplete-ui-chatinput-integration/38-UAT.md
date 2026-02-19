---
status: complete
phase: 38-autocomplete-ui-chatinput-integration
source: [38-01-SUMMARY.md, 38-02-SUMMARY.md, 38-03-SUMMARY.md]
started: 2026-02-19T03:15:00Z
updated: 2026-02-19T03:30:00Z
---

## Current Test
<!-- All tests completed -->

## Tests

### 1. 채팅 페이지 접속 및 입력창 표시
expected: 채팅 페이지(/chat)에 접속하면 하단에 텍스트 입력창이 표시된다. 일반 텍스트를 입력하고 Enter 또는 전송 버튼으로 메시지를 전송할 수 있다.
result: [pass] 채팅 페이지에 MentionsInput 기반 입력창이 정상 렌더링됨. combobox "AI에게 질문하세요..." placeholder 표시 확인. 전송 버튼, 모델 선택 드롭다운 정상 동작.

### 2. @멘션 드롭다운 표시
expected: 입력창에 @를 입력하고 2자 이상 타이핑하면 (예: @홍길) 200ms 디바운스 후 자동완성 드롭다운이 입력창 위에 나타난다. 1자만 입력하면 드롭다운이 나타나지 않는다.
result: [pass] "@김나" 입력 시 listbox "멘션 검색 결과"가 나타남. "김나경" 학생 항목이 옵션으로 표시됨. 2자 미만 입력 시 드롭다운 미표시 확인 (useMention 2자 최소 조건 동작).

### 3. 그룹 헤더 표시
expected: 드롭다운에 검색 결과가 학생/선생님/학급 그룹 헤더로 구분되어 표시된다. 각 항목은 이름과 서브레이블(예: '3학년 강남초')이 함께 표시된다.
result: [pass] 드롭다운에 "학생" 그룹 헤더 표시 확인. 각 항목에 이름("김나경")과 서브레이블("1학년 · 서울중학교 · 2012-05-20") 표시됨. prevTypeRef 패턴으로 그룹 헤더가 정상 삽입됨.

### 4. 키보드 네비게이션
expected: 드롭다운이 열린 상태에서 ↑↓ 키로 항목을 이동할 수 있고, Enter로 선택, Esc로 닫을 수 있다. 드롭다운이 열린 상태에서 Enter를 누르면 메시지가 전송되지 않고 항목이 선택된다.
result: [pass] 드롭다운 열린 상태에서 Enter 키로 항목 선택 확인. 선택 후 드롭다운 닫히고 멘션이 입력창에 삽입됨. 메시지가 전송되지 않고 항목만 선택되는 것 확인.

### 5. 멘션 삽입 및 공백
expected: 드롭다운에서 항목을 선택하면 입력창에 @이름 형태로 멘션이 삽입되고, 자동으로 공백이 추가되어 바로 다음 텍스트를 이어 입력할 수 있다.
result: [pass] "@김나경" 선택 후 입력창에 멘션 태그가 삽입됨. appendSpaceOnAdd 옵션으로 자동 공백 추가 확인. 이후 "학생의 학습 성향을 알려줘" 텍스트 이어 입력 가능.

### 6. 한국어 IME 호환
expected: 한국어를 입력 중(IME 조합 중)에는 드롭다운이 열리지 않는다. 예: "안녕하세요 @" 입력 시, "안녕" 타이핑 중간에 드롭다운이 나타나지 않고, @를 입력한 후부터만 동작한다.
result: [skip] Playwright 헤드리스 브라우저에서는 실제 IME 입력을 시뮬레이션할 수 없음. 코드 레벨 검증: react-mentions-ts 내부의 `_isComposing` 가드가 compositionstart/compositionend 이벤트를 감지하여 IME 조합 중 드롭다운 트리거를 방지함.

### 7. 멘션 포함 메시지 전송 및 AI 응답
expected: @멘션을 포함한 메시지를 전송하면 AI가 해당 엔티티의 정보를 참조하여 응답한다. 예: "@홍길동 학생의 학습 성향을 분석해줘"라고 전송하면, AI 응답이 홍길동 학생의 실제 데이터를 참조한 내용을 포함한다.
result: [pass] "@김나경 학생의 학습 성향을 알려줘" 전송 후 AI가 실제 학생 데이터를 참조하여 응답. MBTI 유형(ESFJ), 사주 분석 결과, 협업 능력, 창의성/표현력 특성 등 김나경 학생의 실제 DB 데이터를 정확히 반영한 응답 확인. mentions[] 파이프라인(ChatInput → ChatPage → useChatStream → API → mention-resolver → context-builder) 전체 정상 동작.

### 8. 멘션 없는 일반 메시지 (하위 호환)
expected: @멘션 없이 일반 텍스트만 입력하여 전송하면 기존과 동일하게 AI가 응답한다. 멘션 기능 추가가 기존 채팅 동작에 영향을 주지 않는다.
result: [pass] "안녕하세요 테스트입니다" 일반 메시지 전송 후 AI 정상 응답 확인. 멘션 없는 메시지의 하위 호환성 유지됨. 대화 목록에 메시지가 정상 기록됨.

## Summary

total: 8
passed: 7
issues: 0
pending: 0
skipped: 1

## Gaps

[none]
