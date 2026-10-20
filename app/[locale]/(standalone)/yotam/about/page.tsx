import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import PortfolioV5Detail from '../../portfolio-v5/PortfolioV5Detail';
import { personalPageMetadata } from '../seo';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return personalPageMetadata(locale === 'he' ? 'he' : 'en', 'about');
}

export default async function PersonalAboutPage({ params }: Props) {
  const { locale } = await params;
  const language = locale === 'he' ? 'he' : 'en';
  setRequestLocale(language);
  const cv = await getTranslations({ locale: language, namespace: 'cv' });
  return <PortfolioV5Detail locale={language} kind="about" email={cv('email')} />;
}
