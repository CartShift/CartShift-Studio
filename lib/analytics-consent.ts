'use client';

/**
 * Minimal opt-in gate shared by Google Analytics and non-essential first-party
 * funnel telemetry. This is not a substitute for a full privacy review.
 */
export const COOKIE_CONSENT_KEY = 'cookie_consent';
export const CONSENT_CHANGED_EVENT = 'cartshift:consent-changed';
export const OPEN_COOKIE_PREFERENCES_EVENT = 'cartshift:open-cookie-preferences';

export type CookieConsentValue = 'accepted' | 'declined';

export function readCookieConsent(): CookieConsentValue | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    return saved === 'accepted' || saved === 'declined' ? saved : null;
  } catch {
    // Browsers may disable storage. Tracking must fail closed.
    return null;
  }
}

export function isAnalyticsConsentGranted(): boolean {
  return readCookieConsent() === 'accepted';
}

export function setCookieConsent(value: CookieConsentValue): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, value);
    window.dispatchEvent(new Event(CONSENT_CHANGED_EVENT));
    return true;
  } catch {
    return false;
  }
}

/** Reopen the existing consent choices without overwriting the saved preference. */
export function openCookiePreferences(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(OPEN_COOKIE_PREFERENCES_EVENT));
}
