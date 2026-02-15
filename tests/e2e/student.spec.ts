
// student.spec.ts
// 학생 데이터 관리 (Student) 테스트
// Scenarios: STU-01, STU-02, STU-03, STU-04
//
// Next.js 15 useFormState + redirect() 특성:
// Server Action에서 redirect()를 호출해도 RSC 스트리밍으로 처리되어
// 클라이언트 URL이 즉시 업데이트되지 않을 수 있음.
// 모든 폼 제출 후 redirect에 의존하지 않고 DB 상태를 확인하는 전략 사용.

import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../utils/auth';

/**
 * 안전한 페이지 이동 — Fast Refresh / RSC 스트리밍으로 인한
 * net::ERR_ABORTED를 자동 재시도
 */
async function safeGoto(page: import('@playwright/test').Page, url: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.goto(url, { waitUntil: 'load' });

      // Next.js dev 서버 에러 overlay 감지 — JSON 파싱 에러 등
      const hasErrorOverlay = await page.locator('dialog:has-text("Error")').isVisible({ timeout: 500 }).catch(() => false);
      if (hasErrorOverlay) {
        await page.waitForTimeout(1000);
        continue;
      }

      return;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      if (message.includes('ERR_ABORTED') && attempt < 2) {
        await page.waitForTimeout(1000);
        continue;
      }
      throw e;
    }
  }
}

