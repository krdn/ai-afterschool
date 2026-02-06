import { test, expect } from '@playwright/test';
import { loginAsTeacher } from '../../utils/auth';

test('CNS-02: 신규 상담 예약 (Flow)', async ({ page }) => {
  // 1. 로그인
  await loginAsTeacher(page);

  // 2. 상담 페이지로 이동
  await page.goto('/counseling');

  // 3. 새 상담 기록 버튼 클릭
  await page.click('a[href="/counseling/new"]');
  await page.waitForURL('/counseling/new');

  // 4. 학생 선택 (button#student-select)
  await page.click('button#student-select');
  await page.waitForTimeout(1000);

  // 첫 번째 학생 선택 (role="option")
  const firstOption = page.locator('[role="option"]').first();
  await firstOption.click();

  // 폼이 나타날 때까지 대기
  await page.waitForSelector('#summary', { timeout: 5000 });

  // 5. 상담 정보 입력
  // 상담 시간 입력
  await page.fill('#duration', '45');

  // 상담 내용 요약 입력
  await page.fill('#summary', '테스트 상담 내용입니다. 학생과의 상담을 진행했습니다.');

  // 6. 저장 버튼 클릭
  await page.click('button:has-text("상담 기록 저장")');

  // 7. 저장 후 리다이렉트 확인
  await page.waitForURL((url) => url.pathname === '/counseling', { timeout: 10000 });

  // 8. 성공 확인
  await expect(page.getByText('상담 기록')).toBeVisible();
});