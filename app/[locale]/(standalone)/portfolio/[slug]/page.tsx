import type { Metadata } from 'next';
import Script from 'next/script';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import ProjectShowcase from './ProjectShowcase';
import './project-showcase.css';
import {
  getNextPortfolioShowcase,
  getPortfolioShowcase,
  portfolioShowcaseSlugs,
} from '@/lib/portfolio-showcase';

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export function generateStaticParams() {
  return portfolioShowcaseSlugs.flatMap(slug => [
    { locale: 'en', slug },
    { locale: 'he', slug },
  ]);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const project = getPortfolioShowcase(slug, locale);
  if (!project) return {};

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cart-shift.com';
  const isHebrew = locale === 'he';
  const title = `${project.title} - ${project.descriptor} | Yotam Faraggi`;
  const description = project.summary;
  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: {
      canonical: `${siteUrl}/${locale}/portfolio/${slug}`,
      languages: {
        en: `${siteUrl}/en/portfolio/${slug}`,
        he: `${siteUrl}/he/portfolio/${slug}`,
        'x-default': `${siteUrl}/en/portfolio/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${siteUrl}/${locale}/portfolio/${slug}`,
      locale: isHebrew ? 'he_IL' : 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function PortfolioProjectPage({ params }: Props) {
  const { locale, slug } = await params;
  const validLocale = locale === 'he' ? 'he' : 'en';
  setRequestLocale(validLocale);

  const project = getPortfolioShowcase(slug, validLocale);
  if (!project) notFound();

  const nextProject = getNextPortfolioShowcase(slug, validLocale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cart-shift.com';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: project.title,
    description: project.summary,
    url: project.liveUrl ?? `${siteUrl}/${validLocale}/portfolio/${project.slug}`,
    dateModified: project.updatedAt,
    creator: {
      '@type': 'Person',
      name: 'Yotam Faraggi',
      url: `${siteUrl}/${validLocale}/yotam`,
    },
    applicationCategory: project.descriptor,
    sameAs: [project.liveUrl, project.repositoryUrl].filter(Boolean),
  };

  return (
    <>
      <Script
        id={`project-${project.slug}-jsonld`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProjectShowcase project={project} nextProject={nextProject} locale={validLocale} />
    </>
  );
}
