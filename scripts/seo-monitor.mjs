import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const BLOG_DIR = path.join(ROOT, 'content', 'blog');
const REPORT_DIR = path.join(ROOT, 'docs', 'seo-monitor-reports');
const LOG_PATH = path.join(ROOT, 'docs', 'SEO_MONITOR_DECISION_LOG.md');
const DEFAULT_MIN_IMPRESSIONS = 5;
const DEFAULT_INSPECTION_LIMIT = 15;

const args = new Set(process.argv.slice(2));
const isApplyMode = args.has('--apply');
const isJsonMode = args.has('--json');
const isSilent = args.has('--silent');

function loadDotenv(filePath) {
  if (!fs.existsSync(filePath)) return {};

  const env = {};
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
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

function toDateString(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function dateRanges(days = 90) {
  const end = addDays(new Date(), -1);
  const start = addDays(end, -(days - 1));
  const previousEnd = addDays(start, -1);
  const previousStart = addDays(previousEnd, -(days - 1));

  return {
    current: {
      startDate: toDateString(start),
      endDate: toDateString(end),
    },
    previous: {
      startDate: toDateString(previousStart),
      endDate: toDateString(previousEnd),
    },
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

  const body = await response.json();
  return {
    ok: response.ok,
    status: response.status,
    body,
  };
}

function siteHost(siteUrl) {
  if (!siteUrl) return '';
  if (siteUrl.startsWith('sc-domain:')) return siteUrl.replace('sc-domain:', '');

  try {
    return new URL(siteUrl).hostname.replace(/^www\./, '');
  } catch {
    return siteUrl
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');
  }
}

async function resolveSearchConsoleSite(token, configuredSite) {
  const sitesResponse = await fetchJson(
    'https://searchconsole.googleapis.com/webmasters/v3/sites',
    token
  );

  if (!sitesResponse.ok) {
    return {
      configuredSite,
      usedSite: configuredSite,
      sites: [],
      warning: `Could not list Search Console sites: ${sitesResponse.status}`,
    };
  }

  const sites = (sitesResponse.body.siteEntry || []).map(site => ({
    siteUrl: site.siteUrl,
    permissionLevel: site.permissionLevel,
  }));

  if (sites.some(site => site.siteUrl === configuredSite)) {
    return { configuredSite, usedSite: configuredSite, sites };
  }

  const configuredHost = siteHost(configuredSite);
  const fallback = sites.find(site => siteHost(site.siteUrl) === configuredHost) || sites[0];

  return {
    configuredSite,
    usedSite: fallback?.siteUrl || configuredSite,
    sites,
    warning: fallback
      ? `Configured GSC site was not visible; using accessible property ${fallback.siteUrl}.`
      : 'No Search Console property was visible to the service account.',
  };
}

async function runSearchConsoleQuery(token, siteUrl, body) {
  return fetchJson(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(
      siteUrl
    )}/searchAnalytics/query`,
    token,
    {
      method: 'POST',
      body,
    }
  );
}

async function listSearchConsoleSitemaps(token, siteUrl) {
  if (!siteUrl) {
    return { ok: false, status: 0, body: { error: { message: 'Missing Search Console site.' } } };
  }

  return fetchJson(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(
      siteUrl
    )}/sitemaps`,
    token
  );
}

async function inspectSearchConsoleUrl(token, siteUrl, inspectionUrl) {
  if (!siteUrl || !inspectionUrl) {
    return { ok: false, status: 0, body: { error: { message: 'Missing inspection target.' } } };
  }

  return fetchJson('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', token, {
    method: 'POST',
    body: {
      inspectionUrl,
      siteUrl,
      languageCode: 'en-US',
    },
  });
}

function normalizeGscRows(rows = []) {
  return rows.map(row => ({
    keys: row.keys || [],
    clicks: row.clicks || 0,
    impressions: row.impressions || 0,
    ctr: row.ctr || 0,
    position: row.position || 0,
  }));
}

function normalizeGa4Rows(rows = []) {
  return rows.map(row => ({
    path: row.dimensionValues?.[0]?.value || '',
    sessions: Number(row.metricValues?.[0]?.value || 0),
    views: Number(row.metricValues?.[1]?.value || 0),
  }));
}

function normalizeSitemaps(response) {
  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: response.body?.error,
      entries: [],
      issues: [],
    };
  }

  const entries = (response.body.sitemap || []).map(sitemap => ({
    path: sitemap.path || '',
    type: sitemap.type || '',
    isPending: Boolean(sitemap.isPending),
    isSitemapsIndex: Boolean(sitemap.isSitemapsIndex),
    lastSubmitted: sitemap.lastSubmitted || '',
    lastDownloaded: sitemap.lastDownloaded || '',
    warnings: Number(sitemap.warnings || 0),
    errors: Number(sitemap.errors || 0),
    contents: (sitemap.contents || []).map(content => ({
      type: content.type || '',
      submitted: Number(content.submitted || 0),
      indexed: Number(content.indexed || 0),
    })),
  }));

  const issues = entries
    .filter(sitemap => sitemap.errors > 0 || sitemap.warnings > 0 || sitemap.isPending)
    .map(sitemap => ({
      path: sitemap.path,
      type: sitemap.type,
      errors: sitemap.errors,
      warnings: sitemap.warnings,
      isPending: sitemap.isPending,
      lastSubmitted: sitemap.lastSubmitted,
      lastDownloaded: sitemap.lastDownloaded,
      safeAutomation:
        'Report first; fix sitemap generation only if the local sitemap output reproduces the issue.',
    }));

  return {
    ok: true,
    status: response.status,
    entries,
    issues,
  };
}

async function runGa4Report(token, propertyId, range) {
  if (!propertyId) {
    return {
      ok: false,
      status: 0,
      body: { error: { message: 'Missing GA4_PROPERTY_ID or GOOGLE_ANALYTICS_PROPERTY_ID.' } },
    };
  }

  return fetchJson(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    token,
    {
      method: 'POST',
      body: {
        dateRanges: [range],
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'sessions' }, { name: 'screenPageViews' }],
        limit: 250,
      },
    }
  );
}

