import { test, expect } from '@playwright/test';

test('TCH-03: 선생님 자신의 성향 분석 run', async ({ page }) => {
  await page.getByLabel('分析', 'performance');

  const performanceAnalysis = await page.locator('selector-for-performance-analysis').first();
  
  if (!performanceAnalysis) {
    throw new Error('Not found performance analysis section');
  }

  const analysisText = await performanceAnalysis.textContent();
  console.log('Current Performance Analysis:', analysisText);

  await page.goto('/auth/login');
});