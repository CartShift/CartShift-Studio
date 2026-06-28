import { setRequestLocale, getTranslations } from 'next-intl/server';
import RequestsClient from './RequestsClient';
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
  return { title: `${t('requests')} | CartShift Portal` };
}

export default async function RequestsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');
  const dehydratedState = await prefetchPortalPageData('requests');

  return (
    <PortalQueryHydration state={dehydratedState}>
      <RequestsClient />
    </PortalQueryHydration>
  );
}
