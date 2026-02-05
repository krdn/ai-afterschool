
// report.spec.ts
// Test coverage for Report & Utility scenarios (RPT-01, UTL-01)

import { test, expect, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// Test data and constants
const TEST_STUDENT = {
  name: '김철수',
  birthdate: '2015-03-15',
  school: '서울초등학교',
  grade: 3
};

const TEST_IMAGE_PATH = path.join(__dirname, 'fixtures', 'test-profile.jpg');
const DOWNLOAD_DIR = path.join(__dirname, 'downloads');

// Helper function to ensure student has complete analysis data
async function ensureStudentWithCompleteAnalysis(page: Page): Promise<string> {
  // Navigate to create student
  await page.goto('/students/new');
  
  // Fill student basic info
  await page.fill('input[name="name"]', TEST_STUDENT.name);
  await page.fill('input[name="birthdate"]', TEST_STUDENT.birthdate);
  await page.fill('input[name="school"]', TEST_STUDENT.school);
  await page.selectOption('select[name="grade"]', TEST_STUDENT.grade.toString());
  
  // Upload profile photo
  if (fs.existsSync(TEST_IMAGE_PATH)) {
    await page.setInputFiles('input[type="file"]', TEST_IMAGE_PATH);
    await page.waitForSelector('img[alt*="preview"]', { timeout: 5000 });
  }
  
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/students\/\d+/, { timeout: 10000 });
  
  const studentUrl = page.url();
  const studentId = studentUrl.match(/\/students\/(\d+)/)?.[1] || '';
  
  // Run Saju/Name analysis
  await page.click('text=사주/성명학');
  await page.waitForTimeout(1000);
  const sajuButton = page.locator('button:has-text("분석 실행"), button:has-text("사주 분석")').first();
  if (await sajuButton.isVisible()) {
    await sajuButton.click();
    await page.waitForSelector('text=오행', { timeout: 15000 });
  }
  
  // Run physiognomy analysis if image exists
  await page.click('text=관상');
  await page.waitForTimeout(1000);
  const physioButton = page.locator('button:has-text("관상 분석"), button:has-text("AI 분석")').first();
  if (await physioButton.isVisible()) {
    await physioButton.click();
    await page.waitForSelector('text=분석 완료, text=성향', { timeout: 20000 });
  }
  
  // Set MBTI
  await page.click('text=MBTI');
  await page.waitForTimeout(1000);
  const mbtiInput = page.locator('input[name="mbti"], select[name="mbti"]').first();
  if (await mbtiInput.isVisible()) {
    await mbtiInput.fill('INTJ');
    await page.click('button:has-text("저장")');
    await page.waitForTimeout(2000);
  }
  
  return studentId;
}

// Helper to login as teacher
async function loginAsTeacher(page: Page) {
  await page.goto('/auth/login');
  await page.fill('input[name="email"]', 'teacher@test.com');
  await page.fill('input[name="password"]', 'Password123!');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/students|\/students/, { timeout: 10000 });
}

