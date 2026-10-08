import { CLIENTS, firestore, oauthError, oauthNoCache, randomToken, redirectAllowed } from '@/lib/mcp/connection';

export async function POST(request: Request) {
  const length = Number(request.headers.get('content-length') || '0');
  if (length > 8192) return oauthError('invalid_client_metadata', 413);
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return oauthError('invalid_client_metadata'); }
  if (!body || !Array.isArray(body.redirect_uris) || body.redirect_uris.length < 1 ||
      body.redirect_uris.length > 4 ||
      body.redirect_uris.some(uri => typeof uri !== 'string' || !redirectAllowed(uri))) {
    return oauthError('invalid_redirect_uri');
  }
  if (body.token_endpoint_auth_method && body.token_endpoint_auth_method !== 'none') {
    return oauthError('invalid_client_metadata');
  }
  const redirectUris = [...new Set(body.redirect_uris as string[])];
  const clientId = randomToken();
  const name = typeof body.client_name === 'string' ? body.client_name.slice(0, 100) : 'ChatGPT';
  await firestore().collection(CLIENTS).doc(clientId).create({
    clientId, redirectUris, name, createdAt: Date.now(),
  });
  return oauthNoCache({
    client_id: clientId,
    client_id_issued_at: Math.floor(Date.now() / 1000),
    redirect_uris: redirectUris,
    client_name: name,
    token_endpoint_auth_method: 'none',
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
  }, 201);
}
