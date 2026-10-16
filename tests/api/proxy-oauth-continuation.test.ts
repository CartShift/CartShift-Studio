import { describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { proxy } from '@/proxy';

vi.mock('next-intl/middleware', () => ({ default: () => () => NextResponse.next() }));

describe('portal login with an existing cookie', () => {
  function request(redirect?: string) {
    const url = new URL('https://portal.cart-shift.com/en/login/');
    if (redirect) url.searchParams.set('redirect', redirect);
    return new NextRequest(url, { headers: { host: url.host, cookie: '__session=possibly-stale' } });
  }
  it('preserves an MCP OAuth continuation so the user can renew a stale session', () => {
    const response = proxy(request('/api/cartshift-mcp/oauth/authorize?client_id=test'));
    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
    expect(response.headers.get('x-middleware-rewrite')).toContain('/en/portal/login/');
  });
  it('still redirects an ordinary authenticated login away from the login page', () => {
    const response = proxy(request());
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://portal.cart-shift.com/en/');
  });
  it('does not treat arbitrary redirect URLs as MCP continuations', () => {
    const response = proxy(request('https://untrusted.example/api/cartshift-mcp/oauth/authorize?client_id=test'));
    expect(response.status).toBe(307);
  });
});
