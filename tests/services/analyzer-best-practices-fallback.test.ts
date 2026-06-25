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

  it('flags mixed content and insecure form actions when fallback HTML is available', () => {
    const result = analyzeBestPracticesFallback(
      'https://shop.example.com',
      `
      <html>
        <body>
          <img src="http://cdn.example.com/product.jpg" alt="Product">
          <form action="http://payments.example.com/checkout">
            <input name="email">
          </form>
        </body>
      </html>`
    );

    expect(result.score).toBeLessThan(75);
    expect(result.recommendations.map(rec => rec.code)).toEqual(
      expect.arrayContaining(['mixed-content', 'insecure-form-action'])
    );
    expect(result.recommendations.every(rec => rec.evidence)).toBe(true);
  });
});
