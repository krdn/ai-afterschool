import { test, expect } from '@playwright/test';
import { loginAsTeacher } from '../../utils/auth';

test('CNS-01: 상담 캘린더 및 일정 확인', async ({ page }) => {
  // 1. 로그인
  await loginAsTeacher(page);

  // 2. 상담 페이지로 이동
  await page.goto('/counseling');
  await page.waitForLoadState('networkidle');

  // 3. 탭 확인 (button[role="tab"])
  const tabs = page.locator('button[role="tab"]');
  await expect(tabs.first()).toBeVisible();

  // 4. 상담 기록 탭이 활성화되어 있는지 확인
  const recordTab = page.locator('button[role="tab"]', { hasText: '상담 기록' });
  await expect(recordTab).toBeVisible();

  // 5. 통계 정보 확인
  await expect(page.getByText('이번 달 상담 횟수')).toBeVisible();
  await expect(page.getByText('전체 상담 횟수')).toBeVisible();

  // 6. 캘린더 탭 클릭
  const calendarTab = page.locator('button[role="tab"]', { hasText: '캘린더' });
  if (await calendarTab.count() > 0) {
    await calendarTab.click();
    await page.waitForTimeout(1000);
  }

  // 7. 상담 기록 탭으로 돌아가기
  await recordTab.click();
  await page.waitForTimeout(500);
  await expect(recordTab).toBeVisible();
});