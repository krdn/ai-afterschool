import { test, expect } from '@playwright/test';

test.describe('PRT-01: 학부모 정보 등록', () => {
  test('should navigate to parent registration login page and find required elements', async ({ page }) => {
    await page.goto('/auth/login');

    // Expected Parent Information fields
    const nameLabel = page.getByRole('label', { name: 'Name' });
    const emailLabel = page.getByRole('label', { name: 'Email' });

    expect(nameLabel).notToBeNull();
    expect(emailLabel).notToBeNull();
  });
});