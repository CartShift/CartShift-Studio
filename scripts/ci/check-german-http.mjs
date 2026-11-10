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
  '/de/free-store-review',
  '/de/tools',
  '/de/tools/client-portal',
  '/de/services/shopify-conversion-optimization',
  '/de/services/shopify-b2b-integrations',
  '/de/services/shopify-performance-seo',
  '/de/services/shopify-subscriptions',
  '/de/services/wordpress-security',
  '/de/industries/fashion',
  '/de/industries/local',
  '/de/pricing',
  '/de/maintenance',
  '/de/privacy',
  '/de/terms',
  '/de/blog/abandoned-cart-recovery-strategies-2026',
  '/de/work/alondon-community-portal',
];
const original = await checkPage('/en', { lang: 'en' });
const translated = await checkPage('/de', { lang: 'de' });
const expectedGermanCopy = {
  '/de/services/shopify-conversion-optimization': 'Conversion-Rate',
  '/de/services/shopify-b2b-integrations': 'Integrationen',
  '/de/services/shopify-performance-seo': 'Performance',
  '/de/services/shopify-subscriptions': 'Ihre Kunden',
  '/de/industries/local': 'lokale Unternehmen',
  '/de/tools': 'E-Commerce-Tools',
};
for (const path of cases.slice(1)) {
  const html = await checkPage(path);
  if (expectedGermanCopy[path]) {
    assert(html.includes(expectedGermanCopy[path]), path + ' is missing expected German content');
  }
}
const sections = text => (text.match(/<section(?:\s|>)/g) || []).length;
assert(sections(original) > 5, 'English homepage section count not measurable');
assert(sections(translated) === sections(original), 'German homepage has different section count: ' + sections(translated) + ' vs ' + sections(original));
const headings = html => (html.match(/<h[1-6](?:\s|>)/g) || []).length;
assert(headings(original) > 5, 'English homepage headings not measurable');
assert(headings(translated) === headings(original), 'German homepage heading count differs from English');
assert(translated.includes('Shopify'), 'German page is missing Shopify content');
for (const path of ['/de/portal', '/de/yotam', '/de/tools/store-analyzer/report/private-test']) {
  const res = await request(path);
  assert(res.status >= 300 && res.status < 400, 'Private/untranslated ' + path + ' must redirect, got ' + res.status);
  console.log('PASS protected', path, res.status, res.location);
}
console.log('German 1:1 URL integration smoke tests passed');
