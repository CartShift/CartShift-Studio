import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from '@/app/api/marketing/unsubscribe/route';
import { unsubscribeMarketingLead } from '@/lib/services/marketing';

vi.mock('@/lib/services/marketing', () => ({
  unsubscribeMarketingLead: vi.fn(async () => ({ success: true })),
}));

const mockedUnsubscribe = vi.mocked(unsubscribeMarketingLead);

describe('/api/marketing/unsubscribe', () => {
  beforeEach(() => {
    mockedUnsubscribe.mockClear();
    mockedUnsubscribe.mockResolvedValue({ success: true });
  });

  it('supports browser unsubscribe links and preserves locale', async () => {
    const response = await GET(
      new NextRequest(
        'https://cart-shift.com/api/marketing/unsubscribe?leadId=lead-1&token=token-1&locale=he'
      )
    );

    expect(response.headers.get('location')).toBe('https://cart-shift.com/he?unsubscribe=success');
    expect(mockedUnsubscribe).toHaveBeenCalledWith({ leadId: 'lead-1', token: 'token-1' });
  });

  it('supports RFC 8058 one-click unsubscribe posts', async () => {
    const response = await POST(
      new NextRequest(
        'https://cart-shift.com/api/marketing/unsubscribe?leadId=lead-1&token=token-1',
        { method: 'POST', body: 'List-Unsubscribe=One-Click' }
      )
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(mockedUnsubscribe).toHaveBeenCalledWith({ leadId: 'lead-1', token: 'token-1' });
  });

  it('rejects malformed one-click unsubscribe links', async () => {
    const response = await POST(
      new NextRequest('https://cart-shift.com/api/marketing/unsubscribe', { method: 'POST' })
    );

    expect(response.status).toBe(400);
    expect(mockedUnsubscribe).not.toHaveBeenCalled();
  });
});
