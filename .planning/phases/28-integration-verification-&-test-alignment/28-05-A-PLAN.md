---
phase: 28-integration-verification-&-test-alignment
plan: 05-A
type: execute
wave: 1
depends_on: [28-01, 28-02, 28-03, 28-04]
files_modified:
  - src/components/admin/tabs/logs-tab.tsx
  - src/components/admin/tabs/audit-tab.tsx
  - src/app/(dashboard)/admin/llm-settings/page.tsx
  - src/app/(dashboard)/admin/llm-usage/page.tsx
  - src/app/(dashboard)/admin/llm-usage/usage-charts.tsx
  - src/app/(dashboard)/admin/llm-usage/cost-alerts.tsx
  - src/components/students/mbti-analysis-panel.tsx
  - src/components/students/face-analysis-panel.tsx
  - src/components/students/palm-analysis-panel.tsx
  - src/components/students/saju-analysis-panel.tsx
  - src/components/students/tabs/analysis-tab.tsx
  - src/app/(dashboard)/students/page.tsx
  - src/app/(dashboard)/students/[id]/page.tsx
  - src/app/(dashboard)/counseling/page.tsx
  - src/components/counseling/ReservationCalendarView.tsx
  - src/components/counseling/CounselingSessionModal.tsx
  - tests/e2e/student.spec.ts
  - tests/e2e/admin.spec.ts
  - tests/e2e/analysis.spec.ts
autonomous: true
gap_closure: true

must_haves:
  truths:
    - "사용자가 Admin 페이지의 모든 요소를 볼 수 있다"
    - "사용자가 Analysis 탭(MBTI, 관상, 사주, 손금)을 볼 수 있다"
    - "사용자가 Student 및 Counseling 페이지의 주요 요소를 볼 수 있다"
    - "E2E 테스트가 data-testid 셀렉터로 해당 요소들을 식별할 수 있다"
  artifacts:
    - path: "src/components/admin/tabs/logs-tab.tsx"
      provides: "시스템 로그 테이블 data-testid"
      contains: "data-testid=\"system-logs-table\""
    - path: "src/components/admin/tabs/audit-tab.tsx"
      provides: "감사 로그 테이블 data-testid"
      contains: "data-testid=\"audit-logs-table\""
    - path: "src/components/students/tabs/analysis-tab.tsx"
      provides: "분석 탭 data-testid 셀렉터"
      contains: "data-testid=\"saju-tab\"|data-testid=\"mbti-tab\"|data-testid=\"face-tab\""
    - path: "tests/e2e/student.spec.ts"
      provides: "Student 테스트 파일 data-testid 셀렉터 사용"
      contains: "data-testid=\"student-search-input\"|data-testid=\"add-student-button\""
    - path: "tests/e2e/admin.spec.ts"
      provides: "Admin 테스트 파일 data-testid 셀렉터 사용"
      contains: "data-testid=\"audit-logs-table\"|data-testid=\"usage-chart\""
    - path: "tests/e2e/analysis.spec.ts"
      provides: "Analysis 테스트 파일 data-testid 셀렉터 사용"
      contains: "data-testid=\"mbti-tab\"|data-testid=\"physiognomy-tab\""
  key_links:
    - from: "tests/e2e/admin.spec.ts"
      to: "src/components/admin/tabs/audit-tab.tsx"
      via: "[data-testid=\"audit-logs-table\"] 셀렉터"
      pattern: "audit-logs-table"
    - from: "tests/e2e/admin.spec.ts"
      to: "src/app/(dashboard)/admin/llm-usage/page.tsx"
      via: "[data-testid=\"usage-chart\"] 셀렉터"
      pattern: "usage-chart"
    - from: "tests/e2e/analysis.spec.ts"
      to: "src/components/students/tabs/analysis-tab.tsx"
      via: "분석 탭 data-testid 셀렉터"
      pattern: "mbti-tab|physiognomy-tab|saju-tab"
    - from: "tests/e2e/student.spec.ts"
      to: "src/app/(dashboard)/students/page.tsx"
      via: "[data-testid=\"student-search-input\"] 셀렉터"
      pattern: "student-search-input"
    - from: "tests/e2e/student.spec.ts"
      to: "src/app/(dashboard)/counseling/page.tsx"
      via: "[data-testid=\"counseling-calendar\"] 셀렉터"
      pattern: "counseling-calendar"
