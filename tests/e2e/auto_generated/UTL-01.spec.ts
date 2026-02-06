import { test, expect } from '@playwright/test';
import { loginAsTeacher } from '../../utils/auth';

test.describe('UTL-01: 유틸리티 및 엣지 케이스', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
  });

  test('학생 목록 페이지 정상 로드 확인', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/students/);
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible({ timeout: 5000 });
  });
});
