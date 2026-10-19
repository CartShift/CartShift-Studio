import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import PortfolioV5Detail from '../PortfolioV5Detail';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const language = locale === 'he' ? 'he' : 'en';
  return {
    title: (language === 'he' ? 'עליי' : 'About') + ' | Yotam Faraggi — Fluid Portfolio',
    robots: { index: false, follow: false },
  };
}

export default async function V5AboutPage({ params }: Props) {
  const { locale } = await params;
  const language = locale === 'he' ? 'he' : 'en';
  setRequestLocale(language);
  const t = await getTranslations({ locale: language, namespace: 'cv' });
  return <PortfolioV5Detail locale={language} kind="about" email={t('email')} />;
}