---

<objective>
Admin, Analysis, Student, Counseling 페이지에 data-testid 셀렉터를 추가하여 E2E 테스트가 요소들을 식별할 수 있게 합니다.

Purpose: 셀렉터 누락으로 인한 테스트 실패(35개)를 해소하고, 테스트 파일의 text 기반 셀렉터를 안정적인 data-testid 기반으로 변경합니다.

Output: data-testid가 추가된 컴포넌트들과 data-testid 셀렉터를 사용하는 업데이트된 테스트 파일
</objective>

<execution_context>
@/home/gon/.claude/get-shit-done/workflows/execute-plan.md
@/home/gon/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/28-integration-verification-&-test-alignment/28-VERIFICATION.md
@.planning/phases/28-integration-verification-&-test-alignment/TEST-COVERAGE.md
@.planning/phases/28-integration-verification-&-test-alignment/28-04-SUMMARY.md
@.planning/phases/28-integration-verification-&-test-alignment/28-RESEARCH.md

# 갭 요약 (from VERIFICATION.md)
- 셀렉터 누락: 35개 테스트 실패
- 주요 누락 영역: Admin 페이지, Analysis 탭, Student/Counseling 페이지
</context>

<tasks>

<task type="auto">
  <name>Admin 페이지 data-testid 셀렉터 추가</name>
  <files>
    src/components/admin/tabs/logs-tab.tsx
    src/components/admin/tabs/audit-tab.tsx
    src/app/(dashboard)/admin/llm-settings/page.tsx
    src/app/(dashboard)/admin/llm-usage/page.tsx
    src/app/(dashboard)/admin/llm-usage/usage-charts.tsx
    src/app/(dashboard)/admin/llm-usage/cost-alerts.tsx
  </files>
  <action>
    다음 data-testid 속성을 각 파일에 추가하세요:

    **logs-tab.tsx:**
    - 시스템 로그 테이블: data-testid="system-logs-table"
    - 로그 행: data-testid="system-log-row"
    - 로그 타임스탬프: data-testid="log-timestamp"
    - 로그 레벨: data-testid="log-level"

    **audit-tab.tsx:**
    - 감사 로그 테이블: data-testid="audit-logs-table"
    - 감사 로그 행: data-testid="audit-log-row"
    - 로그 타임스탬프: data-testid="log-timestamp"

    **llm-settings/page.tsx:**
    - 현재 공급자 표시: data-testid="current-provider"
    - 공급자 선택: data-testid="provider-select"
    - API 키 표시: data-testid="api-key-display"

    **llm-usage/page.tsx:**
    - 사용량 차트: data-testid="usage-chart"
    - 일간 범위 선택자: data-testid="date-range-selector"
    - 총 토큰 수: data-testid="total-tokens"
    - 예상 비용: data-testid="estimated-cost"
    - 모델별 분해: data-testid="model-breakdown"
    - 기능별 분해: data-testid="feature-breakdown"
    - 사용량 설정: data-testid="usage-settings"

    **usage-charts.tsx:**
    - 차트 컨테이너에 data-testid="usage-chart" 추가 (이미 있는지 확인)

    **cost-alerts.tsx:**
    - 비용 알림 설정에 data-testid="cost-alerts" 추가

    테스트에서 참조하는 셀렉터와 일치하는지 확인하세요.
  </action>
  <verify>
    grep -r "audit-logs-table\|usage-chart\|total-tokens\|estimated-cost\|system-logs-table" src/components/admin/ src/app/\(dashboard\)/admin/
  </verify>
  <done>
    Admin 페이지에서 data-testid="audit-logs-table", "usage-chart", "total-tokens", "estimated-cost", "system-logs-table" 등이 모두 존재하고 테스트에서 정상적으로 선택됨
  </done>
