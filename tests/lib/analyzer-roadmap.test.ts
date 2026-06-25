import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import type { ExtendedRecommendation } from '@/lib/analyzer/roadmap';

const require = createRequire(import.meta.url);
const {
  buildPriorityRecommendations,
  buildRoadmapWeeks,
  countHighImpact,
  flattenRecommendations,
  getRecommendationKey,
} = require('../../lib/analyzer/roadmap.js');

const sampleSections = {
  performance: {
    name: 'Performance',
    score: 55,
    status: 'warning',
    findings: [],
    recommendations: [
      {
        code: 'reduce_js',
        title: 'Reduce JavaScript',
        impact: 'high',
        effort: 'advanced',
      },
      {
        code: 'defer_scripts',
        title: 'Defer non-critical scripts',
        impact: 'medium',
        effort: 'quick',
      },
    ],
  },
  seo: {
    name: 'SEO',
    score: 70,
    status: 'warning',
    findings: [],
    recommendations: [
      {
        code: 'meta_description',
        title: 'Add meta description',
        impact: 'high',
        effort: 'quick',
      },
    ],
  },
  accessibility: {
    name: 'Accessibility',
    score: 80,
    status: 'good',
    findings: [],
    recommendations: [
      {
        title: 'Duplicate title in section',
        impact: 'medium',
        effort: 'medium',
      },
      {
        title: 'Duplicate title in section',
        description: 'Different action',
        impact: 'low',
        effort: 'medium',
      },
    ],
  },
  bestPractices: {
    name: 'Best Practices',
    score: 90,
    status: 'excellent',
    findings: [],
    recommendations: [],
  },
  cart: {
    name: 'Cart',
    score: 60,
    status: 'warning',
    findings: [],
    recommendations: [
      {
        code: 'guest_checkout',
        title: 'Enable guest checkout',
        impact: 'high',
        effort: 'medium',
      },
    ],
  },
  trust: {
    name: 'Trust',
    score: 75,
    status: 'warning',
    findings: [],
    recommendations: [
      {
        code: 'policy_links',
        title: 'Surface policy links',
        impact: 'medium',
        effort: 'quick',
      },
    ],
  },
};

describe('analyzer roadmap', () => {
  it('deduplicates recommendations without codes using title and description', () => {
    const recs = flattenRecommendations(sampleSections) as ExtendedRecommendation[];
    const keys = recs.map((rec: ExtendedRecommendation) => getRecommendationKey(rec));

    expect(new Set(keys).size).toBe(keys.length);
  });

  it('prioritizes high-impact recommendations before medium backfill', () => {
    const recs = flattenRecommendations(sampleSections) as ExtendedRecommendation[];
    const priority = buildPriorityRecommendations(recs, 3);

    expect(priority).toHaveLength(3);
    expect(priority.filter((rec: ExtendedRecommendation) => rec.impact === 'high')).toHaveLength(3);
  });

  it('orders priority cards by impact and fastest useful fix first', () => {
    const recs = flattenRecommendations(sampleSections) as ExtendedRecommendation[];
    const priority = buildPriorityRecommendations(recs, 3);

    expect(priority.map((rec: ExtendedRecommendation) => rec.code)).toEqual([
      'meta_description',
      'guest_checkout',
      'reduce_js',
    ]);
  });

  it('counts high-impact issues separately from display cards', () => {
    const recs = flattenRecommendations(sampleSections) as ExtendedRecommendation[];

    expect(countHighImpact(recs)).toBe(3);
    expect(
      buildPriorityRecommendations(recs, 3).every(
        (rec: ExtendedRecommendation) => rec.impact === 'high'
      )
    ).toBe(true);
  });

  it('builds section-aware roadmap weeks without duplicate items', () => {
    const recs = flattenRecommendations(sampleSections, (key: string) => key) as ExtendedRecommendation[];
    const weeks = buildRoadmapWeeks(recs);
    const seen = new Set();

    for (const week of weeks) {
      expect(week.items.length).toBeGreaterThan(0);

      for (const item of week.items) {
        const key = getRecommendationKey(item);
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      }
    }

    expect(weeks.some((week: { key: string }) => week.key === 'week1')).toBe(true);
    expect(weeks.some((week: { key: string }) => week.key === 'week2')).toBe(true);
  });
});
