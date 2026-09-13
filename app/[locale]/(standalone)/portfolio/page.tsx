import type { Metadata } from 'next';
import Script from 'next/script';
import { setRequestLocale } from 'next-intl/server';
import PortfolioV4 from '../portfolio-v4/PortfolioV4';

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
    ? 'פורטפוליו מוצרי של Senior Product Engineer בברלין עם 10+ שנות ניסיון ב-Full-Stack, AI ומובייל, המציג מוצרים founder-led ועבודת product engineering מקצה לקצה.'
    : 'Product portfolio of a Berlin-based Senior Product Engineer with 10+ years across full-stack, AI and mobile, featuring founder-led products and end-to-end product engineering.';

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
          alt: isHebrew ? "יותם פרג'י" : 'Yotam Faraggi',
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
  const isHebrew = validLocale === 'he';
  setRequestLocale(validLocale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cart-shift.com';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    inLanguage: isHebrew ? 'he-IL' : 'en-US',
    mainEntity: {
      '@type': 'Person',
      name: isHebrew ? "יותם פרג'י" : 'Yotam Faraggi',
      jobTitle: 'Senior Product Engineer',
      description: isHebrew
        ? 'Senior Product Engineer בברלין המתמחה במוצרי Full-Stack, AI, מובייל ו-product engineering.'
        : 'Senior Product Engineer in Berlin focused on full-stack products, AI, mobile and product engineering.',
      url: `${siteUrl}/${locale}/portfolio`,
      image: `${siteUrl}/images/portfolio-v2/hero-art.webp`,
      sameAs: [
        'https://linkedin.com/in/yotam-faraggi',
        'https://github.com/yotamon',
        `${siteUrl}/${locale}/cv`,
      ],
      address: {
        '@type': 'PostalAddress',
        addressLocality: isHebrew ? 'ברלין' : 'Berlin',
        addressCountry: 'DE',
      },
      knowsAbout: [
        'Product Engineering',
        'Full-Stack Development',
        'Next.js',
        'React',
        'TypeScript',
        'Kotlin',
        'Android',
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
      <PortfolioV4 locale={locale} />
    </>
  );
}