</task>

<task type="auto">
  <name>Analysis 탭 data-testid 셀렉터 추가</name>
  <files>
    src/components/students/tabs/analysis-tab.tsx
    src/components/students/mbti-analysis-panel.tsx
    src/components/students/face-analysis-panel.tsx
    src/components/students/palm-analysis-panel.tsx
    src/components/students/saju-analysis-panel.tsx
  </files>
  <action>
    분석 탭의 각 패널과 컴포넌트에 data-testid를 추가하세요:

    **analysis-tab.tsx:**
    - TabsList에 이미 data-testid="analysis-sub-tabs"가 있음을 확인
    - 각 TabsTrigger에 value에 해당하는 data-testid 추가 (예: data-testid="saju-tab", data-testid="mbti-tab", data-testid="face-tab", data-testid="palm-tab")
    - "이력 보기" 버튼에 data-testid="history-button"이 이미 있음을 확인

    **mbti-analysis-panel.tsx:**
    - 헤더에 data-testid="mbti-tab"이 이미 있음
    - 직접 입력 버튼에 data-testid="direct-input-option" 추가
    - MBTI 결과 카드에 data-testid="mbti-result-card" 추가
    - MBTI 설명에 data-testid="mbti-description" 추가
    - 강점/약점에 data-testid="mbti-strengths", "mbti-weaknesses" 추가
    - 학습 스타일에 data-testid="learning-style" 추가

    **face-analysis-panel.tsx:**
    - 헤더에 data-testid="physiognomy-tab" 추가
    - 이미지 프리뷰에 data-testid="image-preview" 추가
    - AI 로딩에 data-testid="ai-loading" 추가
    - 분석 결과에 data-testid="physiognomy-result" 추가

    **palm-analysis-panel.tsx:**
    - 헤더에 data-testid="palmistry-tab" 추가
    - face-analysis와 유사한 패턴으로 셀렉터 추가

    **saju-analysis-panel.tsx:**
    - 이미 data-testid가 충분히 추가되어 있는지 확인
    - 결과 표시에 data-testid="saju-result" 추가

    테스트 파일(tests/e2e/analysis.spec.ts)에서 참조하는 셀렉터와 일치하는지 확인하세요.
  </action>
  <verify>
    grep -r "mbti-tab\|physiognomy-tab\|palmistry-tab\|saju-tab\|mbti-result-card\|physiognomy-result" src/components/students/
  </verify>
  <done>
    Analysis 탭의 모든 하위 탭(MBTI, 관상, 손금, 사주)에 data-testid가 추가되고 테스트에서 정상적으로 선택됨
  </done>
</task>

