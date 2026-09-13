import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import ProjectShowcase from './ProjectShowcase';
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
  const image = project.hero?.src.startsWith('/') ? project.hero.src : '/images/portfolio-v2/hero-art.webp';

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
      images: [{ url: image, alt: project.hero?.alt ?? project.title }],
      locale: isHebrew ? 'he_IL' : 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
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

  return <ProjectShowcase project={project} nextProject={nextProject} locale={validLocale} />;
}
