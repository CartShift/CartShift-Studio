import { setRequestLocale } from 'next-intl/server';
import AgencyDashboardClient from './AgencyDashboardClient';
import { PortalQueryHydration } from '@/components/providers/PortalQueryHydration';
import { prefetchPortalPageData } from '@/lib/server/prefetch-portal-queries';

export const dynamic = 'force-dynamic';

export default async function AgencyDashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');
  const dehydratedState = await prefetchPortalPageData('requests');
  return (
    <PortalQueryHydration state={dehydratedState}>
      <AgencyDashboardClient />
    </PortalQueryHydration>
  );
}
