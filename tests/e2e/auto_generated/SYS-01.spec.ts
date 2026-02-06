import { test, expect } from '@playwright/test';

test('SYS-01: AI 모델 설정 및 API 키 관리', async ({ page }) => {
  // AI model selection and API key management test
  page.goto('/auth/login'); // Access login page
  expect(page).element.contains('Remember Me').value.toBe(); // Verify remember me option exists

  page.getByLabel('.ai-model-selection').click(); // Navigate to AI model selection
  expect(page). getByRole('.selected-model').value.toBe(); // Verify selected model appears

  page.getByLabel('Add API Key').click(); // Access API key management
  page.getByPlaceholder('.api-key-input').fill('your-api-key'); // Enter API key
  page.getByRole('.api-key-submitted').click(); // Submit the API key

  expect(page).contains('API key saved successfully'); // Verify API key was saved
});