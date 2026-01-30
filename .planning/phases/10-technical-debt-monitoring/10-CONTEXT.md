# Phase 10: Technical Debt Resolution & Monitoring - Context

**Gathered:** 2026-01-30
**Status:** Ready for planning

<domain>
## Phase Boundary

코드 중복 제거, 오류 추적(Sentry), 구조화된 로깅, 데이터베이스 백업 자동화, 번들 분석 및 병렬 데이터 페칭 최적화, 그리고 Phase 1 VERIFICATION.md 생성을 통한 프로덕션 안정성 확보

</domain>

<decisions>
## Implementation Decisions

### 코드 중복 제거 전략
- **범위**: 전체 코드베이스를 대상으로 기술 부채 전반 점검 및 체계적 정리
- **접근 방식**: Claude가 전문가 판단으로 최적의 방식 결정 (fetchReportData 공유 모듈 또는 서버 액션 중심 재설계)
- **테스트 전략**: 리팩토링 전 기존 동작을 테스트로 보장하고 진행
- **코드 정리 수준**: 완전한 현대화 (최신 패턴 재작성, 타입 안정성 강화, 함수명/변수명 일관성)

### 오류 추적 및 로깅
- **Sentry 범위**: 광범위하게 추적 (예상되는 모든 에러 포착)
- **민감 정보 처리**: 자동 필터링 (에러 메시지에서 비밀번호, 토큰 등 자동 마스킹)
- **로그 형식**: 완전한 구조화 (모든 로그를 JSON 형식으로 검색 가능하게)
- **요청 ID 추적**: UUID 기반 요청 ID로 모든 로그 연결

### 백업 및 최적화
- **백업 스케줄**: 매일 새벽 2시에 전체 백업
- **보관 기간**: 30일 보관 후 자동 삭제
- **복구 테스트**: 백업 후 자동 복구 테스트 스크립트 실행
- **최적화 순서**: 번들 분석 → 코드 스플리팅 → 병렬 페칭 순서로 진행

### Claude's Discretion
- Sentry 프로젝트 구성 및 DSN 설정
- 로그 라이브러리 선택 (pino, winston 등)
- 번들 분석 도구 선택 (@next/bundle-analyzer 또는 webpack-bundle-analyzer)
- 병렬 페칭 구현 패턴 (Promise.all, React.use 등)

</decisions>

<specifics>
## Specific Ideas

- "프로덕션 준비를 위한 철저한 테스트와 자동화가 중요하다"
- "코드 현대화를 통해 유지보수성을 높이고 싶다"
- "모니터링과 백업은 운영 안정성의 핵심이다"

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 10-technical-debt-monitoring*
*Context gathered: 2026-01-30*
