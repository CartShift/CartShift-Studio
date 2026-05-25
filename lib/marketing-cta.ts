'use client';

import { trackCTAClick } from '@/lib/analytics';

interface TrackHighIntentCtaOptions {
  ctaText: string;
  ctaLocation: string;
  intent?: string;
}

export function trackHighIntentCta({
  ctaText,
  ctaLocation,
  intent = 'project_inquiry',
}: TrackHighIntentCtaOptions) {
  trackCTAClick(ctaText, ctaLocation);

  const leadId = new URLSearchParams(window.location.search).get('lead');
  if (!leadId) return;

  fetch('/api/marketing/engagement', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ leadId, ctaText, ctaLocation, intent }),
    keepalive: true,
  }).catch(() => {
    // Analytics should never block navigation.
  });
}
