import { test, expect } from '@playwright/test';

test('TCH-01: 관리자: 선생님 팀/역할变更', async ({ page }) => {
  // Access login page
  expect(page.goto('/auth/login'))
    .then(() => expect().containsText('로그인 화면'))

  // Change teacher role
  page.getByRole('teacher').click()
  expect(page.getByRole('save')).click()
  .then(() => expect().containsText(' guard change'))

  // Update team assignment
  page.getByLabel('팀').click()
  expect(page.getByRole('001 Elementary')).click()
  .then(() => expect().containsText(' guard update'))
});