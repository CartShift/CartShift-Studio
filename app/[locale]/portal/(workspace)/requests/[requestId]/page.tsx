import { setRequestLocale } from 'next-intl/server';
import RequestDetailClient from './RequestDetailClient';
import { PORTAL_STATIC_REQUEST_ID } from '@/lib/portal-static-params';

// Static params only - rewrites in next.config.mjs handle dynamic requestIds in dev
// The useResolvedRequestId hook extracts the real ID from the pathname
export const dynamicParams = false;

export async function generateStaticParams() {
  return [{ requestId: PORTAL_STATIC_REQUEST_ID }];
}

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ locale: string; requestId: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');
  return <RequestDetailClient />;
}
