import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { generateMetadata as genMeta, generateBreadcrumbSchema, generateArticleSchema } from '@/lib/seo';
import Script from 'next/script';
import type { Metadata } from 'next';
import { getCaseStudyBySlug, getCaseStudySlugs } from '@/lib/case-studies';
import { CaseStudyDetailContent } from '@/components/sections/CaseStudyDetailContent';

export async function generateStaticParams() {
  const locales = ['en', 'he'];
  const slugs = getCaseStudySlugs();

  return locales.flatMap(locale =>
    slugs.map(slug => ({ locale, slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const caseStudy = getCaseStudyBySlug(slug, locale);

  if (!caseStudy) {
    return genMeta({
      title: 'Case Study Not Found',
      description: 'The requested case study could not be found.',
      url: `/work/${slug}`,
      noindex: true,
    }, locale as 'en' | 'he');
  }

  const keywords = [
    caseStudy.platform.toLowerCase(),
    caseStudy.industry.toLowerCase(),
    'case study',
    'e-commerce success',
    `${caseStudy.platform} development`,
  ];

  return genMeta({
    title: `${caseStudy.title} | Case Study`,
    description: caseStudy.summary,
    url: `/work/${slug}`,
    type: 'article',
    keywords,
  }, locale as 'en' | 'he');
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale as 'en' | 'he');
  const caseStudy = getCaseStudyBySlug(slug, locale);

  if (!caseStudy) {
    notFound();
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cart-shift.com';

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Work', url: '/work' },
    { name: caseStudy.title, url: `/work/${slug}` },
  ]);

  const articleSchema = generateArticleSchema({
    title: caseStudy.title,
    description: caseStudy.summary,
    date: new Date().toISOString(),
    url: `${siteUrl}/work/${slug}`,
    category: caseStudy.industry,
  });

  return (
    <>
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id="case-study-article-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <CaseStudyDetailContent caseStudy={caseStudy} />
    </>
  );
}
