# Phase 37: Autocomplete Search API - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

교사가 @를 입력할 때 학생, 선생님, 학급 3가지 엔티티 타입을 이름으로 빠르게 검색할 수 있는 독립 GET API 레이어. UI 구현은 Phase 38에서 다룬다.

</domain>

<decisions>
## Implementation Decisions

### 검색 동작
- 초성 검색(ㄱㄴㄷ) 미지원 — 완성된 글자만 검색 가능
- 최소 검색 글자수: 1자 이상 (ROADMAP 2자 기준에서 완화 — 한국어 특성상 "김" 한 글자도 의미 있음)
- 타입 필터: `?types=student,teacher,team` 쿼리 파라미터로 특정 타입만 검색 가능 (ROADMAP 명시)

### 응답 구조
- 서브레이블 풍부하게 구성:
  - 학생: 학년 + 학교 + 생년월일
  - 선생님: 역할 + 담당학생수
  - 학급(팀): 팀명 + 인원수
- 아바타/프로필 이미지 URL 포함 — 드롭다운에서 시각적 구분 용이

### Claude's Discretion
- 결과 최대 개수 (타입별 또는 전체)
- 결과 정렬 기준 (이름 사전순 vs 관련도)
- 응답 그룹핑 방식 (타입별 그룹 vs 플랫 리스트 + type 필드)
- 디바운스 전략 (클라이언트 전용 vs 서버 병행)
- 쿼리 병렬 실행 전략 (Promise.all vs UNION ALL)
- 서버 측 캐싱 여부 및 TTL
- AbortController 서버 측 처리 방식
- 빈 결과 메시지 형태
- 특수문자 처리 (제거 vs 그대로 검색)
- RBAC 접근 불가 엔티티 처리 (조용히 제외 vs 명시적 알림)
- 인증 실패 응답 방식 (기존 앱 패턴 따름)

</decisions>

<specifics>
## Specific Ideas

- ROADMAP에 명시된 경로: `GET /api/chat/mentions/search?q=홍&types=student,teacher,team`
- ROADMAP에 명시된 기술: AbortController 취소 지원, Promise.all 병렬 쿼리, RBAC
- Phase 36에서 만든 mention-types.ts의 MentionItem 타입과 일관성 유지
- 검색 결과 항목은 Phase 38 드롭다운 UI에서 바로 사용할 수 있는 형태여야 함

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 37-autocomplete-search-api*
*Context gathered: 2026-02-19*
