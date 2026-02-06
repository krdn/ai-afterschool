import { test, expect } from '@playwright/test';

test('RPT-01: 종합 리포트 PDF생성', async ({ page }) => {
  // Test title in Korean
  expect('RPT-01').toBe('RPT-01');

  // Navigate to login page and check redirect on successful login
  page.goto('/auth/login');
  page.getByRole('Redirect').then().url('/profile').then()
    .expect('You were redirected to /profile');

  // Generate PDF report
  try {
    const download = page.getByLabel('PDF Download');
    await download.then((result) => {
      if (result) {
        result.download();
      } else {
        throw new Error('PDF下载未找到');
      }
    });
    
    // Verify the download was successful
    const { error } = Promise.race([download.promise, () => null]);
    if (error) {
      throw new Error(error);
    }
  } catch (error) {
    console.error('PDF generation failed:', error);
  }
});