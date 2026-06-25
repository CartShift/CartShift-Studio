import {
  AnalysisMeta,
  AnalysisConfidence,
  AnalysisResult,
  AnalysisSource,
  Finding,
  ProductSchemaEntityEvidence,
  ScanScope,
  Recommendation,
  SectionResult,
} from '@/lib/types/analyzer';
import { logError } from '@/lib/error-handler';
import { Logger } from '@/lib/logger';
import { recordAnalyzerServiceFailure } from './analyzer-telemetry';
import { analyzeBestPracticesFallback } from './analyzer-best-practices-fallback';
import { CacheService } from './cache-service';
import { analyzeCartExperience } from './cart-analyzer-advanced';
import { CompetitorService } from './competitor-service';
import { AIReadinessService } from './ai-readiness';
import { BenchmarkService } from './benchmark';
import { ScraperService } from './scraper';
import { safeFetchStoreHtml } from '@/lib/utils/safe-store-fetch';

const PAGESPEED_API_KEY = process.env.PAGESPEED_API_KEY;

// Platform detection patterns
const platformPatterns = [
  {
    name: 'Shopify',
    patterns: [
      /cdn\.shopify\.com/i,
      /myshopify\.com/i,
      /shopify-features/i,
      /shopify-payment-button/i,
      /shopify\.theme/i,
    ],
  },
  {
    name: 'WooCommerce',
    patterns: [/wp-content\/plugins\/woocommerce/i, /wc-ajax/i, /wp-json\/wc/i],
  },
  { name: 'Magento', patterns: [/static\/_requirejs/i, /magento/i] },
  { name: 'BigCommerce', patterns: [/cdn\.bigcommerce\.com/i, /mybigcommerce\.com/i] },
  { name: 'Wix', patterns: [/wix-image/i, /wix-code/i, /wix\.com\/_partials/i] },
  { name: 'Squarespace', patterns: [/squarespace-cdn/i, /sqsp\.net/i] },
  { name: 'PrestaShop', patterns: [/prestashop/i] },
];

function detectPlatform(html: string, url: string): string | null {
  const combined = html + ' ' + url;
  for (const platform of platformPatterns) {
    for (const pattern of platform.patterns) {
      if (pattern.test(combined)) {
        return platform.name;
      }
    }
  }
  return null;
}

function getScoreStatus(score: number): 'critical' | 'warning' | 'good' | 'excellent' {
  if (score >= 90) return 'excellent';
  if (score >= 80) return 'good';
  if (score >= 50) return 'warning';
  return 'critical';
}

function createRecommendation(
  code: string,
  title: string,
  impact: Recommendation['impact'],
  description: string,
  action: string,
  evidence?: string,
  effort: Recommendation['effort'] = impact === 'high' ? 'medium' : 'quick',
  source: AnalysisSource = 'heuristic',
  confidence: AnalysisConfidence = 'estimated',
  scannedUrlScope: string[] = [],
  limitation?: string
): Recommendation {
  return {
    code,
    title,
    impact,
    description,
    action,
    evidence,
    effort,
    serviceLink: '/contact',
    source,
    confidence,
    scannedUrlScope,
    exactEvidence: evidence ? [evidence] : [],
    limitation,
  };
}

const lighthouseRecommendationMap: Record<
  string,
  {
    title: string;
    description: string;
    action: string;
    effort?: Recommendation['effort'];
  }
> = {
  'meta-description': {
    title: 'Add a search-ready meta description',
    description:
      'Search engines and AI answer engines use the description to understand the page and influence click-through rate.',
    action:
      'Write a unique 140-160 character description for the homepage that names the offer, audience, and primary reason to buy.',
    effort: 'quick',
  },
  'robots-txt': {
    title: 'Fix robots.txt crawl rules',
    description:
      'Invalid robots.txt directives can stop crawlers from discovering important product, category, or asset URLs.',
    action:
      'Validate /robots.txt, remove unsupported directives, and confirm important pages and assets are not blocked.',
    effort: 'quick',
  },
  'color-contrast': {
    title: 'Improve low-contrast text',
    description:
      'Low contrast makes important copy and buttons harder to read, especially on mobile and for users with impaired vision.',
    action:
      'Adjust foreground/background color pairs to meet WCAG AA contrast: 4.5:1 for normal text and 3:1 for large text.',
    effort: 'medium',
  },
  'image-alt': {
    title: 'Add descriptive alt text to images',
    description:
      'Product and content images without alt text lose accessibility context and reduce image-search clarity.',
    action:
      'Add concise alt text to meaningful images and leave purely decorative images empty with alt="".',
    effort: 'medium',
  },
  'button-name': {
    title: 'Name icon-only buttons',
    description:
      'Buttons without accessible names are confusing for screen reader users and automated assistants.',
    action:
      'Add visible text or aria-label values to every button, especially cart, menu, search, and carousel controls.',
    effort: 'quick',
  },
  'link-name': {
    title: 'Make links understandable',
    description:
      'Generic or empty links make navigation unclear and weaken semantic understanding of the page.',
    action:
      'Replace vague link labels with destination-specific text and add aria-labels when an icon is the only visible content.',
    effort: 'quick',
  },
  label: {
    title: 'Connect labels to form fields',
    description:
      'Unlabeled inputs hurt accessibility and can reduce checkout and newsletter form completion.',
    action:
      'Use visible labels or aria-label/aria-labelledby for each form input, select, and textarea.',
    effort: 'quick',
  },
  'server-response-time': {
    title: 'Reduce server response time',
    description:
      'Slow server response delays every later loading milestone and makes paid traffic less efficient.',
    action:
      'Enable page caching, review hosting resources, move heavy plugins/apps off the critical path, and add CDN caching.',
    effort: 'advanced',
  },
  'largest-contentful-paint': {
    title: 'Speed up the largest visible element',
    description:
      'A slow hero image or main content block delays the moment shoppers feel the page is usable.',
    action:
      'Preload the hero image, compress it, serve responsive sizes, and defer non-critical scripts competing for bandwidth.',
    effort: 'medium',
  },
  'total-blocking-time': {
    title: 'Reduce JavaScript blocking time',
    description:
      'Heavy JavaScript blocks interaction and makes filters, menus, and add-to-cart actions feel laggy.',
    action:
      'Remove unused scripts, defer third-party tags, split large bundles, and audit apps/plugins loaded on every page.',
    effort: 'advanced',
  },
  'cumulative-layout-shift': {
    title: 'Prevent layout shifts',
    description: 'Unexpected movement can cause misclicks and makes product pages feel unstable.',
    action: 'Reserve width/height for images, embeds, banners, and sticky bars before they load.',
    effort: 'medium',
  },
};

