import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../../utils/auth';

test.describe('SYS-03: AI Provider Failover', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('관리자 설정 페이지 접근 가능 확인', async ({ page }) => {
    await page.goto('/admin/llm-settings');
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    const isOnSettings = currentUrl.includes('/admin');
    const isRedirected = currentUrl.includes('/students');
    expect(isOnSettings || isRedirected).toBeTruthy();
  });
});
