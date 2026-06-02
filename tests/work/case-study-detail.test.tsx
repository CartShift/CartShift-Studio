import { describe, expect, it } from 'vitest';
import { render, screen } from '../utils/test-utils';
import { CaseStudyDetailContent } from '@/components/sections/CaseStudyDetailContent';
import type { CaseStudy } from '@/lib/case-studies';

const baseCaseStudy: CaseStudy = {
  slug: 'test-case-study',
  title: 'Test Case Study',
  client: 'Test Client',
  industry: 'Health & Wellness',
  platform: 'Shopify',
  duration: '8 weeks',
  featured: true,
  siteUrl: 'https://example.com',
  brand: {
    primary: '#8db43f',
    accent: '#f6df87',
  },
  hero: {
    image: '/images/case-studies/test/hero.jpg',
    alt: 'Test homepage hero',
    supportingCopy: 'A concise editorial summary of the project.',
  },
  overview: {
    title: 'Turning complexity into a calmer shopping flow',
    summary:
      'We rebuilt the storefront around clarity, education, and better guided navigation across the catalog.',
  },
  thumbnail: '/images/case-studies/test/gallery-01.jpg',
  heroImage: '/images/case-studies/test/hero.jpg',
  summary: 'Structured summary for the project.',
  results: [
    {
      metric: 'Localization',
      before: 'Partial',
      after: 'Complete',
      improvement: 'Finished',
    },
  ],
  services: ['UX/UI Design', 'Localization'],
  deliverables: [
    {
      title: 'Guided merchandising',
      description: 'Product discovery was reframed around clearer paths and supporting content.',
    },
  ],
  gallery: [
    {
      image: '/images/case-studies/test/gallery-01.jpg',
      alt: 'Gallery shot one',
      caption: 'Homepage hierarchy after the redesign.',
    },
  ],
  evidence: [
    {
      title: 'Localization completed',
      value: 'RTL Complete',
      description: 'The storefront now supports Hebrew and RTL layouts end to end.',
      before: 'Partial',
      after: 'Complete',
      tone: 'qualitative',
    },
  ],
  testimonial: {
    quote: 'The new structure finally makes the catalog feel easy to navigate.',
    author: 'Noa Levi',
    role: 'Founder',
  },
  content: '## Notes\n\nAdditional context about the build.',
};

describe('CaseStudyDetailContent', () => {
  it('renders the editorial sections and evidence-backed content', () => {
    render(<CaseStudyDetailContent caseStudy={baseCaseStudy} />);

    expect(screen.getByRole('heading', { name: 'Test Case Study' })).toBeInTheDocument();
    expect(screen.getAllByText('Project Overview').length).toBeGreaterThan(0);
    expect(screen.getAllByText('What We Shipped').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Selected Screens').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Evidence & Outcomes').length).toBeGreaterThan(0);
    expect(screen.getByText('RTL Complete')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Visit Live Site/i })).toHaveAttribute(
      'href',
      'https://example.com'
    );
  }, 15_000);

  it('gracefully skips optional sections when data is missing', () => {
    const minimalCaseStudy: CaseStudy = {
      ...baseCaseStudy,
      gallery: [],
      evidence: [],
      testimonial: undefined,
      content: '',
    };

    render(<CaseStudyDetailContent caseStudy={minimalCaseStudy} />);

    expect(screen.getByRole('heading', { name: 'Test Case Study' })).toBeInTheDocument();
    expect(screen.queryByText('Client Quote')).not.toBeInTheDocument();
    expect(screen.queryByText('Evidence & Outcomes')).not.toBeInTheDocument();
  });

  it('renders in RTL mode for Hebrew locale', () => {
    const { container } = render(<CaseStudyDetailContent caseStudy={baseCaseStudy} />, {
      locale: 'he',
    });

    expect(container.firstChild).toHaveAttribute('dir', 'rtl');
  });
});
