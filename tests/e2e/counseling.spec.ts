
import { test, expect, Page } from '@playwright/test';
import { loginAsTeacher } from '../utils/auth';

/**
 * AI AfterSchool 통합 테스트
 * 7. 상담 관리 (Counseling) - v2.1
 *
 * 학부모 상담의 예약부터 완료, 기록까지의 전체 흐름을 검증합니다.
 */

test.describe('상담 관리 (Counseling)', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();

    // 선생님 계정으로 로그인
    await loginAsTeacher(page);
  });

  test.afterEach(async () => {
    await page.close();
  });

  /**
   * CNS-01: 상담 캘린더 및 일정 확인
   * 전제 조건: 예약 데이터
   */
  test('CNS-01: 상담 캘린더 및 일정 확인', async () => {
    // 1. 상담 페이지로 이동
    await page.goto('/counseling');
    await page.waitForLoadState('domcontentloaded');

    // 2. 캘린더 탭 클릭
    const calendarTab = page.locator('[data-tab="calendar"], button:has-text("캘린더")');
    const tabExists = await calendarTab.isVisible({ timeout: 3000 });

    if (tabExists) {
      await calendarTab.click();
      // Wait for tab content to load
      await page.waitForTimeout(500);
    }

    // 3. 월간/주간 뷰 렌더링 확인
    const calendarView = page.locator('[data-testid="calendar-view"], .calendar-container');
    const viewExists = await calendarView.count() > 0;

    if (viewExists) {
      await expect(calendarView).toBeVisible();
    }

    // 4. 예약 일정이 캘린더에 표시되는지 확인
    const counselingEvents = page.locator('[data-event-type="counseling"], .calendar-event, [data-testid="counseling-session"]');
    const eventsCount = await counselingEvents.count();

    if (eventsCount > 0) {
      await expect(counselingEvents.first()).toBeVisible({ timeout: 10000 });

      // 5. 예약 항목 클릭
      await counselingEvents.first().click();

      // 6. 상세 정보 모달 표시 확인
      const detailModal = page.locator('[role="dialog"], .modal, [data-testid="counseling-detail-modal"]');
      await expect(detailModal).toBeVisible({ timeout: 5000 });

      // 7. 모달 내 상담 정보 확인 (학생명, 학부모명, 일시)
      await expect(detailModal.locator('text=/학생|Student/').first()).toBeVisible();
    }
  });

  /**
   * CNS-02: 신규 상담 예약 (Flow)
   * 전제 조건: 학부모 등록됨
   */
  test('CNS-02: 신규 상담 예약 (Flow)', async () => {
    // 1. 신규 상담 예약 페이지로 이동
    await page.goto('/counseling/new');
    await page.waitForLoadState('domcontentloaded');

    // 2. 학생 선택
    const studentSelect = page.locator('select[name="studentId"], [data-field="student"]');
    const studentExists = await studentSelect.count() > 0;

    if (studentExists) {
      await studentSelect.waitFor({ state: 'visible', timeout: 5000 });
      await studentSelect.selectOption({ index: 1 }); // 첫 번째 학생 선택

      // 3. 학부모 선택 (자동 로드되거나 수동 선택)
      const parentSelect = page.locator('select[name="parentId"], [data-field="parent"]');
      const parentExists = await parentSelect.count() > 0;

      if (parentExists) {
        await expect(parentSelect).toBeVisible();
        await parentSelect.selectOption({ index: 1 });
      }

      // 4. 상담 일시 지정
      await page.fill('input[name="date"], input[type="date"]', '2026-03-15');
      await page.fill('input[name="time"], input[type="time"]', '14:00');

      // 5. 상담 목적/메모 입력 (선택사항)
      const purposeField = page.locator('textarea[name="purpose"], input[name="notes"]');
      if (await purposeField.isVisible()) {
        await purposeField.fill('학업 성취도 및 진로 상담');
      }

      // 6. 예약 제출
      await page.click('button[type="submit"]:has-text("예약"), button:has-text("저장")');

      // 7. 성공 메시지 확인
      const successMessage = page.locator('text=/예약.*완료|성공|Success/i');
      await expect(successMessage).toBeVisible({ timeout: 5000 });

      // 8. 캘린더 페이지로 리다이렉트 확인
      await page.waitForURL('**/counseling', { timeout: 5000 });
    }
  });

  /**
   * CNS-03: 상담 완료 및 기록 작성
   * 전제 조건: 예약 존재
   */
  test('CNS-03: 상담 완료 및 기록 작성', async () => {
    // 1. 상담 목록 페이지로 이동
    await page.goto('/counseling');
    
    // 2. 예약 상태의 상담 선택
    const scheduledSession = page.locator('[data-status="SCHEDULED"], .counseling-item').first();
    await scheduledSession.click();
    
    // 3. 상담 시작 버튼 클릭
    const startButton = page.locator('button:has-text("시작"), button:has-text("Start")');
    if (await startButton.isVisible()) {
      await startButton.click();
      await page.waitForTimeout(1000);
    }
    
    // 4. 상담 완료 처리
    const completeButton = page.locator('button:has-text("완료"), button:has-text("Complete")');
    await expect(completeButton).toBeVisible();
    await completeButton.click();
    
    // 5. 상담 내용 입력 폼 확인
    const contentForm = page.locator('form[data-form="counseling-record"], [data-testid="counseling-form"]');
    await expect(contentForm).toBeVisible();
    
    // 6. 상담 내용 작성
    const contentField = page.locator('textarea[name="content"], textarea[name="notes"]');
    await contentField.fill(
      '학생의 학업 성취도는 전반적으로 양호하며, 특히 수학 과목에서 두각을 나타내고 있습니다. ' +
      '학부모님께서는 진로 선택에 대한 조언을 요청하셨으며, 이공계 진학을 권장드렸습니다. ' +
      '다음 상담에서는 구체적인 진로 로드맵을 논의하기로 하였습니다.'
    );
    
    // 7. AI 요약 요청 버튼 클릭
    const aiSummaryButton = page.locator('button:has-text("AI 요약"), button[data-action="ai-summary"]');
    if (await aiSummaryButton.isVisible()) {
      await aiSummaryButton.click();
      
      // 8. 로딩 인디케이터 확인
      const loadingIndicator = page.locator('[data-loading="true"], .spinner, text=/생성 중|Loading/i');
      await expect(loadingIndicator).toBeVisible();
      
      // 9. AI 요약 결과 대기 및 확인
      const summaryField = page.locator('textarea[name="aiSummary"], [data-field="ai-summary"]');
      await expect(summaryField).toHaveValue(/.+/, { timeout: 30000 });
    }
    
    // 10. 후속 조치 필요 여부 체크 (선택사항)
    const followUpCheckbox = page.locator('input[name="requiresFollowUp"], input[type="checkbox"]');
    if (await followUpCheckbox.isVisible()) {
      await followUpCheckbox.check();
    }
    
    // 11. 저장 버튼 클릭
    await page.click('button[type="submit"]:has-text("저장"), button:has-text("Save")');
    
    // 12. 성공 메시지 확인
    const successMessage = page.locator('text=/저장.*완료|기록.*완료|Success/i');
    await expect(successMessage).toBeVisible({ timeout: 5000 });
    
    // 13. 상태가 COMPLETED로 변경되었는지 확인
    await page.waitForTimeout(1000);
    const statusBadge = page.locator('[data-status="COMPLETED"], text=/완료|Completed/i');
    await expect(statusBadge).toBeVisible();
    
    // 14. DB 확인: CounselingSession 기록 저장 및 AI 요약문 생성
    const sessionId = await page.locator('[data-session-id]').first().getAttribute('data-session-id');
    if (sessionId) {
      const response = await page.request.get(`/api/counseling/${sessionId}`);
      expect(response.ok()).toBeTruthy();
      const sessionData = await response.json();
      expect(sessionData.status).toBe('COMPLETED');
      expect(sessionData.content).toBeTruthy();
    }
  });

  /**
   * CNS-04: 후속 조치(Follow-up) 관리
   * 전제 조건: 후속 필요 상담
   */
  test('CNS-04: 후속 조치(Follow-up) 관리', async () => {
    // 1. 기존 상담 기록에서 후속 조치 필요로 표시
    await page.goto('/counseling');
    
    // 2. 완료된 상담 중 하나 선택
    const completedSession = page.locator('[data-status="COMPLETED"]').first();
    await completedSession.click();
    
    // 3. 상세 페이지 또는 모달에서 편집 모드 진입
    const editButton = page.locator('button:has-text("편집"), button:has-text("Edit")');
    if (await editButton.isVisible()) {
      await editButton.click();
    }
    
    // 4. 후속 조치 필요 체크박스 확인 및 체크
    const followUpCheckbox = page.locator('input[name="requiresFollowUp"], input[type="checkbox"][data-field="followup"]');
    await expect(followUpCheckbox).toBeVisible();
    
    const isChecked = await followUpCheckbox.isChecked();
    if (!isChecked) {
      await followUpCheckbox.check();
    }
    
    // 5. 후속 조치 내용 입력
    const followUpNotes = page.locator('textarea[name="followUpNotes"], input[name="followUpAction"]');
    if (await followUpNotes.isVisible()) {
      await followUpNotes.fill('진로 로드맵 자료 준비 후 학부모님께 전달 예정');
    }
    
    // 6. 저장
    await page.click('button[type="submit"]:has-text("저장"), button:has-text("Save")');
    await page.waitForTimeout(1000);
    
    // 7. 메인 대시보드로 이동
    await page.goto('/students');
    
    // 8. '오늘의 후속 조치' 위젯 확인
    const followUpWidget = page.locator(
      '[data-widget="follow-up"], .follow-up-widget, text=/후속 조치|Follow.*up/i'
    );
    await expect(followUpWidget).toBeVisible({ timeout: 10000 });
    
    // 9. 위젯 내에 해당 학생/학부모 정보 노출 확인
    const followUpItem = followUpWidget.locator('.follow-up-item, [data-follow-up-id]').first();
    await expect(followUpItem).toBeVisible();
    
    // 10. 후속 조치 항목 클릭 시 상담 기록으로 이동
    await followUpItem.click();
    await page.waitForURL('**/counseling/**', { timeout: 5000 });
    
    // 11. 상세 페이지에서 후속 조치 정보 확인
    const followUpSection = page.locator('text=/후속 조치|Follow.*up/i');
    await expect(followUpSection).toBeVisible();
    await expect(page.locator('text=/진로 로드맵/i')).toBeVisible();
  });

  /**
   * 추가 테스트: 상담 취소 및 재예약
   */
  test('상담 예약 취소 및 재예약 플로우', async () => {
    // 1. 예약된 상담 선택
    await page.goto('/counseling');
    const scheduledSession = page.locator('[data-status="SCHEDULED"]').first();
    await scheduledSession.click();
    
    // 2. 취소 버튼 클릭
    const cancelButton = page.locator('button:has-text("취소"), button:has-text("Cancel")');
    await cancelButton.click();
    
    // 3. 확인 다이얼로그 처리
    page.on('dialog', async dialog => {
      expect(dialog.type()).toBe('confirm');
      await dialog.accept();
    });
    
    // 4. 취소 사유 입력 (모달이 있는 경우)
    const reasonField = page.locator('textarea[name="cancelReason"], input[name="reason"]');
    if (await reasonField.isVisible({ timeout: 2000 })) {
      await reasonField.fill('학부모님 일정 변경 요청');
      await page.click('button:has-text("확인"), button[type="submit"]');
    }
    
    // 5. 상태가 CANCELLED로 변경 확인
    await page.waitForTimeout(1000);
    const cancelledBadge = page.locator('[data-status="CANCELLED"], text=/취소|Cancelled/i');
    await expect(cancelledBadge).toBeVisible();
    
    // 6. 재예약 버튼 확인 및 클릭
    const rescheduleButton = page.locator('button:has-text("재예약"), button:has-text("Reschedule")');
    if (await rescheduleButton.isVisible()) {
      await rescheduleButton.click();
      
      // 7. 새로운 일시 선택 폼 확인
      const dateInput = page.locator('input[name="date"], input[type="date"]');
      await expect(dateInput).toBeVisible();
    }
  });

  /**
   * 추가 테스트: 상담 기록 검색 및 필터링
   */
  test('상담 기록 검색 및 필터링', async () => {
    await page.goto('/counseling');
    
    // 1. 검색창에 학생 이름 입력
    const searchInput = page.locator('input[type="search"], input[placeholder*="검색"]');
    await searchInput.fill('김철수');
    await page.waitForTimeout(500);
    
    // 2. 검색 결과 필터링 확인
    const searchResults = page.locator('.counseling-item, [data-testid="counseling-session"]');
    await expect(searchResults.first()).toBeVisible();
    
    // 3. 상태 필터 적용 (완료된 상담만)
    const statusFilter = page.locator('select[name="status"], [data-filter="status"]');
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption('COMPLETED');
      await page.waitForTimeout(500);
      
      // 4. 필터링된 결과 확인
      const completedItems = page.locator('[data-status="COMPLETED"]');
      const count = await completedItems.count();
      expect(count).toBeGreaterThan(0);
    }
    
    // 5. 날짜 범위 필터 (이번 달)
    const dateRangeFilter = page.locator('[data-filter="date-range"], select[name="dateRange"]');
    if (await dateRangeFilter.isVisible()) {
      await dateRangeFilter.selectOption('THIS_MONTH');
      await page.waitForTimeout(500);
    }
  });

  /**
   * 추가 테스트: 상담 통계 대시보드
   */
  test('상담 통계 및 분석 대시보드 조회', async () => {
    await page.goto('/counseling/analytics');
    
    // 1. 통계 카드 렌더링 확인
    const totalSessionsCard = page.locator('text=/총 상담 건수|Total Sessions/i');
    await expect(totalSessionsCard).toBeVisible();
    
    const completionRateCard = page.locator('text=/완료율|Completion Rate/i');
    await expect(completionRateCard).toBeVisible();
    
    // 2. 월별 상담 추이 차트 확인
    const monthlyChart = page.locator('[data-chart="monthly-trend"], canvas, .chart-container').first();
    await expect(monthlyChart).toBeVisible();
    
    // 3. 선생님별 상담 건수 확인
    const teacherStats = page.locator('[data-stats="teacher"], text=/선생님별/i');
    await expect(teacherStats).toBeVisible();
    
    // 4. 평균 상담 시간 통계
    const avgDuration = page.locator('text=/평균.*시간|Average Duration/i');
    await expect(avgDuration).toBeVisible();
  });

  /**
   * 추가 테스트: 상담 알림 및 리마인더
   */
  test('상담 알림 및 리마인더 확인', async () => {
    // 1. 오늘 예정된 상담이 있는 경우 알림 확인
    await page.goto('/students');
    
    // 2. 알림 뱃지 또는 위젯 확인
    const notificationBadge = page.locator('[data-notification="counseling"], .notification-badge');
    const hasCounselingToday = await notificationBadge.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (hasCounselingToday) {
      // 3. 알림 클릭 시 상담 페이지로 이동
      await notificationBadge.click();
      await page.waitForURL('**/counseling**', { timeout: 5000 });
    }
    
    // 4. 상담 1시간 전 리마인더 (시뮬레이션)
    // 실제 환경에서는 이메일/SMS 전송 로그 확인
    const upcomingWidget = page.locator('[data-widget="upcoming-counseling"], text=/예정된 상담/i');
    if (await upcomingWidget.isVisible({ timeout: 3000 })) {
      await expect(upcomingWidget).toContainText(/오늘|Today|1시간/i);
    }
  });
});
