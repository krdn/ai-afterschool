import { test, expect } from '@playwright/test';

test('AUTH-04: 보안: 비인가 접근 방지 (RBAC)', async ({ page }) => {
  // 1. Login as standard user (Teacher) - Not Admin or Team Leader
  await page.goto('/auth/login');
  await page.fill('input[name="email"]', 'teacher@test.com');
  await page.fill('input[name="password"]', 'teacher123');
  await page.click('button[type="submit"]');

  // Wait for login to complete
  await page.waitForURL(/\/dashboard|\/students/);

  // 2. Attempt to access Admin-only page
  await page.goto('/admin');

  // 3. Verify Access Denied or Redirect
  // Common behaviors: Redirect to /dashboard, Show 403, or Login page
  const currentUrl = page.url();
  const isSafe = currentUrl.includes('/dashboard') || currentUrl.includes('/auth/login') || await page.locator('text=권한이 없습니다').isVisible();

  expect(isSafe).toBeTruthy();

  // 4. (Team Leader case mostly covered in manual tests or admin.spec.ts)
});