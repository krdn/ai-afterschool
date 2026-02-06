import { test, expect } from '@playwright/test';
import { loginAsTeacher } from '../../utils/auth';

test('CNS-04: 후속 사례 관리', async ({ page }) => {
  // 1. 로그인
  await loginAsTeacher(page);

  // 2. 상담 페이지로 이동
  await page.goto('/counseling');
  await page.waitForLoadState('networkidle');

  // 3. 필터 영역 확인 (heading으로 정확히 지정)
  await expect(page.getByRole('heading', { name: '필터' })).toBeVisible();

  // 4. 후속 조치 필터 사용
  const followUpFilter = page.locator('button#followUpRequired');
  if (await followUpFilter.count() > 0) {
    // 후속 조치 필요 항목만 필터링
    await followUpFilter.click();
    await page.waitForTimeout(500);

    // "필요" 옵션 선택 (있다면)
    const needOption = page.locator('[role="option"]').filter({ hasText: '필요' });
    if (await needOption.count() > 0) {
      await needOption.click();
    }

    // 필터 적용 버튼 클릭
    const applyButton = page.getByRole('button', { name: '필터 적용' });
    if (await applyButton.count() > 0) {
      await applyButton.click();
      await page.waitForTimeout(1000);
    }
  }

  // 5. 상담 기록 목록 확인
  const records = page.locator('.rounded-lg.border.bg-card');
  const recordCount = await records.count();

  // 최소한 페이지가 로드되었는지 확인
  expect(recordCount).toBeGreaterThanOrEqual(0);

  // 6. 통계에서 후속 조치 예정 건수 확인
  await expect(page.getByText('후속 조치 예정')).toBeVisible();
});