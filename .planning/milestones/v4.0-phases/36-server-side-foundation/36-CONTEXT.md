# Phase 36: Server-side Foundation - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

교사가 @멘션을 포함한 채팅 메시지를 전송하면 서버가 RBAC를 적용하여 엔티티 데이터를 조회하고, 토큰 예산 내로 요약하여 AI 시스템 프롬프트에 안전하게 주입한다. 자동완성 UI(Phase 38), 멘션 칩 렌더링(Phase 39)은 별도 Phase에서 처리한다.

</domain>

<decisions>
## Implementation Decisions

### 엔티티 데이터 요약 — 학생
- 기본정보(이름, 학년, 학교) + 전체 분석 결과 포함 (사주, 성명학, MBTI, 관상, 손금, AI학습추천, AI진로추천)
- 최근 상담 노트 3건의 요약을 포함하여 맥락 있는 AI 응답 지원
- 토큰 예산(~800토큰/엔티티) 초과 시 분석 절삭 우선순위는 Claude 재량

### 엔티티 데이터 요약 — 선생님
- 기본정보(이름, 역할, 전문분야) + 분석 결과 + 현재 담당 학생 이름 리스트 포함
- 상담 노트 최근 3건 포함 (학생과 동일 정책)

### 엔티티 데이터 요약 — 팀(학급)
- 팀 데이터의 구체적 구성은 Claude 재량 (팀명, 구성원, 통계 등)

### 토큰 관리
- 엔티티당 ~800토큰 예산
- 다중 멘션 시 토큰 분배 전략은 Claude 재량 (전체 예산 내 유동적 분배 가능)
- 요약 형식(구조화/자연어), 레이블 언어(한국어/영어)도 Claude 재량

### RBAC 실패 처리
- 팀 외부 엔티티 멘션 시: 해당 엔티티 데이터 주입 생략 + "○○○님은 접근 권한이 없어 제외되었습니다" 알림 메시지 반환
- 부분 실패 시: 접근 가능한 엔티티만 AI에 주입, 나머지는 조용히 제외 (알림은 위 규칙으로 커버)
- RBAC 실패 이벤트는 보안 감사 로그에 필수 기록 (멘션 시도 + 실패 사유)
- DIRECTOR 역할은 모든 팀의 엔티티에 접근 가능 (관리자 전체 접근권)

### Prompt Injection 방어
- XML 경계 마킹 (<student_data> 등)으로 엔티티 데이터 감싸기
- 자유 텍스트 필드 정제 범위, 지시문 강도는 Claude 재량 (보안과 토큰 효율 균형)
- 개인정보 전체 전달 허용 — 교사가 멘션으로 명시적 요청한 것이므로 의도된 행위
- AI 출력에서 학생 데이터 노출 제한 없음 — 자유롭게 인용/해석 가능

### 멘션 메타데이터 저장
- ChatMessage.mentionedEntities (Json?)에 저장
- 저장 범위: ID, 타입(student/teacher/team), displayName만 (스냅샷 데이터 미포함)
- 용도: UI 렌더링(Phase 39 멘션 칩) + 감사 로그 + 히스토리 재구성
- RBAC 실패한 멘션의 기록 여부는 Claude 재량
- 엔티티별 채팅 필터링 필요 ("홍길동 멘션된 대화만 보기" 기능 지원)

### Claude's Discretion
- 엔티티 요약 형식 (구조화 키-값 vs 자연어 문장)
- 레이블 언어 (한국어 vs 영어)
- 토큰 초과 시 분석 절삭 우선순위
- 다중 멘션 토큰 분배 전략
- 팀 엔티티 데이터 구성
- XML 정제 범위 및 Prompt Injection 지시문 강도
- RBAC 실패 멘션의 메타데이터 기록 여부

</decisions>

<specifics>
## Specific Ideas

- STATE.md에 확정된 아키텍처 결정: Parse on Submit, System Prompt Injection, Server-side Resolution, GET Route for Autocomplete
- 토큰 예산 ~800토큰/엔티티 (한국어 1토큰 ≈ 1.5~2자)
- XML 경계 마킹 (<student_data>) + system prompt 상단 지시문으로 방어
- DIRECTOR 역할은 전체 접근권 — 기존 RBAC 시스템과 일관성 유지

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 36-server-side-foundation*
*Context gathered: 2026-02-19*
