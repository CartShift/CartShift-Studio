import { describe, expect, it } from 'vitest';
import { buildAnalyzerLeadIntelligence } from '@/lib/analyzer/lead-intelligence';
import type { AnalysisResult, Recommendation, SectionResult } from '@/lib/types/analyzer';

const section = (score: number, recommendations: Recommendation[] = []): SectionResult => ({
  name: 'Test',
  score,
  status: 'warning',
  findings: [],
  recommendations,
});

function fixture(): AnalysisResult {
  return {
    storeUrl: 'https://example.com',
    overallScore: 65,
    platform: 'Shopify',
    sections: {
      performance: section(30, [{ title: 'Guess about scripts', impact: 'high', confidence: 'estimated' }]),
      seo: section(70, [{ title: 'Verified missing title', impact: 'medium', confidence: 'measured', source: 'lighthouse', evidence: 'Missing <title> tag on homepage' }]),
      accessibility: section(90),
      bestPractices: section(80),
      cart: section(60, [{ title: 'Could not verify cart', impact: 'high', confidence: 'unavailable' }]),
      trust: section(45),
    },
    scanScope: {
      homepageScanned: true,
      scannedUrls: ['https://example.com'],
      productPagesScanned: false,
      productPageCountAttempted: 0,
      productPageCountSucceeded: 0,
      productSchemaCoverageStatus: 'not_scanned',
    },
    generatedAt: '2026-10-14T00:00:00Z',
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

describe('analyzer lead intelligence', () => {
  it('prefers evidence-backed actions to low-confidence low scores', () => {
    const insight = buildAnalyzerLeadIntelligence(fixture(), 'seo');
    expect(insight.focusArea).toBe('seo');
    expect(insight.primaryRecommendation).toBe('Verified missing title');
    expect(insight.metadata.strongEvidenceFindings).toBe(1);
    expect(insight.metadata.topEvidence).toContain('Missing');
    expect(insight.metadata.reportPartial).toBe(false);
    expect(insight.metadata.followUpReadiness).toBe('evidence_ready');
  });

  it('does not present unverified findings as a verified opportunity', () => {
    const input = fixture();
    for (const key of Object.keys(input.sections) as Array<keyof typeof input.sections>) {
      input.sections[key].recommendations = [];
    }
    const insight = buildAnalyzerLeadIntelligence(input, 'general_conversion');
    expect(insight.focusArea).toBe('performance');
    expect(insight.primaryRecommendation).toBeUndefined();
    expect(insight.metadata.strongEvidenceFindings).toBe(0);
    expect(insight.metadata.followUpReadiness).toBe('needs_manual_validation');
  });

  it('clearly flags heuristic partial reports for the CRM', () => {
    const input = fixture();
    input.meta.usedLighthouse = false;
    input.meta.usedHtmlFallback = true;
    const insight = buildAnalyzerLeadIntelligence(input, 'speed');
    expect(insight.metadata.scanMethod).toBe('html_heuristics');
    expect(insight.metadata.reportPartial).toBe(true);
  });
});
