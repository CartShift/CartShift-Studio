import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Metadata } from 'next';
import CVPageContent from './CVPageContent';
import Script from 'next/script';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const validLocale = locale as 'en' | 'he';
  const t = await getTranslations({ locale: validLocale, namespace: 'cv' });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cart-shift.com';

  return {
    title: t('title'),
    description: t('summary.text'),
    alternates: {
      canonical: `${siteUrl}/${locale}/cv`,
      languages: {
        en: `${siteUrl}/en/cv`,
        he: `${siteUrl}/he/cv`,
      },
    },
    openGraph: {
      title: t('title'),
      description: t('summary.text'),
      type: 'profile',
      url: `${siteUrl}/${locale}/cv`,
      images: [
        {
          url: '/images/yotam-programmer.png',
          width: 800,
          height: 800,
          alt: t('name'),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('summary.text'),
      images: ['/images/yotam-programmer.png'],
    },
  };
}

export default async function CVPage({ params }: Props) {
  const { locale } = await params;
  const validLocale = locale as 'en' | 'he';

  // Enable static rendering
  setRequestLocale(validLocale);

  const t = await getTranslations({ locale: validLocale, namespace: 'cv' });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cart-shift.com';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name: t('name'),
      jobTitle: t('subtitle'),
      description: t('summary.text'),
      email: t('email'),
      url: `${siteUrl}/${locale}/cv`,
      image: `${siteUrl}/images/yotam-programmer.png`,
      sameAs: [
        `https://${t('linkedin').replace(/^https?:\/\//, '')}`,
        'https://github.com/yotamon',
      ],
      address: {
        '@type': 'PostalAddress',
        addressLocality: t('location'),
      },
      knowsAbout: [
        'Full Stack Development',
        'E-Commerce',
        'Shopify',
        'Next.js',
        'React',
        'Node.js',
        'Cloud Architecture'
      ]
    }
  };

  return (
    <>
      <Script
        id="cv-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CVPageContent />
    </>
  );
}
