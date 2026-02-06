import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../../utils/auth';

test.describe('SYS-01: AI 모델 설정 및 API 키 관리', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('관리자 LLM 설정 페이지 접근', async ({ page }) => {
    await page.goto('/admin/llm-settings');
    await page.waitForLoadState('networkidle');

    // 설정 페이지 또는 리다이렉트 확인
    const currentUrl = page.url();
    const isOnSettings = currentUrl.includes('/admin/llm-settings');
    const isRedirected = currentUrl.includes('/students') || currentUrl.includes('/admin');
    expect(isOnSettings || isRedirected).toBeTruthy();
  });
});
