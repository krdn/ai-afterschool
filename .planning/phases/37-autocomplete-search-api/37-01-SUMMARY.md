---
phase: 37-autocomplete-search-api
plan: 01
subsystem: chat-mention-search
tags: [api, search, rbac, mention, autocomplete]
dependency_graph:
  requires:
    - "36-server-side-foundation (mention-types.ts, verifySession, db)"
  provides:
    - "GET /api/chat/mentions/search — 멘션 자동완성 검색 API"
    - "MentionSearchItem, MentionSearchResponse 타입"
  affects:
    - "Phase 38 자동완성 UI (이 API를 fetch하여 드롭다운 렌더링)"
tech_stack:
  added: []
  patterns:
    - "verifySession + NextRequest.nextUrl.searchParams + NextResponse.json (기존 providers/route.ts 패턴)"
    - "Promise.all 병렬 Prisma 쿼리 (기존 mention-resolver.ts 패턴)"
    - "RBAC silent filter: where 조건 빌더 헬퍼 함수 3개 (buildStudentWhere/buildTeacherWhere/buildTeamWhere)"
    - "satisfies MentionSearchResponse 타입 안전 응답"
key_files:
  created:
    - "src/app/api/chat/mentions/search/route.ts"
  modified:
    - "src/lib/chat/mention-types.ts"
decisions:
  - "타입별 그룹 응답 구조({ students, teachers, teams }): Phase 38 드롭다운 섹션 렌더링에 직접 매핑"
  - "RBAC silent filter: 검색 단계는 탐색이므로 접근 불가 메시지 없이 조용히 제외"
  - "타입별 최대 5건(총 15건): 드롭다운 UX 최적화"
  - "buildXxxWhere가 null 반환 시 빈 배열 즉시 반환: teamId null인 비 DIRECTOR의 Prisma null 오류 방지"
metrics:
  duration: "5 minutes"
  completed: "2026-02-19"
  tasks: 2
  files: 2
---

# Phase 37 Plan 01: Mention Autocomplete Search API Summary

**One-liner:** GET /api/chat/mentions/search — 3가지 엔티티 타입 RBAC 필터 멘션 검색 API with 타입별 그룹 응답

## What Was Built

### Task 1: mention-types.ts에 검색 응답 타입 추가 (commit: bb2e9f0)

`src/lib/chat/mention-types.ts` 파일 끝에 2개의 타입을 추가했다.

- `MentionSearchItem`: 자동완성 검색 결과 단일 항목 (id, type, name, sublabel, avatarUrl)
- `MentionSearchResponse`: GET /api/chat/mentions/search 응답 전체 ({ students, teachers, teams })

기존 타입(MentionType, MentionItem, MentionedEntity, ResolvedMention, MentionResolutionResult)과 충돌 없음. TypeScript 컴파일 통과.

### Task 2: GET /api/chat/mentions/search 라우트 핸들러 구현 (commit: 347ed6e)

`src/app/api/chat/mentions/search/route.ts` 신규 생성. 전체 파이프라인:

1. **인증**: `verifySession()` — 미인증 시 Next.js redirect 처리
2. **빈 쿼리 보호**: `q.length < 1` 이면 DB 조회 없이 즉시 빈 응답 반환
3. **types 파라미터 파싱**: `student,teacher,team` 콤마 구분, 빈 값이면 전체 검색
4. **RBAC where 조건 빌더**: `buildStudentWhere`, `buildTeacherWhere`, `buildTeamWhere` 3개 헬퍼 함수
   - DIRECTOR: 전체 엔티티 검색
   - 비 DIRECTOR: `teamId` 소속만, `teamId === null`이면 `null` 반환 (빈 배열 보장)
5. **Promise.all 병렬 쿼리**: 3개 Prisma findMany 동시 실행
6. **응답 변환**: DB 결과 → MentionSearchItem[] (sublabel, avatarUrl 포함)
7. **응답**: `NextResponse.json({ students, teachers, teams } satisfies MentionSearchResponse)`

## Verification Results

- TypeScript `--noEmit`: 에러 없음 (2회 확인)
- `pnpm build` (clean): 성공 — `/api/chat/mentions/search` Dynamic 라우트 등록 확인
- verifySession import: 존재
- Promise.all 호출: 존재
- NextResponse.json 응답: 존재
- RBAC DIRECTOR 분기 + teamId null 분기: 존재
- 빈 쿼리 보호: q.length < 1 조기 반환 존재
- 서브레이블: 학생(학년+학교+생년월일), 선생님(역할+담당수), 학급(학생수+교사수) 모두 존재
- 이미지 URL: Student(images[0].resizedUrl), Teacher(profileImage), Team(null) 모두 구현

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

**Note:** 첫 번째 `pnpm build` 실행 시 `.next/` 캐시 손상으로 `Cannot find module './6141.js'` 오류 발생. `.next/` 디렉토리 삭제 후 재빌드로 해결. 이는 기존 캐시 문제로 이번 변경사항과 무관한 pre-existing issue이며 Rule 1~3 적용 대상이 아님.

## Superpowers 호출 기록

| # | 스킬명 | 호출 시점 | 결과 요약 |
|---|--------|----------|----------|
| — | — | — | — |

### 미호출 스킬 사유

| 스킬명 | 미호출 사유 |
|--------|-----------|
| superpowers:brainstorming | 2-task 단순 구현 Plan. RESEARCH.md에 이미 상세 설계 완료. 별도 브레인스토밍 불필요 |
| superpowers:test-driven-development | TDD 태그 없음. 순수 API 라우트 구현으로 빌드/타입 검증으로 충분 |
| superpowers:systematic-debugging | 버그 미발생 (.next 캐시 문제는 인프라 이슈, 코드 버그 아님) |
| superpowers:requesting-code-review | 2-task 단순 라우트 구현. 타입 안전성과 빌드 성공으로 품질 확인 완료 |

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| src/lib/chat/mention-types.ts | FOUND |
| src/app/api/chat/mentions/search/route.ts | FOUND |
| .planning/phases/37-autocomplete-search-api/37-01-SUMMARY.md | FOUND |
| commit bb2e9f0 (MentionSearchItem/MentionSearchResponse 타입) | FOUND |
| commit 347ed6e (GET /api/chat/mentions/search 라우트 핸들러) | FOUND |
