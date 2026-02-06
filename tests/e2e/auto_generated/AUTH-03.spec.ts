import { test, expect } from '@playwright/test';

test.describe('AUTH-03: 보안: 비밀번호 재설정', () => {
  test('비밀번호 재설정 페이지 접근 및 UI 확인', async ({ page }) => {
    // 비밀번호 재설정 페이지로 이동
    await page.goto('/auth/reset-password');
    await page.waitForLoadState('networkidle');

    // 페이지 제목 확인 ("비밀번호 재설정")
    await expect(page.locator('text=비밀번호 재설정')).toBeVisible({ timeout: 5000 });

    // 안내 문구 확인
    await expect(page.locator('text=가입하신 이메일 주소를 입력해주세요')).toBeVisible();

    // 이메일 입력 필드 존재 확인
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toBeVisible();

    // 제출 버튼 확인 ("재설정 링크 받기")
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toHaveText('재설정 링크 받기');

    // 로그인 페이지 링크 확인
    await expect(page.locator('a[href="/login"]')).toBeVisible();
  });

  test('존재하지 않는 이메일로 재설정 요청 시 보안 메시지 표시', async ({ page }) => {
    // 비밀번호 재설정 페이지로 이동
    await page.goto('/auth/reset-password');
    await page.waitForLoadState('networkidle');

    // 존재하지 않는 이메일 입력
    // (보안상 존재 여부와 무관하게 동일한 성공 메시지를 표시해야 함)
    const emailInput = page.locator('input[name="email"]');
    await emailInput.fill('nonexistent@test.com');

    // 제출 버튼 클릭
    await page.click('button[type="submit"]');

    // 제출 후 로딩 상태 표시 확인 ("요청 중...")
    // Server Action 완료 후 성공 화면으로 전환됨
    // 성공 메시지: "비밀번호 재설정 링크를 이메일로 보냈어요. 이메일을 확인해주세요."
    await expect(page.locator('text=이메일을 확인해주세요')).toBeVisible({ timeout: 10000 });
  });

  test('유효하지 않은 이메일 형식 입력 시 유효성 검증', async ({ page }) => {
    // 비밀번호 재설정 페이지로 이동
    await page.goto('/auth/reset-password');
    await page.waitForLoadState('networkidle');

    // 유효하지 않은 이메일 형식 입력
    const emailInput = page.locator('input[name="email"]');
    await emailInput.fill('invalid-email');

    // 제출 버튼 클릭
    await page.click('button[type="submit"]');

    // 페이지가 재설정 페이지에 머물러 있는지 확인 (유효성 검증 실패)
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/auth/reset-password');
  });

  test('로그인 상태에서 재설정 페이지 접근 시 리다이렉트', async ({ page }) => {
    // 로그인 (seed 계정: teacher1@test.com / test1234)
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'teacher1@test.com');
    await page.fill('input[name="password"]', 'test1234');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes('/auth/login'), { timeout: 10000 });

    // 로그인 상태에서 비밀번호 재설정 페이지 접근 시도
    // middleware에서 authRoutes는 로그인 상태 시 /students로 리다이렉트
    await page.goto('/auth/reset-password');
    await page.waitForURL(/\/students/, { timeout: 10000 });
  });
});
