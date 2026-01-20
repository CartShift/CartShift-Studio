import { setRequestLocale } from 'next-intl/server';
import AgencyWorkboardClient from './AgencyWorkboardClient';

export const dynamic = 'force-static';

export default async function AgencyWorkboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');
  return <AgencyWorkboardClient />;
}
