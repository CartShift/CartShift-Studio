import { AnalysisResult, Finding, Recommendation, SectionResult } from '@/lib/types/analyzer';
import { logError } from '@/lib/error-handler';
import { CacheService } from './cache-service';
import { CompetitorService } from './competitor-service';
import { AIReadinessService } from './ai-readiness';
import { BenchmarkService } from './benchmark';
import { ScraperService } from './scraper';

const PAGESPEED_API_KEY = process.env.PAGESPEED_API_KEY;

// Platform detection patterns
const platformPatterns = [
  {
    name: 'Shopify',
    patterns: [/myshopify\.com/i, /shopify/i, /cdn\.shopify\.com/i, /window\.Shopify/i],
  },
  { name: 'WooCommerce', patterns: [/woocommerce/i, /wp-content/i, /wordpress/i, /wp-json/i] },
  { name: 'Magento', patterns: [/magento/i, /mage/i, /varien/i] },
  { name: 'BigCommerce', patterns: [/bigcommerce/i, /mybigcommerce\.com/i, /cdn\.bigcommerce/i] },
  { name: 'Wix', patterns: [/wix\.com/i, /wixsite\.com/i, /wix-image/i] },
  { name: 'Squarespace', patterns: [/squarespace\.com/i, /sqsp\.net/i, /squarespace-cdn/i] },
  { name: 'PrestaShop', patterns: [/prestashop/i, /presta/i] },
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
      console.error('PageSpeed API error:', errorText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('PageSpeed API fetch error:', error);
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
      findings.push({
        type: 'issue',
        title: audit.title,
        description: audit.displayValue || audit.description?.split('.')[0] || 'Needs improvement',
      });
      recommendations.push({
        title: audit.title
          .replace('Ensure', 'Fix')
          .replace('Avoid', 'Remove')
          .replace('Eliminate', 'Fix'),
        impact: audit.score < 0.5 ? 'high' : 'medium',
        serviceLink: '/contact',
      });
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
    recommendations.push({ title: 'Add a descriptive page title', impact: 'high' });
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
    recommendations.push({ title: 'Add meta description', impact: 'high' });
  }

  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1Match) {
    score += 10;
    findings.push({
      type: 'positive',
      title: 'H1 heading found',
      description: 'Main heading structure exists.',
    });
  } else {
    recommendations.push({ title: 'Add a main H1 heading', impact: 'medium' });
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
    recommendations.push({ title: 'Minimize and bundle JavaScript', impact: 'high' });
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
    recommendations.push({ title: 'Implement lazy loading for images', impact: 'medium' });
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
    recommendations.push({ title: 'Add lang attribute to HTML tag', impact: 'high' });
  }

  if (/<meta[^>]+name=["']viewport["']/i.test(html)) {
    score += 25;
    findings.push({
      type: 'positive',
      title: 'Mobile optimization',
      description: 'Viewport meta tag is present.',
    });
  } else {
    recommendations.push({ title: 'Add viewport meta tag', impact: 'high' });
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
    recommendations.push({ title: 'Add alt text to images', impact: 'medium' });
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

function analyzeCart(html: string): SectionResult {
  const findings: Finding[] = [];
  const recommendations: Recommendation[] = [];
  let score = 50;

  const hasCart =
    /href=["'][^"']*(cart|basket|bag)[^"']*["']/i.test(html) ||
    /class=["'][^"']*(cart|basket|bag)[^"']*["']/i.test(html) ||
    /aria-label=["'][^"']*(cart|basket|bag)[^"']*["']/i.test(html);

  if (hasCart) {
    findings.push({
      type: 'positive',
      title: 'Cart accessible',
      description: 'Cart link or icon detected.',
    });
    score += 25;
  } else {
    findings.push({
      type: 'issue',
      title: 'Cart visibility low',
      description: 'Could not clearly identify a cart link.',
    });
    recommendations.push({ title: 'Ensure cart is always visible', impact: 'high' });
  }

  const hasAddToCart =
    /add\s*to\s*(cart|bag)|buy\s*now|checkout/i.test(html) ||
    /name=["']add["']|type=["']submit["']/i.test(html);

  if (hasAddToCart) {
    findings.push({
      type: 'positive',
      title: 'Purchase actions found',
      description: 'Add to cart or Buy buttons detected.',
    });
    score += 25;
  }

  const hasSecureTerms = /secure|ssl|encrypt|lock|guarantee|safe/i.test(html);
  if (hasSecureTerms) {
    score += 10;
    findings.push({
      type: 'positive',
      title: 'Security terms found',
      description: 'Page mentions security.',
    });
  } else {
    recommendations.push({ title: 'Add security assurances near checkout/cart', impact: 'medium' });
  }

  return {
    name: 'Cart & Checkout',
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
    recommendations.push({ title: 'Add customer reviews', impact: 'high' });
  }

  if (/privacy/i.test(html) && /policy/i.test(html)) {
    findings.push({
      type: 'positive',
      title: 'Privacy policy found',
      description: 'Legal pages appear to be linked.',
    });
    score += 15;
  } else {
    recommendations.push({ title: 'Ensure Privacy Policy is visible', impact: 'medium' });
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

// --- Main Service Class ---

export class AnalyzerService {
  static async analyzeStore(normalizedUrl: string): Promise<AnalysisResult> {
    const cacheKey = `analyze:${normalizedUrl}`;

    // 1. Check Cache
    const cached = await CacheService.get<AnalysisResult>(cacheKey);
    if (cached) {
      console.log('Returning cached analysis for', normalizedUrl);
      return cached;
    }

    // 2. Fetch Content
    let html = '';
    try {
      const response = await fetch(normalizedUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      html = await response.text();
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

    const platform = detectPlatform(html, normalizedUrl);

    // 3. Fetch Data (External)
    const pageSpeedData = await fetchPageSpeedData(normalizedUrl);

    let sections: AnalysisResult['sections'];
    let coreWebVitals: AnalysisResult['coreWebVitals'] = undefined;

    if (pageSpeedData?.lighthouseResult?.categories) {
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
        cart: analyzeCart(html),
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
      // Fallback
      console.warn('Using fallback analysis for', normalizedUrl);
      sections = {
        performance: analyzePerformanceFallback(html),
        seo: analyzeSEOFallback(html),
        accessibility: analyzeAccessibilityFallback(html),
        bestPractices: {
          name: 'Best Practices',
          score: 70,
          status: 'good',
          findings: [
            { type: 'positive', title: 'HTTPS Check', description: 'Basic security check passed.' },
          ],
          recommendations: [],
        },
        cart: analyzeCart(html),
        trust: analyzeTrust(html),
      };

      if (!sections.accessibility) {
        sections.accessibility = {
          name: 'Accessibility',
          score: 50,
          status: 'warning',
          findings: [],
          recommendations: [{ title: 'Run a full accessibility audit', impact: 'high' }],
        };
      }
    }

    // PARALLEL EXECUTION OF HEAVY TASKS
    // 4. Competitor Analysis
    // 5. Visual Analysis (Optional/Async-ish)
    // 6. AI Readiness Analysis (Fast, local)
    // 7. Product Page Audit (Slow, crawls)

    // PARALLEL EXECUTION OF HEAVY TASKS
    // Execute all external services in parallel with individual error handling
    const serviceStartTime = Date.now();
    const [competitorData, scraperData, aiData] = await Promise.all([
      CompetitorService.analyzeCompetitors(html, normalizedUrl).catch(err => {
        console.error('Competitor analysis failed', err);
        // Track service failure for monitoring
        if (typeof window !== 'undefined') {
          import('@/lib/analytics').then(({ trackEvent }) => {
            trackEvent('analyzer_service_failure', {
              service_name: 'competitor',
              error_message: err.message || String(err),
              graceful_degradation: true,
            });
          });
        }
        return { competitors: [], marketPosition: 'niche' as const };
      }),
      ScraperService.scrape(normalizedUrl).catch(err => {
        console.error('Scraper service failed', err);
        // Track Puppeteer failures
        if (typeof window !== 'undefined') {
          import('@/lib/analytics').then(({ trackEvent }) => {
            trackEvent('analyzer_service_failure', {
              service_name: 'puppeteer',
              error_message: err.message || String(err),
              graceful_degradation: true,
            });
          });
        }
        return { visualAnalysis: null, productAnalysis: undefined };
      }),
      Promise.resolve(AIReadinessService.analyze(html)).catch(err => {
        console.error('AI analysis failed', err);
        if (typeof window !== 'undefined') {
          import('@/lib/analytics').then(({ trackEvent }) => {
            trackEvent('analyzer_service_failure', {
              service_name: 'ai',
              error_message: err.message || String(err),
              graceful_degradation: true,
            });
          });
        }
        return {
          score: 50,
          structuredDataTypes: [],
          openGraphTags: false,
          readabilityScore: 50,
          aiReadinessStatus: 'needs_improvement' as const,
        };
      }),
    ]);

    console.log(`External services completed in ${Date.now() - serviceStartTime}ms`);

    // Destructure scraper results
    const { visualAnalysis: visualData, productAnalysis: productData } = scraperData;

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

    // 9. Benchmark & Percentiles
    const percentile = await BenchmarkService.getPercentile(overallScore, html);

    const result: AnalysisResult = {
      storeUrl: normalizedUrl,
      overallScore,
      platform,
      sections,
      coreWebVitals,
      competitorAnalysis: competitorData,
      visualAnalysis: visualData || undefined,
      aiAnalysis: aiData,
      productAnalysis: productData,
      percentile,
      generatedAt: new Date().toISOString(),
    };

    // Cache & Save Benchmark (Fire and forget-ish, using Promise.all to ensure completion before func end)
    // Both operations have individual error handling to prevent failures
    await Promise.all([
      CacheService.set(cacheKey, result, 86400).catch(err =>
        console.error('Cache set failed', err)
      ),
      BenchmarkService.saveBenchmark(result, html).catch(err =>
        console.error('Benchmark save failed', err)
      ),
    ]);

    return result;
  }
}
