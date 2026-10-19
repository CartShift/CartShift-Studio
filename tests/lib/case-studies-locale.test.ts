import { describe, expect, it } from 'vitest';
import { getAllCaseStudies } from '@/lib/case-studies';

describe('case study locale handling', () => {
  it('falls back to English for untrusted route segments instead of throwing', () => {
    const english = getAllCaseStudies('en');
    expect(english.length).toBeGreaterThan(1);
    expect(getAllCaseStudies('icon-512.png')).toEqual(english);
    expect(getAllCaseStudies('xmlrpc.php')).toEqual(english);
    expect(getAllCaseStudies('not_a_valid_locale')).toEqual(english);
  });

  it('keeps Hebrew sorting and localized content available', () => {
    expect(getAllCaseStudies('he').length).toBe(getAllCaseStudies('en').length);
  });
});
