import { setRequestLocale } from 'next-intl/server';
import AgencyPricingClient from './AgencyPricingClient';

export default async function AgencyPricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');
  return <AgencyPricingClient />;
}
