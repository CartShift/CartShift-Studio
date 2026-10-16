import { afterEach, describe, expect, it } from 'vitest';
import { validateGoogleRedirectUri } from '@/lib/services/google-calendar-redirect';

describe('Google Calendar OAuth redirect allowlist', () => {
  const originalEnv = process.env.GOOGLE_OAUTH_ALLOWED_ORIGINS;
  afterEach(() => {
    if (originalEnv === undefined) delete process.env.GOOGLE_OAUTH_ALLOWED_ORIGINS;
    else process.env.GOOGLE_OAUTH_ALLOWED_ORIGINS = originalEnv;
  });

  it.each([
    'https://cart-shift.com/portal/oauth-callback',
    'https://portal.cart-shift.com/portal/oauth-callback',
    'https://www.cart-shift.com/portal/oauth-callback',
  ])('allows trusted production callback %s', url => {
    expect(validateGoogleRedirectUri(url)).toBe(true);
  });

  it.each([
    'https://evil.example/portal/oauth-callback',
    'https://cart-shift.com.evil.example/portal/oauth-callback',
    'https://cart-shift.com/other',
    'https://cart-shift.com/portal/oauth-callback?code=foo',
    'https://u:p@cart-shift.com/portal/oauth-callback',
    'javascript:alert(1)',
  ])('rejects invalid or untrusted callback %s', url => {
    expect(validateGoogleRedirectUri(url)).toBe(false);
  });

  it('accepts an explicit server-side staging origin but no arbitrary hosts', () => {
    process.env.GOOGLE_OAUTH_ALLOWED_ORIGINS = 'https://staging.cart-shift.com';
    expect(validateGoogleRedirectUri('https://staging.cart-shift.com/portal/oauth-callback')).toBe(true);
    expect(validateGoogleRedirectUri('https://arbitrary.vercel.app/portal/oauth-callback')).toBe(false);
  });
});
