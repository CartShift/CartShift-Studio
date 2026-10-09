import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/firebase-admin', () => ({ adminDb: null }));

import {
  MCP_RESOURCE, constantEquals, getOAuthClient, redirectAllowed, validScopes, wantsResource,
} from '@/lib/mcp/connection';

describe('CartShift MCP OAuth guardrails', () => {
  it('accepts the Codex desktop loopback callback with an ephemeral port', () => {
    expect(redirectAllowed('http://127.0.0.1:53005/callback')).toBe(true);
    expect(redirectAllowed('http://127.0.0.1:62237/callback/Rl9gvy_2jad-')).toBe(true);
    expect(redirectAllowed('http://127.0.0.1:49152/callback/AbCdEf0123_-')).toBe(true);
  });

  it.each([
    'http://127.0.0.1.evil.example:62237/callback/Rl9gvy_2jad-',
    'http://192.168.1.2:62237/callback/Rl9gvy_2jad-',
    'http://0.0.0.0:62237/callback/Rl9gvy_2jad-',
    'http://localhost:62237/callback/Rl9gvy_2jad-',
    'https://127.0.0.1:62237/callback/Rl9gvy_2jad-',
    'http://127.0.0.1/callback/Rl9gvy_2jad-',
    'http://user:password@127.0.0.1:62237/callback/Rl9gvy_2jad-',
    'http://127.0.0.1:62237/elsewhere/Rl9gvy_2jad-',
    'http://127.0.0.1:62237/callback/short',
    'http://127.0.0.1:53005/callback/',
    'http://127.0.0.1:53005/callback?next=https://evil.example',
    'http://127.0.0.1:53005/callback#token',
    'http://127.0.0.1/callback',
    'http://127.0.0.1.evil.example:53005/callback',
    'http://127.0.0.1:62237/callback/Rl9gvy_2jad-/extra',
    'http://127.0.0.1:62237/callback/Rl9gvy_2jad-?next=https://evil.example',
    'http://127.0.0.1:62237/callback/Rl9gvy_2jad-#token',
  ])('rejects destinations outside the Codex callback contract: %s', redirect => {
    expect(redirectAllowed(redirect)).toBe(false);
  });

  it('only registers ChatGPT HTTPS OAuth callback destinations', () => {
    expect(redirectAllowed('https://chatgpt.com/connector_platform_oauth_redirect')).toBe(true);
    expect(redirectAllowed('https://chatgpt.com/connector/oauth/callback-123')).toBe(true);
    expect(redirectAllowed('https://evil.example/connector/oauth/callback-123')).toBe(false);
    expect(redirectAllowed('https://chatgpt.com.evil.example/connector/oauth/a')).toBe(false);
    expect(redirectAllowed('https://chatgpt.com@evil.example/connector/oauth/a')).toBe(false);
    expect(redirectAllowed('http://chatgpt.com/connector/oauth/a')).toBe(false);
    expect(redirectAllowed('https://chatgpt.com/elsewhere')).toBe(false);
    expect(redirectAllowed('https://chatgpt.com/connector/oauth/a#token')).toBe(false);
  });

  it('only permits known scopes and rejects unknown ones', () => {
    expect(validScopes('clients:read work:write')).toEqual(['clients:read', 'work:write']);
    expect(validScopes('clients:read clients:read')).toEqual(['clients:read']);
    expect(validScopes('admin:*')).toBeNull();
    expect(validScopes('')).toBeNull();
  });

  it('only issues tokens for the exact MCP resource', () => {
    expect(wantsResource(MCP_RESOURCE)).toBe(true);
    expect(wantsResource('https://cart-shift.com')).toBe(false);
    expect(wantsResource(null)).toBe(false);
  });

  it('compares CSRF values without accepting different values', () => {
    expect(constantEquals('secure-value', 'secure-value')).toBe(true);
    expect(constantEquals('secure-value', 'other-value')).toBe(false);
  });

  it('does not query Firestore for invalid client IDs', async () => {
    expect(await getOAuthClient('../../portal_organizations')).toBeNull();
  });
});
