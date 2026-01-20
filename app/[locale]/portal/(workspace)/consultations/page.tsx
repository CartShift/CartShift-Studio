import { setRequestLocale } from 'next-intl/server';
import ConsultationsClient from './ConsultationsClient';

export default async function ConsultationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');
  return <ConsultationsClient />;
}
