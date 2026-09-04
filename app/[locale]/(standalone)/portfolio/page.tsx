import type { Metadata } from 'next';
import Script from 'next/script';
import { setRequestLocale } from 'next-intl/server';
import PortfolioV2 from '../portfolio-v2/PortfolioV2';
import '../portfolio-v2/portfolio-v2.css';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isHebrew = locale === 'he';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cart-shift.com';
  const title = isHebrew
    ? "יותם פרג'י - Senior Product Engineer | פורטפוליו"
    : 'Yotam Faraggi - Senior Product Engineer | Portfolio';
  const description = isHebrew
    ? 'פורטפוליו של Senior Product Engineer בברלין: מוצרי Full-Stack, AI, מסחר, אינטגרציות ועבודה מקצה לקצה.'
    : 'Portfolio of a Berlin-based Senior Product Engineer building full-stack products, AI-assisted software, commerce systems, integrations, and production platforms.';

  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: {
      canonical: `${siteUrl}/${locale}/portfolio`,
      languages: {
        en: `${siteUrl}/en/portfolio`,
        he: `${siteUrl}/he/portfolio`,
        'x-default': `${siteUrl}/en/portfolio`,
      },
    },
    openGraph: {
      title,
      description,
      type: 'profile',
      url: `${siteUrl}/${locale}/portfolio`,
      images: [
        {
          url: '/images/portfolio-v2/hero-art.webp',
          alt: 'Yotam Faraggi',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/images/portfolio-v2/hero-art.webp'],
    },
  };
}

export default async function PortfolioPage({ params }: Props) {
  const { locale } = await params;
  const validLocale = locale as 'en' | 'he';
  setRequestLocale(validLocale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cart-shift.com';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    inLanguage: validLocale === 'he' ? 'he-IL' : 'en-US',
    mainEntity: {
      '@type': 'Person',
      name: 'Yotam Faraggi',
      jobTitle: 'Senior Product Engineer',
      url: `${siteUrl}/${locale}/portfolio`,
      image: `${siteUrl}/images/portfolio-v2/hero-art.webp`,
      sameAs: [
        'https://linkedin.com/in/yotam-faraggi',
        'https://github.com/yotamon',
        `${siteUrl}/${locale}/cv`,
      ],
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Berlin',
        addressCountry: 'DE',
      },
      knowsAbout: [
        'Product Engineering',
        'Full-Stack Development',
        'Next.js',
        'React',
        'TypeScript',
        'Node.js',
        'Shopify',
        'AI-assisted Products',
        'APIs and Integrations',
      ],
    },
  };

  return (
    <>
      <Script
        id="portfolio-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PortfolioV2 locale={locale} />
    </>
  );
}
