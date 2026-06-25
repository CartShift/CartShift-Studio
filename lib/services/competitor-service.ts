import {
  Competitor,
  CompetitorAnalysis,
  DomainClassification,
} from '@/lib/types/analyzer';

const CATEGORY_KEYWORDS: Record<
  string,
  { label: string; keywords: string[]; referenceStores: string[] }
> = {
  fashion: {
    label: 'Fashion & Apparel',
    keywords: [
      'clothing',
      'apparel',
      'wear',
      'fashion',
      'boutique',
      'dress',
      'shirt',
      'shoes',
      'אופנה',
      'בגדים',
      'שמלה',
      'נעליים',
    ],
    referenceStores: ['asos.com', 'zara.com', 'hm.com'],
  },
  electronics: {
    label: 'Electronics & Devices',
    keywords: [
      'gadget',
      'phone',
      'computer',
      'laptop',
      'tech',
      'electronics',
      'device',
      'טלפון',
      'מחשב',
      'אלקטרוניקה',
      'גאדג',
    ],
    referenceStores: ['bestbuy.com', 'newegg.com', 'bhphotovideo.com'],
  },
  beauty: {
    label: 'Beauty & Wellness',
    keywords: [
      'beauty',
      'cosmetics',
      'skin',
      'makeup',
      'care',
      'wellness',
      'fragrance',
      'hair',
      'salon',
      'extensions',
      'טיפוח',
      'יופי',
      'קוסמטיקה',
      'בושם',
      'שיער',
    ],
    referenceStores: ['sephora.com', 'ulta.com', 'glossier.com'],
  },
  home: {
    label: 'Home & Living',
    keywords: [
      'furniture',
      'decor',
      'home',
      'living',
      'kitchen',
      'interior',
      'ריהוט',
      'בית',
      'מטבח',
      'עיצוב',
    ],
    referenceStores: ['wayfair.com', 'ikea.com', 'westelm.com'],
  },
};

const DOMAIN_CLASSIFICATION_RULES: Record<DomainClassification, string[]> = {
  social: [
    'facebook.com',
    'instagram.com',
    'tiktok.com',
    'youtube.com',
    'pinterest.com',
    'linkedin.com',
    'x.com',
    'twitter.com',
  ],
  messaging: ['wa.me', 'api.whatsapp.com', 'whatsapp.com'],
  analytics: [
    'google-analytics.com',
    'cloudflareinsights.com',
    'doubleclick.net',
    'googleusercontent.com',
  ],
  'tag-manager': ['googletagmanager.com'],
  'cdn-asset-host': [
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'jsdelivr.net',
    'unpkg.com',
    'cloudflare.com',
    'gravatar.com',
    'wp.com',
  ],
  'schema-standards': [
    'gmpg.org',
    'w3.org',
    'schema.org',
    'wordpress.org',
    'wordpress.com',
    'w.org',
  ],
  payment: ['paypal.com', 'stripe.com', 'apple.com', 'google.com'],
  shipping: ['ups.com', 'fedex.com', 'dhl.com', 'usps.com', 'shippo.com', 'shipstation.com'],
  'review-platform': ['trustpilot.com', 'judge.me', 'yotpo.com'],
  marketplace: ['amazon.com', 'etsy.com', 'ebay.com', 'walmart.com'],
  'affiliate-tracking': ['klaviyo.com', 'mailchimp.com', 'sendgrid.net', 'shareasale.com'],
  'external-editorial-reference': ['maps.google.com', 'recaptcha.net', 'hcaptcha.com'],
  'possible-commerce-domain': [],
};

const COMPARISON_TERMS =
  /\b(compare|comparison|versus|vs\.?|alternative|alternatives|similar to|competitor|competitors|other stores|also shop|featured in|stockists?)\b/i;
const FOOTER_OR_LEGAL_TERMS =
  /\b(privacy|terms|policy|refund|returns|shipping policy|accessibility|cookie|copyright|all rights reserved|legal)\b/i;
