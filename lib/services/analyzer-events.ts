'use client';

import { trackEvent } from '@/lib/analytics';
import { isAnalyticsConsentGranted } from '@/lib/analytics-consent';

const SESSION_KEY = 'cartshift.funnel-session.v1';

function sessionId() {
  let value = sessionStorage.getItem(SESSION_KEY);
  if (!value) {
    value = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, value);
  }
  return value;
}

type FunnelProperty = string | number | boolean | undefined;

export function trackFunnelEvent(name: string, properties: Record<string, FunnelProperty> = {}) {
  // Non-essential first-party telemetry follows the same opt-in as GA.
  // A failed or declined analytics event must never block a business action.
  if (!isAnalyticsConsentGranted()) return;
  try {
    trackEvent(name, properties);
    const payload = JSON.stringify({
      eventId: crypto.randomUUID(),
      sessionId: sessionId(),
      name,
      path: window.location.pathname,
      properties,
      occurredAt: new Date().toISOString(),
    });
    const sent = typeof navigator.sendBeacon === 'function' &&
      navigator.sendBeacon('/api/analyzer-event', new Blob([payload], { type: 'application/json' }));
    if (!sent) {
      void fetch('/api/analyzer-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => undefined);
    }
  } catch {
    // Analytics availability has no bearing on the review request or its UI.
  }
}