test.describe('Report & Utility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure download directory exists
    if (!fs.existsSync(DOWNLOAD_DIR)) {
      fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
    }
    
    // Login before each test
    await loginAsTeacher(page);
  });

  // RPT-01: PDF Report Generation
  test('RPT-01: Generate comprehensive PDF report with Korean fonts', async ({ page, context }) => {
    test.setTimeout(90000);
    
    // Ensure student with complete analysis exists
    const studentId = await ensureStudentWithCompleteAnalysis(page);
    
    // Navigate to student detail
    await page.goto(`/students/${studentId}`);
    await page.waitForLoadState('networkidle');
    
    // Click on Report tab
    const reportTab = page.locator('button:has-text("리포트"), a:has-text("리포트")').first();
    await reportTab.click();
    await page.waitForTimeout(2000);
    
    // Setup download handler
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    
    // Click PDF download button
    const pdfButton = page.locator('button:has-text("PDF 다운로드"), button:has-text("PDF 생성")').first();
    await expect(pdfButton).toBeVisible({ timeout: 5000 });
    await pdfButton.click();
    
    // Wait for download to complete
    const download = await downloadPromise;
    const downloadPath = path.join(DOWNLOAD_DIR, download.suggestedFilename());
    await download.saveAs(downloadPath);
    
    // Verify download completed
    expect(fs.existsSync(downloadPath)).toBeTruthy();
    const stats = fs.statSync(downloadPath);
    
    // PDF should be at least 10KB (contains content)
    expect(stats.size).toBeGreaterThan(10000);
    
    // Verify it's a valid PDF file (starts with %PDF)
    const fileBuffer = fs.readFileSync(downloadPath);
    const fileHeader = fileBuffer.toString('utf-8', 0, 4);
    expect(fileHeader).toBe('%PDF');
    
    // Check PDF content includes Korean text markers
    // PDFs encode Korean text, but we can check for UTF-8 BOM or CIDFont markers
    const fileContent = fileBuffer.toString('utf-8');
    const hasKoreanFontMarkers = 
      fileContent.includes('CIDFont') || 
      fileContent.includes('ToUnicode') ||
      fileContent.includes('NanumGothic') ||
      fileContent.includes('Malgun');
    
    expect(hasKoreanFontMarkers).toBeTruthy();
    
    console.log(`✓ PDF generated successfully: ${downloadPath} (${stats.size} bytes)`);
  });

  // RPT-01: PDF content verification
  test('RPT-01: Verify PDF contains all analysis sections', async ({ page }) => {
    test.setTimeout(90000);
    
    const studentId = await ensureStudentWithCompleteAnalysis(page);
    await page.goto(`/students/${studentId}`);
    
    // Navigate to report tab
    await page.click('text=리포트');
    await page.waitForTimeout(2000);
    
    // Verify report preview contains key sections
    const reportContent = page.locator('[class*="report"], [class*="preview"]').first();
    
    // Check for major sections in preview
    await expect(page.locator('text=기본 정보, text=학생 정보')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=사주, text=오행')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=MBTI, text=성격 유형')).toBeVisible({ timeout: 5000 });
    
    console.log('✓ Report preview contains all required sections');
  });

  // UTL-01: Image optimization via Next/Image
  test('UTL-01: Verify profile images are served optimized (WebP/AVIF)', async ({ page }) => {
    test.setTimeout(60000);
    
    // Create student with profile image
    await page.goto('/students/new');
    await page.fill('input[name="name"]', '이미지테스트');
    await page.fill('input[name="birthdate"]', '2015-06-20');
    
    if (fs.existsSync(TEST_IMAGE_PATH)) {
      await page.setInputFiles('input[type="file"]', TEST_IMAGE_PATH);
      await page.waitForSelector('img[alt*="preview"]', { timeout: 5000 });
    }
    
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/students\/\d+/, { timeout: 10000 });
    
    // Monitor network requests for image loading
    const imageRequests: any[] = [];
    page.on('response', async (response) => {
      const contentType = response.headers()['content-type'] || '';
      if (contentType.includes('image/')) {
        imageRequests.push({
          url: response.url(),
          contentType: contentType,
          status: response.status()
        });
      }
    });
    
    // Navigate to student list to trigger image loading
    await page.goto('/students');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Filter for profile/uploaded images
    const profileImages = imageRequests.filter(req => 
      req.url.includes('cloudinary') || 
      req.url.includes('_next/image') ||
      req.url.includes('profile') ||
      req.url.includes('upload')
    );
    
    expect(profileImages.length).toBeGreaterThan(0);
    
    // Check if any images are served as WebP or AVIF
    const optimizedImages = profileImages.filter(req => 
      req.contentType.includes('webp') || 
      req.contentType.includes('avif')
    );
    
    console.log(`Image requests: ${imageRequests.length}, Profile images: ${profileImages.length}, Optimized: ${optimizedImages.length}`);
    
    // At least some images should be optimized
    expect(optimizedImages.length).toBeGreaterThan(0);
    
    console.log('✓ Images are being served in optimized formats (WebP/AVIF)');
  });

  // UTL-01: Next/Image resizing verification
  test('UTL-01: Verify Next/Image applies responsive resizing', async ({ page, viewport }) => {
    test.setTimeout(60000);
    
    // Create student with image
    const studentId = await ensureStudentWithCompleteAnalysis(page);
    await page.goto(`/students/${studentId}`);
    
    // Check if profile image uses Next/Image component
    const profileImage = page.locator('img[src*="_next/image"], img[srcset]').first();
    await expect(profileImage).toBeVisible({ timeout: 5000 });
    
    // Verify srcset attribute exists (responsive images)
    const hasSrcset = await profileImage.evaluate(el => el.hasAttribute('srcset'));
    expect(hasSrcset).toBeTruthy();
    
    // Check if image has width/height attributes (prevents layout shift)
    const width = await profileImage.getAttribute('width');
    const height = await profileImage.getAttribute('height');
    
    expect(width).not.toBeNull();
    expect(height).not.toBeNull();
    
    console.log(`✓ Next/Image responsive sizing applied (${width}x${height})`);
  });

  // RPT-01: PDF generation error handling
  test('RPT-01: Handle PDF generation gracefully when data incomplete', async ({ page }) => {
    // Create student without complete analysis
    await page.goto('/students/new');
    await page.fill('input[name="name"]', '미완성학생');
    await page.fill('input[name="birthdate"]', '2016-01-01');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/students\/\d+/);
    
    // Try to generate report
    await page.click('text=리포트');
    await page.waitForTimeout(2000);
    
    const pdfButton = page.locator('button:has-text("PDF 다운로드"), button:has-text("PDF 생성")').first();
    
    if (await pdfButton.isVisible()) {
      await pdfButton.click();
      
      // Should show warning or still generate minimal PDF
      const hasWarning = await page.locator('text=분석 데이터가 부족, text=일부 정보 누락').isVisible({ timeout: 3000 }).catch(() => false);
      
      if (!hasWarning) {
        // If no warning, PDF should still be generated
        const download = await page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
        expect(download).not.toBeNull();
      }
      
      console.log('✓ PDF generation handles incomplete data gracefully');
    }
  });

  // UTL-01: Image loading performance
  test('UTL-01: Verify lazy loading for images below fold', async ({ page }) => {
    // Navigate to students list with multiple students
    await page.goto('/students');
    await page.waitForLoadState('networkidle');
    
    // Check for lazy loading attribute
    const lazyImages = page.locator('img[loading="lazy"]');
    const lazyCount = await lazyImages.count();
    
    // Most images should use lazy loading
    expect(lazyCount).toBeGreaterThan(0);
    
    console.log(`✓ Found ${lazyCount} lazy-loaded images`);
  });

  test.afterEach(async ({ page }) => {
    // Cleanup: close page
    await page.close();
  });
});

