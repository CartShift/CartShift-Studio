import { describe, expect, it } from 'vitest';
import { getCaseStudyBySlug, normalizeCaseStudyRecord } from '@/lib/case-studies';

describe('case studies normalization', () => {
  it('loads localized structured fields from markdown frontmatter', () => {
    const study = getCaseStudyBySlug('alondon-community-portal', 'he');

    expect(study).not.toBeNull();
    expect(study?.overview.title).toContain('לרענן פורטל');
    expect(study?.hero.alt).toContain('עלונדון');
    expect(study?.gallery[0]?.image).toBe(study?.hero.image);
    expect(study?.gallery[1]?.caption).toContain('עמודי כתבה');
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

  it('loads Atlas Irwin with homepage-led assets and qualitative evidence', () => {
    const study = getCaseStudyBySlug('atlas-irwin-music-identity', 'en');

    expect(study).not.toBeNull();
    expect(study?.siteUrl).toBe('https://atlasirwin.com/');
    expect(study?.platform).toBe('Next.js + Vercel');
    expect(study?.thumbnail).toBe('/images/case-studies/atlas-irwin-music-identity/hero.jpg');
    expect(study?.gallery[0]?.image).toBe(study?.hero.image);
    expect(study?.evidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          value: 'Brand-first Hero',
          tone: 'qualitative',
        }),
      ])
    );
  });

  it('loads Hands & Vision as a bilingual WordPress and WooCommerce case study', () => {
    const englishStudy = getCaseStudyBySlug('hands-and-vision-artist-collective', 'en');
    const hebrewStudy = getCaseStudyBySlug('hands-and-vision-artist-collective', 'he');

    expect(englishStudy).not.toBeNull();
    expect(englishStudy?.siteUrl).toBe('https://handsandvision.com/');
    expect(englishStudy?.platform).toBe('WordPress + WooCommerce');
    expect(englishStudy?.gallery).toHaveLength(4);
    expect(englishStudy?.evidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: '5 Service Verticals', tone: 'qualitative' }),
        expect.objectContaining({ value: '13 Artist Profiles', tone: 'qualitative' }),
      ])
    );

    expect(hebrewStudy?.title).toContain('Hands & Vision');
    expect(hebrewStudy?.hero.supportingCopy).toContain('דו-לשונית');
    expect(hebrewStudy?.content).toContain('## על Hands & Vision');
  });

  it('keeps the homepage hero image as the first gallery item and default thumbnail', () => {
    const normalized = normalizeCaseStudyRecord(
      {
        title: 'Homepage First',
        client: 'Client',
        industry: 'Retail',
        platform: 'Shopify',
        summary: 'Case study summary',
        thumbnail: '/images/homepage-first/thumb.jpg',
        hero: {
          image: '/images/homepage-first/hero.jpg',
          alt: 'Homepage screenshot',
          supportingCopy: 'Homepage first copy',
        },
        gallery: [
          {
            image: '/images/homepage-first/gallery-02.jpg',
            alt: 'Secondary screen',
            caption: 'Secondary screen caption',
          },
          {
            image: '/images/homepage-first/hero.jpg',
            alt: 'Duplicate homepage shot',
            caption: 'Duplicate homepage shot',
          },
        ],
      },
      '',
      'en',
      'homepage-first'
    );

    expect(normalized.thumbnail).toBe('/images/homepage-first/hero.jpg');
    expect(normalized.gallery[0]).toMatchObject({
      image: '/images/homepage-first/hero.jpg',
      alt: 'Homepage screenshot',
      caption: 'Homepage first copy',
    });
    expect(normalized.gallery).toHaveLength(2);
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
