import { test, expect } from '@playwright/test';

test('AUTH-02: 로그인 및 세션 유지', async ({ page }) => {
  // 1. Login
  await page.goto('/auth/login');
  await page.fill('input[name="email"]', 'admin@afterschool.com'); // Using seed user
  await page.fill('input[name="password"]', 'admin1234');
  await page.click('button[type="submit"]');

  // 2. Verify Session Start
  await page.waitForURL('/students'); // Dashboard
  await expect(page.locator('text=학생 관리')).toBeVisible();

  // 3. Verify Session Persistence (Reload)
  await page.reload();
  await expect(page.locator('text=학생 관리')).toBeVisible();

  // 4. Verify Cookie exists
  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find(c => c.name.includes('session') || c.name.includes('token'));
  expect(sessionCookie).toBeDefined();
});