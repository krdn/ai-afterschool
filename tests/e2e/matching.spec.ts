
// matching.spec.ts
// 매칭 및 배정 시스템 통합 테스트
// Scenarios: MAT-01, MAT-02, MAT-03, MAT-04

import { test, expect } from '@playwright/test';

test.describe('매칭 및 배정 시스템 (Matching)', () => {
  
  test.beforeEach(async ({ page }) => {
    // 선생님 계정으로 로그인
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'teacher@test.com');
    await page.fill('input[name="password"]', 'Test1234!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('MAT-01: 선생님-학생 궁합 점수 산출', async ({ page }) => {
    // 전제조건: 분석 데이터를 보유한 학생 존재
    const studentId = 'student-with-analysis-data';
    
    // 1. 학생 상세 페이지로 이동
    await page.goto(`/students/${studentId}`);
    await page.waitForLoadState('networkidle');
    
    // 2. 매칭 탭 클릭
    await page.click('button:has-text("매칭"), a:has-text("매칭")');
    await page.waitForURL(`/students/${studentId}?tab=matching`);
    
    // 3. 궁합 점수 표시 확인
    const compatibilityScore = page.locator('[data-testid="compatibility-score"]');
    await expect(compatibilityScore).toBeVisible();
    
    // 4. 점수가 퍼센트로 표시되는지 확인 (0-100%)
    const scoreText = await compatibilityScore.textContent();
    expect(scoreText).toMatch(/\d+%/);
    
    const scoreValue = parseInt(scoreText?.replace('%', '') || '0');
    expect(scoreValue).toBeGreaterThanOrEqual(0);
    expect(scoreValue).toBeLessThanOrEqual(100);
    
    // 5. 세부 항목별 점수 확인
    const mbtiScore = page.locator('[data-testid="mbti-compatibility"]');
    await expect(mbtiScore).toBeVisible();
    
    const learningStyleScore = page.locator('[data-testid="learning-style-compatibility"]');
    await expect(learningStyleScore).toBeVisible();
    
    // 6. 담임 선생님 정보 표시 확인
    const assignedTeacher = page.locator('[data-testid="assigned-teacher"]');
    await expect(assignedTeacher).toBeVisible();
  });

  test('MAT-02: AI 자동 배정 시뮬레이션', async ({ page }) => {
    // 전제조건: 미배정 학생 존재
    
    // 1. 자동 배정 페이지로 이동
    await page.goto('/matching/auto-assign');
    await page.waitForLoadState('networkidle');
    
    // 2. 미배정 학생 목록 확인
    const unassignedStudents = page.locator('[data-testid="unassigned-student"]');
    const unassignedCount = await unassignedStudents.count();
    expect(unassignedCount).toBeGreaterThan(0);
    
    // 3. 배정 실행 버튼 클릭
    await page.click('button:has-text("자동 배정 실행")');
    
    // 4. 로딩 인디케이터 확인
    await expect(page.locator('[data-testid="assignment-loading"]')).toBeVisible();
    
    // 5. 배정 제안 생성 대기
    await page.waitForSelector('[data-testid="assignment-proposal"]', { timeout: 30000 });
    
    // 6. 배정 제안 결과 확인
    const proposalCard = page.locator('[data-testid="assignment-proposal"]');
    await expect(proposalCard).toBeVisible();
    
    // 7. 선생님별 배정 학생 수 확인
    const teacherAssignments = page.locator('[data-testid="teacher-assignment"]');
    const teacherCount = await teacherAssignments.count();
    expect(teacherCount).toBeGreaterThan(0);
    
    // 8. 각 선생님의 배정 학생 수 균등 분포 확인
    const studentCounts: number[] = [];
    for (let i = 0; i < teacherCount; i++) {
      const countText = await teacherAssignments.nth(i).locator('[data-testid="student-count"]').textContent();
      const count = parseInt(countText || '0');
      studentCounts.push(count);
    }
    
    // 9. 표준편차가 작아야 함 (균등 분포)
    const avg = studentCounts.reduce((a, b) => a + b, 0) / studentCounts.length;
    const variance = studentCounts.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / studentCounts.length;
    const stdDev = Math.sqrt(variance);
    
    // 표준편차가 평균의 30% 이하
    expect(stdDev).toBeLessThanOrEqual(avg * 0.3);
    
    // 10. 배정 상태가 'PROPOSED'인지 확인
    const statusBadge = page.locator('[data-testid="assignment-status"]');
    await expect(statusBadge).toContainText('제안');
  });

  test('MAT-03: 배정 확정 (Apply)', async ({ page }) => {
    // 전제조건: 배정 제안이 생성된 상태
    
    // 1. 배정 관리 페이지로 이동
    await page.goto('/matching/auto-assign');
    await page.waitForLoadState('networkidle');
    
    // 2. 기존 제안이 없으면 생성
    const hasProposal = await page.locator('[data-testid="assignment-proposal"]').isVisible();
    if (!hasProposal) {
      await page.click('button:has-text("자동 배정 실행")');
      await page.waitForSelector('[data-testid="assignment-proposal"]', { timeout: 30000 });
    }
    
    // 3. 배정 제안 검토
    const proposalDetails = page.locator('[data-testid="assignment-proposal"]');
    await expect(proposalDetails).toBeVisible();
    
    // 4. 적용 전 학생 teacherId null 확인 (DB 쿼리 시뮬레이션)
    const preApplyStudents = page.locator('[data-testid="unassigned-student"]');
    const preApplyCount = await preApplyStudents.count();
    
    // 5. '적용' 버튼 클릭
    await page.click('button:has-text("배정 적용")');
    
    // 6. 확인 다이얼로그 처리
    page.on('dialog', dialog => dialog.accept());
    await page.click('button:has-text("확인"), button:has-text("적용")');
    
    // 7. 적용 완료 메시지 대기
    await expect(page.locator('text=배정이 완료되었습니다')).toBeVisible({ timeout: 10000 });
    
    // 8. Student 테이블의 teacherId 업데이트 확인
    // API 응답 확인
    const response = await page.waitForResponse(
      response => response.url().includes('/api/matching/apply') && response.status() === 200
    );
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.updatedCount).toBe(preApplyCount);
    
    // 9. UI 업데이트 확인 - 미배정 학생 수 감소
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const postApplyStudents = page.locator('[data-testid="unassigned-student"]');
    const postApplyCount = await postApplyStudents.count();
    expect(postApplyCount).toBeLessThan(preApplyCount);
    
    // 10. 배정 이력 생성 확인
    await page.goto('/matching/history');
    const latestAssignment = page.locator('[data-testid="assignment-record"]').first();
    await expect(latestAssignment).toContainText('완료');
  });

  test('MAT-04: 공정성 지표(Fairness) 확인', async ({ page }) => {
    // 전제조건: 배정이 완료된 상태
    
    // 1. 공정성 대시보드로 이동
    await page.goto('/matching/fairness');
    await page.waitForLoadState('networkidle');
    
    // 2. 페이지 로딩 확인
    await expect(page.locator('h1:has-text("공정성 분석")')).toBeVisible();
    
    // 3. Gini 계수 표시 확인
    const giniCoefficient = page.locator('[data-testid="gini-coefficient"]');
    await expect(giniCoefficient).toBeVisible();
    
    const giniValue = await giniCoefficient.textContent();
    const giniNumber = parseFloat(giniValue?.replace(/[^0-9.]/g, '') || '0');
    
    // 4. Gini 계수 범위 확인 (0~1 사이)
    expect(giniNumber).toBeGreaterThanOrEqual(0);
    expect(giniNumber).toBeLessThanOrEqual(1);
    
    // 5. 선생님별 학생 수 분포 차트 확인
    const distributionChart = page.locator('[data-testid="distribution-chart"]');
    await expect(distributionChart).toBeVisible();
    
    // 6. 차트 렌더링 확인 (canvas 또는 svg)
    const chartElement = distributionChart.locator('canvas, svg');
    await expect(chartElement).toBeVisible();
    
    // 7. 공정성 메트릭 카드들 확인
    const metricsCards = page.locator('[data-testid="fairness-metric"]');
    const metricsCount = await metricsCards.count();
    expect(metricsCount).toBeGreaterThanOrEqual(3); // Gini, 표준편차, 범위 등
    
    // 8. 각 메트릭의 세부 정보 확인
    for (let i = 0; i < Math.min(metricsCount, 5); i++) {
      const metric = metricsCards.nth(i);
      await expect(metric.locator('[data-testid="metric-label"]')).toBeVisible();
      await expect(metric.locator('[data-testid="metric-value"]')).toBeVisible();
    }
    
    // 9. 평균 학생 수 표시
    const avgStudents = page.locator('[data-testid="avg-students-per-teacher"]');
    await expect(avgStudents).toBeVisible();
    
    // 10. 최소/최대 학생 수 표시
    const minStudents = page.locator('[data-testid="min-students"]');
    const maxStudents = page.locator('[data-testid="max-students"]');
    await expect(minStudents).toBeVisible();
    await expect(maxStudents).toBeVisible();
    
    // 11. 선생님별 상세 테이블 확인
    const teacherTable = page.locator('[data-testid="teacher-fairness-table"]');
    await expect(teacherTable).toBeVisible();
    
    const teacherRows = teacherTable.locator('tbody tr');
    const rowCount = await teacherRows.count();
    expect(rowCount).toBeGreaterThan(0);
    
    // 12. 각 행의 데이터 확인
    const firstRow = teacherRows.first();
    await expect(firstRow.locator('td').nth(0)).toBeVisible(); // 선생님 이름
    await expect(firstRow.locator('td').nth(1)).toBeVisible(); // 배정 학생 수
    await expect(firstRow.locator('td').nth(2)).toBeVisible(); // 평균 궁합 점수
    
    // 13. 공정성 개선 제안 섹션 확인
    const suggestions = page.locator('[data-testid="fairness-suggestions"]');
    if (giniNumber > 0.3) {
      await expect(suggestions).toBeVisible();
      await expect(suggestions).toContainText('재배정');
    }
    
    // 14. 시계열 차트 확인 (배정 이력이 있는 경우)
    const timeSeriesChart = page.locator('[data-testid="fairness-timeline"]');
    if (await timeSeriesChart.isVisible()) {
      const timelineCanvas = timeSeriesChart.locator('canvas, svg');
      await expect(timelineCanvas).toBeVisible();
    }
  });

  test('MAT-05: 개별 학생 매칭 수동 변경', async ({ page }) => {
    // 추가 시나리오: 관리자가 특정 학생의 담임을 수동으로 변경
    
    const studentId = 'student-manual-reassign';
    
    // 1. 학생 상세 페이지로 이동
    await page.goto(`/students/${studentId}`);
    
    // 2. 매칭 탭에서 '담임 변경' 버튼 클릭
    await page.click('button:has-text("매칭")');
    await page.waitForURL(`/students/${studentId}?tab=matching`);
    
    await page.click('button:has-text("담임 변경")');
    
    // 3. 선생님 선택 다이얼로그
    await expect(page.locator('[data-testid="teacher-select-modal"]')).toBeVisible();
    
    // 4. 다른 선생님 선택
    await page.click('[data-testid="teacher-option"]:has-text("김영희")');
    
    // 5. 변경 확인
    await page.click('button:has-text("변경하기")');
    
    // 6. 성공 메시지 확인
    await expect(page.locator('text=담임이 변경되었습니다')).toBeVisible();
    
    // 7. 변경된 담임 표시 확인
    await page.reload();
    await expect(page.locator('[data-testid="assigned-teacher"]')).toContainText('김영희');
  });

  test('MAT-06: 매칭 이력 및 감사 로그', async ({ page }) => {
    // 배정 변경 이력 추적
    
    // 1. 매칭 이력 페이지로 이동
    await page.goto('/matching/history');
    
    // 2. 이력 테이블 확인
    const historyTable = page.locator('[data-testid="matching-history-table"]');
    await expect(historyTable).toBeVisible();
    
    // 3. 각 이력 항목 확인
    const historyRows = historyTable.locator('tbody tr');
    const firstHistory = historyRows.first();
    
    await expect(firstHistory.locator('td').nth(0)).toBeVisible(); // 날짜
    await expect(firstHistory.locator('td').nth(1)).toBeVisible(); // 작업 유형 (자동/수동)
    await expect(firstHistory.locator('td').nth(2)).toBeVisible(); // 실행자
    await expect(firstHistory.locator('td').nth(3)).toBeVisible(); // 영향받은 학생 수
    
    // 4. 상세 보기 클릭
    await firstHistory.click();
    
    // 5. 상세 정보 모달 확인
    const detailModal = page.locator('[data-testid="history-detail-modal"]');
    await expect(detailModal).toBeVisible();
    
    // 6. 변경 전/후 비교 정보 확인
    await expect(detailModal.locator('[data-testid="before-assignment"]')).toBeVisible();
    await expect(detailModal.locator('[data-testid="after-assignment"]')).toBeVisible();
  });

});
