import type { Metadata } from 'next';
import Script from 'next/script';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import CVV2 from '../cv-v2/CVV2';
import '../cv-v2/cv-v2.css';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const validLocale = locale as 'en' | 'he';
  const t = await getTranslations({ locale: validLocale, namespace: 'cv' });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cart-shift.com';
  const title = validLocale === 'he'
    ? "יותם פרג'י - Senior Product Engineer | קורות חיים"
    : 'Yotam Faraggi - Senior Product Engineer | CV';
  const description = validLocale === 'he'
    ? 'Senior Product Engineer בברלין עם 10+ שנות ניסיון במוצרי Full-Stack, AI, מסחר, אינטגרציות ומערכות פרודקשן.'
    : 'Berlin-based Senior Product Engineer with 10+ years of experience building full-stack products, AI-assisted software, commerce systems, integrations, and production platforms.';

  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: {
      canonical: `${siteUrl}/${locale}/cv`,
      languages: {
        en: `${siteUrl}/en/cv`,
        he: `${siteUrl}/he/cv`,
        'x-default': `${siteUrl}/en/cv`,
      },
    },
    openGraph: {
      title,
      description,
      type: 'profile',
      url: `${siteUrl}/${locale}/cv`,
      images: [
        {
          url: '/images/portfolio-v2/hero-art.webp',
          alt: t('name'),
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

export default async function CVPage({ params }: Props) {
  const { locale } = await params;
  const validLocale = locale as 'en' | 'he';
  setRequestLocale(validLocale);

  const t = await getTranslations({ locale: validLocale, namespace: 'cv' });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cart-shift.com';
  const description = validLocale === 'he'
    ? 'Senior Product Engineer בברלין עם ניסיון במוצרי Full-Stack, AI, מסחר ואינטגרציות.'
    : 'Senior Product Engineer in Berlin building full-stack products, AI-assisted software, commerce systems, and integration-heavy platforms.';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    inLanguage: validLocale === 'he' ? 'he-IL' : 'en-US',
    mainEntity: {
      '@type': 'Person',
      name: t('name'),
      jobTitle: 'Senior Product Engineer',
      description,
      email: t('email'),
      url: `${siteUrl}/${locale}/cv`,
      image: `${siteUrl}/images/portfolio-v2/hero-art.webp`,
      sameAs: [
        'https://linkedin.com/in/yotam-faraggi',
        'https://github.com/yotamon',
        `${siteUrl}/${locale}/portfolio`,
      ],
      worksFor: {
        '@type': 'Organization',
        name: 'CartShift Studio',
        url: siteUrl,
      },
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Berlin',
        addressCountry: 'DE',
      },
      knowsLanguage: ['Hebrew', 'English', 'German'],
      knowsAbout: [
        'Product Engineering',
        'Full-Stack Development',
        'Next.js',
        'React',
        'TypeScript',
        'Node.js',
        'Shopify',
        'APIs and Integrations',
        'AI-assisted Product Workflows',
        'Cloud Infrastructure',
      ],
    },
  };

  return (
    <>
      <Script
        id="cv-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CVV2 />
    </>
  );
}
