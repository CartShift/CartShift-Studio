import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockCacheGet, mockCacheSet, mockCaptureMarketingLead } = vi.hoisted(() => ({
  mockCacheGet: vi.fn(),
  mockCacheSet: vi.fn(),
  mockCaptureMarketingLead: vi.fn(),
}));

vi.mock('@/lib/services/cache-service', () => ({
  CacheService: {
    get: mockCacheGet,
    set: mockCacheSet,
  },
}));

vi.mock('@/lib/services/marketing', () => ({
  captureMarketingLead: mockCaptureMarketingLead,
  normalizeMarketingEmail: (email: string) => email.trim().toLowerCase(),
}));

vi.mock('@/lib/env', () => ({
  env: {
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'demo-project',
  },
}));

import { captureStoreAnalysisLead } from '@/lib/services/store-analysis-leads';

describe('captureStoreAnalysisLead', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCacheGet.mockResolvedValue(null);
    mockCacheSet.mockResolvedValue(undefined);
    mockCaptureMarketingLead.mockResolvedValue({ success: true, leadId: 'lead-1' });
  });

  it('captures a new lead and stores a dedupe marker', async () => {
    const status = await captureStoreAnalysisLead({
      email: 'Owner@Example.com',
      storeUrl: 'https://shop.example.com/',
      locale: 'en',
      platform: 'Shopify',
      overallScore: 72,
      subscribeNewsletter: true,
    });

    expect(status).toBe('captured');
    expect(mockCaptureMarketingLead).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'Owner@Example.com',
        source: 'store_analyzer',
        skipWelcome: true,
      })
    );
    expect(mockCacheSet).toHaveBeenCalled();
  });

  it('dedupes repeated submissions within the cache window', async () => {
    mockCacheGet.mockResolvedValueOnce(true);

    const status = await captureStoreAnalysisLead({
      email: 'owner@example.com',
      storeUrl: 'https://shop.example.com',
      locale: 'en',
      overallScore: 72,
      subscribeNewsletter: false,
    });

    expect(status).toBe('deduped');
    expect(mockCaptureMarketingLead).not.toHaveBeenCalled();
  });

  it('syncs newsletter opt-in on deduped submissions', async () => {
    mockCacheGet.mockResolvedValueOnce(true);

    const status = await captureStoreAnalysisLead({
      email: 'owner@example.com',
      storeUrl: 'https://shop.example.com',
      locale: 'en',
      overallScore: 72,
      subscribeNewsletter: true,
    });

    expect(status).toBe('deduped');
    expect(mockCaptureMarketingLead).toHaveBeenCalledWith(
      expect.objectContaining({
        subscribeNewsletter: true,
        skipWelcome: true,
      })
    );
    expect(mockCacheSet).not.toHaveBeenCalled();
  });
});
