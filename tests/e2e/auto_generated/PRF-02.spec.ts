import { test, expect } from '@playwright/test';

test('PRF-02: 팀 구성 및 전문성 분석', async ({ page }) => {
  // Login to the system
  await page.waitForSelector('login-button');
  page.getByRole('button').click();

  // Navigate to analytics module
  page.goto('/analytics/team-analysis');

  // Select team members list section
  const teamMembersList = await page.getByTestId('team-members-list');

  if (teamMembersList) {
    expect(teamMembersList).notToBeNull();
    console.log('Team members list is successfully loaded');
  } else {
    throw new Error('Could not find team members list on the analytics page');
  }
});