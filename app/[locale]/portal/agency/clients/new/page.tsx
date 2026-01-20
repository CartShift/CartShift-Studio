import { setRequestLocale } from 'next-intl/server';
import CreateClientClient from './CreateClientClient';

export default async function CreateClientPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');
  return <CreateClientClient />;
}
