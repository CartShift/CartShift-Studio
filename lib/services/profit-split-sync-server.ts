import 'server-only';
import * as admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase-admin';
import { calculateProfitSplit } from '@/lib/services/profit-splits';
import { PROFIT_SPLIT_STATUS, ProfitSplitExpense } from '@/lib/types/profit-split';
import { Organization, Request } from '@/lib/types/portal';
import {
  resolveRequestProfitSplitResponsibilities,
  responsibilitiesToParticipantInput,
} from '@/lib/utils/profit-split-responsibilities';

const REQUESTS_COLLECTION = 'portal_requests';
const ORGS_COLLECTION = 'portal_organizations';
const USERS_COLLECTION = 'portal_users';
const PAYMENTS_COLLECTION = 'portal_payments';
const PROFIT_SPLITS_COLLECTION = 'portal_profit_splits';

type RequestDoc = Omit<Request, 'id'>;

type PaymentDoc = {
  status?: string;
  paidAt?: admin.firestore.Timestamp | null;
};

function db() {
  if (!adminDb) throw new Error('ADMIN_NOT_CONFIGURED');
  return adminDb;
}

function now() {
  return admin.firestore.FieldValue.serverTimestamp();
}

async function listPaidPaymentIds(requestId: string): Promise<string[]> {
  const snapshot = await db()
    .collection(PAYMENTS_COLLECTION)
    .where('requestId', '==', requestId)
    .get();
  return snapshot.docs
    .filter(doc => (doc.data() as PaymentDoc).status === 'paid')
    .map(doc => doc.id);
}

async function getResponsibleAgencyUserName(userId?: string): Promise<string> {
  if (!userId?.trim()) return '';
  const snapshot = await db().collection(USERS_COLLECTION).doc(userId).get();
  if (!snapshot.exists) return '';
  const user = snapshot.data();
  return (user?.name as string | undefined)?.trim() || (user?.email as string | undefined)?.trim() || '';
}

async function getOrganization(orgId: string): Promise<Organization | null> {
  const snapshot = await db().collection(ORGS_COLLECTION).doc(orgId).get();
  if (!snapshot.exists) return null;
  return { id: snapshot.id, ...snapshot.data() } as Organization;
}

export async function syncProfitSplitForRequest(requestId: string): Promise<void> {
  const database = db();
  const requestSnapshot = await database.collection(REQUESTS_COLLECTION).doc(requestId).get();
  const request = requestSnapshot.data() as RequestDoc | undefined;
  if (!request) return;

  const organization = await getOrganization(request.orgId);
  const responsibleAgencyUserId = organization?.responsibleAgencyUserId;
  const responsibleAgencyUserName = await getResponsibleAgencyUserName(responsibleAgencyUserId);

  const responsibilities = resolveRequestProfitSplitResponsibilities({
    responsibleAgencyUserId,
    responsibleAgencyUserName,
    assignedTo: request.assignedTo,
    assignedToName: request.assignedToName,
    storedResponsibilities: request.profitSplitResponsibilities,
  });

  const existingSnapshot = await database
    .collection(PROFIT_SPLITS_COLLECTION)
    .where('requestId', '==', requestId)
    .limit(1)
    .get();
  const splitRef =
    existingSnapshot.docs[0]?.ref ??
    database.collection(PROFIT_SPLITS_COLLECTION).doc(`request_${requestId}`);
  const existing = existingSnapshot.docs[0]?.data() as Record<string, unknown> | undefined;

  const amountPaid = request.amountPaid ?? 0;
  const inspectedPaymentIds = await listPaidPaymentIds(requestId);
  if (amountPaid <= 0 && !existing) return;

  if (existing?.status === PROFIT_SPLIT_STATUS.FINALIZED) {
    await splitRef.set(
      {
        reconciliationRequired: true,
        proposalPaymentStatus: request.paymentStatus ?? request.proposalPaymentStatus ?? 'pending',
        inspectedPaymentIds,
        updatedAt: now(),
      },
      { merge: true }
    );
    return;
  }

  const directExpenses = (existing?.directExpenses as ProfitSplitExpense[] | undefined) ?? [];
  const calculation = calculateProfitSplit({
    grossRevenue: amountPaid,
    directExpenses,
    participants: responsibilitiesToParticipantInput(responsibilities),
  });

  await splitRef.set(
    {
      requestId,
      pricingRequestId: requestId,
      orgId: request.orgId,
      clientName: request.clientName ?? null,
      clientEmail: request.clientEmail ?? null,
      projectTitle: request.title,
      currency: request.currency ?? 'USD',
      grossRevenue: amountPaid,
      ...calculation,
      status: PROFIT_SPLIT_STATUS.DRAFT,
      createdBy: (existing?.createdBy as string | undefined) ?? 'server',
      createdByName: (existing?.createdByName as string | undefined) ?? 'Payment reconciliation',
      createdAt: existing?.createdAt ?? now(),
      updatedAt: now(),
      proposalPaymentStatus: request.paymentStatus ?? request.proposalPaymentStatus ?? 'pending',
      inspectedPaymentIds,
      reconciliationRequired: false,
    },
    { merge: true }
  );
}
