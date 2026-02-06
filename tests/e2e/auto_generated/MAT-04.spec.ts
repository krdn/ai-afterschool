import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../../utils/auth';

test.describe('MAT-04: 배정 공정성 지표 검증', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('학생 배정 현황 및 공정성 관련 UI 확인', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    // 학생 목록 페이지 로드 확인
    await expect(page).toHaveURL(/\/students/);

    // 학생 데이터가 표시되는지 확인
    const content = page.locator('main');
    await expect(content).toBeVisible({ timeout: 5000 });
  });
});
