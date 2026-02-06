import { setRequestLocale, getTranslations } from 'next-intl/server';
import SettingsClient from './SettingsClient';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'portal.sidebar.nav' });
  return { title: `${t('settings')} | CartShift Portal` };
}

export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');
  return <SettingsClient />;
}
