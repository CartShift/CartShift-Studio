import { describe, expect, it } from 'vitest';
import {
  canPublishAuditInsight,
  determinePrimaryIssue,
  mapArticleToAnalyzerIntent,
} from '@/lib/analyzer/funnel';
import type { AnalysisResult } from '@/lib/types/analyzer';

function result(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  const section = (score: number) => ({
    name: '',
    score,
    status: 'warning' as const,
    findings: [],
    recommendations: [],
  });
  return {
    storeUrl: 'https://store.test',
    overallScore: 60,
    platform: 'shopify',
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
    sections: {
      performance: section(25),
      seo: section(80),
      accessibility: section(80),
      bestPractices: section(80),
      cart: section(80),
      trust: section(80),
    },
    ...overrides,
  };
}

describe('analyzer funnel domain', () => {
  it('prioritizes a dominant measured speed deficit', () => {
    expect(determinePrimaryIssue(result()).primaryIssue).toBe('speed');
  });
  it('uses general conversion when categories are tied', () => {
    const tied = result();
    Object.values(tied.sections).forEach(section => {
      section.score = 60;
    });
    expect(determinePrimaryIssue(tied).primaryIssue).toBe('general_conversion');
  });
  it('does not interpret an unsuccessful cart probe as a checkout defect', () => {
    const sample = result();
    Object.values(sample.sections).forEach(section => {
      section.score = 95;
    });
    sample.overallScore = 95;
    sample.deeperScan = {
      attempted: true,
      available: false,
      categoryPagesAttempted: 0,
      categoryPagesSucceeded: 0,
      productPagesAttempted: 0,
      productPagesSucceeded: 0,
      cartInteractionAttempted: true,
      cartInteractionSucceeded: false,
      categorySamples: [],
      productSamples: [],
      confidence: 'insufficient_evidence',
      limitations: [],
      cartInteraction: {
        attempted: true,
        addToCartClicked: false,
        cartCountChanged: false,
        cartDrawerOrPageDetected: false,
        checkoutLinkDetected: false,
        error: 'Browser click failed',
        evidence: [],
      },
    };
    const decision = determinePrimaryIssue(sample);
    expect(decision.scores.checkout).toBe(5);
    expect(decision.primaryIssue).not.toBe('checkout');
  });

  it('maps blog metadata and honors overrides', () => {
    expect(mapArticleToAnalyzerIntent({ category: 'Performance', title: 'Core Web Vitals' })).toBe(
      'speed'
    );
    expect(mapArticleToAnalyzerIntent({ analyzerIntent: 'checkout', category: 'SEO' })).toBe(
      'checkout'
    );
  });
  it('never publishes without the matching explicit consent', () => {
    expect(canPublishAuditInsight({ reviewVisibility: 'anonymous_educational' })).toBe(false);
    expect(
      canPublishAuditInsight({
        reviewVisibility: 'anonymous_educational',
        anonymousInsightConsent: true,
      })
    ).toBe(true);
    expect(
      canPublishAuditInsight({
        reviewVisibility: 'approved_public_case_study',
        anonymousInsightConsent: true,
      })
    ).toBe(false);
    expect(
      canPublishAuditInsight({
        reviewVisibility: 'approved_public_case_study',
        anonymousInsightConsent: true,
        namedStoreConsent: true,
      })
    ).toBe(true);
  });
});
