import { describe, expect, it } from 'vitest';
import { CompetitorService } from '@/lib/services/competitor-service';

describe('CompetitorService', () => {
  it('excludes messaging, schema standards, social, and payment URLs', async () => {
    const html = `<!doctype html>
      <html><body>
        <main>
          <h1>Hair extensions and beauty care</h1>
          <p>Compare our beauty products with other salon stores.</p>
          <a href="https://wa.me/123456">WhatsApp</a>
          <a href="https://gmpg.org/xfn/11">XFN</a>
          <a href="https://instagram.com/demo">Instagram</a>
          <a href="https://paypal.com/pay">PayPal</a>
        </main>
      </body></html>`;

    const result = await CompetitorService.analyzeCompetitors(html, 'https://store.example.com');

    expect(result.competitors).toEqual([]);
    expect(result.marketPosition).toBe('unknown');
    expect(CompetitorService.classifyDomain('wa.me')).toBe('messaging');
    expect(CompetitorService.classifyDomain('gmpg.org')).toBe('schema-standards');
    expect(CompetitorService.classifyDomain('instagram.com')).toBe('social');
    expect(CompetitorService.classifyDomain('paypal.com')).toBe('payment');
  });

  it('qualifies a genuine commerce domain in visible comparison content', async () => {
    const html = `<!doctype html>
      <html><body>
        <main>
          <section>
            <h2>Compare beauty boutiques</h2>
            <p>Our hair extensions, salon care, fragrance, and beauty bundles are often compared with other boutiques.</p>
            <a href="https://examplebeautystore.com/hair-extensions">Example Beauty Store hair extensions</a>
          </section>
        </main>
      </body></html>`;

    const result = await CompetitorService.analyzeCompetitors(html, 'https://store.example.com');

    expect(result.competitors).toHaveLength(1);
    expect(result.competitors[0].url).toBe('https://examplebeautystore.com');
    expect(result.competitors[0].visibleAnchorText?.[0]).toContain('Example Beauty Store');
    expect(result.competitors[0].commerceCategoryOverlap).toEqual(
      expect.arrayContaining(['hair', 'extensions', 'beauty'])
    );
    expect(result.competitors[0].confidenceScore).toBeGreaterThanOrEqual(70);
  });

  it('does not return candidates from footer/legal/JSON-LD-only links', async () => {
    const html = `<!doctype html>
      <html>
        <head>
          <script type="application/ld+json">
            {"@context":"https://schema.org","@type":"Organization","sameAs":["https://examplebeautystore.com"]}
          </script>
        </head>
        <body>
          <main>
            <h1>Hair extensions and beauty products</h1>
            <p>Salon-grade hair care and beauty accessories.</p>
          </main>
          <footer>
            <a href="https://examplebeautystore.com/legal">Legal reference</a>
          </footer>
        </body>
      </html>`;

    const result = await CompetitorService.analyzeCompetitors(html, 'https://store.example.com');

    expect(result.competitors).toEqual([]);
    expect(result.analysisConfidence).toBe('insufficient_evidence');
  });
});
