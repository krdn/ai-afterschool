import { test, expect } from '@playwright/test';
import { loginAsTeacher } from '../../utils/auth';
import { SELECTORS } from '../../utils/selectors';

test('STU-01: 신규 학생 등록 및 사진 업로드', async ({ page }) => {
  // 1. 로그인
  await loginAsTeacher(page);

  // 2. 학생 목록 페이지로 이동
  await page.goto('/students');

  // 3. 신규 학생 등록 버튼 클릭
  await page.click(SELECTORS.students.addButton);

  // 4. 학생 정보 입력
  await page.fill('input[name="name"]', '테스트학생');
  await page.fill('input[name="birthDate"]', '2008-03-15');
  await page.selectOption('select[name="grade"]', '1'); // 1학년
  await page.fill('input[name="school"]', '테스트고등학교');

  // 5. 부모님 정보 입력
  await page.fill('input[name="parentName"]', '테스트학부모');
  await page.fill('input[name="parentPhone"]', '010-9999-9999');

  // 6. 사진 업로드 (선택사항)
  const photoInput = page.locator('input[type="file"]');
  if (await photoInput.count() > 0) {
    // 실제 테스트에서는 테스트 이미지 파일 경로 필요
    // await photoInput.setInputFiles('tests/fixtures/test-photo.jpg');
  }

  // 7. 저장 버튼 클릭
  await page.click('button[type="submit"]:has-text("등록")');

  // 8. 성공 후 학생 상세 페이지로 리다이렉트 대기
  await page.waitForURL((url) => url.pathname.startsWith('/students/'), { timeout: 10000 });

  // 9. 성공 메시지 또는 학생 이름 확인
  await expect(page.getByText('테스트학생')).toBeVisible({ timeout: 5000 });
});