interface PageSpeedResult {
  lighthouseResult?: {
    categories?: {
      performance?: { score: number };
      seo?: { score: number };
      accessibility?: { score: number };
      'best-practices'?: { score: number };
    };
    audits?: Record<string, any>;
  };
  loadingExperience?: {
    metrics?: Record<string, { percentile: number; category: string }>;
  };
  error?: { message: string };
}

async function fetchPageSpeedData(url: string): Promise<PageSpeedResult | null> {
  try {
    const apiUrl = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
    apiUrl.searchParams.set('url', url);
    if (PAGESPEED_API_KEY) {
      apiUrl.searchParams.set('key', PAGESPEED_API_KEY);
    }
    apiUrl.searchParams.set('strategy', 'mobile');
    apiUrl.searchParams.set('category', 'performance');
    apiUrl.searchParams.append('category', 'seo');
    apiUrl.searchParams.append('category', 'accessibility');
    apiUrl.searchParams.append('category', 'best-practices');

    const response = await fetch(apiUrl.toString(), {
      signal: AbortSignal.timeout(45000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      Logger.warn('PageSpeed API error', { errorText });
      return null;
    }

    return await response.json();
  } catch (error) {
    Logger.warn('PageSpeed API fetch error', { error });
    return null;
  }
}

function extractLighthouseFindings(
  audits: Record<string, any>,
  category: string
): { findings: Finding[]; recommendations: Recommendation[] } {
  const findings: Finding[] = [];
  const recommendations: Recommendation[] = [];

  const categoryAudits: Record<string, string[]> = {
    performance: [
      'first-contentful-paint',
      'largest-contentful-paint',
      'speed-index',
      'total-blocking-time',
      'cumulative-layout-shift',
      'server-response-time',
      'interactive',
      'mainthread-work-breakdown',
    ],
    seo: [
      'document-title',
      'meta-description',
      'http-status-code',
      'crawlable-anchors',
      'is-crawlable',
      'robots-txt',
      'link-text',
      'image-alt',
    ],
    accessibility: [
      'button-name',
      'color-contrast',
      'image-alt',
      'link-name',
      'label',
      'form-field-multiple-labels',
    ],
    'best-practices': [
      'is-on-https',
      'uses-http2',
      'no-vulnerable-libraries',
      'doctype',
      'charset',
    ],
  };

  const auditsToCheck = categoryAudits[category] || [];

  for (const auditId of auditsToCheck) {
    const audit = audits[auditId];
    if (
      !audit ||
      audit.scoreDisplayMode === 'notApplicable' ||
      audit.scoreDisplayMode === 'informative'
    )
      continue;

    if (audit.score === 1) {
      findings.push({
        type: 'positive',
        title: audit.title,
        description: 'Passed',
      });
    } else if (audit.score !== null && audit.score < 0.9) {
      const recommendation = lighthouseRecommendationMap[auditId];
      const impact = audit.score < 0.5 ? 'high' : 'medium';
      const evidence =
        audit.displayValue ||
        audit.description?.split('.')[0] ||
        'The Lighthouse audit did not pass.';

      findings.push({
        type: 'issue',
        title: audit.title,
        description: evidence,
      });
      recommendations.push(
        recommendation
          ? createRecommendation(
              auditId,
              recommendation.title,
              impact,
              recommendation.description,
              recommendation.action,
              evidence,
              recommendation.effort
            )
          : createRecommendation(
              auditId,
              audit.title
                .replace('Ensure', 'Fix')
                .replace('Avoid', 'Remove')
                .replace('Eliminate', 'Fix'),
              impact,
              audit.description?.split('.')[0] || 'This audit did not meet Lighthouse standards.',
              'Review the failing Lighthouse audit details and fix the affected templates or theme code.',
              evidence
            )
      );
    }
  }

  return { findings, recommendations };
}

/** Static HTML analysis when full (Puppeteer) analysis is unavailable. */
function analyzeSEOFallback(html: string): SectionResult {
  const findings: Finding[] = [];
  const recommendations: Recommendation[] = [];
  let score = 50;

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch && titleMatch[1].trim().length > 0) {
    score += 20;
    findings.push({
      type: 'positive',
      title: 'Page title found',
      description: 'HTML title tag is present.',
    });
  } else {
    findings.push({
      type: 'issue',
      title: 'Missing page title',
      description: 'Title tag is empty or missing.',
    });
    recommendations.push(
      createRecommendation(
        'document-title',
        'Add a descriptive page title',
        'high',
        'The page title is one of the strongest signals for search listings and browser tabs.',
        'Add a unique title under 60 characters that includes the store name and main product/category promise.',
        'No non-empty <title> tag was found.',
        'quick'
      )
    );
  }

  const metaDescMatch =
    html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i) ||
    html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i);
  if (metaDescMatch && metaDescMatch[1].trim().length > 0) {
    score += 20;
    findings.push({
      type: 'positive',
      title: 'Meta description found',
      description: 'Meta description is present.',
    });
  } else {
    findings.push({
      type: 'issue',
      title: 'Missing meta description',
      description: 'Add a meta description.',
    });
    recommendations.push(
      createRecommendation(
        'meta-description',
        'Add a search-ready meta description',
        'high',
        'Search engines and AI answer engines use the description to understand the page and influence click-through rate.',
        'Write a unique 140-160 character description for the homepage that names the offer, audience, and primary reason to buy.',
        'No meta description was found.',
        'quick'
      )
    );
  }

  const h1Status = analyzeH1Static(html);
  if (h1Status.status === 'single_static') {
    score += 10;
    findings.push({
      type: 'positive',
      title: h1Status.title,
      description: h1Status.description,
    });
  } else {
    findings.push({
      type: 'issue',
      title: h1Status.title,
      description: h1Status.description,
    });
    recommendations.push(
      createRecommendation(
        'h1',
        'Add one clear H1 heading',
        'medium',
        'A clear H1 helps shoppers, search engines, and assistive technologies understand the page topic.',
        'Add one visible H1 near the top of the homepage that describes the store or primary collection.',
        h1Status.description,
        'quick',
        'static_html',
        'estimated',
        [],
        'Static HTML cannot verify which heading is visible after responsive CSS and JavaScript render.'
      )
    );
  }

  return {
    name: 'SEO',
    score: Math.min(100, score),
    status: getScoreStatus(score),
    findings,
    recommendations,
  };
}

