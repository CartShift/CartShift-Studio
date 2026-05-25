import { describe, expect, it } from 'vitest';
import { validateAnalyzeStoreRequest } from '@/lib/validation';

describe('validateAnalyzeStoreRequest', () => {
  it('accepts a valid analyzer payload', () => {
    const result = validateAnalyzeStoreRequest({
      storeUrl: 'https://shop.example.com',
      email: 'owner@example.com',
      subscribeNewsletter: true,
      locale: 'en',
      captchaToken: 'token',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('owner@example.com');
      expect(result.data.subscribeNewsletter).toBe(true);
    }
  });

  it('rejects invalid email addresses', () => {
    const result = validateAnalyzeStoreRequest({
      storeUrl: 'https://shop.example.com',
      email: 'not-an-email',
    });

    expect(result.success).toBe(false);
  });

  it('rejects missing store URLs', () => {
    const result = validateAnalyzeStoreRequest({
      storeUrl: '',
      email: 'owner@example.com',
    });

    expect(result.success).toBe(false);
  });

  it('defaults optional fields', () => {
    const result = validateAnalyzeStoreRequest({
      storeUrl: 'https://shop.example.com',
      email: 'owner@example.com',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.subscribeNewsletter).toBe(false);
      expect(result.data.locale).toBe('en');
    }
  });

  it('accepts Hebrew locale', () => {
    const result = validateAnalyzeStoreRequest({
      storeUrl: 'https://shop.example.com',
      email: 'owner@example.com',
      locale: 'he',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.locale).toBe('he');
    }
  });
});
