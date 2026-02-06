import { test, expect } from '@playwright/test';

test('PRT-02: 주 보호자 설정', async ({ page }) => {
  await page.open();

  // Check if the login page is loaded
  expect(page).toBeAt('/auth/login');

  // Navigate to Guardian Member settings
  await page.goto('/guardian-member');
  
  // Click on Guardian Member Settings
  await page.getByRole('Guardian Member Settings').click();
  
  // Enter Guardian ID and check the box
  await page.getByLabel('보호자ID').setValue('1234567890');
  await page.getByLabel('보호자ID').selectElement();
  
  // Save the guardian member
  await page.getByRole('guardian save').click();
  
  // Verify the guardian member is saved
  expect(page).toHaveText('Guardian Member Updated successfully.');
});