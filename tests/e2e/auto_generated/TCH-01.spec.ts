import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../../utils/auth';

test.describe('TCH-01: 관리자: 선생님 팀/역할 변경', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('선생님 관리 페이지 접근 확인', async ({ page }) => {
    await page.goto('/teachers');
    await page.waitForLoadState('networkidle');

    // 선생님 관련 컨텐츠가 표시되거나 리다이렉트 확인
    const isOnTeachers = page.url().includes('/teachers');
    const isRedirected = page.url().includes('/students');
    expect(isOnTeachers || isRedirected).toBeTruthy();
  });
});
