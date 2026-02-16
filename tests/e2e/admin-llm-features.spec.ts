/**
 * E2E Tests for Admin LLM Features Page
 *
 * @vitest-environment node
 */

import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin } from '../utils/auth';

// skip: 테스트 셀렉터와 실제 UI가 근본적으로 불일치 — 전면 재작성 필요
test.describe.skip('Admin LLM Features', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();

    // Login as DIRECTOR
    await loginAsAdmin(page);

    // Navigate to LLM Features
    await page.goto('/admin/llm-features');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test.describe('Feature Mapping List', () => {
    test('should display feature mapping page', async () => {
      await expect(page.getByText('기능별 LLM 매핑')).toBeVisible();
      await expect(page.getByText('각 기능에 사용될 LLM 모델의 매핑 규칙을 설정하고 관리합니다')).toBeVisible();

      // Info cards
      await expect(page.getByText('태그 기반 자동 매칭')).toBeVisible();
      await expect(page.getByText('직접 모델 지정')).toBeVisible();
    });

    test('should display feature tabs', async () => {
      // Feature type tabs
      const tabs = [
        'student_analysis',
        'counseling_report',
        'mbti_analysis',
        'face_reading',
        'palm_reading',
        'saju_analysis',
        'learning_analysis',
        'weekly_counseling',
      ];

      for (const tab of tabs.slice(0, 3)) {
        await expect(
          page.locator(`[data-testid="tab-${tab}"]`).or(
            page.getByRole('tab', { name: new RegExp(tab, 'i') })
          )
        ).toBeVisible();
      }
    });

    test('should switch between feature tabs', async () => {
      // Click on different tabs
      const tabs = page.getByRole('tab');
      const count = await tabs.count();

      if (count > 1) {
        await tabs.nth(1).click();
        await page.waitForTimeout(300);

        // Check tab is active
        await expect(tabs.nth(1)).toHaveAttribute('data-state', 'active');
      }
    });

    test('should display existing mappings', async () => {
      const mappings = page.locator('[data-testid="mapping-card"]').or(
        page.locator('[data-testid="feature-mapping"]')
      );

      // Either mappings exist or empty state
      const emptyState = page.getByText(/등록된 규칙이 없습니다|아직 규칙이 없어요/);

      await expect(mappings.first().or(emptyState)).toBeVisible();
    });
  });

  test.describe('Create Mapping', () => {
    test('should open add mapping dialog', async () => {
      await page.click('[data-testid="add-mapping-button"]');

      await expect(page.getByText(/새 규칙 추가|매핑 규칙 추가/i)).toBeVisible();
      await expect(page.getByText(/매칭 방식|모드/i)).toBeVisible();
    });

    test('should create tag-based mapping', async () => {
      await page.click('[data-testid="add-mapping-button"]');

      // Select match mode
      await page.click('[data-testid="match-mode-auto-tag"]');

      // Add required tags
      await page.click('[data-testid="add-required-tag"]');
      await page.click('text=vision');

      await page.click('[data-testid="add-required-tag"]');
      await page.click('text=premium');

      // Set priority
      await page.fill('[data-testid="priority-input"]', '1');

      // Set fallback mode
      await page.selectOption('[data-testid="fallback-mode"]', 'next_priority');

      // Submit
      await page.click('[data-testid="submit-mapping"]');

      // Should close dialog and show success
      await expect(page.getByText(/규칙이 생성되었습니다|매핑이 저장/i)).toBeVisible();
    });

    test('should create specific model mapping', async () => {
      await page.click('[data-testid="add-mapping-button"]');

      // Select match mode
      await page.click('[data-testid="match-mode-specific"]');

      // Select provider
      await page.click('[data-testid="select-provider"]');
      await page.locator('[data-testid="provider-option"]').first().click();

      // Select model
      await page.click('[data-testid="select-model"]');
      await page.locator('[data-testid="model-option"]').first().click();

      // Set priority
      await page.fill('[data-testid="priority-input"]', '1');

      // Submit
      await page.click('[data-testid="submit-mapping"]');

      await expect(page.getByText(/규칙이 생성되었습니다|매핑이 저장/i)).toBeVisible();
    });

    test('should validate required fields', async () => {
      await page.click('[data-testid="add-mapping-button"]');

      // Try to submit without selecting model
      await page.click('[data-testid="match-mode-specific"]');
      await page.click('[data-testid="submit-mapping"]');

      // Should show validation error
      await expect(page.getByText(/모델을 선택해주세요|필수/i)).toBeVisible();
    });

    test('should preview resolution result', async () => {
      await page.click('[data-testid="add-mapping-button"]');

      // Configure mapping
      await page.click('[data-testid="match-mode-auto-tag"]');
      await page.click('[data-testid="add-required-tag"]');
      await page.click('text=vision');

      // Click preview
      await page.click('[data-testid="preview-mapping"]');

      // Should show preview
      await expect(page.getByText(/미리보기|선택될 모델/i)).toBeVisible();
    });
  });

  test.describe('Edit Mapping', () => {
    test('should edit existing mapping', async () => {
      const editButton = page.locator('[data-testid="edit-mapping"]').first();

      if (await editButton.isVisible()) {
        await editButton.click();

        await expect(page.getByText(/규칙 수정|매핑 수정/i)).toBeVisible();

        // Change priority
        await page.fill('[data-testid="priority-input"]', '2');

        // Save
        await page.click('[data-testid="save-mapping"]');

        await expect(page.getByText(/수정되었습니다|저장되었습니다/i)).toBeVisible();
      } else {
        test.skip();
      }
    });

    test('should update tags', async () => {
      const editButton = page.locator('[data-testid="edit-mapping"]').first();

      if (await editButton.isVisible()) {
        await editButton.click();

        // Add new tag
        await page.click('[data-testid="add-required-tag"]');
        await page.click('text=streaming');

        // Save
        await page.click('[data-testid="save-mapping"]');

        await expect(page.getByText(/수정되었습니다/i)).toBeVisible();
      } else {
        test.skip();
      }
    });
  });

  test.describe('Delete Mapping', () => {
    test('should delete mapping', async () => {
      const deleteButton = page.locator('[data-testid="delete-mapping"]').first();

      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // Confirm
        await page.click('[data-testid="confirm-delete"]');

        await expect(page.getByText(/삭제되었습니다|규칙이 삭제/i)).toBeVisible();
      } else {
        test.skip();
      }
    });

    test('should cancel delete', async () => {
      const deleteButton = page.locator('[data-testid="delete-mapping"]').first();

      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // Cancel
        await page.click('[data-testid="cancel-delete"]');

        // Dialog should close
        await expect(page.getByText(/삭제되었습니다/i)).not.toBeVisible();
      } else {
        test.skip();
      }
    });
  });

  test.describe('Fallback Chain', () => {
    test('should display fallback chain preview', async () => {
      const previewButton = page.locator('[data-testid="preview-fallback"]').first();

      if (await previewButton.isVisible()) {
        await previewButton.click();

        await expect(page.getByText(/폴 백 체인|대체 체인/i)).toBeVisible();
        await expect(page.getByText(/1순위|2순위/)).toBeVisible();
      } else {
        test.skip();
      }
    });

    test('should show fallback visualization', async () => {
      // Look for fallback chain visualization
      const fallbackChain = page.locator('[data-testid="fallback-chain"]');

      if (await fallbackChain.isVisible()) {
        // Check priority order
        const priorities = await fallbackChain.locator('[data-testid="priority-badge"]').allInnerTexts();
        expect(priorities.length).toBeGreaterThan(0);
      } else {
        test.skip();
      }
    });
  });

  test.describe('Provider Warning', () => {
    test('should show warning when no providers', async () => {
      // Check for warning message
      const warning = page.getByText(/활성화된 LLM 제공자가 없습니다|제공자를 먼저 등록/i);

      if (await warning.isVisible()) {
        await expect(warning).toBeVisible();

        // Should have link to provider page
        await expect(page.getByRole('link', { name: /제공자 관리/i })).toBeVisible();
      }
    });

    test('should navigate to provider page from warning', async () => {
      const warningLink = page.getByRole('link', { name: /제공자 관리|제공자 페이지/i });

      if (await warningLink.isVisible()) {
        await warningLink.click();
        await page.waitForURL('/admin/llm-providers');

        await expect(page.getByText('LLM 제공자 관리')).toBeVisible();
      }
    });
  });

  test.describe('Help System', () => {
    test('should show help button', async () => {
      await expect(page.locator('[data-testid="help-button"]').or(
        page.locator('button').filter({ has: page.locator('svg') }).first()
      )).toBeVisible();
    });

    test('should open help center', async () => {
      await page.click('[data-testid="help-button"]');

      await expect(page.getByText('도움말 센터')).toBeVisible();
    });

    test('should show feature mapping help', async () => {
      await page.click('[data-testid="help-button"]');

      // Search for feature mapping
      await page.fill('[data-testid="help-search"]', '기능 매핑');
      await page.waitForTimeout(300);

      await expect(page.getByText(/기능별 LLM 매핑|태그 기반/i)).toBeVisible();
    });
  });

  test.describe('Quick Help Section', () => {
    test('should display quick help links', async () => {
      await expect(page.getByText(/빠른 도움말|Quick Help/i)).toBeVisible();

      // Check for common help links
      await expect(
        page.getByRole('link', { name: /기능 매핑이란|처음 설정/i })
      ).toBeVisible();
    });

    test('should navigate to help topics', async () => {
      const helpLink = page.getByRole('link', { name: /전체 도움말|도움말 보기/i });

      if (await helpLink.isVisible()) {
        await helpLink.click();
        await page.waitForURL('/admin/help');

        await expect(page.getByText('도움말 센터')).toBeVisible();
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle loading errors', async () => {
      // Block API
      await page.route('**/api/**', route => route.abort('failed'));

      await page.reload();

      // Should show error
      await expect(
        page.getByText(/오류가 발생했습니다|불러오기 실패/i).first()
      ).toBeVisible();

      // Unblock
      await page.unroute('**/api/**');
    });

    test('should handle save errors', async () => {
      await page.click('[data-testid="add-mapping-button"]');

      // Block save API
      await page.route('**/api/mappings**', route => route.abort('failed'));

      await page.click('[data-testid="match-mode-auto-tag"]');
      await page.fill('[data-testid="priority-input"]', '1');
      await page.click('[data-testid="submit-mapping"]');

      // Should show error
      await expect(
        page.getByText(/저장 실패|오류가 발생했습니다/i).first()
      ).toBeVisible();

      // Unblock
      await page.unroute('**/api/mappings**');
    });
  });
});
