import { setRequestLocale } from 'next-intl/server';
import PricingDetailClient from './PricingDetailClient';

export default async function PricingDetailPage({
  params,
}: {
  params: Promise<{ locale: string; pricingId: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');
  return <PricingDetailClient />;
}
