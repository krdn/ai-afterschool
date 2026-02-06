import { test, expect } from '@playwright/test';

test('MAT-01: 선생님-학생 궁합 점수 산출', async ({ page }) => {
  // Navigating to login page
  page.goto('/auth/login');

  // Filling in teacher name input
  const teacherInput = page.getByLabel('teacher_name');
  teacherInput.set('John Doe');

  // Filling in student name input
  const studentInput = page.getByLabel('student_name');
  studentInput.set('Jane Smith');

  // Submitting the form
  const calculateButton = page.getByRole('button', 'calculate');
  calculateButton.click();

  // Verifying compatibility score display
  const scoreElement = page.getByText('Your compatibility score:');
  const score = scoreElement.textContent;
  
  expect(score).toBe(Number);
  expect(score).toBeGreaterThan(0);
  expect(score).toBeLessThan(100);
});