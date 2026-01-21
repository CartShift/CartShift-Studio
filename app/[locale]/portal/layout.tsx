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
      {/* TEMP BUILD TEST - DELETE AFTER CONFIRMING */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 99999,
          background: 'red',
          color: 'white',
          padding: '10px',
          textAlign: 'center',
          fontWeight: 'bold',
        }}
      >
        BUILD: JAN-21-2026-V2
      </div>
      <GoogleAnalytics />
      <AnalyticsProvider enableScrollTracking={false}>
        <PortalProviders>
          <SubdomainHandler>{children}</SubdomainHandler>
        </PortalProviders>
      </AnalyticsProvider>
    </>
  );
}
