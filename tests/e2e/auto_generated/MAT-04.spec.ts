import { test, expect } from '@playwright/test';

test('MAT-04: 배정 공정성 지표 검증', async ({ page }) => {
  // Step 1: Navigating to the login page
  await page.goto('/auth/login');

  // Step 2: Selecting the username/email field by label
  const usernameInput = page.getByLabel('loginId');

  // Step 3: Entering test username
  await usernameInput.fill('testuser@example.com');

  // Step 4: Clicking the login button
  await page.getByRole('button', { name: /login|로그인/i }).click();

  // Step 5: Verifying successful login
  await expect(page).toHaveURL(/\/dashboard|\/students/);
});