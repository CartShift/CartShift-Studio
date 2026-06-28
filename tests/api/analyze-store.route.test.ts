import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { POST } from '@/app/api/analyze-store/route';
import { AnalyzerService } from '@/lib/services/analyzer';
import {
  deliverStoreAnalysisReport,
  resolveInitialEmailReportStatus,
} from '@/lib/services/analyzer-report-delivery';
import { enforceApiRateLimit } from '@/lib/utils/api-rate-limit';
import { verifyRecaptchaToken } from '@/lib/services/recaptcha-server';
import { validateStoreUrlForAnalysis } from '@/lib/utils/store-url';
import type { AnalysisResult } from '@/lib/types/analyzer';

const afterCallbacks: Array<() => void | Promise<void>> = [];

vi.mock('next/server', async () => {
  const actual = await vi.importActual<typeof import('next/server')>('next/server');
  return {
    ...actual,
    after: (callback: () => void | Promise<void>) => {
      afterCallbacks.push(callback);
    },
  };
});

vi.mock('@/lib/utils/api-rate-limit', () => ({
  enforceApiRateLimit: vi.fn(),
  rateLimitHeaders: vi.fn((max: number, remaining: number) => ({
    'X-RateLimit-Limit': max.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
  })),
}));

vi.mock('@/lib/services/analyzer', () => ({
  AnalyzerService: {
    analyzeStore: vi.fn(),
  },
}));

vi.mock('@/lib/services/analyzer-report-delivery', () => ({
  deliverStoreAnalysisReport: vi.fn(),
  resolveInitialEmailReportStatus: vi.fn(),
}));

vi.mock('@/lib/services/recaptcha-server', () => ({
  verifyRecaptchaToken: vi.fn(),
}));

vi.mock('@/lib/utils/store-url', () => ({
  validateStoreUrlForAnalysis: vi.fn(),
}));

vi.mock('@/lib/services/store-analysis-leads', () => ({
  captureStoreAnalysisLead: vi.fn(),
}));

import { captureStoreAnalysisLead } from '@/lib/services/store-analysis-leads';

