import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import AgencyClientDetailClient from './AgencyClientDetailClient';

export default async function AgencyClientDetailPage({
  params,
}: {
  params: Promise<{ locale: string; clientId: string }>;
}) {
  const { locale, clientId } = await params;
  setRequestLocale(locale as 'en' | 'he');
  if (!clientId || clientId.length < 10) notFound();
  return <AgencyClientDetailClient clientId={clientId} />;
}
