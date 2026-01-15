import { setRequestLocale } from 'next-intl/server';
import AgencyConsultationsClient from './AgencyConsultationsClient';

export default async function AgencyConsultationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');
  return <AgencyConsultationsClient />;
}
