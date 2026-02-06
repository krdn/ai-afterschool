import { Page } from '@playwright/test';

/**
 * 선생님 계정으로 로그인
 */
export async function loginAsTeacher(page: Page, email: string = 'teacher1@test.com', password: string = 'test1234') {
    await page.goto('/auth/login');

    // 이메일 입력
    await page.fill('input[name="email"]', email);

    // 비밀번호 입력
    await page.fill('input[name="password"]', password);

    // 로그인 버튼 클릭
    await page.click('button[type="submit"]');

    // 로그인 완료 대기 (로그인 페이지를 벗어나면 성공)
    await page.waitForURL((url) => !url.pathname.includes('/auth/login'), { timeout: 10000 });
}

/**
 * 관리자 계정으로 로그인
 */
export async function loginAsAdmin(page: Page, email: string = 'admin@test.com', password: string = 'test1234') {
    await page.goto('/auth/login');

    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    await page.waitForURL((url) => !url.pathname.includes('/auth/login'), { timeout: 10000 });
}

/**
 * 로그아웃
 */
export async function logout(page: Page) {
    // 로그아웃 버튼 찾기 (헤더 또는 메뉴에 있을 가능성)
    const logoutButton = page.locator('button:has-text("로그아웃"), a:has-text("로그아웃")').first();

    if (await logoutButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await logoutButton.click();
        await page.waitForURL('/auth/login', { timeout: 5000 });
    } else {
        // 로그아웃 버튼이 없으면 직접 로그아웃 라우트 호출
        await page.goto('/auth/logout');
        await page.waitForURL('/auth/login', { timeout: 5000 });
    }
}

/**
 * 세션 확인 (로그인 상태 체크)
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
    try {
        // 대시보드 접근 시도
        await page.goto('/dashboard', { waitUntil: 'networkidle', timeout: 5000 });

        // 로그인 페이지로 리다이렉트되지 않았으면 로그인 상태
        return !page.url().includes('/auth/login');
    } catch {
        return false;
    }
}

/**
 * 테스트 계정 정보
 */
export const TEST_ACCOUNTS = {
    admin: {
        email: 'admin@test.com',
        password: 'test1234',
        name: '관리자',
    },
    teacher1: {
        email: 'teacher1@test.com',
        password: 'test1234',
        name: '김선생',
    },
    teacher2: {
        email: 'teacher2@test.com',
        password: 'test1234',
        name: '이선생',
    },
} as const;
