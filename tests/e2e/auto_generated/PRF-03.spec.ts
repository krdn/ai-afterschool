import { test } from '@playwright/test';

test.describe('PRF-03: 상담 유형 및 추이 분석', () => {
  let page;

  // Form Fill
  test.beforeEach(async ({ page }) => {
    page = page;
    await page.goto('/form'); // Assuming the form is on a specific route
    await page.querySelector('[name="Submit"]').click();
  });

  // Result Page Load
  test('Result Page Load', async () => {
    await page.waitForTimeout(2000);
  });

  // Analytics Section Access
  test('Analytics Section Access', async () => {
    const analytics = page.querySelector('[name="analytics"]');
    if (analytics) {
      await analytics.click();
    }
  });

  // Trend Analysis Check
  test('Trend Analysis Check', async () => {
    const pieChart = page.querySelector('[name="Pie Chart"]');
    const lineGraph = page.querySelector('[name="Line Graph"]');

    if (pieChart) {
      expect(pieChart.textContent).not.toBeNull();
    }

    if (lineGraph) {
      expect(lineGraph.textContent).not.toBeNull();
    }
  });
});