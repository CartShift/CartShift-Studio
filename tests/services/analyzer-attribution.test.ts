// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { captureAnalyzerAttribution, getAnalyzerAttribution } from '@/lib/services/analyzer-attribution';

describe('analyzer attribution', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('cookie_consent', 'accepted');
  });
  it('preserves first touch while updating last touch', () => {
    window.history.replaceState({}, '', '/en/tools/store-analyzer?utm_source=google&ref=agency');
    const first = captureAnalyzerAttribution();
    window.history.replaceState({}, '', '/en/tools/store-analyzer/seo?utm_source=newsletter');
    const second = captureAnalyzerAttribution();
    expect(second.firstTouch).toEqual(first.firstTouch);
    expect(second.firstTouch.utmSource).toBe('google');
    expect(second.lastTouch.utmSource).toBe('newsletter');
    expect(second.lastTouch.intent).toBe('seo');
  });
  it('does not persist attribution without consent', () => {
    localStorage.setItem('cookie_consent', 'declined');
    const touch = captureAnalyzerAttribution();
    expect(touch.firstTouch).toEqual(touch.lastTouch);
    expect(getAnalyzerAttribution()).toBeUndefined();
    expect(localStorage.getItem('cartshift.analyzer-attribution.v1')).toBeNull();
  });
});
