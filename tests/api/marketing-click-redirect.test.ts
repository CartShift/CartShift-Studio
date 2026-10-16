import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const track = vi.hoisted(() => vi.fn(async () => ({ success: true })));
vi.mock('@/lib/services/marketing', () => ({ trackMarketingEmailClick: track }));
import { GET } from '@/app/api/marketing/click/route';

function request(target: string) {
  const url = new URL('https://cart-shift.com/api/marketing/click');
  url.searchParams.set('leadId', 'lead-1');
  url.searchParams.set('token', 'sample');
  url.searchParams.set('target', target);
  return new NextRequest(url);
}

describe('marketing email link redirects', () => {
  it.each([
    'http://cart-shift.com/en/work',
    'http://www.cart-shift.com/en/work',
    'https://user:password@cart-shift.com/en/work',
    'https://cart-shift.com.evil.example/en/work',
    'javascript:alert(1)',
    'https://evil.example/en/work',
  ])('rejects unsafe target %s', async target => {
    const response = await GET(request(target));
    expect(response.headers.get('location')).toBe('https://cart-shift.com/en/contact');
    expect(response.status).toBe(307);
  });
  it('permits genuine secure site links', async () => {
    const response = await GET(request('https://www.cart-shift.com/he/contact?source=email'));
    expect(response.headers.get('location')).toBe('https://www.cart-shift.com/he/contact?source=email');
  });
});
