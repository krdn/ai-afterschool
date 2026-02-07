---
phase: 28-integration-verification-&-test-alignment
plan: 05-C
type: execute
wave: 3
depends_on: [28-05-A, 28-05-B]
files_modified:
  - playwright.config.ts
  - tests/e2e/analysis.spec.ts
  - tests/e2e/counseling.spec.ts
  - tests/e2e/teacher.spec.ts
  - playwright-report/index.html
  - .planning/phases/28-integration-verification-&-test-alignment/TEST-COVERAGE.md
autonomous: true
gap_closure: true

must_haves:
  truths:
    - "E2E 테스트가 타임아웃 없이 안정적으로 실행된다"
    - "복잡한 페이지(분석, 상담)의 테스트가 타임아웃 없이 완료된다"
    - "테스트 통과율이 20.7%에서 50% 이상으로 향상된다"
  artifacts:
    - path: "playwright.config.ts"
      provides: "전역 타임아웃 설정"
      contains: "timeout: 60000"
    - path: "tests/e2e/analysis.spec.ts"
      provides: "AI 분석 테스트 타임아웃 설정"
      contains: "test.setTimeout(60000)"
    - path: "playwright-report/index.html"
      provides: "E2E 테스트 실행 결과 보고서"
    - path: ".planning/phases/28-integration-verification-&-test-alignment/TEST-COVERAGE.md"
      provides: "테스트 커버리지 기록"
  key_links:
    - from: "playwright.config.ts"
      to: "tests/e2e/analysis.spec.ts"
      via: "전역 타임아웃 설정 상속"
      pattern: "timeout.*60000"
---

<objective>
E2E 테스트 타임아웃 설정을 최적화하고, 모든 수정 사항을 적용한 후 테스트를 실행하여 통과율을 50% 이상으로 향상시킵니다.

Purpose: 타임아웃으로 인한 테스트 실패(15개)를 해소하고, 전체 E2E 테스트 스위트의 통과율을 측정합니다.

Output: 타임아웃이 최적화된 테스트 설정, 50% 이상 통과하는 E2E 테스트 결과, 업데이트된 TEST-COVERAGE.md
</objective>

<execution_context>
@/home/gon/.claude/get-shit-done/workflows/execute-plan.md
@/home/gon/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/28-integration-verification-&-test-alignment/28-VERIFICATION.md
@.planning/phases/28-integration-verification-&-test-alignment/TEST-COVERAGE.md
@.planning/phases/28-integration-verification-&-test-alignment/28-05-A-SUMMARY.md
@.planning/phases/28-integration-verification-&-test-alignment/28-05-B-SUMMARY.md
@.planning/phases/28-integration-verification-&-test-alignment/28-RESEARCH.md

# 갭 요약 (from VERIFICATION.md)
- 타임아웃: 15개 테스트 실패
- 현재 통과율: 20.7% (87개 중 18개 통과)
- 목표 통과율: 50% 이상
</context>

<tasks>

<task type="auto">
  <name>E2E 테스트 타임아웃 설정 최적화</name>
  <files>
    playwright.config.ts
    tests/e2e/analysis.spec.ts
    tests/e2e/counseling.spec.ts
    tests/e2e/teacher.spec.ts
  </files>
  <action>
    타임아웃으로 실패하는 테스트를 위한 설정을 최적화하세요:

    **playwright.config.ts:**
    - 전체 타임아웃을 30000ms에서 60000ms로 증가
    - 네비게이션 타임아웃을 확인하고 필요시 증가 (기본값 사용 가능)
    - action 타임아웃 설정 확인 (기본값 사용 가능)
    - expect 타임아웃 설정 확인 (기본값 사용 가능)

    수정 예시:
    ```typescript
    export default defineConfig({
      timeout: 60000, // 60초로 증가
      // 다른 설정 유지
    });
    ```

    **테스트 파일별 수정:**

    **analysis.spec.ts:**
    - AI 분석 관련 테스트에 test.setTimeout(60000) 추가
    - 페이지 네비게이션 후 waitForSelector 사용
    - 'text=MBTI' → '[data-testid="mbti-tab"]' (이미 28-05-A에서 변경됨)
    - 'text=관상' → '[data-testid="physiognomy-tab"]' (이미 28-05-A에서 변경됨)
    - 'text=사주/성명학' → '[data-testid="saju-tab"]' (이미 28-05-A에서 변경됨)

    각 AI 분석 테스트 시작 부분에:
    ```typescript
    test.setTimeout(60000); // AI 분석은 최대 60초 대기
    ```

    **counseling.spec.ts:**
    - 상담 관련 테스트에 적절한 waitFor 설정 추가
    - 페이지 로딩 대기: await page.waitForLoadState('domcontentloaded')
    - 모달이 열릴 때까지 대기: await page.waitForSelector('[data-testid="counseling-modal"]', { state: 'visible', timeout: 10000 })

    **teacher.spec.ts:**
    - 팀 관련 테스트에 적절한 타임아웃 설정 추가
    - API 호출 후 대기 시간 증가

    **구체적 수정 사항:**
    1. tests/e2e/analysis.spec.ts의 각 AI 분석 테스트 시작 부분에 test.setTimeout(60000) 추가
    2. 페이지 네비게이션 후 waitForSelector 사용하여 요소 로딩 대기
    3. data-testid 셀렉터를 사용하여 안정적인 요소 선택 보장
  </action>
  <verify>
    grep -n "test.setTimeout\|timeout.*60000" playwright.config.ts tests/e2e/analysis.spec.ts tests/e2e/counseling.spec.ts tests/e2e/teacher.spec.ts
  </verify>
  <done>
    playwright.config.ts에 timeout: 60000이 설정되고, AI 분석 테스트에 test.setTimeout(60000)이 추가되며, 복잡한 페이지 테스트가 타임아웃 없이 실행됨
  </done>
