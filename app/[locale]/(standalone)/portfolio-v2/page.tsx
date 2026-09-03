import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import PortfolioV2 from './PortfolioV2';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cart-shift.com';

  return {
    title: 'Yotam Faraggi — Senior Product Engineer',
    description:
      'Senior Product Engineer in Berlin building full-stack products, commerce systems, AI-assisted software, and integration-heavy platforms.',
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title: 'Yotam Faraggi — Senior Product Engineer',
      description: 'I build products from ambiguous ideas to production software people actually use.',
      type: 'profile',
      url: `${siteUrl}/${locale}/portfolio-v2`,
      images: [
        {
          url: '/images/cv/yotam-studio-cv.png',
          width: 889,
          height: 1024,
          alt: 'Yotam Faraggi',
        },
      ],
    },
  };
}

export default async function PortfolioV2Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');

  return <PortfolioV2 locale={locale} />;
}
