import 'server-only';

import { adminDb } from '@/lib/firebase-admin';
import { getProjectHealth } from '@/lib/utils/project-workflow';
import { getProjectExecutionBlockers } from '@/lib/domain/project-execution-readiness';
import type { ClientProject, ProjectReview } from '@/lib/types/project';

/**
 * Changes the workflow indicator, never publishes Shopify or bypasses client
 * sign-off. The whole readiness decision is evaluated on server-side snapshots.
 */
export async function markProjectReadyForLaunch(projectId: string): Promise<void> {
  if (!adminDb) throw new Error('ADMIN_NOT_CONFIGURED');
  const db = adminDb;
  const ref = db.collection('portal_projects').doc(projectId);
  await db.runTransaction(async tx => {
    const projectSnap = await tx.get(ref);
    if (!projectSnap.exists) throw new Error('NOT_FOUND');
    const project = projectSnap.data() as ClientProject;
    if (project.status === 'archived' || project.status === 'completed') throw new Error('INVALID_STATE');
    const reviewsSnap = await tx.get(ref.collection('reviews'));
    const reviews = reviewsSnap.docs.map(doc => ({
      id: doc.id, ...doc.data(),
    })) as ProjectReview[];
    const requests = await tx.get(db.collection('portal_requests')
      .where('projectId', '==', projectId).limit(501));
    if (requests.size > 500) throw new Error('PROJECT_WORK_LIMIT_EXCEEDED');
    const executionBlockers = getProjectExecutionBlockers(projectId, project.orgId,
      requests.docs.map(doc => doc.data()));
    const health = getProjectHealth(project, reviews);
    // Project array flags are editable operational data, not signed contracts.
    // Verify every approved change against its actual accepted quote.
    const changeOrders = (project.changes || []).filter(change =>
      change.status === 'approved' && change.linkedProposalId);
    const commercialSnapshots = await Promise.all(changeOrders.map(change =>
      tx.get(db.collection('portal_requests').doc(change.linkedProposalId!))));
    const invalidChangeOrder = commercialSnapshots.some((snapshot, index) => {
      const proposal = snapshot.data();
      const change = changeOrders[index];
      return !proposal || proposal.orgId !== project.orgId ||
        proposal.projectId !== projectId ||
        proposal.projectChangeId !== change.id ||
        !proposal.acceptedAt || !proposal.signatureText || !proposal.lockedAt ||
        !['ACCEPTED', 'PAID', 'QUEUED', 'IN_PROGRESS', 'IN_REVIEW', 'DELIVERED', 'CLOSED'].includes(proposal.status) ||
        (proposal.paymentRequired &&
          Number(proposal.amountPaid || 0) < Number(proposal.depositAmount || 0));
    });
    if (!health.readyForLaunch || executionBlockers.length > 0 || invalidChangeOrder) {
      throw new Error('PROJECT_NOT_READY');
    }
    // This flag is informational; production publishing still requires a
    // separate explicitly authorized Shopify operation.
    tx.update(ref, { status: 'ready_to_launch', updatedAt: new Date() });
  });
}
