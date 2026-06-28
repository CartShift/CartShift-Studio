import { setRequestLocale, getMessages, getTranslations } from 'next-intl/server';
import DashboardClient from './DashboardClient';
import { PortalQueryHydration } from '@/components/providers/PortalQueryHydration';
import { prefetchPortalPageData } from '@/lib/server/prefetch-portal-queries';
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
  const [messages, dehydratedState] = await Promise.all([
    getMessages(),
    prefetchPortalPageData('dashboard'),
  ]);

  return (
    <PortalQueryHydration state={dehydratedState}>
      <DashboardClient messages={messages} locale={locale} />
    </PortalQueryHydration>
  );
}
