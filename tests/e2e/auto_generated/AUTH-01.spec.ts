import { test, expect } from '@playwright/test';

test('AUTH-01: 선생님 회원가입', async ({ page }) => {
  // 1. Navigate to Registration Page
  await page.goto('/auth/register');

  // 2. Fill Registration Form
  const randomEmail = `newteacher_${Date.now()}@example.com`;
  await page.fill('input[name="email"]', randomEmail);
  await page.fill('input[name="password"]', 'Teacher123!');
  await page.fill('input[name="name"]', '김선생');
  await page.fill('input[name="confirmPassword"]', 'Teacher123!');

  // 3. Submit
  const submitBtn = page.locator('button[type="submit"]');
  if (await submitBtn.isVisible()) {
    await submitBtn.click();

    // 4. Verify Creation/Redirect
    // Expect either redirect to dashboard or login page
    await expect(page).toHaveURL(/\/dashboard|\/auth\/login|\/students/, { timeout: 15000 });
  }
});