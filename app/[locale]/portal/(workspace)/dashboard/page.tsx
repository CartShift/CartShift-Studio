import { setRequestLocale, getTranslations } from 'next-intl/server';
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
  const dehydratedState = await prefetchPortalPageData('dashboard');

  return (
    <PortalQueryHydration state={dehydratedState}>
      <DashboardClient />
    </PortalQueryHydration>
  );
}
