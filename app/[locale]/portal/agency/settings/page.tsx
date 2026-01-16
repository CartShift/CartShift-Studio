import { setRequestLocale } from 'next-intl/server';
import AgencysClient from './AgencysClient';

export default async function AgencysPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');
  return <AgencysClient />;
}
