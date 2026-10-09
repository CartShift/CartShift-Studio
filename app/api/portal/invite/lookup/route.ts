import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

const codeSchema = z.string().min(8).max(128).regex(/^[A-Za-z0-9_-]+$/);

export async function GET(request: NextRequest) {
  if (!adminAuth || !adminDb) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
  const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  let uid: string;
  let email: string;
  try {
    const decoded = await adminAuth.verifyIdToken(token, true);
    uid = decoded.uid;
    email = (decoded.email ?? '').toLowerCase();
  } catch {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  const code = codeSchema.safeParse(request.nextUrl.searchParams.get('code'));
  if (!code.success) return NextResponse.json({ error: 'Invalid invitation code' }, { status: 400 });

  try {
    const [actor, inviteQuery] = await Promise.all([
      adminDb.collection('portal_users').doc(uid).get(),
      adminDb.collection('portal_invites').where('code', '==', code.data).limit(1).get(),
    ]);
    let invite = inviteQuery.docs[0];
    if (!invite) {
      const byId = await adminDb.collection('portal_invites').doc(code.data).get();
      if (byId.exists) invite = byId as typeof invite;
    }
    if (!invite) return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });

    const data = invite.data();
    const isAgency = actor.data()?.isAgency === true || actor.data()?.accountType === 'AGENCY';
    if (!isAgency && (!email || data?.email?.toLowerCase() !== email)) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    return NextResponse.json({
      invite: {
        id: invite.id,
        orgId: data?.orgId ?? null,
        email: data?.email ?? '',
        role: data?.role ?? 'member',
        isAgency: data?.isAgency === true,
        isClientInvite: data?.isClientInvite === true,
        linkedRequestIds: Array.isArray(data?.linkedRequestIds)
          ? data.linkedRequestIds.filter((id: unknown): id is string => typeof id === 'string' && id.length > 0 && !id.includes('/'))
          : [],
        invitedBy: data?.invitedBy ?? '',
        invitedByName: data?.invitedByName ?? '',
        code: data?.code ?? '',
        status: data?.status ?? 'pending',
        createdAtMillis: data?.createdAt?.toMillis?.() ?? 0,
        expiresAtMillis: data?.expiresAt?.toMillis?.() ?? 0,
      },
    });
  } catch (error) {
    console.error('[invite-lookup] Lookup failed', error);
    return NextResponse.json({ error: 'Invitation lookup failed' }, { status: 500 });
  }
}
