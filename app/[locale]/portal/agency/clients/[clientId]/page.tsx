import { setRequestLocale } from 'next-intl/server';
import AgencyClientDetailClient from './AgencyClientDetailClient';

export default async function AgencyClientDetailPage({
  params,
}: {
  params: Promise<{ locale: string; clientId: string }>;
}) {
  const { locale, clientId } = await params;
  setRequestLocale(locale as 'en' | 'he');
  return <AgencyClientDetailClient clientId={clientId} />;
}
