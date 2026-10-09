import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

const clients = vi.hoisted(() => new Map<string, Record<string, unknown>>());

vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: () => ({
      doc: (id: string) => ({
        create: async (data: Record<string, unknown>) => { clients.set(id, data); },
        get: async () => ({ exists: clients.has(id), data: () => clients.get(id) }),
      }),
    }),
  },
}));
vi.mock('@/lib/utils/api-rate-limit', () => ({ enforceApiRateLimit: async () => ({}) }));
vi.mock('@/lib/auth/server-auth', () => ({ getServerSession: async () => null }));

import { POST } from '@/app/api/cartshift-mcp/oauth/register/route';
import { GET } from '@/app/api/cartshift-mcp/oauth/authorize/route';

describe('CartShift Codex OAuth registration', () => {
  it('registers the desktop callback and carries the PKCE request to sign-in', async () => {
    const redirect = 'http://127.0.0.1:62237/callback/Rl9gvy_2jad-';
    const registration = await POST(new NextRequest('https://portal.cart-shift.com/api/cartshift-mcp/oauth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_name: 'Codex', redirect_uris: [redirect], token_endpoint_auth_method: 'none' }),
    }));
    expect(registration.status).toBe(201);
    const client = await registration.json();
    expect(client.redirect_uris).toEqual([redirect]);

    const params = new URLSearchParams({
      client_id: client.client_id, redirect_uri: redirect, response_type: 'code',
      code_challenge: 'a'.repeat(43), code_challenge_method: 'S256',
      resource: 'https://portal.cart-shift.com/api/cartshift-mcp/mcp',
      scope: 'clients:read work:read', state: 'codex-test-state',
    });
    const authorization = await GET(new NextRequest('https://portal.cart-shift.com/api/cartshift-mcp/oauth/authorize?' + params));
    expect(authorization.status).toBe(307);
    const login = new URL(authorization.headers.get('location')!);
    expect(login.origin + login.pathname).toBe('https://portal.cart-shift.com/en/login');
    const resume = new URL(login.searchParams.get('redirect')!, login.origin);
    expect(resume.searchParams.get('redirect_uri')).toBe(redirect);
    expect(resume.searchParams.get('code_challenge_method')).toBe('S256');
    expect(resume.searchParams.get('state')).toBe('codex-test-state');
  });
});
