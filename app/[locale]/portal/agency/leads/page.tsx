import { setRequestLocale } from 'next-intl/server';
import MarketingLeadsClient from './MarketingLeadsClient';

export default async function MarketingLeadsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');
  return <MarketingLeadsClient />;
}
