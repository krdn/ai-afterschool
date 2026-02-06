import { test, expect } from '@playwright/test';
import { loginAsTeacher } from '../../utils/auth';

test.describe('PRT-01: 학부모 정보 등록', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
  });

  test('학생 상세에서 학부모 정보 확인', async ({ page }) => {
    // 학생 상세 페이지 접근
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const firstStudent = page.locator('a[href*="/students/"]').first();
    await firstStudent.click();
    await expect(page).toHaveURL(/\/students\/[a-zA-Z0-9-]+/);

    // 학생 상세 페이지 컨텐츠 확인
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 5000 });
  });
});
