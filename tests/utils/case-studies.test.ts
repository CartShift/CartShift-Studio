import { describe, expect, it } from 'vitest';
import { getCaseStudyBySlug, normalizeCaseStudyRecord } from '@/lib/case-studies';

describe('case studies normalization', () => {
  it('loads localized structured fields from markdown frontmatter', () => {
    const study = getCaseStudyBySlug('alondon-community-portal', 'he');

    expect(study).not.toBeNull();
    expect(study?.overview.title).toContain('לרענן פורטל');
    expect(study?.hero.alt).toContain('עלונדון');
    expect(study?.gallery[0]?.caption).toContain('עמוד הבית');
    expect(study?.siteUrl).toBe('https://alondon.net/');
  });

  it('loads current structured evidence for the CuraLife case study', () => {
    const study = getCaseStudyBySlug('curalife-metabolic-wellness-platform', 'en');

    expect(study).not.toBeNull();
    expect(study?.platform).toContain('Shopify');
    expect(study?.evidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          value: '99.9% uptime',
        }),
        expect.objectContaining({
          value: '85% fewer failures',
        }),
      ])
    );
  });

  it('supports case studies that omit duration metadata', () => {
    const study = getCaseStudyBySlug('pedro-music-digital-release-store', 'en');

    expect(study).not.toBeNull();
    expect(study?.duration).toBe('');
    expect(study?.platform).toContain('WooCommerce');
  });

  it('normalizes legacy result rows into evidence entries when evidence is missing', () => {
    const normalized = normalizeCaseStudyRecord(
      {
        title: 'Legacy Study',
        client: 'Legacy Client',
        industry: 'Retail',
        platform: 'Shopify',
        duration: '2 weeks',
        summary: 'Legacy summary',
        heroImage: '/images/legacy/hero.jpg',
        thumbnail: '/images/legacy/thumb.jpg',
        results: [
          {
            metric: 'Localization',
            before: 'Partial',
            after: 'Complete',
            improvement: 'Finished',
          },
        ],
      },
      '',
      'en',
      'legacy-study'
    );

    expect(normalized.brand.primary).toBeTruthy();
    expect(normalized.hero.image).toBe('/images/legacy/hero.jpg');
    expect(normalized.evidence).toHaveLength(1);
    expect(normalized.evidence[0]).toMatchObject({
      title: 'Localization',
      value: 'Finished',
      before: 'Partial',
      after: 'Complete',
    });
  });
});