</task>

<task type="auto">
  <name>E2E 테스트 실행 및 커버리지 확인</name>
  <files>
    playwright-report/index.html
    .planning/phases/28-integration-verification-&-test-alignment/TEST-COVERAGE.md
  </files>
  <action>
    모든 수정 사항(28-05-A data-testid 추가, 28-05-B API 구현, 28-05-C 타임아웃 최적화)을 적용한 후 E2E 테스트를 실행하고 커버리지를 확인하세요:

    1. 개발 서버 시작 (백그라운드):
       npm run dev &
       DEV_SERVER_PID=$!
       echo "Dev server started with PID: $DEV_SERVER_PID"

    2. 서버가 준비될 때까지 대기 (최대 30초):
       timeout 30 bash -c 'until curl -s http://localhost:3000 > /dev/null; do sleep 1; done' || echo "Server start timeout"

    3. E2E 테스트 실행:
       npm run test:e2e

    4. 결과 분석:
       - 통과한 테스트 수 확인
       - 실패한 테스트의 원인 분류 (셀렉터, 타임아웃, API, 기타)
       - 목표: 87개 중 44개 이상 통과 (50% 이상)

    5. 개발 서버 종료:
       kill $DEV_SERVER_PID 2>/dev/null || true

    6. TEST-COVERAGE.md 업데이트:
       - 새로운 커버리지 기록 (통과/실패 수, 통과율)
       - 여전히 실패하는 테스트 목록과 원인
       - 다음 개선 사항 제안

    7. 실패한 테스트가 여전히 있다면:
       - 셀렉터 관련: 해당 data-testid 추가 여부 확인
       - 타임아웃 관련: 추가 타임아웃 설정 필요
       - API 관련: 엔드포인트 구현 및 동작 확인
       - 기타: 원인 분석 및 기록

    **주의:** 이 작업은 모든 선행 작업(28-05-A, 28-05-B)이 완료된 후 실행해야 정확한 커버리지를 측정할 수 있습니다.
  </action>
  <verify>
    # 테스트 통과율 확인
    npm run test:e2e 2>&1 | grep -E "passed|failed" | tail -5

    # TEST-COVERAGE.md 업데이트 확인
    grep -E "통과율|passed|failed" .planning/phases/28-integration-verification-&-test-alignment/TEST-COVERAGE.md | tail -10
  </verify>
  <done>
    E2E 테스트 통과율이 50% 이상 달성하고, TEST-COVERAGE.md가 업데이트되며, 남은 실패 테스트의 원인이 문서화됨
  </done>
</task>

</tasks>

<verification>
1. playwright.config.ts에 timeout: 60000이 설정됨
2. AI 분석 테스트에 test.setTimeout(60000)이 추가됨
3. E2E 테스트가 실행되고 결과가 생성됨
4. 테스트 통과율이 50% 이상 달성됨
5. TEST-COVERAGE.md에 최신 커버리지가 기록됨
6. 실패한 테스트의 원인이 분류되어 기록됨
</verification>

<success_criteria>
1. E2E 테스트 통과율 50% 이상 (현재 20.7% → 목표 50%)
2. Admin 페이지 12개 테스트 중 6개 이상 통과
3. Analysis 테스트 7개 중 4개 이상 통과
4. Student/Counseling 테스트 통과율 향상
5. 타임아웃 관련 15개 테스트 실패가 해소됨
6. TEST-COVERAGE.md에 최신 커버리지 및 실패 원인이 기록됨
</success_criteria>

<output>
완료 후 `.planning/phases/28-integration-verification-&-test-alignment/28-05-C-SUMMARY.md`를 생성하세요.
</output>
