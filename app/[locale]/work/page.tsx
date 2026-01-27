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
  return genMeta(
    {
      title: 'Our Work | Shopify & WordPress Projects',
      description:
        'See our recent e-commerce projects. Shopify stores, WordPress sites, migrations, and optimizations. Real results for real businesses.',
      url: '/work',
      keywords: [
        'portfolio',
        'case studies',
        'e-commerce projects',
        'Shopify examples',
        'WordPress examples',
        'client work',
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
      'See our recent e-commerce projects. Shopify stores, WordPress sites, migrations, and optimizations.',
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
