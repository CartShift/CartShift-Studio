import { setRequestLocale } from 'next-intl/server';
import ProspectsClient from './ProspectsClient';

export default async function ProspectsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');
  return <ProspectsClient />;
}
