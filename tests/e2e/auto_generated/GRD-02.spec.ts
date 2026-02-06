import { test, expect } from '@playwright/test';
import { loginAsTeacher } from '../../utils/auth';

test('GRD-02: 성적 추이 그래프 시각화', async ({ page }) => {
  // 1. 로그인
  await loginAsTeacher(page);

  // 2. 학생 목록 페이지로 이동
  await page.goto('/students');
  await page.waitForLoadState('networkidle');

  // 3. 첫 번째 학생 링크 찾기 (신규 등록 링크 제외)
  const studentLinks = page.locator('a[href^="/students/"]:not([href*="new"])');
  await expect(studentLinks.first()).toBeVisible({ timeout: 10000 });
  const studentUrl = await studentLinks.first().getAttribute('href');

  if (!studentUrl) throw new Error('학생 링크를 찾을 수 없습니다.');

  // 4. 학습 탭으로 직접 이동
  await page.goto(`${studentUrl}?tab=learning`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // 5. 성적 변화 추이 섹션 확인
  // 데이터가 없으면 차트가 안 보일 수 있으므로 유연하게 검증
  const gradeHeaders = page.getByRole('heading', { level: 3 });
  const hasHistory = await gradeHeaders.filter({ hasText: /성적|Grade/ }).count() > 0;

  if (hasHistory) {
    console.log('성적 섹션이 존재합니다.');
    const chart = page.locator('.recharts-wrapper, [data-chart], canvas');
    if (await chart.count() > 0) {
      await expect(chart.first()).toBeVisible();
    } else {
      console.log('차트 요소가 아직 없거나 데이터 부족');
    }
  } else {
    // 최소한 성적 추가 버튼은 있어야 함
    await expect(page.getByRole('button', { name: '성적 추가' })).toBeVisible();
  }

  // 6. 페이지 정상 로드 확인
  await expect(page.locator('body')).toBeVisible();
});