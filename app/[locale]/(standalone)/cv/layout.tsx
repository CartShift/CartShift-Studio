import { getMessages, setRequestLocale } from 'next-intl/server';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
import { AnalyticsProvider } from '@/components/analytics/AnalyticsProvider';
import { BaseClientProviders } from '@/components/providers/BaseClientProviders';
import { pickClientMessages } from '@/lib/i18n/client-messages';

export default async function CvLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = locale as 'en' | 'he';
  setRequestLocale(activeLocale);
  const messages = await getMessages();

  return (
    <BaseClientProviders
      locale={activeLocale}
      messages={pickClientMessages(messages, ['cv', 'common', 'portal'])}
    >
      <GoogleAnalytics />
      <AnalyticsProvider>{children}</AnalyticsProvider>
    </BaseClientProviders>
  );
}
