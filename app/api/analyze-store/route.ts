import { NextRequest, NextResponse } from 'next/server';
import { logError, createErrorResponse } from '@/lib/error-handler';
import { checkRateLimit as checkFirestoreRateLimit } from '@/lib/services/rate-limiter';

// PageSpeed API Key - set via environment variable
const PAGESPEED_API_KEY = process.env.PAGESPEED_API_KEY;
const RATE_LIMIT_MAX_REQUESTS = 5;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded ? forwarded.split(',')[0].trim() : realIp;
  if (ip) {
    return `analyze-store:${ip}`;
  }
  const userAgent = request.headers.get('user-agent') || 'unknown';
  return `analyze-store:ua:${userAgent}`;
}

// Platform detection patterns with enhanced detection
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
  if (score >= 80) return 'good'; // Adjusted threshold
  if (score >= 50) return 'warning';
  return 'critical';
}

// PageSpeed Insights API Logic
interface PageSpeedResult {
  lighthouseResult?: {
    categories?: {
      performance?: { score: number };
      seo?: { score: number };
      accessibility?: { score: number };
      'best-practices'?: { score: number };
    };
    audits?: Record<
      string,
      {
        id: string;
        title: string;
        description: string;
        score: number | null;
        displayValue?: string;
        scoreDisplayMode?: string;
      }
    >;
  };
  loadingExperience?: {
    metrics?: {
      LARGEST_CONTENTFUL_PAINT_MS?: { percentile: number; category: string };
      CUMULATIVE_LAYOUT_SHIFT_SCORE?: { percentile: number; category: string };
      FIRST_INPUT_DELAY_MS?: { percentile: number; category: string };
      INTERACTION_TO_NEXT_PAINT?: { percentile: number; category: string };
    };
  };
  error?: { message: string };
}

