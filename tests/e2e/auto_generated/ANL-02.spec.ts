// ANL-02: AI 관상/손금 분석 (Claude Vision)
import { test, expect } from '@playwright/test';
import { loginAsTeacher } from '../../utils/auth';

test.describe('ANL-02: AI 관상/손금 분석', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
  });

  test('학생 상세에서 관상 분석 UI 확인', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const firstStudent = page.locator('a[href*="/students/"]').first();
    await firstStudent.click();
    await expect(page).toHaveURL(/\/students\/[a-zA-Z0-9-]+/);

    // 분석 탭 접근
    const analysisTab = page.getByRole('tab', { name: /분석/ });
    if (await analysisTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await analysisTab.click();
      await page.waitForTimeout(1000);
    }

    // 분석 페이지 기본 요소 확인
    await expect(page.locator('text=/분석|성향|관상|MBTI/')).toBeVisible({ timeout: 5000 });
  });
});
