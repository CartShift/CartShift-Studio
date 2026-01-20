import { setRequestLocale } from 'next-intl/server';
import PortalRootClient from './PortalRootClient';

export default async function PortalRoot({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');
  return <PortalRootClient />;
}
