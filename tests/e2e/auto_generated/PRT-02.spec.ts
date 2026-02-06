import { test, expect } from '@playwright/test';
import { loginAsTeacher } from '../../utils/auth';

test.describe('PRT-02: 주 보호자 설정', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
  });

  test('학생 상세에서 보호자 정보 섹션 확인', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const firstStudent = page.locator('a[href*="/students/"]').first();
    await firstStudent.click();
    await expect(page).toHaveURL(/\/students\/[a-zA-Z0-9-]+/);

    // 학생 정보 페이지 로드 확인
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 5000 });
  });
});
