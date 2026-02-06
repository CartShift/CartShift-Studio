import { setRequestLocale, getTranslations } from 'next-intl/server';
import RequestsClient from './RequestsClient';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'portal.sidebar.nav' });
  return { title: `${t('requests')} | CartShift Portal` };
}

export default async function RequestsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');
  return <RequestsClient />;
}
