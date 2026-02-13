# 분석 엔진 드롭다운 → Universal LLM Hub 전환

**날짜**: 2026-02-13
**상태**: 승인됨

## 문제

분석 엔진 드롭다운(`ProviderSelector`)이 레거시 `LLMConfig` 테이블에서 데이터를 가져옴.
Universal LLM Hub에서 등록한 Provider가 드롭다운에 표시되지 않음.

## 결정

`getEnabledProviders()` 함수를 `Provider` 테이블(Hub) 기준으로 전환.
레거시 `LLMConfig` 기반 관리자 대시보드(`/admin/llm-settings`)는 데모용으로 유지.

## 변경 범위

**수정 파일**: `src/lib/ai/config.ts` — `getEnabledProviders()` 함수 1개

### 변경 내용

- DB 조회 대상: `LLMConfig` → `Provider` 테이블
- 필터 조건: `isEnabled: true` (isValidated 체크 제거)
- 타입 변환: `providerType` → `ProviderName` (`providerTypeToName()` 활용)
- 중복 제거: 동일 providerType의 복수 Provider 등록 대응 (`Set` 사용)
- Ollama 자동 추가: 기존 로직 유지

### 영향 없는 부분

- 관리자 대시보드 LLM 설정 — 그대로 유지 (데모용)
- `ProviderSelector` 컴포넌트 — prop 타입 변경 없음
- 분석 패널 컴포넌트들 — `enabledProviders` prop 동일
- 반환 타입 `ProviderName[]` — 변경 없음
