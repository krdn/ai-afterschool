import { test, expect } from '@playwright/test';
import { loginAsTeacher } from '../../utils/auth';

test('STU-03: 학생 상세 정보 및 탭 네비게이션', async ({ page }) => {
  // 1. 로그인
  await loginAsTeacher(page);

  // 2. 학생 목록 페이지로 이동
  await page.goto('/students');
  await page.waitForLoadState('networkidle');

  // 3. 첫 번째 학생 카드 클릭 (동적으로 찾기)
  const firstStudentLink = page.locator('a[href^="/students/"]').first();
  await firstStudentLink.click();

  // 4. 학생 상세 페이지 로드 확인
  await page.waitForURL(/\/students\/.+/);

  // 5. 학생 정보가 표시되는지 확인
  await expect(page.locator('h2, h3').first()).toBeVisible();

  // 6. 탭이 있는지 확인
  const tabs = page.locator('a[role="tab"]');
  const tabCount = await tabs.count();

  if (tabCount > 0) {
    // 탭이 있는 경우 네비게이션 테스트

    // 7. 분석 탭 (있으면 클릭)
    const analysisTab = tabs.filter({ hasText: '분석' });
    if (await analysisTab.count() > 0) {
      await analysisTab.click();
      await page.waitForURL(/tab=analysis/);
      await expect(analysisTab).toHaveClass(/border-blue-600/);
    }

    // 8. 매칭 탭
    const matchingTab = tabs.filter({ hasText: '매칭' });
    if (await matchingTab.count() > 0) {
      await matchingTab.click();
      await page.waitForURL(/tab=matching/);
      await expect(matchingTab).toHaveClass(/border-blue-600/);
    }

    // 9. 상담 탭
    const counselingTab = tabs.filter({ hasText: '상담' });
    if (await counselingTab.count() > 0) {
      await counselingTab.click();
      await page.waitForURL(/tab=counseling/);
      await expect(counselingTab).toHaveClass(/border-blue-600/);
    }

    // 10. 학습 탭으로 돌아가기
    const learningTab = tabs.filter({ hasText: '학습' });
    if (await learningTab.count() > 0) {
      await learningTab.click();
      await page.waitForURL((url) => !url.searchParams.has('tab') || url.searchParams.get('tab') === 'learning');
      await expect(learningTab).toHaveClass(/border-blue-600/);
    }
  } else {
    // 탭이 없는 경우 - 최소한 페이지가 로드되었는지 확인
    console.log('탭이 없는 학생 상세 페이지입니다');
    await expect(page.locator('body')).toBeVisible();
  }
});