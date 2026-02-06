import { test, expect } from '@playwright/test';

test('ANL-01: 사주/성명학 계산 정확성', async ({ page }) => {
  // Login page
  await page.goto('/auth/login');

  // Fill in login details
  const emailInput = page.getByRole('email');
  emailInput.type('test@example.com');

  const passwordInput = page.getByLabel('password');
  passwordInput.type('test123');

  // Click submit button
  const submitButton = page.getByTestId('submit');
  await submitButton.click();

  // Wait for loading indicator to disappear (assuming analysis is on next page)
  await expect(page.locator('.analysis页面元素')).toBeVisible({ timeout: 5000 });

  // Check zodiac sign calculation
  const zodiacSign = page.getByLabel('zodiacSign');
  expect(zodiacSign).toHaveText('Pisces');
});