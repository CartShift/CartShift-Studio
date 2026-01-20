import { setRequestLocale } from 'next-intl/server';
import AgencyClientsClient from './AgencyClientsClient';

export default async function AgencyClientsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');
  return <AgencyClientsClient />;
}
