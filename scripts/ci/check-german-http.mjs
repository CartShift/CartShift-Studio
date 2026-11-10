/**
 * Private CI smoke tests for the real German route tree.
 * Runs only against a local Next.js server with temporary QA flags.
 * Never sends form submissions or performs authenticated actions.
 */
const origin = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3210';

async function request(path) {
  const res = await fetch(origin + path, { redirect: 'manual', headers: { 'accept-language': 'de,en;q=0.8' } });
  return { status: res.status, text: await res.text(), location: res.headers.get('location') };
}

function assert(value, description) {
  if (!value) throw new Error(description);
}

async function checkPage(path, { lang = 'de' } = {}) {
  const response = await request(path);
  assert(response.status === 200, path + ' returned ' + response.status + ': ' + response.text.slice(0, 300));
  assert(new RegExp('<html[^>]+lang=["\\x27]' + lang + '["\\x27]', 'i').test(response.text), path + ' missing html lang=' + lang);
  assert(!/NEXT_HTTP_ERROR_FALLBACK/.test(response.text), path + ' rendered an error page');
  console.log('PASS', response.status, path, response.text.length, 'bytes');
  return response.text;
}

const cases = [
  '/de',
  '/de/solutions/shopify',
  '/de/solutions/wordpress',
  '/de/solutions/seo',
  '/de/about',
  '/de/work',
  '/de/contact',
  '/de/blog',
  '/de/privacy',
  '/de/terms',
  '/de/blog/abandoned-cart-recovery-strategies-2026',
  '/de/work/alondon-community-portal',
];
const original = await checkPage('/en', { lang: 'en' });
const translated = await checkPage('/de', { lang: 'de' });
for (const path of cases.slice(1)) await checkPage(path);
const sections = text => (text.match(/<section(?:\\s|>)/g) || []).length;
assert(sections(translated) === sections(original), 'German homepage has different section count: ' + sections(translated) + ' vs ' + sections(original));
assert(translated.includes('Shopify'), 'German page is missing Shopify content');
for (const path of ['/de/portal', '/de/yotam', '/de/tools/store-analyzer/report/private-test']) {
  const res = await request(path);
  assert(res.status >= 300 && res.status < 400, 'Private/untranslated ' + path + ' must redirect, got ' + res.status);
  console.log('PASS protected', path, res.status, res.location);
}
console.log('German 1:1 URL integration smoke tests passed');
