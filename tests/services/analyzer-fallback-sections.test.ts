import { describe, expect, it } from 'vitest';
import {
  analyzeSEOFallback, analyzePerformanceFallback,
  analyzeAccessibilityFallback, analyzeTrust,
} from '@/lib/services/analyzer-fallback-sections';
import { createRecommendation } from '@/lib/services/analyzer-recommendation';

describe('static analyzer fallback section boundaries', () => {
  it('recognizes evidenced page metadata and one static H1', () => {
    const html = '<html><head><title>Craft Goods</title>' +
      '<meta name="description" content="Quality handmade goods"></head>' +
      '<body><h1>Handmade Gifts</h1></body></html>';
    const section = analyzeSEOFallback(html);
    expect(section.score).toBe(100);
    expect(section.findings.filter(x => x.type === 'positive')).toHaveLength(3);
    expect(section.recommendations).toHaveLength(0);
  });

  it('reports missing metadata and H1 only as heuristic observations', () => {
    const section = analyzeSEOFallback('<html><body>Welcome</body></html>');
    expect(section.score).toBe(50);
    expect(section.recommendations.map(x => x.code)).toEqual(['document-title', 'meta-description', 'h1']);
    expect(section.recommendations[2].source).toBe('static_html');
  });

  it('never interprets script count as a measured runtime bottleneck', () => {
    const html = '<head>' + '<script src="https://example.com/a.js"></script>'.repeat(40) +
      '</head><body><img loading="lazy"></body>';
    const section = analyzePerformanceFallback(html);
    const risk = section.recommendations.find(x => x.code === 'script-count');
    expect(risk?.source).toBe('static_html');
    expect(risk?.confidence).toBe('estimated');
    expect(risk?.limitation).toContain('cannot verify');
  });

  it('reports missing language, viewport and alt without browser certainty', () => {
    const section = analyzeAccessibilityFallback('<html><body><img src="/p.jpg"></body></html>');
    expect(section.score).toBe(50);
    expect(section.recommendations.map(x => x.code)).toEqual(['html-lang', 'viewport', 'image-alt']);
  });

  it('tracks review, privacy and payment signals consistently', () => {
    const section = analyzeTrust('<html><body>Our reviews, privacy policy, secure payment</body></html>');
    expect(section.score).toBe(100);
    expect(section.recommendations).toHaveLength(0);
  });

  it('builds evidence-rich recommendations with stable defaults', () => {
    const item = createRecommendation('id', 'Title', 'high', 'Description', 'Action', 'Evidence');
    expect(item).toMatchObject({
      code: 'id', effort: 'medium', source: 'heuristic', confidence: 'estimated',
      serviceLink: '/contact', scannedUrlScope: [], exactEvidence: ['Evidence'],
    });
  });
});
