
// teacher.spec.ts
// 선생님(Teacher) 관리 및 프로필 관련 통합 테스트
// 테스트 범위: TCH-01, TCH-02, TCH-03

import { test, expect, Page } from '@playwright/test';

// 테스트 데이터
const TEST_TEACHER = {
  email: 'teacher@test.com',
  password: 'Test1234!',
  name: '김선생',
  role: 'TEACHER',
  teamId: null
};

const TEST_ADMIN = {
  email: 'director@test.com',
  password: 'Admin1234!',
  name: '박원장',
  role: 'DIRECTOR'
};

const TEST_TEAM = {
  name: '초등팀',
  description: '초등학생 전담 팀'
};

// Helper Functions
async function loginAsTeacher(page: Page) {
  await page.goto('/auth/login');
  await page.fill('input[name="email"]', TEST_TEACHER.email);
  await page.fill('input[name="password"]', TEST_TEACHER.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/students');
}

async function loginAsAdmin(page: Page) {
  await page.goto('/auth/login');
  await page.fill('input[name="email"]', TEST_ADMIN.email);
  await page.fill('input[name="password"]', TEST_ADMIN.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/students');
}

async function createTestTeacher(page: Page) {
  await page.goto('/auth/register');
  await page.fill('input[name="email"]', TEST_TEACHER.email);
  await page.fill('input[name="password"]', TEST_TEACHER.password);
  await page.fill('input[name="name"]', TEST_TEACHER.name);
  await page.click('button[type="submit"]');
}

async function createTestTeam(page: Page): Promise<string> {
  const response = await page.request.post('/api/teams', {
    data: TEST_TEAM
  });
  const team = await response.json();
  return team.id;
}

test.describe('선생님 데이터 관리 (Teacher)', () => {
  test.beforeEach(async ({ page }) => {
    // 테스트 DB 초기화 (필요시)
    await page.request.post('/api/test/reset');
  });

  // TCH-01: 관리자: 선생님 팀/역할 변경
  test('TCH-01: 관리자가 선생님의 팀 및 역할을 변경할 수 있다', async ({ page }) => {
    // Arrange: 선생님 및 관리자 계정 생성
    await createTestTeacher(page);
    await page.goto('/auth/register');
    await page.fill('input[name="email"]', TEST_ADMIN.email);
    await page.fill('input[name="password"]', TEST_ADMIN.password);
    await page.fill('input[name="name"]', TEST_ADMIN.name);
    await page.selectOption('select[name="role"]', 'DIRECTOR');
    await page.click('button[type="submit"]');
    
    // 팀 생성
    await loginAsAdmin(page);
    const teamId = await createTestTeam(page);

    // Act: 선생님 목록으로 이동
    await page.goto('/teachers');
    await expect(page.locator('h1')).toContainText('선생님 관리');

    // 선생님 선택 및 수정
    await page.click(`tr:has-text("${TEST_TEACHER.name}")`);
    await page.waitForSelector('form[data-testid="teacher-edit-form"]');

    // 역할 변경: TEACHER -> TEAM_LEADER
    await page.selectOption('select[name="role"]', 'TEAM_LEADER');
    
    // 팀 배정
    await page.selectOption('select[name="teamId"]', teamId);

    // 저장
    await page.click('button[type="submit"]:has-text("저장")');
    await expect(page.locator('.toast-success')).toContainText('변경되었습니다');

    // Assert: DB 업데이트 확인
    const response = await page.request.get(`/api/teachers?email=${TEST_TEACHER.email}`);
    const teacher = await response.json();
    expect(teacher.role).toBe('TEAM_LEADER');
    expect(teacher.teamId).toBe(teamId);

    // 선생님 계정으로 재로그인 시 변경된 권한 확인
    await page.goto('/auth/logout');
    await loginAsTeacher(page);
    
    // 팀장 전용 메뉴 접근 가능 여부 확인
    await page.goto('/team/dashboard');
    await expect(page.locator('h1')).toContainText('팀 대시보드');
    await expect(page.locator('[data-testid="team-leader-badge"]')).toBeVisible();
  });

  // TCH-02: 선생님 본인 프로필 조회
  test('TCH-02: 선생님이 본인 프로필 정보를 조회할 수 있다', async ({ page }) => {
    // Arrange: 선생님 계정 생성 및 로그인
    await createTestTeacher(page);
    await loginAsTeacher(page);

    // 테스트 학생 데이터 추가 (담당 학생 통계용)
    await page.request.post('/api/students', {
      data: {
        name: '김학생',
        grade: 3,
        teacherId: TEST_TEACHER.email,
        schoolName: '서울초등학교'
      }
    });

    await page.request.post('/api/students', {
      data: {
        name: '이학생',
        grade: 4,
        teacherId: TEST_TEACHER.email,
        schoolName: '서울초등학교'
      }
    });

    // Act: 프로필 페이지 접근 (상단 프로필 이미지 클릭)
    await page.click('[data-testid="user-profile-button"]');
    await page.waitForURL('/teachers/me');

    // Assert: 본인 정보 표시 확인
    await expect(page.locator('[data-testid="teacher-name"]')).toContainText(TEST_TEACHER.name);
    await expect(page.locator('[data-testid="teacher-email"]')).toContainText(TEST_TEACHER.email);
    await expect(page.locator('[data-testid="teacher-role"]')).toContainText('선생님');

    // 담당 학생 통계 확인
    await expect(page.locator('[data-testid="student-count"]')).toContainText('2');
    
    // 담당 학생 목록 표시
    const studentList = page.locator('[data-testid="assigned-students-list"]');
    await expect(studentList).toContainText('김학생');
    await expect(studentList).toContainText('이학생');

    // 학년별 분포 차트 렌더링 확인
    await expect(page.locator('[data-testid="grade-distribution-chart"]')).toBeVisible();
  });

  // TCH-02-ALT: 직접 URL 접근으로 프로필 조회
  test('TCH-02-ALT: /teachers/me URL로 직접 접근하여 프로필 조회', async ({ page }) => {
    // Arrange
    await createTestTeacher(page);
    await loginAsTeacher(page);

    // Act: 직접 URL 접근
    await page.goto('/teachers/me');

    // Assert
    await expect(page).toHaveURL('/teachers/me');
    await expect(page.locator('h1')).toContainText('내 프로필');
    await expect(page.locator('[data-testid="teacher-name"]')).toContainText(TEST_TEACHER.name);
  });

  // TCH-03: 선생님 자신의 성향 분석 실행
  test('TCH-03: 선생님이 본인의 사주/MBTI 분석을 실행할 수 있다', async ({ page }) => {
    // Arrange: 선생님 계정 생성 및 프로필 정보 입력
    await createTestTeacher(page);
    await loginAsTeacher(page);

    await page.goto('/teachers/me');

    // 생년월일 및 기본 정보 입력
    await page.click('[data-testid="edit-profile-button"]');
    await page.fill('input[name="birthDate"]', '1990-05-15');
    await page.fill('input[name="birthTime"]', '14:30');
    await page.selectOption('select[name="gender"]', 'FEMALE');
    await page.click('button[type="submit"]:has-text("저장")');
    await expect(page.locator('.toast-success')).toContainText('저장되었습니다');

    // Act: 분석 탭으로 이동
    await page.click('[data-testid="tab-analysis"]');
    await expect(page.locator('h2')).toContainText('성향 분석');

    // 사주 분석 실행
    await page.click('button[data-testid="run-saju-analysis"]');
    await expect(page.locator('[data-testid="loading-indicator"]')).toBeVisible();

    // 분석 완료 대기 (최대 10초)
    await page.waitForSelector('[data-testid="saju-result"]', { timeout: 10000 });

    // Assert: 사주 분석 결과 표시
    const sajuResult = page.locator('[data-testid="saju-result"]');
    await expect(sajuResult).toContainText('오행');
    await expect(sajuResult).toContainText('목');
    await expect(sajuResult).toContainText('성격');

    // DB에 TeacherSajuAnalysis 저장 확인
    const response = await page.request.get('/api/teachers/me/analysis/saju');
    expect(response.ok()).toBeTruthy();
    const analysis = await response.json();
    expect(analysis.teacherId).toBeDefined();
    expect(analysis.elementScores).toBeDefined();
    expect(analysis.createdAt).toBeDefined();

    // MBTI 분석 실행
    await page.click('button[data-testid="run-mbti-test"]');
    
    // MBTI 설문 응답 (간소화된 예시)
    const questions = await page.locator('[data-testid="mbti-question"]').count();
    for (let i = 0; i < questions; i++) {
      await page.click(`[data-testid="mbti-question-${i}"] input[value="A"]`);
    }
    await page.click('button[type="submit"]:has-text("결과 확인")');

    // MBTI 결과 표시
    await page.waitForSelector('[data-testid="mbti-result"]');
    const mbtiResult = page.locator('[data-testid="mbti-result"]');
    await expect(mbtiResult).toContainText(/ISTJ|ISFJ|INFJ|INTJ|ISTP|ISFP|INFP|INTP|ESTP|ESFP|ENFP|ENTP|ESTJ|ESFJ|ENFJ|ENTJ/);

    // 분석 결과 카드 업데이트 확인
    await expect(page.locator('[data-testid="teacher-personality-card"]')).toBeVisible();
  });

  // TCH-03-ERR: 생년월일 없이 분석 실행 시 에러 처리
  test('TCH-03-ERR: 생년월일 정보 없이 사주 분석 실행 시 에러 메시지 표시', async ({ page }) => {
    // Arrange: 생년월일 미입력 상태
    await createTestTeacher(page);
    await loginAsTeacher(page);
    await page.goto('/teachers/me');

    // Act: 분석 탭 이동 및 실행 시도
    await page.click('[data-testid="tab-analysis"]');
    await page.click('button[data-testid="run-saju-analysis"]');

    // Assert: 에러 메시지 표시
    await expect(page.locator('.toast-error')).toContainText('생년월일 정보가 필요합니다');
    await expect(page.locator('[data-testid="saju-result"]')).not.toBeVisible();
  });

  // TCH-04: 권한 검증 - 타 선생님 프로필 접근 불가
  test('TCH-04: 선생님은 다른 선생님의 프로필을 임의로 조회할 수 없다', async ({ page }) => {
    // Arrange: 두 명의 선생님 계정 생성
    await createTestTeacher(page);
    
    const otherTeacher = {
      email: 'other@test.com',
      password: 'Test1234!',
      name: '이선생'
    };
    
    await page.goto('/auth/register');
    await page.fill('input[name="email"]', otherTeacher.email);
    await page.fill('input[name="password"]', otherTeacher.password);
    await page.fill('input[name="name"]', otherTeacher.name);
    await page.click('button[type="submit"]');

    const otherTeacherResponse = await page.request.get(`/api/teachers?email=${otherTeacher.email}`);
    const otherTeacherData = await otherTeacherResponse.json();

    // Act: 첫 번째 선생님으로 로그인 후 타 선생님 프로필 접근 시도
    await page.goto('/auth/logout');
    await loginAsTeacher(page);
    
    await page.goto(`/teachers/${otherTeacherData.id}`);

    // Assert: 403 또는 리다이렉트
    await expect(page).toHaveURL('/students');
    await expect(page.locator('.toast-error')).toContainText('권한이 없습니다');
  });

  // TCH-05: 선생님 목록 조회 (관리자 전용)
  test('TCH-05: 관리자는 전체 선생님 목록을 조회하고 검색할 수 있다', async ({ page }) => {
    // Arrange: 여러 선생님 생성
    const teachers = [
      { email: 'kim@test.com', name: '김선생', role: 'TEACHER' },
      { email: 'lee@test.com', name: '이선생', role: 'TEAM_LEADER' },
      { email: 'park@test.com', name: '박선생', role: 'TEACHER' }
    ];

    for (const teacher of teachers) {
      await page.request.post('/api/teachers', { data: teacher });
    }

    await page.goto('/auth/register');
    await page.fill('input[name="email"]', TEST_ADMIN.email);
    await page.fill('input[name="password"]', TEST_ADMIN.password);
    await page.fill('input[name="name"]', TEST_ADMIN.name);
    await page.selectOption('select[name="role"]', 'DIRECTOR');
    await page.click('button[type="submit"]');

    await loginAsAdmin(page);

    // Act: 선생님 목록 페이지 이동
    await page.goto('/teachers');

    // Assert: 전체 목록 표시
    await expect(page.locator('tbody tr')).toHaveCount(teachers.length + 1); // +1 for admin

    // 검색 기능 테스트
    await page.fill('input[data-testid="teacher-search"]', '김선생');
    await page.waitForTimeout(500); // debounce

    await expect(page.locator('tbody tr')).toHaveCount(1);
    await expect(page.locator('tbody')).toContainText('김선생');
    await expect(page.locator('tbody')).not.toContainText('이선생');

    // 역할 필터
    await page.click('input[data-testid="teacher-search"]');
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await page.selectOption('select[data-testid="role-filter"]', 'TEAM_LEADER');

    await expect(page.locator('tbody tr')).toHaveCount(1);
    await expect(page.locator('tbody')).toContainText('이선생');
  });

  // TCH-06: 선생님 프로필 사진 업로드
  test('TCH-06: 선생님이 프로필 사진을 업로드하고 표시할 수 있다', async ({ page }) => {
    // Arrange
    await createTestTeacher(page);
    await loginAsTeacher(page);
    await page.goto('/teachers/me');

    // Act: 프로필 사진 업로드
    await page.click('[data-testid="edit-profile-button"]');
    
    const fileInput = page.locator('input[type="file"][name="profileImage"]');
    await fileInput.setInputFiles('./tests/fixtures/teacher-profile.jpg');

    // 업로드 진행 및 완료 대기
    await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible();
    await page.click('button[type="submit"]:has-text("저장")');
    await expect(page.locator('.toast-success')).toContainText('저장되었습니다');

    // Assert: 프로필 이미지 표시
    const profileImage = page.locator('[data-testid="teacher-profile-image"]');
    await expect(profileImage).toBeVisible();
    
    const src = await profileImage.getAttribute('src');
    expect(src).toContain('cloudinary'); // Cloudinary URL 확인

    // 상단 네비게이션에도 반영 확인
    const navProfileImage = page.locator('[data-testid="user-profile-button"] img');
    const navSrc = await navProfileImage.getAttribute('src');
    expect(navSrc).toBe(src);
  });

  // TCH-07: 선생님 담당 학생 통계 및 성과
  test('TCH-07: 선생님 프로필에서 담당 학생들의 성과 통계를 확인할 수 있다', async ({ page }) => {
    // Arrange: 선생님 및 담당 학생 생성
    await createTestTeacher(page);
    await loginAsTeacher(page);

    const students = [
      { name: '김학생', grade: 3, avgScore: 85 },
      { name: '이학생', grade: 3, avgScore: 90 },
      { name: '박학생', grade: 4, avgScore: 78 }
    ];

    for (const student of students) {
      await page.request.post('/api/students', {
        data: { ...student, teacherId: TEST_TEACHER.email }
      });
    }

    // Act: 프로필 페이지 이동 및 통계 탭
    await page.goto('/teachers/me');
    await page.click('[data-testid="tab-statistics"]');

    // Assert: 통계 정보 표시
    await expect(page.locator('[data-testid="total-students"]')).toContainText('3');
    await expect(page.locator('[data-testid="avg-score"]')).toContainText('84.3'); // (85+90+78)/3

    // 학년별 분포 차트
    const gradeChart = page.locator('[data-testid="grade-distribution-chart"]');
    await expect(gradeChart).toBeVisible();

    // 성적 향상도 차트
    const performanceChart = page.locator('[data-testid="performance-trend-chart"]');
    await expect(performanceChart).toBeVisible();
  });
});

// Edge Cases & Error Handling
test.describe('선생님 관리 - 예외 및 에러 처리', () => {
  
  test('TCH-ERR-01: 일반 선생님은 선생님 관리 페이지 접근 불가', async ({ page }) => {
    await page.goto('/auth/register');
    await page.fill('input[name="email"]', TEST_TEACHER.email);
    await page.fill('input[name="password"]', TEST_TEACHER.password);
    await page.fill('input[name="name"]', TEST_TEACHER.name);
    await page.click('button[type="submit"]');

    await loginAsTeacher(page);
    await page.goto('/teachers');

    await expect(page).toHaveURL('/students');
    await expect(page.locator('.toast-error')).toContainText('권한이 없습니다');
  });

  test('TCH-ERR-02: 존재하지 않는 선생님 ID 접근 시 404', async ({ page }) => {
    await page.goto('/auth/register');
    await page.fill('input[name="email"]', TEST_ADMIN.email);
    await page.fill('input[name="password"]', TEST_ADMIN.password);
    await page.fill('input[name="name"]', TEST_ADMIN.name);
    await page.selectOption('select[name="role"]', 'DIRECTOR');
    await page.click('button[type="submit"]');

    await loginAsAdmin(page);
    await page.goto('/teachers/non-existent-id-12345');

    await expect(page.locator('[data-testid="error-message"]')).toContainText('선생님을 찾을 수 없습니다');
  });

  test('TCH-ERR-03: 프로필 사진 용량 초과 시 에러', async ({ page }) => {
    await page.goto('/auth/register');
    await page.fill('input[name="email"]', TEST_TEACHER.email);
    await page.fill('input[name="password"]', TEST_TEACHER.password);
    await page.fill('input[name="name"]', TEST_TEACHER.name);
    await page.click('button[type="submit"]');

    await loginAsTeacher(page);
    await page.goto('/teachers/me');
    await page.click('[data-testid="edit-profile-button"]');

    const fileInput = page.locator('input[type="file"][name="profileImage"]');
    await fileInput.setInputFiles('./tests/fixtures/large-image.jpg'); // 10MB 이상

    await page.click('button[type="submit"]:has-text("저장")');
    await expect(page.locator('.toast-error')).toContainText('5MB 이하');
  });
});
