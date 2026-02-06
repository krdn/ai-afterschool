import { test, expect } from '@playwright/test';

test('PRF-01: 종합 성과 대시보드 확인', async ({ page }) => {
  await page.goto('/dashboard');

  // Wait for performance section to be visible
  const performanceSection = page.getByRole('region', { name: /performance|성과/i });
  await expect(performanceSection).toBeVisible();

  // Click on Performance section
  await performanceSection.click();

  // Verify Performance text is displayed
  await expect(page.getByText(/성과 분석|Performance/i)).toBeVisible();
});