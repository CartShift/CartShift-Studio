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
  {
    slug: 'web-app-project',
    title: 'Atlas Web App Project',
    client: 'Atlas Irwin',
    industry: 'Music & Artist Branding',
    platform: 'Next.js + Vercel',
    duration: '',
    featured: false,
    siteUrl: 'https://atlasirwin.com/',
    brand: { primary: '#4b2178', accent: '#d7ff4f' },
    hero: {
      image: '/images/case-studies/atlas/hero.jpg',
      alt: 'Atlas hero',
      supportingCopy: 'Atlas support copy',
    },
    overview: {
      title: 'Atlas overview',
      summary: 'Atlas summary',
    },
    thumbnail: '/images/case-studies/atlas/hero.jpg',
    heroImage: '/images/case-studies/atlas/hero.jpg',
    summary: 'Next.js web app case study summary.',
    results: [],
    services: ['Next.js Development', 'Responsive Frontend'],
    deliverables: [],
    gallery: [],
    evidence: [
      {
        title: 'Artist identity launched',
        value: 'Brand-first Hero',
        description: 'The artist website is live.',
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
    expect(screen.getAllByText('Atlas Web App Project').length).toBeGreaterThan(0);
    expect(screen.getAllByText('View Project').length).toBeGreaterThan(1);
  });

  it('filters the grid by platform', async () => {
    const user = userEvent.setup();

    render(<WorkPageContent caseStudies={caseStudies} />);

    await user.click(screen.getByRole('button', { name: 'WordPress' }));

    expect(screen.queryByText('Featured Shopify Project')).not.toBeInTheDocument();
    expect(screen.getAllByText('WordPress Publishing Project').length).toBeGreaterThan(0);
  });

  it('filters the grid by web app category', async () => {
    const user = userEvent.setup();

    render(<WorkPageContent caseStudies={caseStudies} />);

    await user.click(screen.getByRole('button', { name: 'Web Apps' }));

    expect(screen.queryByText('Featured Shopify Project')).not.toBeInTheDocument();
    expect(screen.queryByText('WordPress Publishing Project')).not.toBeInTheDocument();
    expect(screen.getAllByText('Atlas Web App Project').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Web App').length).toBeGreaterThan(0);
    expect(screen.queryByText('Next.js + Vercel')).not.toBeInTheDocument();
  });
});
