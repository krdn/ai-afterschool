
import { test, expect } from '@playwright/test';

/**
 * Performance Analysis Test Suite
 * Tests educational performance metrics and student/parent satisfaction analysis
 */

test.describe('Performance Analysis & Statistics', () => {
  test.beforeEach(async ({ page }) => {
    // Login as teacher/admin with access to analytics
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'teacher@aiafterschool.com');
    await page.fill('input[name="password"]', 'Test1234!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('PRF-01: Track academic improvement trends', async ({ page }) => {
    // Scenario PRF-01: 성적 향상도 추적
    // Navigate to analytics dashboard
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Verify dashboard title
    await expect(page.locator('h1, h2').filter({ hasText: /성과|분석|Analytics/i })).toBeVisible();

    // Check for academic improvement graph
    const improvementChart = page.locator('[data-testid="improvement-chart"], canvas, svg').first();
    await expect(improvementChart).toBeVisible({ timeout: 10000 });

    // Verify average improvement rate display
    const improvementRate = page.locator('text=/평균.*향상률|Improvement Rate/i');
    await expect(improvementRate).toBeVisible();

    // Check for percentage value (should be number with %)
    const percentageValue = page.locator('text=/[0-9]+\.?[0-9]*%/').first();
    await expect(percentageValue).toBeVisible();

    // Verify data visualization elements
    const chartElements = page.locator('[data-testid*="chart"], .recharts-wrapper, canvas');
    await expect(chartElements.first()).toBeVisible();

    // Check for time period selector (monthly/quarterly/yearly)
    const periodSelector = page.locator('select, button').filter({ hasText: /기간|Period|월|Month/i }).first();
    if (await periodSelector.isVisible()) {
      await periodSelector.click();
      // Verify period options exist
      await expect(page.locator('text=/월간|주간|연간|Monthly|Weekly|Yearly/i').first()).toBeVisible();
    }

    // Verify student list or table with performance data
    const performanceTable = page.locator('table, [role="table"], [data-testid="performance-list"]').first();
    await expect(performanceTable).toBeVisible();

    // Check for export functionality
    const exportButton = page.locator('button').filter({ hasText: /다운로드|내보내기|Export|Download/i }).first();
    if (await exportButton.isVisible()) {
      await expect(exportButton).toBeEnabled();
    }
  });

  test('PRF-02: Submit student satisfaction survey', async ({ page }) => {
    // Scenario PRF-02: 학생 만족도 조사 제출
    // Navigate to satisfaction survey creation page
    await page.goto('/satisfaction/new');
    await page.waitForLoadState('networkidle');

    // Verify page title
    await expect(page.locator('h1, h2').filter({ hasText: /만족도|조사|Satisfaction|Survey/i })).toBeVisible();

    // Select student
    const studentSelect = page.locator('select[name="studentId"], input[placeholder*="학생"]').first();
    await studentSelect.click();
    await page.keyboard.type('김철수');
    await page.keyboard.press('Enter');
    
    // Alternative: dropdown selection
    const studentOption = page.locator('option, [role="option"]').filter({ hasText: /김철수|학생/i }).first();
    if (await studentOption.isVisible()) {
      await studentOption.click();
    }

    // Enter satisfaction score (1-5 or 1-10 scale)
    const satisfactionScore = page.locator('input[name="score"], input[type="number"]').first();
    await satisfactionScore.fill('4');

    // Alternative: rating stars
    const starRating = page.locator('[data-testid="rating-star"]').nth(3);
    if (await starRating.isVisible()) {
      await starRating.click();
    }

    // Enter feedback text
    const feedbackField = page.locator('textarea[name="feedback"], textarea[placeholder*="피드백"]').first();
    await feedbackField.fill('선생님이 친절하고 수업이 재미있습니다. 성적도 많이 올랐어요!');

    // Select satisfaction category if available
    const categorySelect = page.locator('select[name="category"]').first();
    if (await categorySelect.isVisible()) {
      await categorySelect.selectOption('교육 품질');
    }

    // Submit satisfaction survey
    const submitButton = page.locator('button[type="submit"]').filter({ hasText: /제출|저장|Submit|Save/i });
    await submitButton.click();

    // Wait for success confirmation
    await expect(page.locator('text=/성공|완료|Success|Submitted/i')).toBeVisible({ timeout: 5000 });

    // Verify data saved in StudentSatisfaction table (check redirect or message)
    await page.waitForURL(/\/satisfaction|\/analytics|\/dashboard/);

    // Navigate back to analytics to verify immediate reflection
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Verify newly submitted satisfaction data is visible
    const recentSatisfaction = page.locator('text=/김철수|최근.*만족도/i').first();
    await expect(recentSatisfaction).toBeVisible({ timeout: 5000 });

    // Check satisfaction score appears in dashboard
    const scoreDisplay = page.locator('text=/4|★★★★/').first();
    await expect(scoreDisplay).toBeVisible();
  });

  test('PRF-03: Analyze team composition', async ({ page }) => {
    // Scenario PRF-03: 팀 구성 분석
    // Assume teams exist in the system
    // Navigate to teams list
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');

    // Select first team
    const firstTeam = page.locator('[data-testid="team-card"], a[href*="/teams/"]').first();
    await firstTeam.click();
    
    // Extract team ID from URL
    await page.waitForURL(/\/teams\/[a-zA-Z0-9-]+/);
    const currentUrl = page.url();
    const teamId = currentUrl.split('/teams/')[1]?.split('/')[0];

    // Navigate to team composition analysis
    await page.goto(`/teams/${teamId}/composition`);
    await page.waitForLoadState('networkidle');

    // Verify composition page title
    await expect(page.locator('h1, h2').filter({ hasText: /팀 구성|Team Composition|분석/i })).toBeVisible();

    // Check for expertise distribution chart
    const expertiseChart = page.locator('[data-testid="expertise-chart"], canvas, svg').first();
    await expect(expertiseChart).toBeVisible({ timeout: 10000 });

    // Verify personality/tendency distribution chart
    const personalityChart = page.locator('[data-testid="personality-chart"], canvas, svg').nth(1);
    await expect(personalityChart).toBeVisible({ timeout: 10000 });

    // Check for team members list
    const membersList = page.locator('[data-testid="team-members"], table, ul').first();
    await expect(membersList).toBeVisible();

    // Verify individual member cards with expertise
    const memberCards = page.locator('[data-testid="member-card"]');
    if (await memberCards.count() > 0) {
      await expect(memberCards.first()).toBeVisible();
      
      // Check member has expertise tags
      const expertiseTags = memberCards.first().locator('text=/MBTI|사주|전문|Expertise/i');
      await expect(expertiseTags.first()).toBeVisible();
    }

    // Check for distribution statistics
    const statsSection = page.locator('[data-testid="team-stats"], section').filter({ hasText: /통계|Statistics/i }).first();
    await expect(statsSection).toBeVisible();

    // Verify MBTI type distribution if available
    const mbtiDistribution = page.locator('text=/MBTI.*분포|Type Distribution/i').first();
    if (await mbtiDistribution.isVisible()) {
      await expect(mbtiDistribution).toBeVisible();
    }

    // Check for team balance indicator
    const balanceIndicator = page.locator('text=/균형|Balance|다양성|Diversity/i').first();
    if (await balanceIndicator.isVisible()) {
      await expect(balanceIndicator).toBeVisible();
    }

    // Verify chart legends are present
    const chartLegend = page.locator('.recharts-legend, [data-testid="chart-legend"]').first();
    if (await chartLegend.isVisible()) {
      await expect(chartLegend).toBeVisible();
    }

    // Test chart interactivity (hover/click)
    const chartSegment = page.locator('rect, path, circle').filter({ has: page.locator('[data-testid*="chart"]') }).first();
    if (await chartSegment.isVisible()) {
      await chartSegment.hover();
      // Tooltip should appear
      const tooltip = page.locator('[role="tooltip"], .recharts-tooltip').first();
      await expect(tooltip).toBeVisible({ timeout: 2000 });
    }

    // Verify export composition report button
    const exportButton = page.locator('button').filter({ hasText: /내보내기|Export|리포트/i }).first();
    if (await exportButton.isVisible()) {
      await expect(exportButton).toBeEnabled();
    }
  });

  test('PRF-04: Performance dashboard loading and data integrity', async ({ page }) => {
    // Additional test: Overall performance dashboard validation
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Check multiple performance metrics are displayed
    const metricCards = page.locator('[data-testid="metric-card"], .metric, .stat-card');
    const cardCount = await metricCards.count();
    expect(cardCount).toBeGreaterThan(0);

    // Verify no error states
    await expect(page.locator('text=/Error|오류|실패/i')).not.toBeVisible();

    // Check data refresh functionality
    const refreshButton = page.locator('button').filter({ hasText: /새로고침|Refresh|갱신/i }).first();
    if (await refreshButton.isVisible()) {
      await refreshButton.click();
      await page.waitForLoadState('networkidle');
      
      // Verify data reloaded successfully
      await expect(improvementChart).toBeVisible();
    }

    // Verify date range filter if available
    const dateRangeFilter = page.locator('input[type="date"], [data-testid="date-picker"]').first();
    if (await dateRangeFilter.isVisible()) {
      await expect(dateRangeFilter).toBeEnabled();
    }

    // Test responsive behavior (optional)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    // Charts should still be visible on mobile
    const mobileChart = page.locator('canvas, svg, [data-testid*="chart"]').first();
    await expect(mobileChart).toBeVisible();
  });
});
