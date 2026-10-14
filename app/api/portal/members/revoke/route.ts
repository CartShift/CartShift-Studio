import { NextRequest } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { adminDb } from '@/lib/firebase-admin';
import { getServerSession } from '@/lib/auth/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const headers = { 'Cache-Control': 'private, no-store' };
const identifier = z.string().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/);
const schema = z.object({
  memberId: z.string().min(3).max(257),
  orgId: identifier,
  userId: identifier,
}).strict();

/**
 * A member's removal and cached organization list must commit together.
 * Direct client writes cannot atomically modify another user's portal_users doc.
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (origin && origin !== request.nextUrl.origin) {
    return Response.json({ error: 'Forbidden' }, { status: 403, headers });
  }
  if (!adminDb) return Response.json({ error: 'Unavailable' }, { status: 503, headers });
  const session = await getServerSession(request);
  if (!session?.uid) return Response.json({ error: 'Unauthorized' }, { status: 401, headers });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || parsed.data.memberId !==
      `${parsed.data.orgId}_${parsed.data.userId}`) {
    return Response.json({ error: 'Invalid membership' }, { status: 400, headers });
  }
  const { orgId, userId, memberId } = parsed.data;

  try {
    await adminDb.runTransaction(async tx => {
      const actorRef = adminDb.collection('portal_users').doc(session.uid);
      const orgRef = adminDb.collection('portal_organizations').doc(orgId);
      const actorMemberRef = adminDb.collection('portal_members').doc(`${orgId}_${session.uid}`);
      const memberRef = adminDb.collection('portal_members').doc(memberId);
      const targetUserRef = adminDb.collection('portal_users').doc(userId);

      // Read before writes, so authorization and the revocation are one snapshot.
      const [actorDoc, orgDoc, actorMember, memberDoc, targetDoc] = await Promise.all([
        tx.get(actorRef), tx.get(orgRef), tx.get(actorMemberRef),
        tx.get(memberRef), tx.get(targetUserRef),
      ]);
      const actor = actorDoc.data();
      const org = orgDoc.data();
      const membership = actorMember.data();
      const target = memberDoc.data();
      if (!actorDoc.exists || !orgDoc.exists ||
          actor?.status === 'inactive' || actor?.status === 'suspended' ||
          org?.removedAt || org?.status === 'inactive') throw new Error('FORBIDDEN');

      const isAgencyManager = (actor?.isAgency === true || actor?.accountType === 'AGENCY') &&
        ['owner', 'admin', ''].includes(actor.agencyRole ?? '');
      const isOrgAdmin = membership?.orgId === orgId &&
        membership?.userId === session.uid && !membership?.removedAt &&
        ['owner', 'admin'].includes(membership?.role);
      if (!isAgencyManager && org?.createdBy !== session.uid && !isOrgAdmin) {
        throw new Error('FORBIDDEN');
      }
      if (!memberDoc.exists || target?.orgId !== orgId || target?.userId !== userId) {
        throw new Error('NOT_FOUND');
      }

      if (!target?.removedAt) {
        tx.update(memberRef, { removedAt: FieldValue.serverTimestamp() });
      }
      if (targetDoc.exists) {
        tx.update(targetUserRef, {
          organizations: FieldValue.arrayRemove(orgId),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    });
    return Response.json({ revoked: true }, { headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'FORBIDDEN') return Response.json({ error: 'Forbidden' }, { status: 403, headers });
    if (message === 'NOT_FOUND') return Response.json({ error: 'Not found' }, { status: 404, headers });
    return Response.json({ error: 'Unable to revoke membership' }, { status: 500, headers });
  }
}
