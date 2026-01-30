# Phase 11: Teacher Infrastructure & Access Control - Context

**Gathered:** 2026-01-30
**Status:** Ready for planning

## Phase Boundary

선생님 관리를 위한 데이터베이스 스키마, 팀 기반 RBAC(Role-Based Access Control), 그리고 선생님 CRUD UI를 구축합니다. 기존 학생 데이터에 팀 외래 키를 무중단으로 마이그레이션합니다.

## Implementation Decisions

### 역할 권한 설계
- **원장(Director)**: 모든 팀 데이터에 전체 접근 가능 + 시스템 설정 변경 권한
- **팀장(Team Leader)**: 본인 팀의 모든 학생/선생님 데이터를 조회하고 수정 가능
- **매니저(Manager)**: 본인의 담당 학생 데이터만 접근 가능
- **선생님(Teacher)**: 본인의 담당 학생 데이터만 접근 가능
- **권한 검증**: DB 제약조건으로 강제 (PostgreSQL RLS)

### 팀 구조 정책
- **팀 생성**: 원장만 팀을 생성 가능
- **팀장 수**: 한 팀에 단일 팀장만 허용
- **선생님 소속**: 단일 팀 소속만 허용 (다중 팀 소속 불가)
- **팀 삭제 시**: 연관된 선생님/학생의 teamId를 NULL로 설정

### 마이그레이션 전략
- **초기값**: 기존 학생의 teamId를 NULL로 시작
- **제약조건 검증**: NOT NULL 제약조건을 즉시 검증 (마이그레이션 중 약간의 중단 허용)
- **실행 방식**: Prisma migrate로 자동 실행
- **롤백 전략**: 마이그레이션 전 DB 전체 백업 자동 생성

### 선생님 UI/UX
- **목록 레이아웃**: 테이블/카드 토글 전환 가능 (기본: 테이블)
- **검색/필터**: 이름, 이메일, 역할, 소속 팀으로 검색 및 필터링
- **페이지네이션**: 서버 사이드 페이지네이션 (페이지 당 20명)
- **상세 페이지**: 기본 정보(이름, 이메일, 역할) + 소속 팀 표시

### Claude's Discretion
- 정확한 DB 제약조건 문법 (PostgreSQL RLS 설정)
- Prisma middleware 구현 세부사항
- UI 컴포넌트의 디자인 세부사항 (spacing, typography)
- 검색/필터링의 정확한 UX 흐름

## Specific Ideas

No specific requirements — open to standard approaches

## Deferred Ideas

None — discussion stayed within phase scope

---

*Phase: 11-teacher-infrastructure*
*Context gathered: 2026-01-30*
