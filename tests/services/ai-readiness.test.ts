import { describe, expect, it } from 'vitest';
import { AIReadinessService } from '@/lib/services/ai-readiness';

describe('AIReadinessService.analyze', () => {
  it('scores pages with structured data and Open Graph higher', () => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta property="og:title" content="Demo Store">
  <script type="application/ld+json">
    {"@context":"https://schema.org","@type":"Product","name":"Demo"}
  </script>
</head>
<body><h1>Demo Store</h1><p>Quality goods for shoppers everywhere.</p></body>
</html>`;

    const result = AIReadinessService.analyze(html);

    expect(result.score).toBeGreaterThan(50);
    expect(result.openGraphTags).toBe(true);
    expect(result.structuredDataTypes).toContain('Product');
  });

  it('flags sparse pages as needing improvement', () => {
    const result = AIReadinessService.analyze('<html><body></body></html>');

    expect(result.aiReadinessStatus).toBe('not_optimized');
    expect(result.structuredDataTypes).toEqual([]);
  });
});
