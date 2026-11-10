import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import {
  generateMetadata as genMeta,
  generateBreadcrumbSchema,
  generateArticleSchema,
} from '@/lib/seo';
import Script from 'next/script';
import type { Metadata } from 'next';
import { getCaseStudyBySlug, getCaseStudySlugs } from '@/lib/case-studies';
import { CaseStudyDetailContent } from '@/components/sections/CaseStudyDetailContent';

export async function generateStaticParams() {
  const slugs = getCaseStudySlugs();

  return routing.locales.filter(locale => locale !== 'de').flatMap(locale => slugs.map(slug => ({ locale, slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const isHe = locale === 'he';
  const isDe = locale === 'de';
  const caseStudy = getCaseStudyBySlug(slug, locale);

  if (!caseStudy) {
    return genMeta(
      {
        title: isHe ? 'הפרויקט לא נמצא' : isDe ? 'Projekt nicht gefunden' : 'Case Study Not Found',
        description: isHe
          ? 'הפרויקט המבוקש לא נמצא.'
          : isDe ? 'Das angeforderte Projekt wurde nicht gefunden.' : 'The requested case study could not be found.',
        url: `/work/${slug}`,
        noindex: true,
      },
      locale as 'en' | 'he' | 'de'
    );
  }

  const keywords = [
    caseStudy.platform.toLowerCase(),
    caseStudy.industry.toLowerCase(),
    isHe ? 'מקרה בוחן' : isDe ? 'Fallstudie' : 'case study',
    isHe ? 'פיתוח מסחר אלקטרוני' : isDe ? 'E-Commerce-Entwicklung' : 'e-commerce development',
    `${caseStudy.platform} ${isHe ? 'פיתוח' : isDe ? 'Entwicklung' : 'development'}`,
  ];

  return genMeta(
    {
      title: `${caseStudy.title} | ${isHe ? 'מקרה בוחן' : isDe ? 'Projektbeispiel' : 'Case Study'}`,
      description: caseStudy.summary,
      url: `/work/${slug}`,
      type: 'article',
      image: caseStudy.hero.image,
      keywords,
    },
    locale as 'en' | 'he' | 'de'
  );
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale as 'en' | 'he' | 'de');
  const caseStudy = getCaseStudyBySlug(slug, locale);

  if (!caseStudy) {
    notFound();
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cart-shift.com';

  const isHe = locale === 'he';
  const isDe = locale === 'de';
  const breadcrumbSchema = generateBreadcrumbSchema(
    [
      { name: isHe ? 'בית' : isDe ? 'Startseite' : 'Home', url: '/' },
      { name: isHe ? 'פרויקטים' : isDe ? 'Projekte' : 'Work', url: '/work' },
      { name: caseStudy.title, url: `/work/${slug}` },
    ],
    locale as 'en' | 'he' | 'de'
  );

  const articleSchema = generateArticleSchema({
    title: caseStudy.title,
    description: caseStudy.summary,
    url: `${siteUrl}/${locale}/work/${slug}`,
    locale: locale as 'en' | 'he' | 'de',
    category: caseStudy.industry,
    image: caseStudy.hero.image ? `${siteUrl}${caseStudy.hero.image}` : undefined,
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
