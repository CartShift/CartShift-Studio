import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
import { AnalyticsProvider } from '@/components/analytics/AnalyticsProvider';
import { setRequestLocale } from 'next-intl/server';
import { PortalProviders } from '@/components/portal/providers/PortalProviders';
import { SubdomainHandler } from '@/components/portal/SubdomainHandler';

export default async function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Enable static rendering for portal pages
  setRequestLocale(locale as 'en' | 'he');

  // Portal pages don't need the main site header/footer
  // They have their own PortalShell navigation
  // SubdomainHandler manages routing for portal.cart-shift.com subdomain
  return (
    <>
      <GoogleAnalytics />
      <AnalyticsProvider enableScrollTracking={false}>
        <PortalProviders>
          <SubdomainHandler>
            {children}
          </SubdomainHandler>
        </PortalProviders>
      </AnalyticsProvider>
    </>
  );
}
