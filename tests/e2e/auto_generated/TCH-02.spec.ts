import { test, expect } from '@playwright/test';

test('TCH-02: 선생님의本人 프로필 조회', async ({ page }) => {
  // Navigating to the teacher profile page
  page.goto('/');

  // Selecting and verifying the teacher's profile element
  const teacherProfile = page.getByLabel('teacherProfile');
  expect(teacherProfile).notToBeNull();

  // Selecting and verifying the login button (secondary)
  const loginUser = page.getByRole('button', 'secondary');
  expect(logInButton).notToOrNull();
});