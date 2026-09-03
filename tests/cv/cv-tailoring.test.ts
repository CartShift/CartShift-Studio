import { describe, expect, it } from 'vitest';
import { resolveCVVariant } from '@/lib/cv/cv-variants';
import { parseCVTailoringInput, resolveTailoredCV } from '@/lib/cv/cv-tailoring';

describe('dynamic CV tailoring', () => {
  it('starts from a named lane and only changes allowed emphasis fields', () => {
    const base = resolveCVVariant('fullstack-healthcare');
    const tailored = resolveTailoredCV({
      baseVariant: 'fullstack-healthcare',
      filename: 'Yotam Faraggi CV - Example Health.pdf',
      headline: 'Senior Full-Stack Engineer | Healthcare Product Systems',
      summary: {
        text: 'Tailored summary for a healthcare product role.',
      },
      experienceOverrides: {
        curalife: {
          description: 'Tailored Curalife emphasis without changing factual employment identity.',
          highlights: ['Tailored, factual highlight.'],
        },
      },
    });

    expect(tailored.filename).toBe('Yotam Faraggi CV - Example Health.pdf');
    expect(tailored.cv.headline).toBe('Senior Full-Stack Engineer | Healthcare Product Systems');
    expect(tailored.cv.summary.text).toBe('Tailored summary for a healthcare product role.');

    const baseCuralife = base.cv.experiences.find(item => item.key === 'curalife')!;
    const tailoredCuralife = tailored.cv.experiences.find(item => item.key === 'curalife')!;

    expect(tailoredCuralife.company).toBe(baseCuralife.company);
    expect(tailoredCuralife.title).toBe(baseCuralife.title);
    expect(tailoredCuralife.duration).toBe(baseCuralife.duration);
    expect(tailoredCuralife.durationYears).toBe(baseCuralife.durationYears);
    expect(tailoredCuralife.location).toBe(baseCuralife.location);
    expect(tailoredCuralife.description).toBe(
      'Tailored Curalife emphasis without changing factual employment identity.'
    );
  });

  it('rejects unknown override keys and oversized content', () => {
    expect(() =>
      parseCVTailoringInput({
        baseVariant: 'product-frontend',
        experienceOverrides: {
          imaginary_job: { highlights: ['Not allowed'] },
        },
      })
    ).toThrow(/unknown cv experience key/i);

    expect(() =>
      parseCVTailoringInput({
        baseVariant: 'product-ai',
        summary: { text: 'x'.repeat(1801) },
      })
    ).toThrow();
  });

  it('keeps omitted items when a custom order only prioritizes a subset', () => {
    const tailored = resolveTailoredCV({
      baseVariant: 'product-frontend',
      skillOrder: ['frontendFullStack', 'productEngineering'],
      portfolioProjectOrder: ['rightflow'],
    });

    expect(tailored.cv.skills).toHaveLength(resolveCVVariant('product-frontend').cv.skills.length);
    expect(tailored.cv.skills[0]?.key).toBe('frontendFullStack');
    expect(tailored.cv.skills[1]?.key).toBe('productEngineering');
    expect(tailored.cv.portfolio.projects[0]?.key).toBe('rightflow');
    expect(tailored.cv.portfolio.projects).toHaveLength(
      resolveCVVariant('product-frontend').cv.portfolio.projects.length
    );
  });
});
