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

  it('keeps Berlin and German work authorization prominent in every variant', () => {
    for (const id of cvVariantIds) {
      const cv = resolveCVVariant(id).cv;
      expect(cv.location).toBe('Berlin, Germany');
      expect(cv.workAuthorization).toContain('EU citizen');
      expect(cv.workAuthorization).toContain('Authorized to work in Germany');
    }
  });

  it('keeps military experience factual without restoring military-heavy labeling', () => {
    for (const id of cvVariantIds) {
      const cv = resolveCVVariant(id).cv;
      const service = cv.experiences.find(item => item.key === 'airforce');
      const serialized = JSON.stringify(cv);

      expect(service?.company).toBe('IDF / Mamram');
      expect(serialized).not.toContain('Israeli Air Force');
      expect(serialized).not.toContain('Military Service');
      expect(serialized).not.toContain('IDF School for Computer Professions');
      expect(serialized).not.toContain('Intensive military software development training');
      expect(serialized).not.toContain('military helicopter systems');
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
