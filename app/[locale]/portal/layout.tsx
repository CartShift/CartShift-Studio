import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
import { AnalyticsProvider } from '@/components/analytics/AnalyticsProvider';
import { setRequestLocale } from 'next-intl/server';
import { PortalProviders } from '@/components/portal/providers/PortalProviders';

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
  return (
    <>
      <GoogleAnalytics />
      <AnalyticsProvider enableScrollTracking={false}>
        <PortalProviders>
          {children}
        </PortalProviders>
      </AnalyticsProvider>
    </>
  );
}
