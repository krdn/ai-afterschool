# Phase 24: Missing Routes Creation - Context

**Gathered:** 2026-02-07
**Status:** Ready for planning

## Phase Boundary

테스트에서 참조하지만 아직 구현되지 않은 7개의 누락된 라우트 페이지를 생성합니다. 새로운 기능 추가가 아니라 기존 요구사항을 충족하기 위한 인프라 작업입니다.

**누락된 라우트:**
- `/teachers/me` — 본인 프로필 조회
- `/admin/system-status` — 시스템 상태 모니터링
- `/admin/system-logs` — 시스템 로그 조회
- `/admin/database` — 데이터베이스 백업 관리
- `/admin/audit-logs` — 감사 로그 조회
- `/teams` — 팀 목록
- `/teams/[id]` — 팀 상세
- `/students/[id]/report` — 리포트 프리뷰 및 PDF 다운로드

## Implementation Decisions

### 페이지 레이아웃 스타일

**Admin 페이지 통합 방식**
- Admin 페이지들(system-status, system-logs, database, audit-logs)을 하나의 `/admin` 페이지 내에서 탭 기반으로 통합
- 기존 Admin LLM 설정(`/admin`)과 Token 사용량 페이지와 동일한 패턴 사용
- 탭: LLM 설정 | 토큰 사용량 | 시스템 상태 | 시스템 로그 | 데이터베이스 | 감사 로그

**팀 페이지 레이아웃**
- `/teams`와 `/teams/[id]`는 `/students` 패턴 따르기
- 목록: 테이블 형식, 검색/필터 포함
- 상세: 별도 페이지 또는 사이드바/모달

**리포트 페이지 구조**
- `/students/[id]/report`는 학생 상세 페이지의 탭으로 통합
- 기존 탭(기본 정보, 성적, 분석, 상담, 매칭)에 '리포트' 탭 추가

**본인 프로필 페이지**
- `/teachers/me`는 `/teachers/[id]` 재사용 + 리다이렉트 패턴
- 세션에서 현재 로그인한 선생님 ID를 가져와 `/teachers/[teacherId]`로 리다이렉트

### 데이터 표시 방식

**시스템 상태(system-status)**
- 카드 + 상태 색상 형식 사용
- 각 서비스(Card): DB, Cache, Storage
- 상태 색상: 초록(정상), 빨강(연결 실패), 노랑(느림/경고)
- 메트릭 표시: 연결 상태, 응답 시간, 사용량

**시스템 로그 & 감사 로그**
- 테이블 + 정렬/필터 형식
- 컬럼: 시간, 레벨(ERROR/WARN/INFO), 메시지/변경내용, 사용자
- 기능: 레벨별 필터, 검색, 시간순 정렬

**데이터베이스 백업 관리**
- 당신이 결정 (Claude's discretion)

**팀 목록/상세**
- 당신이 결정 (Claude's discretion)

### 에러/빈 상태 처리

**시스템 상태 확인 실패**
- 당신이 결정 (Claude's discretion)

**백업 목록 없음**
- 당신이 결정 (Claude's discretion)

**팀 없음**
- 당신이 결정 (Claude's discretion)

**404 처리**
- 당신이 결정 (Claude's discretion)

### 관리자 접근 제어

**Admin 페이지 접근 권한**
- 당신이 결정 (Claude's discretion)
- 기존 Admin 페이지들의 RBAC 패턴과 일관성 유지

**권한 없는 접근 처리**
- 당신이 결정 (Claude's discretion)

**팀 페이지 접근 권한**
- 당신이 결정 (Claude's discretion)

**리포트 접근 권한**
- 당신이 결정 (Claude's discretion)

### Claude's Discretion

다음 영역에서 유연하게 결정할 수 있습니다:
- 데이터베이스 백업 관리 UI의 정확한 레이아웃과 기능
- 팀 목록/상세 페이지의 세부 UI 패턴 (테이블 vs 카드)
- 모든 에러 상태 처리의 구체한 UI 컴포넌트 선택
- 404/403 에러 페이지의 디자인
- RBAC 적용 범위의 구체적인 역할별 권한 (기존 Admin 페이지와 일관성 유지)

## Specific Ideas

없음 — 표준적인 시스템 관리 페이지 패턴을 따릅니다.

## Deferred Ideas

없음 — 논의가 Phase 24 범위 내에 유지되었습니다.

---

*Phase: 24-missing-routes-creation*
*Context gathered: 2026-02-07*
