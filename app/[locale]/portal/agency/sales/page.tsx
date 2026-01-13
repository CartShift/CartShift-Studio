import { setRequestLocale } from 'next-intl/server';
import SalesDashboardClient from './SalesDashboardClient';

export default async function SalesDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');
  return <SalesDashboardClient />;
}
