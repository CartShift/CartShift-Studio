import { createHash } from 'node:crypto';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = vi.hoisted(() => new Map<string, Record<string, unknown>>());
const session = vi.hoisted(() => ({ uid: 'test-agency-user', email: 'agency@example.test' }));

vi.mock('@/lib/firebase-admin', () => {
  const doc = (key: string) => ({
    key,
    create: async (value: Record<string, unknown>) => { store.set(key, value); },
    get: async () => ({ exists: store.has(key), data: () => store.get(key) }),
  });
  return { adminDb: {
    collection: (name: string) => ({ doc: (id: string) => doc(name + '/' + id) }),
    runTransaction: async (fn: (tx: unknown) => unknown) => fn({
      get: (ref: ReturnType<typeof doc>) => ref.get(),
      delete: (ref: ReturnType<typeof doc>) => { store.delete(ref.key); },
    }),
    batch: () => ({
      create: (ref: ReturnType<typeof doc>, value: Record<string, unknown>) => { store.set(ref.key, value); },
      commit: async () => {},
    }),
  } };
});
vi.mock('@/lib/auth/server-auth', () => ({ getServerSession: async () => session }));
vi.mock('@/lib/utils/api-rate-limit', () => ({ enforceApiRateLimit: async () => ({}) }));

import { POST as register } from '@/app/api/cartshift-mcp/oauth/register/route';
import { GET as consentPage, POST as consent } from '@/app/api/cartshift-mcp/oauth/authorize/route';
import { POST as exchange } from '@/app/api/cartshift-mcp/oauth/token/route';
import { POST as mcp } from '@/app/api/cartshift-mcp/mcp/route';

const origin = 'https://portal.cart-shift.com';
const resource = origin + '/api/cartshift-mcp/mcp';
const verifier = 'v'.repeat(43);

async function openConsent() {
  const response = await register(new NextRequest(origin + '/api/cartshift-mcp/oauth/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ redirect_uris: ['http://127.0.0.1:53005/callback'] }),
  }));
  expect(response.status).toBe(201);
  const client = await response.json();
  const params = new URLSearchParams({
    client_id: client.client_id, redirect_uri: client.redirect_uris[0], response_type: 'code',
    resource, scope: 'clients:read work:read offline_access', state: 'state-with-&-and-"-chars',
    code_challenge: createHash('sha256').update(verifier).digest('base64url'), code_challenge_method: 'S256',
  });
  const page = await consentPage(new NextRequest(origin + '/api/cartshift-mcp/oauth/authorize?' + params));
  expect(page.status).toBe(200);
  const html = await page.text();
  const fields = new URLSearchParams();
  for (const match of html.matchAll(/<input type="hidden" name="([^"]+)" value="([^"]*)">/g)) {
    const value = match[2].replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    fields.set(match[1], value);
  }
  fields.set('decision', 'allow');
  const cookie = page.headers.get('set-cookie')!.split(';')[0];
  return { fields, cookie, client };
}

function submit(fields: URLSearchParams, cookie: string) {
  return consent(new NextRequest(origin + '/api/cartshift-mcp/oauth/authorize', {
    method: 'POST', headers: { Origin: origin, Cookie: cookie, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: fields.toString(),
  }));
}

beforeEach(() => {
  store.clear();
  store.set('portal_users/' + session.uid, { accountType: 'AGENCY', agencyRole: 'owner', status: 'active' });
});

describe('CartShift complete OAuth consent flow', () => {
  it('submits the rendered form, exchanges the code once and discovers authenticated MCP tools', async () => {
    const { fields, cookie, client } = await openConsent();
    const approved = await submit(fields, cookie);
    expect(approved.status).toBe(303);
    const callback = new URL(approved.headers.get('location')!);
    expect(callback.searchParams.get('iss')).toBe(origin);
    expect(callback.searchParams.get('state')).toBe('state-with-&-and-"-chars');
    const tokenBody = new URLSearchParams({
      grant_type: 'authorization_code', client_id: client.client_id,
      redirect_uri: client.redirect_uris[0], resource, code_verifier: verifier,
      code: callback.searchParams.get('code')!,
    });
    const tokenRequest = () => new NextRequest(origin + '/api/cartshift-mcp/oauth/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: tokenBody.toString(),
    });
    const issued = await exchange(tokenRequest());
    expect(issued.status).toBe(200);
    const token = await issued.json();
    const tools = await mcp(new Request(resource, {
      method: 'POST', headers: { Authorization: 'Bearer ' + token.access_token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
    }));
    expect(tools.status).toBe(200);
    expect((await tools.json()).result.tools.some((tool: { name: string }) => tool.name === 'list_clients')).toBe(true);
    expect((await exchange(tokenRequest())).status).toBe(400);
  });

  it('rejects a consent POST missing its security cookie', async () => {
    const { fields } = await openConsent();
    const response = await submit(fields, '');
    expect(response.status).toBe(400);
    expect(await response.text()).toContain('missing verification cookie');
  });

  it('rejects a consent POST whose security cookie does not match the rendered form', async () => {
    const { fields } = await openConsent();
    const response = await submit(fields, 'cartshift_mcp_csrf=other-value');
    expect(response.status).toBe(400);
    expect(await response.text()).toContain('verification cookie mismatch');
  });

  it('distinguishes invalid authorization fields from a missing cookie', async () => {
    const { fields, cookie } = await openConsent();
    fields.set('resource', 'https://evil.example/mcp');
    const response = await submit(fields, cookie);
    expect(response.status).toBe(400);
    expect(await response.text()).toContain('invalid authorization details');
  });
});
