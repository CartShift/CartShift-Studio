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
  const response = await page.goto(baseUrl + '/' + lang + path, { waitUntil: 'domcontentloaded', timeout: 30000 });
  // Yield for React hydration without waiting for background analytics/network polling.
  await new Promise(resolve => setTimeout(resolve, 250));
  const route = '/' + lang + path;
  // Repeated navigation may legitimately use HTTP conditional cache validation.
  if (!response || ![200, 304].includes(response.status())) failures.push(route + ' returned ' + response?.status());
  const metrics = await page.evaluate(() => ({
    lang: document.documentElement.lang,
    dir: document.documentElement.dir,
    sectionCount: document.querySelectorAll('main#main-content section').length,
    headingCount: document.querySelectorAll('main#main-content h1,main#main-content h2,main#main-content h3').length,
    headingLabels: Array.from(document.querySelectorAll('main#main-content h1,main#main-content h2,main#main-content h3')).map(el => `${el.tagName}: ${(el.textContent || '').trim().slice(0, 68)}`),
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
    // Compare both languages in independent tabs so a prior locale's hydrated
    // component tree and client state cannot contaminate the next measurement.
    const originalPage = await browser.newPage();
    const translatedPage = await browser.newPage();
    await Promise.all([originalPage.setViewport(viewport), translatedPage.setViewport(viewport)]);
    const broken = [];
    for (const page of [originalPage, translatedPage]) {
      page.on('pageerror', e => broken.push(String(e.message).slice(0, 250)));
    }
    try {
      for (const path of pages) {
        let original = await collect(originalPage, path, 'en');
        let translated = await collect(translatedPage, path, 'de');
        if (original.sectionCount !== translated.sectionCount || original.headingCount !== translated.headingCount) {
          // Hydration can transiently introduce/remove a heading after DOMContentLoaded.
          // Revisit both locales once with warmed assets before flagging a structural regression.
          await new Promise(resolve => setTimeout(resolve, 500));
          original = await collect(originalPage, path, 'en');
          translated = await collect(translatedPage, path, 'de');
        }
        if (translated.sectionCount !== original.sectionCount) failures.push(path + ' ' + viewport.name + ' section mismatch EN ' + original.sectionCount + ' DE ' + translated.sectionCount);
        if (translated.headingCount !== original.headingCount) {
          failures.push(path + ' ' + viewport.name + ' heading mismatch EN ' + original.headingCount + ' DE ' + translated.headingCount);
          console.warn('EN heading labels:', JSON.stringify(original.headingLabels));
          console.warn('DE heading labels:', JSON.stringify(translated.headingLabels));
        }
        console.log(viewport.name, path, 'EN/DE sections', original.sectionCount, translated.sectionCount, 'H1', translated.h1Count);
      }
    } catch(e) {
      failures.push(viewport.name + ' navigation failed: ' + e.message);
    }
    if (broken.length > 0) failures.push(viewport.name + ' JS errors ' + [...new Set(broken)].slice(0, 5).join(' | '));
    await Promise.all([originalPage.close(), translatedPage.close()]);
  }

  // Exercise the real shared language-switcher in the desktop header.
  const nav = await browser.newPage();
  await nav.goto(baseUrl + '/en', {waitUntil:'domcontentloaded', timeout:30000});
  await new Promise(resolve => setTimeout(resolve, 500));
  const btn = await nav.$('button[aria-label="Select Language"]');
  if (!btn) failures.push('Shared language-switcher button missing');
  else {
    await btn.click();
    const count = await nav.evaluate(() => Array.from(document.querySelectorAll('[role="menuitem"]')).filter(x => x.textContent.includes('Deutsch')).length);
    if (count < 1) failures.push('German language option missing from active-QA switcher');
    console.log('Desktop language switcher German choice:', count);
  }
  await nav.close();

  // Validate the marketing journey without submitting a real form or recording a lead.
  for (const lang of ['en', 'de']) {
    const funnelPage = await browser.newPage();
    await funnelPage.setViewport(viewports[1]);
    try {
      await funnelPage.goto(baseUrl + '/' + lang, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await new Promise(resolve => setTimeout(resolve, 450));
      const heroCta = await funnelPage.$('main#main-content a[href$="/' + lang + '/free-store-review"]');
      if (!heroCta) {
        failures.push(lang + ' primary free-review CTA missing on homepage');
        continue;
      }
      const ctaVisibility = await funnelPage.evaluate(el => {
        const box = el.getBoundingClientRect();
        return box.width > 0 && box.height > 0 && getComputedStyle(el).visibility !== 'hidden'
          && getComputedStyle(el).opacity !== '0';
      }, heroCta);
      if (!ctaVisibility) failures.push(lang + ' hero review CTA not visible on mobile');
      await heroCta.click();
      await funnelPage.waitForFunction(expected => location.pathname === expected,
        { timeout: 15000 }, '/' + lang + '/free-store-review');
      const reviewState = await funnelPage.evaluate(() => ({
        form: !!document.querySelector('form input[name="storeUrl"][required]'),
        email: !!document.querySelector('form input[type="email"][required]'),
        sampleCount: document.querySelectorAll('#review-example-title').length,
        exampleCards: document.querySelectorAll('section[aria-labelledby="review-example-title"] article').length,
        nestedButtons: document.querySelectorAll('a button').length,
      }));
      if (!reviewState.form || !reviewState.email) failures.push(lang + ' review request form fields missing');
      if (reviewState.sampleCount !== 1 || reviewState.exampleCards !== 3) failures.push(lang + ' illustrative review sample missing');
      if (reviewState.nestedButtons !== 0) failures.push(lang + ' review page has nested interactive buttons');
    } catch (e) {
      failures.push(lang + ' review journey failed: ' + String(e.message || e).slice(0, 180));
    } finally {
      await funnelPage.close();
    }
  }
} finally {
  await browser.close();
}

if (failures.length) {
  console.error('German browser QA failures (' + failures.length + '):\n' + failures.join('\n'));
  process.exit(1);
}
console.log('German browser parity, language and responsive QA passed');
