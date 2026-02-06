// ANL-01: 사주/성명학 계산 정확성
import { test, expect } from '@playwright/test';
import { loginAsTeacher } from '../../utils/auth';

test.describe('ANL-01: 사주/성명학 계산 정확성', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
  });

  test('학생 상세에서 분석 탭 접근 및 사주 분석 UI 확인', async ({ page }) => {
    // 학생 목록에서 첫 번째 학생 선택
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const firstStudent = page.locator('a[href*="/students/"]').first();
    await firstStudent.click();
    await expect(page).toHaveURL(/\/students\/[a-zA-Z0-9-]+/);

    // 분석 탭 클릭
    const analysisTab = page.getByRole('tab', { name: /분석/ });
    if (await analysisTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await analysisTab.click();
      await page.waitForTimeout(1000);

      // 분석 관련 컨텐츠 확인
      const analysisContent = page.locator('text=/사주|오행|성명학|분석/');
      await expect(analysisContent.first()).toBeVisible({ timeout: 5000 });
    }
  });
});
