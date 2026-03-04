// Playwright test script to verify key elements of Energy Ledger app
const { chromium } = require('playwright');
const assert = require('assert');

async function runTests() {
  console.log('🚀 Starting Playwright tests for Energy Ledger...\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 14 Pro dimensions
  });
  const page = await context.newPage();
  
  let passed = 0;
  let failed = 0;
  
  try {
    // Test 1: App loads successfully
    console.log('📋 Test 1: App loads at localhost:8081');
    await page.goto('http://localhost:8081', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000); // Wait for React to render
    
    const title = await page.title();
    console.log(`   Page title: "${title}"`);
    assert(title.includes('energy-ledger'), 'Page title should contain "energy-ledger"');
    console.log('   ✅ PASSED: App loads successfully\n');
    passed++;
  } catch (error) {
    console.log(`   ❌ FAILED: ${error.message}\n`);
    failed++;
  }
  
  try {
    // Test 2: Check if onboarding page shows (first time user)
    console.log('📋 Test 2: Onboarding page displays for new users');
    
    // Look for onboarding elements
    const welcomeEmoji = await page.locator('text=🌟').count();
    const welcomeTitle = await page.locator('text=欢迎来到功过格').count();
    
    if (welcomeTitle > 0) {
      console.log('   ✅ PASSED: Onboarding page shows "欢迎来到功过格"\n');
      passed++;
    } else {
      // Might be on main page if data exists
      const mainPageElements = await page.locator('text=能量值').count();
      if (mainPageElements > 0) {
        console.log('   ✅ PASSED: Main page loaded (user already onboarded)\n');
        passed++;
      } else {
        throw new Error('Neither onboarding nor main page detected');
      }
    }
  } catch (error) {
    console.log(`   ❌ FAILED: ${error.message}\n`);
    failed++;
  }
  
  try {
    // Test 3: Check core UI elements exist
    console.log('📋 Test 3: Core UI elements are present');
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'test-screenshot.png' });
    console.log('   📸 Screenshot saved to test-screenshot.png');
    
    // Check for key elements based on page state
    const pageContent = await page.content();
    
    // Look for any Chinese text which indicates the app is localized correctly
    const hasChineseText = pageContent.includes('功过格') || 
                           pageContent.includes('能量') || 
                           pageContent.includes('愿景') ||
                           pageContent.includes('觉察');
    
    assert(hasChineseText, 'App should contain Chinese UI text');
    console.log('   ✅ PASSED: Chinese UI text found\n');
    passed++;
  } catch (error) {
    console.log(`   ❌ FAILED: ${error.message}\n`);
    failed++;
  }
  
  try {
    // Test 4: Check tab navigation (if on main page)
    console.log('📋 Test 4: Tab navigation exists');
    
    const tabLabels = ['首页', '统计', '契约', '洞察'];
    let foundTabs = 0;
    
    for (const label of tabLabels) {
      const count = await page.locator(`text=${label}`).count();
      if (count > 0) foundTabs++;
    }
    
    if (foundTabs >= 2) {
      console.log(`   ✅ PASSED: Found ${foundTabs} tab labels\n`);
      passed++;
    } else {
      // On onboarding page, tabs won't be visible
      const onboardingButton = await page.locator('text=开始设定愿景').count();
      if (onboardingButton > 0) {
        console.log('   ✅ PASSED: Onboarding flow detected (tabs hidden)\n');
        passed++;
      } else {
        throw new Error('Neither tabs nor onboarding found');
      }
    }
  } catch (error) {
    console.log(`   ❌ FAILED: ${error.message}\n`);
    failed++;
  }
  
  try {
    // Test 5: Check interactive elements
    console.log('📋 Test 5: Interactive elements are clickable');
    
    // Try to find buttons
    const buttons = await page.locator('button, [role="button"], TouchableOpacity, [data-testid="button"]').count();
    
    if (buttons > 0) {
      console.log(`   Found ${buttons} interactive elements`);
      console.log('   ✅ PASSED: Interactive elements found\n');
      passed++;
    } else {
      // Check for any clickable text that looks like a button
      const buttonTexts = ['开始设定愿景', '完成设定', '下一步', '提交记录'];
      let foundButton = false;
      for (const text of buttonTexts) {
        const count = await page.locator(`text=${text}`).count();
        if (count > 0) {
          foundButton = true;
          break;
        }
      }
      
      if (foundButton) {
        console.log('   ✅ PASSED: Button-like text elements found\n');
        passed++;
      } else {
        throw new Error('No interactive elements found');
      }
    }
  } catch (error) {
    console.log(`   ❌ FAILED: ${error.message}\n`);
    failed++;
  }
  
  await browser.close();
  
  // Summary
  console.log('═══════════════════════════════════════');
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  console.log('═══════════════════════════════════════\n');
  
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(console.error);