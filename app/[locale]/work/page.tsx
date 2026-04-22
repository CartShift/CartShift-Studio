import { setRequestLocale } from 'next-intl/server';
import { WorkPageContent } from '@/components/sections/WorkPageContent';
import {
  generateMetadata as genMeta,
  generateBreadcrumbSchema,
  generateCollectionPageSchema,
} from '@/lib/seo';
import { getAllCaseStudies } from '@/lib/case-studies';
import Script from 'next/script';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const featured = getAllCaseStudies(locale)[0];
  return genMeta(
    {
      title: 'Shopify and WordPress Case Studies | Stores, Migrations, and Growth Projects',
      description:
        'Explore recent CartShift projects across Shopify, WordPress, migrations, and performance optimization. See how we turn technical work into faster stores and clearer growth paths.',
      url: '/work',
      image: featured?.hero.image,
      keywords: [
        'shopify case studies',
        'wordpress case studies',
        'ecommerce migration case study',
        'shopify performance optimization',
        'client work',
        'ecommerce project examples',
      ],
    },
    locale as 'en' | 'he'
  );
}

export default async function WorkPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');
  const caseStudies = getAllCaseStudies(locale);

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Work', url: '/work' },
  ]);

  const collectionSchema = generateCollectionPageSchema({
    name: 'Our Work | Shopify & WordPress Projects',
    description:
      'Recent Shopify, WordPress, migration, and optimization projects from CartShift Studio.',
    url: '/work',
    items: caseStudies.map(cs => ({
      name: cs.title,
      url: `/work/${cs.slug}`,
      description: cs.summary,
    })),
  });

  return (
    <>
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id="work-collection-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <WorkPageContent caseStudies={caseStudies} />
    </>
  );
}
