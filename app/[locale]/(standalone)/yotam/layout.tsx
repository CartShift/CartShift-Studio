import { getMessages, setRequestLocale } from 'next-intl/server';
import '../portfolio-v5/portfolio-v5.css';
import '../portfolio-v5/portfolio-v5-refresh.css';
import '../portfolio-v5/portfolio-v5-immersive.css';
import '../portfolio-v5/portfolio-v5-motion.css';
import PortfolioMotion from '../portfolio-v5/PortfolioMotion';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
import { AnalyticsProvider } from '@/components/analytics/AnalyticsProvider';
import { BaseClientProviders } from '@/components/providers/BaseClientProviders';
import { pickClientMessages } from '@/lib/i18n/client-messages';

export default async function YotamLayout({
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
      <AnalyticsProvider><PortfolioMotion>{children}</PortfolioMotion></AnalyticsProvider>
    </BaseClientProviders>
  );
}
