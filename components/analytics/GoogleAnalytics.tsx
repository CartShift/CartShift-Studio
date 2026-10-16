'use client';

import { GoogleAnalytics as NextGoogleAnalytics, sendGAEvent } from '@next/third-parties/google';
import { useEffect, useState } from 'react';
import { CONSENT_CHANGED_EVENT, isAnalyticsConsentGranted } from '@/lib/analytics-consent';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export function GoogleAnalytics() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const refresh = () => setEnabled(isAnalyticsConsentGranted());
    refresh();
    window.addEventListener(CONSENT_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, refresh);
  }, []);
  if (!GA_ID || !enabled) return null;
  return <NextGoogleAnalytics gaId={GA_ID} />;
}

export function trackEvent(eventName: string, params?: Record<string, string | number | boolean>) {
  if (!GA_ID || !isAnalyticsConsentGranted()) return;
  sendGAEvent('event', eventName, params ?? {});
}

export function trackFormSubmission(formName: string) {
  trackEvent('form_submit', { form_name: formName, engagement_type: 'lead' });
}

export function trackPageView(path: string, title?: string) {
  trackEvent('page_view', { page_path: path, page_title: title ?? '' });
}

export function trackClick(elementName: string, section?: string) {
  trackEvent('click', { element: elementName, section: section ?? 'general' });
}

export function trackConversion(conversionType: string, value?: number) {
  trackEvent('conversion', { type: conversionType, value: value ?? 0 });
}
