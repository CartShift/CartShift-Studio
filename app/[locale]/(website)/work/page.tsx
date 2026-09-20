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
  const isHe = locale === 'he';
  const featured = getAllCaseStudies(locale)[0];

  return genMeta(
    {
      title: isHe
        ? 'פרויקטים ב-Shopify, WordPress ו-Web Apps | CartShift Studio'
        : 'Shopify, WordPress, and Web App Case Studies | CartShift Studio Work',
      description: isHe
        ? 'פרויקטים נבחרים של CartShift ב-Shopify, WordPress, אפליקציות ווב, מיגרציות ואופטימיזציה, עם מסכים אמיתיים, החלטות פיתוח ותוצאות מדודות כשיש נתונים.'
        : 'Explore CartShift projects across Shopify, WordPress, custom web apps, migrations, and performance optimization, with real screens, implementation decisions, and measured results where available.',
      url: '/work',
      image: featured?.hero.image,
      keywords: isHe
        ? [
            'פרויקטים בשופיפיי',
            'פרויקטים בוורדפרס',
            'פיתוח אפליקציות ווב',
            'מקרי בוחן מסחר אלקטרוני',
            'מיגרציה לשופיפיי',
            'אופטימיזציית ביצועים',
          ]
        : [
            'shopify case studies',
            'wordpress case studies',
            'web app case studies',
            'next.js case studies',
            'ecommerce migration case study',
            'shopify performance optimization',
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

  const isHe = locale === 'he';
  const breadcrumbSchema = generateBreadcrumbSchema(
    [
      { name: isHe ? 'בית' : 'Home', url: '/' },
      { name: isHe ? 'פרויקטים' : 'Work', url: '/work' },
    ],
    locale as 'en' | 'he'
  );

  const collectionSchema = generateCollectionPageSchema({
    name: isHe
      ? 'הפרויקטים שלנו | Shopify, WordPress ואפליקציות ווב'
      : 'Our Work | Shopify, WordPress & Web App Projects',
    description: isHe
      ? 'פרויקטים נבחרים של CartShift ב-Shopify, WordPress, אפליקציות ווב, מיגרציות ואופטימיזציה.'
      : 'Recent Shopify, WordPress, web app, migration, and optimization projects from CartShift Studio.',
    url: '/work',
    locale: locale as 'en' | 'he',
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
