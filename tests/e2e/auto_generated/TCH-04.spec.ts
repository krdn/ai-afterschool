import { test } from '@playwright/test';
import { expect } from '@playwright/test';

test('TCH-04: 선생님 목록 검색 및 필터링', async ({ page }) => {
  // Test title
  await page.title('선생님 데이터 관리');

  // Navigate to login page and log in
  await page.goto('/auth/login');
  expect(page.getByRole('input[type="email"]').value).toBe('test@example.com');
  await page.getByLabel('Password').send('test123');
  await page.getByRole('button[type="submit"]').click();
  
  // Navigate to lecturer list and search
  await page.goto('/lecturer/list');
  await page.waitFor('.lecturer-search');

  // Filter lecturers by university
  const universitySelect = page.getByLabel('University');
  expect(universitySelect).not.toBeNull();

  universitySelect.find('Korea National University of Science and Technology').click();

  // Select a lecturer and verify details
  const lecturerCard = page.getByRole('input[name="selected_lecturer"]');
  await page.waitFor('.lecturer-details');

  lecturerCard.find('이름: test Lecturer').click();
  expect(lecturerCard).toBeTrue();

  // Verify lecturer's information
  const nameSelect = page.getByRole('input[type="text"]');
  expect(nameSelect).not.toBeNull();

  nameSelect.find('이름: test Lecturer').value;
  
  // Logout
  await page.goto('/auth/logout');
});