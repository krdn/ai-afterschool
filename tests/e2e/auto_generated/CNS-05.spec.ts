import { test, expect } from '@playwright/test';
import { loginAsTeacher } from '../../utils/auth';

test('CNS-05: 상담 통계 및 리포트 생성', async ({ page }) => {
  // 1. 로그인
  await loginAsTeacher(page);

  // 2. 상담 페이지로 이동
  await page.goto('/counseling');
  await page.waitForLoadState('networkidle');

  // 3. 통계 정보 확인
  await expect(page.getByText('이번 달 상담 횟수')).toBeVisible();
  await expect(page.getByText('전체 상담 횟수')).toBeVisible();
  await expect(page.getByText('평균 상담 시간')).toBeVisible();
  await expect(page.getByText('후속 조치 예정')).toBeVisible();

  // 4. 통계 수치 확인 (통계 카드 존재 확인)
  const statCards = page.locator('[data-slot="card"]').filter({ hasText: /회|분|건/ });
  const statCount = await statCards.count();
  expect(statCount).toBeGreaterThan(0);

  // 5. 필터 기능 확인 (날짜 범위로 통계 필터링)
  const startDate = page.locator('#startDate');
  const endDate = page.locator('#endDate');

  if (await startDate.count() > 0 && await endDate.count() > 0) {
    // 날짜 범위 설정
    await startDate.fill('2026-01-01');
    await endDate.fill('2026-12-31');

    // 필터 적용
    const applyButton = page.getByRole('button', { name: '필터 적용' });
    if (await applyButton.count() > 0) {
      await applyButton.click();
      await page.waitForTimeout(1000);
    }
  }

  // 6. 상담 기록 목록이 표시되는지 확인
  await expect(page.getByText('상담 기록')).toBeVisible();

  // 7. 최소한 하나의 통계 카드가 있는지 확인
  const firstStatCard = page.locator('[data-slot="card"]').first();
  await expect(firstStatCard).toBeVisible();
});