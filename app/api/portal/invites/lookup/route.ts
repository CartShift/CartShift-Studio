import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getServerSession } from '@/lib/auth/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const headers = { 'Cache-Control': 'private, no-store' };

/** Look up a private invite without allowing clients to enumerate portal_invites. */
export async function GET(request: NextRequest) {
  const session = await getServerSession(request);
  if (!session?.uid || !session.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401, headers });
  }
  if (!adminDb) return Response.json({ error: 'Unavailable' }, { status: 503, headers });

  const code = request.nextUrl.searchParams.get('code') || '';
  if (!/^[a-zA-Z0-9_-]{12,128}$/.test(code)) {
    return Response.json({ error: 'Invalid invitation' }, { status: 400, headers });
  }

  try {
    const results = await adminDb.collection('portal_invites').where('code', '==', code).limit(1).get();
    const inviteDoc = results.docs[0] ?? await adminDb.collection('portal_invites').doc(code).get();
    const invite = inviteDoc.data();
    const signedInEmail = session.email.trim().toLowerCase();
    if (!inviteDoc.exists || typeof invite?.email !== 'string' ||
        invite.email.trim().toLowerCase() !== signedInEmail) {
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
