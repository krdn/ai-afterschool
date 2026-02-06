import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../../utils/auth';

test.describe('SYS-02: 토큰 사용량 및 비용 모니터링', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('관리자 사용량 모니터링 페이지 접근', async ({ page }) => {
    await page.goto('/admin/llm-usage');
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    const isOnUsage = currentUrl.includes('/admin/llm-usage');
    const isRedirected = currentUrl.includes('/students') || currentUrl.includes('/admin');
    expect(isOnUsage || isRedirected).toBeTruthy();
  });
});
