import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SITE_URL = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL || 'sc-domain:cart-shift.com';
const PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cart-shift.com';
const SITEMAP_URL = `${PUBLIC_SITE_URL}/sitemap.xml`;

const PRIORITY_HEBREW_URLS = [
  `${PUBLIC_SITE_URL}/he`,
  `${PUBLIC_SITE_URL}/he/solutions/shopify`,
  `${PUBLIC_SITE_URL}/he/blog/shopify-seo-complete-guide`,
  `${PUBLIC_SITE_URL}/he/blog/why-shopify-stores-dont-rank`,
  `${PUBLIC_SITE_URL}/he/blog/shopify-seo-audit-checklist`,
];

function loadDotenv(filePath) {
  if (!fs.existsSync(filePath)) return {};

  const env = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separator = line.indexOf('=');
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

function getEnv() {
  return {
    ...loadDotenv(path.join(ROOT, '.env.local')),
    ...process.env,
  };
}

function b64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function parseServiceAccount(env) {
  const credentials = env.GOOGLE_APPLICATION_CREDENTIALS;

  if (credentials?.trim().startsWith('{')) {
    return JSON.parse(credentials);
  }

  if (credentials) {
    const resolved = path.isAbsolute(credentials) ? credentials : path.join(ROOT, credentials);
    return JSON.parse(fs.readFileSync(resolved, 'utf8'));
  }

  if (env.GOOGLE_CLIENT_EMAIL && env.GOOGLE_PRIVATE_KEY) {
    return {
      client_email: env.GOOGLE_CLIENT_EMAIL,
      private_key: env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
  }

  throw new Error(
    'Missing Google auth. Set GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_CLIENT_EMAIL + GOOGLE_PRIVATE_KEY.'
  );
}

async function getAccessToken(serviceAccount, scopes) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: serviceAccount.client_email,
    scope: scopes.join(' '),
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const unsigned = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claim))}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsigned);
  const signature = signer
    .sign(serviceAccount.private_key, 'base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${signature}`,
    }),
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(`Google OAuth failed: ${body.error || response.status}`);
  }

  return body.access_token;
}

async function fetchJson(url, token, options = {}) {
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      authorization: `Bearer ${token}`,
      ...(options.body ? { 'content-type': 'application/json' } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  let body = {};
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text };
    }
  }

  return { ok: response.ok, status: response.status, body };
}

async function submitSitemap(token, siteUrl, sitemapUrl) {
  return fetchJson(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(
      siteUrl
    )}/sitemaps/${encodeURIComponent(sitemapUrl)}`,
    token,
    { method: 'PUT' }
  );
}

async function inspectUrl(token, siteUrl, inspectionUrl) {
  return fetchJson('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', token, {
    method: 'POST',
    body: {
      inspectionUrl,
      siteUrl,
      languageCode: 'he-IL',
    },
  });
}

async function pingGoogleSitemap(sitemapUrl) {
  const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
  const response = await fetch(pingUrl);
  return { ok: response.ok, status: response.status };
}

function normalizeInspection(url, response) {
  const result = response.body?.inspectionResult;
  const indexStatus = result?.indexStatusResult || {};

  return {
    url,
    ok: response.ok,
    status: response.status,
    verdict: indexStatus.verdict || '',
    coverageState: indexStatus.coverageState || '',
    indexingState: indexStatus.indexingState || '',
    googleCanonical: indexStatus.googleCanonical || '',
    lastCrawlTime: indexStatus.lastCrawlTime || '',
    inspectionResultLink: result?.inspectionResultLink || '',
    error: response.ok ? undefined : response.body?.error,
  };
}

async function main() {
  const env = getEnv();
  const extraUrls = (env.GSC_REINDEX_URLS || '')
    .split(',')
    .map(url => url.trim())
    .filter(Boolean);
  const urls = [...new Set([...PRIORITY_HEBREW_URLS, ...extraUrls])];

  const serviceAccount = parseServiceAccount(env);
  const token = await getAccessToken(serviceAccount, ['https://www.googleapis.com/auth/webmasters']);

  console.log(`Search Console property: ${SITE_URL}`);
  console.log(`Sitemap: ${SITEMAP_URL}`);
  console.log('');

  const ping = await pingGoogleSitemap(SITEMAP_URL);
  console.log(`Google sitemap ping: ${ping.ok ? 'OK' : 'FAILED'} (${ping.status})`);

  const submit = await submitSitemap(token, SITE_URL, SITEMAP_URL);
  console.log(
    `GSC sitemap resubmit: ${submit.ok ? 'OK' : 'FAILED'} (${submit.status})${
      submit.ok ? '' : ` — ${submit.body?.error?.message || JSON.stringify(submit.body)}`
    }`
  );
  console.log('');

  console.log('Hebrew priority URL inspections:');
  const inspections = [];

  for (const url of urls) {
    const response = await inspectUrl(token, SITE_URL, url);
    const inspection = normalizeInspection(url, response);
    inspections.push(inspection);

    console.log(`- ${url}`);
    console.log(
      `  ${inspection.coverageState || 'inspection failed'} | verdict=${inspection.verdict || 'n/a'}`
    );
    if (inspection.inspectionResultLink) {
      console.log(`  ${inspection.inspectionResultLink}`);
    }
    if (inspection.error) {
      console.log(`  error: ${inspection.error.message || JSON.stringify(inspection.error)}`);
    }
  }

  const reportDir = path.join(ROOT, 'docs', 'seo-monitor-reports');
  fs.mkdirSync(reportDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(reportDir, `${timestamp}-gsc-reindex-hebrew.json`);
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        siteUrl: SITE_URL,
        sitemapUrl: SITEMAP_URL,
        ping,
        sitemapSubmit: submit,
        inspections,
      },
      null,
      2
    ),
    'utf8'
  );

  console.log('');
  console.log(`Report saved: ${reportPath}`);
  console.log('');
  console.log(
    'Note: Google has no public API for the GSC "Request indexing" button. Sitemap resubmit + URL Inspection are the programmatic signals available.'
  );
}

main().catch(error => {
  console.error(error.message || error);
  process.exit(1);
});
