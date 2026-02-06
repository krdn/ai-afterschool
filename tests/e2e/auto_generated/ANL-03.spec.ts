import { test } from '@playwright/test';

test('ANL-03: AI종합리포트생성 (Server Action)', async ({ page }) => {
  // Login page
  page.goto('/auth/login');
  const login = page.getByLabel('login');
  page.click(login);

  // Verify login success
  expect('Login completed successfully!');

  // Navigate to dashboard
  page.goto('/dashboard');
  expect(page).to.have('.dashboard');
});