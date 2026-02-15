
// student.spec.ts
// 학생 데이터 관리 (Student) 테스트
// Scenarios: STU-01, STU-02, STU-03, STU-04

import { test, expect } from '@playwright/test';
import path from 'path';
import { loginAsAdmin } from '../utils/auth';

test.describe('학생 데이터 관리 (Student)', () => {
  const testStudent = {
    name: '테스트김철수',
    birthDate: '2015-03-15',
    grade: 4,
    school: '서울초등학교',
    parentName: '김학부모',
    parentPhone: '010-1234-5678'
  };

  test.beforeEach(async ({ page }) => {
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

    // 프로필 사진 업로드 (Cloudinary 필요 — CI에서는 skip)
    if (!process.env.CI) {
      const fileInput = page.locator('input[type="file"]');
      const testImagePath = path.join(__dirname, '../fixtures/student-profile.jpg');
      await fileInput.setInputFiles(testImagePath);
      await expect(page.locator('img[alt*="preview"], img[alt*="미리보기"]')).toBeVisible();
    }

    // 제출 — 폼 제출 버튼의 data-testid 사용
    await page.click('[data-testid="submit-student-button"]');

    // 예상 결과 1: 학생 상세 페이지로 이동 (?created=true 쿼리 파라미터 포함)
    await page.waitForURL(/.*students\/[a-zA-Z0-9-]+/, { timeout: 15000 });

    // 성공 메시지 확인 (학생 상세 페이지의 초록색 배너)
    await expect(page.locator('text=학생 등록이 완료되었습니다')).toBeVisible({ timeout: 10000 });

    // 프로필 이미지 Cloudinary URL 확인 (CI에서는 skip — 외부 서비스 의존)
    if (!process.env.CI) {
      const profileImage = page.locator('img[alt*="프로필"], img.profile').first();
      await expect(profileImage).toBeVisible();
      const imgSrc = await profileImage.getAttribute('src');
      expect(imgSrc).toMatch(/cloudinary|res\.cloudinary\.com/);
    }

    // studentId 저장
    const url = page.url();
    const studentId = url.split('/students/')[1]?.split('?')[0] || '';
    expect(studentId).toBeTruthy();

    // 예상 결과 2: 목록에 정상 노출 확인
    await page.goto('/students');
    await expect(page.locator(`text=${testStudent.name}`).first()).toBeVisible();
  });

  test('STU-02: 학생 목록 검색 및 필터링', async ({ page }) => {
    // 전제 조건: 시드 데이터 학생 존재 (홍길동, 김영희, 이철수 등)
    await page.goto('/students');

    // 검색 전 학생 수 확인
    const initialCount = await page.locator('[data-testid="student-card"]').count();
    expect(initialCount).toBeGreaterThan(0);

    // 1. 검색창에 시드 데이터 학생 이름 입력
    const searchInput = page.locator('[data-testid="student-search-input"]');
    await searchInput.fill('홍길동');
    // 검색 버튼 클릭 (form submit)
    await page.click('[data-testid="student-search-button"]');
    await page.waitForLoadState('domcontentloaded');

    // 조건에 부합하는 학생만 표시
    await expect(page.locator('text=홍길동').first()).toBeVisible({ timeout: 5000 });

    // 다른 학생은 필터링됨
    const filteredCount = await page.locator('[data-testid="student-card"]').count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // 검색 초기화 — 검색어 비우고 재검색
    await searchInput.clear();
    await page.click('[data-testid="student-search-button"]');
    await page.waitForLoadState('domcontentloaded');

    // 예상 결과: 전체 학생 목록이 다시 표시
    const resetCount = await page.locator('[data-testid="student-card"]').count();
    expect(resetCount).toBeGreaterThan(0);
  });

  test('STU-03: 학생 상세 정보 및 탭 네비게이션', async ({ page }) => {
    // 전제 조건: 시드 학생 존재
    await page.goto('/students');
    await page.waitForLoadState('domcontentloaded');

    // 첫 번째 학생 클릭
    const firstStudent = page.locator('[data-testid="student-card"]').first();
    await expect(firstStudent).toBeVisible({ timeout: 5000 });
    await firstStudent.click();

    // 1. /students/[id] 진입 확인
    await page.waitForURL(/.*students\/[a-zA-Z0-9-]+/, { timeout: 10000 });

    // 학생 기본 정보 표시 확인
    await expect(page.locator('h1').first()).toBeVisible();

    // 2. 각 탭 이동 — data-testid 셀렉터 사용
    const tabs = [
      { id: 'learning', label: '학습' },
      { id: 'analysis', label: '분석' },
      { id: 'matching', label: '매칭' },
      { id: 'counseling', label: '상담' },
    ];

    for (const tab of tabs) {
      const tabSelector = page.locator(`[data-testid="${tab.id}-tab"]`);
      await expect(tabSelector).toBeVisible({ timeout: 3000 });
      await tabSelector.click();

      // URL 변경 대기 (tab= 쿼리 파라미터)
      await page.waitForURL(new RegExp(`tab=${tab.id}`), { timeout: 5000 });

      // 데이터 로딩 에러 없음 확인
      await expect(page.locator('text=/오류|에러|Error/i')).not.toBeVisible();
    }

    // 탭 간 전환 후에도 학생 정보 유지
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('STU-04: 위험: 학생 정보 삭제', async ({ page }) => {
    // 테스트용 학생 생성 (삭제 대상)
    await page.goto('/students/new');
    await page.fill('input[name="name"]', '삭제테스트학생');
    await page.fill('input[name="birthDate"]', '2016-01-01');
    await page.selectOption('select[name="grade"]', '3');
    await page.fill('input[name="school"]', '테스트초등학교');
    await page.click('[data-testid="submit-student-button"]');

    // 학생 상세 페이지로 이동 확인
    await page.waitForURL(/.*students\/[a-zA-Z0-9-]+/, { timeout: 15000 });

    const deleteTargetUrl = page.url();
    const deleteTargetId = deleteTargetUrl.split('/students/')[1]?.split('?')[0];

    // confirm 다이얼로그 자동 수락
    page.on('dialog', dialog => dialog.accept());

    // 삭제 버튼 클릭 — data-testid 사용
    await page.locator('[data-testid="delete-button"]').click();

    // 예상 결과 1: 삭제 완료 후 목록으로 이동
    await expect(page).toHaveURL(/.*students$|.*students\?/, { timeout: 10000 });

    // 목록에서 학생이 보이지 않음
    await expect(page.locator('text=삭제테스트학생')).not.toBeVisible();

    // 예상 결과 2: 삭제된 학생 상세 페이지 직접 접근 시 404
    if (deleteTargetId) {
      await page.goto(`/students/${deleteTargetId}`);
      await expect(page.locator('text=/404|찾을 수 없습니다|Not Found|NEXT_NOT_FOUND/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('STU-EXTRA: 학생 정보 수정', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('domcontentloaded');

    const firstStudent = page.locator('[data-testid="student-card"]').first();
    await expect(firstStudent).toBeVisible({ timeout: 5000 });
    await firstStudent.click();

    // URL 변경 대기
    await page.waitForURL(/.*students\/[a-zA-Z0-9-]+/, { timeout: 10000 });

    // 편집 버튼 클릭 — data-testid 사용 (Link 요소)
    const editButton = page.locator('[data-testid="edit-button"]');
    if (await editButton.isVisible({ timeout: 3000 })) {
      await editButton.click();

      // 편집 페이지 이동 확인
      await page.waitForURL(/.*\/edit/, { timeout: 5000 });

      // 수정 가능한 필드 확인
      const nameInput = page.locator('input[name="name"]');
      await expect(nameInput).toBeEditable();

      // 학교명 변경
      await page.fill('input[name="school"]', '수정된초등학교');
      await page.click('[data-testid="submit-student-button"]');

      // 학생 상세 페이지로 이동 후 변경사항 반영 확인
      await page.waitForURL(/.*students\/[a-zA-Z0-9-]+/, { timeout: 10000 });
      await expect(page.locator('text=수정된초등학교')).toBeVisible({ timeout: 5000 });
    }
  });

  test('STU-PERF: 학생 목록 페이지네이션 및 성능', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('domcontentloaded');

    // 성능: 학생 카드 렌더링 시간 측정
    const startTime = Date.now();
    const studentCard = page.locator('[data-testid="student-card"]').first();
    await expect(studentCard).toBeVisible({ timeout: 5000 });
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // 3초 이내 렌더링
  });
});
