/**
 * Real Chromium desktop and mobile QA against a local Next.js German-enabled
 * build. This never visits production or submits forms.
 */
import puppeteer from 'puppeteer';

const baseUrl = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3210';
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
});

const failures = [];
const pages = [
  '/',
  '/solutions/shopify',
  '/solutions/wordpress',
  '/solutions/seo',
  '/about',
  '/work',
  '/contact',
  '/blog',
  '/services/shopify-conversion-optimization',
  '/services/shopify-b2b-integrations',
  '/services/shopify-performance-seo',
  '/services/shopify-subscriptions',
  '/services/wordpress-security',
  '/free-store-review',
  '/tools',
  '/tools/client-portal',
  '/industries/fashion',
  '/industries/local',
  '/blog/abandoned-cart-recovery-strategies-2026',
  '/work/alondon-community-portal',
  '/privacy',
  '/terms',
];
const viewports = [
  { name: 'desktop', width: 1440, height: 900, deviceScaleFactor: 1 },
  { name: 'mobile', width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
];

async function collect(page, path, lang) {
  const response = await page.goto(baseUrl + '/' + lang + path, { waitUntil: 'networkidle2', timeout: 35000 });
  const route = '/' + lang + path;
  if (!response || response.status() !== 200) failures.push(route + ' returned ' + response?.status());
  const metrics = await page.evaluate(() => ({
    lang: document.documentElement.lang,
    dir: document.documentElement.dir,
    sectionCount: document.querySelectorAll('main#main-content section').length,
    headingCount: document.querySelectorAll('main#main-content h1,main#main-content h2,main#main-content h3').length,
    h1Count: document.querySelectorAll('main#main-content h1').length,
    mainTextLength: (document.querySelector('main#main-content')?.textContent || '').trim().length,
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
    main: !!document.querySelector('main#main-content'),
    title: document.title,
    hasError: document.body.textContent.includes('Application error: a client-side exception'),
  }));
  if (metrics.lang !== lang) failures.push(route + ' wrong html lang ' + metrics.lang);
  if (metrics.dir && metrics.dir !== (lang === 'he' ? 'rtl' : 'ltr')) failures.push(route + ' wrong text direction ' + metrics.dir);
  if (!metrics.main || metrics.mainTextLength < 200) failures.push(route + ' unexpectedly short main content');
  if (metrics.hasError) failures.push(route + ' displays client error');
  if (metrics.scrollWidth > metrics.viewportWidth + 4) failures.push(route + ' horizontal overflow ' + metrics.scrollWidth + '/' + metrics.viewportWidth);
  if (metrics.h1Count < 1) failures.push(route + ' missing H1');
  return metrics;
}

try {
  for (const viewport of viewports) {
    const page = await browser.newPage();
    await page.setViewport(viewport);
    const broken = [];
    page.on('pageerror', e => broken.push(String(e.message).slice(0, 250)));
    try {
      for (const path of pages) {
        const original = await collect(page, path, 'en');
        const translated = await collect(page, path, 'de');
        if (translated.sectionCount !== original.sectionCount) failures.push(path + ' ' + viewport.name + ' section mismatch EN ' + original.sectionCount + ' DE ' + translated.sectionCount);
        if (translated.headingCount !== original.headingCount) failures.push(path + ' ' + viewport.name + ' heading mismatch EN ' + original.headingCount + ' DE ' + translated.headingCount);
        console.log(viewport.name, path, 'EN/DE sections', original.sectionCount, translated.sectionCount, 'H1', translated.h1Count);
      }
    } catch(e) {
      failures.push(viewport.name + ' navigation failed: ' + e.message);
    }
    if (broken.length > 0) failures.push(viewport.name + ' JS errors ' + [...new Set(broken)].slice(0, 5).join(' | '));
    await page.close();
  }

  // Exercise the real shared language-switcher in the desktop header.
  const nav = await browser.newPage();
  await nav.goto(baseUrl + '/en', {waitUntil:'networkidle2', timeout:35000});
  const btn = await nav.$('button[aria-label="Select Language"]');
  if (!btn) failures.push('Shared language-switcher button missing');
  else {
    await btn.click();
    const count = await nav.evaluate(() => Array.from(document.querySelectorAll('[role="menuitem"]')).filter(x => x.textContent.includes('Deutsch')).length);
    if (count < 1) failures.push('German language option missing from active-QA switcher');
    console.log('Desktop language switcher German choice:', count);
  }
  await nav.close();
} finally {
  await browser.close();
}

if (failures.length) {
  console.error('German browser QA failures (' + failures.length + '):\n' + failures.join('\n'));
  process.exit(1);
}
console.log('German browser parity, language and responsive QA passed');