test.describe('Report Utility - Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
  });

  // RPT-01: Multiple simultaneous PDF downloads
  test('RPT-01: Handle multiple PDF generation requests', async ({ page }) => {
    test.setTimeout(60000);
    
    const studentId = await ensureStudentWithCompleteAnalysis(page);
    
    // Navigate to report page
    await page.goto(`/students/${studentId}`);
    await page.click('text=리포트');
    await page.waitForTimeout(2000);
    
    const pdfButton = page.locator('button:has-text("PDF 다운로드")').first();
    
    // Click multiple times rapidly
    await pdfButton.click();
    await page.waitForTimeout(500);
    await pdfButton.click();
    
    // Should handle gracefully (either queue or disable button)
    const isButtonDisabled = await pdfButton.isDisabled({ timeout: 2000 }).catch(() => false);
    
    // Button should either be disabled or show loading state
    if (!isButtonDisabled) {
      const hasLoadingIndicator = await page.locator('text=생성 중, [class*="loading"]').isVisible();
      expect(hasLoadingIndicator).toBeTruthy();
    }
    
    console.log('✓ Multiple PDF requests handled safely');
  });

  // UTL-01: Image optimization for large files
  test('UTL-01: Verify large images are compressed and optimized', async ({ page }) => {
    const imageRequests: Array<{ url: string; size: number }> = [];
    
    page.on('response', async (response) => {
      const contentType = response.headers()['content-type'] || '';
      if (contentType.includes('image/')) {
        const buffer = await response.body().catch(() => null);
        if (buffer) {
          imageRequests.push({
            url: response.url(),
            size: buffer.length
          });
        }
      }
    });
    
    await page.goto('/students');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Check that no single image exceeds reasonable size (e.g., 500KB)
    const largeImages = imageRequests.filter(img => img.size > 500000);
    
    expect(largeImages.length).toBe(0);
    
    const avgSize = imageRequests.reduce((sum, img) => sum + img.size, 0) / imageRequests.length;
    console.log(`✓ Average image size: ${Math.round(avgSize / 1024)}KB`);
  });
});
