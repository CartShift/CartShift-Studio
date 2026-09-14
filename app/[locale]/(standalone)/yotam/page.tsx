import type { Metadata } from 'next';
import Script from 'next/script';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { StandaloneLocaleSwitch } from '@/components/ui/StandaloneLocaleSwitch';
import CVV3 from '../cv-v3/CVV3';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const validLocale = locale as 'en' | 'he';
  const t = await getTranslations({ locale: validLocale, namespace: 'cv' });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cart-shift.com';
  const title = validLocale === 'he'
    ? "יותם פרג'י | Senior Product Engineer בברלין"
    : 'Yotam Faraggi | Senior Product Engineer in Berlin';
  const description = validLocale === 'he'
    ? 'פרופיל מקצועי של יותם פרג׳י, Senior Product Engineer בברלין עם 10+ שנות ניסיון: ניסיון מקצועי, מוצרים נבחרים, יכולות Full-Stack, אינטגרציות, מסחר ועבודה עדכנית במוצרים בסיוע AI.'
    : 'Professional profile of Yotam Faraggi, a Berlin-based Senior Product Engineer with 10+ years in software engineering: experience, selected products, full-stack capabilities, integrations, commerce and recent AI-assisted product work.';

  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: {
      canonical: `${siteUrl}/${locale}/yotam`,
      languages: {
        en: `${siteUrl}/en/yotam`,
        he: `${siteUrl}/he/yotam`,
        'x-default': `${siteUrl}/en/yotam`,
      },
    },
    openGraph: {
      title,
      description,
      type: 'profile',
      url: `${siteUrl}/${locale}/yotam`,
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

export default async function YotamProfilePage({ params }: Props) {
  const { locale } = await params;
  const validLocale = locale as 'en' | 'he';
  setRequestLocale(validLocale);

  const t = await getTranslations({ locale: validLocale, namespace: 'cv' });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cart-shift.com';
  const description = validLocale === 'he'
    ? 'Senior Product Engineer בברלין עם יותר מעשור בהנדסת תוכנה, מוצרי Full-Stack, מסחר ואינטגרציות, ועבודה עדכנית במוצרים בסיוע AI.'
    : 'Senior Product Engineer in Berlin with more than a decade in software engineering across full-stack products, commerce and integrations, with recent AI-assisted product work.';

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
      url: `${siteUrl}/${locale}/yotam`,
      image: `${siteUrl}/images/portfolio-v2/hero-art.webp`,
      sameAs: [
        'https://linkedin.com/in/yotam-faraggi',
        'https://github.com/yotamon',
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
        'APIs and Integrations',
        'AI-assisted Product Workflows',
        'E-commerce Systems',
        'Cloud Infrastructure',
        'Production Reliability',
      ],
    },
  };

  return (
    <>
      <Script
        id="yotam-profile-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <style>{`
        .yotam-profile-contrast :is(h1, h2, h3, h4, h5, h6)[class*='text-[#1d1d1f]'] {
          color: #1d1d1f !important;
        }
      `}</style>
      <StandaloneLocaleSwitch locale={validLocale} path="/yotam" />
      <div className="yotam-profile-contrast">
        <CVV3 />
      </div>
    </>
  );
}
