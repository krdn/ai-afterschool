import { test, expect } from '@playwright/test';
import { loginAsTeacher } from '../../utils/auth';

test('GRD-01: 성적 추가 (Server Action)', async ({ page }) => {
  test.setTimeout(60000);

  // 1. 로그인
  await loginAsTeacher(page);

  // 2. 학생 목록 페이지로 이동
  await page.goto('/students');
  await page.waitForLoadState('networkidle');

  // 3. 첫 번째 학생 링크 찾기
  const studentLinks = page.locator('a[href^="/students/"]:not([href*="new"])');
  await expect(studentLinks.first()).toBeVisible({ timeout: 10000 });
  const studentUrl = await studentLinks.first().getAttribute('href');

  if (!studentUrl) throw new Error('학생 링크를 찾을 수 없습니다.');
  console.log(`Target Student URL: ${studentUrl}`);

  // 4. 학습 탭으로 직접 이동
  await page.goto(`${studentUrl}?tab=learning`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // 5. '성적 추가' 버튼 찾기 및 클릭
  const addGradeButton = page.getByRole('button', { name: '성적 추가' });
  await expect(addGradeButton).toBeVisible({ timeout: 10000 });
  await addGradeButton.click();

  // 6. 모달 범위 한정 및 로드 대기
  const modal = page.locator('[role="dialog"]');
  await expect(modal).toBeVisible({ timeout: 5000 });

  // 7. 성적 정보 입력

  // 과목
  const subjectInput = modal.locator('#subject');
  await expect(subjectInput).toBeVisible();
  await subjectInput.fill('수학');
  await subjectInput.dispatchEvent('input'); // React State Update

  // 점수
  const scoreInput = modal.locator('#score');
  await scoreInput.fill('85');
  await scoreInput.dispatchEvent('input');

  // 날짜
  const dateInput = modal.locator('#testDate');
  if (await dateInput.isVisible()) {
    await dateInput.fill('2026-03-15');
    await dateInput.dispatchEvent('input');
  }

  // 콤보박스 처리 (모달 내부만 검색)
  // [role="dialog"] 내부의 button[role="combobox"]
  const comboboxes = modal.locator('button[role="combobox"]');
  await expect(comboboxes.first()).toBeVisible();
  const count = await comboboxes.count();
  console.log(`Commonboxes found in modal: ${count}`);

  if (count >= 1) {
    // 첫 번째: 시험 유형 (예상)
    await comboboxes.nth(0).click();
    // 옵션 선택 (중간고사)
    const option1 = page.getByRole('option').filter({ hasText: /중간고사|기말고사|평가/ }).first();
    await expect(option1).toBeVisible();
    await option1.click();
    await page.waitForTimeout(300);
  }

  if (count >= 2) {
    // 두 번째: 학기 (예상)
    await comboboxes.nth(1).click();
    // 옵션 선택 (1학기)
    const option2 = page.getByRole('option').filter({ hasText: /1학기|2학기/ }).first();
    await expect(option2).toBeVisible();
    await option2.click();
    await page.waitForTimeout(300);
  }

  // 8. 저장 버튼 클릭
  const saveButton = modal.locator('button').filter({ hasText: /저장|Save/ });
  await saveButton.click();

  // 9. 저장 확인 (모달 닫힘)
  await expect(modal).not.toBeVisible({ timeout: 10000 });

  // 목록 업데이트 확인 (리로드를 위해 잠시 대기)
  await page.waitForTimeout(1000);
  await expect(page.locator('body')).toContainText('85');
});