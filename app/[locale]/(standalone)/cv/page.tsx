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
    description: t('summary.metaDescription'),
    alternates: {
      canonical: `${siteUrl}/${locale}/cv`,
      languages: {
        en: `${siteUrl}/en/cv`,
        he: `${siteUrl}/he/cv`,
        'x-default': `${siteUrl}/en/cv`,
      },
    },
    openGraph: {
      title: t('title'),
      description: t('summary.metaDescription'),
      type: 'profile',
      url: `${siteUrl}/${locale}/cv`,
      images: [
        {
          url: '/images/cv/yotam-studio-cv.png',
          width: 889,
          height: 1024,
          alt: t('name'),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('summary.metaDescription'),
      images: ['/images/cv/yotam-studio-cv.png'],
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
    inLanguage: validLocale === 'he' ? 'he-IL' : 'en-US',
    mainEntity: {
      '@type': 'Person',
      name: t('name'),
      jobTitle: t('subtitle'),
      description: t('summary.metaDescription'),
      email: t('email'),
      url: `${siteUrl}/${locale}/cv`,
      image: `${siteUrl}/images/cv/yotam-studio-cv.png`,
      sameAs: ['https://linkedin.com/in/yotam-faraggi', 'https://github.com/yotamon'],
      worksFor: {
        '@type': 'Organization',
        name: 'CartShift Studio',
        url: siteUrl,
      },
      address: {
        '@type': 'PostalAddress',
        addressLocality: t('location'),
      },
      knowsLanguage: ['Hebrew', 'English', 'German'],
      knowsAbout: [
        'Senior Full Stack Development',
        'R&D Leadership',
        'Next.js',
        'React',
        'TypeScript',
        'Shopify',
        'HubSpot',
        'Firebase',
        'Google Cloud Platform',
        'AI Workflow Automation',
        'Healthcare Compliance',
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
      <CVPageContent />
    </>
  );
}
