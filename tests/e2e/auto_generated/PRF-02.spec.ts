import { test, expect } from '@playwright/test';
import { loginAsTeacher } from '../../utils/auth';

test.describe('PRF-02: 팀 구성 및 전문성 분석', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
  });

  test('팀 관련 페이지 접근 확인', async ({ page }) => {
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');

    // 팀 페이지 또는 리다이렉트 확인
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible({ timeout: 5000 });
  });
});
