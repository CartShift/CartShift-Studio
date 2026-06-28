// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { captureAnalyzerAttribution } from '@/lib/services/analyzer-attribution';

describe('analyzer attribution', () => {
  beforeEach(() => localStorage.clear());
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
});