function parseFrontmatter(markdown) {
  if (!markdown.startsWith('---')) return { data: {}, body: markdown };

  const end = markdown.indexOf('\n---', 3);
  if (end === -1) return { data: {}, body: markdown };

  const raw = markdown.slice(3, end).trim();
  const data = {};

  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z0-9_ -]+):\s*(.*)$/);
    if (!match) continue;
    const key = match[1].trim();
    let value = match[2].trim();
    if (
      (value.startsWith("'") && value.endsWith("'")) ||
      (value.startsWith('"') && value.endsWith('"'))
    ) {
      value = value.slice(1, -1);
    }
    data[key] = value;
  }

  return { data, body: markdown.slice(end + 4) };
}

function inventoryBlogPosts() {
  if (!fs.existsSync(BLOG_DIR)) return [];

  return fs
    .readdirSync(BLOG_DIR)
    .filter(file => file.endsWith('.md'))
    .sort()
    .map(file => {
      const fullPath = path.join(BLOG_DIR, file);
      const markdown = fs.readFileSync(fullPath, 'utf8');
      const { data, body } = parseFrontmatter(markdown);
      const [englishBody, hebrewBody = ''] = body.split('---he---');

      return {
        file,
        slug: file.replace(/\.md$/, ''),
        title: data.title || '',
        excerpt: data.excerpt || '',
        category: data.category || '',
        titleHe: data.title_he || '',
        excerptHe: data.excerpt_he || '',
        categoryHe: data.category_he || '',
        date: data.date || '',
        englishWordCount: englishBody.split(/\s+/).filter(Boolean).length,
        hasHebrewBody: hebrewBody.trim().length > 0,
        internalLinks: [...markdown.matchAll(/\]\((\/[^)]+)\)/g)].map(match => match[1]),
      };
    });
}

function keyed(rows, keySelector) {
  const map = new Map();
  for (const row of rows) map.set(keySelector(row), row);
  return map;
}

function normalizeUrlForComparison(url) {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    parsed.search = '';
    parsed.hostname = parsed.hostname.replace(/^www\./, '');
    parsed.pathname = parsed.pathname.replace(/\/$/, '') || '/';
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return String(url || '').replace(/\/$/, '');
  }
}