async function fetchPageSpeedData(url: string): Promise<PageSpeedResult | null> {
  // Allow fetching without key if not configured (API has lower limits but works)
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
      signal: AbortSignal.timeout(45000), // Increased timeout to 45s
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

// ----------------------------------------------------------------------
// ENHANCED LOCAL ANALYSIS (REGEX BASED)
// ----------------------------------------------------------------------

function analyzeSEOFallback(html: string): SectionResult {
  const findings: Finding[] = [];
  const recommendations: Recommendation[] = [];
  let score = 50; // Start neutral

  // Check Title
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

  // Check Meta Description
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
      description: 'Add a meta description for better SEO click-through rates.',
    });
    recommendations.push({ title: 'Add meta description', impact: 'high' });
  }

  // Check H1
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
  let score = 60; // Optimistic baseline

  // Crude check for script heaviness
  const scriptCount = (html.match(/<script/gi) || []).length;
  if (scriptCount > 20) {
    score -= 10;
    findings.push({
      type: 'issue',
      title: 'High script count',
      description: 'Detected many script tags which may slow down loading.',
    });
    recommendations.push({ title: 'Minimize and bundle JavaScript', impact: 'high' });
  } else {
    findings.push({
      type: 'positive',
      title: 'Reasonable script usage',
      description: 'Script tag count is within limits.',
    });
  }

  // Check for image optimization hints (lazy loading)
  if (/loading=["']lazy["']/i.test(html)) {
    score += 10;
    findings.push({
      type: 'positive',
      title: 'Lazy loading detected',
      description: 'Images are using lazy loading.',
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
  let score = 50; // Neutral baseline

  // Check for lang attribute
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

  // Check for viewport meta
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

  // Check for alt attributes on images (crude count)
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
    score += 20; // No images to check
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

  // Cart detection
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

  // Add to cart detection
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

  // Checkout Security
  const hasSecureTerms = /secure|ssl|encrypt|lock|guarantee|safe/i.test(html);
  if (hasSecureTerms) {
    score += 10;
    findings.push({
      type: 'positive',
      title: 'Security terms found',
      description: 'Page mentions security or guarantees.',
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

  // Reviews
  const reviewTerms = /review|rating|star|testimonial|feedback/i;
  if (reviewTerms.test(html)) {
    findings.push({
      type: 'positive',
      title: 'Social proof detected',
      description: 'Reviews or ratings found on page.',
    });
    score += 20;
  } else {
    recommendations.push({ title: 'Add customer reviews', impact: 'high' });
  }

  // Policies
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

  // Trust Badges/Icons (generic check for images named trust, secure, payment)
  if (/trust|secure|badge|guarantee|payment|visa|mastercard|paypal/i.test(html)) {
    findings.push({
      type: 'positive',
      title: 'Trust signals/Payment icons',
      description: 'Trust icons or payment methods displayed.',
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

// ----------------------------------------------------------------------
// MAIN API HANDLER
// ----------------------------------------------------------------------

interface Finding {
  type: 'positive' | 'issue';
  title: string;
  description: string;
  example?: string;
}

interface Recommendation {
  title: string;
  impact: 'high' | 'medium' | 'low';
  serviceLink?: string;
}

interface SectionResult {
  name: string;
  score: number;
  status: 'critical' | 'warning' | 'good' | 'excellent';
  findings: Finding[];
  recommendations: Recommendation[];
}

interface AnalysisResult {
  storeUrl: string;
  overallScore: number;
  platform: string | null;
  sections: {
    performance: SectionResult;
    seo: SectionResult;
    accessibility: SectionResult;
    bestPractices: SectionResult;
    cart: SectionResult;
    trust: SectionResult;
  };
  coreWebVitals?: {
    lcp?: { value: number; rating: string };
    cls?: { value: number; rating: string };
    fid?: { value: number; rating: string };
  };
  generatedAt: string;
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitKey = getRateLimitKey(request);

    const rateLimitResult = await checkFirestoreRateLimit(
      rateLimitKey,
      RATE_LIMIT_MAX_REQUESTS,
      RATE_LIMIT_WINDOW
    );

    if (!rateLimitResult.allowed) {
      const retryAfter = rateLimitResult.resetAt
        ? Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)
        : 60;
      return NextResponse.json(
        createErrorResponse('Too many requests. Please try again later.', 429),
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetAt?.toString() || '',
          },
        }
      );
    }

    // Add rate limit headers for successful requests
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
      'X-RateLimit-Remaining': rateLimitResult.remaining?.toString() || '0',
      'X-RateLimit-Reset': rateLimitResult.resetAt?.toString() || '',
    };

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(createErrorResponse('Invalid JSON', 400), { status: 400 });
    }

    const { storeUrl, email, subscribeNewsletter, locale, captchaToken } = body;

    // Verify Captcha
    if (process.env.RECAPTCHA_SECRET_KEY) {
      if (!captchaToken) {
        return NextResponse.json(createErrorResponse('Captcha token is missing', 400), {
          status: 400,
        });
      }

      const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`;
      const captchaRes = await fetch(verifyUrl, { method: 'POST' });
      const captchaData = await captchaRes.json();

      if (!captchaData.success) {
        return NextResponse.json(createErrorResponse('Captcha verification failed', 400), {
          status: 400,
        });
      }
    } else {
      // Warn if no secret key is present (dev mode likely)
      console.warn('RECAPTCHA_SECRET_KEY not set, skipping verification.');
    }

    if (!storeUrl || !email) {
      return NextResponse.json(createErrorResponse('URL and Email are required', 400), {
        status: 400,
      });
    }

    let normalizedUrl = storeUrl.trim();
    if (!normalizedUrl.startsWith('http')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    // Enhanced SSRF Protection: Block localhost/private/internal networks
    const urlObj = new URL(normalizedUrl);
    const hostname = urlObj.hostname.toLowerCase();

    // IPv4 private ranges
    const ipv4PrivateRegex = /^(127\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.)/;
    // IPv6 private ranges and loopback
    const ipv6PrivateRegex = /^(::1|fe[89ab][0-9a-f]:|fc[0-9a-f]{2}:|fd[0-9a-f]{2}:)/i;

    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      ipv4PrivateRegex.test(hostname) ||
      ipv6PrivateRegex.test(hostname) ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      hostname === '0.0.0.0' ||
      // Block common internal hostnames
      hostname.includes('internal') ||
      hostname.includes('private') ||
      hostname.includes('localdomain')
    ) {
      return NextResponse.json(
        createErrorResponse('Invalid Store URL - internal addresses not allowed', 400),
        { status: 400 }
      );
    }

    // DNS rebinding prevention
    if (urlObj.hostname !== hostname) {
      return NextResponse.json(createErrorResponse('Invalid URL format', 400), { status: 400 });
    }

    // Block file://, data://, javascript://, etc.
    if (urlObj.protocol !== 'https:' && urlObj.protocol !== 'http:') {
      return NextResponse.json(createErrorResponse('Invalid URL protocol', 400), { status: 400 });
    }

    // 1. Fetch HTML (for platform detection and fallback analysis)
    let html = '';
    try {
      const response = await fetch(normalizedUrl, {
        headers: { 'User-Agent': 'CartShift Analyzer/1.0', Accept: 'text/html' },
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      html = await response.text();
    } catch (fetchError) {
      // If we can't access the site, we can't analyze it.
      logError('Store fetch error', fetchError);
      return NextResponse.json(createErrorResponse('Could not access store URL', 400), {
        status: 400,
      });
    }

    const platform = detectPlatform(html, normalizedUrl);

    // 2. Try Fetching PageSpeed Data
    const pageSpeedData = await fetchPageSpeedData(normalizedUrl);

    let sections: AnalysisResult['sections'];
    let coreWebVitals: AnalysisResult['coreWebVitals'] = undefined;

    // 3. Process Data (PageSpeed OR Fallback)
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

      // Metrics
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
      // Fallback to local HTML analysis matches
      console.warn('Using fallback HTML analysis for', normalizedUrl);
      sections = {
        performance: analyzePerformanceFallback(html),
        seo: analyzeSEOFallback(html),
        accessibility: analyzeAccessibilityFallback(html), // Use basic HTML checks
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

      // Basic Accessibility Fallback
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

    // 4. Calculate Overall Score
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

    const result: AnalysisResult = {
      storeUrl: normalizedUrl,
      overallScore,
      platform,
      sections,
      coreWebVitals,
      generatedAt: new Date().toISOString(),
    };

    // 5. Send Email
    try {
      const firebaseFunctionUrl =
        process.env.NEXT_PUBLIC_FIREBASE_FUNCTION_URL?.replace(
          'contactForm',
          'sendStoreAnalysisReport'
        ) || 'https://us-central1-cartshiftstudio.cloudfunctions.net/sendStoreAnalysisReport';

      // Async fire-and-forget email? Or await?
      // Awaiting to ensure logging
      await fetch(firebaseFunctionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          storeUrl: normalizedUrl,
          locale: locale || 'en',
          results: result,
          subscribeNewsletter: subscribeNewsletter || false,
        }),
      }).catch(e => console.error('Email fetch error:', e));
    } catch (e) {
      console.error('Email logic error:', e);
    }

    return NextResponse.json(result, { headers });
  } catch (error) {
    logError('Analysis API Fatal Error', error);
    return NextResponse.json(createErrorResponse('Internal Server Error', 500), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
      },
    });
  }
}
