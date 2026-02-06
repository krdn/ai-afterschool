import { test, expect } from '@playwright/test';
import { loginAsTeacher } from '../../utils/auth';

test('STU-04: 학생 정보 삭제', async ({ page }) => {
  // 1. 로그인
  await loginAsTeacher(page);

  // 2. 학생 목록 페이지로 이동
  await page.goto('/students');

  // 3. 테스트용 학생 생성 (삭제할 학생)
  await page.click('a[href="/students/new"]:has-text("학생 등록")');
  await page.fill('input[name="name"]', '삭제테스트학생');
  await page.fill('input[name="birthDate"]', '2010-01-01');
  await page.selectOption('select[name="grade"]', '1');
  await page.fill('input[name="school"]', '테스트학교');
  await page.fill('input[name="parentName"]', '테스트부모');
  await page.fill('input[name="parentPhone"]', '010-0000-0000');
  await page.click('button[type="submit"]:has-text("등록")');

  // 4. 학생 상세 페이지로 이동 확인
  await page.waitForURL((url) => url.pathname.startsWith('/students/'));

  // 5. 확인 대화상자 리스너 설정 (삭제 버튼 클릭 전에 설정)
  page.once('dialog', async (dialog) => {
    expect(dialog.type()).toBe('confirm');
    expect(dialog.message()).toContain('삭제');
    await dialog.accept();
  });

  // 6. 삭제 버튼 클릭
  await page.click('button:has-text("삭제")');

  // 7. 삭제 후 대기 (데이터베이스 처리 시간)
  await page.waitForTimeout(3000);

  // 8. 수동으로 학생 목록으로 이동
  await page.goto('/students');
  await page.waitForLoadState('networkidle');

  // 9. 삭제된 학생이 목록에 없는지 확인
  const deletedStudent = page.getByText('삭제테스트학생');
  await expect(deletedStudent).toHaveCount(0);
});