function isInspectableUrl(page, siteInfo) {
  if (!page || !/^https?:\/\//i.test(page)) return false;

  try {
    const parsed = new URL(page);
    const host = parsed.hostname.replace(/^www\./, '');
    const site = siteHost(siteInfo.usedSite || siteInfo.configuredSite);
    const blockedPath =
      parsed.pathname.startsWith('/api') ||
      parsed.pathname.startsWith('/_next') ||
      parsed.pathname.startsWith('/__') ||
      parsed.pathname.includes('/portal/');

    return host === site && !blockedPath;
  } catch {
    return false;
  }
}

function addInspectionCandidate(candidates, page, reason, weight, siteInfo) {
  if (!isInspectableUrl(page, siteInfo)) return;

  const key = normalizeUrlForComparison(page);
  const existing = candidates.get(key);
  if (existing) {
    existing.weight += weight;
    if (!existing.reasons.includes(reason)) existing.reasons.push(reason);
    return;
  }

  candidates.set(key, {
    url: page,
    weight,
    reasons: [reason],
  });
}

function buildInspectionCandidates({ analysis, gscPageRows, siteInfo, limit }) {
  const candidates = new Map();

  for (const row of analysis.lowCtrOpportunities) {
    addInspectionCandidate(candidates, row.page, 'low CTR in positions 4-20', 40, siteInfo);
  }

  for (const row of analysis.decliningPages) {
    addInspectionCandidate(candidates, row.page, 'material GSC impression decline', 35, siteInfo);
  }

  for (const group of analysis.cannibalizationRisks) {
    for (const page of group.pages) {
      addInspectionCandidate(
        candidates,
        page,
        `cannibalization risk for "${group.query}"`,
        30,
        siteInfo
      );
    }
  }

  for (const row of analysis.strikingDistance) {
    addInspectionCandidate(candidates, row.page, 'striking-distance query', 20, siteInfo);
  }

  for (const row of gscPageRows.slice(0, limit)) {
    addInspectionCandidate(candidates, row.keys[0], 'top Search Console page', 10, siteInfo);
  }

  return [...candidates.values()]
    .sort((a, b) => b.weight - a.weight || a.url.localeCompare(b.url))
    .slice(0, limit);
}

function normalizeInspectionResult(candidate, response) {
  const result = response.body?.inspectionResult;
  const indexStatus = result?.indexStatusResult || {};

  return {
    url: candidate.url,
    reasons: candidate.reasons,
    ok: response.ok,
    status: response.status,
    error: response.ok ? undefined : response.body?.error,
    verdict: indexStatus.verdict || '',
    coverageState: indexStatus.coverageState || '',
    robotsTxtState: indexStatus.robotsTxtState || '',
    indexingState: indexStatus.indexingState || '',
    pageFetchState: indexStatus.pageFetchState || '',
    googleCanonical: indexStatus.googleCanonical || '',
    userCanonical: indexStatus.userCanonical || '',
    lastCrawlTime: indexStatus.lastCrawlTime || '',
    sitemap: indexStatus.sitemap || [],
    referringUrls: indexStatus.referringUrls || [],
    inspectionResultLink: result?.inspectionResultLink || '',
  };
}

async function inspectCandidateUrls({ token, siteUrl, candidates }) {
  const inspections = [];

  for (const candidate of candidates) {
    const response = await inspectSearchConsoleUrl(token, siteUrl, candidate.url);
    inspections.push(normalizeInspectionResult(candidate, response));
  }

  return inspections;
}

function classifyInspectionIssue(inspection) {
  if (!inspection.ok) {
    return {
      url: inspection.url,
      type: 'URL inspection blocked',
      severity: 'Medium',
      evidence: `API status ${inspection.status}`,
      safeAutomation: 'Retry on next run; do not infer an SEO issue from a failed API call.',
    };
  }

  const issues = [];
  const coverage = inspection.coverageState.toLowerCase();
  const verdict = inspection.verdict.toUpperCase();
  const robots = inspection.robotsTxtState.toUpperCase();
  const indexing = inspection.indexingState.toUpperCase();
  const fetchState = inspection.pageFetchState.toUpperCase();
  const googleCanonical = normalizeUrlForComparison(inspection.googleCanonical);
  const userCanonical = normalizeUrlForComparison(inspection.userCanonical);

  if (robots && robots !== 'ALLOWED') {
    issues.push({
      url: inspection.url,
      type: 'Robots block',
      severity: 'High',
      evidence: `robotsTxtState=${inspection.robotsTxtState}`,
      safeAutomation:
        'Inspect robots.ts and only remove a block if the affected URL is public and indexable.',
    });
  }

  if (indexing.includes('NOINDEX')) {
    issues.push({
      url: inspection.url,
      type: 'Noindex',
      severity: 'High',
      evidence: `indexingState=${inspection.indexingState}`,
      safeAutomation:
        'Inspect metadata generation; remove noindex only for intentional public pages.',
    });
  }

  if (fetchState && !['SUCCESSFUL', 'PAGE_FETCH_STATE_UNSPECIFIED'].includes(fetchState)) {
    issues.push({
      url: inspection.url,
      type: 'Page fetch issue',
      severity: 'High',
      evidence: `pageFetchState=${inspection.pageFetchState}`,
      safeAutomation:
        'Validate the live route before changing code; fetch failures can be deployment/runtime issues.',
    });
  }

  if (
    inspection.googleCanonical &&
    inspection.userCanonical &&
    googleCanonical &&
    userCanonical &&
    googleCanonical !== userCanonical
  ) {
    const isLocaleBlogMismatch =
      /\/blog\//.test(googleCanonical) &&
      /\/blog\//.test(userCanonical) &&
      googleCanonical.replace(/\/(en|he)\/blog\//, '/blog/') ===
        userCanonical.replace(/\/(en|he)\/blog\//, '/blog/');

    issues.push({
      url: inspection.url,
      type: 'Canonical mismatch',
      severity: isLocaleBlogMismatch ? 'High' : 'Medium',
      evidence: `Google canonical=${inspection.googleCanonical}; user canonical=${inspection.userCanonical}`,
      safeAutomation: isLocaleBlogMismatch
        ? 'Safe repo fix: consolidate internal links and metadata around /{locale}/blog/*.'
        : 'Report first; canonical changes need page-intent review.',
    });
  }

  if (
    verdict &&
    verdict !== 'PASS' &&
    (coverage.includes('not indexed') ||
      coverage.includes('excluded') ||
      coverage.includes('crawled') ||
      coverage.includes('discovered'))
  ) {
    issues.push({
      url: inspection.url,
      type: 'Index coverage issue',
      severity: 'High',
      evidence: `verdict=${inspection.verdict}; coverageState=${inspection.coverageState}`,
      safeAutomation:
        'Map to the local route, then fix technical blockers or create an editorial task for thin/duplicate content.',
    });
  }

  if (inspection.sitemap.length === 0 && !coverage.includes('duplicate')) {
    issues.push({
      url: inspection.url,
      type: 'URL not reported in GSC sitemap field',
      severity: 'Low',
      evidence: 'URL Inspection returned no sitemap membership.',
      safeAutomation: 'Verify local sitemap output before changing app/sitemap.ts.',
    });
  }

  return issues;
}

function analyzeSearchConsoleTechnical({ sitemaps, inspections }) {
  const urlInspectionIssues = inspections.flatMap(classifyInspectionIssue);
  const highSeverityIssues = urlInspectionIssues.filter(issue => issue.severity === 'High');

  return {
    sitemaps,
    inspections,
    inspectedUrlCount: inspections.length,
    sitemapIssues: sitemaps.issues,
    urlInspectionIssues,
    highSeverityIssues,
  };
}

function attachTechnicalRecommendations(analysis, technical) {
  if (technical.highSeverityIssues.length || technical.sitemapIssues.length) {
    analysis.recommendations.unshift({
      priority: 'High',
      type: 'Search Console technical',
      action:
        'Fix URL Inspection and sitemap issues before broader content changes; these are direct Google-side crawl/index signals.',
      evidence: {
        urlInspection: technical.highSeverityIssues.slice(0, 5),
        sitemaps: technical.sitemapIssues.slice(0, 5),
      },
      safeAutomation:
        'Apply deterministic repo fixes only; otherwise write an issue with GSC evidence and the affected URL.',
    });
  }

  return {
    ...analysis,
    searchConsoleTechnical: technical,
  };
}

function runLocalCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: options.timeout || 120000,
    shell: false,
    windowsHide: true,
    env: process.env,
  });

  return {
    ok: result.status === 0,
    status: result.status,
    signal: result.signal,
    stdout: result.stdout || '',
    stderr: result.stderr || result.error?.message || '',
  };
}

function pnpmCommand() {
  return process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
}

function gitCommand(args, options = {}) {
  return runLocalCommand(
    'git',
    ['-c', `safe.directory=${ROOT.replace(/\\/g, '/')}`, ...args],
    options
  );
}

function gitStatusForPath(relativePath) {
  const result = gitCommand(['status', '--porcelain=v1', '--', relativePath]);
  if (!result.ok) return { ok: false, dirty: true, details: result.stderr || result.stdout };

  return {
    ok: true,
    dirty: result.stdout.trim().length > 0,
    details: result.stdout.trim(),
  };
}

