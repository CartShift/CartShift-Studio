import {
  AnalysisMeta,
  AnalysisResult,
  Finding,
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
  effort: Recommendation['effort'] = impact === 'high' ? 'medium' : 'quick'
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

  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match && h1Match[1].replace(/<[^>]*>/g, '').trim().length > 0) {
    score += 10;
    findings.push({
      type: 'positive',
      title: 'H1 heading found',
      description: 'Main heading structure exists.',
    });
  } else {
    recommendations.push(
      createRecommendation(
        'h1',
        'Add one clear H1 heading',
        'medium',
        'A clear H1 helps shoppers, search engines, and assistive technologies understand the page topic.',
        'Add one visible H1 near the top of the homepage that describes the store or primary collection.',
        'No H1 heading was detected.',
        'quick'
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
  if (scriptCount > 20) {
    score -= 10;
    findings.push({
      type: 'issue',
      title: 'High script count',
      description: 'Detected many script tags.',
    });
    recommendations.push(
      createRecommendation(
        'script-count',
        'Reduce storefront JavaScript',
        'high',
        'Too many scripts slow down rendering and can delay menus, filters, and add-to-cart interactions.',
        'Audit theme/app scripts, remove unused tags, and defer anything not needed for first render.',
        `${scriptCount} script tags were detected.`,
        'advanced'
      )
    );
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

async function runHeavyAnalysisTasks(html: string, normalizedUrl: string, fetchedUrl: string) {
  return Promise.all([
    CompetitorService.analyzeCompetitors(html, normalizedUrl).catch(err => {
      recordAnalyzerServiceFailure('competitor', err, true);
      return {
        competitors: [],
        marketPosition: 'niche' as const,
        confidence: 'low' as const,
        summary: 'Competitor analysis could not be completed for this URL.',
        evidence: ['Competitor service failed gracefully.'],
      };
    }),
    ScraperService.scrape(fetchedUrl).catch(err => {
      recordAnalyzerServiceFailure('puppeteer', err, true);
      return { visualAnalysis: null, productAnalysis: undefined };
    }),
    Promise.resolve(AIReadinessService.analyze(html)).catch(err => {
      recordAnalyzerServiceFailure('ai', err, true);
      return {
        score: 50,
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
      return {
        ...cached,
        meta: {
          usedLighthouse: cached.meta?.usedLighthouse ?? true,
          usedHtmlFallback: cached.meta?.usedHtmlFallback ?? false,
          visualAnalysisAttempted: cached.meta?.visualAnalysisAttempted ?? false,
          visualAnalysisAvailable:
            cached.meta?.visualAnalysisAvailable ?? Boolean(cached.visualAnalysis),
          productAnalysisAvailable:
            cached.meta?.productAnalysisAvailable ?? Boolean(cached.productAnalysis),
          competitorAnalysisAvailable:
            cached.meta?.competitorAnalysisAvailable ??
            Boolean(cached.competitorAnalysis?.competitors?.length),
          cached: true,
        },
      };
    }

    // 2. Start PageSpeed early; fetch HTML first so heavy tasks can overlap with Lighthouse
    const pageSpeedPromise = fetchPageSpeedData(normalizedUrl);
    let html = '';
    let fetchedUrl = normalizedUrl;
    let heavyTasksPromise: ReturnType<typeof runHeavyAnalysisTasks> | null = null;
    const visualAnalysisAttempted = ScraperService.isEnabled();

    try {
      const fetched = await safeFetchStoreHtml(normalizedUrl, 15000);
      html = fetched.html;
      fetchedUrl = fetched.finalUrl;
      heavyTasksPromise = runHeavyAnalysisTasks(html, normalizedUrl, fetchedUrl);
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
        bestPractices: analyzeBestPracticesFallback(fetchedUrl),
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
      runHeavyAnalysisTasks(html, normalizedUrl, fetchedUrl));

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
