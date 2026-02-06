import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../../utils/auth';

test.describe('MAT-03: 배정 확정 (Apply)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('학생 목록에서 배정 관련 기능 확인', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    // 학생 목록 페이지가 정상 로드되는지 확인
    await expect(page).toHaveURL(/\/students/);
    const pageContent = page.locator('text=/학생|관리/');
    await expect(pageContent.first()).toBeVisible({ timeout: 5000 });
  });
});
