import { setRequestLocale } from 'next-intl/server';
import NewRequestClient from './NewRequestClient';

export default async function NewRequestPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');
  return <NewRequestClient />;
}
