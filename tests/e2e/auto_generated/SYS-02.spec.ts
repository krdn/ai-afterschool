import { test } from '@playwright/test';
import { expect } from '@playwright/test';

test('SYS-02: 토큰 사용량 및 비용 모니터링', async ({ page }) => {
  // Page context options
  page.setOptions({
    waitUntil: 'networkidle1',
  });

  // Navigate to login page
  page.goto('/auth/login');

  // Login with credentials
  page.getByLabel('login_email').fill('test@example.com');
  page.getByLabel('login_password').fill('password123');
  page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForReady();

  // Verify token usage counter and cost display
  const tokenCounter = page.getByLabel('token_usage');
  expect(tokenCounter.textContent).toBeExactly('100 / $25');

  // Check that the values haven't changed after some time
  await new Promise(resolve => setTimeout(resolve, 1000));
  expect(tokenCounter.textContent).toBeExactly('100 / $25');

  // Verify total cost display
  const costDisplay = page.getByLabel('total_cost');
  expect(costDisplay.textContent).toBeExactly('$25');
});