function buildAnalysisResult(): AnalysisResult {
  return {
    storeUrl: 'https://shop.example.com',
    overallScore: 74,
    platform: 'Shopify',
    sections: {
      performance: {
        name: 'Performance',
        score: 70,
        status: 'warning',
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
        score: 75,
        status: 'good',
        findings: [],
        recommendations: [],
      },
      bestPractices: {
        name: 'Best Practices',
        score: 85,
        status: 'good',
        findings: [],
        recommendations: [],
      },
      cart: {
        name: 'Cart',
        score: 65,
        status: 'warning',
        findings: [],
        recommendations: [
          {
            title: 'Make delivery costs visible before checkout',
            impact: 'high',
          },
        ],
      },
      trust: {
        name: 'Trust',
        score: 68,
        status: 'warning',
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

function createAnalyzeRequest(body: unknown, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('http://localhost/api/analyze-store', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': '203.0.113.10',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/analyze-store', () => {
  const originalRecaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;

  beforeEach(() => {
    delete process.env.RECAPTCHA_SECRET_KEY;
    vi.mocked(enforceApiRateLimit).mockResolvedValue({
      result: {
        allowed: true,
        remaining: 4,
        resetAt: Date.now() + 60_000,
      },
      key: 'analyze-store:203.0.113.10',
    });
    vi.mocked(validateStoreUrlForAnalysis).mockResolvedValue({
      ok: true,
      normalizedUrl: 'https://shop.example.com',
    });
    vi.mocked(AnalyzerService.analyzeStore).mockResolvedValue(buildAnalysisResult());
    vi.mocked(deliverStoreAnalysisReport).mockResolvedValue('sent');
    vi.mocked(resolveInitialEmailReportStatus).mockReturnValue('pending');
    vi.mocked(captureStoreAnalysisLead).mockResolvedValue('captured');
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    if (originalRecaptchaSecret) {
      process.env.RECAPTCHA_SECRET_KEY = originalRecaptchaSecret;
    } else {
      delete process.env.RECAPTCHA_SECRET_KEY;
    }
    afterCallbacks.length = 0;
    vi.clearAllMocks();
  });

  async function flushAfterCallbacks() {
    const callbacks = afterCallbacks.splice(0, afterCallbacks.length);
    for (const callback of callbacks) {
      await callback();
    }
  }

  it('returns 429 when rate limited', async () => {
    vi.mocked(enforceApiRateLimit).mockResolvedValueOnce({
      response: NextResponse.json(
        { error: 'Too many analysis requests. Please wait a minute before trying again.' },
        {
          status: 429,
          headers: {
            'Retry-After': '30',
            'Content-Type': 'application/json',
          },
        }
      ),
    });

    const response = await POST(
      createAnalyzeRequest({
        storeUrl: 'https://shop.example.com',
        email: 'owner@example.com',
      })
    );

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBeTruthy();
  });

  it('returns 400 for invalid JSON', async () => {
    const request = new NextRequest('http://localhost/api/analyze-store', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '203.0.113.10',
      },
      body: '{not-json',
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('returns 400 for invalid payload', async () => {
    const response = await POST(
      createAnalyzeRequest({
        storeUrl: '',
        email: 'not-an-email',
      })
    );

    expect(response.status).toBe(400);
  });

  it('returns 400 when store URL validation fails', async () => {
    vi.mocked(validateStoreUrlForAnalysis).mockResolvedValueOnce({
      ok: false,
      error: 'Invalid store URL. Private or internal network addresses are not allowed.',
    });

    const response = await POST(
      createAnalyzeRequest({
        storeUrl: 'https://127.0.0.1',
        email: 'owner@example.com',
      })
    );

    expect(response.status).toBe(400);
  });

  it('requires captcha when RECAPTCHA_SECRET_KEY is configured', async () => {
    process.env.RECAPTCHA_SECRET_KEY = 'secret';

    const response = await POST(
      createAnalyzeRequest({
        storeUrl: 'https://shop.example.com',
        email: 'owner@example.com',
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: expect.stringMatching(/security verification/i),
    });
  });

  it('rejects invalid captcha tokens', async () => {
    process.env.RECAPTCHA_SECRET_KEY = 'secret';
    vi.mocked(verifyRecaptchaToken).mockResolvedValueOnce(false);

    const response = await POST(
      createAnalyzeRequest({
        storeUrl: 'https://shop.example.com',
        email: 'owner@example.com',
        captchaToken: 'bad-token',
      })
    );

    expect(response.status).toBe(400);
    expect(verifyRecaptchaToken).toHaveBeenCalledWith('bad-token', 'secret');
  });

  it('returns serialized analysis on success and queues PDF email delivery', async () => {
    const response = await POST(
      createAnalyzeRequest({
        storeUrl: 'https://shop.example.com',
        email: 'owner@example.com',
        subscribeNewsletter: true,
        locale: 'en',
      })
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.overallScore).toBe(74);
    expect(payload.meta.emailReportStatus).toBe('pending');
    expect(payload.meta.leadCaptureStatus).toBe('captured');
    expect(captureStoreAnalysisLead).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'owner@example.com',
        storeUrl: 'https://shop.example.com',
        focusArea: 'cart',
        focusScore: 65,
        primaryRecommendation: 'Make delivery costs visible before checkout',
      })
    );
    expect(deliverStoreAnalysisReport).not.toHaveBeenCalled();

    await flushAfterCallbacks();

    expect(deliverStoreAnalysisReport).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'owner@example.com',
        storeUrl: 'https://shop.example.com',
        subscribeNewsletter: true,
        skipLeadCapture: true,
      })
    );
  });

  it('maps analyzer failures to friendly 500 responses', async () => {
    vi.mocked(AnalyzerService.analyzeStore).mockRejectedValueOnce(
      new Error('Could not access store URL: HTTP 503')
    );

    const response = await POST(
      createAnalyzeRequest({
        storeUrl: 'https://shop.example.com',
        email: 'owner@example.com',
      })
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({
      error: expect.stringMatching(/could not access store url/i),
    });
  });

  it('returns 400 when client IP cannot be determined in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.mocked(enforceApiRateLimit).mockResolvedValueOnce({
      response: NextResponse.json(
        {
          error:
            'Could not verify your request origin. Please try again from a standard network connection.',
        },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      ),
    });

    const request = new NextRequest('http://localhost/api/analyze-store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeUrl: 'https://shop.example.com',
        email: 'owner@example.com',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
