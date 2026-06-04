import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '@/app/api/marketing/click/route';
import { trackMarketingEmailClick } from '@/lib/services/marketing';

vi.mock('@/lib/services/marketing', () => ({
  trackMarketingEmailClick: vi.fn(async () => ({ success: true })),
}));

const mockedTrackClick = vi.mocked(trackMarketingEmailClick);

function requestFor(url: string) {
  return new NextRequest(url);
}

describe('/api/marketing/click', () => {
  beforeEach(() => {
    mockedTrackClick.mockClear();
  });

  it('tracks valid click tokens and redirects to CartShift targets', async () => {
    const response = await GET(
      requestFor(
        'https://cart-shift.com/api/marketing/click?leadId=lead-1&jobId=job-1&token=token-1&target=https%3A%2F%2Fcart-shift.com%2Fen%2Fcontact'
      )
    );

    expect(response.headers.get('location')).toBe('https://cart-shift.com/en/contact');
    expect(mockedTrackClick).toHaveBeenCalledWith({
      leadId: 'lead-1',
      jobId: 'job-1',
      token: 'token-1',
      targetUrl: 'https://cart-shift.com/en/contact',
    });
  });

  it('blocks open redirects and falls back to the contact page', async () => {
    const response = await GET(
      requestFor(
        'https://cart-shift.com/api/marketing/click?leadId=lead-1&token=token-1&target=https%3A%2F%2Fevil.example%2Fcapture'
      )
    );

    expect(response.headers.get('location')).toBe('https://cart-shift.com/en/contact');
    expect(mockedTrackClick).toHaveBeenCalledWith({
      leadId: 'lead-1',
      jobId: undefined,
      token: 'token-1',
      targetUrl: 'https://cart-shift.com/en/contact',
    });
  });

  it('does not call tracking without a lead id and token', async () => {
    const response = await GET(
      requestFor('https://cart-shift.com/api/marketing/click?target=https%3A%2F%2Fcart-shift.com')
    );

    expect(response.headers.get('location')).toBe('https://cart-shift.com/');
    expect(mockedTrackClick).not.toHaveBeenCalled();
  });
});
