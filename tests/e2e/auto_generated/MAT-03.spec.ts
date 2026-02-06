import { test, expect } from '@playwright/test';

test('MAT-03: 배정 확정 (Apply)', async ({ page }) => {
  // Access Authentication Login Page
  page.goto('/auth/login');

  // Log in to the system (this should be done externally)

  // Navigate to My Profile and click Apply Now button
  const myProfileLink = page.getByLabel('myprofile');
  myProfileLink.click();

  // Click on Apply Now button
  const applyButton = page.getByRole('button', { name: 'Apply Now' });
  applyButton.click();

  // Verify the result of application process
  expect(page.textContent).toBe('...').toString();
});