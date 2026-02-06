import { test, expect } from '@playwright/test';

async function UTL_01_EdgeCase_ServerActionFailure({ page }) {
    // Navigating to the login page
    await page.goto('/auth/login');

    // Selecting the server action element (e.g., login button)
    const element = page.getByRole('button');
    
    // Simulating a server action failure by throwing an error
    await expect(element).rejects.toThrowError('Server action failed');

    // Returning test result status
    return { status: 'FAILURE' };
}

test('UTL-01: 엣지 케이스 - 서버 액션 실패', UTL_01_EdgeCase_ServerActionFailure);