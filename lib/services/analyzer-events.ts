'use client';

import { trackEvent } from '@/lib/analytics';

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
  trackEvent(name, properties);
  const payload = JSON.stringify({
    eventId: crypto.randomUUID(),
    sessionId: sessionId(),
    name,
    path: window.location.pathname,
    properties,
    occurredAt: new Date().toISOString(),
  });
  if (
    !navigator.sendBeacon('/api/analyzer-event', new Blob([payload], { type: 'application/json' }))
  ) {
    void fetch('/api/analyzer-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    });
  }
}
