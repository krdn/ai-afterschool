import { Page, expect } from '@playwright/test';

/**
 * 로그인 공통 로직
 *
 * Next.js 15 + useActionState 조합에서 Server Action redirect()가
 * 브라우저 URL을 즉시 업데이트하지 않는 문제를 우회합니다.
 * waitForURL 대신 세션 쿠키 설정을 확인한 후 직접 네비게이션합니다.
 */
async function performLogin(page: Page, email: string, password: string) {
    await page.goto('/auth/login');
    await page.waitForLoadState('domcontentloaded');

    await page.fill('[data-testid="email-input"]', email);
    await page.fill('[data-testid="password-input"]', password);
    await page.click('[data-testid="login-button"]');

    // 세션 쿠키가 설정될 때까지 폴링 (Server Action이 쿠키를 설정하면 성공)
    await expect.poll(async () => {
        const cookies = await page.context().cookies();
        return cookies.some(c => c.name === 'session');
    }, {
        message: '로그인 후 세션 쿠키가 설정되지 않음',
        timeout: 15000,
        intervals: [500, 1000, 1000, 2000],
    }).toBeTruthy();

    // 세션 쿠키 확인 후 진행 중인 네비게이션 완료 대기
    await page.waitForLoadState('domcontentloaded').catch(() => {});

    // 직접 학생 목록으로 이동 (RSC 스트리밍 redirect와 충돌 방지)
    await page.goto('/students', { waitUntil: 'load' });
}

/**
 * 선생님 계정으로 로그인
 * 기본값: seed-test.ts의 테스트 선생님 계정 사용
 */
export async function loginAsTeacher(
    page: Page,
    email: string = 'teacher1@test.com',
    password: string = 'test1234'
) {
    await performLogin(page, email, password);
    return true;
}

/**
 * 관리자 계정으로 로그인
 * 기본값: seed-test.ts의 admin 계정 사용
 */
export async function loginAsAdmin(
    page: Page,
    email: string = 'admin@test.com',
    password: string = 'test1234'
) {
    await performLogin(page, email, password);
    return true;
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
