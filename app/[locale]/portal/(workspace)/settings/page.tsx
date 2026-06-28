import { setRequestLocale, getTranslations } from 'next-intl/server';
import SettingsClient from './SettingsClient';
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
  return { title: `${t('settings')} | CartShift Portal` };
}

export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');
  const dehydratedState = await prefetchPortalPageData('settings');

  return (
    <PortalQueryHydration state={dehydratedState}>
      <SettingsClient />
    </PortalQueryHydration>
  );
}
