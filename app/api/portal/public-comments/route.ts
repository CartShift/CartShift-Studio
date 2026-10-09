import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getServerSession } from '@/lib/auth/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const headers = { 'Cache-Control': 'private, no-store' };

function millis(value: unknown): number | null {
  if (value && typeof value === 'object' && 'toMillis' in value &&
      typeof value.toMillis === 'function') {
    return value.toMillis();
  }
  return null;
}

/**
 * Secure public-comment view. Non-agency users MUST NOT query the shared
 * portal_comments collection directly: Firestore emulators demonstrated a
 * broader list query can expose agency-internal records.
 */
export async function GET(request: NextRequest) {
  if (!adminDb) return Response.json({ error: 'Unavailable' }, { status: 503, headers });
  const session = await getServerSession(request);
  if (!session?.uid) return Response.json({ error: 'Unauthorized' }, { status: 401, headers });

  const requestId = request.nextUrl.searchParams.get('request_id') || '';
  const orgId = request.nextUrl.searchParams.get('org_id');
  if (!/^[\w-]{6,128}$/.test(requestId) ||
    (orgId !== null && !/^[\w-]{6,128}$/.test(orgId))) {
    return Response.json({ error: 'Invalid identifier' }, { status: 400, headers });
  }

  try {
    const [userDoc, itemDoc] = await Promise.all([
      adminDb.collection('portal_users').doc(session.uid).get(),
      adminDb.collection('portal_requests').doc(requestId).get(),
    ]);
    const user = userDoc.data();
    const item = itemDoc.data();
    if (!user || !item || user.status === 'inactive' || user.status === 'suspended' ||
        !itemDoc.exists || (orgId && item.orgId !== orgId)) {
      return Response.json({ error: 'Not found' }, { status: 404, headers });
    }
    const organizationId = item.orgId;
    if (typeof organizationId !== 'string' || !/^[\w-]{6,128}$/.test(organizationId)) {
      return Response.json({ error: 'Not found' }, { status: 404, headers });
    }

    const agency = user.accountType === 'AGENCY' || user.isAgency === true;
    if (!agency) {
      const [orgDoc, membership] = await Promise.all([
        adminDb.collection('portal_organizations').doc(organizationId).get(),
        adminDb.collection('portal_members').doc(organizationId + '_' + session.uid).get(),
      ]);
      const org = orgDoc.data();
      const member = membership.data();
      const owns = org?.createdBy === session.uid;
      const joined = member?.userId === session.uid && member?.orgId === organizationId &&
        !member?.removedAt;
      if (!orgDoc.exists || org?.removedAt || org?.status === 'inactive' || (!owns && !joined)) {
        return Response.json({ error: 'Forbidden' }, { status: 403, headers });
      }
    }

    const comments = await adminDb.collection('portal_comments')
      .where('requestId', '==', requestId)
      .where('orgId', '==', organizationId)
      .where('isInternal', '==', false).limit(250).get();

    const results = comments.docs.map(doc => {
      const c = doc.data();
      return {
        id: doc.id, orgId: organizationId, requestId,
        userId: c.userId, userName: c.userName, userPhotoUrl: c.userPhotoUrl || null,
        content: c.content, isInternal: false, parentId: c.parentId || null,
        attachmentIds: c.attachmentIds || [], reactions: c.reactions || {},
        mentions: c.mentions || [],
        createdAtMs: millis(c.createdAt), updatedAtMs: millis(c.updatedAt),
      };
    }).sort((a, b) => (a.createdAtMs || 0) - (b.createdAtMs || 0));
    return Response.json({ comments: results, truncated: comments.size === 250 }, { headers });
  } catch {
    return Response.json({ error: 'Unable to load comments' }, { status: 500, headers });
  }
}
