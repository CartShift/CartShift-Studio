import { setRequestLocale } from 'next-intl/server';
import RequestDetailClient from './RequestDetailClient';

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ locale: string; requestId: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');
  return <RequestDetailClient />;
}
