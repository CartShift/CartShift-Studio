import { NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const headers = { 'Cache-Control': 'private, no-store' };

/**
 * Private invitation lookup: requires a verified Firebase ID token, scopes the
 * result to the recipient, and keeps invitation secrets out of query-string logs.
 */
export async function POST(request: NextRequest) {
  if (!adminDb || !adminAuth) {
    return Response.json({ error: 'Unavailable' }, { status: 503, headers });
  }

  const bearer = request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if (!bearer) return Response.json({ error: 'Unauthorized' }, { status: 401, headers });

  let email: string;
  try {
    const claims = await adminAuth.verifyIdToken(bearer, true);
    if (!claims.email) throw new Error('Missing verified identity');
    email = claims.email.trim().toLowerCase();
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401, headers });
  }

  const body = await request.json().catch(() => null);
  const code = body && typeof body.code === 'string' ? body.code : '';
  if (!/^[a-zA-Z0-9_-]{12,128}$/.test(code)) {
    return Response.json({ error: 'Invalid invitation' }, { status: 400, headers });
  }

  try {
    const results = await adminDb.collection('portal_invites').where('code', '==', code).limit(1).get();
    const inviteDoc = results.docs[0] ?? await adminDb.collection('portal_invites').doc(code).get();
    const invite = inviteDoc.data();
    if (!inviteDoc.exists || typeof invite?.email !== 'string' ||
        invite.email.trim().toLowerCase() !== email) {
      return Response.json({ error: 'Not found' }, { status: 404, headers });
    }

    return Response.json({ invite: {
      id: inviteDoc.id,
      orgId: invite.orgId ?? null,
      email: invite.email,
      role: invite.role,
      isAgency: invite.isAgency === true,
      isClientInvite: invite.isClientInvite === true,
      invitedByName: invite.invitedByName ?? '',
      status: invite.status,
      expiresAtMs: invite.expiresAt?.toMillis?.() ?? 0,
      createdAtMs: invite.createdAt?.toMillis?.() ?? 0,
    } }, { headers });
  } catch (error) {
    console.error('[Invite lookup] Failed:', error instanceof Error ? error.name : 'Unknown');
    return Response.json({ error: 'Unable to load invitation' }, { status: 500, headers });
  }
}
