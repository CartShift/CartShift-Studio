import { redirect } from 'next/navigation';
import { resolveCanonicalRequestId } from '@/lib/services/request-aliases-server';

export default async function EditPricingPage({
  params,
}: {
  params: Promise<{ locale: string; pricingId: string }>;
}) {
  const { locale, pricingId } = await params;
  const requestId = await resolveCanonicalRequestId(pricingId);
  redirect(`/${locale}/portal/requests/${requestId}?editQuote=true`);
}
