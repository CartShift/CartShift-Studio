import { createHash } from 'node:crypto';
import {
  CODES, MCP_RESOURCE, REFRESH, TOKENS, TokenGrant,
  agencyActor, firestore, getOAuthClient, oauthError, oauthNoCache,
  randomToken, tokenHash,
} from '@/lib/mcp/connection';

const ACCESS_MS = 60 * 60 * 1000;
const REFRESH_MS = 30 * 24 * 60 * 60 * 1000;

async function createTokens(grant: Omit<TokenGrant, 'expiresAt'>) {
  const access = randomToken();
  const refresh = randomToken();
  const now = Date.now();
  const db = firestore();
  const batch = db.batch();
  batch.create(db.collection(TOKENS).doc(tokenHash(access)), {
    ...grant, expiresAt: now + ACCESS_MS,
  });
  batch.create(db.collection(REFRESH).doc(tokenHash(refresh)), {
    ...grant, expiresAt: now + REFRESH_MS,
  });
  await batch.commit();
  return oauthNoCache({
    access_token: access, token_type: 'Bearer', expires_in: ACCESS_MS / 1000,
    refresh_token: refresh, scope: grant.scope.join(' '),
  });
}

export async function POST(request: Request) {
  if (Number(request.headers.get('content-length') || 0) > 8192) {
    return oauthError('invalid_request', 413);
  }
  const body = await request.formData().catch(() => null);
  if (!body) return oauthError('invalid_request');
  const text = (name: string) => String(body.get(name) || '');
  const clientId = text('client_id');
  const client = await getOAuthClient(clientId);
  if (!client) return oauthError('invalid_client', 401);
  if (text('resource') !== MCP_RESOURCE) return oauthError('invalid_target');
  const db = firestore();

  if (text('grant_type') === 'authorization_code') {
    const code = text('code');
    const verifier = text('code_verifier');
    const redirectUri = text('redirect_uri');
    if (!/^[A-Za-z0-9_-]{43,128}$/.test(verifier) || !code || !client.redirectUris.includes(redirectUri)) {
      return oauthError('invalid_grant');
    }
    const digest = createHash('sha256').update(verifier).digest('base64url');
    const codeRef = db.collection(CODES).doc(tokenHash(code));
    let grant: Omit<TokenGrant, 'expiresAt'>;
    try {
      grant = await db.runTransaction(async tx => {
        const snap = await tx.get(codeRef);
        const data = snap.data();
        if (!data || data.expiresAt <= Date.now() || data.clientId !== clientId ||
            data.redirectUri !== redirectUri || data.resource !== MCP_RESOURCE ||
            data.codeChallenge !== digest) throw new Error('invalid_grant');
        tx.delete(codeRef); // Single use, even under concurrent attempts.
        return {
          uid: String(data.uid), clientId, resource: MCP_RESOURCE, scope: data.scope as string[],
        };
      });
      await agencyActor(grant.uid);
    } catch { return oauthError('invalid_grant'); }
    return createTokens(grant);
  }
  if (text('grant_type') === 'refresh_token') {
    const token = text('refresh_token');
    if (!/^[A-Za-z0-9_-]{40,128}$/.test(token)) return oauthError('invalid_grant');
    const ref = db.collection(REFRESH).doc(tokenHash(token));
    let grant: Omit<TokenGrant, 'expiresAt'>;
    try {
      grant = await db.runTransaction(async tx => {
        const snap = await tx.get(ref);
        const data = snap.data();
        if (!data || data.expiresAt <= Date.now() || data.clientId !== clientId ||
            data.resource !== MCP_RESOURCE) throw new Error('invalid_grant');
        tx.delete(ref); // Rotated refresh tokens cannot be replayed.
        return {
          uid: String(data.uid), clientId, resource: MCP_RESOURCE, scope: data.scope as string[],
        };
      });
      await agencyActor(grant.uid);
    } catch { return oauthError('invalid_grant'); }
    return createTokens(grant);
  }
  return oauthError('unsupported_grant_type');
}
