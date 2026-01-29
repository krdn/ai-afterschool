import { chromium } from 'playwright';

async function main() {
  console.log('🚀 Starting browser test...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  try {
    // Navigate to homepage
    console.log('📍 Navigating to http://localhost:3001...');
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(2000);

    const title = await page.title();
    console.log(`📄 Page title: "${title}"`);

    // Take screenshot
    await page.screenshot({ path: '/tmp/01-homepage.png', fullPage: true });
    console.log('📸 Screenshot saved: /tmp/01-homepage.png');

    // Check if redirecting to login
    const url = page.url();
    console.log(`🔗 Current URL: ${url}`);

    if (url.includes('/login')) {
      console.log('\n🔐 Authentication required - showing login page');

      // Wait for user to login manually
      console.log('\n⏸️  Please login manually in the browser...');
      console.log('   Waiting for navigation away from login page...\n');

      // Wait for URL to change (user logged in)
      await page.waitForURL(u => !u.toString().includes('/login'), { timeout: 60000 });
      console.log('✅ Login detected!');

      await page.waitForTimeout(2000);

      // Now try to navigate to students
      console.log('\n📍 Navigating to /students...');
      await page.goto('http://localhost:3001/students');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await page.screenshot({ path: '/tmp/02-students-list.png', fullPage: true });
      console.log('📸 Screenshot saved: /tmp/02-students-list.png');

      // Look for student links
      const allLinks = await page.locator('a[href*="/students/"]').all();
      console.log(`\n📋 Found ${allLinks.length} student detail links`);

      if (allLinks.length > 0) {
        console.log('\n📍 Clicking first student link...');
        await allLinks[0].click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);

        const currentUrl = page.url();
        console.log(`🔗 Student detail URL: ${currentUrl}`);

        await page.screenshot({ path: '/tmp/03-student-detail-full.png', fullPage: true });
        console.log('📸 Full screenshot saved: /tmp/03-student-detail-full.png');

        // Check for AI Integration components
        console.log('\n🔍 Checking for AI Integration components...\n');

        const checks = [
          { name: '통합 성향 분석 (Personality Summary)', selector: 'text=통합 성향 분석' },
          { name: 'AI 맞춤형 제안 (AI Strategy)', selector: 'text=AI 맞춤형 제안' },
          { name: '맞춤형 학습 전략 (Learning Strategy)', selector: 'text=맞춤형 학습 전략' },
          { name: 'AI 진로 가이드 (Career Guidance)', selector: 'text=AI 진로 가이드' },
          { name: 'AI 통합 분석 생성 버튼', selector: 'text=AI 통합 분석 생성' },
          { name: '완료 아이콘 (check-circle)', selector: '[data-lucide="check-circle-2"]' },
          { name: '대기 아이콘 (circle)', selector: '[data-lucide="circle"]' }
        ];

        const results = [];
        for (const check of checks) {
          const count = await page.locator(check.selector).count();
          const status = count > 0 ? '✅ Found' : '❌ Not found';
          console.log(`  ${status} - ${check.name} (${count} items)`);
          results.push({ name: check.name, found: count > 0, count });
        }

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 TEST SUMMARY');
        console.log('='.repeat(60));

        const found = results.filter(r => r.found).length;
        const total = results.length;
        console.log(`Components found: ${found}/${total}`);

        if (found === total) {
          console.log('\n✅ ALL COMPONENTS DETECTED!');
        } else {
          console.log('\n⚠️  Some components are missing:');
          results.filter(r => !r.found).forEach(r => {
            console.log(`   - ${r.name}`);
          });
        }

        // Test responsive layout
        console.log('\n📱 Testing responsive layout...');

        console.log('  📱 Mobile view (375px)...');
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(1000);
        await page.screenshot({ path: '/tmp/04-mobile-view.png', fullPage: true });
        console.log('  📸 Saved: /tmp/04-mobile-view.png');

        console.log('  🖥️  Desktop view (1920px)...');
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.waitForTimeout(1000);
        await page.screenshot({ path: '/tmp/05-desktop-view.png', fullPage: true });
        console.log('  📸 Saved: /tmp/05-desktop-view.png');

      } else {
        console.log('\n⚠️  No student links found. You may need to create a student first.');
      }

    } else {
      console.log('\n✓ No authentication required or already logged in');
    }

    // Keep browser open for manual inspection
    console.log('\n⏸️  Keeping browser open for 30 seconds for manual inspection...');
    console.log('   You can interact with the page manually.\n');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await page.screenshot({ path: '/tmp/error.png', fullPage: true });
    console.log('📸 Error screenshot saved: /tmp/error.png');
  } finally {
    await browser.close();
    console.log('\n✅ Test complete!');
    console.log('\n📸 All screenshots saved to /tmp/:');
    console.log('   - 01-homepage.png');
    console.log('   - 02-students-list.png (if accessed)');
    console.log('   - 03-student-detail-full.png (if accessed)');
    console.log('   - 04-mobile-view.png (if accessed)');
    console.log('   - 05-desktop-view.png (if accessed)');
  }
}

main().catch(console.error);
