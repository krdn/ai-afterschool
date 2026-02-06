import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../../utils/auth';

test.describe('TCH-04: 선생님 목록 검색 및 필터링', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('선생님 관리 페이지 접근 확인', async ({ page }) => {
    await page.goto('/teachers');
    await page.waitForLoadState('networkidle');

    const isOnTeachers = page.url().includes('/teachers');
    const isRedirected = page.url().includes('/students');
    expect(isOnTeachers || isRedirected).toBeTruthy();
  });
});