function analyzePerformanceFallback(html: string): SectionResult {
  const findings: Finding[] = [];
  const recommendations: Recommendation[] = [];
  let score = 60;

  const scriptCount = (html.match(/<script/gi) || []).length;
  const externalScripts = [...html.matchAll(/<script\b([^>]*)\bsrc=["']([^"']+)["'][^>]*>/gi)];
  const inlineScripts = [...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
  const inlineJsSize = inlineScripts.reduce((sum, match) => sum + match[1].length, 0);
  const blockingHeadScripts =
    (html.match(/<head[\s\S]*?<\/head>/i)?.[0].match(
      /<script\b(?![^>]*(async|defer|type=["']module["']))[^>]*\bsrc=/gi
    ) || []).length;
  const deferredScripts = externalScripts.filter(match =>
    /\b(async|defer|type=["']module["'])/i.test(match[1])
  ).length;
  const knownThirdPartyDomains = externalScripts
    .map(match => {
      try {
        return new URL(match[2]).hostname.replace(/^www\./, '');
      } catch {
        return '';
      }
    })
    .filter(domain =>
      /google|facebook|tiktok|klaviyo|mailchimp|hotjar|doubleclick|yotpo|trustpilot|shopifycdn|cloudflare/i.test(
        domain
      )
    );

  if (scriptCount > 20) {
    score -= 5;
    findings.push({
      type: 'issue',
      title: 'Many script references detected',
      description:
        'The page contains many script references, but runtime impact could not be verified without Lighthouse data.',
      source: 'static_html',
      confidence: 'estimated',
      exactEvidence: [
        `${scriptCount} script tags`,
        `${externalScripts.length} external script src URLs`,
        `${blockingHeadScripts} potentially blocking head scripts`,
      ],
      limitation:
        'Script count is an HTML-only diagnostic. It does not prove render blocking, interaction delay, or slow menus.',
    });
  } else {
    findings.push({
      type: 'positive',
      title: 'Reasonable script usage',
      description: 'Script tag count is normal.',
    });
  }

  if (/loading=["']lazy["']/i.test(html)) {
    score += 10;
    findings.push({
      type: 'positive',
      title: 'Lazy loading detected',
      description: 'Images use lazy loading.',
    });
  } else {
    recommendations.push(
      createRecommendation(
        'lazy-loading',
        'Lazy load below-fold images',
        'medium',
        'Images below the first viewport should not compete with critical content for initial bandwidth.',
        'Add loading="lazy" to below-fold images while keeping the hero image eager/preloaded.',
        'No lazy-loaded images were detected in the static HTML.',
        'quick'
      )
    );
  }

  const independentRiskSignals = [
    scriptCount > 35,
    externalScripts.length > 25,
    inlineJsSize > 150_000,
    blockingHeadScripts > 8,
    knownThirdPartyDomains.length > 8,
  ].filter(Boolean).length;

  if (independentRiskSignals >= 3) {
    recommendations.push(
      createRecommendation(
        'script-count',
        'Review storefront JavaScript weight',
        'medium',
        'Multiple static HTML signals suggest JavaScript weight may deserve a runtime performance audit.',
        'Run Lighthouse or WebPageTest, then remove unused app/theme scripts and defer non-critical third-party tags confirmed to affect loading or interaction.',
        `${scriptCount} script tags, ${externalScripts.length} external scripts, ${Math.round(
          inlineJsSize / 1024
        )} KiB inline JavaScript, ${blockingHeadScripts} potentially blocking head scripts, ${deferredScripts} async/defer/module scripts.`,
        'advanced',
        'static_html',
        'estimated',
        [],
        'Static HTML can estimate script exposure but cannot verify Total Blocking Time, main-thread work, or render-blocking impact.'
      )
    );
  }

  return {
    name: 'Performance',
    score: Math.min(100, score),
    status: getScoreStatus(score),
    findings,
    recommendations,
  };
}

function analyzeAccessibilityFallback(html: string): SectionResult {
  const findings: Finding[] = [];
  const recommendations: Recommendation[] = [];
  let score = 50;

  if (/html[^>]+lang=/i.test(html)) {
    score += 25;
    findings.push({
      type: 'positive',
      title: 'Language attribute',
      description: 'HTML tag specifies a language.',
    });
  } else {
    recommendations.push(
      createRecommendation(
        'html-lang',
        'Set the page language',
        'high',
        'Language metadata helps screen readers pronounce content correctly and helps search engines classify the page.',
        'Add the correct lang attribute to the <html> element, such as lang="he" or lang="en".',
        'No html lang attribute was detected.',
        'quick'
      )
    );
  }

  if (/<meta[^>]+name=["']viewport["']/i.test(html)) {
    score += 25;
    findings.push({
      type: 'positive',
      title: 'Mobile optimization',
      description: 'Viewport meta tag is present.',
    });
  } else {
    recommendations.push(
      createRecommendation(
        'viewport',
        'Add a mobile viewport tag',
        'high',
        'Without a viewport tag, mobile browsers may render the store at desktop width and create a poor shopping experience.',
        'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to the document head.',
        'No viewport meta tag was detected.',
        'quick'
      )
    );
  }

  const imgCount = (html.match(/<img/gi) || []).length;
  const altCount = (html.match(/alt=["'][^"']*["']/gi) || []).length;

  if (imgCount > 0 && altCount >= imgCount * 0.8) {
    score += 20;
    findings.push({
      type: 'positive',
      title: 'Image alt text',
      description: 'Most images have description tags.',
    });
  } else if (imgCount > 0) {
    recommendations.push(
      createRecommendation(
        'image-alt',
        'Add descriptive alt text to images',
        'medium',
        'Product and content images without alt text lose accessibility context and reduce image-search clarity.',
        'Add concise alt text to meaningful images and leave purely decorative images empty with alt="".',
        `${altCount} of ${imgCount} images include alt text.`,
        'medium'
      )
    );
  } else {
    score += 20;
  }

  return {
    name: 'Accessibility',
    score: Math.min(100, score),
    status: getScoreStatus(score),
    findings,
    recommendations,
  };
}

function analyzeTrust(html: string): SectionResult {
  const findings: Finding[] = [];
  const recommendations: Recommendation[] = [];
  let score = 50;

  const reviewTerms = /review|rating|star|testimonial|feedback/i;
  if (reviewTerms.test(html)) {
    findings.push({
      type: 'positive',
      title: 'Social proof detected',
      description: 'Reviews or ratings found.',
    });
    score += 20;
  } else {
    recommendations.push(
      createRecommendation(
        'reviews',
        'Show customer reviews or ratings',
        'high',
        'Social proof helps new shoppers validate quality, sizing, service, and delivery confidence.',
        'Add review snippets, star ratings, testimonials, or UGC near product and collection decision points.',
        'No review, rating, testimonial, or feedback language was detected.',
        'medium'
      )
    );
  }

  if (/privacy/i.test(html) && /policy/i.test(html)) {
    findings.push({
      type: 'positive',
      title: 'Privacy policy found',
      description: 'Legal pages appear to be linked.',
    });
    score += 15;
  } else {
    recommendations.push(
      createRecommendation(
        'privacy-policy',
        'Make privacy policy visible',
        'medium',
        'Visible policies build trust and help shoppers understand how their information is handled.',
        'Link privacy, returns, shipping, and terms pages from the footer and checkout-adjacent areas.',
        'A clear privacy policy link was not detected.',
        'quick'
      )
    );
  }

  if (/trust|secure|badge|guarantee|payment|visa|mastercard|paypal/i.test(html)) {
    findings.push({
      type: 'positive',
      title: 'Trust signals detected',
      description: 'Payment/Security icons found.',
    });
    score += 15;
  }

  return {
    name: 'Trust & Credibility',
    score: Math.min(100, score),
    status: getScoreStatus(score),
    findings,
    recommendations,
  };
}

function addRecommendationOnce(section: SectionResult, recommendation: Recommendation) {
  if (section.recommendations.some(rec => rec.code === recommendation.code)) {
    return;
  }
  section.recommendations.push(recommendation);
}

function addFindingOnce(section: SectionResult, title: string, description: string) {
  if (section.findings.some(finding => finding.title === title)) {
    return;
  }
  section.findings.push({
    type: 'issue',
    title,
    description,
  });
}

function lowerSectionScore(section: SectionResult, score: number) {
  section.score = Math.max(0, Math.min(section.score, score));
  section.status = getScoreStatus(section.score);
}

function applyEvidenceDefaults(
  sections: AnalysisResult['sections'],
  source: AnalysisSource,
  confidence: AnalysisConfidence,
  scannedUrlScope: string[],
  limitation?: string
) {
  Object.values(sections).forEach(section => {
    section.findings = section.findings.map(finding => ({
      ...finding,
      source: finding.source ?? source,
      confidence: finding.confidence ?? confidence,
      scannedUrlScope: finding.scannedUrlScope ?? scannedUrlScope,
      exactEvidence: finding.exactEvidence ?? [finding.description].filter(Boolean),
      limitation: finding.limitation ?? limitation,
    }));

    section.recommendations = section.recommendations.map(rec => ({
      ...rec,
      source: rec.source ?? source,
      confidence: rec.confidence ?? confidence,
      scannedUrlScope: rec.scannedUrlScope ?? scannedUrlScope,
      exactEvidence: rec.exactEvidence ?? (rec.evidence ? [rec.evidence] : []),
      limitation: rec.limitation ?? limitation,
    }));
  });
}

function stripHtmlText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function analyzeH1Static(html: string) {
  const matches = [...html.matchAll(/<h1\b([^>]*)>([\s\S]*?)<\/h1>/gi)];
  const visibleMatches = matches.filter(match => {
    const attrs = match[1] || '';
    const text = stripHtmlText(match[2] || '');
    const hidden =
      /\bhidden\b/i.test(attrs) ||
      /aria-hidden=["']true["']/i.test(attrs) ||
      /display\s*:\s*none/i.test(attrs) ||
      /visibility\s*:\s*hidden/i.test(attrs) ||
      /\bsr-only\b/i.test(attrs);
    return text.length > 0 && !hidden;
  });

  if (matches.length === 0) {
    return {
      status: 'missing_raw',
      title: 'No H1 in static HTML',
      description: 'No visible H1 could be confirmed from static HTML.',
    };
  }

  if (visibleMatches.length === 0) {
    return {
      status: 'hidden_only',
      title: 'H1 appears hidden in static HTML',
      description: 'H1 markup exists, but no visible H1 could be confirmed from static HTML.',
    };
  }

  const visibleTexts = visibleMatches.map(match => stripHtmlText(match[2] || '').toLowerCase());
  const uniqueTexts = new Set(visibleTexts);
  if (visibleMatches.length > 1 && uniqueTexts.size === 1) {
    return {
      status: 'duplicated_hidden_responsive',
      title: 'H1 found in duplicated responsive templates',
      description:
        'Multiple matching H1 elements were found in static HTML; rendered browser verification is needed to confirm the visible heading.',
    };
  }

  if (visibleMatches.length > 1) {
    return {
      status: 'multiple',
      title: 'Multiple H1 headings in static HTML',
      description:
        'Multiple H1 elements were found in static HTML; rendered browser verification is needed before making a definitive accessibility claim.',
    };
  }

  return {
    status: 'single_static',
    title: 'H1 heading found in static HTML',
    description:
      'A non-empty H1 exists in static HTML, but visibility was not verified in a rendered browser DOM.',
  };
}

function absoluteUrl(href: string, baseUrl: string): string | null {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
}

function detectProductPageCandidates(html: string, baseUrl: string, platform: string | null): string[] {
  const candidates = new Set<string>();
  const anchorRegex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi;
  let match: RegExpExecArray | null;

  while ((match = anchorRegex.exec(html)) !== null) {
    const href = match[1];
    const url = absoluteUrl(href, baseUrl);
    if (!url) continue;
    const path = new URL(url).pathname.toLowerCase();
    const looksLikeProduct =
      /\/products?\//i.test(path) ||
      /\/product\//i.test(path) ||
      /\/shop\/[^/?#]+/i.test(path) ||
      /add-to-cart=\d+/i.test(href) ||
      (platform === 'WooCommerce' && /\/product-category\/|\/shop\//i.test(path)) ||
      (platform === 'Shopify' && /\/products\//i.test(path));

    if (looksLikeProduct) candidates.add(url.split('#')[0]);
  }

  if (/<script[^>]+type=["']application\/ld\+json["'][^>]*>[\s\S]*?"@type"\s*:\s*"?Product/i.test(html)) {
    candidates.add(baseUrl);
  }

  return [...candidates].slice(0, 8);
}

function extractJsonLdBlocks(html: string): string[] {
  return [
    ...html.matchAll(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    ),
  ].map(match => match[1].trim());
}

function collectProductEntities(value: unknown, products: Record<string, any>[]) {
  if (!value) return;
  if (Array.isArray(value)) {
    value.forEach(item => collectProductEntities(item, products));
    return;
  }
  if (typeof value !== 'object') return;

  const record = value as Record<string, any>;
  const type = record['@type'];
  const types = Array.isArray(type) ? type : [type];
  if (types.some(item => typeof item === 'string' && item.toLowerCase() === 'product')) {
    products.push(record);
  }
  if (record['@graph']) collectProductEntities(record['@graph'], products);
}

function hasOfferField(product: Record<string, any>, field: string): boolean {
  const offers = product.offers;
  const offerList = Array.isArray(offers) ? offers : offers ? [offers] : [];
  return offerList.some(offer => {
    if (!offer || typeof offer !== 'object') return false;
    if (field in offer) return Boolean(offer[field]);
    if (field === 'price' && 'lowPrice' in offer) return Boolean(offer.lowPrice);
    return false;
  });
}

function validateProductSchema(html: string, url: string): ProductSchemaEntityEvidence {
  const blocks = extractJsonLdBlocks(html);
  const products: Record<string, any>[] = [];
  let malformedJsonLd = false;

  for (const block of blocks) {
    try {
      collectProductEntities(JSON.parse(block), products);
    } catch {
      malformedJsonLd = true;
    }
  }

  const fields = {
    name: products.some(product => Boolean(product.name)),
    image: products.some(product => Boolean(product.image)),
    offers: products.some(product => Boolean(product.offers)),
    price: products.some(product => hasOfferField(product, 'price')),
    priceCurrency: products.some(product => hasOfferField(product, 'priceCurrency')),
    availability: products.some(product => hasOfferField(product, 'availability')),
    sku: products.some(product => Boolean(product.sku || product.mpn || product.gtin)),
  };

  const issues: string[] = [];
  if (malformedJsonLd) issues.push('Malformed JSON-LD was detected.');
  if (products.length === 0) issues.push('No Product JSON-LD entity was found.');
  if (products.length > 0) {
    if (!fields.name) issues.push('Product schema is missing name.');
    if (!fields.image) issues.push('Product schema is missing image.');
    if (!fields.offers) issues.push('Product schema is missing offers.');
    if (!fields.price) issues.push('Product offers are missing price.');
    if (!fields.priceCurrency) issues.push('Product offers are missing priceCurrency.');
  }

  return {
    url,
    valid:
      products.length > 0 &&
      !malformedJsonLd &&
      fields.name &&
      fields.image &&
      fields.offers &&
      fields.price &&
      fields.priceCurrency,
    malformedJsonLd,
    productCount: products.length,
    fields,
    issues,
  };
}

async function fetchWithSingleRetry(url: string, timeoutMs: number) {
  try {
    return await safeFetchStoreHtml(url, timeoutMs);
  } catch (firstError) {
    Logger.warn('Product sample fetch failed, retrying once', { url, firstError });
    return safeFetchStoreHtml(url, timeoutMs);
  }
}

async function buildScanScope(
  homepageHtml: string,
  homepageUrl: string,
  platform: string | null
): Promise<ScanScope> {
  const productCandidates = detectProductPageCandidates(homepageHtml, homepageUrl, platform).slice(
    0,
    3
  );
  const scannedUrls = [homepageUrl];

  if (productCandidates.length === 0) {
    return {
      scannedUrls,
      homepageScanned: true,
      productPagesScanned: false,
      productPageCountAttempted: 0,
      productPageCountSucceeded: 0,
      productSchemaCoverageStatus: 'not_scanned',
      productSchemaEvidence: [],
      notes: ['Product pages were not scanned, so product schema coverage could not be verified.'],
    };
  }

  const evidence: ProductSchemaEntityEvidence[] = [];
  let succeeded = 0;

  for (const productUrl of productCandidates) {
    try {
      const fetched = await fetchWithSingleRetry(productUrl, 8000);
      scannedUrls.push(fetched.finalUrl);
      succeeded += 1;
      evidence.push(validateProductSchema(fetched.html, fetched.finalUrl));
    } catch (error) {
      Logger.warn('Product page sample failed', { productUrl, error });
    }
  }

  let status: ScanScope['productSchemaCoverageStatus'] = 'not_scanned';
  if (succeeded === 0) {
    status = 'not_scanned';
  } else if (evidence.some(item => item.malformedJsonLd)) {
    status = 'invalid';
  } else if (evidence.every(item => item.valid)) {
    status = 'present';
  } else if (evidence.some(item => item.valid || item.productCount > 0)) {
    status = 'partial';
  } else {
    status = 'missing';
  }

  return {
    scannedUrls: [...new Set(scannedUrls)],
    homepageScanned: true,
    productPagesScanned: succeeded > 0,
    productPageCountAttempted: productCandidates.length,
    productPageCountSucceeded: succeeded,
    productSchemaCoverageStatus: status,
    productSchemaEvidence: evidence,
    notes:
      succeeded > 0
        ? [`Sampled ${succeeded} of ${productCandidates.length} product page candidate(s).`]
        : ['Product page candidates were found, but none could be fetched successfully.'],
  };
}

function defaultScanScope(url: string, existing?: Partial<ScanScope>): ScanScope {
  return {
    scannedUrls: existing?.scannedUrls?.length ? existing.scannedUrls : [url],
    homepageScanned: existing?.homepageScanned ?? true,
    productPagesScanned: existing?.productPagesScanned ?? false,
    productPageCountAttempted: existing?.productPageCountAttempted ?? 0,
    productPageCountSucceeded: existing?.productPageCountSucceeded ?? 0,
    productSchemaCoverageStatus: existing?.productSchemaCoverageStatus ?? 'not_scanned',
    productSchemaEvidence: existing?.productSchemaEvidence ?? [],
    notes:
      existing?.notes ??
      ['Product pages were not scanned, so product schema coverage could not be verified.'],
  };
}

function suppressLegacyCompetitors(result: AnalysisResult, scanScope: ScanScope) {
  if (
    !result.competitorAnalysis?.competitors?.some(comp => !comp.domainClassification)
  ) {
    return result.competitorAnalysis;
  }

  return {
    ...result.competitorAnalysis,
    competitors: [],
    marketPosition: 'unknown' as const,
    confidence: 'low' as const,
    summary: 'No direct competitors could be identified confidently from the scanned page.',
    analysisConfidence: 'insufficient_evidence' as const,
    scannedUrlScope: scanScope.scannedUrls,
    limitations: [
      'Legacy cached competitor candidates did not include evidence fields and were suppressed.',
    ],
  };
}

function enrichSectionsWithVisualSignals(
  sections: AnalysisResult['sections'],
  visualData: AnalysisResult['visualAnalysis']
) {
  if (!visualData) return;

  if (visualData.contrastIssues > 0) {
    const evidence = `${visualData.contrastIssues} potential low-contrast text pair${
      visualData.contrastIssues === 1 ? '' : 's'
    } were detected during visual capture.`;

    addFindingOnce(sections.accessibility, 'Visual contrast risks detected', evidence);
    addRecommendationOnce(
      sections.accessibility,
      createRecommendation(
        'visual-contrast-audit',
        'Fix visible contrast risks',
        'high',
        'Low contrast makes merchandising, pricing, and checkout copy harder to read on real devices.',
        'Review the captured page against WCAG AA and adjust text, button, and badge colors until normal text reaches 4.5:1 contrast.',
        evidence,
        'medium'
      )
    );
    lowerSectionScore(sections.accessibility, Math.max(45, sections.accessibility.score - 8));
  }

  if (visualData.mobileResponsivenessScore < 80) {
    const evidence = `Mobile visual score was ${Math.round(
      visualData.mobileResponsivenessScore
    )}/100 from horizontal-scroll and touch-target checks.`;

    addFindingOnce(sections.performance, 'Mobile layout friction detected', evidence);
    addRecommendationOnce(
      sections.performance,
      createRecommendation(
        'mobile-layout-friction',
        'Repair mobile shopping friction',
        'high',
        'Mobile layout issues make browsing, tapping, and checkout slower for the traffic most likely to abandon.',
        'Remove horizontal overflow, resize small tap targets to at least 44px, and retest product cards, menus, cart drawers, and checkout CTAs at 320-390px widths.',
        evidence,
        'medium'
      )
    );
    lowerSectionScore(sections.performance, Math.max(40, visualData.mobileResponsivenessScore));
  }
}

function enrichSectionsWithAISignals(
  sections: AnalysisResult['sections'],
  aiData: NonNullable<AnalysisResult['aiAnalysis']>,
  scanScope: ScanScope
) {
  const seo = sections.seo;

  if (aiData.structuredDataTypes.length === 0) {
    const evidence = 'No JSON-LD structured data types were detected in the analyzed HTML.';
    addFindingOnce(seo, 'AI-readable structured data missing', evidence);
    addRecommendationOnce(
      seo,
      createRecommendation(
        'ai-structured-data',
        'Add AI-readable structured data',
        'high',
        'AI answer engines, search rich results, and shopping surfaces need structured facts to understand products, organization details, breadcrumbs, and FAQs.',
        'Add valid JSON-LD for Product, Organization, BreadcrumbList, WebSite, and FAQPage where relevant, then validate it with Rich Results and schema validators.',
        evidence,
        'medium'
      )
    );
    lowerSectionScore(seo, Math.max(55, seo.score - 8));
  } else if (
    scanScope.productPagesScanned &&
    ['missing', 'partial', 'invalid'].includes(scanScope.productSchemaCoverageStatus)
  ) {
    const evidence = `Product schema coverage on sampled product pages: ${scanScope.productSchemaCoverageStatus}.`;
    addFindingOnce(seo, 'Product schema could not be fully verified', evidence);
    addRecommendationOnce(
      seo,
      createRecommendation(
        'ai-product-schema',
        scanScope.productSchemaCoverageStatus === 'missing'
          ? 'Add Product schema to sellable pages'
          : 'Fix Product schema on sampled product pages',
        scanScope.productSchemaCoverageStatus === 'missing' ? 'high' : 'medium',
        'Product schema helps search, shopping, and AI answer surfaces understand price, availability, reviews, images, and product identity.',
        'Add Product JSON-LD to product templates with name, image, description, SKU, offers, availability, priceCurrency, price, and aggregateRating when reviews exist.',
        evidence,
        'medium',
        'product_sample',
        'verified',
        scanScope.scannedUrls
      )
    );
    lowerSectionScore(seo, Math.max(60, seo.score - 6));
  } else if (!scanScope.productPagesScanned) {
    const evidence = 'Product pages were not scanned, so product schema coverage could not be verified.';
    if (!seo.findings.some(finding => finding.title === 'Product schema not verified')) {
      seo.findings.push({
        type: 'issue',
        title: 'Product schema not verified',
        description: evidence,
        source: 'static_html',
        confidence: 'insufficient_evidence',
        scannedUrlScope: scanScope.scannedUrls,
        exactEvidence: [evidence],
        limitation: 'No product-page HTML was fetched for this run.',
      });
    }
  }

  if (!aiData.openGraphTags) {
    const evidence = 'No Open Graph or Twitter card metadata was detected.';
    addFindingOnce(seo, 'Social and AI preview metadata missing', evidence);
    addRecommendationOnce(
      seo,
      createRecommendation(
        'ai-social-metadata',
        'Add share and preview metadata',
        'medium',
        'Open Graph and Twitter card metadata improve how products and collections are summarized when shared, crawled, or cited by assistant-style surfaces.',
        'Add og:title, og:description, og:image, og:url, twitter:card, and product-specific preview metadata to key storefront templates.',
        evidence,
        'quick'
      )
    );
    lowerSectionScore(seo, Math.max(65, seo.score - 4));
  }

  if (aiData.readabilityScore < 60) {
    const evidence = `AI readability score was ${aiData.readabilityScore}/100 from heading, paragraph, list, and FAQ-style content signals.`;
    addFindingOnce(seo, 'Store content is hard for AI systems to summarize', evidence);
    addRecommendationOnce(
      seo,
      createRecommendation(
        'ai-content-clarity',
        'Make pages easier for AI to summarize',
        'medium',
        'Thin or poorly structured content gives search engines and AI answer systems fewer reliable facts to cite about your products, policies, and differentiators.',
        'Add clear H2 sections, concise product/category explanations, FAQ blocks, policy summaries, and bullet lists that answer buying questions directly.',
        evidence,
        'medium'
      )
    );
    lowerSectionScore(seo, Math.max(60, seo.score - 5));
  }
}

async function runHeavyAnalysisTasks(
  html: string,
  normalizedUrl: string,
  fetchedUrl: string,
  scanScope: ScanScope
) {
  return Promise.all([
    CompetitorService.analyzeCompetitors(html, normalizedUrl).catch(err => {
      recordAnalyzerServiceFailure('competitor', err, true);
      return {
        competitors: [],
        marketPosition: 'unknown' as const,
        confidence: 'low' as const,
        summary: 'Competitor analysis could not be completed for this URL.',
        evidence: ['Competitor service failed gracefully.'],
        source: 'static_html' as const,
        analysisConfidence: 'unavailable' as const,
        scannedUrlScope: [normalizedUrl],
      };
    }),
    ScraperService.scrape(fetchedUrl).catch(err => {
      recordAnalyzerServiceFailure('puppeteer', err, true);
      return { visualAnalysis: null, productAnalysis: undefined };
    }),
    Promise.resolve(AIReadinessService.analyze(html, scanScope)).catch(err => {
      recordAnalyzerServiceFailure('ai', err, true);
      return {
        score: 50,
        label: 'Content & structured-data readiness' as const,
        confidence: 'unavailable' as const,
        evidence: [],
        limitations: ['AI readiness analysis failed gracefully.'],
        scannedScope: scanScope,
        structuredDataTypes: [],
        openGraphTags: false,
        readabilityScore: 50,
        aiReadinessStatus: 'needs_improvement' as const,
      };
    }),
  ]);
}

// --- Main Service Class ---

export class AnalyzerService {
  static async analyzeStore(normalizedUrl: string): Promise<AnalysisResult> {
    const cacheKey = `analyze:${normalizedUrl}`;

    // 1. Check Cache
    const cached = await CacheService.get<AnalysisResult>(cacheKey);
    if (cached) {
      Logger.debug('Returning cached analysis', { url: normalizedUrl });
      const cachedScanScope = defaultScanScope(
        cached.storeUrl || normalizedUrl,
        cached.scanScope || cached.meta?.scanScope
      );
      const competitorAnalysis = suppressLegacyCompetitors(cached, cachedScanScope);
      const suppressedLegacyCompetitors =
        Boolean(cached.competitorAnalysis?.competitors?.length) &&
        !competitorAnalysis?.competitors?.length;
      return {
        ...cached,
        scanScope: cachedScanScope,
        competitorAnalysis,
        meta: {
          usedLighthouse: cached.meta?.usedLighthouse ?? true,
          usedHtmlFallback: cached.meta?.usedHtmlFallback ?? false,
          visualAnalysisAttempted: cached.meta?.visualAnalysisAttempted ?? false,
          visualAnalysisAvailable:
            cached.meta?.visualAnalysisAvailable ?? Boolean(cached.visualAnalysis),
          productAnalysisAvailable:
            cached.meta?.productAnalysisAvailable ?? Boolean(cached.productAnalysis),
          competitorAnalysisAvailable:
            suppressedLegacyCompetitors
              ? false
              : (cached.meta?.competitorAnalysisAvailable ??
                Boolean(competitorAnalysis?.competitors?.length)),
          cached: true,
          scanScope: cachedScanScope,
        },
      };
    }

    // 2. Start PageSpeed early; fetch HTML first so heavy tasks can overlap with Lighthouse
    const pageSpeedPromise = fetchPageSpeedData(normalizedUrl);
    let html = '';
    let fetchedUrl = normalizedUrl;
    let heavyTasksPromise: ReturnType<typeof runHeavyAnalysisTasks> | null = null;
    let scanScope: ScanScope = defaultScanScope(normalizedUrl);
    const visualAnalysisAttempted = ScraperService.isEnabled();

    try {
      const fetched = await safeFetchStoreHtml(normalizedUrl, 15000);
      html = fetched.html;
      fetchedUrl = fetched.finalUrl;
    } catch (fetchError: any) {
      const errorDetails = {
        message: fetchError.message,
        cause: fetchError.cause,
        code: fetchError.code,
        name: fetchError.name,
        stack: fetchError.stack,
      };

      logError('Store fetch error', fetchError, { ...errorDetails, url: normalizedUrl });

      // Enhance error message based on specific failure types
      if (fetchError.name === 'TimeoutError' || fetchError.name === 'AbortError') {
        throw new Error(
          `Connection timed out after 15 seconds. The store at ${normalizedUrl} took too long to respond.`
        );
      }

      if (fetchError.code === 'ENOTFOUND') {
        throw new Error(
          `Could not resolve hostname for ${normalizedUrl}. Please check if the URL is correct.`
        );
      }

      if (fetchError.code === 'ECONNREFUSED') {
        throw new Error(`Connection refused by ${normalizedUrl}. The server might be down.`);
      }

      throw new Error(`Could not access store URL: ${fetchError.message}`);
    }

    const platform = detectPlatform(html, fetchedUrl);
    scanScope = await buildScanScope(html, fetchedUrl, platform).catch(error => {
      recordAnalyzerServiceFailure('ai', error, true);
      return defaultScanScope(fetchedUrl);
    });
    heavyTasksPromise = runHeavyAnalysisTasks(html, normalizedUrl, fetchedUrl, scanScope);
    const pageSpeedData = await pageSpeedPromise;

    if (!pageSpeedData) {
      recordAnalyzerServiceFailure('pagespeed', new Error('PageSpeed API unavailable'), true);
    }

    let sections: AnalysisResult['sections'];
    let coreWebVitals: AnalysisResult['coreWebVitals'] = undefined;
    let usedLighthouse = false;
    let usedHtmlFallback = false;

    if (pageSpeedData?.lighthouseResult?.categories) {
      usedLighthouse = true;
      const cats = pageSpeedData.lighthouseResult.categories;
      const audits = pageSpeedData.lighthouseResult.audits || {};

      const perfScore = Math.round((cats.performance?.score || 0) * 100);
      const seoScore = Math.round((cats.seo?.score || 0) * 100);
      const a11yScore = Math.round((cats.accessibility?.score || 0) * 100);
      const bpScore = Math.round((cats['best-practices']?.score || 0) * 100);

      sections = {
        performance: {
          name: 'Performance',
          score: perfScore,
          status: getScoreStatus(perfScore),
          ...extractLighthouseFindings(audits, 'performance'),
        },
        seo: {
          name: 'SEO',
          score: seoScore,
          status: getScoreStatus(seoScore),
          ...extractLighthouseFindings(audits, 'seo'),
        },
        accessibility: {
          name: 'Accessibility',
          score: a11yScore,
          status: getScoreStatus(a11yScore),
          ...extractLighthouseFindings(audits, 'accessibility'),
        },
        bestPractices: {
          name: 'Best Practices',
          score: bpScore,
          status: getScoreStatus(bpScore),
          ...extractLighthouseFindings(audits, 'best-practices'),
        },
        cart: analyzeCartExperience(html, { platform }),
        trust: analyzeTrust(html),
      };

      const m = pageSpeedData.loadingExperience?.metrics;
      if (m) {
        coreWebVitals = {};
        if (m.LARGEST_CONTENTFUL_PAINT_MS)
          coreWebVitals.lcp = {
            value: m.LARGEST_CONTENTFUL_PAINT_MS.percentile,
            rating: m.LARGEST_CONTENTFUL_PAINT_MS.category,
          };
        if (m.CUMULATIVE_LAYOUT_SHIFT_SCORE)
          coreWebVitals.cls = {
            value: m.CUMULATIVE_LAYOUT_SHIFT_SCORE.percentile / 100,
            rating: m.CUMULATIVE_LAYOUT_SHIFT_SCORE.category,
          };
        if (m.FIRST_INPUT_DELAY_MS)
          coreWebVitals.fid = {
            value: m.FIRST_INPUT_DELAY_MS.percentile,
            rating: m.FIRST_INPUT_DELAY_MS.category,
          };
      }
    } else {
      usedHtmlFallback = true;
      Logger.warn('Using fallback analysis', { url: normalizedUrl });
      sections = {
        performance: analyzePerformanceFallback(html),
        seo: analyzeSEOFallback(html),
        accessibility: analyzeAccessibilityFallback(html),
        bestPractices: analyzeBestPracticesFallback(fetchedUrl, html),
        cart: analyzeCartExperience(html, { platform }),
        trust: analyzeTrust(html),
      };

      if (!sections.accessibility) {
        sections.accessibility = {
          name: 'Accessibility',
          score: 50,
          status: 'warning',
          findings: [],
          recommendations: [
            createRecommendation(
              'accessibility-audit',
              'Run a full accessibility audit',
              'high',
              'The fallback analyzer could not gather enough accessibility detail to verify WCAG risks.',
              'Run a browser-based accessibility audit and fix keyboard, label, alt text, and contrast failures.',
              'Full Lighthouse accessibility data was unavailable.',
              'medium'
            ),
          ],
        };
      }
    }

    const serviceStartTime = Date.now();
    const [competitorData, scraperData, aiData] = await (heavyTasksPromise ??
      runHeavyAnalysisTasks(html, normalizedUrl, fetchedUrl, scanScope));

    Logger.debug('External services completed', {
      durationMs: Date.now() - serviceStartTime,
    });

    // Destructure scraper results
    const { visualAnalysis: visualData, productAnalysis: productData } = scraperData;
    sections.cart = analyzeCartExperience(html, {
      platform,
      productAnalysis: productData,
    });
    enrichSectionsWithVisualSignals(sections, visualData || undefined);
    enrichSectionsWithAISignals(sections, aiData, scanScope);
    applyEvidenceDefaults(
      sections,
      usedLighthouse ? 'lighthouse' : 'static_html',
      usedLighthouse ? 'verified' : 'estimated',
      scanScope.scannedUrls,
      usedLighthouse
        ? undefined
        : 'Lighthouse/PageSpeed was unavailable; this item is based on static HTML heuristics.'
    );

    // 8. Calculate Overall Score
    const weights = {
      performance: 0.3,
      seo: 0.25,
      accessibility: 0.15,
      bestPractices: 0.1,
      cart: 0.1,
      trust: 0.1,
    };

    const overallScore = Math.round(
      Object.entries(sections).reduce(
        (sum, [key, section]) =>
          sum + section.score * (weights[key as keyof typeof weights] || 0.1),
        0
      )
    );

    // 9. Benchmark comparison. Only returned when there is enough stored data.
    const benchmark = await BenchmarkService.getBenchmarkComparison(overallScore, html);

    const meta: AnalysisMeta = {
      usedLighthouse,
      usedHtmlFallback,
      visualAnalysisAttempted,
      visualAnalysisAvailable: Boolean(visualData),
      productAnalysisAvailable: Boolean(productData),
      competitorAnalysisAvailable: (competitorData.competitors?.length ?? 0) > 0,
      cached: false,
      scanScope,
    };

    const result: AnalysisResult = {
      storeUrl: fetchedUrl,
      overallScore,
      platform,
      sections,
      coreWebVitals,
      competitorAnalysis: competitorData,
      visualAnalysis: visualData || undefined,
      aiAnalysis: aiData,
      productAnalysis: productData,
      scanScope,
      percentile: benchmark?.percentile,
      benchmark,
      generatedAt: new Date().toISOString(),
      meta,
    };

    // Cache & Save Benchmark (Fire and forget-ish, using Promise.all to ensure completion before func end)
    // Both operations have individual error handling to prevent failures
    await Promise.all([
      CacheService.set(cacheKey, result, 86400).catch(err =>
        recordAnalyzerServiceFailure('cache', err, true)
      ),
      BenchmarkService.saveBenchmark(result, html).catch(err =>
        recordAnalyzerServiceFailure('benchmark', err, true)
      ),
    ]);

    return result;
  }
}
