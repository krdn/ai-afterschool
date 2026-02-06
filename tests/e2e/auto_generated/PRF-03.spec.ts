import { test, expect } from '@playwright/test';
import { loginAsTeacher } from '../../utils/auth';

test.describe('PRF-03: 상담 유형 및 추이 분석', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
  });

  test('상담 페이지 접근 확인', async ({ page }) => {
    await page.goto('/counseling');
    await page.waitForLoadState('networkidle');

    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible({ timeout: 5000 });
  });
});
