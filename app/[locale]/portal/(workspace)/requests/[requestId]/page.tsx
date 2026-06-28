import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import RequestDetailClient from './RequestDetailClient';
import { PortalQueryHydration } from '@/components/providers/PortalQueryHydration';
import { prefetchPortalPageData } from '@/lib/server/prefetch-portal-queries';

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ locale: string; requestId: string }>;
}) {
  const { locale, requestId } = await params;
  setRequestLocale(locale as 'en' | 'he');
  if (!requestId || requestId.length < 10) notFound();

  const dehydratedState = await prefetchPortalPageData('request-detail', { requestId });

  return (
    <PortalQueryHydration state={dehydratedState}>
      <RequestDetailClient />
    </PortalQueryHydration>
  );
}
