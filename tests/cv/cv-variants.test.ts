import { describe, expect, it } from 'vitest';
import { getEnglishCVData } from '@/lib/cv/cv-data';
import {
  cvVariantIds,
  cvVariants,
  resolveCVVariant,
  validateCVVariantConfig,
} from '@/lib/cv/cv-variants';

describe('CV variants', () => {
  it('keeps the default variant identical to the canonical English CV', () => {
    expect(resolveCVVariant('default').cv).toEqual(getEnglishCVData());
  });

  it('validates every registered variant', () => {
    for (const id of cvVariantIds) {
      expect(() => validateCVVariantConfig(cvVariants[id])).not.toThrow();
      expect(cvVariants[id].filename.toLowerCase()).toMatch(/\.pdf$/);
    }
  });

  it('preserves factual experience identity while allowing tailored emphasis', () => {
    const base = getEnglishCVData();

    for (const id of cvVariantIds) {
      const resolved = resolveCVVariant(id).cv;

      for (const experience of resolved.experiences) {
        const canonical = base.experiences.find(item => item.key === experience.key);
        expect(canonical).toBeDefined();
        expect(experience.company).toBe(canonical?.company);
        expect(experience.title).toBe(canonical?.title);
        expect(experience.duration).toBe(canonical?.duration);
        expect(experience.durationYears).toBe(canonical?.durationYears);
        expect(experience.location).toBe(canonical?.location);
      }
    }
  });

  it('surfaces end-to-end Curalife ownership in every tailored lane', () => {
    for (const id of ['product-frontend', 'fullstack-healthcare', 'product-ai'] as const) {
      const curalife = resolveCVVariant(id).cv.experiences.find(item => item.key === 'curalife');
      const combined = [curalife?.description, ...(curalife?.highlights ?? [])].join(' ');

      expect(combined).toContain('Defined, architected, and built');
      expect(combined).toContain('end-to-end');
      expect(combined).toContain('customer-acquisition and revenue funnels');
    }
  });

  it('reorders emphasis without dropping historical roles in the current tailored variants', () => {
    const baseKeys = getEnglishCVData().experiences.map(item => item.key);

    for (const id of ['product-frontend', 'fullstack-healthcare', 'product-ai'] as const) {
      expect(resolveCVVariant(id).cv.experiences.map(item => item.key)).toEqual(baseKeys);
    }
  });
});
