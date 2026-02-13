# Universal LLM Hub - 버그 수정 및 코드 품질 개선 설계

## 날짜: 2026-02-13
## 브랜치: feat/llm

## 배경

Universal LLM Hub 코드 분석 결과 발견된 문제점들을 수정합니다.
- 한글 타이포 5곳
- 코드 품질 이슈 (디버그 로그, 미사용 함수, 타입 단언)
- BaseAdapter 중복 코드
- 누락된 어댑터 4개 (DeepSeek, Mistral, Cohere, xAI)
- Streaming 선언/구현 불일치

## 설계

### Step 1: 타이포 수정

| 파일 | 잘못된 텍스트 | 수정 |
|------|-------------|------|
| provider-card.tsx:388 | 묶뤂 | 무료 |
| provider-form.tsx:517 | 묶뤂 | 무료 |
| provider-form.tsx:429 | 대첸 | 대체 |
| template-selector.tsx:213 | 묶뤂 | 무료 |
| adapters/index.ts:164 | 재낳ㅇ | 재export |

### Step 2: 코드 품질 정리

- provider-form.tsx:138-143 — console.log 3줄 제거
- provider-card.tsx:438-443 — 미사용 maskApiKey 함수 제거
- provider-card.tsx:69 — 타입 단언 개선

### Step 3: BaseAdapter 리팩터링

- base.ts에 protected decryptApiKey 메서드 추가
- 기존 6개 어댑터에서 중복 private decryptApiKey 제거

### Step 4: 새 어댑터 4개 구현

| Provider | 패키지 | 테스트 모델 |
|----------|--------|-----------|
| DeepSeek | @ai-sdk/deepseek | deepseek-chat |
| Mistral | @ai-sdk/mistral | mistral-small-latest |
| Cohere | @ai-sdk/cohere | command-r |
| xAI | @ai-sdk/xai | grok-3-mini |

- 각 어댑터 파일 생성
- AdapterFactory에 등록
- BaseAdapter의 protected decryptApiKey 사용

### Step 5: Streaming 정합성

- moonshot.ts, zhipu.ts: supportsStreaming = false로 변경
- 새 4개 어댑터: streamText 기반 스트리밍 구현 포함

## 접근 방식

단계별 순차 수정 — 각 단계마다 독립 커밋 가능, 리스크 격리
