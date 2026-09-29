import { describe, expect, it } from 'vitest';
import { generateServiceSchema } from '@/lib/seo';

describe('generateServiceSchema', () => {
  it('does not emit Product structured data for service pages', () => {
    const schema = generateServiceSchema('Shopify Development', 'Custom Shopify development', {
      url: '/solutions/shopify',
      locale: 'en',
    });

    expect(schema['@type']).toBe('Service');
    expect(schema).not.toHaveProperty('serviceOutput');
    expect(JSON.stringify(schema)).not.toContain('"@type":"Product"');
  });

  it('keeps service package offers inside an OfferCatalog without Product markup', () => {
    const schema = generateServiceSchema('SEO Services', 'SEO consulting and implementation', {
      url: '/solutions/seo',
      locale: 'en',
      offers: [
        {
          name: 'SEO Audit',
          description: 'A technical and content audit',
          price: '500',
        },
      ],
    });

    expect(schema.hasOfferCatalog).toMatchObject({
      '@type': 'OfferCatalog',
      itemListElement: [
        expect.objectContaining({
          '@type': 'Offer',
          price: '500',
          priceCurrency: 'USD',
        }),
      ],
    });
    expect(JSON.stringify(schema)).not.toContain('"@type":"Product"');
  });
});
