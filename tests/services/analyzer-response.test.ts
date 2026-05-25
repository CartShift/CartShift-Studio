import { describe, expect, it } from 'vitest';
import { serializeAnalysisForClient } from '@/lib/services/analyzer-response';
import type { AnalysisResult } from '@/lib/types/analyzer';

const baseMeta: AnalysisResult['meta'] = {
  usedLighthouse: true,
  usedHtmlFallback: false,
  visualAnalysisAttempted: true,
  visualAnalysisAvailable: true,
  productAnalysisAvailable: false,
  competitorAnalysisAvailable: false,
  cached: false,
};

function buildResult(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    storeUrl: 'https://example.com',
    overallScore: 72,
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
        score: 60,
        status: 'warning',
        findings: [],
        recommendations: [],
      },
      trust: {
        name: 'Trust',
        score: 65,
        status: 'warning',
        findings: [],
        recommendations: [],
      },
    },
    generatedAt: new Date().toISOString(),
    meta: baseMeta,
    ...overrides,
  };
}

describe('serializeAnalysisForClient', () => {
  it('strips screenshot payloads but keeps visual metrics', () => {
    const result = buildResult({
      visualAnalysis: {
        screenshots: [
          {
            url: 'data:image/jpeg;base64,abc',
            device: 'mobile',
            label: 'Mobile',
          },
        ],
        contrastIssues: 0,
        mobileResponsivenessScore: 88,
        dominantColors: ['#111111'],
      },
    });

    const serialized = serializeAnalysisForClient(result);
    expect(serialized.visualAnalysis?.screenshots).toEqual([]);
    expect(serialized.visualAnalysis?.mobileResponsivenessScore).toBe(88);
    expect(serialized.meta?.screenshotsInEmailReport).toBe(true);
  });
});
