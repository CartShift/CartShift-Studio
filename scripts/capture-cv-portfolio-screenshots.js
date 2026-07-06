const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const outDir = path.resolve('public/images/cv/portfolio');
const viewport = { width: 1440, height: 1000, deviceScaleFactor: 1 };
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

const projects = [
  {
    slug: 'cartshift',
    variants: [
      { locale: 'en', theme: 'light', url: 'https://cart-shift.com/en' },
      { locale: 'en', theme: 'dark', url: 'https://cart-shift.com/en' },
      { locale: 'he', theme: 'light', url: 'https://cart-shift.com/he' },
      { locale: 'he', theme: 'dark', url: 'https://cart-shift.com/he' },
    ],
    async prepare(page, variant) {
      await page.setCookie({
        name: 'NEXT_LOCALE',
        value: variant.locale,
        domain: 'cart-shift.com',
        path: '/',
      });
      await page.goto('https://cart-shift.com/', { waitUntil: 'domcontentloaded' });
      await page.evaluate(({ locale, theme }) => {
        localStorage.setItem('user_locale_preference', locale);
        localStorage.setItem('theme', theme);
        localStorage.setItem('cookie_consent', 'accepted');
        localStorage.setItem('geo_locale_detected', locale === 'he' ? 'IL' : 'US');
        localStorage.setItem('geo_locale_timestamp', String(Date.now()));
      }, variant);
    },
  },
  {
    slug: 'atlas-irwin',
    variants: [
      { locale: 'en', theme: 'light', url: 'https://atlasirwin.com/' },
      { locale: 'en', theme: 'dark', url: 'https://atlasirwin.com/' },
    ],
    async prepare(page, variant) {
      await page.goto(variant.url, { waitUntil: 'domcontentloaded' });
      await page.evaluate(({ theme }) => {
        localStorage.setItem('atlas-theme', theme);
      }, variant);
    },
  },
  {
    slug: 'starlinker',
    variants: [
      { locale: 'en', theme: 'light', url: 'https://starlinker.io/' },
      { locale: 'en', theme: 'dark', url: 'https://starlinker.io/' },
    ],
  },
  {
    slug: 'rightflow',
    variants: [
      { locale: 'en', theme: 'light', url: 'https://right-flow.com/en' },
      { locale: 'en', theme: 'dark', url: 'https://right-flow.com/en' },
      { locale: 'he', theme: 'light', url: 'https://right-flow.com/he' },
      { locale: 'he', theme: 'dark', url: 'https://right-flow.com/he' },
    ],
    async prepare(page, variant) {
      await page.goto('https://right-flow.com/', { waitUntil: 'domcontentloaded' });
      await page.evaluate(({ theme }) => {
        localStorage.setItem('theme', theme);
      }, variant);
    },
    async beforeScreenshot(page) {
      await page.evaluate(() => {
        const button = Array.from(document.querySelectorAll('button')).find(
          (el) => el.textContent?.trim() === 'Reject optional'
        );
        button?.click();
      });
      await wait(400);
    },
  },
];

async function captureVariant(browser, project, variant) {
  const page = await browser.newPage();
  const output = path.join(outDir, `${project.slug}-${variant.locale}-${variant.theme}.png`);

  try {
    await page.setViewport(viewport);
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: variant.theme }]);

    if (project.prepare) {
      await project.prepare(page, variant);
    }

    await page.goto(variant.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('body', { timeout: 30000 });
    await page.evaluate(({ theme }) => {
      document.documentElement.classList.toggle('dark', theme === 'dark');
      document.documentElement.classList.toggle('light', theme === 'light');
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, variant);
    if (project.beforeScreenshot) {
      await project.beforeScreenshot(page);
    }
    await wait(2200);
    await page.screenshot({ path: output, type: 'png', fullPage: false });
    console.log(`Captured ${project.slug} ${variant.locale}/${variant.theme}: ${output}`);
  } finally {
    await page.close();
  }
}

async function main() {
  const filter = process.argv.find((arg) => arg.startsWith('--project='))?.split('=')[1];
  const selected = filter ? projects.filter((p) => p.slug === filter) : projects;

  if (filter && selected.length === 0) {
    console.error(`Unknown project "${filter}". Available: ${projects.map((p) => p.slug).join(', ')}`);
    process.exit(1);
  }

  fs.mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  try {
    for (const project of selected) {
      for (const variant of project.variants) {
        await captureVariant(browser, project, variant);
      }
    }
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
