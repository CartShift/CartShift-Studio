import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import PricingDetailClient from './PricingDetailClient';

export default async function PricingDetailPage({
  params,
}: {
  params: Promise<{ locale: string; pricingId: string }>;
}) {
  const { locale, pricingId } = await params;
  setRequestLocale(locale as 'en' | 'he');
  if (!pricingId || pricingId.length < 10) notFound();
  return <PricingDetailClient />;
}
