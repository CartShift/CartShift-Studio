import { setRequestLocale, getTranslations } from 'next-intl/server';
import NewRequestClient from './NewRequestClient';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as 'en' | 'he', namespace: 'portal.requests' });
  return { title: `${t('newRequest')} | CartShift Portal` };
}

export default async function NewRequestPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');
  return <NewRequestClient />;
}
