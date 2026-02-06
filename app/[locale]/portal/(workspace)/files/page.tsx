import { setRequestLocale, getTranslations } from 'next-intl/server';
import FilesClient from './FilesClient';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'portal.sidebar.nav' });
  return { title: `${t('files')} | CartShift Portal` };
}

export default async function FilesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');
  return <FilesClient />;
}
