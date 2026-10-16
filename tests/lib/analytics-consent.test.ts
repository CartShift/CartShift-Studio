// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CONSENT_CHANGED_EVENT,
  isAnalyticsConsentGranted,
  readCookieConsent,
  setCookieConsent,
} from '@/lib/analytics-consent';

describe('analytics consent gate', () => {
  beforeEach(() => localStorage.clear());

  it('defaults to denied until a visitor accepts', () => {
    expect(readCookieConsent()).toBeNull();
    expect(isAnalyticsConsentGranted()).toBe(false);
  });

  it('notifies clients on acceptance and closes again on decline', () => {
    const onChanged = vi.fn();
    window.addEventListener(CONSENT_CHANGED_EVENT, onChanged);
    expect(setCookieConsent('accepted')).toBe(true);
    expect(isAnalyticsConsentGranted()).toBe(true);
    expect(setCookieConsent('declined')).toBe(true);
    expect(isAnalyticsConsentGranted()).toBe(false);
    expect(onChanged).toHaveBeenCalledTimes(2);
    window.removeEventListener(CONSENT_CHANGED_EVENT, onChanged);
  });

  it('fails closed for unknown stored values', () => {
    localStorage.setItem('cookie_consent', 'unknown');
    expect(readCookieConsent()).toBeNull();
    expect(isAnalyticsConsentGranted()).toBe(false);
  });
});
