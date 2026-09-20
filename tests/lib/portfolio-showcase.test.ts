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

  it('keeps in-development work explicit', () => {
    const ensemblis = getPortfolioShowcases('en').find(project => project.slug === 'ensemblis');
    expect(ensemblis?.status).toBe('Product in development');
  });
});
