import { afterEach, describe, expect, it, vi } from 'vitest';
import { verifyRecaptchaToken } from '@/lib/services/recaptcha-server';

describe('store analyzer reCAPTCHA v3 verification', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('rejects mismatched action and weak bot scores', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, action: 'contact', score: 0.99 }), { status: 200 })
    ));
    expect(await verifyRecaptchaToken('token', 'secret')).toBe(false);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, action: 'analyze_store', score: 0.1 }), { status: 200 })
    ));
    expect(await verifyRecaptchaToken('token', 'secret')).toBe(false);
  });

  it('accepts a valid v3 analysis token', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        success: true, action: 'analyze_store', score: 0.9, hostname: 'cart-shift.com',
      }), { status: 200 })
    ));
    expect(await verifyRecaptchaToken('token', 'secret')).toBe(true);
  });

  it('fails closed on malformed or failed Google verification', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));
    expect(await verifyRecaptchaToken('token', 'secret')).toBe(false);
    expect(await verifyRecaptchaToken('', 'secret')).toBe(false);
  });
});
