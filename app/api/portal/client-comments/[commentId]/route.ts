import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase-admin';
import { getServerSession } from '@/lib/auth/server-auth';
import { sanitizeClientRequest } from '@/lib/domain/client-request-visibility';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store' };

export async function DELETE(request: NextRequest, { params }: {
  params: Promise<{ commentId: string }>
}) {
  if (!adminDb) return NextResponse.json({ error: 'Unavailable' }, { status: 503, headers });
  const session = await getServerSession(request);
  if (!session?.uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
  const { commentId } = await params;
  if (!/^[A-Za-z0-9_-]{6,150}$/.test(commentId)) {
    return NextResponse.json({ error: 'Invalid comment' }, { status: 400, headers });
  }
  const db = adminDb;
  const commentRef = db.collection('portal_comments').doc(commentId);
  try {
    const [actor, commentDoc] = await Promise.all([
      db.collection('portal_users').doc(session.uid).get(), commentRef.get(),
    ]);
    if (!actor.exists || actor.data()?.status === 'inactive' || actor.data()?.status === 'suspended' ||
        actor.data()?.isAgency === true || actor.data()?.accountType === 'AGENCY') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers });
    }
    const comment = commentDoc.data();
    if (!comment || comment.userId !== session.uid || comment.isInternal === true ||
        typeof comment.orgId !== 'string' || typeof comment.requestId !== 'string') {
      return NextResponse.json({ error: 'Not found' }, { status: 404, headers });
    }
    const orgId = comment.orgId;
    const [orgDoc, memberDoc] = await Promise.all([
      db.collection('portal_organizations').doc(orgId).get(),
      db.collection('portal_members').doc(orgId + '_' + session.uid).get(),
    ]);
    const org = orgDoc.data(), member = memberDoc.data();
    if (!orgDoc.exists || org?.removedAt || ['inactive', 'suspended'].includes(org?.status) ||
        !(org?.createdBy === session.uid ||
          (member?.userId === session.uid && member?.orgId === orgId && !member?.removedAt))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers });
    }
    const requestRef = db.collection('portal_requests').doc(comment.requestId);
    await db.runTransaction(async tx => {
      const [freshComment, parent] = await Promise.all([tx.get(commentRef), tx.get(requestRef)]);
      if (!freshComment.exists || freshComment.data()?.userId !== session.uid ||
          freshComment.data()?.isInternal === true ||
          freshComment.data()?.orgId !== orgId ||
          !parent.exists || parent.data()?.orgId !== orgId ||
          !sanitizeClientRequest(requestRef.id, parent.data()!)) {
        throw new Error('COMMENT_NOT_VISIBLE');
      }
      tx.delete(commentRef);
      tx.update(requestRef, {
        commentCount: Math.max(0, Number(parent.data()?.commentCount || 0) - 1),
        // The former preview may have belonged to the deleted comment.
        lastComment: null, updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    return NextResponse.json({ deleted: true }, { headers });
  } catch (error) {
    const status = error instanceof Error && error.message === 'COMMENT_NOT_VISIBLE' ? 404 : 500;
    return NextResponse.json({ error: status === 404 ? 'Not found' : 'Unable to delete comment' },
      { status, headers });
  }
}
