import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import PortfolioV5 from './portfolio-v5/PortfolioV5';
import { portfolioMetadata } from './portfolio-v5/seo';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return portfolioMetadata(locale === 'he' ? 'he' : 'en', 'home');
}

export default async function Home({ params }: Props) {
  const { locale } = await params;
  const activeLocale = locale === 'he' ? 'he' : 'en';
  setRequestLocale(activeLocale);
  return <PortfolioV5 locale={activeLocale} />;
}
