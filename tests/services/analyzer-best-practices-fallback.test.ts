import { describe, expect, it } from 'vitest';
import { analyzeBestPracticesFallback } from '@/lib/services/analyzer-best-practices-fallback';

describe('analyzeBestPracticesFallback', () => {
  it('rewards HTTPS storefronts', () => {
    const result = analyzeBestPracticesFallback('https://shop.example.com');

    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.findings.some(finding => finding.title === 'HTTPS enabled')).toBe(true);
    expect(result.recommendations).toHaveLength(0);
  });

  it('flags non-HTTPS storefronts', () => {
    const result = analyzeBestPracticesFallback('http://shop.example.com');

    expect(result.score).toBeLessThan(70);
    expect(result.findings.some(finding => finding.title === 'HTTPS not detected')).toBe(true);
    expect(result.recommendations.some(rec => rec.code === 'is-on-https')).toBe(true);
  });
});