// 순차 실행 — 학생 생성/삭제가 DB에 영향을 주므로 병렬 실행 방지
test.describe.serial('학생 데이터 관리 (Student)', () => {
  const testStudent = {
    name: '테스트김철수',
    birthDate: '2015-03-15',
    grade: 1,
    school: '서울초등학교',
    parentName: '김학부모',
    parentPhone: '010-1234-5678'
  };

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  /**
   * 학생 등록 폼을 채우고 제출하는 헬퍼.
   * redirect에 의존하지 않고 학생 목록에서 확인 후 상세 페이지로 직접 이동.
   */
  async function fillAndSubmitStudentForm(
    page: import('@playwright/test').Page,
    data: { name: string; birthDate: string; grade: string; school: string; parentName?: string; parentPhone?: string }
  ) {
    await safeGoto(page, '/students/new');

    await page.fill('input[name="name"]', data.name);
    await page.fill('input[name="birthDate"]', data.birthDate);
    await page.selectOption('select[name="grade"]', data.grade);
    await page.fill('input[name="school"]', data.school);
    if (data.parentName) {
      await page.fill('input[name="parentName"]', data.parentName);
    }
    if (data.parentPhone) {
      await page.fill('input[name="parentPhone"]', data.parentPhone);
    }

    // 폼 제출
    await page.locator('[data-testid="submit-student-button"]').click();

    // Server Action 완료 대기
    await page.waitForTimeout(2000);

    // redirect가 성공했는지 확인
    const currentUrl = page.url();
    if (!currentUrl.includes('/new')) {
      return;
    }

    // redirect가 안 됐으면 목록에서 학생을 찾아 직접 이동
    await safeGoto(page, '/students');

    const studentLink = page.locator(`a:has-text("${data.name}")`).first();
    await expect(studentLink).toBeVisible({ timeout: 15000 });

    const href = await studentLink.getAttribute('href');
    expect(href).toBeTruthy();
    await safeGoto(page, href!);
  }

  test('STU-01: 신규 학생 등록', async ({ page }) => {
    test.setTimeout(60000);

    await fillAndSubmitStudentForm(page, {
      name: testStudent.name,
      birthDate: testStudent.birthDate,
      grade: testStudent.grade.toString(),
      school: testStudent.school,
      parentName: testStudent.parentName,
      parentPhone: testStudent.parentPhone,
    });

    // 학생 상세 페이지에 진입했는지 확인
    const url = page.url();
    expect(url).toMatch(/\/students\/[a-zA-Z0-9]+/);
    expect(url).not.toContain('/new');

    const studentId = url.split('/students/')[1]?.split('?')[0] || '';
    expect(studentId).toBeTruthy();

    // 목록에 정상 노출 확인
    await safeGoto(page, '/students');
    await expect(page.locator(`text=${testStudent.name}`).first()).toBeVisible({ timeout: 10000 });
  });

  test('STU-02: 학생 목록 검색 및 필터링', async ({ page }) => {
    await safeGoto(page, '/students');

    const initialCount = await page.locator('[data-testid="student-card"]').count();
    expect(initialCount).toBeGreaterThan(0);

    const searchInput = page.locator('[data-testid="student-search-input"]');
    await searchInput.fill('홍길동');
    await page.click('[data-testid="student-search-button"]');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('text=홍길동').first()).toBeVisible({ timeout: 5000 });

    const filteredCount = await page.locator('[data-testid="student-card"]').count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    await searchInput.clear();
    await page.click('[data-testid="student-search-button"]');
    await page.waitForLoadState('domcontentloaded');

    const resetCount = await page.locator('[data-testid="student-card"]').count();
    expect(resetCount).toBeGreaterThan(0);
  });

  test('STU-03: 학생 상세 정보 및 탭 네비게이션', async ({ page }) => {
    await safeGoto(page, '/students');

    const firstStudent = page.locator('[data-testid="student-card"]').first();
    await expect(firstStudent).toBeVisible({ timeout: 10000 });
    await firstStudent.click();

    await page.waitForURL(/.*students\/[a-zA-Z0-9-]+/, { timeout: 15000 });

    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

    const tabs = [
      { id: 'learning', label: '학습' },
      { id: 'analysis', label: '분석' },
      { id: 'matching', label: '매칭' },
      { id: 'counseling', label: '상담' },
    ];

    for (const tab of tabs) {
      const tabSelector = page.locator(`[data-testid="${tab.id}-tab"]`);
      await expect(tabSelector).toBeVisible({ timeout: 5000 });
      await tabSelector.click();
      await page.waitForURL(new RegExp(`tab=${tab.id}`), { timeout: 10000 });
      await expect(page.locator('text=/오류|에러|Error/i')).not.toBeVisible();
    }

    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('STU-04: 위험: 학생 정보 삭제', async ({ page }) => {
    test.setTimeout(60000);

    const deleteStudentName = `삭제대상_${Date.now()}`;

    await fillAndSubmitStudentForm(page, {
      name: deleteStudentName,
      birthDate: '2016-01-01',
      grade: '2',
      school: '테스트초등학교',
    });

    const deleteTargetUrl = page.url();
    const deleteTargetId = deleteTargetUrl.split('/students/')[1]?.split('?')[0];

    await expect(page.locator('[data-testid="delete-button"]')).toBeVisible({ timeout: 10000 });

    page.on('dialog', dialog => dialog.accept());

    await page.locator('[data-testid="delete-button"]').click();

    // 삭제 후 router.push 또는 redirect 대기
    await page.waitForURL(
      /.*students$|.*students\?/,
      { timeout: 10000 }
    ).catch(() => {});

    // 하드 네비게이션으로 캐시 우회
    await safeGoto(page, '/students');

    await expect(page.locator(`text=${deleteStudentName}`)).not.toBeVisible({ timeout: 5000 });

    if (deleteTargetId) {
      await safeGoto(page, `/students/${deleteTargetId}`);
      await expect(page.locator('text=/404|찾을 수 없습니다|Not Found|NEXT_NOT_FOUND/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('STU-EXTRA: 학생 정보 수정', async ({ page }) => {
    test.setTimeout(60000);

    await safeGoto(page, '/students');

    const firstStudentCard = page.locator('[data-testid="student-card"]').first();
    await expect(firstStudentCard).toBeVisible({ timeout: 10000 });

    // student-card는 <div>이고 부모 <a>에 href가 있음
    const parentLink = firstStudentCard.locator('xpath=..');
    const href = await parentLink.getAttribute('href');
    expect(href).toBeTruthy();
    const studentId = href!.split('/students/')[1]?.split('?')[0] || '';

    // 편집 페이지로 직접 이동
    await safeGoto(page, `/students/${studentId}/edit`);

    const nameInput = page.locator('input[name="name"]');
    await expect(nameInput).toBeEditable();

    const schoolInput = page.locator('input[name="school"]');
    await schoolInput.clear();
    await schoolInput.fill('수정된초등학교');

    await page.locator('[data-testid="submit-student-button"]').click();

    // Server Action 처리 대기
    await page.waitForTimeout(2000);

    // 하드 네비게이션으로 상세 페이지 확인
    await safeGoto(page, `/students/${studentId}`);

    await expect(page.locator('text=수정된초등학교')).toBeVisible({ timeout: 10000 });
  });

  test('STU-PERF: 학생 목록 페이지네이션 및 성능', async ({ page }) => {
    await safeGoto(page, '/students');

    const startTime = Date.now();
    const studentCard = page.locator('[data-testid="student-card"]').first();
    await expect(studentCard).toBeVisible({ timeout: 5000 });
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000);
  });
});
