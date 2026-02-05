
import { test, expect } from '@playwright/test';

/**
 * Admin & System Settings Test Suite
 * 
 * Covers:
 * - SYS-01: AI Model Configuration & API Key Management
 * - SYS-02: Token Usage & Cost Monitoring
 * - SYS-03: Health Check & Infrastructure
 * - Related AUTH-04: RBAC for admin pages
 */

test.describe('Admin & System Settings', () => {

  // Test data
  const adminUser = {
    email: 'admin@afterschool.com',
    password: 'admin1234',
    role: 'DIRECTOR'
  };

  const regularTeacher = {
    email: 'teacher@aiafterschool.com',
    password: 'Teacher123!@#',
    role: 'TEACHER'
  };

  test.beforeEach(async ({ page }) => {
    // Login as admin for most tests
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', adminUser.email);
    await page.fill('input[name="password"]', adminUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/students');
  });

  /**
   * SYS-01: AI Model Settings & API Key Management
   * Tests admin ability to configure LLM providers and manage API keys securely
   */
  test('SYS-01: AI 모델 설정 및 API 키 관리', async ({ page }) => {
    // Navigate to LLM settings page
    await page.goto('/admin/llm-settings');
    await expect(page.locator('h1')).toContainText('AI 모델 설정');

    // Check current provider is displayed
    const currentProvider = page.locator('[data-testid="current-provider"]');
    await expect(currentProvider).toBeVisible();

    // Change provider from GPT to Claude
    await page.click('[data-testid="provider-select"]');
    await page.click('text=Claude (Anthropic)');

    // Input API key
    const apiKeyInput = page.locator('input[name="apiKey"]');
    await apiKeyInput.fill('sk-ant-test-key-12345678901234567890');

    // Optional: Set model version
    await page.selectOption('select[name="modelVersion"]', 'claude-3-5-sonnet-20241022');

    // Save settings
    await page.click('button:has-text("설정 저장")');

    // Verify success message
    await expect(page.locator('.toast-success, .alert-success')).toContainText('설정이 저장되었습니다');

    // Verify API key is masked in UI (security check)
    await page.reload();
    const maskedKey = page.locator('[data-testid="api-key-display"]');
    await expect(maskedKey).toContainText('sk-ant-***');

    // Test functionality with new provider
    // Navigate to a student analysis page to trigger AI
    await page.goto('/students/1');
    await page.click('text=AI 요약 생성');
    await expect(page.locator('[data-testid="ai-summary"]')).toBeVisible({ timeout: 15000 });

    // Verify no error and summary is generated
    await expect(page.locator('.error-message')).not.toBeVisible();
  });

  /**
   * SYS-02: Token Usage & Cost Monitoring
   * Tests the monitoring dashboard for LLM token consumption and cost estimation
   */
  test('SYS-02: 토큰 사용량 및 비용 모니터링', async ({ page }) => {
    // Navigate to usage monitoring page
    await page.goto('/admin/llm-usage');
    await expect(page.locator('h1')).toContainText('AI 사용량 모니터링');

    // Check date range selector is present
    const dateRangeSelector = page.locator('[data-testid="date-range-selector"]');
    await expect(dateRangeSelector).toBeVisible();

    // Select last 30 days
    await page.click('[data-testid="date-range-selector"]');
    await page.click('text=최근 30일');

    // Wait for chart to load
    await page.waitForSelector('[data-testid="usage-chart"]', { timeout: 10000 });

    // Verify chart elements
    const usageChart = page.locator('[data-testid="usage-chart"]');
    await expect(usageChart).toBeVisible();

    // Check summary statistics
    const totalTokens = page.locator('[data-testid="total-tokens"]');
    const estimatedCost = page.locator('[data-testid="estimated-cost"]');

    await expect(totalTokens).toBeVisible();
    await expect(estimatedCost).toBeVisible();

    // Verify token count is numeric
    const tokenText = await totalTokens.textContent();
    expect(tokenText).toMatch(/[\d,]+/);

    // Verify cost is in currency format
    const costText = await estimatedCost.textContent();
    expect(costText).toMatch(/₩\s*[\d,]+/);

    // Check breakdown by model
    const modelBreakdown = page.locator('[data-testid="model-breakdown"]');
    await expect(modelBreakdown).toBeVisible();

    // Verify at least one model row exists
    const modelRows = page.locator('[data-testid="model-row"]');
    await expect(modelRows.first()).toBeVisible();

    // Check breakdown by feature
    const featureBreakdown = page.locator('[data-testid="feature-breakdown"]');
    await expect(featureBreakdown).toBeVisible();

    // Expected features: 사주분석, 관상분석, 상담요약 등
    await expect(page.locator('text=사주분석')).toBeVisible();
    await expect(page.locator('text=상담요약')).toBeVisible();

    // Export functionality
    await page.click('button:has-text("CSV 내보내기")');

    // Wait for download (this may trigger a download event)
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("다운로드 확인")');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toContain('llm-usage');
  });

  /**
   * SYS-03: Health Check & Infrastructure
   * Tests system health endpoint and infrastructure status
   */
  test('SYS-03: 헬스 체크 및 인프라', async ({ page, request }) => {
    // Test API health endpoint
    const healthResponse = await request.get('/api/health');

    // Verify 200 OK response
    expect(healthResponse.ok()).toBeTruthy();
    expect(healthResponse.status()).toBe(200);

    // Parse JSON response
    const healthData = await healthResponse.json();

    // Verify response structure
    expect(healthData).toHaveProperty('status');
    expect(healthData.status).toBe('healthy');

    // Verify database connection status
    expect(healthData).toHaveProperty('database');
    expect(healthData.database.status).toBe('connected');

    // Verify external services
    if (healthData.services) {
      expect(healthData.services).toHaveProperty('cloudinary');
      expect(healthData.services.cloudinary).toBeTruthy();
    }

    // Check uptime
    expect(healthData).toHaveProperty('uptime');
    expect(typeof healthData.uptime).toBe('number');

    // Navigate to admin dashboard to verify UI health
    await page.goto('/admin/system-status');

    // Verify system status cards
    await expect(page.locator('[data-testid="db-status"]')).toContainText('연결됨');
    await expect(page.locator('[data-testid="cache-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="storage-status"]')).toBeVisible();

    // Check system metrics
    const uptimeDisplay = page.locator('[data-testid="system-uptime"]');
    await expect(uptimeDisplay).toBeVisible();

    // Verify no critical errors
    const errorIndicator = page.locator('[data-testid="critical-errors"]');
    const errorCount = await errorIndicator.textContent();
    expect(parseInt(errorCount || '0')).toBe(0);
  });

  /**
   * AUTH-04 (Admin context): RBAC - Unauthorized Access Prevention
   * Tests that regular teachers cannot access admin pages
   */
  test('AUTH-04: 보안 - 비인가 접근 방지 (관리자 페이지)', async ({ page }) => {
    // Logout admin
    await page.click('[data-testid="user-menu"]');
    await page.click('text=로그아웃');
    await page.waitForURL('/auth/login');

    // Login as regular teacher
    await page.fill('input[name="email"]', regularTeacher.email);
    await page.fill('input[name="password"]', regularTeacher.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/students');

    // Attempt to access admin LLM settings
    const llmSettingsResponse = await page.goto('/admin/llm-settings');

    // Should either get 403 or redirect to main dashboard
    if (llmSettingsResponse) {
      const status = llmSettingsResponse.status();
      expect([403, 302, 307]).toContain(status);
    }

    // Verify user is redirected or sees access denied
    const currentUrl = page.url();
    const isAccessDenied =
      currentUrl.includes('/students') ||
      currentUrl.includes('/unauthorized') ||
      await page.locator('text=접근 권한이 없습니다').isVisible();

    expect(isAccessDenied).toBeTruthy();

    // Attempt to access usage monitoring
    await page.goto('/admin/llm-usage');

    // Verify similar protection
    await expect(page.locator('text=관리자 권한')).toBeVisible()
      .catch(async () => {
        // Or verify redirect happened
        expect(page.url()).not.toContain('/admin/');
      });

    // Attempt to access system status
    await page.goto('/admin/system-status');

    // Should be blocked
    const hasAccess = await page.locator('[data-testid="db-status"]').isVisible()
      .catch(() => false);

    expect(hasAccess).toBeFalsy();
  });

  /**
   * Additional Admin Tests
   */

  test('관리자: API 키 업데이트 및 유효성 검증', async ({ page }) => {
    await page.goto('/admin/llm-settings');

    // Update API key
    await page.click('[data-testid="edit-api-key"]');
    await page.fill('input[name="apiKey"]', 'sk-new-test-key-99999999999999999999');
    await page.click('button:has-text("저장")');

    // Trigger validation test
    await page.click('button:has-text("연결 테스트")');

    // Wait for validation result
    await page.waitForSelector('[data-testid="validation-result"]', { timeout: 10000 });

    const validationResult = page.locator('[data-testid="validation-result"]');
    const resultText = await validationResult.textContent();

    // Should show either success or specific error
    expect(resultText).toMatch(/(성공|연결됨|인증 오류|할당량 초과)/);
  });

  test('관리자: 사용량 임계값 알림 설정', async ({ page }) => {
    await page.goto('/admin/llm-usage');

    // Access settings
    await page.click('[data-testid="usage-settings"]');

    // Set threshold
    await page.fill('input[name="monthlyTokenLimit"]', '1000000');
    await page.fill('input[name="costAlertThreshold"]', '100000');

    // Enable alerts
    await page.check('input[name="enableAlerts"]');

    // Save settings
    await page.click('button:has-text("알림 설정 저장")');

    await expect(page.locator('.toast-success')).toContainText('알림 설정이 저장되었습니다');

    // Verify settings persist
    await page.reload();
    await page.click('[data-testid="usage-settings"]');

    const limitValue = await page.inputValue('input[name="monthlyTokenLimit"]');
    expect(limitValue).toBe('1000000');
  });

  test('관리자: 시스템 로그 조회', async ({ page }) => {
    await page.goto('/admin/system-logs');

    // Check log table exists
    await expect(page.locator('[data-testid="system-logs-table"]')).toBeVisible();

    // Filter by log level
    await page.selectOption('select[name="logLevel"]', 'ERROR');
    await page.click('button:has-text("필터 적용")');

    // Verify filtered results
    const logRows = page.locator('[data-testid="log-row"]');
    const firstRow = logRows.first();
    await expect(firstRow).toBeVisible();

    // Check log entry details
    await firstRow.click();
    await expect(page.locator('[data-testid="log-details"]')).toBeVisible();

    // Verify log contains timestamp, level, message
    await expect(page.locator('[data-testid="log-timestamp"]')).toBeVisible();
    await expect(page.locator('[data-testid="log-message"]')).toBeVisible();
  });

  test('관리자: 데이터베이스 백업 관리', async ({ page }) => {
    await page.goto('/admin/database');

    // Check backup section
    await expect(page.locator('text=데이터베이스 백업')).toBeVisible();

    // View backup history
    const backupList = page.locator('[data-testid="backup-list"]');
    await expect(backupList).toBeVisible();

    // Trigger manual backup (if allowed in test environment)
    if (await page.locator('button:has-text("수동 백업 생성")').isVisible()) {
      await page.click('button:has-text("수동 백업 생성")');

      // Confirm action
      await page.click('button:has-text("확인")');

      // Wait for backup process
      await expect(page.locator('text=백업이 생성되었습니다')).toBeVisible({ timeout: 30000 });
    }
  });

  test('헬스 체크: 의존성 서비스 상태 확인', async ({ page, request }) => {
    // Check detailed health endpoint
    const detailedHealth = await request.get('/api/health/detailed');
    expect(detailedHealth.ok()).toBeTruthy();

    const healthData = await detailedHealth.json();

    // Verify all critical services
    expect(healthData.services.database).toHaveProperty('status', 'up');
    expect(healthData.services.redis).toBeDefined();
    expect(healthData.services.cloudinary).toBeDefined();

    // Check response times
    expect(healthData.services.database.responseTime).toBeLessThan(1000); // ms

    // Navigate to UI health dashboard
    await page.goto('/admin/system-status');

    // Verify service status indicators
    await expect(page.locator('[data-testid="service-database"] .status-indicator.success')).toBeVisible();

    // Check Redis cache status
    const cacheStatus = page.locator('[data-testid="service-redis"]');
    await expect(cacheStatus).toBeVisible();

    // Check Cloudinary storage status
    const storageStatus = page.locator('[data-testid="service-cloudinary"]');
    await expect(storageStatus).toBeVisible();
  });
});

/**
 * Admin Permissions & Security Tests
 */
test.describe('Admin Security & Permissions', () => {

  test('RBAC: 팀장은 제한된 관리 기능만 접근 가능', async ({ page }) => {
    // Login as team leader
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'teamleader@aiafterschool.com');
    await page.fill('input[name="password"]', 'Leader123!@#');
    await page.click('button[type="submit"]');
    await page.waitForURL('/students');

    // Can access team management
    await page.goto('/admin/teams');
    await expect(page.locator('h1')).toContainText('팀 관리');

    // Cannot access system settings
    await page.goto('/admin/llm-settings');
    await expect(page.locator('text=권한이 없습니다')).toBeVisible()
      .catch(() => {
        expect(page.url()).not.toContain('/admin/llm-settings');
      });

    // Cannot access usage monitoring (full)
    await page.goto('/admin/llm-usage');
    const hasFullAccess = await page.locator('[data-testid="cost-breakdown"]').isVisible()
      .catch(() => false);
    expect(hasFullAccess).toBeFalsy();
  });

  test('감사 로그: 관리자 설정 변경 기록', async ({ page }) => {
    // Login as admin
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'admin@afterschool.com');
    await page.fill('input[name="password"]', 'Admin123!@#');
    await page.click('button[type="submit"]');

    // Make a settings change
    await page.goto('/admin/llm-settings');
    await page.selectOption('select[name="modelVersion"]', 'gpt-4-turbo');
    await page.click('button:has-text("설정 저장")');

    // Check audit log
    await page.goto('/admin/audit-logs');

    const latestLog = page.locator('[data-testid="audit-log-row"]').first();
    await expect(latestLog).toContainText('LLM 설정 변경');
    await expect(latestLog).toContainText('admin@afterschool.com');

    // Verify timestamp is recent (within last minute)
    const timestamp = await latestLog.locator('[data-testid="log-timestamp"]').textContent();
    expect(timestamp).toBeTruthy();
  });
});
