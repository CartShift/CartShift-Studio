#!/usr/bin/env node

/**
 * Puppeteer Diagnostic Script
 * Tests if Puppeteer can launch Chrome/Chromium successfully
 */

const puppeteer = require('puppeteer');

async function diagnose() {
  console.log('🔍 Diagnosing Puppeteer setup...\n');

  // Check Node version
  console.log('📦 Node version:', process.version);
  console.log('💻 Platform:', process.platform);
  console.log('🏗️  Architecture:', process.arch);
  console.log();

  // Check Puppeteer installation
  try {
    const puppeteerVersion = require('puppeteer/package.json').version;
    console.log('✅ Puppeteer installed:', puppeteerVersion);
  } catch (err) {
    console.error('❌ Puppeteer not found. Run: pnpm install');
    process.exit(1);
  }

  // Check environment variables
  console.log('\n🔧 Environment Variables:');
  console.log('  PUPPETEER_EXECUTABLE_PATH:', process.env.PUPPETEER_EXECUTABLE_PATH || 'not set');
  console.log(
    '  PUPPETEER_SKIP_CHROMIUM_DOWNLOAD:',
    process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD || 'not set'
  );
  console.log();

  // Try to launch browser
  console.log('🚀 Attempting to launch browser...');
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      timeout: 30000,
    });

    console.log('✅ Browser launched successfully!');

    // Get browser version
    const version = await browser.version();
    console.log('🌐 Browser version:', version);

    // Try to load a page
    console.log('\n📄 Testing page load...');
    const page = await browser.newPage();
    await page.goto('https://example.com', { waitUntil: 'domcontentloaded', timeout: 15000 });
    console.log('✅ Page loaded successfully!');

    // Take a screenshot
    console.log('\n📸 Testing screenshot...');
    const screenshot = await page.screenshot({ encoding: 'base64', type: 'jpeg', quality: 60 });
    console.log('✅ Screenshot captured (', screenshot.length, 'bytes)');

    await browser.close();

    console.log('\n✨ All tests passed! Puppeteer is working correctly.\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Puppeteer test failed:\n');
    console.error(error.message);
    console.error('\n📚 Troubleshooting:');
    console.error('  1. Check docs/STORE_ANALYZER_SETUP.md for setup instructions');
    console.error('  2. Install Chrome/Chromium:');
    console.error('     - Windows: Download from https://www.google.com/chrome/');
    console.error('     - macOS: brew install --cask google-chrome');
    console.error('     - Linux: sudo apt-get install chromium-browser');
    console.error('  3. Set PUPPETEER_EXECUTABLE_PATH to Chrome location');
    console.error('  4. Install missing system dependencies (Linux)');
    console.error('\n');

    if (browser) {
      await browser.close().catch(() => {});
    }

    process.exit(1);
  }
}

diagnose();
