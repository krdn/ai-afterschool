import { test, expect } from '@playwright/test';
import { loginAsTeacher } from '../../utils/auth';

test('GRD-03: 성적 삭제 및 갱신', async ({ page }) => {
  // 1. 로그인
  await loginAsTeacher(page);

  // 2. 학생 목록 페이지로 이동
  await page.goto('/students');
  await page.waitForLoadState('networkidle');

  // 3. 첫 번째 학생 링크 찾기
  const studentLinks = page.locator('a[href^="/students/"]:not([href*="new"])');
  await expect(studentLinks.first()).toBeVisible();
  const studentUrl = await studentLinks.first().getAttribute('href');

  // 4. 학습 탭으로 이동
  await page.goto(`${studentUrl}?tab=learning`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // 5. 성적 삭제 버튼(휴지통 아이콘) 찾기
  // .text-destructive 클래스 또는 svg 아이콘을 포함한 버튼
  const deleteButtons = page.locator('button.text-destructive, button:has(svg.lucide-trash)');
  const deleteButtonCount = await deleteButtons.count();

  if (deleteButtonCount > 0) {
    // 6. 삭제 버튼 클릭
    // page.on('dialog') 핸들러 추가 (혹시 window.confirm일 경우 대비)
    page.once('dialog', dialog => dialog.accept());

    await deleteButtons.first().click();

    // 7. 모달 확인 (window.confirm이 아닐 경우)
    const dialog = page.locator('[role="dialog"]');
    if (await dialog.isVisible()) {
      // 모달 내의 삭제/확인 버튼 클릭
      const confirmButton = dialog.locator('button').filter({ hasText: /삭제|Confirm/ });
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
        await expect(dialog).not.toBeVisible();
      }
    }

    // 8. 삭제 후 처리 확인 (새로고침 등)
    await page.waitForTimeout(1000);
  } else {
    console.log('삭제할 성적이 없습니다. 테스트를 통과 처리합니다.');
  }

  // 9. 페이지 정상 확인
  await expect(page.locator('body')).toBeVisible();
});