import { AIAnalysis } from '@/lib/types/analyzer';

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function collectSchemaTypes(value: unknown, types: Set<string>) {
  if (!value) return;

  if (Array.isArray(value)) {
    value.forEach(item => collectSchemaTypes(item, types));
    return;
  }

  if (typeof value !== 'object') return;

  const record = value as Record<string, unknown>;
  const type = record['@type'];

  if (typeof type === 'string') types.add(type);
  if (Array.isArray(type)) {
    type.forEach(item => {
      if (typeof item === 'string') types.add(item);
    });
  }

  if (record['@graph']) collectSchemaTypes(record['@graph'], types);
}

export class AIReadinessService {
  static analyze(html: string): AIAnalysis {
    let score = 35;
    const structuredDataTypes = new Set<string>();

    const jsonLdMatches = html.match(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    );

    if (jsonLdMatches) {
      score += 18;

      jsonLdMatches.forEach(match => {
        const jsonText = match
          .replace(/^[\s\S]*?>/, '')
          .replace(/<\/script>$/i, '')
          .trim();

        try {
          collectSchemaTypes(JSON.parse(jsonText), structuredDataTypes);
        } catch {
          ['Product', 'Organization', 'BreadcrumbList', 'Article', 'FAQPage', 'WebSite'].forEach(
            type => {
              if (new RegExp(`"@type"\\s*:\\s*"${type}"`, 'i').test(jsonText)) {
                structuredDataTypes.add(type);
              }
            }
          );
        }
      });

      const richTypes = ['Product', 'Organization', 'BreadcrumbList', 'FAQPage', 'WebSite'];
      score += richTypes.filter(type => structuredDataTypes.has(type)).length * 6;
    }

    const hasOG = /<meta[^>]+property=["']og:/i.test(html);
    const hasTwitter = /<meta[^>]+name=["']twitter:/i.test(html);
    const hasDescription = /<meta[^>]+name=["']description["'][^>]+content=["'][^"']{40,}/i.test(
      html
    );

    if (hasOG) score += 8;
    if (hasTwitter) score += 4;
    if (hasDescription) score += 8;

    const plainText = stripHtml(html);
    const wordCount = plainText.split(/\s+/).filter(Boolean).length;
    const h1Count = (html.match(/<h1\b/gi) || []).length;
    const h2Count = (html.match(/<h2\b/gi) || []).length;
    const paragraphCount = (html.match(/<p\b/gi) || []).length;
    const listCount = (html.match(/<(ul|ol)\b/gi) || []).length;
    const hasFaqLanguage = /faq|שאלות נפוצות|shipping|returns|delivery|משלוח|החזרות/i.test(
      plainText
    );

    let readabilityScore = 35;
    if (h1Count === 1) readabilityScore += 15;
    if (h2Count >= 2) readabilityScore += 15;
    if (paragraphCount >= 4) readabilityScore += 15;
    if (listCount >= 1) readabilityScore += 8;
    if (wordCount >= 250) readabilityScore += 7;
    if (hasFaqLanguage) readabilityScore += 5;

    readabilityScore = Math.min(100, readabilityScore);
    score += Math.round((readabilityScore - 35) * 0.25);

    score = Math.min(100, Math.max(0, score));

    return {
      score: Math.round(score),
      structuredDataTypes: [...structuredDataTypes],
      openGraphTags: hasOG || hasTwitter,
      readabilityScore,
      aiReadinessStatus:
        score >= 80 ? 'ready' : score >= 55 ? 'needs_improvement' : 'not_optimized',
    };
  }
}
