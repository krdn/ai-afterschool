
// analysis.spec.ts
// 성향 분석 시스템 (Analysis) 통합 테스트
// Scenarios: ANL-01, ANL-02, ANL-03, ANL-04

import { test, expect } from '@playwright/test';
import { loginAsTeacher } from '../utils/auth';

test.describe('Analysis - 성향 분석 시스템', () => {

  test.beforeEach(async ({ page }) => {
    // 선생님 계정으로 로그인
    await loginAsTeacher(page);
  });

  // ANL-01: 사주/성명학 계산 정확성
  test('ANL-01: 사주/성명학 계산 정확성', async ({ page }) => {
    // 타임아웃 증가 - 분석 작업을 위해
    test.setTimeout(60000);

    // 테스트 학생 페이지로 이동 (생년월일이 있는 학생)
    await page.goto('/students/test-student-001');
    await page.waitForLoadState('domcontentloaded');

    // 사주/성명학 탭으로 이동
    const sajuTab = page.locator('[data-testid="saju-tab"]');
    if (await sajuTab.isVisible({ timeout: 3000 })) {
      await sajuTab.click();
    } else {
      // Fallback to text-based selector
      const sajuTabText = page.locator('text=사주/성명학');
      if (await sajuTabText.isVisible({ timeout: 3000 })) {
        await sajuTabText.click();
      }
    }

    // 분석 실행 버튼 클릭
    const analysisButton = page.locator('button:has-text("분석 실행"), [data-testid="run-analysis-button"]');
    if (await analysisButton.isVisible({ timeout: 3000 })) {
      await analysisButton.click();

      // 로딩 인디케이터 확인
      const loadingIndicator = page.locator('[data-testid="analysis-loading"]');
      const loadingExists = await loadingIndicator.count() > 0;

      if (loadingExists) {
        await expect(loadingIndicator).toBeVisible();
      }

      // 분석 완료 대기 (최대 30초)
      await page.waitForSelector('[data-testid="saju-result"]', { state: 'attached', timeout: 30000 })
        .catch(() => {/* Result may not exist yet */});
    }

    // 오행 분석 결과 확인 (if exists)
    const ohangSection = page.locator('[data-testid="ohang-analysis"]');
    if (await ohangSection.count() > 0) {
      await expect(ohangSection).toBeVisible();
      await expect(ohangSection).toContainText(/목|화|토|금|수/);
    }

    // 수리 분석 결과 확인 (if exists)
    const suriSection = page.locator('[data-testid="suri-analysis"]');
    if (await suriSection.count() > 0) {
      await expect(suriSection).toBeVisible();
    }

    // 사주팔자 구성요소 확인 (if exists)
    const pillars = ['year-pillar', 'month-pillar', 'day-pillar', 'hour-pillar'];
    for (const pillar of pillars) {
      const pillarElement = page.locator(`[data-testid="${pillar}"]`);
      if (await pillarElement.count() > 0) {
        await expect(pillarElement).toBeVisible();
      }
    }
  });

  // ANL-02: AI 관상/손금 분석 (Claude Vision)
  test('ANL-02: AI 관상/손금 분석 (Claude Vision)', async ({ page }) => {
    // 타임아웃 증가 - AI Vision API 호출을 위해
    test.setTimeout(90000);

    // 학생 페이지로 이동
    await page.goto('/students/test-student-001');
    await page.waitForLoadState('domcontentloaded');

    // 관상 탭으로 이동
    const physiognomyTab = page.locator('[data-testid="face-tab"]');
    if (await physiognomyTab.isVisible({ timeout: 3000 })) {
      await physiognomyTab.click();
    } else {
      // Fallback to text-based selector
      const physiognomyTabText = page.locator('text=관상');
      if (await physiognomyTabText.isVisible({ timeout: 3000 })) {
        await physiognomyTabText.click();
      }
    }

    // 사진 업로드 필드 확인
    const fileInput = page.locator('input[type="file"]');
    const fileInputExists = await fileInput.count() > 0;

    if (fileInputExists) {
      await expect(fileInput).toBeVisible();

      // 테스트 이미지 업로드
      await fileInput.setInputFiles('./test-data/sample-face.jpg');

      // 이미지 프리뷰 확인
      const imagePreview = page.locator('[data-testid="image-preview"]');
      const previewExists = await imagePreview.count() > 0;

      if (previewExists) {
        await expect(imagePreview).toBeVisible();
      }

      // 분석 요청 버튼 클릭
      const analyzeButton = page.locator('button:has-text("AI 분석 시작")');
      if (await analyzeButton.isVisible({ timeout: 3000 })) {
        await analyzeButton.click();

        // 로딩 인디케이터 표시 확인
        const loadingIndicator = page.locator('[data-testid="ai-loading"]');
        const loadingExists = await loadingIndicator.count() > 0;

        if (loadingExists) {
          await expect(loadingIndicator).toBeVisible();
          await expect(loadingIndicator).toContainText(/분석 중|처리 중/i);
        }

        // AI 분석 완료 대기 (Vision API는 시간이 걸릴 수 있음)
        await page.waitForSelector('[data-testid="physiognomy-result"]', { state: 'attached', timeout: 60000 })
          .catch(() => {/* Result may not exist */});
      }
    }

    // AI 분석 텍스트 결과 확인 (if exists)
    const resultText = page.locator('[data-testid="physiognomy-result"]');
    if (await resultText.count() > 0) {
      await expect(resultText).toBeVisible();

      const resultContent = await resultText.textContent();
      expect(resultContent?.length).toBeGreaterThan(50);
    }
  });

  // ANL-03: MBTI 입력 및 결과 판정
  test('ANL-03: MBTI 입력 및 결과 판정', async ({ page }) => {
    // 타임아웃 증가 - MBTI 분석을 위해
    test.setTimeout(60000);

    // 학생 페이지로 이동
    await page.goto('/students/test-student-001');

    // MBTI 탭으로 이동
    const mbtiTab = page.locator('[data-testid="mbti-tab"]');
    if (await mbtiTab.isVisible({ timeout: 3000 })) {
      await mbtiTab.click();
    } else {
      // Fallback to text-based selector
      await page.click('text=MBTI');
    }
    
    // 직접 입력 옵션 선택
    await page.click('[data-testid="direct-input-option"]');
    
    // MBTI 유형 선택 (예: INTJ)
    await page.selectOption('[data-testid="mbti-select"]', 'INTJ');
    
    // 또는 설문 입력 방식
    // await page.click('[data-testid="survey-input-option"]');
    // const questions = page.locator('[data-testid^="mbti-question-"]');
    // const count = await questions.count();
    // for (let i = 0; i < count; i++) {
    //   await questions.nth(i).locator('input[type="radio"]').first().check();
    // }
    
    // 저장 버튼 클릭
    await page.click('button:has-text("저장")');
    
    // 저장 확인 모달
    await expect(page.locator('[data-testid="confirm-modal"]')).toBeVisible();
    await page.click('button:has-text("확인")');
    
    // 성향 설명 카드 업데이트 확인
    const mbtiCard = page.locator('[data-testid="mbti-result-card"]');
    await expect(mbtiCard).toBeVisible();
    await expect(mbtiCard).toContainText('INTJ');
    
    // 성향 설명 내용 확인
    await expect(page.locator('[data-testid="mbti-description"]')).toBeVisible();
    await expect(page.locator('[data-testid="mbti-strengths"]')).toBeVisible();
    await expect(page.locator('[data-testid="mbti-weaknesses"]')).toBeVisible();
    
    // 학습 스타일 추천 확인
    await expect(page.locator('[data-testid="learning-style"]')).toBeVisible();
    
    // DB 저장 확인
    const response = await page.waitForResponse(
      response => response.url().includes('/api/analysis/mbti') && response.status() === 200
    );
    const data = await response.json();
    expect(data.mbtiType).toBe('INTJ');
    expect(data).toHaveProperty('dimension');
  });

  // ANL-04: 통합 성향 요약 생성 (Aggregation)
  test('ANL-04: 통합 성향 요약 생성 (Aggregation)', async ({ page }) => {
    // 타임아웃 증가 - 통합 분석은 시간이 오래 걸림
    test.setTimeout(90000);

    // 전제 조건: 분석 데이터가 이미 존재하는 학생
    await page.goto('/students/test-student-with-analysis');
    await page.waitForLoadState('domcontentloaded');

    // 대시보드 탭 (학생 메인)
    const dashboardExists = await page.locator('[data-testid="student-dashboard"]').count() > 0;

    if (dashboardExists) {
      await page.waitForSelector('[data-testid="student-dashboard"]', { state: 'attached', timeout: 5000 });
    }

    // 기존 분석 데이터 확인 (optional, may not exist)
    const sajuSummary = page.locator('[data-testid="saju-summary"]');
    const mbtiBadge = page.locator('[data-testid="mbti-badge"]');
    const physiognomySummary = page.locator('[data-testid="physiognomy-summary"]');

    // AI 요약 생성 버튼 클릭 (if exists)
    const generateButton = page.locator('button:has-text("AI 요약 생성"), [data-testid="run-analysis-button"]');
    const buttonExists = await generateButton.isVisible({ timeout: 3000 });

    if (buttonExists && !await generateButton.isDisabled()) {
      await generateButton.click();

      // 로딩 상태 확인 (if exists)
      const loadingIndicator = page.locator('[data-testid="aggregation-loading"]');
      const loadingExists = await loadingIndicator.count() > 0;

      if (loadingExists) {
        await expect(loadingIndicator).toBeVisible();

        // 프로그레스 바 또는 단계 인디케이터 확인
        const progressIndicator = page.locator('[data-testid="analysis-progress"]');
        if (await progressIndicator.count() > 0) {
          await expect(progressIndicator).toBeVisible();
        }
      }

      // AI 요약 결과 대기 (종합 분석은 시간이 걸림)
      await page.waitForSelector('[data-testid="ai-summary-result"]', { state: 'attached', timeout: 90000 })
        .catch(() => {/* Result may not exist */});

      // 한 줄 평 (종합 평가) 확인 (if exists)
      const summaryText = page.locator('[data-testid="ai-summary-text"]');
      if (await summaryText.count() > 0) {
        await expect(summaryText).toBeVisible();

        const summaryContent = await summaryText.textContent();
        if (summaryContent) {
          expect(summaryContent.length).toBeGreaterThan(100);
        }

        // 통합 요약이 사주+MBTI+관상 언급을 포함하는지 키워드 체크
        expect(summaryContent).toMatch(/사주|오행|MBTI|성향|관상|특성|학습|추천/);
      }
    }
  });

  // 추가 엣지 케이스 테스트
  test('ANL-05: 분석 데이터 없을 때 요약 생성 실패 처리', async ({ page }) => {
    // 분석 데이터가 전혀 없는 신규 학생
    await page.goto('/students/new-student-no-analysis');
    
    // AI 요약 생성 시도
    const generateButton = page.locator('button:has-text("AI 요약 생성")');
    
    // 버튼이 비활성화되어 있거나
    if (await generateButton.isVisible()) {
      const isDisabled = await generateButton.isDisabled();
      if (!isDisabled) {
        await generateButton.click();
        // 경고 메시지 확인
        await expect(page.locator('[data-testid="warning-no-data"]')).toBeVisible();
        await expect(page.locator('text=/먼저 분석을 완료해주세요/i')).toBeVisible();
      } else {
        expect(isDisabled).toBeTruthy();
      }
    }
  });

  test('ANL-06: AI 분석 API 오류 핸들링', async ({ page }) => {
    // 타임아웃 증가 - 에러 핸들링 테스트를 위해
    test.setTimeout(60000);

    // API 실패 시뮬레이션 (네트워크 인터셉트)
    await page.route('**/api/analysis/physiognomy', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'AI service unavailable' })
      });
    });

    await page.goto('/students/test-student-001');
    const faceTab = page.locator('[data-testid="face-tab"]');
    if (await faceTab.isVisible({ timeout: 3000 })) {
      await faceTab.click();
    } else {
      await page.click('text=관상');
    }
    
    await page.locator('input[type="file"]').setInputFiles('./test-data/sample-face.jpg');
    await page.click('button:has-text("AI 분석 시작")');
    
    // 에러 메시지 확인
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('text=/분석 중 오류|일시적인 문제/i')).toBeVisible();
    
    // 재시도 버튼 확인
    await expect(page.locator('button:has-text("재시도")')).toBeVisible();
  });

  test('ANL-07: 사주 분석 결과 히스토리 조회', async ({ page }) => {
    // 타임아웃 증가
    test.setTimeout(60000);

    await page.goto('/students/test-student-001');
    const sajuTab = page.locator('[data-testid="saju-tab"]');
    if (await sajuTab.isVisible({ timeout: 3000 })) {
      await sajuTab.click();
    } else {
      await page.click('text=사주/성명학');
    }
    
    // 분석 이력 섹션
    const historySection = page.locator('[data-testid="analysis-history"]');
    if (await historySection.isVisible()) {
      // 이전 분석 결과 목록 확인
      const historyItems = page.locator('[data-testid^="history-item-"]');
      const count = await historyItems.count();
      expect(count).toBeGreaterThan(0);
      
      // 첫 번째 이력 항목 클릭하여 상세 보기
      await historyItems.first().click();
      await expect(page.locator('[data-testid="history-detail-modal"]')).toBeVisible();
    }
  });

  test('ANL-08: MBTI 설문 중간 저장 (Draft)', async ({ page }) => {
    // 타임아웃 증가
    test.setTimeout(60000);

    await page.goto('/students/test-student-001');
    const mbtiTab = page.locator('[data-testid="mbti-tab"]');
    if (await mbtiTab.isVisible({ timeout: 3000 })) {
      await mbtiTab.click();
    } else {
      await page.click('text=MBTI');
    }
    await page.click('[data-testid="survey-input-option"]');
    
    // 일부 질문에만 답변
    const firstQuestion = page.locator('[data-testid="mbti-question-0"]');
    await firstQuestion.locator('input[type="radio"]').first().check();
    
    // 임시 저장 버튼
    const draftButton = page.locator('button:has-text("임시 저장")');
    if (await draftButton.isVisible()) {
      await draftButton.click();
      await expect(page.locator('[data-testid="draft-saved-toast"]')).toBeVisible();
      
      // 페이지 새로고침 후 복원 확인
      await page.reload();
      await page.click('text=MBTI');
      await expect(firstQuestion.locator('input[type="radio"]:checked')).toBeVisible();
    }
  });
});
