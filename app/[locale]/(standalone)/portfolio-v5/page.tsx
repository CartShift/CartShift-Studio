import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import PortfolioV5 from './PortfolioV5';
import './portfolio-v5.css';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const he = locale === 'he';
  const title = he
    ? "יותם פרג'י | ניסוי פורטפוליו — Fluid Studio"
    : 'Yotam Faraggi | Fluid Studio — Portfolio Experiment';

  return {
    title,
    description: he
      ? 'ניסוי פורטפוליו אינטראקטיבי של יותם פרג׳י, עם אמנות מקורית ותנועה.'
      : 'An experimental, interactive portfolio for product engineer Yotam Faraggi, featuring original generative artwork.',
    robots: { index: false, follow: false },
    openGraph: { title, type: 'website' },
  };
}

export default async function PortfolioV5Page({ params }: Props) {
  const { locale } = await params;
  const activeLocale = locale === 'he' ? 'he' : 'en';
  setRequestLocale(activeLocale);
  const t = await getTranslations({ locale: activeLocale, namespace: 'cv' });

  return <PortfolioV5 locale={activeLocale} email={t('email')} />;
}
