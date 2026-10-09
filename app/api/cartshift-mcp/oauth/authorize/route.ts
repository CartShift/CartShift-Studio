import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import {
  CODES, MCP_ORIGIN, MCP_RESOURCE, MCP_SCOPES, agencyActor, constantEquals,
  escapeHtml, firestore, getOAuthClient, randomToken, tokenHash, validScopes,
} from '@/lib/mcp/connection';

const ROUTE = '/api/cartshift-mcp/oauth/authorize';
type AuthParameters = {
  clientId: string; redirectUri: string; scope: string; state: string;
  codeChallenge: string; resource: string;
};

async function validate(params: URLSearchParams): Promise<AuthParameters | null> {
  const clientId = params.get('client_id') || '';
  const redirectUri = params.get('redirect_uri') || '';
  const scope = params.get('scope') || MCP_SCOPES.join(' ');
  const state = params.get('state') || '';
  const codeChallenge = params.get('code_challenge') || '';
  const resource = params.get('resource') || '';
  const client = await getOAuthClient(clientId);
  if (
    !client || !client.redirectUris.includes(redirectUri) ||
    params.get('response_type') !== 'code' ||
    params.get('code_challenge_method') !== 'S256' ||
    !/^[A-Za-z0-9_-]{43}$/.test(codeChallenge) ||
    !validScopes(scope.replace(/\boffline_access\b/g, '')) ||
    resource !== MCP_RESOURCE || state.length > 1024
  ) return null;
  return { clientId, redirectUri, scope, state, codeChallenge, resource };
}

const htmlHeaders = {
  'Content-Type': 'text/html; charset=utf-8',
  'Cache-Control': 'no-store',
  'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
  'X-Content-Type-Options': 'nosniff',
};

function rejectedConsent(reason: 'invalid authorization details' | 'missing verification cookie' | 'verification cookie mismatch') {
  console.warn('[CartShift MCP] OAuth consent rejected', { reason });
  return new Response('Invalid OAuth consent (' + reason + '). Restart Authenticate and submit the new consent page.', {
    status: 400, headers: { 'Cache-Control': 'no-store' },
  });
}

export async function GET(request: NextRequest) {
  const auth = await validate(request.nextUrl.searchParams);
  if (!auth) return new Response('Invalid OAuth authorization request', { status: 400 });
  const session = await getServerSession(request);
  if (!session) {
    const login = new URL('/en/login', MCP_ORIGIN);
    login.searchParams.set('redirect', ROUTE + '?' + request.nextUrl.searchParams.toString());
    return NextResponse.redirect(login);
  }
  try { await agencyActor(session.uid); }
  catch { return new Response('Agency permissions required', { status: 403 }); }

  const csrf = randomToken();
  const hidden: Record<string, string> = {
    client_id: auth.clientId, redirect_uri: auth.redirectUri,
    response_type: 'code', code_challenge: auth.codeChallenge,
    code_challenge_method: 'S256', scope: auth.scope,
    state: auth.state, resource: auth.resource, csrf,
  };
  const inputs = Object.entries(hidden).map(([key, value]) =>
    '<input type="hidden" name="' + key + '" value="' + escapeHtml(value) + '">'
  ).join('');
  const html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">' +
    '<title>Connect CartShift to ChatGPT</title></head>' +
    '<body style="font:16px system-ui;margin:8vh auto;max-width:480px;padding:24px;color:#20212c">' +
    '<h1>Connect CartShift to ChatGPT</h1>' +
    '<p>Signed in as ' + escapeHtml(session.email || session.uid) + '</p>' +
    '<p>This connection can access CartShift agency client profiles and work requests with these permissions:</p>' +
    '<ul>' + (validScopes(auth.scope.replace(/\boffline_access\b/g, '')) || []).map(s => '<li>' + escapeHtml(s) + '</li>').join('') + '</ul>' +
    '<p>Only grant access if you initiated this connection in ChatGPT.</p>' +
    '<form method="post" action="' + ROUTE + '">' + inputs +
    '<button type="submit" name="decision" value="allow" style="background:#6355e9;color:white;border:0;border-radius:8px;padding:12px 24px;cursor:pointer">Authorize connection</button>' +
    ' <button type="submit" name="decision" value="deny" style="border:1px solid #888;border-radius:8px;padding:12px 24px;cursor:pointer">Deny</button>' +
    '</form></body></html>';
  const response = new NextResponse(html, { headers: htmlHeaders });
  response.cookies.set('cartshift_mcp_csrf', csrf, {
    httpOnly: true, secure: true, sameSite: 'none', maxAge: 300, path: '/',
  });
  return response;
}

export async function POST(request: NextRequest) {
  if (request.headers.get('origin') !== MCP_ORIGIN) {
    return new Response('Invalid origin', { status: 403 });
  }
  const form = await request.formData();
  const params = new URLSearchParams();
  for (const [key, value] of form.entries()) {
    if (typeof value === 'string') params.set(key, value);
  }
  const auth = await validate(params);
  const csrf = request.cookies.get('cartshift_mcp_csrf')?.value || '';
  if (!auth) return rejectedConsent('invalid authorization details');
  if (!csrf) return rejectedConsent('missing verification cookie');
  if (!constantEquals(csrf, params.get('csrf') || '')) return rejectedConsent('verification cookie mismatch');
  const session = await getServerSession(request);
  if (!session) return new Response('Session expired; restart connection', { status: 401 });
  try { await agencyActor(session.uid); }
  catch { return new Response('Agency permissions required', { status: 403 }); }

  const callback = new URL(auth.redirectUri);
  callback.searchParams.set('state', auth.state);
  callback.searchParams.set('iss', MCP_ORIGIN);
  if (params.get('decision') !== 'allow') {
    callback.searchParams.set('error', 'access_denied');
  } else {
    const code = randomToken();
    await firestore().collection(CODES).doc(tokenHash(code)).create({
      uid: session.uid, clientId: auth.clientId, redirectUri: auth.redirectUri,
      codeChallenge: auth.codeChallenge, resource: auth.resource,
      scope: validScopes(auth.scope.replace(/\boffline_access\b/g, '')) || [],
      expiresAt: Date.now() + 5 * 60 * 1000,
    });
    callback.searchParams.set('code', code);
  }
  const response = NextResponse.redirect(callback, 303);
  response.cookies.set('cartshift_mcp_csrf', '', {
    path: '/', httpOnly: true, secure: true, sameSite: 'none', maxAge: 0,
  });
  return response;
}
