'use client';

import { trackCTAClick } from '@/lib/analytics';

interface TrackHighIntentCtaOptions {
  ctaText: string;
  ctaLocation: string;
  intent?: string;
  source?: 'blog_cta' | 'service_page_cta';
}

const LOCATION_SOURCE_MAP: Record<string, 'blog_cta' | 'service_page_cta'> = {
  blog_post_footer: 'blog_cta',
  shopify_local_trust: 'service_page_cta',
  shopify_cta: 'service_page_cta',
  wordpress_cta: 'service_page_cta',
  cta_banner: 'service_page_cta',
};

export function trackHighIntentCta({
  ctaText,
  ctaLocation,
  intent = 'project_inquiry',
  source,
}: TrackHighIntentCtaOptions) {
  trackCTAClick(ctaText, ctaLocation);

  const leadId = new URLSearchParams(window.location.search).get('lead');
  const resolvedSource = source || LOCATION_SOURCE_MAP[ctaLocation];

  if (!leadId) return;

  fetch('/api/marketing/engagement', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      leadId,
      ctaText,
      ctaLocation,
      intent,
      source: resolvedSource,
    }),
    keepalive: true,
  }).catch(() => {
    // Analytics should never block navigation.
  });
}
