---
phase: 28-integration-verification-&-test-alignment
plan: 05-B
type: execute
wave: 2
depends_on: [28-05-A]
files_modified:
  - src/app/api/test/reset/route.ts
  - src/app/api/teams/route.ts
autonomous: true
gap_closure: true

must_haves:
  truths:
    - "사용자가 /api/test/reset 엔드포인트로 테스트 데이터를 초기화할 수 있다"
    - "사용자가 /api/teams 엔드포인트로 팀 목록을 조회할 수 있다"
    - "인증된 사용자만 테스트 전용 API에 접근할 수 있다"
  artifacts:
    - path: "src/app/api/test/reset/route.ts"
      provides: "테스트 데이터 리셋 API 엔드포인트"
      exports: ["POST"]
      contains: "export async function POST"
    - path: "src/app/api/teams/route.ts"
      provides: "팀 목록 조회 API 엔드포인트"
      exports: ["GET"]
      contains: "export async function GET"
  key_links:
    - from: "tests/e2e"
      to: "src/app/api/test/reset/route.ts"
      via: "POST /api/test/reset 호출"
      pattern: "fetch.*api/test/reset"
    - from: "tests/e2e"
      to: "src/app/api/teams/route.ts"
      via: "GET /api/teams 호출"
      pattern: "fetch.*api/teams"
---

<objective>
테스트에서 필요로 하는 전용 API 엔드포인트(/api/test/reset, /api/teams)를 구현합니다.

Purpose: API 부재로 인한 테스트 실패(5개)를 해소하고, 테스트 데이터 초기화 기능을 제공합니다.

Output: 인증된 사용자만 접근 가능한 테스트 전용 API 엔드포인트 2개
</objective>

<execution_context>
@/home/gon/.claude/get-shit-done/workflows/execute-plan.md
@/home/gon/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/28-integration-verification-&-test-alignment/28-VERIFICATION.md
@.planning/phases/28-integration-verification-&-test-alignment/TEST-COVERAGE.md
@.planning/phases/28-integration-verification-&-test-alignment/28-05-A-SUMMARY.md
@.planning/phases/28-integration-verification-&-test-alignment/28-RESEARCH.md

# 갭 요약 (from VERIFICATION.md)
- API 부재: 5개 테스트 실패
- 필요한 엔드포인트: /api/test/reset, /api/teams
</context>

<tasks>

<task type="auto">
  <name>테스트 전용 API 엔드포인트 구현</name>
  <files>
    src/app/api/test/reset/route.ts
    src/app/api/teams/route.ts
  </files>
  <action>
    테스트에서 필요로 하는 전용 API 엔드포인트를 구현하세요:

    **src/app/api/test/reset/route.ts (POST):**
    - 테스트 데이터를 초기 상태로 리셋하는 엔드포인트
    - 인증: 인증된 사용자만 접근 가능 (session cookie 확인)
    - RBAC: role 확인 없이 인증된 모든 사용자 접근 가능 (테스트 편의성)
    - 동작:
      1. isTest: true로 표시된 테스트용 데이터만 제거
      2. 테스트 분석 기록 제거 (isTest: true인 학생의 관련 기록)
      3. 테스트 상담 기록 제거 (isTest: true인 학생의 관련 기록)
    - 보안: isTest 플래그가 false인 실제 데이터는 절대 삭제하지 않음
    - 응답: { success: true, resetCount: number }
    - 에러 처리: 인증 실패 시 401, 서버 에러 시 500

    **src/app/api/teams/route.ts (GET):**
    - 팀 목록을 조회하는 엔드포인트
    - 인증: 로그인한 사용자 (session cookie 확인)
    - RBAC:
      - DIRECTOR: 전체 팀 목록 반환
      - TEAM_LEADER: 자신이 리더인 팀만 반환
      - TEACHER: 자신이 속한 팀만 반환
    - 응답: { teams: Array<{ id, name, leaderId, teacherCount }> }
    - 에러 처리: 인증 실패 시 401, 권한 없음 시 403

    다른 팀 관련 API 파일이 있는지 먼저 확인하고, 있다면 해당 파일을 수정하세요.

    **구현 가이드:**
    1. Prisma Client 사용 (prisma.student, prisma.counselingRecord 등)
    2. 인증 미들웨어 또는 session 확인 로직 구현
    3. isTest 플래그로 실제 데이터 보호
    4. 적절한 HTTP 상태 코드 반환
  </action>
  <verify>
    # 파일 존재 확인
    test -f src/app/api/test/reset/route.ts && echo "test/reset route exists" || echo "test/reset route missing"
    test -f src/app/api/teams/route.ts && echo "teams route exists" || echo "teams route missing"

    # API 엔드포인트 exports 확인
    grep -q "export async function POST" src/app/api/test/reset/route.ts && echo "POST export found" || echo "POST export missing"
    grep -q "export async function GET" src/app/api/teams/route.ts && echo "GET export found" || echo "GET export missing"
  </verify>
  <done>
    /api/test/reset POST 엔드포인트 파일이 존재하고 POST 함수를 export하며, /api/teams GET 엔드포인트 파일이 존재하고 GET 함수를 export함
  </done>
</task>

</tasks>

<verification>
1. src/app/api/test/reset/route.ts 파일이 존재하고 POST 함수를 export함
2. src/app/api/teams/route.ts 파일이 존재하고 GET 함수를 export함
3. 인증된 사용자만 접근 가능하도록 구현됨
4. isTest 플래그로 실제 데이터가 보호됨
</verification>

<success_criteria>
1. /api/test/reset POST 엔드포인트가 파일로 존재하고 POST 함수를 export함
2. /api/teams GET 엔드포인트가 파일로 존재하고 GET 함수를 export함
3. 인증 로직이 구현되어 있음 (session 확인)
4. isTest 플래그로 실제 데이터 보호 로직이 포함됨
5. API 부재 관련 5개 테스트 실패가 해소될 기반 마련
</success_criteria>

<output>
완료 후 `.planning/phases/28-integration-verification-&-test-alignment/28-05-B-SUMMARY.md`를 생성하세요.
</output>
