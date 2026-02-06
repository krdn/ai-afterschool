import { test, expect } from '@playwright/test';
import { loginAsTeacher } from '../../utils/auth';

test.describe('TCH-03: 선생님 자신의 성향 분석', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
  });

  test('로그인 후 대시보드 접근 확인', async ({ page }) => {
    await expect(page).toHaveURL(/\/students/);

    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible({ timeout: 5000 });
  });
});
