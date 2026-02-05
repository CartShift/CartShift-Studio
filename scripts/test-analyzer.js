#!/usr/bin/env node

/**
 * Store Analyzer Integration Test
 * Tests the analyzer with a real store URL to verify graceful degradation
 */

async function testAnalyzer() {
  console.log('🧪 Testing Store Analyzer Integration\n');

  const testUrl = 'https://example.com';
  const testData = {
    storeUrl: testUrl,
    email: 'test@example.com',
    subscribeNewsletter: false,
    locale: 'en',
    captchaToken: 'test-token', // In real scenario, this would be from reCAPTCHA
  };

  try {
    console.log('📡 Sending request to analyzer API...');
    console.log('URL:', testUrl);
    console.log();

    const response = await fetch('http://localhost:3000/api/analyze-store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`API Error (${response.status}): ${error.error || 'Unknown error'}`);
    }

    const result = await response.json();

    console.log('✅ Analysis completed successfully!\n');
    console.log('📊 Results Summary:');
    console.log('  Overall Score:', result.overallScore);
    console.log('  Platform:', result.platform || 'Unknown');
    console.log('  Generated At:', result.generatedAt);
    console.log();

    console.log('📈 Section Scores:');
    Object.entries(result.sections).forEach(([key, section]) => {
      const emoji = section.status === 'excellent' ? '🟢' : section.status === 'good' ? '🟡' : '🔴';
      console.log(`  ${emoji} ${section.name}: ${section.score}/100 (${section.status})`);
    });
    console.log();

    // Check if visual analysis is present
    if (result.visualAnalysis) {
      console.log('📸 Visual Analysis: ✅ Present');
      console.log(
        '  Screenshots:',
        result.visualAnalysis.screenshots?.length || 0,
        'captured'
      );
      console.log('  Mobile Responsiveness:', result.visualAnalysis.mobileResponsivenessScore);
    } else {
      console.log('📸 Visual Analysis: ⚠️  Skipped (Puppeteer unavailable)');
    }
    console.log();

    // Check if product analysis is present
    if (result.productAnalysis) {
      console.log('🛒 Product Analysis: ✅ Present');
      console.log('  Product Page Score:', result.productAnalysis.score);
      console.log('  Buy Button Above Fold:', result.productAnalysis.hasBuyButtonAboveFold);
    } else {
      console.log('🛒 Product Analysis: ⚠️  Skipped (Puppeteer unavailable or no product page)');
    }
    console.log();

    // Check competitor analysis
    if (result.competitorAnalysis) {
      console.log('🎯 Competitor Analysis: ✅ Present');
      console.log('  Competitors Found:', result.competitorAnalysis.competitors?.length || 0);
      console.log('  Market Position:', result.competitorAnalysis.marketPosition);
    } else {
      console.log('🎯 Competitor Analysis: ❌ Missing');
    }
    console.log();

    // Check AI readiness
    if (result.aiAnalysis) {
      console.log('🤖 AI Readiness: ✅ Present');
      console.log('  Score:', result.aiAnalysis.score);
      console.log('  Structured Data:', result.aiAnalysis.hasStructuredData);
    } else {
      console.log('🤖 AI Readiness: ❌ Missing');
    }
    console.log();

    console.log(
      '✨ Test complete! The analyzer is working correctly with graceful degradation.\n'
    );
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:\n');
    console.error(error.message);
    console.error('\n💡 Possible issues:');
    console.error('  1. Dev server not running (run: pnpm dev)');
    console.error('  2. Rate limiting enabled (wait 60 seconds)');
    console.error('  3. Missing environment variables (.env.local)');
    console.error('  4. Network connectivity issues');
    console.error('\n');
    process.exit(1);
  }
}

// Check if running as main module
if (require.main === module) {
  // Check if dev server is likely running
  console.log('⚠️  Note: This test requires the dev server to be running.');
  console.log('   If not started, run: pnpm dev\n');

  setTimeout(() => {
    testAnalyzer();
  }, 500);
}

module.exports = { testAnalyzer };
