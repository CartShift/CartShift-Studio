import { setRequestLocale } from 'next-intl/server';
import ProfitSplitsClient from './ProfitSplitsClient';

export default async function ProfitSplitsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');
  return <ProfitSplitsClient />;
}
