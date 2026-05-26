function isCloudRuntime() {
  return (
    Boolean(process.env.K_SERVICE) ||
    Boolean(process.env.FUNCTION_TARGET) ||
    (Boolean(process.env.GCLOUD_PROJECT) && !process.env.FUNCTIONS_EMULATOR)
  );
}

async function launchPdfBrowser() {
  const puppeteer = require('puppeteer-core');

  if (isCloudRuntime()) {
    const chromium = require('@sparticuz/chromium');
    chromium.setGraphicsMode = false;

    return puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 794, height: 1123, deviceScaleFactor: 1 },
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
  }

  const fs = require('fs');
  const localChromePaths = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    process.platform === 'win32'
      ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
      : process.platform === 'darwin'
        ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
        : '/usr/bin/google-chrome',
  ].filter(Boolean);

  for (const executablePath of localChromePaths) {
    if (fs.existsSync(executablePath)) {
      return puppeteer.launch({
        executablePath,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        defaultViewport: { width: 794, height: 1123, deviceScaleFactor: 1 },
      });
    }
  }

  throw new Error('No Chrome executable found for PDF generation');
}

async function generateStoreAnalysisPDF(results, storeUrl, texts, isRtl) {
  const { buildStoreAnalysisReportHtml } = require('./store-analysis-report-html');
  const html = buildStoreAnalysisReportHtml(results, storeUrl, texts, isRtl);
  const browser = await launchPdfBrowser();

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60_000 });
    await page.emulateMediaType('print');

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '12mm', right: '10mm', bottom: '12mm', left: '10mm' },
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

module.exports = { generateStoreAnalysisPDF };
