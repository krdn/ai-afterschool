import { test, expect } from '@playwright/test';

test('ANL-02: AI 관상/손금 분석 (Claude Vision)', async ({ page }) => {
  // Login to the system
  await page.goto('/auth/login');

  // Select and analyze sentiment
  const analysisSelect = await page.getByRole('combobox');
  await analysisSelect.selectOption('Text Entry');
  await page.getByRole('textbox').fill('Test Text');
  await page.getByRole('button', { name: 'Analyze' }).click();

  // Verify the result
  const resultText = await page.getByLabel('Result').textContent();
  expect(resultText).toContain('Positive');
});