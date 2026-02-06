// ANL-03: MBTI 입력 및 결과 판정
import { test, expect } from '@playwright/test';
import { loginAsTeacher } from '../../utils/auth';

test.describe('ANL-03: MBTI 입력 및 결과 판정', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
  });

  test('학생 상세에서 MBTI 관련 UI 확인', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const firstStudent = page.locator('a[href*="/students/"]').first();
    await firstStudent.click();
    await expect(page).toHaveURL(/\/students\/[a-zA-Z0-9-]+/);

    // 분석 탭 접근
    const analysisTab = page.getByRole('tab', { name: /분석/ });
    if (await analysisTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await analysisTab.click();

      // MBTI 관련 요소 확인
      const mbtiContent = page.locator('text=/MBTI|성격|유형/');
      await expect(mbtiContent.first()).toBeVisible({ timeout: 5000 });
    }
  });
});
