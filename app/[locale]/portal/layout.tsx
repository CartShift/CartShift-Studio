import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
import { AnalyticsProvider } from '@/components/analytics/AnalyticsProvider';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { PortalProviders } from '@/components/portal/providers/PortalProviders';
import { SubdomainHandler } from '@/components/portal/SubdomainHandler';
import { BaseClientProviders } from '@/components/providers/BaseClientProviders';
import { pickClientMessages } from '@/lib/i18n/client-messages';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      'max-snippet': 0,
      'max-image-preview': 'none',
      'max-video-preview': 0,
    },
  },
};

export default async function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = locale as 'en' | 'he';

  // Enable static rendering for portal pages
  setRequestLocale(activeLocale);
  const messages = await getMessages();

  // Portal pages don't need the main site header/footer
  // They have their own PortalShell navigation
  // SubdomainHandler manages routing for portal.cart-shift.com subdomain
  return (
    <BaseClientProviders
      locale={activeLocale}
      messages={pickClientMessages(messages, ['portal', 'common'])}
    >
      <GoogleAnalytics />
      <AnalyticsProvider enableScrollTracking={false}>
        <PortalProviders>
          <SubdomainHandler>{children}</SubdomainHandler>
        </PortalProviders>
      </AnalyticsProvider>
    </BaseClientProviders>
  );
}
