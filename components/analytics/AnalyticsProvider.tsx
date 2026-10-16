'use client';

import { useEffect } from 'react';
import {
  useScrollDepthTracking,
  useOutboundLinkTracking,
  useEngagementTracking,
} from '@/lib/hooks/useAnalytics';
import { trackError } from '@/lib/analytics';
import { CONSENT_CHANGED_EVENT, isAnalyticsConsentGranted } from '@/lib/analytics-consent';
import { captureAnalyzerAttribution } from '@/lib/services/analyzer-attribution';

interface AnalyticsProviderProps {
  children: React.ReactNode;
  enableScrollTracking?: boolean;
  enableOutboundTracking?: boolean;
  enableEngagementTracking?: boolean;
  enableErrorTracking?: boolean;
}

export function AnalyticsProvider({
  children,
  enableScrollTracking = true,
  enableOutboundTracking = true,
  enableEngagementTracking = true,
  enableErrorTracking = true,
}: AnalyticsProviderProps) {
  useScrollDepthTracking(enableScrollTracking);
  useOutboundLinkTracking(enableOutboundTracking);
  useEngagementTracking(enableEngagementTracking);

  // Record the actual acquisition landing page rather than first touching the
  // visitor only when they later reach the review form. Consent is required.
  useEffect(() => {
    const capture = () => {
      if (!isAnalyticsConsentGranted()) return;
      if (/^\/(?:en|he)\/portal(?:\/|$)/.test(window.location.pathname)) return;
      captureAnalyzerAttribution();
    };
    capture();
    window.addEventListener(CONSENT_CHANGED_EVENT, capture);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, capture);
  }, []);

  useEffect(() => {
    if (!enableErrorTracking) return;

    const handleError = (event: ErrorEvent) => {
      trackError(event.message, event.filename);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      trackError(String(event.reason), 'unhandled_promise');
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [enableErrorTracking]);

  return <>{children}</>;
}
