import { Competitor, CompetitorAnalysis } from '@/lib/types/analyzer';

const CATEGORY_KEYWORDS: Record<string, { keywords: string[]; competitors: string[] }> = {
  fashion: {
    keywords: ['clothing', 'apparel', 'wear', 'fashion', 'boutique', 'dress', 'shirt', 'shoes'],
    competitors: ['asos.com', 'zara.com', 'hm.com', 'shein.com'],
  },
  electronics: {
    keywords: ['gadget', 'phone', 'computer', 'laptop', 'tech', 'electronics', 'device'],
    competitors: ['bestbuy.com', 'newegg.com', 'apple.com'],
  },
  beauty: {
    keywords: ['beauty', 'cosmetics', 'skin', 'makeup', 'care', 'wellness', 'fragrance'],
    competitors: ['sephora.com', 'ulta.com', 'glossier.com'],
  },
  home: {
    keywords: ['furniture', 'decor', 'home', 'living', 'kitchen', 'interior'],
    competitors: ['wayfair.com', 'ikea.com', 'westelm.com'],
  },
};

export class CompetitorService {
  static detectCategory(html: string): string | null {
    const lowerHtml = html.toLowerCase();

    let bestCategory = null;
    let maxMatches = 0;

    for (const [category, data] of Object.entries(CATEGORY_KEYWORDS)) {
      let matches = 0;
      for (const keyword of data.keywords) {
        // Simple occurrence count (capped at 5 per keyword to prevent skew)
        const count = (lowerHtml.match(new RegExp(keyword, 'g')) || []).length;
        if (count > 0) matches += Math.min(count, 5);
      }

      if (matches > maxMatches) {
        maxMatches = matches;
        bestCategory = category;
      }
    }

    return maxMatches > 3 ? bestCategory : null;
  }

  static async analyzeCompetitors(html: string, _mainUrl: string): Promise<CompetitorAnalysis> {
    const category = this.detectCategory(html);
    const competitors: Competitor[] = [];

    if (category) {
      const data = CATEGORY_KEYWORDS[category];
      // Pick top 3 random competitors from the list (simulated intelligence)
      const shuffled = [...data.competitors].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 3);

      selected.forEach(domain => {
        competitors.push({
          name: domain.split('.')[0], // simple name extraction
          url: `https://www.${domain}`,
          similarityScore: 85 + Math.floor(Math.random() * 10), // Simulated score
          overlapReasons: [
            `Both operate in the ${category} space`,
            'Similar audience demographics',
          ],
        });
      });

      return {
        competitors,
        marketPosition: 'challenger',
      };
    }

    // Default return if no category detected clearly
    return {
      competitors: [],
      marketPosition: 'niche',
    };
  }
}
