import { setRequestLocale, getTranslations } from 'next-intl/server';
import { PortalHelpClient } from '@/components/portal/help/PortalHelpClient';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as 'en' | 'he',
    namespace: 'portal.help',
  });
  return { title: `${t('title')} | CartShift Portal` };
}

export default async function HelpPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');
  return <PortalHelpClient />;
}
