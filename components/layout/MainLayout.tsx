import React from 'react';
import { useLocale } from 'next-intl';
import { Header } from './Header';
import { Footer } from './Footer';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { FloatingActions } from '@/components/ui/FloatingActions';
import { ExitIntentModal } from '@/components/ui/ExitIntentModal';
import { CookieConsent } from '@/components/ui/CookieConsent';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const locale = useLocale();
  const skipLabel = locale === 'de' ? 'Zum Hauptinhalt springen' : locale === 'he' ? 'דלג לתוכן הראשי' : 'Skip to main content';

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen flex-col overflow-x-hidden">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:start-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-lg"
        >
          {skipLabel}
        </a>
        <Header />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
        <FloatingActions />
        <ExitIntentModal delay={5000} />
        <CookieConsent />
      </div>
    </ErrorBoundary>
  );
};
