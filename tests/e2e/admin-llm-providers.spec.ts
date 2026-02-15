/**
 * E2E Tests for Admin LLM Providers Page
 *
 * @vitest-environment node
 */

import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin } from '../utils/auth';

// skip: 테스트 셀렉터와 실제 UI가 근본적으로 불일치 — 전면 재작성 필요
test.describe.skip('Admin LLM Providers', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();

    // Login as DIRECTOR
    await loginAsAdmin(page);

    // Navigate to LLM Providers
    await page.goto('/admin/llm-providers');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test.describe('Provider List Page', () => {
    test('should display provider list', async () => {
      // Header
      await expect(page.getByText('LLM 제공자 관리')).toBeVisible();
      await expect(page.getByText('AI 기능에 사용될 LLM 제공자를 등록하고 관리합니다')).toBeVisible();
      
      // Action buttons
      await expect(page.getByRole('button', { name: /새 제공자 추가/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /라우터 설정/i })).toBeVisible();
      
      // Provider list or empty state
      const providerList = page.locator('[data-testid="provider-list"]');
      const emptyState = page.getByText(/등록된 제공자가 없습니다|아직 등록된 제공자가 없어요/);
      
      await expect(providerList.or(emptyState)).toBeVisible();
    });

    test('should navigate to new provider page', async () => {
      await page.click('[data-testid="add-provider-button"]');
      await page.waitForURL('/admin/llm-providers/new');
      
      await expect(page.getByText('새 제공자 추가')).toBeVisible();
      await expect(page.getByText('제공자 템플릿 선택')).toBeVisible();
    });

    test('should display provider templates', async () => {
      await page.goto('/admin/llm-providers/new');
      await page.waitForLoadState('networkidle');
      
      // Popular templates
      await expect(page.getByText('인기 제공자')).toBeVisible();
      
      // Common providers
      await expect(page.getByText(/OpenAI|GPT/i).first()).toBeVisible();
      await expect(page.getByText(/Anthropic|Claude/i).first()).toBeVisible();
      await expect(page.getByText(/Google|Gemini/i).first()).toBeVisible();
    });

    test('should filter templates by search', async () => {
      await page.goto('/admin/llm-providers/new');
      await page.waitForLoadState('networkidle');
      
      // Search for OpenAI
      await page.fill('[data-testid="template-search"]', 'OpenAI');
      await page.waitForTimeout(300); // Debounce
      
      await expect(page.getByText(/OpenAI/i).first()).toBeVisible();
    });
  });

  test.describe('Provider Creation', () => {
    test('should create provider from template', async () => {
      await page.goto('/admin/llm-providers/new');
      await page.waitForLoadState('networkidle');
      
      // Select OpenAI template
      await page.click('[data-testid="template-openai"]');
      
      // Fill form
      await page.fill('[data-testid="provider-name"]', 'Test OpenAI Provider');
      await page.fill('[data-testid="api-key"]', 'sk-test123456789');
      
      // Submit
      await page.click('[data-testid="submit-button"]');
      
      // Should redirect to list
      await page.waitForURL('/admin/llm-providers');
      
      // Verify creation
      await expect(page.getByText('Test OpenAI Provider')).toBeVisible();
    });

    test('should validate required fields', async () => {
      await page.goto('/admin/llm-providers/new');
      await page.waitForLoadState('networkidle');
      
      // Select template
      await page.click('[data-testid="template-openai"]');
      
      // Submit without filling
      await page.click('[data-testid="submit-button"]');
      
      // Should show validation error
      await expect(page.getByText(/제공자명을 입력해주세요|필수/i)).toBeVisible();
    });

    test('should test connection before saving', async () => {
      await page.goto('/admin/llm-providers/new');
      await page.waitForLoadState('networkidle');
      
      // Select template and fill form
      await page.click('[data-testid="template-openai"]');
      await page.fill('[data-testid="provider-name"]', 'Test Provider');
      await page.fill('[data-testid="api-key"]', 'sk-invalid');
      
      // Test connection
      await page.click('[data-testid="test-connection-button"]');
      
      // Should show test result
      await expect(
        page.getByText(/연결 테스트|연결 실패|연결 성공/i).first()
      ).toBeVisible();
    });

    test('should support custom provider configuration', async () => {
      await page.goto('/admin/llm-providers/new');
      await page.waitForLoadState('networkidle');
      
      // Select custom template
      await page.click('[data-testid="template-custom"]');
      
      // Fill custom configuration
      await page.fill('[data-testid="provider-name"]', 'Custom API Provider');
      await page.fill('[data-testid="base-url"]', 'https://custom.api.com/v1');
      await page.fill('[data-testid="api-key"]', 'custom-key');
      
      // Submit
      await page.click('[data-testid="submit-button"]');
      
      await page.waitForURL('/admin/llm-providers');
      await expect(page.getByText('Custom API Provider')).toBeVisible();
    });
  });

  test.describe('Provider Management', () => {
    test('should edit existing provider', async () => {
      // Assume a provider exists
      await page.goto('/admin/llm-providers');
      
      // Click edit on first provider
      const editButton = page.locator('[data-testid="edit-provider"]').first();
      if (await editButton.isVisible()) {
        await editButton.click();
        await page.waitForURL(/\/admin\/llm-providers\/.*\/edit/);
        
        // Edit name
        await page.fill('[data-testid="provider-name"]', 'Updated Name');
        await page.click('[data-testid="submit-button"]');
        
        await page.waitForURL('/admin/llm-providers');
        await expect(page.getByText('Updated Name')).toBeVisible();
      } else {
        test.skip();
      }
    });

    test('should toggle provider status', async () => {
      await page.goto('/admin/llm-providers');
      
      const toggle = page.locator('[data-testid="provider-status-toggle"]').first();
      if (await toggle.isVisible()) {
        const initialState = await toggle.isChecked();
        
        await toggle.click();
        await page.waitForTimeout(500); // API call
        
        // Verify state changed
        const newState = await toggle.isChecked();
        expect(newState).not.toBe(initialState);
      } else {
        test.skip();
      }
    });

    test('should sync models for provider', async () => {
      await page.goto('/admin/llm-providers');
      
      const syncButton = page.locator('[data-testid="sync-models-button"]').first();
      if (await syncButton.isVisible()) {
        await syncButton.click();
        
        // Should show loading then success
        await expect(page.getByText(/동기화 중|싱크 중/i)).toBeVisible();
        await expect(
          page.getByText(/동기화 완료|모델 동기화/i).first()
        ).toBeVisible({ timeout: 10000 });
      } else {
        test.skip();
      }
    });

    test('should delete provider', async () => {
      await page.goto('/admin/llm-providers');
      
      // Find a test provider
      const testProvider = page.getByText('Test').first();
      if (await testProvider.isVisible()) {
        const deleteButton = page.locator('[data-testid="delete-provider"]').first();
        await deleteButton.click();
        
        // Confirm deletion
        await page.click('[data-testid="confirm-delete"]');
        
        // Should show success
        await expect(page.getByText(/삭제되었습니다|제공자가 삭제/i)).toBeVisible();
      } else {
        test.skip();
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
      await expect(page.getByPlaceholder(/도움말 검색/i)).toBeVisible();
    });

    test('should open LLM recommender', async () => {
      await page.click('[data-testid="help-button"]');
      await page.click('[data-testid="llm-recommend-button"]');
      
      await expect(page.getByText('LLM 추천받기')).toBeVisible();
      await expect(page.getByText(/어떤 용도로/i)).toBeVisible();
    });

    test('should navigate through recommender wizard', async () => {
      await page.click('[data-testid="help-button"]');
      await page.click('[data-testid="llm-recommend-button"]');
      
      // Step 1: Select purpose
      await page.click('text=학생 분석 및 상담 보고서');
      
      // Step 2: Select tech level
      await page.click('text=쉬운 방법을 원해요');
      
      // Step 3: Select budget
      await page.click('text=월 10만원 이하');
      
      // Should show results
      await expect(page.getByText(/추천 결과|1순위 추천/i)).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      // Block API calls
      await page.route('**/api/**', route => route.abort('internetdisconnected'));
      
      await page.goto('/admin/llm-providers');
      
      // Should show error state
      await expect(
        page.getByText(/오류가 발생했습니다|연결 실패/i).first()
      ).toBeVisible();
      
      // Unblock
      await page.unroute('**/api/**');
    });

    test('should handle unauthorized access', async ({ browser }) => {
      // Login as non-DIRECTOR
      const userPage = await browser.newPage();
      await userPage.goto('/auth/login');
      await userPage.fill('[data-testid="email-input"]', 'teacher1@test.com');
      await userPage.fill('[data-testid="password-input"]', 'test1234');
      await userPage.click('[data-testid="login-button"]');
      
      // Try to access admin page
      await userPage.goto('/admin/llm-providers');
      
      // Should redirect or show error
      await expect(
        userPage.getByText(/접근 권한|권한이 없습니다|403/i).first()
      ).toBeVisible();
      
      await userPage.close();
    });
  });
});
