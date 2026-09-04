import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import CVV2 from './CVV2';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cart-shift.com';

  return {
    title: 'Yotam Faraggi - CV',
    description:
      'Senior Product Engineer and Senior Full-Stack Engineer in Berlin with 10+ years of product, commerce, AI, integration, and production engineering experience.',
    robots: { index: false, follow: false },
    alternates: {
      canonical: `${siteUrl}/${locale}/cv-v2`,
    },
    openGraph: {
      title: 'Yotam Faraggi - CV',
      description: 'Senior Product Engineer · Full-stack · AI · Commerce',
      type: 'profile',
      url: `${siteUrl}/${locale}/cv-v2`,
      images: [
        {
          url: '/images/portfolio-v2/hero-art.webp',
          alt: 'Yotam Faraggi',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Yotam Faraggi - CV',
      description: 'Senior Product Engineer · Full-stack · AI · Commerce',
      images: ['/images/portfolio-v2/hero-art.webp'],
    },
  };
}

export default async function CVV2Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');

  return <CVV2 />;
}
