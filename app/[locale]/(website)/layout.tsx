import { getMessages, setRequestLocale } from 'next-intl/server';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
import { AnalyticsProvider } from '@/components/analytics/AnalyticsProvider';
import { MainLayout } from '@/components/layout/MainLayout';
import { BaseClientProviders } from '@/components/providers/BaseClientProviders';
import { GeoLocaleRedirect } from '@/components/providers/GeoLocaleRedirect';
import { pickWebsiteMessages } from '@/lib/i18n/client-messages';
import { generateOrganizationSchema } from '@/lib/seo';

export default async function WebsiteLayout({
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
  const schemaJson = JSON.stringify(generateOrganizationSchema());

  return (
    <>
      <script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: schemaJson }}
      />
      <BaseClientProviders locale={activeLocale} messages={pickWebsiteMessages(messages)}>
        <GeoLocaleRedirect />
        <GoogleAnalytics />
        <AnalyticsProvider>
          <MainLayout>{children}</MainLayout>
        </AnalyticsProvider>
      </BaseClientProviders>
    </>
  );
}
