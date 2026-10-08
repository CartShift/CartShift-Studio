import 'server-only';

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { adminDb } from '@/lib/firebase-admin';

export const MCP_ORIGIN = 'https://portal.cart-shift.com';
export const MCP_RESOURCE = MCP_ORIGIN + '/api/cartshift-mcp/mcp';
export const MCP_SCOPES = ['clients:read', 'clients:write', 'work:read', 'work:write'] as const;
export type McpScope = (typeof MCP_SCOPES)[number];

export const CLIENTS = 'cartshift_mcp_oauth_clients';
export const CODES = 'cartshift_mcp_oauth_codes';
export const TOKENS = 'cartshift_mcp_oauth_tokens';
export const REFRESH = 'cartshift_mcp_oauth_refresh';
export const AUDIT = 'cartshift_mcp_audit';

export function firestore() {
  if (!adminDb) throw new Error('ADMIN_NOT_CONFIGURED');
  return adminDb;
}

export function randomToken(): string {
  return randomBytes(32).toString('base64url');
}

export function tokenHash(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

export function constantEquals(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function redirectAllowed(redirect: string): boolean {
  try {
    const url = new URL(redirect);
    return (
      url.protocol === 'https:' &&
      url.hostname === 'chatgpt.com' &&
      !url.username &&
      !url.password &&
      !url.hash &&
      !url.port &&
      (url.pathname.startsWith('/connector/oauth/') ||
        url.pathname === '/connector_platform_oauth_redirect')
    );
  } catch {
    return false;
  }
}

export function validScopes(value: string): McpScope[] | null {
  const scopes = value.trim().split(/\s+/).filter(Boolean);
  if (!scopes.length || scopes.some(scope => !(MCP_SCOPES as readonly string[]).includes(scope))) {
    return null;
  }
  return [...new Set(scopes)] as McpScope[];
}

export function wantsResource(resource: string | null): boolean {
  return resource === MCP_RESOURCE;
}

export interface OAuthClient {
  clientId: string;
  redirectUris: string[];
  createdAt: number;
  name: string;
}

export async function getOAuthClient(clientId: string): Promise<OAuthClient | null> {
  if (!/^[A-Za-z0-9_-]{24,128}$/.test(clientId)) return null;
  const doc = await firestore().collection(CLIENTS).doc(clientId).get();
  return doc.exists ? (doc.data() as OAuthClient) : null;
}

export async function agencyActor(uid: string): Promise<{ uid: string; name: string; email?: string }> {
  const doc = await firestore().collection('portal_users').doc(uid).get();
  const user = doc.data();
  const role = typeof user?.agencyRole === 'string' ? user.agencyRole : '';
  const authorized =
    (user?.accountType === 'AGENCY' || user?.isAgency === true) &&
    ['owner', 'admin', 'sales_manager', ''].includes(role) &&
    user?.status !== 'inactive' &&
    user?.status !== 'suspended';
  if (!authorized) throw new Error('FORBIDDEN');
  return { uid, name: String(user?.name || user?.email || 'CartShift agency'), email: user?.email };
}

export interface TokenGrant {
  uid: string;
  clientId: string;
  scope: string[];
  resource: string;
  expiresAt: number;
}

export async function requireMcpToken(header: string | null): Promise<TokenGrant> {
  const match = /^Bearer ([A-Za-z0-9_-]{20,})$/i.exec(header || '');
  if (!match) throw new Error('UNAUTHENTICATED');
  const token = await firestore().collection(TOKENS).doc(tokenHash(match[1])).get();
  const grant = token.data() as TokenGrant | undefined;
  if (!grant || grant.expiresAt <= Date.now() || grant.resource !== MCP_RESOURCE) {
    throw new Error('UNAUTHENTICATED');
  }
  await agencyActor(grant.uid); // Rechecks revoked agency access for every request.
  return grant;
}

export function may(grant: TokenGrant, scope: McpScope): void {
  if (!grant.scope.includes(scope)) throw new Error('INSUFFICIENT_SCOPE');
}

export async function audit(uid: string, action: string, targetId: string): Promise<void> {
  await firestore().collection(AUDIT).add({
    uid,
    action,
    targetId,
    at: Date.now(),
  });
}

export function oauthError(error: string, status = 400): Response {
  return Response.json(
    { error },
    { status, headers: { 'Cache-Control': 'no-store', 'Pragma': 'no-cache' } }
  );
}

export function oauthNoCache(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store', 'Pragma': 'no-cache' },
  });
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, c => {
    switch (c) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      default: return '&#39;';
    }
  });
}
