import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase-admin';
import { getServerSession } from '@/lib/auth/server-auth';
import { sanitizeClientRequest } from '@/lib/domain/client-request-visibility';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const headers = { 'Cache-Control': 'private, no-store' };
const isId = (value: unknown): value is string =>
  typeof value === 'string' && /^[A-Za-z0-9_-]{6,150}$/.test(value);

function sanitizeContent(value: string): string {
  return value.trim().replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
}

/**
 * The client never mutates a commercial request directly. An authorized,
 * atomic server transaction creates the comment and updates its preview/count.
 */
export async function POST(request: NextRequest) {
  if (!adminDb) return NextResponse.json({ error: 'Unavailable' }, { status: 503, headers });
  const session = await getServerSession(request);
  if (!session?.uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const requestId = body?.requestId;
  const orgId = body?.orgId;
  const rawContent = body?.content;
  const attachmentIds = body?.attachmentIds ?? [];
  const mentions = body?.mentions ?? [];
  const parentId = body?.parentId ?? null;
  if (!isId(requestId) || !isId(orgId) ||
      typeof rawContent !== 'string' || !rawContent.trim() ||
      rawContent.length > 10000 || body?.isInternal === true ||
      !Array.isArray(attachmentIds) || attachmentIds.length > 20 ||
      !attachmentIds.every(isId) ||
      !Array.isArray(mentions) || mentions.length > 20 ||
      !mentions.every(value => typeof value === 'string' && value.length <= 150) ||
      (parentId !== null && !isId(parentId))) {
    return NextResponse.json({ error: 'INVALID_COMMENT' }, { status: 400, headers });
  }

  const db = adminDb;
  try {
    const [userDoc, orgDoc, memberDoc, itemDoc] = await Promise.all([
      db.collection('portal_users').doc(session.uid).get(),
      db.collection('portal_organizations').doc(orgId).get(),
      db.collection('portal_members').doc(orgId + '_' + session.uid).get(),
      db.collection('portal_requests').doc(requestId).get(),
    ]);
    const user = userDoc.data();
    const org = orgDoc.data();
    const member = memberDoc.data();
    const item = itemDoc.data();
    if (!user || user.isAgency === true || user.accountType === 'AGENCY' ||
        user.status === 'inactive' || user.status === 'suspended') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers });
    }
    const owns = org?.createdBy === session.uid;
    const joined = member?.userId === session.uid && member?.orgId === orgId &&
      !member?.removedAt;
    if (!orgDoc.exists || org?.removedAt || ['inactive', 'suspended'].includes(org?.status) ||
        (!owns && !joined)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers });
    }
    if (!itemDoc.exists || item?.orgId !== orgId || !sanitizeClientRequest(requestId, item!)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404, headers });
    }
    if (parentId) {
      const reply = await db.collection('portal_comments').doc(parentId).get();
      if (!reply.exists || reply.data()?.requestId !== requestId ||
          reply.data()?.orgId !== orgId || reply.data()?.isInternal === true) {
        return NextResponse.json({ error: 'Invalid reply' }, { status: 400, headers });
      }
    }
    if (attachmentIds.length) {
      const files = await db.getAll(...attachmentIds.map(id =>
        db.collection('portal_files').doc(id)));
      if (files.some(file => !file.exists || file.data()?.orgId !== orgId)) {
        return NextResponse.json({ error: 'Invalid attachments' }, { status: 400, headers });
      }
    }

    const content = sanitizeContent(rawContent);
    const userName = String(user.displayName || user.name ||
      [user.firstName, user.lastName].filter(Boolean).join(' ') ||
      session.email || 'Client').slice(0, 160);
    const userPhotoUrl = typeof user.photoURL === 'string' ? user.photoURL : null;
    const commentRef = db.collection('portal_comments').doc();
    const requestRef = db.collection('portal_requests').doc(requestId);
    const now = admin.firestore.FieldValue.serverTimestamp();
    await db.runTransaction(async tx => {
      const fresh = await tx.get(requestRef);
      if (!fresh.exists || fresh.data()?.orgId !== orgId ||
          !sanitizeClientRequest(requestId, fresh.data()!)) {
        throw new Error('REQUEST_NOT_VISIBLE');
      }
      tx.create(commentRef, {
        orgId, requestId, userId: session.uid, userName, userPhotoUrl, content,
        isInternal: false, attachmentIds, parentId,
        mentions, reactions: {}, createdAt: now,
      });
      tx.update(requestRef, {
        commentCount: admin.firestore.FieldValue.increment(1),
        updatedAt: now,
        lastComment: { content: content.slice(0, 103), userName, createdAt: now },
      });
    });
    return NextResponse.json({ comment: {
      id: commentRef.id, orgId, requestId, userId: session.uid, userName,
      userPhotoUrl, content, isInternal: false, attachmentIds, parentId,
      mentions, reactions: {}, createdAtMs: Date.now(),
    } }, { status: 201, headers });
  } catch (error) {
    const status = error instanceof Error && error.message === 'REQUEST_NOT_VISIBLE' ? 404 : 500;
    return NextResponse.json({ error: status === 404 ? 'Not found' : 'Unable to create comment' },
      { status, headers });
  }
}
