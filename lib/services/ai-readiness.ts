import { AIAnalysis } from '@/lib/types/analyzer';

export class AIReadinessService {
  static analyze(html: string): AIAnalysis {
    let score = 50;
    const structuredDataTypes: string[] = [];

    // 1. Structured Data Check (JSON-LD)
    const jsonLdMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi);
    if (jsonLdMatches) {
      score += 20;
      jsonLdMatches.forEach(match => {
        if (match.includes('"@type": "Product"')) structuredDataTypes.push('Product');
        if (match.includes('"@type": "Organization"')) structuredDataTypes.push('Organization');
        if (match.includes('"@type": "BreadcrumbList"')) structuredDataTypes.push('Breadcrumb');
        if (match.includes('"@type": "Article"')) structuredDataTypes.push('Article');
        if (match.includes('"@type": "FAQPage"')) structuredDataTypes.push('FAQ');
      });
      // Bonus points for rich snippets
      score += structuredDataTypes.length * 5;
    }

    // 2. Open Graph / Social Tags (AI models use these for context)
    const hasOG = /<meta property="og:/i.test(html);
    const hasTwitter = /<meta name="twitter:/i.test(html);
    let openGraphTagScore = 0;

    if (hasOG) {
      score += 10;
      openGraphTagScore++;
    }
    if (hasTwitter) {
      score += 5;
      openGraphTagScore++;
    }

    // 3. Content Readability (Simple Heuristic for NLP friendliness)
    // AI prefers clear H1-H2-H3 hierarchy and paragraph text
    // We check if H2s and H3s exist
    const hasH2 = /<h2/i.test(html);
    const hasH3 = /<h3/i.test(html);
    const hasParagraphs = (html.match(/<p/gi) || []).length > 5;

    let readabilityScore = 50;
    if (hasH2) readabilityScore += 10;
    if (hasH3) readabilityScore += 10;
    if (hasParagraphs) readabilityScore += 20;
    // Penalize excessive DOM size or clutter (simulated by script tag density handled elsewhere,
    // here we focus on text structure)

    score += (readabilityScore - 50) / 2; // Add weighted readability to local AI score

    // Cap score
    score = Math.min(100, Math.max(0, score));

    return {
      score: Math.round(score),
      structuredDataTypes: [...new Set(structuredDataTypes)], // dedup
      openGraphTags: openGraphTagScore > 0,
      readabilityScore,
      aiReadinessStatus:
        score >= 80 ? 'ready' : score >= 50 ? 'needs_improvement' : 'not_optimized',
    };
  }
}
