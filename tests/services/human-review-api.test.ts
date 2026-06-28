import { afterEach, describe, expect, it, vi } from 'vitest';
import { submitHumanReview } from '@/lib/services/human-review-api';

describe('human review API client', () => {
  afterEach(() => vi.restoreAllMocks());
  it('submits analysis context and consent without requiring a booking', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ success: true, requestId: 'secure-id' }), { status: 200 })
      );
    const result = await submitHumanReview({
      email: 'owner@example.com',
      storeUrl: 'https://store.test',
      locale: 'en',
      primaryIssue: 'speed',
      anonymousInsightConsent: false,
      namedStoreConsent: false,
      consentVersion: '2026-06-28',
      website: '',
    });
    expect(result.requestId).toBe('secure-id');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/human-review',
      expect.objectContaining({ method: 'POST' })
    );
  });
});
