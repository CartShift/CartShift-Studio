import { setRequestLocale } from 'next-intl/server';
import AgencySettingsClient from './AgencySettingsClient';

export default async function AgencysPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');
  return <AgencySettingsClient />;
}
