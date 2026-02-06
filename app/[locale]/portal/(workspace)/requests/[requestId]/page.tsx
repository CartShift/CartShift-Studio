import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import RequestDetailClient from './RequestDetailClient';

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ locale: string; requestId: string }>;
}) {
  const { locale, requestId } = await params;
  setRequestLocale(locale as 'en' | 'he');
  if (!requestId || requestId.length < 10) notFound();
  return <RequestDetailClient />;
}
