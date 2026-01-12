import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { getPortalPath } from '@/lib/utils/portal-paths';

export default async function PortalAgencyRoot({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');
  redirect(getPortalPath('/requests/', locale));
}
