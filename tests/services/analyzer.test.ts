import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockCacheGet, mockCacheSet, mockSafeFetch, mockScrape } = vi.hoisted(() => ({
  mockCacheGet: vi.fn(),
  mockCacheSet: vi.fn(),
  mockSafeFetch: vi.fn(),
  mockScrape: vi.fn(),
}));

vi.mock('@/lib/services/cache-service', () => ({
  CacheService: {
    get: mockCacheGet,
    set: mockCacheSet,
    del: vi.fn(),
  },
}));

vi.mock('@/lib/utils/safe-store-fetch', () => ({
  safeFetchStoreHtml: mockSafeFetch,
}));

vi.mock('@/lib/services/scraper', () => ({
  ScraperService: {
    isEnabled: vi.fn(() => false),
    scrape: mockScrape,
  },
}));

vi.mock('@/lib/services/benchmark', () => ({
  BenchmarkService: {
    getBenchmarkComparison: vi.fn().mockResolvedValue(undefined),
    saveBenchmark: vi.fn().mockResolvedValue(undefined),
  },
}));

import { AnalyzerService } from '@/lib/services/analyzer';
import type { AnalysisResult } from '@/lib/types/analyzer';

const shopifyHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <title>Demo Store</title>
  <meta name="description" content="Quality products for everyone">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://cdn.shopify.com/s/files/theme.js"></script>
</head>
<body>
  <h1>Welcome</h1>
  <a href="/cart" class="cart-link">Cart</a>
  <button>Add to cart</button>
  <img src="/product.jpg" alt="Product photo" loading="lazy">
  <section>5 star reviews and customer ratings</section>
  <a href="/privacy-policy">Privacy policy</a>
  <span>Secure checkout with visa and paypal</span>
</body>
</html>`;

const sparseHtml = '<html><body><p>Hello</p></body></html>';

const weakCheckoutHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <title>Weak Store</title>
  <meta name="description" content="Products">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <h1>Catalog</h1>
  <a href="/collections/new">New arrivals</a>
  <button>Learn more</button>
  <p>Catalog-only content with no commerce assurances visible.</p>
</body>
</html>`;

const mayaHappyHairHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <title>Maya Happy Hair</title>
  <meta name="description" content="Maya Happy Hair sells salon-grade hair extensions and beauty care for confident everyday styling.">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="canonical" href="https://maya.example.com/">
  <script src="/wp-content/plugins/woocommerce/assets/js/frontend/cart-fragments.js"></script>
  ${Array.from({ length: 24 }, (_, i) => `<script src="/wp-content/themes/maya/script-${i}.js"></script>`).join('\n')}
  <script type="application/ld+json">
    {"@context":"https://schema.org","@type":"Organization","name":"Maya Happy Hair","url":"https://maya.example.com"}
  </script>
  <script type="application/ld+json">
    {"@context":"https://schema.org","@type":"WebSite","name":"Maya Happy Hair","url":"https://maya.example.com"}
  </script>
  <script type="application/ld+json">
    {"@context":"https://schema.org","@type":"WebPage","name":"Home"}
  </script>
  <script type="application/ld+json">
    {"@context":"https://schema.org","@type":"ImageObject","contentUrl":"https://maya.example.com/hero.jpg"}
  </script>
  <script type="application/ld+json">
    {"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[]}
  </script>
</head>
<body>
  <main>
    <h1>Maya Happy Hair</h1>
    <p>Premium hair extensions, beauty care, salon styling, and boutique hair accessories.</p>
    <a href="https://wa.me/972501234567">Message us on WhatsApp</a>
    <a href="https://gmpg.org/xfn/11">XFN profile</a>
    <a href="/cart">Cart</a>
  </main>
</body>
</html>`;

function buildPageSpeedPayload() {
  return {
    lighthouseResult: {
      categories: {
        performance: { score: 0.72 },
        seo: { score: 0.81 },
        accessibility: { score: 0.77 },
        'best-practices': { score: 0.88 },
      },
      audits: {
        'meta-description': {
          title: 'Document has a meta description',
          score: 1,
          scoreDisplayMode: 'binary',
        },
        'color-contrast': {
          title: 'Background and foreground colors do not have sufficient contrast ratio',
          score: 0.3,
          scoreDisplayMode: 'binary',
          displayValue: 'Low contrast text',
          description: 'Low contrast is difficult to read.',
        },
      },
    },
    loadingExperience: {
      metrics: {
        LARGEST_CONTENTFUL_PAINT_MS: { percentile: 2400, category: 'FAST' },
        CUMULATIVE_LAYOUT_SHIFT_SCORE: { percentile: 8, category: 'FAST' },
        FIRST_INPUT_DELAY_MS: { percentile: 45, category: 'FAST' },
      },
    },
  };
}

function buildClusteredLighthousePayload() {
  return {
    lighthouseResult: {
      categories: {
        performance: { score: 0.66 },
        seo: { score: 0.82 },
        accessibility: { score: 0.9 },
        'best-practices': { score: 0.92 },
      },
      audits: {
        'first-contentful-paint': {
          title: 'First Contentful Paint',
          score: 0.4,
          scoreDisplayMode: 'numeric',
          displayValue: '3.4 s',
          numericValue: 3400,
        },
        'largest-contentful-paint': {
          title: 'Largest Contentful Paint',
          score: 0.3,
          scoreDisplayMode: 'numeric',
          displayValue: '5.8 s',
          numericValue: 5800,
        },
        'speed-index': {
          title: 'Speed Index',
          score: 0.5,
          scoreDisplayMode: 'numeric',
          displayValue: '4.7 s',
          numericValue: 4700,
        },
        interactive: {
          title: 'Time to Interactive',
          score: 0.7,
          scoreDisplayMode: 'numeric',
          displayValue: '6.0 s',
          numericValue: 6000,
        },
        'total-blocking-time': {
          title: 'Total Blocking Time',
          score: 0.45,
          scoreDisplayMode: 'numeric',
          displayValue: '620 ms',
          numericValue: 620,
          details: {
            items: [{ url: 'https://shop.example.com/theme.js', total: 420 }],
          },
        },
        'mainthread-work-breakdown': {
          title: 'Main-thread work breakdown',
          score: 0.6,
          scoreDisplayMode: 'numeric',
          displayValue: '4.2 s',
          numericValue: 4200,
          details: {
            items: [{ group: 'scriptEvaluation', duration: 2400 }],
          },
        },
        'cumulative-layout-shift': {
          title: 'Cumulative Layout Shift',
          score: 1,
          scoreDisplayMode: 'numeric',
          displayValue: '0',
        },
        'server-response-time': {
          title: 'Initial server response time was short',
          score: 1,
          scoreDisplayMode: 'binary',
        },
      },
    },
  };
}

function buildCachedResult(): AnalysisResult {
  return {
    storeUrl: 'https://shop.example.com',
    overallScore: 80,
    platform: 'Shopify',
    sections: {
      performance: {
        name: 'Performance',
        score: 80,
        status: 'good',
        findings: [],
        recommendations: [],
      },
      seo: {
        name: 'SEO',
        score: 80,
        status: 'good',
        findings: [],
        recommendations: [],
      },
      accessibility: {
        name: 'Accessibility',
        score: 80,
        status: 'good',
        findings: [],
        recommendations: [],
      },
      bestPractices: {
        name: 'Best Practices',
        score: 80,
        status: 'good',
        findings: [],
        recommendations: [],
      },
      cart: {
        name: 'Cart',
        score: 80,
        status: 'good',
        findings: [],
        recommendations: [],
      },
      trust: {
        name: 'Trust',
        score: 80,
        status: 'good',
        findings: [],
        recommendations: [],
      },
    },
    generatedAt: new Date().toISOString(),
    meta: {
      usedLighthouse: true,
      usedHtmlFallback: false,
      visualAnalysisAttempted: false,
      visualAnalysisAvailable: false,
      productAnalysisAvailable: false,
      competitorAnalysisAvailable: false,
      cached: false,
    },
  };
}

describe('AnalyzerService.analyzeStore', () => {
  beforeEach(() => {
    mockCacheGet.mockResolvedValue(null);
    mockCacheSet.mockResolvedValue(undefined);
    mockSafeFetch.mockResolvedValue({
      html: shopifyHtml,
      finalUrl: 'https://shop.example.com',
    });
    mockScrape.mockResolvedValue({
      visualAnalysis: null,
      productAnalysis: undefined,
    });

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.includes('pagespeedonline')) {
          return new Response(JSON.stringify(buildPageSpeedPayload()), { status: 200 });
        }
        throw new Error(`Unexpected fetch URL: ${url}`);
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('returns cached analysis with cached meta flag', async () => {
    mockCacheGet.mockResolvedValueOnce(buildCachedResult());

    const result = await AnalyzerService.analyzeStore('https://shop.example.com');

    expect(result.meta?.cached).toBe(true);
    expect(mockSafeFetch).not.toHaveBeenCalled();
  });

  it('detects Shopify and uses Lighthouse section scores when PageSpeed succeeds', async () => {
    const result = await AnalyzerService.analyzeStore('https://shop.example.com');

    expect(result.platform).toBe('Shopify');
    expect(result.meta?.usedLighthouse).toBe(true);
    expect(result.meta?.usedHtmlFallback).toBe(false);
    expect(result.sections.performance.score).toBe(72);
    expect(result.sections.seo.score).toBeLessThanOrEqual(81);
    expect(result.sections.seo.score).toBeGreaterThan(50);
    expect(result.sections.accessibility.findings.some(f => f.type === 'issue')).toBe(true);
    expect(result.coreWebVitals?.lcp?.value).toBe(2400);
    expect(result.overallScore).toBeGreaterThan(0);
  });

  it('falls back to static HTML analysis when PageSpeed is unavailable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('quota exceeded', { status: 429 }))
    );
    mockSafeFetch.mockResolvedValueOnce({
      html: sparseHtml,
      finalUrl: 'https://sparse.example.com',
    });

    const result = await AnalyzerService.analyzeStore('https://sparse.example.com');

    expect(result.meta?.usedLighthouse).toBe(false);
    expect(result.meta?.usedHtmlFallback).toBe(true);
    expect(result.sections.seo.findings.some(f => f.title.includes('title'))).toBe(true);
    expect(result.sections.cart.findings.some(f => f.type === 'issue')).toBe(true);
    expect(result.sections.bestPractices.findings.some(f => f.title === 'HTTPS enabled')).toBe(
      true
    );
  });

  it('flags HTTP storefronts in fallback best practices scoring', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('quota exceeded', { status: 429 }))
    );
    mockSafeFetch.mockResolvedValueOnce({
      html: sparseHtml,
      finalUrl: 'http://insecure.example.com',
    });

    const result = await AnalyzerService.analyzeStore('http://insecure.example.com');

    expect(result.sections.bestPractices.findings.some(f => f.title === 'HTTPS not detected')).toBe(
      true
    );
  });

  it('maps fetch timeouts to a user-facing timeout error', async () => {
    const timeoutError = new Error('The operation was aborted');
    timeoutError.name = 'TimeoutError';
    mockSafeFetch.mockRejectedValueOnce(timeoutError);

    await expect(AnalyzerService.analyzeStore('https://slow.example.com')).rejects.toThrow(
      /timed out/i
    );
  });

  it('maps DNS failures to hostname resolution errors', async () => {
    const dnsError = new Error('getaddrinfo ENOTFOUND slow.example.com') as Error & {
      code?: string;
    };
    dnsError.code = 'ENOTFOUND';
    mockSafeFetch.mockRejectedValueOnce(dnsError);

    await expect(AnalyzerService.analyzeStore('https://slow.example.com')).rejects.toThrow(
      /resolve hostname/i
    );
  });

  it('continues when optional services fail', async () => {
    mockScrape.mockRejectedValueOnce(new Error('Puppeteer unavailable'));

    const result = await AnalyzerService.analyzeStore('https://shop.example.com');

    expect(result.meta?.visualAnalysisAvailable).toBe(false);
    expect(result.overallScore).toBeGreaterThan(0);
  });

  it('scores cart diagnostics from multiple checkout signals instead of one keyword', async () => {
    mockSafeFetch.mockResolvedValueOnce({
      html: weakCheckoutHtml,
      finalUrl: 'https://weak.example.com',
    });
    mockScrape.mockResolvedValueOnce({
      visualAnalysis: null,
      productAnalysis: {
        hasBuyButtonAboveFold: false,
        imageCount: 1,
        hasReviews: false,
        descriptionLength: 40,
        score: 50,
        cartActionabilityStatus: 'unknown',
      },
    });

    const result = await AnalyzerService.analyzeStore('https://weak.example.com');

    expect(result.sections.cart.score).toBeLessThanOrEqual(40);
    expect(result.sections.cart.recommendations.map(rec => rec.code)).toEqual(
      expect.arrayContaining([
        'cart-visible',
        'add-to-cart-missing',
        'checkout-flow-not-verified',
        'payment-cues-missing',
      ])
    );
    expect(result.sections.cart.recommendations.every(rec => rec.evidence)).toBe(true);
  });

  it('promotes mobile and contrast visual findings into prioritized recommendations', async () => {
    mockScrape.mockResolvedValueOnce({
      visualAnalysis: {
        screenshots: [],
        contrastIssues: 3,
        mobileResponsivenessScore: 62,
        dominantColors: ['#111111', '#ffffff'],
      },
      productAnalysis: undefined,
    });

    const result = await AnalyzerService.analyzeStore('https://shop.example.com');

    expect(result.sections.accessibility.recommendations.map(rec => rec.code)).toContain(
      'visual-contrast-audit'
    );
    expect(result.sections.performance.recommendations.map(rec => rec.code)).toContain(
      'mobile-layout-friction'
    );
  });

  it('promotes AI visibility gaps into SEO recommendations', async () => {
    mockSafeFetch.mockResolvedValueOnce({
      html: `<!DOCTYPE html>
      <html lang="en">
        <head>
          <title>Plain Store</title>
          <meta name="description" content="Quality products for everyday shoppers.">
        </head>
        <body>
          <h1>Plain Store</h1>
          <p>Shop products.</p>
          <a href="/cart">Cart</a>
          <button>Add to cart</button>
        </body>
      </html>`,
      finalUrl: 'https://plain.example.com',
    });

    const result = await AnalyzerService.analyzeStore('https://plain.example.com');

    expect(result.aiAnalysis?.aiReadinessStatus).not.toBe('ready');
    expect(result.sections.seo.recommendations.map(rec => rec.code)).toEqual(
      expect.arrayContaining([
        'ai-structured-data',
        'ai-social-metadata',
        'ai-content-clarity',
      ])
    );
    expect(result.sections.seo.recommendations.every(rec => rec.evidence)).toBe(true);
  });

  it('keeps the Maya Happy Hair homepage regression confidence-aware', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('quota exceeded', { status: 429 }))
    );
    mockSafeFetch.mockResolvedValueOnce({
      html: mayaHappyHairHtml,
      finalUrl: 'https://maya.example.com',
    });

    const result = await AnalyzerService.analyzeStore('https://maya.example.com');

    expect(result.competitorAnalysis?.competitors).toEqual([]);
    expect(result.competitorAnalysis?.marketPosition).toBe('unknown');
    expect(result.sections.seo.recommendations.map(rec => rec.code)).not.toContain(
      'ai-product-schema'
    );
    expect(result.scanScope?.productSchemaCoverageStatus).toBe('not_scanned');
    expect(result.scanScope?.productPagesScanned).toBe(false);

    const scriptFinding = result.sections.performance.findings.find(
      finding => finding.title === 'Many script references detected'
    );
    expect(scriptFinding?.confidence).toBe('estimated');
    expect(result.sections.performance.recommendations.find(rec => rec.code === 'script-count')?.impact).not.toBe(
      'high'
    );

    expect(result.aiAnalysis?.score).toBeLessThan(100);
    expect(result.aiAnalysis?.confidence).toBe('insufficient_evidence');
    expect(result.aiAnalysis?.limitations).toEqual(
      expect.arrayContaining([
        'Product pages were not scanned, so product data coverage is not fully verified.',
      ])
    );
    expect(
      Object.values(result.sections).flatMap(section =>
        section.recommendations.map(rec => rec.source)
      )
    ).toContain('static_html');
  });

  it('marks Lighthouse recommendations as measured lab data and clusters correlated performance metrics', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.includes('pagespeedonline')) {
          return new Response(JSON.stringify(buildClusteredLighthousePayload()), { status: 200 });
        }
        throw new Error(`Unexpected fetch URL: ${url}`);
      })
    );

    const result = await AnalyzerService.analyzeStore('https://shop.example.com');
    const perfRecs = result.sections.performance.recommendations;

    expect(perfRecs.map(rec => rec.code)).toEqual(
      expect.arrayContaining(['lighthouse-initial-page-load', 'lighthouse-js-execution'])
    );
    expect(perfRecs.map(rec => rec.code)).not.toEqual(
      expect.arrayContaining([
        'first-contentful-paint',
        'largest-contentful-paint',
        'speed-index',
        'interactive',
        'total-blocking-time',
        'mainthread-work-breakdown',
      ])
    );
    expect(perfRecs.every(rec => rec.source === 'lighthouse')).toBe(true);
    expect(perfRecs.every(rec => rec.confidence === 'measured')).toBe(true);
    expect(perfRecs.every(rec => rec.limitation?.startsWith('Lab measurement.'))).toBe(true);
    expect(perfRecs[0].scannedUrlScope).toEqual(['https://shop.example.com']);
  });

  it('rejects WooCommerce archive URLs and only counts confirmed product detail pages', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(buildPageSpeedPayload()), { status: 200 }))
    );
    mockSafeFetch.mockImplementation(async (url: string) => {
      if (url === 'https://woo.example.com') {
        return {
          finalUrl: 'https://woo.example.com',
          html: `<!doctype html>
          <html lang="en"><head><title>Woo</title>
          <meta name="description" content="Hair care and beauty products for shoppers.">
          <link rel="canonical" href="https://woo.example.com/">
          <script src="/wp-content/plugins/woocommerce/assets/js/frontend/cart-fragments.js"></script>
          </head><body>
            <h1>Woo Store</h1>
            <a href="/shop/">Shop archive</a>
            <a href="/product-category/hair/">Hair category</a>
            <a href="/product/confirmed/">Confirmed product</a>
          </body></html>`,
        };
      }
      if (url === 'https://woo.example.com/product/confirmed/') {
        return {
          finalUrl: 'https://woo.example.com/product/confirmed/',
          html: `<!doctype html>
          <html lang="en">
            <body class="single-product">
              <h1 class="product_title">Hair Serum</h1>
              <p class="price"><span class="woocommerce-Price-amount">$29</span></p>
              <form class="cart"><button name="add-to-cart" class="single_add_to_cart_button">Add to cart</button></form>
              <div itemscope itemtype="https://schema.org/Product">
                <span itemprop="name">Hair Serum</span>
                <img itemprop="image" src="/serum.jpg" alt="Hair Serum">
                <div itemprop="offers" itemscope itemtype="https://schema.org/Offer">
                  <meta itemprop="priceCurrency" content="USD">
                  <span itemprop="price">29.00</span>
                  <link itemprop="availability" href="https://schema.org/InStock">
                </div>
              </div>
              <script type="application/ld+json">{not valid json</script>
            </body>
          </html>`,
        };
      }
      throw new Error(`Unexpected URL ${url}`);
    });

    const result = await AnalyzerService.analyzeStore('https://woo.example.com');

    expect(result.scanScope?.productPageCountAttempted).toBe(1);
    expect(result.scanScope?.productPageCountSucceeded).toBe(1);
    expect(result.scanScope?.productSchemaCoverageStatus).toBe('not_verified');
    expect(result.scanScope?.productSchemaEvidence?.[0].microdataProductCount).toBeGreaterThan(0);
    expect(result.scanScope?.productSchemaEvidence?.[0].valid).toBe(true);
    expect(result.scanScope?.productSchemaEvidence?.[0].malformedJsonLdUnrelated).toBe(true);
    expect(result.sections.seo.recommendations.map(rec => rec.code)).not.toContain(
      'ai-product-schema'
    );
  });
});
