import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
    testDir: './tests/e2e',
    // auto_generated 폴더의 문제 있는 테스트들 제외
    testIgnore: '**/auto_generated/**/*.spec.ts',
    /* Run tests in files in parallel */
    fullyParallel: true,
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,
    /* Retry on CI only */
    retries: 0,
    /* GitHub Actions runner: 2 CPU */
    workers: process.env.CI ? 2 : undefined,
    /* CI 환경: 테스트당 타임아웃 증가 (cold start + DB 쿼리 고려) */
    timeout: process.env.CI ? 60_000 : 30_000,
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: 'html',
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        /* Base URL to use in actions like `await page.goto('/')`. */
        baseURL: 'http://localhost:3000',

        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: 'retain-on-failure',
        /* 타임아웃 증가 - AI 분석 등 시간이 오래 걸리는 작업 고려 */
        actionTimeout: 60000,
        navigationTimeout: 60000,
    },

    /* Configure projects for major browsers */
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        // {
        //   name: 'firefox',
        //   use: { ...devices['Desktop Firefox'] },
        // },
        // {
        //   name: 'webkit',
        //   use: { ...devices['Desktop Safari'] },
        // },
    ],

    /* CI에서는 빌드된 앱 시작, 로컬에서는 이미 실행 중인 서버 재사용 */
    webServer: {
        command: process.env.CI ? 'npm start' : 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
    },
});
