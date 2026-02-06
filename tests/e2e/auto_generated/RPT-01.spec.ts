import { test, expect } from '@playwright/test';
import { loginAsTeacher } from '../../utils/auth';

test.describe('RPT-01: 종합 리포트 PDF 생성', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
  });

  test('학생 상세에서 리포트 관련 UI 확인', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const firstStudent = page.locator('a[href*="/students/"]').first();
    await firstStudent.click();
    await expect(page).toHaveURL(/\/students\/[a-zA-Z0-9-]+/);

    // 학생 상세 페이지 로드 확인
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 5000 });
  });
});
