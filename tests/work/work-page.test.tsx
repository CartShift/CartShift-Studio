import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '../utils/test-utils';
import { WorkPageContent } from '@/components/sections/WorkPageContent';
import type { CaseStudyMeta } from '@/lib/case-studies';

const caseStudies: CaseStudyMeta[] = [
  {
    slug: 'featured-shopify',
    title: 'Featured Shopify Project',
    client: 'Featured Client',
    industry: 'Health & Wellness',
    platform: 'Shopify',
    duration: '10 weeks',
    featured: true,
    siteUrl: 'https://featured.example.com',
    brand: { primary: '#8db43f', accent: '#f6df87' },
    hero: {
      image: '/images/case-studies/featured/hero.jpg',
      alt: 'Featured hero',
      supportingCopy: 'Featured support copy',
    },
    overview: {
      title: 'Featured overview',
      summary: 'Featured summary',
    },
    thumbnail: '/images/case-studies/featured/gallery-01.jpg',
    heroImage: '/images/case-studies/featured/hero.jpg',
    summary: 'Featured case study summary.',
    results: [],
    services: ['UX'],
    deliverables: [],
    gallery: [],
    evidence: [
      {
        title: 'Quiz launched',
        value: 'New Capability',
        description: 'The guided quiz is now live.',
        tone: 'qualitative',
      },
    ],
  },
  {
    slug: 'wordpress-project',
    title: 'WordPress Publishing Project',
    client: 'Editorial Client',
    industry: 'Digital Publishing',
    platform: 'WordPress',
    duration: '8 weeks',
    featured: false,
    siteUrl: 'https://editorial.example.com',
    brand: { primary: '#30557e', accent: '#d0b78d' },
    hero: {
      image: '/images/case-studies/editorial/hero.jpg',
      alt: 'Editorial hero',
      supportingCopy: 'Editorial support copy',
    },
    overview: {
      title: 'Editorial overview',
      summary: 'Editorial summary',
    },
    thumbnail: '/images/case-studies/editorial/gallery-01.jpg',
    heroImage: '/images/case-studies/editorial/hero.jpg',
    summary: 'WordPress case study summary.',
    results: [],
    services: ['Strategy'],
    deliverables: [],
    gallery: [],
    evidence: [
      {
        title: 'Navigation reorganized',
        value: 'Structured',
        description: 'Paths are clearer across the portal.',
        tone: 'qualitative',
      },
    ],
  },
];

describe('WorkPageContent', () => {
  it('renders a uniform image-led portfolio grid', () => {
    render(<WorkPageContent caseStudies={caseStudies} />);

    expect(screen.getByRole('heading', { name: 'Our Work' })).toBeInTheDocument();
    expect(screen.getAllByText('Featured Shopify Project').length).toBeGreaterThan(0);
    expect(screen.getAllByText('WordPress Publishing Project').length).toBeGreaterThan(0);
    expect(screen.getAllByText('View Project').length).toBeGreaterThan(1);
  });

  it('filters the grid by platform', async () => {
    const user = userEvent.setup();

    render(<WorkPageContent caseStudies={caseStudies} />);

    await user.click(screen.getByRole('button', { name: 'WordPress' }));

    expect(screen.queryByText('Featured Shopify Project')).not.toBeInTheDocument();
    expect(screen.getAllByText('WordPress Publishing Project').length).toBeGreaterThan(0);
  });
});
