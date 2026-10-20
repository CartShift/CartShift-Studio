import type { Metadata } from 'next';
import Script from 'next/script';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import {
  getPortfolioShowcase,
  getNextPortfolioShowcase,
  portfolioShowcaseSlugs,
} from '@/lib/portfolio-showcase';
import ProjectShowcase from '../../../portfolio/[slug]/ProjectShowcase';
import '../../../portfolio/[slug]/project-showcase.css';

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return portfolioShowcaseSlugs.map(slug => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const language = locale === 'he' ? 'he' : 'en';
  const project = getPortfolioShowcase(slug, language);
  if (!project) return { title: 'Project not found', robots: { index: false } };
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://cart-shift.com';
  const url = site + '/' + language + '/yotam/work/' + slug;
  return {
    title: { absolute: project.title + ' — ' + project.descriptor + ' | Yotam Faraggi' },
    description: project.summary,
    alternates: {
      canonical: url,
      languages: {
        en: site + '/en/yotam/work/' + slug,
        he: site + '/he/yotam/work/' + slug,
        'x-default': site + '/en/yotam/work/' + slug,
      },
    },
    robots: { index: true, follow: true },
    openGraph: {
      title: project.title + ' | Yotam Faraggi',
      description: project.summary,
      url,
      type: 'article',
    },
  };
}

/**
 * Reuse the FIVE ORIGINAL bespoke visual stories rather than rendering the same
 * generic case-study template for every project. Shared data and behavior stay
 * consistent; each project's layout, narrative, media and color direction don't.
 */
export default async function PersonalProjectCaseStudy({ params }: Props) {
  const { locale, slug } = await params;
  const language = locale === 'he' ? 'he' : 'en';
  setRequestLocale(language);

  const project = getPortfolioShowcase(slug, language);
  if (!project) notFound();
  const nextProject = getNextPortfolioShowcase(slug, language);
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://cart-shift.com';
  const url = site + '/' + language + '/yotam/work/' + slug;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: project.title,
    description: project.summary,
    url: project.liveUrl ?? url,
    dateModified: project.updatedAt,
    creator: {
      '@type': 'Person',
      name: 'Yotam Faraggi',
      url: site + '/' + language + '/yotam',
    },
    applicationCategory: project.descriptor,
    sameAs: [project.liveUrl, project.repositoryUrl].filter(Boolean),
  };

  return (
    <>
      <Script
        id={'personal-project-' + project.slug + '-jsonld'}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProjectShowcase
        project={project}
        nextProject={nextProject}
        locale={language}
        projectBasePath={'/' + language + '/yotam/work'}
      />
    </>
  );
}
