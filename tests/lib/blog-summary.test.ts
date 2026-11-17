import { describe, expect, it } from 'vitest';
import { toBlogPostSummary } from '@/lib/blog-summary';
import type { BlogPost } from '@/lib/markdown';

describe('blog index payload', () => {
  const fullPost: BlogPost = {
    slug: 'sample',
    title: 'Shopify operations',
    excerpt: 'Practical guidance',
    date: '2026-11-13',
    category: 'Shopify',
    image: '/images/blog/sample.webp',
    imageAlt: 'Sample screenshot',
    readingTime: 6,
    content: '<p>Full article HTML must not be shipped to the index.</p>',
    translation: {
      title: 'תפעול חנויות',
      excerpt: 'טיפים מקצועיים',
      category: 'שופיפיי',
      content: '<p>Full Hebrew article HTML</p>',
    },
    translations: {
      de: {
        title: 'Shopify-Betrieb',
        excerpt: 'Praxistipps',
        category: 'Shopify',
        content: '<p>Full German article HTML</p>',
      },
    },
  };

  it('retains listing metadata and all three locale summaries', () => {
    const summary = toBlogPostSummary(fullPost);
    expect(summary.slug).toBe('sample');
    expect(summary.readingTime).toBe(6);
    expect(summary.translation?.title).toBe('תפעול חנויות');
    expect(summary.translations?.de?.title).toBe('Shopify-Betrieb');
  });

  it('excludes full article HTML and other fields irrelevant to the index', () => {
    const summary = toBlogPostSummary(fullPost);
    const json = JSON.stringify(summary);
    expect(summary).not.toHaveProperty('content');
    expect(summary.translation).not.toHaveProperty('content');
    expect(summary.translations?.de).not.toHaveProperty('content');
    expect(json).not.toContain('Full article HTML');
    expect(json).not.toContain('Full Hebrew article HTML');
    expect(json).not.toContain('Full German article HTML');
  });
});
