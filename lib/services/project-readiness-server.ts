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
    if (!health.readyForLaunch || executionBlockers.length > 0) {
      throw new Error('PROJECT_NOT_READY');
    }
    // This flag is informational; production publishing still requires a
    // separate explicitly authorized Shopify operation.
    tx.update(ref, { status: 'ready_to_launch', updatedAt: new Date() });
  });
}
