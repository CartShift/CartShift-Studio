import { AIAnalysis, ScanScope } from '@/lib/types/analyzer';

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

function defaultScanScope(): ScanScope {
  return {
    scannedUrls: [],
    homepageScanned: true,
    productPagesScanned: false,
    productPageCountAttempted: 0,
    productPageCountSucceeded: 0,
    productSchemaCoverageStatus: 'not_scanned',
    productSchemaEvidence: [],
  };
}

export class AIReadinessService {
  static analyze(html: string, scanScope: ScanScope = defaultScanScope()): AIAnalysis {
    let score = 30;
    const evidence: string[] = [];
    const limitations: string[] = [];
    const structuredDataTypes = new Set<string>();
    let invalidJsonLdCount = 0;

    const jsonLdMatches = html.match(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    );

    if (jsonLdMatches) {
      score += 12;
      evidence.push(`${jsonLdMatches.length} JSON-LD block(s) found in scanned HTML.`);

      jsonLdMatches.forEach(match => {
        const jsonText = match
          .replace(/^[\s\S]*?>/, '')
          .replace(/<\/script>$/i, '')
          .trim();

        try {
          collectSchemaTypes(JSON.parse(jsonText), structuredDataTypes);
        } catch {
          invalidJsonLdCount += 1;
        }
      });

      const richTypes = ['Product', 'Organization', 'BreadcrumbList', 'FAQPage', 'WebSite'];
      const richTypeCount = richTypes.filter(type => structuredDataTypes.has(type)).length;
      score += richTypeCount * 4;
      if (richTypeCount > 0) {
        evidence.push(`Structured data types found: ${[...structuredDataTypes].join(', ')}.`);
      }
    } else {
      limitations.push('No JSON-LD structured data was found in the scanned HTML.');
    }

    if (invalidJsonLdCount > 0) {
      score -= Math.min(20, invalidJsonLdCount * 10);
      limitations.push(`${invalidJsonLdCount} JSON-LD block(s) could not be parsed.`);
    }

    const hasOG = /<meta[^>]+property=["']og:/i.test(html);
    const hasTwitter = /<meta[^>]+name=["']twitter:/i.test(html);
    const hasDescription = /<meta[^>]+name=["']description["'][^>]+content=["'][^"']{40,}/i.test(
      html
    );
    const canonicalUrlPresent = /<link[^>]+rel=["']canonical["'][^>]+href=["'][^"']+["']/i.test(
      html
    );
    const languageMetadataPresent = /<html[^>]+\blang=["'][^"']+["']/i.test(html);

    if (hasOG) score += 6;
    if (hasTwitter) score += 3;
    if (hasDescription) score += 6;
    if (canonicalUrlPresent) {
      score += 5;
      evidence.push('Canonical URL metadata is present.');
    } else {
      score -= 8;
      limitations.push('Canonical URL metadata was not found.');
    }

    if (languageMetadataPresent) {
      score += 5;
      evidence.push('Language metadata is present.');
    } else {
      score -= 8;
      limitations.push('Language metadata was not found.');
    }

    const plainText = stripHtml(html);
    const wordCount = plainText.split(/\s+/).filter(Boolean).length;
    const h1Count = (html.match(/<h1\b/gi) || []).length;
    const h2Count = (html.match(/<h2\b/gi) || []).length;
    const paragraphCount = (html.match(/<p\b/gi) || []).length;
    const listCount = (html.match(/<(ul|ol)\b/gi) || []).length;
    const hasFaqLanguage = /faq|שאלות נפוצות|shipping|returns|delivery|משלוח|החזרות/i.test(
      plainText
    );

    let readabilityScore = 30;
    if (h1Count === 1) readabilityScore += 12;
    if (h2Count >= 2) readabilityScore += 12;
    if (paragraphCount >= 4) readabilityScore += 12;
    if (listCount >= 1) readabilityScore += 7;
    if (wordCount >= 250) readabilityScore += 10;
    if (wordCount < 120) {
      score -= 12;
      limitations.push('Visible static content appears sparse.');
    }
    if (hasFaqLanguage) readabilityScore += 5;

    readabilityScore = Math.min(100, readabilityScore);
    score += Math.round((readabilityScore - 30) * 0.22);
    evidence.push(`${wordCount} visible word(s) found in static HTML.`);

    if (!scanScope.productPagesScanned) {
      score = Math.min(score, 78);
      limitations.push('Product pages were not scanned, so product data coverage is not fully verified.');
    } else if (scanScope.productSchemaCoverageStatus === 'missing') {
      score = Math.min(score - 12, 74);
      limitations.push('Sampled product pages were missing Product structured data.');
    } else if (scanScope.productSchemaCoverageStatus === 'partial') {
      score = Math.min(score - 8, 82);
      limitations.push('Sampled product pages had incomplete Product structured data.');
    } else if (scanScope.productSchemaCoverageStatus === 'invalid') {
      score = Math.min(score - 15, 70);
      limitations.push('Sampled product pages had invalid or malformed Product structured data.');
    } else if (scanScope.productSchemaCoverageStatus === 'present') {
      score += 8;
      evidence.push('Sampled product pages included semantically valid Product structured data.');
    }

    score = Math.min(96, Math.max(0, score));

    const confidence =
      invalidJsonLdCount > 0
        ? 'estimated'
        : scanScope.productPagesScanned
          ? 'verified'
          : 'insufficient_evidence';

    return {
      score: Math.round(score),
      label: 'Content & structured-data readiness',
      confidence,
      evidence,
      limitations,
      scannedScope: scanScope,
      structuredDataTypes: [...structuredDataTypes],
      openGraphTags: hasOG || hasTwitter,
      readabilityScore,
      aiReadinessStatus:
        score >= 82 && confidence === 'verified'
          ? 'ready'
          : score >= 55
            ? 'needs_improvement'
            : 'not_optimized',
      invalidJsonLdCount,
      canonicalUrlPresent,
      languageMetadataPresent,
      visibleWordCount: wordCount,
    };
  }
}
