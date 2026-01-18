import { setRequestLocale } from 'next-intl/server';
import EditPricingForm from './EditPricingForm';

export default async function EditPricingPage({
  params,
}: {
  params: Promise<{ locale: string; pricingId: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');
  return <EditPricingForm />;
}
