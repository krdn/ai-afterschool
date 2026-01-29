import { chromium } from 'playwright';

async function main() {
  console.log('🚀 Starting automated browser test...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  try {
    // Step 1: Navigate to login page
    console.log('📍 Step 1: Navigating to login page...');
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(2000);

    let currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);

    // Step 2: Login
    if (currentUrl.includes('/login')) {
      console.log('🔐 Step 2: Logging in...');

      // Fill email
      await page.fill('input[type="email"], input[name="email"]', 'test@afterschool.com');
      console.log('   ✓ Email entered');

      // Fill password
      await page.fill('input[type="password"], input[name="password"]', 'test1234');
      console.log('   ✓ Password entered');

      // Submit form
      await page.click('button[type="submit"], button:has-text("로그인"), button:has-text("로그인하기")');
      console.log('   ✓ Login form submitted');

      // Wait for navigation
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      currentUrl = page.url();
      console.log(`   ✓ Logged in! Current URL: ${currentUrl}`);
    }

    // Step 3: Navigate to students list
    console.log('\n📍 Step 3: Navigating to students list...');
    await page.goto('http://localhost:3001/students');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: '/tmp/step-3-students-list.png', fullPage: true });
    console.log('   📸 Screenshot: /tmp/step-3-students-list.png');

    // Step 4: Click on first existing student (not /new)
    console.log('\n📍 Step 4: Opening student detail page...');
    const studentLinks = await page.locator('a[href*="/students/"]').all();
    console.log(`   Found ${studentLinks.length} student links`);

    // Find a link that's not /students/new
    let targetLink = null;
    for (const link of studentLinks) {
      const href = await link.getAttribute('href');
      if (href && href !== '/students/new' && href.match(/\/students\/[^/]+$/)) {
        targetLink = link;
        break;
      }
    }

    if (targetLink) {
      const href = await targetLink.getAttribute('href');
      console.log(`   Clicking: ${href}`);
      await targetLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      const studentUrl = page.url();
      console.log(`   ✓ Student detail page: ${studentUrl}`);

      await page.screenshot({ path: '/tmp/step-4-student-detail.png', fullPage: true });
      console.log('   📸 Full screenshot: /tmp/step-4-student-detail.png');

      // Step 5: Check AI Integration components
      console.log('\n🔍 Step 5: Verifying AI Integration components...\n');

      const checks = [
        { name: '통합 성향 분석 카드', selector: 'text=통합 성향 분석', required: true },
        { name: 'AI 맞춤형 제안 섹션', selector: 'text=AI 맞춤형 제안', required: true },
        { name: '맞춤형 학습 전략 패널', selector: 'text=맞춤형 학습 전략', required: true },
        { name: 'AI 진로 가이드 패널', selector: 'text=AI 진로 가이드', required: true },
        { name: '완료 아이콘 (체크)', selector: '[data-lucide="check-circle-2"]', required: false },
        { name: '대기 아이콘 (원)', selector: '[data-lucide="circle"]', required: false },
        { name: 'AI 생성 버튼', selector: 'text=AI 통합 분석 생성', required: false }
      ];

      const results = [];
      let allRequiredFound = true;

      for (const check of checks) {
        const count = await page.locator(check.selector).count();
        const found = count > 0;
        const status = found ? '✅' : '❌';
        const required = check.required ? ' (필수)' : '';
        console.log(`  ${status} ${check.name}: ${count}개${required}`);

        results.push({ name: check.name, found, count, required: check.required });
        if (check.required && !found) allRequiredFound = false;
      }

      // Summary
      console.log('\n' + '='.repeat(60));
      console.log('📊 테스트 요약');
      console.log('='.repeat(60));

      const foundCount = results.filter(r => r.found).length;
      const totalCount = results.length;
      const requiredCount = results.filter(r => r.required).length;
      const requiredFound = results.filter(r => r.required && r.found).length;

      console.log(`전체 컴포넌트: ${foundCount}/${totalCount}`);
      console.log(`필수 컴포넌트: ${requiredFound}/${requiredCount}`);

      if (allRequiredFound) {
        console.log('\n✅ 모든 필수 컴포넌트가 검출되었습니다!');
      } else {
        console.log('\n⚠️  일부 필수 컴포넌트를 찾지 못했습니다:');
        results.filter(r => r.required && !r.found).forEach(r => {
          console.log(`   ❌ ${r.name}`);
        });
      }

      // Step 6: Test responsive layout
      console.log('\n📱 Step 6: Testing responsive layout...');

      console.log('  📱 모바일 뷰 (375px)...');
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: '/tmp/step-6-mobile.png', fullPage: true });
      console.log('  📸 저장: /tmp/step-6-mobile.png');

      console.log('  🖥️  데스크톱 뷰 (1920px)...');
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: '/tmp/step-6-desktop.png', fullPage: true });
      console.log('  📸 저장: /tmp/step-6-desktop.png');

      // Final verdict
      console.log('\n' + '='.repeat(60));
      if (allRequiredFound) {
        console.log('🎉 테스트 통과! Phase 6 검증 완료');
      } else {
        console.log('❌ 테스트 실패 - 일부 컴포넌트 누락');
      }
      console.log('='.repeat(60));

    } else {
      console.log('\n⚠️  학생 데이터가 없습니다. 먼저 학생을 생성해주세요.');
      console.log('   테스트 계정: test@afterschool.com / test1234');
    }

    // Keep browser open for final inspection
    console.log('\n⏸️  브라우저를 10초간 열어두어 최종 확인을 할 수 있습니다...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await page.screenshot({ path: '/tmp/final-error.png', fullPage: true });
    console.log('📸 Error screenshot: /tmp/final-error.png');
  } finally {
    await browser.close();
    console.log('\n✅ 테스트 완료!');
    console.log('\n📸 모든 스크린샷은 /tmp/ 디렉토리에 저장되었습니다.');
  }
}

main().catch(console.error);
