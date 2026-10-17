/**
 * Content and SEO smoke test against a running Next.js production server.
 * Usage: node scripts/audit-public-pages.mjs http://127.0.0.1:3005
 * Read-only: never submits a contact or store-review request.
 */
import { readdirSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const origin = (process.argv[2] || 'http://127.0.0.1:3005').replace(/\/$/, '');
const slugs = directory => readdirSync(directory).filter(name => name.endsWith('.md')).map(name => name.slice(0, -3));
const common = [
  '', '/about', '/contact', '/free-store-review', '/solutions/shopify',
  '/solutions/wordpress', '/solutions/seo', '/work', '/blog',
  '/tools', '/tools/client-portal', '/privacy', '/terms', '/pricing', '/maintenance',
  '/services/shopify-conversion-optimization', '/services/shopify-b2b-integrations',
  '/services/shopify-performance-seo',
  ...['fashion', 'food', 'health', 'tech', 'arts', 'local'].map(s => '/industries/' + s),
  ...slugs('content/blog').map(s => '/blog/' + s),
  ...slugs('content/case-studies').map(s => '/work/' + s),
];
const gated = new Set(['/pricing', '/maintenance']);
const failed = [];
let checked = 0;

for (const locale of ['he', 'en']) {
  for (const suffix of common) {
    const route = '/' + locale + suffix;
    try {
      const response = await fetch(origin + route, { signal: AbortSignal.timeout(20000) });
      const html = await response.text();
      const document = new JSDOM(html).window.document;
      const title = document.title.trim();
      const h1 = document.querySelectorAll('h1').length;
      const langOk = document.documentElement.lang === locale;
      const dirOk = document.documentElement.dir === (locale === 'he' ? 'rtl' : 'ltr');
      const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '';
      const robots = document.querySelector('meta[name="robots"]')?.getAttribute('content') || '';
      const duplicateBrand = /CartShift Studio(?: Work)?\s*\|\s*CartShift Studio/i.test(title);
      const checks = [
        [response.status === 200, 'HTTP ' + response.status],
        [title.length > 12, 'missing title'],
        [!duplicateBrand, 'duplicate brand in title'],
        [langOk && dirOk, 'wrong locale/direction'],
        [Boolean(canonical) && canonical.includes('/' + locale + suffix), 'missing/incorrect canonical'],
        [gated.has(suffix) || h1 === 1, 'expected one H1, got ' + h1],
        [!gated.has(suffix) || robots.includes('noindex'), 'gated offer must be noindex'],
      ];
      if (!suffix) checks.push([document.querySelectorAll('figure blockquote').length >= 3, 'real testimonials missing from home']);
      if (suffix === '/free-store-review') checks.push([html.includes(locale === 'he' ? 'מה ההבדל בין סקירה' : 'Which review is right'), 'review scopes not explained']);
      if (suffix === '/work/stiletto-piercing-disposable-jewelry-supply') checks.push([html.includes(locale === 'he' ? 'לפני השקה' : 'not yet launched'), 'Stiletto prelaunch note missing']);
      const errors = checks.filter(([pass]) => !pass).map(([, message]) => message);
      if (errors.length) failed.push({ route, errors });
      checked++;
    } catch (error) {
      failed.push({ route, errors: [String(error)] });
    }
  }
  const legacy = await fetch(origin + '/' + locale + '/tools/store-analyzer', { redirect: 'manual' });
  const location = legacy.headers.get('location') || '';
  checked++;
  if (![307, 308].includes(legacy.status) || !location.includes('/' + locale + '/free-store-review')) {
    failed.push({ route: '/' + locale + '/tools/store-analyzer', errors: ['legacy analyzer redirect invalid'] });
  }
}
console.log(JSON.stringify({ checked, failures: failed.length, failed }, null, 2));
if (failed.length) process.exitCode = 1;
