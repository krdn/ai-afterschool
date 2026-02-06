import { test, expect } from '@playwright/test';
import { loginAsTeacher } from '../../utils/auth';

test.describe('TCH-02: 선생님 본인 프로필 조회', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
  });

  test('프로필 페이지 또는 대시보드 접근 확인', async ({ page }) => {
    // 로그인 후 메인 페이지 확인
    await expect(page).toHaveURL(/\/students/);

    // 사용자 관련 UI 요소 확인
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible({ timeout: 5000 });
  });
});
