import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase-admin';
import { requireAgencySession } from '@/lib/auth/server-agency';
import { mapProposalError } from '@/lib/services/proposal-api-utils';
import type { ProposalContent } from '@/lib/domain/proposal-content';

const schema = z.object({
  requirementId: z.string().min(1).max(128),
  status: z.enum(['pending', 'received', 'approved']),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    await requireAgencySession(request);
    if (!adminDb) throw new Error('ADMIN_NOT_CONFIGURED');
    const { requestId } = await params;
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid requirement update' }, { status: 400 });
    const ref = adminDb.collection('portal_requests').doc(requestId);
    await adminDb.runTransaction(async transaction => {
      const doc = await transaction.get(ref);
      if (!doc.exists) throw new Error('NOT_FOUND');
      const source = doc.data();
      if (!['ACCEPTED', 'PAID', 'QUEUED', 'IN_PROGRESS', 'IN_REVIEW', 'DELIVERED'].includes(source?.status)) {
        throw new Error('NOT_ACCEPTED');
      }
      const content = (source?.publishedProposal?.proposalContent ?? source?.proposalContent) as ProposalContent | undefined;
      if (!content?.requirements?.some(item => item.id === parsed.data.requirementId)) {
        throw new Error('INVALID_REQUIREMENT');
      }
      transaction.update(ref, {
        proposalRequirementStatuses: {
          ...(source?.proposalRequirementStatuses ?? {}),
          [parsed.data.requirementId]: parsed.data.status,
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return mapProposalError(error);
  }
}
