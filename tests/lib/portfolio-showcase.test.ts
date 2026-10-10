import { describe, expect, it } from 'vitest';
import { getPortfolioShowcases } from '@/lib/portfolio-showcase';

describe('personal portfolio showcase data', () => {
  it('keeps one canonical project order for navigation', () => {
    expect(getPortfolioShowcases('en').map(project => project.slug)).toEqual([
      'starlinker',
      'rightflow',
      'wakemyway',
      'cartshift-studio',
      'ensemblis',
    ]);
  });

  it('exposes complete proof metadata for every project', () => {
    for (const project of getPortfolioShowcases('en')) {
      expect(project.status).toBeTruthy();
      expect(project.role).toBeTruthy();
      expect(project.highlights).toHaveLength(3);
      expect(project.technologies.length).toBeGreaterThanOrEqual(5);
      expect(Number.isNaN(Date.parse(project.updatedAt))).toBe(false);
    }
  });


  it('gives each portfolio project a meaningful visual preview in both locales', () => {
    for (const locale of ['en', 'he'] as const) {
      for (const project of getPortfolioShowcases(locale)) {
        expect(project.hero?.src, project.slug).toBeTruthy();
        expect(project.hero?.alt.length, project.slug).toBeGreaterThan(20);
        expect(project.hero?.caption.length, project.slug).toBeGreaterThan(15);
      }
    }
  });

  it('labels conceptual artwork transparently instead of implying a product screenshot', () => {
    const ensemblis = getPortfolioShowcases('en').find(project => project.slug === 'ensemblis');
    expect(ensemblis?.hero?.src).toBe('/images/cv/portfolio/ensemblis-editorial.svg');
    expect(ensemblis?.hero?.alt).toContain('not a product screenshot');
    expect(ensemblis?.status).toBe('Product in development');
  });

  it('keeps in-development work explicit', () => {
    const ensemblis = getPortfolioShowcases('en').find(project => project.slug === 'ensemblis');
    expect(ensemblis?.status).toBe('Product in development');
  });
});