<task type="auto">
  <name>Student/Counseling 페이지 data-testid 추가 및 테스트 파일 셀렉터 업데이트</name>
  <files>
    src/app/(dashboard)/students/page.tsx
    src/app/(dashboard)/students/[id]/page.tsx
    src/app/(dashboard)/counseling/page.tsx
    src/components/counseling/ReservationCalendarView.tsx
    src/components/counseling/CounselingSessionModal.tsx
    tests/e2e/student.spec.ts
    tests/e2e/admin.spec.ts
    tests/e2e/analysis.spec.ts
  </files>
  <action>
    **Part 1: Student/Counseling 페이지에 data-testid 추가**

    **students/page.tsx:**
    - 검색 입력: data-testid="student-search-input"
    - 검색 버튼: data-testid="student-search-button"
    - 학생 등록 버튼: data-testid="add-student-button"
    - 빈 상태 메시지: data-testid="no-students-message"

    **students/[id]/page.tsx:**
    - 학생 정보 섹션에 data-testid="student-info"
    - 프로필 이미지: data-testid="profile-image" (alt 속성도 확인)
    - 보호자 정보: data-testid="parent-info"

    **counseling/page.tsx:**
    - 새 상담 기록 버튼: data-testid="new-counseling-button"
    - 상담 통계 카드에 이미 data-testid="counseling-stat-card-*"가 있는지 확인
    - 필터 섹션: data-testid="counseling-filters"

    **ReservationCalendarView.tsx:**
    - 캘린더 뷰: data-testid="counseling-calendar"
    - 날짜 셀: data-testid="calendar-date-*"
    - 예약 모달 열기 버튼: data-testid="open-reservation-modal"

    **CounselingSessionModal.tsx:**
    - 모달: data-testid="counseling-modal"
    - 저장 버튼: data-testid="save-counseling-button"

    **Part 2: 테스트 파일 셀렉터를 data-testid 기반으로 변경**

    **tests/e2e/student.spec.ts:**
    - 'input[placeholder*="검색"]' → '[data-testid="student-search-input"]'
    - 'button[type="submit"]:has-text("등록")' → '[data-testid="add-student-button"]'
    - 'text=/학생.*등록.*완료|생성.*성공/' → '[data-testid="success-toast"]' 또는 유사한 data-testid

    **tests/e2e/admin.spec.ts:**
    - text 기반 셀렉터를 data-testid로 변경:
      - 'text=LLM 설정' → 기존 h1 태그 확인
      - 'text=Claude (Anthropic)' → option 값으로 변경 고려
      - 'button:has-text("설정 저장")' → '[data-testid="save-settings-button"]' (필요시 추가)
      - 'text=/설정이 저장되었습니다/' → '[data-testid="success-toast"]' (필요시 추가)

    **tests/e2e/analysis.spec.ts:**
    - text 기반 셀렉터를 data-testid로 변경:
      - 'text=MBTI' → '[data-testid="mbti-tab"]'
      - 'text=관상' → '[data-testid="physiognomy-tab"]'
      - 'text=사주/성명학' → '[data-testid="saju-tab"]'
      - 'text=손금' → '[data-testid="palmistry-tab"]'

    각 컴포넌트에서 테스트에서 필요로 하는 셀렉터를 확인하고 추가하세요.
  </action>
  <verify>
    grep -r "student-search-input\|add-student-button\|counseling-calendar\|counseling-modal\|mbti-tab\|physiognomy-tab" src/app/\(dashboard\)/students/ src/app/\(dashboard\)/counseling/ src/components/counseling/ src/components/students/ tests/e2e/
  </verify>
  <done>
    Student, Counseling 페이지의 주요 요소에 data-testid가 추가되고, 테스트 파일(text 기반 셀렉터)가 data-testid 기반으로 변경되어 정상적으로 선택됨
  </done>
</task>

</tasks>

<verification>
1. Admin 페이지(시스템 로그, 감사 로그, LLM 설정, 사용량)에 data-testid 셀렉터가 추가됨
2. Analysis 탭(MBTI, 관상, 사주, 손금)에 data-testid가 추가됨
3. Student/Counseling 페이지에 data-testid가 추가됨
4. 테스트 파일(student.spec.ts, admin.spec.ts, analysis.spec.ts)의 text 기반 셀렉터가 data-testid로 변경됨
5. grep 명령으로 모든 data-testid가 존재하는지 확인됨
</verification>

<success_criteria>
1. Admin 페이지의 모든 data-testid 셀렉터가 존재하고 테스트에서 식별 가능
2. Analysis 탭의 모든 하위 탭에 data-testid가 존재
3. Student/Counseling 페이지의 주요 요소에 data-testid가 존재
4. 테스트 파일이 data-testid 셀렉터를 사용하도록 변경됨
5. 셀렉터 관련 35개 테스트 실패가 해소될 기반 마련
</success_criteria>

<output>
완료 후 `.planning/phases/28-integration-verification-&-test-alignment/28-05-A-SUMMARY.md`를 생성하세요.
</output>
