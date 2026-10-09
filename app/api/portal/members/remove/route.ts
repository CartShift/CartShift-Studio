import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as admin from 'firebase-admin';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { canRemoveOrganizationMember } from '@/lib/domain/membership-permissions';

const schema = z.object({
  memberId: z.string().regex(/^[A-Za-z0-9_-]+$/).max(250),
  orgId: z.string().regex(/^[A-Za-z0-9_-]+$/).max(150),
  userId: z.string().regex(/^[A-Za-z0-9_-]+$/).max(150),
}).strict();

export async function POST(request: NextRequest) {
  if (!adminAuth || !adminDb) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

  const bearer = request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if (!bearer) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  let actorUid: string;
  try {
    actorUid = (await adminAuth.verifyIdToken(bearer, true)).uid;
  } catch {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || parsed.data.memberId !== `${parsed.data?.orgId}_${parsed.data?.userId}`) {
    return NextResponse.json({ error: 'Invalid membership' }, { status: 400 });
  }

  const { memberId, orgId, userId } = parsed.data;
  if (userId === actorUid) return NextResponse.json({ error: 'Cannot remove your own membership' }, { status: 403 });

  const db = adminDb;
  const memberRef = db.collection('portal_members').doc(memberId);
  const userRef = db.collection('portal_users').doc(userId);
  const actorRef = db.collection('portal_users').doc(actorUid);
  const orgRef = db.collection('portal_organizations').doc(orgId);
  const actorMemberRef = db.collection('portal_members').doc(`${orgId}_${actorUid}`);

  try {
    await db.runTransaction(async tx => {
      const [member, targetUser, actor, org, actorMember] = await Promise.all([
        tx.get(memberRef),
        tx.get(userRef),
        tx.get(actorRef),
        tx.get(orgRef),
        tx.get(actorMemberRef),
      ]);

      if (!member.exists || !org.exists ||
          member.data()?.orgId !== orgId || member.data()?.userId !== userId) {
        throw new Error('NOT_FOUND');
      }

      const allowed = canRemoveOrganizationMember(
        actorUid, actor.data(), org.data()?.createdBy, actorMember.data(),
      );
      if (!allowed) throw new Error('FORBIDDEN');
      if (member.data()?.removedAt) return;

      tx.update(memberRef, {
        removedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      if (targetUser.exists) {
        tx.update(userRef, {
          organizations: admin.firestore.FieldValue.arrayRemove(orgId),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    if (code === 'NOT_FOUND') return NextResponse.json({ error: code }, { status: 404 });
    if (code === 'FORBIDDEN') return NextResponse.json({ error: code }, { status: 403 });
    console.error('[portal/member-remove] Unable to revoke membership', error);
    return NextResponse.json({ error: 'Unable to remove member' }, { status: 500 });
  }
}
