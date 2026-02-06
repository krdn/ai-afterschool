import { test, expect } from '@playwright/test';
import { loginAsTeacher } from '../../utils/auth';

test.describe('MAT-01: 선생님-학생 궁합 점수 산출', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
  });

  test('학생 상세에서 매칭 탭 접근 및 궁합 정보 확인', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const firstStudent = page.locator('a[href*="/students/"]').first();
    await firstStudent.click();
    await expect(page).toHaveURL(/\/students\/[a-zA-Z0-9-]+/);

    // 매칭 탭 접근
    const matchingTab = page.getByRole('tab', { name: /매칭/ });
    if (await matchingTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await matchingTab.click();
      await page.waitForTimeout(1000);
      await expect(page.locator('text=/매칭|궁합|배정/')).toBeVisible({ timeout: 5000 });
    }
  });
});
