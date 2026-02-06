import { test, expect } from '@playwright/test';
import { loginAsTeacher } from '../../utils/auth';

test.describe('MAT-02: AI 자동 배정 시뮬레이션', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
  });

  test('학생 목록 페이지에서 배정 관련 UI 확인', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    // 학생 목록이 로드되는지 확인
    const studentList = page.locator('text=/학생|목록/');
    await expect(studentList.first()).toBeVisible({ timeout: 5000 });
  });
});
