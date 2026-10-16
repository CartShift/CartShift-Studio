'use client';

import {
  isAnalyzerIntent,
  type AnalyzerAttribution,
  type AttributionTouch,
} from '@/lib/analyzer/funnel';
import { isAnalyticsConsentGranted } from '@/lib/analytics-consent';

const STORAGE_KEY = 'cartshift.analyzer-attribution.v1';
const MAX_VALUE_LENGTH = 160;
const SAFE_VALUE = /[^a-zA-Z0-9 _.,:@/+-]/g;

export function sanitizeAttributionValue(value: string | null | undefined, max = MAX_VALUE_LENGTH) {
  const cleaned = value?.trim().replace(SAFE_VALUE, '').slice(0, max);
  return cleaned || undefined;
}

function safeReferrer() {
  // Strip query strings and fragments: referrers can contain PII or tokens.
  try {
    const url = new URL(document.referrer);
    if (!['https:', 'http:'].includes(url.protocol)) return undefined;
    return sanitizeAttributionValue(url.origin, 500);
  } catch {
    return undefined;
  }
}

function currentTouch(): AttributionTouch {
  const query = new URLSearchParams(window.location.search);
  const queryIntent = query.get('intent');
  const pathIntent = window.location.pathname.split('/').at(-1);
  const intent = isAnalyzerIntent(queryIntent)
    ? queryIntent
    : isAnalyzerIntent(pathIntent)
      ? pathIntent
      : undefined;
  return {
    landingPath: window.location.pathname.slice(0, 500),
    referrer: safeReferrer(),
    utmSource: sanitizeAttributionValue(query.get('utm_source')),
    utmMedium: sanitizeAttributionValue(query.get('utm_medium')),
    utmCampaign: sanitizeAttributionValue(query.get('utm_campaign')),
    utmContent: sanitizeAttributionValue(query.get('utm_content')),
    utmTerm: sanitizeAttributionValue(query.get('utm_term')),
    referralCode: sanitizeAttributionValue(query.get('ref') || query.get('referral')),
    partnerCode: sanitizeAttributionValue(query.get('partner')),
    intent,
    capturedAt: new Date().toISOString(),
  };
}

export function captureAnalyzerAttribution(): AnalyzerAttribution {
  const touch = currentTouch();
  if (!isAnalyticsConsentGranted()) return { firstTouch: touch, lastTouch: touch };
  let existing: AnalyzerAttribution | undefined;
  try {
    existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || undefined;
  } catch {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* storage restricted */ }
  }
  const attribution = { firstTouch: existing?.firstTouch || touch, lastTouch: touch };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(attribution)); } catch { /* storage restricted */ }
  return attribution;
}

export function getAnalyzerAttribution(): AnalyzerAttribution | undefined {
  if (!isAnalyticsConsentGranted()) return undefined;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as AnalyzerAttribution) : undefined;
  } catch {
    return undefined;
  }
}