function hasLocaleBlogDuplicateSignal(analysis) {
  const canonicalMismatches =
    analysis.searchConsoleTechnical?.urlInspectionIssues?.filter(
      issue =>
        issue.type === 'Canonical mismatch' && issue.safeAutomation.includes('/{locale}/blog/*')
    ) || [];

  if (canonicalMismatches.length) return true;

  return analysis.cannibalizationRisks.some(group => {
    const normalizedPages = group.pages.map(page =>
      normalizeUrlForComparison(page).replace(/\/(en|he)\/blog\//, '/blog/')
    );

    return new Set(normalizedPages).size < group.pages.length;
  });
}

function ensureMarkdownBlogLinksLocalized() {
  const relativePath = 'lib/markdown.ts';
  const fullPath = path.join(ROOT, relativePath);
  const source = fs.readFileSync(fullPath, 'utf8');

  if (source.includes('crawlable /blog/* redirect paths')) {
    return {
      type: 'Localize Markdown blog links',
      status: 'already-present',
      file: relativePath,
      detail: 'Markdown article links already localize /blog/* to /{locale}/blog/*.',
    };
  }

  const gitStatus = gitStatusForPath(relativePath);
  if (!gitStatus.ok || gitStatus.dirty) {
    return {
      type: 'Localize Markdown blog links',
      status: 'skipped',
      file: relativePath,
      detail: gitStatus.ok
        ? `Target file has existing local changes: ${gitStatus.details}`
        : `Could not verify target cleanliness: ${gitStatus.details}`,
    };
  }

  let nextSource = source
    .replace(
      'function postprocessHtml(htmlContent: string, slug?: string): string {',
      "function postprocessHtml(htmlContent: string, slug?: string, locale: 'en' | 'he' = 'en'): string {"
    )
    .replace(
      '  // Add horizontal rule class\n  processed = processed.replace(/<hr\\s*\\/?>/g, \'<hr class="section-divider" />\');\n\n  return processed;',
      `  // Add horizontal rule class
  processed = processed.replace(/<hr\\s*\\/?>/g, '<hr class="section-divider" />');

  // Markdown links render as raw anchors, so localize blog links before they create
  // crawlable /blog/* redirect paths alongside the canonical /{locale}/blog/* URLs.
  processed = processed.replace(/\\bhref=(["'])\\/blog(?=\\/|[#?]|["'])/g, (_match, quote) => {
    return \`href=\${quote}/\${locale}/blog\`;
  });

  return processed;`
    )
    .replace(
      'let contentHtmlEn = postprocessHtml(processedContentEn.toString(), slug);',
      "let contentHtmlEn = postprocessHtml(processedContentEn.toString(), slug, 'en');"
    )
    .replace(
      'contentHtmlHe = postprocessHtml(processedContentHe.toString(), slug);',
      "contentHtmlHe = postprocessHtml(processedContentHe.toString(), slug, 'he');"
    );

  if (nextSource === source || !nextSource.includes('crawlable /blog/* redirect paths')) {
    return {
      type: 'Localize Markdown blog links',
      status: 'skipped',
      file: relativePath,
      detail: 'Expected insertion anchors were not found; manual review required.',
    };
  }

  fs.writeFileSync(fullPath, nextSource, 'utf8');

  return {
    type: 'Localize Markdown blog links',
    status: 'applied',
    file: relativePath,
    detail: 'Localized raw Markdown /blog/* links to the active locale.',
  };
}

function buildRepoFixPlan(analysis) {
  const plan = [];

  if (hasLocaleBlogDuplicateSignal(analysis)) {
    plan.push({
      type: 'Localize Markdown blog links',
      priority: 'High',
      files: ['lib/markdown.ts'],
      evidence:
        'Search Console showed default-locale /blog/* URLs competing with localized /{locale}/blog/* URLs.',
      action:
        'Ensure raw Markdown article links render to /{locale}/blog/* so Google receives one canonical localized path.',
      safeToApply: true,
    });
  }

  for (const issue of analysis.searchConsoleTechnical?.highSeverityIssues || []) {
    if (issue.type === 'Canonical mismatch' && issue.safeAutomation.includes('/{locale}/blog/*')) {
      continue;
    }

    plan.push({
      type: issue.type,
      priority: issue.severity,
      files: [],
      evidence: `${issue.url}: ${issue.evidence}`,
      action: issue.safeAutomation,
      safeToApply: false,
    });
  }

  for (const issue of analysis.searchConsoleTechnical?.sitemapIssues || []) {
    plan.push({
      type: 'Sitemap issue',
      priority: issue.errors > 0 ? 'High' : 'Medium',
      files: ['app/sitemap.ts', 'app/robots.ts'],
      evidence: `${issue.path}: ${issue.errors} errors, ${issue.warnings} warnings`,
      action: issue.safeAutomation,
      safeToApply: false,
    });
  }

  return plan;
}

function applySafeRepoFixes(analysis) {
  const plan = buildRepoFixPlan(analysis);
  const appliedFixes = [];
  const skippedFixes = [];

  for (const item of plan) {
    if (!item.safeToApply) {
      skippedFixes.push({
        ...item,
        status: 'manual-review',
        detail: 'Exposed in report; not deterministic enough for unattended repo edit.',
      });
      continue;
    }

    if (item.type === 'Localize Markdown blog links') {
      const result = ensureMarkdownBlogLinksLocalized();
      if (['applied', 'already-present'].includes(result.status)) {
        appliedFixes.push({ ...item, ...result });
      } else {
        skippedFixes.push({ ...item, ...result });
      }
    }
  }

  return { plan, appliedFixes, skippedFixes };
}

function validateAppliedFixes(appliedFixes) {
  const changedFiles = [
    ...new Set(appliedFixes.filter(fix => fix.status === 'applied').map(fix => fix.file)),
  ];

  if (!changedFiles.length) {
    return {
      ok: true,
      attempted: false,
      summary: 'No new repo edits were applied; build/deploy skipped.',
      commands: [],
    };
  }

  const prettier = runLocalCommand(
    pnpmCommand(),
    ['exec', 'prettier', '--check', ...changedFiles],
    {
      timeout: 120000,
    }
  );

  if (!prettier.ok) {
    return {
      ok: false,
      attempted: true,
      summary: 'Prettier check failed; build/deploy skipped.',
      commands: [{ command: `pnpm exec prettier --check ${changedFiles.join(' ')}`, ...prettier }],
    };
  }

  const build = runLocalCommand(pnpmCommand(), ['build'], { timeout: 300000 });

  return {
    ok: build.ok,
    attempted: true,
    summary: build.ok ? 'Prettier and build passed.' : 'Build failed; deploy skipped.',
    commands: [
      { command: `pnpm exec prettier --check ${changedFiles.join(' ')}`, ...prettier },
      { command: 'pnpm build', ...build },
    ],
  };
}

function commitAndPushFixes({ reportPath, jsonPath, appliedFixes, validation, env }) {
  const changedFiles = [
    ...new Set(appliedFixes.filter(fix => fix.status === 'applied').map(fix => fix.file)),
    path.relative(ROOT, reportPath).replace(/\\/g, '/'),
    path.relative(ROOT, jsonPath).replace(/\\/g, '/'),
    'docs/SEO_MONITOR_DECISION_LOG.md',
  ];

  if (!validation.ok || !changedFiles.some(file => file !== path.relative(ROOT, reportPath))) {
    return {
      ok: false,
      attempted: false,
      summary: 'No commit or push attempted because validation did not pass or no fix was applied.',
    };
  }

  for (const file of changedFiles) {
    const status = gitStatusForPath(file);
    if (!status.ok) {
      return {
        ok: false,
        attempted: false,
        summary: `Could not verify git status for ${file}: ${status.details}`,
      };
    }
  }

  const add = gitCommand(['add', '--', ...changedFiles]);
  if (!add.ok) {
    return { ok: false, attempted: true, summary: `git add failed: ${add.stderr || add.stdout}` };
  }

  const commit = gitCommand(['commit', '-m', 'chore(seo): address technical monitor findings'], {
    timeout: 120000,
  });
  if (!commit.ok) {
    return {
      ok: false,
      attempted: true,
      summary: `git commit failed: ${commit.stderr || commit.stdout}`,
    };
  }

  if (env.SEO_MONITOR_SKIP_PUSH === 'true') {
    return {
      ok: true,
      attempted: true,
      summary: 'Commit created; push skipped by SEO_MONITOR_SKIP_PUSH=true.',
    };
  }

  const push = gitCommand(['push', 'origin', 'main'], { timeout: 180000 });
  return {
    ok: push.ok,
    attempted: true,
    summary: push.ok
      ? 'Committed and pushed to origin/main; Vercel deployment expected.'
      : `git push failed: ${push.stderr || push.stdout}`,
  };
}

function analyzeData({
  gscQueryPageRows,
  gscPageRows,
  previousGscPageRows,
  gaRows,
  previousGaRows,
  posts,
}) {
  const minImpressions = Number(process.env.SEO_MONITOR_MIN_IMPRESSIONS || DEFAULT_MIN_IMPRESSIONS);

  const queryPage = gscQueryPageRows.map(row => ({
    query: row.keys[0] || '',
    page: row.keys[1] || '',
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr,
    position: row.position,
  }));

  const lowCtrOpportunities = queryPage
    .filter(
      row =>
        row.impressions >= minImpressions &&
        row.position >= 4 &&
        row.position <= 20 &&
        row.ctr < 0.03
    )
    .sort((a, b) => b.impressions - a.impressions || a.position - b.position)
    .slice(0, 20);

  const strikingDistance = queryPage
    .filter(row => row.impressions >= 1 && row.position > 10 && row.position <= 30)
    .sort((a, b) => a.position - b.position || b.impressions - a.impressions)
    .slice(0, 20);

  const pageNow = keyed(gscPageRows, row => row.keys[0] || '');
  const pageBefore = keyed(previousGscPageRows, row => row.keys[0] || '');
  const decliningPages = [...pageBefore.entries()]
    .map(([page, previous]) => {
      const current = pageNow.get(page);
      const currentImpressions = current?.impressions || 0;
      const previousImpressions = previous.impressions || 0;
      const drop = previousImpressions - currentImpressions;
      const dropPct = previousImpressions ? drop / previousImpressions : 0;
      return {
        page,
        previousImpressions,
        currentImpressions,
        drop,
        dropPct,
      };
    })
    .filter(
      row =>
        row.previousImpressions >= minImpressions &&
        row.drop >= minImpressions &&
        row.dropPct >= 0.35
    )
    .sort((a, b) => b.dropPct - a.dropPct || b.drop - a.drop)
    .slice(0, 20);

  const queryGroups = new Map();
  for (const row of queryPage) {
    if (!queryGroups.has(row.query)) queryGroups.set(row.query, []);
    queryGroups.get(row.query).push(row);
  }

  const cannibalizationRisks = [...queryGroups.entries()]
    .map(([query, rows]) => ({
      query,
      pages: [...new Set(rows.map(row => row.page))],
      impressions: rows.reduce((sum, row) => sum + row.impressions, 0),
      clicks: rows.reduce((sum, row) => sum + row.clicks, 0),
    }))
    .filter(group => group.pages.length > 1 && group.impressions >= minImpressions)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 10);

  const gaNow = keyed(gaRows, row => row.path);
  const gaBefore = keyed(previousGaRows, row => row.path);
  const gaDeclines = [...gaBefore.entries()]
    .map(([pagePath, previous]) => {
      const current = gaNow.get(pagePath);
      const currentSessions = current?.sessions || 0;
      const previousSessions = previous.sessions || 0;
      const drop = previousSessions - currentSessions;
      const dropPct = previousSessions ? drop / previousSessions : 0;
      return {
        path: pagePath,
        previousSessions,
        currentSessions,
        drop,
        dropPct,
      };
    })
    .filter(
      row =>
        row.previousSessions >= minImpressions && row.drop >= minImpressions && row.dropPct >= 0.35
    )
    .sort((a, b) => b.dropPct - a.dropPct || b.drop - a.drop)
    .slice(0, 20);

  const blogContentIssues = posts
    .flatMap(post => {
      const issues = [];
      if (!post.title || !post.excerpt || !post.category) {
        issues.push('missing English frontmatter');
      }
      if (!post.titleHe || !post.excerptHe || !post.categoryHe) {
        issues.push('missing Hebrew frontmatter');
      }
      if (post.englishWordCount < 700) {
        issues.push('thin English body');
      }
      if (!post.hasHebrewBody) {
        issues.push('missing Hebrew body');
      }
      if (post.internalLinks.length < 2) {
        issues.push('few internal links');
      }

      return issues.length
        ? [
            {
              slug: post.slug,
              file: post.file,
              title: post.title,
              issues,
            },
          ]
        : [];
    })
    .slice(0, 30);

  const recommendations = [];

  if (lowCtrOpportunities.length) {
    recommendations.push({
      priority: 'High',
      type: 'CTR',
      action:
        'Review titles, excerpts, H1s, and intro alignment for pages with positions 4-20 and weak CTR.',
      evidence: lowCtrOpportunities.slice(0, 5),
      safeAutomation:
        'Suggest metadata/content changes; apply only when the mapped local file is clean.',
    });
  }

  if (decliningPages.length || gaDeclines.length) {
    recommendations.push({
      priority: 'High',
      type: 'Decline',
      action:
        'Investigate pages with material Search Console or GA4 declines before publishing new content.',
      evidence: {
        gsc: decliningPages.slice(0, 5),
        ga4: gaDeclines.slice(0, 5),
      },
      safeAutomation: 'Report only unless a clear local metadata/internal-link fix is available.',
    });
  }

  if (cannibalizationRisks.length) {
    recommendations.push({
      priority: 'Medium',
      type: 'Cannibalization',
      action:
        'Choose a canonical intent owner for duplicate query/page clusters and adjust internal links.',
      evidence: cannibalizationRisks.slice(0, 5),
      safeAutomation: 'Report only by default; internal-link edits require clean files.',
    });
  }

  if (blogContentIssues.length) {
    recommendations.push({
      priority: 'Medium',
      type: 'Content quality',
      action:
        'Fix blog posts with missing localized content, thin body copy, or weak internal linking.',
      evidence: blogContentIssues.slice(0, 8),
      safeAutomation: 'Can create a prioritized task report; content edits require validation.',
    });
  }

  if (!recommendations.length) {
    recommendations.push({
      priority: 'Low',
      type: 'Monitoring',
      action:
        'No urgent issue crossed the current thresholds. Continue monitoring and wait for stronger signal.',
      evidence: [],
      safeAutomation: 'Report only.',
    });
  }

  return {
    thresholds: { minImpressions },
    lowCtrOpportunities,
    strikingDistance,
    decliningPages,
    cannibalizationRisks,
    gaDeclines,
    blogContentIssues,
    recommendations,
  };
}

