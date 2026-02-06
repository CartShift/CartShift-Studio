import { setRequestLocale, getMessages, getTranslations } from 'next-intl/server';
import DashboardClient from './DashboardClient';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as 'en' | 'he',
    namespace: 'portal.sidebar.nav',
  });
  return { title: `${t('dashboard')} | CartShift Portal` };
}

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');
  const messages = await getMessages();
  return <DashboardClient messages={messages} locale={locale} />;
}
