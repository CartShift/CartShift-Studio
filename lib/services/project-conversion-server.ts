import 'server-only';

import * as admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase-admin';
import { buildProjectTemplate } from '@/lib/utils/project-workflow';
import { approvedProjectScope, projectIdForProposal, projectSummaryFromProposal } from '@/lib/domain/project-from-proposal';
import type { ProposalContent } from '@/lib/domain/proposal-content';

/**
 * Idempotently create or link a project for an ACCEPTED commercial proposal.
 * Never sets paid status, releases work, contacts the client or overwrites
 * a different project's details. Safe to retry after a partial workflow failure.
 */
export async function ensureProjectForAcceptedProposal(proposalId: string): Promise<string> {
  if (!adminDb) throw new Error('ADMIN_NOT_CONFIGURED');
  const db = adminDb;
  const proposalRef = db.collection('portal_requests').doc(proposalId);
  return db.runTransaction(async tx => {
    const snapshot = await tx.get(proposalRef);
    if (!snapshot.exists) throw new Error('NOT_FOUND');
    const proposal = snapshot.data()!;
    if (!['ACCEPTED', 'PAID'].includes(proposal.status)) throw new Error('NOT_ACCEPTED');
    if (!proposal.orgId) throw new Error('INVALID_ORGANIZATION');
    let inheritedProjectId: string | undefined;

    if (!proposal.projectId && proposal.relatedRequestId) {
      const source = await tx.get(db.collection('portal_requests').doc(proposal.relatedRequestId));
      if (!source.exists || source.data()?.orgId !== proposal.orgId) {
        throw new Error('INVALID_RELATED_REQUEST');
      }
      inheritedProjectId = source.data()?.projectId;
    }

    const projectId: string = proposal.projectId || inheritedProjectId || projectIdForProposal(proposalId);
    const projectRef = db.collection('portal_projects').doc(projectId);
    const project = await tx.get(projectRef);
    const now = admin.firestore.FieldValue.serverTimestamp();
    if (project.exists) {
      if (project.data()?.orgId !== proposal.orgId) throw new Error('PROJECT_ORG_MISMATCH');
      tx.update(projectRef, {
        linkedProposalIds: admin.firestore.FieldValue.arrayUnion(proposalId),
        updatedAt: now,
      });
    } else {
      // Explicit links are never silently replaced by a new project.
      if (proposal.projectId || inheritedProjectId) throw new Error('PROJECT_NOT_FOUND');
      const locale = proposal.currency === 'ILS' ? 'he' : 'en';
      const currency = (['ILS', 'USD', 'EUR'].includes(proposal.currency) ?
        proposal.currency : 'ILS') as 'ILS' | 'USD' | 'EUR';
      tx.create(projectRef, {
        orgId: proposal.orgId, title: proposal.title || 'Client project',
        summary: projectSummaryFromProposal(proposal as {
          description?: string; proposalContent?: ProposalContent;
        }),
        nextStep: '', status: 'planning', template: 'custom',
        ...buildProjectTemplate('custom', locale),
        blockers: [], deliverables: [], workLogs: [], changes: [], updates: [],
        reviewRevisions: {},
        scope: approvedProjectScope(proposal.proposalContent as ProposalContent | undefined, currency),
        originProposalId: proposalId, linkedProposalIds: [proposalId],
        createdBy: proposal.createdBy || 'system',
        createdAt: now, updatedAt: now,
      });
    }
    if (proposal.projectId !== projectId) {
      tx.update(proposalRef, { projectId, updatedAt: now });
    }
    return projectId;
  });
}