function markdownTable(rows, columns) {
  if (!rows.length) return '_None found._\n';

  const header = `| ${columns.map(col => col.label).join(' |')} |`;
  const separator = `| ${columns.map(() => '---').join(' |')} |`;
  const body = rows.map(row => {
    const cells = columns.map(col => {
      const value = col.value(row);
      return String(value ?? '')
        .replace(/\|/g, '\\|')
        .replace(/\n/g, ' ');
    });
    return `| ${cells.join(' |')} |`;
  });

  return [header, separator, ...body].join('\n') + '\n';
}

function pct(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function createReport({ timestamp, ranges, siteInfo, gsc, ga4, analysis, mode }) {
  const topLowCtr = analysis.lowCtrOpportunities.slice(0, 10);
  const topStriking = analysis.strikingDistance.slice(0, 10);
  const topContentIssues = analysis.blogContentIssues.slice(0, 12);
  const technical = analysis.searchConsoleTechnical;
  const topSitemapIssues = technical?.sitemapIssues?.slice(0, 10) || [];
  const topInspectionIssues = technical?.urlInspectionIssues?.slice(0, 15) || [];
  const inspectedUrlCount = technical?.inspectedUrlCount || 0;
  const sitemapCount = technical?.sitemaps?.entries?.length || 0;
  const repoFixPlan = analysis.repoFixes?.plan || [];
  const appliedFixes = analysis.repoFixes?.appliedFixes || [];
  const skippedFixes = analysis.repoFixes?.skippedFixes || [];

  return `# SEO Monitor Report - ${timestamp.slice(0, 10)}

- Mode: ${mode}
- Search Console property used: \`${siteInfo.usedSite || 'unavailable'}\`
- Configured Search Console property: \`${siteInfo.configuredSite || 'unset'}\`
- Current date range: ${ranges.current.startDate} to ${ranges.current.endDate}
- Previous date range: ${ranges.previous.startDate} to ${ranges.previous.endDate}
- Search Console status: ${gsc.status}
- Search Console sitemaps inspected: ${sitemapCount}
- Search Console URL Inspection URLs checked: ${inspectedUrlCount}
- GA4 status: ${ga4.status}
${siteInfo.warning ? `- Property note: ${siteInfo.warning}\n` : ''}
## Executive Read

${analysis.recommendations
  .map(item => `- **${item.priority} / ${item.type}:** ${item.action}`)
  .join('\n')}

## Low-CTR Opportunities

${markdownTable(topLowCtr, [
  { label: 'Query', value: row => row.query },
  { label: 'Page', value: row => row.page },
  { label: 'Impr.', value: row => row.impressions },
  { label: 'CTR', value: row => pct(row.ctr) },
  { label: 'Pos.', value: row => row.position.toFixed(1) },
])}

## Striking-Distance Queries

${markdownTable(topStriking, [
  { label: 'Query', value: row => row.query },
  { label: 'Page', value: row => row.page },
  { label: 'Impr.', value: row => row.impressions },
  { label: 'Pos.', value: row => row.position.toFixed(1) },
])}

## Declining Pages

${markdownTable(analysis.decliningPages.slice(0, 10), [
  { label: 'Page', value: row => row.page },
  { label: 'Prev Impr.', value: row => row.previousImpressions },
  { label: 'Current Impr.', value: row => row.currentImpressions },
  { label: 'Drop', value: row => row.drop },
  { label: 'Drop %', value: row => pct(row.dropPct) },
])}

## Cannibalization Risks

${markdownTable(analysis.cannibalizationRisks.slice(0, 10), [
  { label: 'Query', value: row => row.query },
  { label: 'Pages', value: row => row.pages.join(', ') },
  { label: 'Impr.', value: row => row.impressions },
])}

## Search Console Sitemap Issues

${markdownTable(topSitemapIssues, [
  { label: 'Sitemap', value: row => row.path },
  { label: 'Errors', value: row => row.errors },
  { label: 'Warnings', value: row => row.warnings },
  { label: 'Pending', value: row => row.isPending },
  { label: 'Last Downloaded', value: row => row.lastDownloaded || 'unknown' },
])}

## Search Console URL Inspection Issues

${markdownTable(topInspectionIssues, [
  { label: 'URL', value: row => row.url },
  { label: 'Severity', value: row => row.severity },
  { label: 'Type', value: row => row.type },
  { label: 'Evidence', value: row => row.evidence },
  { label: 'Safe Automation', value: row => row.safeAutomation },
])}

## Repo Fix Plan

${markdownTable(repoFixPlan, [
  { label: 'Priority', value: row => row.priority },
  { label: 'Type', value: row => row.type },
  { label: 'Evidence', value: row => row.evidence },
  { label: 'Action', value: row => row.action },
  { label: 'Auto-safe', value: row => row.safeToApply },
])}

### Applied or Already-Present Fixes

${markdownTable(appliedFixes, [
  { label: 'Type', value: row => row.type },
  { label: 'Status', value: row => row.status },
  { label: 'File', value: row => row.file || row.files?.join(', ') || '' },
  { label: 'Detail', value: row => row.detail },
])}

### Skipped or Manual Review Fixes

${markdownTable(skippedFixes, [
  { label: 'Type', value: row => row.type },
  { label: 'Status', value: row => row.status },
  { label: 'File', value: row => row.file || row.files?.join(', ') || '' },
  { label: 'Detail', value: row => row.detail || row.action },
])}

## Blog Content Quality Issues

${markdownTable(topContentIssues, [
  { label: 'Slug', value: row => row.slug },
  { label: 'Issues', value: row => row.issues.join(', ') },
])}

## Recommended Action

${analysis.recommendations
  .map(
    item => `### ${item.priority}: ${item.type}

${item.action}

Safe automation stance: ${item.safeAutomation}
`
  )
  .join('\n')}
`;
}

function ensureLog() {
  if (fs.existsSync(LOG_PATH)) return;

  fs.writeFileSync(
    LOG_PATH,
    `# SEO Monitor Decision Log

This log records Search Console and GA4 SEO monitor runs, findings, fixes, validation, and deployment status.

## Runs

`,
    'utf8'
  );
}

function appendDecisionLog({
  timestamp,
  status,
  reportPath,
  siteInfo,
  gsc,
  ga4,
  analysis,
  validation,
  deployment,
}) {
  ensureLog();

  const entry = `## ${timestamp.slice(0, 10)} - CartShift SEO Technical Monitor

- Outcome: ${status}
- Data sources used: Search Console Search Analytics, Search Console Sitemaps, Search Console URL Inspection, GA4, repo blog inventory, SEO docs
- Search Console property: \`${siteInfo.usedSite || 'unavailable'}\`
- GA4 access: ${ga4.ok ? 'OK' : `Blocked (${ga4.status})`}
- GSC access: ${gsc.ok ? 'OK' : `Blocked (${gsc.status})`}
- URL Inspection coverage: ${analysis.searchConsoleTechnical?.inspectedUrlCount || 0} URLs checked
- Sitemap API coverage: ${analysis.searchConsoleTechnical?.sitemaps?.entries?.length || 0} submitted sitemap entries checked
- Top issue: ${analysis.recommendations[0]?.type || 'None'}
- Recommended action: ${analysis.recommendations[0]?.action || 'Continue monitoring.'}
- Affected files: ${reportPath ? `\`${path.relative(ROOT, reportPath).replace(/\\/g, '/')}\`` : 'None'}
- Validation: ${validation}
- Deployment: ${deployment}
- Notes: ${siteInfo.warning || 'No property mismatch detected.'}

`;

  fs.appendFileSync(LOG_PATH, entry, 'utf8');
}

function writeJsonReport(reportPath, data) {
  const jsonPath = reportPath.replace(/\.md$/, '.json');
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
  return jsonPath;
}

async function main() {
  const env = getEnv();
  const timestamp = new Date().toISOString();
  const ranges = dateRanges(Number(env.SEO_MONITOR_DAYS || 90));
  const mode = isApplyMode ? 'apply' : 'report-only';
  const serviceAccount = parseServiceAccount(env);
  const token = await getAccessToken(serviceAccount, [
    'https://www.googleapis.com/auth/webmasters.readonly',
    'https://www.googleapis.com/auth/analytics.readonly',
  ]);

  const configuredSite = env.GOOGLE_SEARCH_CONSOLE_SITE_URL;
  const siteInfo = await resolveSearchConsoleSite(token, configuredSite);
  const propertyId = env.GA4_PROPERTY_ID || env.GOOGLE_ANALYTICS_PROPERTY_ID;
  const commonGscBody = { rowLimit: Number(env.SEO_MONITOR_ROW_LIMIT || 1000) };
  const inspectionLimit = Number(env.SEO_MONITOR_INSPECTION_LIMIT || DEFAULT_INSPECTION_LIMIT);

  const [
    currentQueryPage,
    currentPages,
    previousPages,
    submittedSitemaps,
    currentGa4,
    previousGa4,
  ] = await Promise.all([
    siteInfo.usedSite
      ? runSearchConsoleQuery(token, siteInfo.usedSite, {
          ...commonGscBody,
          ...ranges.current,
          dimensions: ['query', 'page'],
        })
      : Promise.resolve({ ok: false, status: 0, body: {} }),
    siteInfo.usedSite
      ? runSearchConsoleQuery(token, siteInfo.usedSite, {
          ...commonGscBody,
          ...ranges.current,
          dimensions: ['page'],
        })
      : Promise.resolve({ ok: false, status: 0, body: {} }),
    siteInfo.usedSite
      ? runSearchConsoleQuery(token, siteInfo.usedSite, {
          ...commonGscBody,
          ...ranges.previous,
          dimensions: ['page'],
        })
      : Promise.resolve({ ok: false, status: 0, body: {} }),
    siteInfo.usedSite
      ? listSearchConsoleSitemaps(token, siteInfo.usedSite)
      : Promise.resolve({ ok: false, status: 0, body: {} }),
    runGa4Report(token, propertyId, ranges.current),
    runGa4Report(token, propertyId, ranges.previous),
  ]);

  const gscOk = currentQueryPage.ok && currentPages.ok;
  const ga4Ok = currentGa4.ok;
  const posts = inventoryBlogPosts();
  const currentQueryPageRows = normalizeGscRows(currentQueryPage.body.rows);
  const currentPageRows = normalizeGscRows(currentPages.body.rows);
  const previousPageRows = normalizeGscRows(previousPages.body.rows);

  let analysis = analyzeData({
    gscQueryPageRows: currentQueryPageRows,
    gscPageRows: currentPageRows,
    previousGscPageRows: previousPageRows,
    gaRows: normalizeGa4Rows(currentGa4.body.rows),
    previousGaRows: normalizeGa4Rows(previousGa4.body.rows),
    posts,
  });

  const sitemaps = normalizeSitemaps(submittedSitemaps);
  const inspectionCandidates =
    siteInfo.usedSite && gscOk
      ? buildInspectionCandidates({
          analysis,
          gscPageRows: currentPageRows,
          siteInfo,
          limit: inspectionLimit,
        })
      : [];
  const inspections =
    siteInfo.usedSite && inspectionCandidates.length
      ? await inspectCandidateUrls({
          token,
          siteUrl: siteInfo.usedSite,
          candidates: inspectionCandidates,
        })
      : [];
  analysis = attachTechnicalRecommendations(
    analysis,
    analyzeSearchConsoleTechnical({ sitemaps, inspections })
  );
  analysis = {
    ...analysis,
    repoFixes: isApplyMode
      ? applySafeRepoFixes(analysis)
      : {
          plan: buildRepoFixPlan(analysis),
          appliedFixes: [],
          skippedFixes: [],
        },
  };

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const safeTimestamp = timestamp.replace(/[:.]/g, '-');
  const reportPath = path.join(REPORT_DIR, `${safeTimestamp}-seo-monitor.md`);
  const report = createReport({
    timestamp,
    ranges,
    siteInfo,
    gsc: {
      ok: gscOk,
      status: gscOk ? 'OK' : `Blocked (${currentQueryPage.status}/${currentPages.status})`,
    },
    ga4: { ok: ga4Ok, status: ga4Ok ? 'OK' : `Blocked (${currentGa4.status})` },
    analysis,
    mode,
  });

  fs.writeFileSync(reportPath, report, 'utf8');
  const jsonPath = writeJsonReport(reportPath, {
    timestamp,
    ranges,
    siteInfo,
    gsc: {
      queryPage: currentQueryPage.ok
        ? { ok: true, rowCount: currentQueryPage.body.rows?.length || 0 }
        : { ok: false, status: currentQueryPage.status, error: currentQueryPage.body.error },
      pages: currentPages.ok
        ? { ok: true, rowCount: currentPages.body.rows?.length || 0 }
        : { ok: false, status: currentPages.status, error: currentPages.body.error },
      sitemaps: sitemaps.ok
        ? { ok: true, rowCount: sitemaps.entries.length, issueCount: sitemaps.issues.length }
        : { ok: false, status: sitemaps.status, error: sitemaps.error },
      urlInspection: {
        ok: inspections.every(inspection => inspection.ok),
        inspectedUrlCount: inspections.length,
        issueCount: analysis.searchConsoleTechnical.urlInspectionIssues.length,
      },
    },
    ga4: currentGa4.ok
      ? { ok: true, rowCount: currentGa4.body.rows?.length || 0 }
      : { ok: false, status: currentGa4.status, error: currentGa4.body.error },
    analysis,
  });

  const status = gscOk || ga4Ok ? 'Reported' : 'Blocked';
  const validationResult = isApplyMode
    ? validateAppliedFixes(analysis.repoFixes.appliedFixes)
    : {
        ok: true,
        attempted: false,
        summary: 'Report generated; no code/content changes applied.',
        commands: [],
      };
  const deploymentExpectation =
    isApplyMode &&
    validationResult.ok &&
    analysis.repoFixes.appliedFixes.some(fix => fix.status === 'applied')
      ? 'Validation passed; commit/push will be attempted for automation-owned files.'
      : 'Not attempted by monitor script.';

  appendDecisionLog({
    timestamp,
    status,
    reportPath,
    siteInfo,
    gsc: { ok: gscOk, status: currentQueryPage.status },
    ga4: { ok: ga4Ok, status: currentGa4.status },
    analysis,
    validation: validationResult.summary,
    deployment: deploymentExpectation,
  });

  const deploymentResult = isApplyMode
    ? commitAndPushFixes({
        reportPath,
        jsonPath,
        appliedFixes: analysis.repoFixes.appliedFixes,
        validation: validationResult,
        env,
      })
    : {
        ok: false,
        attempted: false,
        summary: 'Report-only mode; no commit or push attempted.',
      };

  const summary = {
    status,
    mode,
    reportPath: path.relative(ROOT, reportPath).replace(/\\/g, '/'),
    jsonPath: path.relative(ROOT, jsonPath).replace(/\\/g, '/'),
    searchConsoleProperty: siteInfo.usedSite,
    propertyWarning: siteInfo.warning,
    recommendationCount: analysis.recommendations.length,
    sitemapIssueCount: analysis.searchConsoleTechnical.sitemapIssues.length,
    inspectedUrlCount: analysis.searchConsoleTechnical.inspectedUrlCount,
    urlInspectionIssueCount: analysis.searchConsoleTechnical.urlInspectionIssues.length,
    repoFixPlanCount: analysis.repoFixes.plan.length,
    appliedFixCount: analysis.repoFixes.appliedFixes.length,
    skippedFixCount: analysis.repoFixes.skippedFixes.length,
    validation: validationResult.summary,
    deployment: deploymentResult.summary,
    topRecommendation: analysis.recommendations[0],
  };

  if (isJsonMode) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  if (!isSilent) {
    console.log(`SEO monitor ${status.toLowerCase()}: ${summary.reportPath}`);
    if (summary.propertyWarning) console.log(`Property note: ${summary.propertyWarning}`);
    console.log(
      `Top recommendation: ${summary.topRecommendation.priority} ${summary.topRecommendation.type}`
    );
  }
}

main().catch(error => {
  const timestamp = new Date().toISOString();
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  ensureLog();
  fs.appendFileSync(
    LOG_PATH,
    `## ${timestamp.slice(0, 10)} - CartShift SEO Technical Monitor

- Outcome: Blocked
- Data sources used: Attempted Google Search Console, GA4, repo configuration
- Top issue: Automation runtime failure
- Recommended action: ${error.message}
- Affected files: None
- Validation: Not run
- Deployment: Not attempted
- Notes: Secret values were not printed.

`,
    'utf8'
  );

  console.error(`SEO monitor blocked: ${error.message}`);
  process.exitCode = 1;
});
