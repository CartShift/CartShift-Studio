import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import path from 'node:path';

const loadScript = createRequire(import.meta.url);
const {
  buildMarkdownReport,
  parseArgs,
  parseVitestSummary,
  validateAnalyzerResponse,
} = loadScript('../../scripts/test-analyzer.js');

const validResponse = {
  storeUrl: 'https://shop.example.com',
  overallScore: 78,
  platform: 'Shopify',
  generatedAt: '2026-06-25T00:00:00.000Z',
  meta: {
    usedLighthouse: true,
    usedHtmlFallback: false,
    visualAnalysisAttempted: true,
    visualAnalysisAvailable: true,
    productAnalysisAvailable: false,
    competitorAnalysisAvailable: true,
    cached: false,
    screenshotsInEmailReport: true,
  },
  sections: {
    performance: {
      name: 'Performance',
      score: 72,
      status: 'warning',
      findings: [],
      recommendations: [
        {
          title: 'Reduce JavaScript blocking time',
          impact: 'high',
          action: 'Defer non-critical scripts.',
          evidence: 'Total blocking time was high.',
        },
      ],
    },
    seo: {
      name: 'SEO',
      score: 82,
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
      score: 85,
      status: 'good',
      findings: [],
      recommendations: [],
    },
    cart: {
      name: 'Cart',
      score: 67,
      status: 'warning',
      findings: [],
      recommendations: [],
    },
    trust: {
      name: 'Trust',
      score: 70,
      status: 'warning',
      findings: [],
      recommendations: [],
    },
  },
  visualAnalysis: {
    screenshots: [],
    contrastIssues: 1,
    mobileResponsivenessScore: 83,
    dominantColors: ['#111111'],
  },
  aiAnalysis: {
    score: 76,
    structuredDataTypes: ['Product'],
    openGraphTags: true,
    readabilityScore: 70,
    aiReadinessStatus: 'needs_improvement',
  },
};

describe('scripts/test-analyzer.js', () => {
  it('parses default arguments for repeatable report generation', () => {
    const options = parseArgs([], {});

    expect(options.unit).toBe(true);
    expect(options.live).toBe(false);
    expect(options.markdownOutput).toBe(path.join('.test-results', 'analyzer', 'latest.md'));
    expect(options.jsonOutput).toBe(path.join('.test-results', 'analyzer', 'latest.json'));
  });

  it('parses vitest summary output', () => {
    const summary = parseVitestSummary(`
      Test Files  10 passed (10)
      Tests  47 passed (47)
    `);

    expect(summary.passedFiles).toBe(10);
    expect(summary.totalFiles).toBe(10);
    expect(summary.passedTests).toBe(47);
    expect(summary.totalTests).toBe(47);
  });

  it('validates analyzer API response shape and strips screenshot payload expectations', () => {
    const validation = validateAnalyzerResponse(validResponse);

    expect(validation.ok).toBe(true);
    expect(validation.highImpactCount).toBe(1);
    expect(validation.topRecommendations[0]).toMatchObject({
      sectionKey: 'performance',
      impact: 'high',
    });
  });

  it('fails response validation when required sections are missing', () => {
    const validation = validateAnalyzerResponse({
      ...validResponse,
      sections: {
        ...validResponse.sections,
        cart: undefined,
      },
    });

    expect(validation.ok).toBe(false);
    expect(validation.checks).toContainEqual(
      expect.objectContaining({
        name: 'cart section exists',
        pass: false,
      })
    );
  });

  it('renders a markdown report with commands and live checks', () => {
    const markdown = buildMarkdownReport({
      generatedAt: '2026-06-25T00:00:00.000Z',
      ok: true,
      options: {
        baseUrl: 'http://localhost:3000',
        storeUrl: 'https://shop.example.com',
      },
      unit: {
        ok: true,
        durationMs: 1000,
        command: 'pnpm exec vitest run tests/services/analyzer.test.ts',
        summary: {
          passedTests: 47,
          passedFiles: 10,
        },
      },
      live: {
        ok: true,
        durationMs: 2000,
        resultSummary: {
          storeUrl: 'https://shop.example.com',
          overallScore: 78,
        },
        validation: {
          recommendationCount: 1,
          checks: [
            {
              name: 'overallScore is 0-100',
              pass: true,
              details: 'overallScore=78',
            },
          ],
          topRecommendations: [
            {
              sectionKey: 'performance',
              impact: 'high',
              title: 'Reduce JavaScript blocking time',
            },
          ],
        },
      },
    });

    expect(markdown).toContain('# Store Analyzer Test Report');
    expect(markdown).toContain('| Live API | PASS |');
    expect(markdown).toContain('Reduce JavaScript blocking time');
  });
});
