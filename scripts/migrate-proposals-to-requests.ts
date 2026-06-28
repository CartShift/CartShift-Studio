import * as admin from 'firebase-admin';
import {
  getCanonicalRequestIdentity,
  mapLegacyProposalStatus,
} from '../lib/domain/request-commercial';

const APPLY = process.argv.includes('--apply');
const PROPOSALS = 'portal_pricing_requests';
const REQUESTS = 'portal_requests';
const ALIASES = 'portal_request_aliases';
const LEGACY_PAYMENTS = 'portal_proposal_payments';
const PAYMENTS = 'portal_payments';

type Report = {
  proposals: number;
  standaloneCreated: number;
  existingRequestsEnriched: number;
  bundlesCreated: number;
  paymentsMoved: number;
  aliasesCreated: number;
  conflicts: string[];
  totalsByCurrency: Record<string, { proposals: number; totalAmount: number; amountPaid: number }>;
};

function initializeAdmin() {
  if (!admin.apps.length) {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'cartshiftstudio';
    const credential = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      ? admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY))
      : admin.credential.applicationDefault();
    admin.initializeApp({ projectId, credential });
  }
  return admin.firestore();
}

function commercialRequestData(
  proposalId: string,
  proposal: FirebaseFirestore.DocumentData,
  identity: ReturnType<typeof getCanonicalRequestIdentity>
) {
  const {
    requestIds: _requestIds,
    materializedRequestIds: _materializedRequestIds,
    requestsMaterializedAt: _requestsMaterializedAt,
    proposalType: _proposalType,
    offerEmailQueueId,
    offerEmailRecipient,
    ...preserved
  } = proposal;

  return {
    ...preserved,
    status: mapLegacyProposalStatus(proposal.status),
    requestRole: identity.requestRole,
    childRequestIds: identity.childRequestIds,
    legacyProposalId: proposalId,
    type: proposal.type || 'other',
    priority: proposal.priority || 'NORMAL',
    tags: Array.isArray(proposal.tags) ? proposal.tags : ['quote'],
    attachmentIds: Array.isArray(proposal.attachmentIds) ? proposal.attachmentIds : [],
    commentCount: Number(proposal.commentCount || 0),
    isBillable: true,
    quoteEmailQueueId: offerEmailQueueId || null,
    quoteEmailRecipient: offerEmailRecipient || null,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
}

function hasCommercialConflict(
  existing: FirebaseFirestore.DocumentData,
  proposal: FirebaseFirestore.DocumentData
) {
  if (existing.legacyProposalId && existing.legacyProposalId === proposal.id) return false;
  if (existing.publicToken && existing.publicToken !== proposal.publicToken) return true;
  return Boolean(
    existing.isBillable &&
    existing.totalAmount != null &&
    proposal.totalAmount != null &&
    existing.totalAmount !== proposal.totalAmount
  );
}

async function migrateRelatedReferences(
  db: FirebaseFirestore.Firestore,
  proposalId: string,
  requestId: string
) {
  const [splits, consultations] = await Promise.all([
    db.collection('portal_profit_splits').where('pricingRequestId', '==', proposalId).get(),
    db.collection('portal_consultations').where('pricingRequestId', '==', proposalId).get(),
  ]);
  if (!APPLY) return;
  const batch = db.batch();
  splits.docs.forEach(snapshot =>
    batch.set(
      snapshot.ref,
      { requestId, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
      { merge: true }
    )
  );
  consultations.docs.forEach(snapshot =>
    batch.set(
      snapshot.ref,
      { requestId, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
      { merge: true }
    )
  );
  if (!splits.empty || !consultations.empty) await batch.commit();
}

async function migratePayments(
  db: FirebaseFirestore.Firestore,
  proposalId: string,
  requestId: string,
  orgId: string,
  report: Report
) {
  const legacy = await db.collection(LEGACY_PAYMENTS).where('proposalId', '==', proposalId).get();
  for (const payment of legacy.docs) {
    const target = db.collection(PAYMENTS).doc(payment.id);
    const existing = await target.get();
    const migrated = {
      ...payment.data(),
      proposalId: admin.firestore.FieldValue.delete(),
      requestId,
      orgId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (existing.exists && existing.data()?.requestId !== requestId) {
      report.conflicts.push(`payment:${payment.id}:target-id-collision`);
      continue;
    }
    report.paymentsMoved += 1;
    if (APPLY) await target.set(migrated, { merge: true });
  }
}

async function main() {
  const db = initializeAdmin();
  const report: Report = {
    proposals: 0,
    standaloneCreated: 0,
    existingRequestsEnriched: 0,
    bundlesCreated: 0,
    paymentsMoved: 0,
    aliasesCreated: 0,
    conflicts: [],
    totalsByCurrency: {},
  };
  const proposals = await db.collection(PROPOSALS).get();

  for (const proposalSnapshot of proposals.docs) {
    report.proposals += 1;
    const proposal: FirebaseFirestore.DocumentData = {
      id: proposalSnapshot.id,
      ...proposalSnapshot.data(),
    };
    const identity = getCanonicalRequestIdentity(proposalSnapshot.id, proposal);
    const requestRef = db.collection(REQUESTS).doc(identity.requestId);
    const existing = await requestRef.get();
    const currency = String(proposal.currency || 'USD');
    const totals = (report.totalsByCurrency[currency] ??= {
      proposals: 0,
      totalAmount: 0,
      amountPaid: 0,
    });
    totals.proposals += 1;
    totals.totalAmount += Number(proposal.totalAmount || 0);
    totals.amountPaid += Number(proposal.amountPaid || 0);

    if (
      existing.exists &&
      identity.requestId === proposalSnapshot.id &&
      existing.data()?.legacyProposalId !== proposalSnapshot.id
    ) {
      report.conflicts.push(`proposal:${proposalSnapshot.id}:request-id-collision`);
      continue;
    }
    if (
      existing.exists &&
      identity.requestId !== proposalSnapshot.id &&
      hasCommercialConflict(existing.data()!, proposal)
    ) {
      report.conflicts.push(
        `proposal:${proposalSnapshot.id}:commercial-data-conflict:${identity.requestId}`
      );
      continue;
    }

    if (identity.requestRole === 'bundle') report.bundlesCreated += 1;
    else if (identity.requestId === proposalSnapshot.id) report.standaloneCreated += 1;
    else report.existingRequestsEnriched += 1;
    report.aliasesCreated += 1;

    if (APPLY) {
      const batch = db.batch();
      const targetData: Record<string, unknown> = commercialRequestData(
        proposalSnapshot.id,
        proposal,
        identity
      );
      if (existing.exists && identity.requestId !== proposalSnapshot.id) {
        delete targetData.createdAt;
        delete targetData.createdBy;
        delete targetData.createdByName;
        delete targetData.type;
        delete targetData.priority;
        delete targetData.tags;
        delete targetData.attachmentIds;
        delete targetData.commentCount;
      }
      batch.set(requestRef, targetData, { merge: true });
      batch.set(
        db.collection(ALIASES).doc(proposalSnapshot.id),
        {
          requestId: identity.requestId,
          publicToken: proposal.publicToken || null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      identity.childRequestIds.forEach(childId => {
        batch.set(
          db.collection(REQUESTS).doc(childId),
          {
            requestRole: 'bundle_item',
            parentRequestId: identity.requestId,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      });
      batch.set(
        proposalSnapshot.ref,
        {
          migratedRequestId: identity.requestId,
          migratedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      await batch.commit();
    }

    await migratePayments(
      db,
      proposalSnapshot.id,
      identity.requestId,
      String(proposal.orgId || ''),
      report
    );
    await migrateRelatedReferences(db, proposalSnapshot.id, identity.requestId);
  }

  console.log(JSON.stringify({ mode: APPLY ? 'apply' : 'dry-run', ...report }, null, 2));
  if (report.conflicts.length > 0) process.exitCode = 2;
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
