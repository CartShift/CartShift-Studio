import { Competitor, CompetitorAnalysis } from '@/lib/types/analyzer';

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
      'טיפוח',
      'יופי',
      'קוסמטיקה',
      'בושם',
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

const EXCLUDED_EXTERNAL_DOMAINS = [
  'facebook.com',
  'instagram.com',
  'twitter.com',
  'x.com',
  'tiktok.com',
  'youtube.com',
  'linkedin.com',
  'pinterest.com',
  'whatsapp.com',
  'google.com',
  'googletagmanager.com',
  'google-analytics.com',
  'paypal.com',
  'stripe.com',
  'shopify.com',
  'woocommerce.com',
  'wordpress.org',
  'w.org',
  'cloudflare.com',
  'doubleclick.net',
  'schema.org',
];

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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

function extractExternalDomains(html: string, mainUrl: string): string[] {
  const mainDomain = domainFromUrl(mainUrl);
  const domains = new Map<string, number>();
  const hrefRegex = /href=["'](https?:\/\/[^"']+)["']/gi;
  let match: RegExpExecArray | null;

  while ((match = hrefRegex.exec(html)) !== null) {
    const domain = domainFromUrl(match[1]);
    if (!domain || domain === mainDomain) continue;
    if (
      EXCLUDED_EXTERNAL_DOMAINS.some(
        excluded => domain === excluded || domain.endsWith(`.${excluded}`)
      )
    ) {
      continue;
    }

    domains.set(domain, (domains.get(domain) || 0) + 1);
  }

  return [...domains.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([domain]) => domain);
}

export class CompetitorService {
  static detectCategory(html: string): string | null {
    return getCategorySignal(html).category;
  }

  static async analyzeCompetitors(html: string, mainUrl: string): Promise<CompetitorAnalysis> {
    const categorySignal = getCategorySignal(html);
    const category = categorySignal.category || undefined;
    const categoryLabel = category ? CATEGORY_KEYWORDS[category].label : undefined;
    const externalDomains = extractExternalDomains(html, mainUrl);

    const competitors: Competitor[] = externalDomains.map((domain, index) => ({
      name: nameFromDomain(domain),
      url: `https://${domain}`,
      similarityScore: Math.max(45, 72 - index * 7),
      confidence: categorySignal.confidence === 'high' ? 'medium' : 'low',
      source: 'detected-link',
      overlapReasons: [
        'This domain is referenced directly from the analyzed store.',
        categoryLabel
          ? `The page also shows ${categoryLabel.toLowerCase()} category signals.`
          : 'No strong product category signal was available.',
      ],
    }));

    const marketPosition =
      competitors.length >= 2 && categorySignal.confidence !== 'low'
        ? 'challenger'
        : categorySignal.confidence === 'high'
          ? 'niche'
          : 'niche';

    const evidence = [
      ...(categoryLabel
        ? [`Detected category: ${categoryLabel}`]
        : ['No strong category detected']),
      ...(categorySignal.matchedKeywords.length
        ? [`Matched terms: ${categorySignal.matchedKeywords.join(', ')}`]
        : []),
      competitors.length
        ? `${competitors.length} relevant external reference${competitors.length === 1 ? '' : 's'} found`
        : 'No direct competitors were identified from homepage links',
    ];

    return {
      competitors,
      marketPosition,
      category,
      confidence: competitors.length > 0 ? categorySignal.confidence : 'low',
      summary: competitors.length
        ? 'Competitor candidates are based on real domains referenced by the analyzed page.'
        : 'The analyzer found category signals, but not enough evidence to name direct competitors confidently.',
      evidence,
      note:
        competitors.length === 0 && category
          ? `Use this as a ${categoryLabel} benchmark, not a definitive competitor list.`
          : undefined,
    };
  }
}
