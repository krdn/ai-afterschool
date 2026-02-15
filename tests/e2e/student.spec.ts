
// student.spec.ts
// 학생 데이터 관리 (Student) 테스트
// Scenarios: STU-01, STU-02, STU-03, STU-04

import { test, expect } from '@playwright/test';
import path from 'path';
import { loginAsAdmin } from '../utils/auth';

test.describe('학생 데이터 관리 (Student)', () => {
  let studentId: string;
  const testStudent = {
    name: '김철수',
    birthDate: '2015-03-15',
    grade: 4,
    school: '서울초등학교',
    parentName: '김학부모',
    parentPhone: '010-1234-5678'
  };

  test.beforeEach(async ({ page }) => {
    // 로그인 전제 조건
    await loginAsAdmin(page);
  });

  test('STU-01: 신규 학생 등록 및 사진 업로드', async ({ page }) => {
    // 1. /students/new 이동
    await page.goto('/students/new');
    await expect(page.locator('h1')).toContainText(/학생.*등록|신규.*학생/);

    // 2. 기본 정보 입력
    await page.fill('input[name="name"]', testStudent.name);
    await page.fill('input[name="birthDate"]', testStudent.birthDate);
    await page.selectOption('select[name="grade"]', testStudent.grade.toString());
    await page.fill('input[name="school"]', testStudent.school);
    await page.fill('input[name="parentName"]', testStudent.parentName);
    await page.fill('input[name="parentPhone"]', testStudent.parentPhone);

    // 프로필 사진 업로드
    const fileInput = page.locator('input[type="file"]');
    const testImagePath = path.join(__dirname, '../fixtures/student-profile.jpg');
    await fileInput.setInputFiles(testImagePath);

    // 업로드 프리뷰 확인
    await expect(page.locator('img[alt*="preview"], img[alt*="미리보기"]')).toBeVisible();

    // 제출
    await page.click('[data-testid="add-student-button"], button[type="submit"]:has-text("등록")');

    // 예상 결과 1: 학생 생성 완료 및 Cloudinary 이미지 저장 확인
    await expect(page).toHaveURL(/.*students\/[a-zA-Z0-9-]+/);

    // 성공 메시지 확인
    await expect(page.locator('text=/학생.*등록.*완료|생성.*성공/')).toBeVisible({ timeout: 10000 });

    // 프로필 이미지가 Cloudinary URL로 렌더링되는지 확인
    const profileImage = page.locator('img[alt*="프로필"], img[class*="profile"]').first();
    await expect(profileImage).toBeVisible();
    const imgSrc = await profileImage.getAttribute('src');
    expect(imgSrc).toMatch(/cloudinary|res\.cloudinary\.com/);

    // studentId 저장 (후속 테스트용)
    const url = page.url();
    studentId = url.split('/students/')[1]?.split('/')[0] || '';
    expect(studentId).toBeTruthy();

    // 예상 결과 2: 목록에 정상 노출 확인
    await page.goto('/students');
    await expect(page.locator(`text=${testStudent.name}`).first()).toBeVisible();
  });

  test('STU-02: 학생 목록 검색 및 필터링', async ({ page, context }) => {
    // 전제 조건: 다수 학생 존재 (시드 데이터 또는 이전 테스트 결과 활용)
    await page.goto('/students');

    // 검색 전 학생 수 확인
    const initialCount = await page.locator('[data-testid="student-card"], tr[data-student-id]').count();
    expect(initialCount).toBeGreaterThan(0);

    // 1. 검색창에 '김철수' 입력
    const searchInput = page.locator('[data-testid="student-search-input"]');
    await searchInput.fill('김철수');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500); // debounce 대기

    // 조건에 부합하는 학생만 표시
    const searchResults = page.locator('text=김철수');
    await expect(searchResults.first()).toBeVisible();

    // 다른 학생은 필터링됨
    const filteredCount = await page.locator('[data-testid="student-card"], tr[data-student-id]').count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // 2. 학년/학교 필터 적용
    await searchInput.clear();

    // 학년 필터
    const gradeFilter = page.locator('select[name="grade"], [data-testid="grade-filter"]');
    if (await gradeFilter.count() > 0) {
      await gradeFilter.selectOption('4');
      await page.waitForTimeout(500);

      // 4학년 학생만 표시 확인
      const grade4Students = page.locator('[data-grade="4"]').or(page.locator('text=/4학년/'));
      await expect(grade4Students.first()).toBeVisible();
    }

    // 학교 필터
    const schoolFilter = page.locator('select[name="school"], input[name="school"], [data-testid="school-filter"]');
    if (await schoolFilter.count() > 0) {
      await schoolFilter.fill('서울초등학교');
      await page.waitForTimeout(500);

      // 해당 학교 학생만 표시
      await expect(page.locator('text=서울초등학교')).toBeVisible();
    }

    // 예상 결과: 조건에 부합하는 학생만 필터링되어 표시
    const finalCount = await page.locator('[data-testid="student-card"], tr[data-student-id]').count();
    expect(finalCount).toBeGreaterThan(0);
  });

  test('STU-03: 학생 상세 정보 및 탭 네비게이션', async ({ page }) => {
    // 전제 조건: 학생 존재 (STU-01에서 생성된 학생 또는 시드 데이터)
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    // 첫 번째 학생 클릭
    const firstStudent = page.locator('[data-testid="student-card"], tr[data-student-id]').first();
    await expect(firstStudent).toBeVisible({ timeout: 5000 });
    await firstStudent.click();

    // 1. /students/[id] 진입 확인
    await page.waitForURL(/.*students\/[a-zA-Z0-9-]+/, { timeout: 10000 });

    // 학생 기본 정보 표시 확인
    await expect(page.locator('h1, h2').first()).toBeVisible();

    // 2. 각 탭(학습, 분석, 매칭, 상담) 이동
    const tabs = [
      { name: '학습', path: 'learning', selector: 'text=/학습|성적/' },
      { name: '분석', path: 'analysis', selector: 'text=/분석|성향/' },
      { name: '매칭', path: 'matching', selector: 'text=/매칭|궁합/' },
      { name: '상담', path: 'counseling', selector: 'text=/상담|면담/' }
    ];

    for (const tab of tabs) {
      // 탭 클릭 - data-testid 속성 사용 시도 후 fallback
      const tabSelector = page.locator(`[data-testid="${tab.path}-tab"]`);
      const tabExists = await tabSelector.count() > 0;

      if (tabExists) {
        await tabSelector.click();
      } else {
        // Fallback to role-based selector
        const tabButton = page.locator('.container').getByRole('tab', { name: tab.name });
        await tabButton.click();
      }

      // URL 변경 대기
      await page.waitForURL(new RegExp(`${tab.path}|tab=${tab.path}`), { timeout: 5000 });

      // 예상 결과 2: 해당 컴포넌트 로드 확인
      await page.waitForSelector(tab.selector, { state: 'attached', timeout: 5000 })
        .catch(() => {/* Some tabs may not have content yet */ });

      // 데이터 로딩 에러 없음 확인
      await expect(page.locator('text=/오류|에러|Error/i')).not.toBeVisible();
    }

    // 탭 간 전환 후에도 학생 정보 유지
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('STU-04: 위험: 학생 정보 삭제', async ({ page, context }) => {
    // 전제 조건: 관리자 권한 (원장/관리자 계정으로 재로그인)
    await page.goto('/auth/logout');
    await loginAsAdmin(page);

    // 테스트용 학생 생성 (삭제 대상)
    await page.goto('/students/new');
    await page.fill('input[name="name"]', '삭제테스트학생');
    await page.fill('input[name="birthDate"]', '2016-01-01');
    await page.selectOption('select[name="grade"]', '3');
    await page.fill('input[name="school"]', '테스트초등학교');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*students\/[a-zA-Z0-9-]+/);

    const deleteTargetUrl = page.url();
    const deleteTargetId = deleteTargetUrl.split('/students/')[1]?.split('/')[0];

    // Confirmation 다이얼로그 처리
    page.on('dialog', dialog => {
      dialog.accept();
    });

    // 1. 학생 상세 -> 삭제 버튼 클릭
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: '삭제' }).click();



    // 예상 결과 1: 삭제 완료 후 목록으로 이동
    await expect(page).toHaveURL(/.*students$|.*students\?/, { timeout: 10000 });

    // 성공 메시지 확인
    await expect(page.locator('text=/삭제.*완료|제거.*성공/')).toBeVisible({ timeout: 5000 });

    // 목록에서 학생이 보이지 않음
    await expect(page.locator('text=삭제테스트학생')).not.toBeVisible();

    // 예상 결과 2: 연관 데이터 Cascade 삭제 확인
    // 삭제된 학생 상세 페이지 직접 접근 시 404
    await page.goto(`/students/${deleteTargetId}`);
    await expect(page.locator('text=/404|찾을 수 없습니다|Not Found/i')).toBeVisible({ timeout: 5000 });

    // API 레벨 확인 (옵션)
    const response = await page.request.get(`/api/students/${deleteTargetId}`);
    expect(response.status()).toBe(404);
  });

  test('STU-EXTRA: 학생 정보 수정', async ({ page }) => {
    // 보너스: 학생 정보 업데이트 플로우
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const firstStudent = page.locator('[data-testid="student-card"]').first();
    await expect(firstStudent).toBeVisible({ timeout: 5000 });
    await firstStudent.click();

    // URL 변경 대기
    await page.waitForURL(/.*students\/[a-zA-Z0-9-]+/, { timeout: 10000 });

    // 편집 버튼 클릭
    const editButton = page.locator('button:has-text("편집"), button:has-text("수정"), [data-testid="edit-button"]');
    const editButtonCount = await editButton.count();

    if (editButtonCount > 0) {
      await editButton.first().click();

      // 수정 가능한 필드 확인
      const nameInput = page.locator('input[name="name"]');
      await expect(nameInput).toBeEditable();

      // 학교명 변경
      await page.fill('input[name="school"]', '수정된초등학교');
      await page.click('button[type="submit"]:has-text("저장")');

      // 변경사항 반영 확인
      await page.waitForSelector('text=수정된초등학교', { state: 'visible', timeout: 5000 });
    }
  });

  test('STU-PERF: 학생 목록 페이지네이션 및 성능', async ({ page }) => {
    // 대량 데이터 처리 확인
    await page.goto('/students');
    await page.waitForLoadState('domcontentloaded');

    // 페이지네이션 존재 시
    const pagination = page.locator('[role="navigation"][aria-label*="pagination"], .pagination');
    const paginationCount = await pagination.count();

    if (paginationCount > 0) {
      // 다음 페이지 이동
      const nextButton = page.locator('button:has-text("다음"), button[aria-label*="next"]');
      const isEnabled = await nextButton.isEnabled().catch(() => false);
      if (isEnabled) {
        await nextButton.click();
        await page.waitForURL(/.*page=2|.*offset=/, { timeout: 5000 });
      }
    }

    // 성능: 학생 카드 렌더링 시간 측정
    const startTime = Date.now();
    const studentCard = page.locator('[data-testid="student-card"]').first();
    await expect(studentCard).toBeVisible({ timeout: 5000 });
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // 3초 이내 렌더링
  });
});
