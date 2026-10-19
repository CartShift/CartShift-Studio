import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import PortfolioV5 from './PortfolioV5';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const he = locale === 'he';
  const title = he
    ? "יותם פרג׳י — מהנדס מוצר עצמאי"
    : 'Yotam Faraggi — Independent Product Engineer';

  return {
    title: { absolute: title },
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
  return <PortfolioV5 locale={activeLocale} />;
}
