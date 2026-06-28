import { setRequestLocale } from 'next-intl/server';
import AgencyWorkboardClient from './AgencyWorkboardClient';
import { PortalQueryHydration } from '@/components/providers/PortalQueryHydration';
import { prefetchPortalPageData } from '@/lib/server/prefetch-portal-queries';

export const dynamic = 'force-dynamic';

export default async function AgencyWorkboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');
  const dehydratedState = await prefetchPortalPageData('workboard');

  return (
    <PortalQueryHydration state={dehydratedState}>
      <AgencyWorkboardClient />
    </PortalQueryHydration>
  );
}
