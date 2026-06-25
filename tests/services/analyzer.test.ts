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
        'checkout-path-missing',
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
});
