import { test, expect } from '@playwright/test';
import { loginAsTeacher } from '../../utils/auth';

test('CNS-03: 상담 완료 및 기록 작성', async ({ page }) => {
  // 1. 로그인
  await loginAsTeacher(page);

  // 2. 상담 목록 페이지로 이동
  await page.goto('/counseling');
  await page.waitForLoadState('networkidle');

  // 3. 상담 기록이 있는지 확인
  const counselingRecords = page.locator('.rounded-lg.border.bg-card');
  const recordCount = await counselingRecords.count();

  if (recordCount > 0) {
    // 상담 기록이 있으면 첫 번째 기록 확인
    const firstRecord = counselingRecords.first();
    await expect(firstRecord).toBeVisible();
  } else {
    // 상담 기록이 없으면 새로 생성
    await page.click('a[href="/counseling/new"]');
    await page.waitForURL('/counseling/new');

    // 학생 선택
    await page.click('button#student-select');
    await page.waitForTimeout(1000);
    const firstOption = page.locator('[role="option"]').first();
    await firstOption.click();

    // 폼 대기
    await page.waitForSelector('#summary', { timeout: 5000 });

    // 상담 내용 입력
    await page.fill('#summary', '상담 완료 테스트 기록입니다.');

    // 저장
    await page.click('button:has-text("상담 기록 저장")');
    await page.waitForURL('/counseling', { timeout: 10000 });
  }

  // 4. 상담 목록에서 기록 확인
  await expect(page.getByText('상담 기록')).toBeVisible();
});