const HIDDEN_ATTRS = /\b(hidden|aria-hidden=["']true["']|display\s*:\s*none|visibility\s*:\s*hidden)\b/i;

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripNonVisibleHtml(html: string): string {
  return html
    .replace(/<head[\s\S]*?<\/head>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<template[\s\S]*?<\/template>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ');
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function domainFromUrl(value: string): string | null {
  try {
    return new URL(value).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

function nameFromDomain(domain: string): string {
  return domain
    .split('.')[0]
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

function domainMatches(domain: string, ruleDomain: string): boolean {
  return domain === ruleDomain || domain.endsWith(`.${ruleDomain}`);
}

export function classifyExternalDomain(domain: string): DomainClassification {
  const normalized = domain.replace(/^www\./, '').toLowerCase();

  for (const [classification, domains] of Object.entries(DOMAIN_CLASSIFICATION_RULES)) {
    if (classification === 'possible-commerce-domain') continue;
    if (domains.some(ruleDomain => domainMatches(normalized, ruleDomain))) {
      return classification as DomainClassification;
    }
  }

  return 'possible-commerce-domain';
}

function getCategorySignal(html: string) {
  const text = stripHtml(html).toLowerCase();
  let bestCategory: string | null = null;
  let maxMatches = 0;
  let matchedKeywords: string[] = [];

  for (const [category, data] of Object.entries(CATEGORY_KEYWORDS)) {
    let matches = 0;
    const categoryMatches: string[] = [];

    for (const keyword of data.keywords) {
      const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const count = (text.match(new RegExp(escapedKeyword, 'gi')) || []).length;

      if (count > 0) {
        matches += Math.min(count, 5);
        categoryMatches.push(keyword);
      }
    }

    if (matches > maxMatches) {
      maxMatches = matches;
      bestCategory = category;
      matchedKeywords = categoryMatches.slice(0, 6);
    }
  }

  const confidence: CompetitorAnalysis['confidence'] =
    maxMatches >= 12 ? 'high' : maxMatches >= 6 ? 'medium' : 'low';

  return {
    category: maxMatches >= 4 ? bestCategory : null,
    confidence,
    matchedKeywords,
    matchCount: maxMatches,
  };
}

interface ExternalLinkEvidence {
  url: string;
  domain: string;
  anchorText: string;
  context: string;
  sourcePageSection: string;
}

function normalizeText(value: string): string {
  return decodeHtml(stripHtml(value)).replace(/\s+/g, ' ').trim();
}

function sectionFromContext(context: string): string {
  const headingMatch = context.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i);
  if (headingMatch) return normalizeText(headingMatch[1]).slice(0, 80) || 'visible content';
  if (/<main\b/i.test(context)) return 'main content';
  if (/<article\b/i.test(context)) return 'article content';
  if (/<section\b/i.test(context)) return 'visible section';
  return 'visible content';
}

function extractVisibleExternalLinks(html: string, mainUrl: string): ExternalLinkEvidence[] {
  const mainDomain = domainFromUrl(mainUrl);
  const visibleHtml = stripNonVisibleHtml(html)
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ');
  const links: ExternalLinkEvidence[] = [];
  const anchorRegex = /<a\b([^>]*?)href=["'](https?:\/\/[^"']+)["']([^>]*)>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = anchorRegex.exec(visibleHtml)) !== null) {
    const attrs = `${match[1]} ${match[3]}`;
    const rawUrl = decodeHtml(match[2]);
    const domain = domainFromUrl(rawUrl);
    if (!domain || domain === mainDomain || HIDDEN_ATTRS.test(attrs)) continue;

    const anchorText = normalizeText(match[4]);
    if (!anchorText) continue;

    const contextStart = Math.max(0, match.index - 800);
    const contextEnd = Math.min(visibleHtml.length, anchorRegex.lastIndex + 800);
    const contextHtml = visibleHtml.slice(contextStart, contextEnd);
    const context = normalizeText(contextHtml);
    if (FOOTER_OR_LEGAL_TERMS.test(context) && !COMPARISON_TERMS.test(context)) continue;

    links.push({
      url: rawUrl,
      domain,
      anchorText,
      context,
      sourcePageSection: sectionFromContext(contextHtml),
    });
  }

  return links;
}

function categoryOverlapForLink(
  link: ExternalLinkEvidence,
  category: string | null,
  matchedKeywords: string[]
): string[] {
  if (!category) return [];

  const text = `${link.anchorText} ${link.context} ${link.domain}`.toLowerCase();
  const categoryKeywords = CATEGORY_KEYWORDS[category].keywords;
  const overlaps = categoryKeywords.filter(keyword => text.includes(keyword.toLowerCase()));

  return [...new Set([...overlaps, ...matchedKeywords.filter(keyword => text.includes(keyword))])].slice(
    0,
    6
  );
}

function confidenceLabel(score: number): Competitor['confidence'] {
  if (score >= 82) return 'high';
  if (score >= 70) return 'medium';
  return 'low';
}

function scoreCompetitorCandidate(
  link: ExternalLinkEvidence,
  overlap: string[]
): { score: number; factors: string[] } {
  let score = 0;
  const factors: string[] = [];

  score += 35;
  factors.push('domain classified as possible commerce domain');

  score += 20;
  factors.push('link appears in visible user-facing content');

  if (overlap.length > 0) {
    score += Math.min(25, 14 + overlap.length * 3);
    factors.push(`commerce/category overlap: ${overlap.join(', ')}`);
  }

  if (COMPARISON_TERMS.test(`${link.anchorText} ${link.context}`)) {
    score += 18;
    factors.push('comparison or alternative-shopping context');
  }

  if (/\b(shop|store|collection|product|buy|boutique)\b/i.test(`${link.anchorText} ${link.domain}`)) {
    score += 5;
    factors.push('commerce language in anchor or domain');
  }

  return { score: Math.min(100, score), factors };
}

export class CompetitorService {
  static detectCategory(html: string): string | null {
    return getCategorySignal(html).category;
  }

  static classifyDomain(domain: string): DomainClassification {
    return classifyExternalDomain(domain);
  }

  static async analyzeCompetitors(html: string, mainUrl: string): Promise<CompetitorAnalysis> {
    const categorySignal = getCategorySignal(html);
    const category = categorySignal.category || undefined;
    const categoryLabel = category ? CATEGORY_KEYWORDS[category].label : undefined;
    const links = extractVisibleExternalLinks(html, mainUrl);
    const candidatesByDomain = new Map<string, Competitor>();

    for (const link of links) {
      const domainClassification = classifyExternalDomain(link.domain);
      if (domainClassification !== 'possible-commerce-domain') continue;

      const overlap = categoryOverlapForLink(
        link,
        categorySignal.category,
        categorySignal.matchedKeywords
      );
      if (overlap.length === 0) continue;

      const { score, factors } = scoreCompetitorCandidate(link, overlap);
      // 70 is the documented minimum: visible commerce domain + category overlap is not enough
      // unless comparison/shopping context or multiple evidence factors also agree.
      if (score < 70) continue;

      const existing = candidatesByDomain.get(link.domain);
      if (existing && (existing.confidenceScore ?? 0) >= score) continue;

      candidatesByDomain.set(link.domain, {
        name: nameFromDomain(link.domain),
        url: `https://${link.domain}`,
        similarityScore: score,
        confidence: confidenceLabel(score),
        source: 'detected-link',
        overlapReasons: [
          `Visible anchor text: "${link.anchorText}"`,
          `Source section: ${link.sourcePageSection}`,
          categoryLabel
            ? `Shared category evidence: ${categoryLabel.toLowerCase()} (${overlap.join(', ')})`
            : 'Shared category evidence was limited.',
        ],
        domainClassification,
        visibleAnchorText: [link.anchorText],
        sourcePageSection: link.sourcePageSection,
        commerceCategoryOverlap: overlap,
        confidenceScore: score,
        confidenceFactors: factors,
      });
    }

    const competitors = [...candidatesByDomain.values()]
      .sort((a, b) => (b.confidenceScore ?? 0) - (a.confidenceScore ?? 0))
      .slice(0, 3);

    const evidence = [
      ...(categoryLabel
        ? [`Detected category: ${categoryLabel}`]
        : ['No strong category detected']),
      ...(categorySignal.matchedKeywords.length
        ? [`Matched terms: ${categorySignal.matchedKeywords.join(', ')}`]
        : []),
      competitors.length
        ? `${competitors.length} evidence-backed possible competitor${competitors.length === 1 ? '' : 's'} found`
        : 'No direct competitors could be identified confidently from the scanned page.',
    ];

    return {
      competitors,
      marketPosition: competitors.length > 0 && categorySignal.confidence !== 'low' ? 'niche' : 'unknown',
      category,
      confidence:
        competitors.length === 0
          ? 'low'
          : competitors.some(item => item.confidence === 'high')
            ? 'medium'
            : 'low',
      summary: competitors.length
        ? 'Possible competitors are based on visible comparison or shopping context plus shared category evidence.'
        : 'No direct competitors could be identified confidently from the scanned page.',
      evidence,
      note:
        competitors.length === 0
          ? 'The analyzer suppressed external links that looked like messaging, standards, payment, social, tracking, or other non-competitor domains.'
          : undefined,
      source: 'static_html',
      analysisConfidence: competitors.length > 0 ? 'estimated' : 'insufficient_evidence',
      scannedUrlScope: [mainUrl],
      limitations: [
        'Competitor detection uses visible scanned-page evidence only; it does not crawl the open web.',
      ],
    };
  }
}
