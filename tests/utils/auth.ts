import { Page } from '@playwright/test';

/**
 * 선생님 계정으로 로그인
 * 기본값: seed-test.ts의 테스트 선생님 계정 사용
 */
export async function loginAsTeacher(
    page: Page,
    email: string = 'teacher1@test.com',  // seed-test.ts의 실제 계정
    password: string = 'test1234'
) {
    await page.goto('/auth/login');
    await page.waitForLoadState('domcontentloaded');

    // 이메일 입력 - data-testid 사용
    await page.fill('[data-testid="email-input"]', email);

    // 비밀번호 입력 - data-testid 사용
    await page.fill('[data-testid="password-input"]', password);

    // 로그인 버튼 클릭 - data-testid 사용
    await page.click('[data-testid="login-button"]');

    // 로그인 후 SPA 네비게이션 대기 - waitUntil: 'domcontentloaded' 필수
    await page.waitForURL((url) => !url.pathname.includes('/auth/login'), { timeout: 10000, waitUntil: 'domcontentloaded' });

    // 세션 쿠키 확인
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(c => c.name === 'session' || c.name.includes('session'));
    return sessionCookie !== undefined;
}

/**
 * 관리자 계정으로 로그인
 * 기본값: seed-test.ts의 admin 계정 사용
 */
export async function loginAsAdmin(
    page: Page,
    email: string = 'admin@test.com',  // seed-test.ts의 실제 계정
    password: string = 'test1234'
) {
    await page.goto('/auth/login');
    await page.waitForLoadState('domcontentloaded');

    // data-testid 사용하여 로그인
    await page.fill('[data-testid="email-input"]', email);
    await page.fill('[data-testid="password-input"]', password);
    await page.click('[data-testid="login-button"]');

    // 로그인 후 SPA 네비게이션 대기 - waitUntil: 'domcontentloaded' 필수
    await page.waitForURL((url) => !url.pathname.includes('/auth/login'), { timeout: 10000, waitUntil: 'domcontentloaded' });

    // 세션 쿠키 확인
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(c => c.name === 'session' || c.name.includes('session'));
    return sessionCookie !== undefined;
}

/**
 * 로그아웃
 */
export async function logout(page: Page) {
    // 로그아웃 버튼 찾기 (헤더 또는 메뉴에 있을 가능성)
    const logoutButton = page.locator('button:has-text("로그아웃"), a:has-text("로그아웃"), [aria-label*="logout" i]').first();

    const isVisible = await logoutButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
        await logoutButton.click();
        await page.waitForURL(/\/auth\/login/, { timeout: 5000, waitUntil: 'domcontentloaded' });
    } else {
        // 로그아웃 버튼이 없으면 직접 로그아웃 라우트 호출
        await page.goto('/auth/logout');
        await page.waitForURL(/\/auth\/login/, { timeout: 5000, waitUntil: 'domcontentloaded' });
    }
}

/**
 * 세션 확인 (로그인 상태 체크)
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
    try {
        // 학생 목록 페이지 접근 시도 (기본 protected route)
        await page.goto('/students', { waitUntil: 'domcontentloaded', timeout: 5000 });

        // 로그인 페이지로 리다이렉트되지 않았으면 로그인 상태
        const currentUrl = page.url();
        return !currentUrl.includes('/auth/login') && !currentUrl.includes('/auth/register');
    } catch {
        return false;
    }
}

/**
 * 테스트 계정 정보
 * prisma/seed-test.ts에 정의된 계정과 일치시켜야 함
 */
export const TEST_ACCOUNTS = {
    admin: {
        email: 'admin@test.com',  // seed-test.ts의 admin 계정
        password: 'test1234',            // seed-test.ts의 비밀번호
        name: '관리자',
        role: 'DIRECTOR',
    },
    teacher: {
        email: 'teacher1@test.com',   // seed-test.ts의 test teacher 계정
        password: 'test1234',             // seed-test.ts의 비밀번호
        name: '김선생',
        role: 'TEACHER',
    },
    // 추가 테스트 계정 (필요시 seed.ts에 추가 후 사용)
    teacher1: {
        email: 'teacher1@test.com',
        password: 'test1234',
        name: '김선생',
        role: 'TEACHER',
    },
    teacher2: {
        email: 'teacher2@test.com',
        password: 'test1234',
        name: '이선생',
        role: 'TEACHER',
    },
} as const;
