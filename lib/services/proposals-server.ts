import 'server-only';
import { randomUUID } from 'node:crypto';
import * as admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase-admin';
import {
  AcceptPricingRequestPayload,
  AgencyProposalPayment,
  Currency,
  ManualPaymentMethod,
  PricingLineItem,
  PricingRequest,
  ProposalPaymentProvider,
  ProposalPaymentRecordStatus,
  ProposalPaymentType,
  PublicPricingProposal,
  PublicProposalPayment,
  allocateLineItemTotals,
  formatCurrency,
} from '@/lib/types/pricing';

const PROPOSALS_COLLECTION = 'portal_pricing_requests';
const PAYMENTS_COLLECTION = 'portal_proposal_payments';
const REQUESTS_COLLECTION = 'portal_requests';
const PROFIT_SPLITS_COLLECTION = 'portal_profit_splits';

type ProposalDocument = Omit<PricingRequest, 'id'> & {
  pendingAmount?: number;
};

type PaymentDocument = {
  proposalId: string;
  paymentToken: string;
  type: ProposalPaymentType;
  label: string;
  amount: number;
  currency: Currency;
  dueAt?: admin.firestore.Timestamp | null;
  status: ProposalPaymentRecordStatus;
  provider: ProposalPaymentProvider;
  manualMethod?: ManualPaymentMethod | null;
  manualReference?: string | null;
  note?: string | null;
  paypalOrderId?: string | null;
  paypalCaptureId?: string | null;
  paidAt?: admin.firestore.Timestamp | null;
  failedAt?: admin.firestore.Timestamp | null;
  canceledAt?: admin.firestore.Timestamp | null;
  refundedAt?: admin.firestore.Timestamp | null;
  createdBy?: string | null;
  createdAt: admin.firestore.Timestamp | admin.firestore.FieldValue;
  updatedAt: admin.firestore.Timestamp | admin.firestore.FieldValue;
};

function getDb() {
  if (!adminDb) {
    throw new Error('Firebase Admin is not configured');
  }
  return adminDb;
}

function toIso(value: unknown): string | undefined {
  if (value && typeof value === 'object' && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return undefined;
}

async function findProposalByToken(token: string) {
  const snapshot = await getDb()
    .collection(PROPOSALS_COLLECTION)
    .where('publicToken', '==', token)
    .limit(1)
    .get();
  return snapshot.docs[0] || null;
}

async function listPaymentDocs(proposalId: string) {
  const snapshot = await getDb()
    .collection(PAYMENTS_COLLECTION)
    .where('proposalId', '==', proposalId)
    .get();
  return snapshot.docs.sort((a, b) => {
    const aTime = (a.data() as PaymentDocument).createdAt;
    const bTime = (b.data() as PaymentDocument).createdAt;
    const aMillis = 'toMillis' in aTime ? aTime.toMillis() : 0;
    const bMillis = 'toMillis' in bTime ? bTime.toMillis() : 0;
    return aMillis - bMillis || a.id.localeCompare(b.id);
  });
}

function sanitizePayment(
  snapshot: admin.firestore.QueryDocumentSnapshot | admin.firestore.DocumentSnapshot
): PublicProposalPayment {
  const data = snapshot.data() as PaymentDocument;
  return {
    id: snapshot.id,
    paymentToken: data.paymentToken,
    type: data.type,
    label: data.label,
    amount: data.amount,
    currency: data.currency,
    dueAt: toIso(data.dueAt),
    status: data.status,
    provider: data.provider,
    manualMethod: data.manualMethod ?? undefined,
  };
}

function sanitizeAgencyPayment(
  snapshot: admin.firestore.QueryDocumentSnapshot | admin.firestore.DocumentSnapshot
): AgencyProposalPayment {
  const data = snapshot.data() as PaymentDocument;
  return {
    ...sanitizePayment(snapshot),
    manualReference: data.manualReference ?? undefined,
    note: data.note ?? undefined,
  };
}

async function sanitizeProposal(
  snapshot: admin.firestore.QueryDocumentSnapshot | admin.firestore.DocumentSnapshot
): Promise<PublicPricingProposal> {
  const data = snapshot.data() as ProposalDocument;
  const payments = await listPaymentDocs(snapshot.id);
  const validUntil = toIso(data.validUntil);
  const isExpired = Boolean(validUntil && new Date(validUntil).getTime() < Date.now());
  const status = data.status;

  return {
    id: snapshot.id,
    title: data.title,
    description: data.description,
    lineItems: (data.lineItems || []).map(({ requestId: _requestId, ...item }: PricingLineItem) => item),
    totalAmount: data.totalAmount,
    taxRate: data.taxRate ?? 0,
    currency: data.currency,
    status,
    proposalType: data.proposalType ?? 'pricing_offer',
    terms: data.terms,
    clientName: data.clientName,
    validUntil,
    timeframe: data.timeframe,
    workDeadline: toIso(data.workDeadline),
    acceptedAt: toIso(data.acceptedAt),
    lockedAt: toIso(data.lockedAt),
    paymentRequired: data.paymentRequired ?? false,
    depositAmount: data.depositAmount,
    amountPaid: data.amountPaid ?? 0,
    balanceDue: data.balanceDue ?? data.totalAmount,
    paymentStatus: data.paymentStatus ?? (data.paymentRequired ? 'pending' : 'not_required'),
    payments: payments.map(sanitizePayment),
    canAccept: status === 'SENT' && !isExpired,
    isPreview: status === 'DRAFT',
  };
}

function createPaymentDocument(input: {
  proposalId: string;
  type: ProposalPaymentType;
  label: string;
  amount: number;
  currency: Currency;
  dueAt?: Date;
  createdBy?: string;
  provider?: ProposalPaymentProvider;
  manualMethod?: ManualPaymentMethod;
  manualReference?: string;
  note?: string;
}): PaymentDocument {
  return {
    proposalId: input.proposalId,
    paymentToken: randomUUID(),
    type: input.type,
    label: input.label.trim(),
    amount: input.amount,
    currency: input.currency,
    dueAt: input.dueAt ? admin.firestore.Timestamp.fromDate(input.dueAt) : null,
    status: 'pending',
    provider: input.provider ?? 'paypal',
    manualMethod: input.manualMethod ?? null,
    manualReference: input.manualReference?.trim() || null,
    note: input.note?.trim() || null,
    createdBy: input.createdBy ?? null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
}

function getMaterializedRequestId(proposalId: string, item: PricingLineItem, index: number) {
  return item.requestId || `proposal_${proposalId}_${item.id || index}`;
}

function canMaterializeRequests(proposal: ProposalDocument) {
  if (proposal.status !== 'ACCEPTED' && proposal.status !== 'PAID') return false;
  if (!proposal.paymentRequired) return true;
  return (proposal.amountPaid ?? 0) >= (proposal.depositAmount ?? 0);
}

async function materializeProposalRequests(proposalId: string): Promise<string[]> {
  const db = getDb();
  const proposalRef = db.collection(PROPOSALS_COLLECTION).doc(proposalId);
  const proposalSnapshot = await proposalRef.get();
  const proposal = proposalSnapshot.data() as ProposalDocument | undefined;
  if (!proposal || !canMaterializeRequests(proposal)) return [];

  const allocatedItems = allocateLineItemTotals(proposal.lineItems || [], proposal.totalAmount);
  const requestIds = allocatedItems.map(({ item }, index) =>
    getMaterializedRequestId(proposalId, item, index)
  );
  const requestRefs = requestIds.map(id => db.collection(REQUESTS_COLLECTION).doc(id));
  const existingRequests = requestRefs.length > 0 ? await db.getAll(...requestRefs) : [];
  const batch = db.batch();
  const now = admin.firestore.FieldValue.serverTimestamp();

  allocatedItems.forEach(({ item, totalAmount, itemSubtotal }, index) => {
    const requestRef = requestRefs[index];
    const existing = existingRequests[index];
    const baseData = {
      pricingOfferId: proposalId,
      proposalLineItemId: item.id,
      assignedTo: proposal.assignedTo ?? null,
      assignedToName: proposal.assignedToName ?? null,
      timeframe: proposal.timeframe ?? null,
      workDeadline: proposal.workDeadline ?? null,
      isBillable: true,
      lineItems: [item],
      totalAmount,
      subtotal: itemSubtotal,
      taxRate: proposal.taxRate ?? 0,
      currency: proposal.currency,
      amountPaid: 0,
      balanceDue: totalAmount,
      paymentStatus: 'unpaid',
      updatedAt: now,
    };

    if (existing.exists) {
      batch.set(requestRef, baseData, { merge: true });
      return;
    }

    batch.set(requestRef, {
      ...baseData,
      orgId: proposal.orgId,
      title: item.title || item.description,
      description: item.notes ? `${item.description}\n\n${item.notes}` : item.description,
      type: 'other',
      status: 'QUEUED',
      priority: 'NORMAL',
      createdBy: proposal.createdBy,
      createdByName: proposal.createdByName,
      clientEmail: proposal.clientEmail ?? null,
      tags: ['proposal'],
      attachmentIds: [],
      commentCount: 0,
      createdAt: now,
    });
  });

  batch.set(
    proposalRef,
    {
      requestIds,
      materializedRequestIds: requestIds,
      requestsMaterializedAt: proposal.requestsMaterializedAt ?? now,
      updatedAt: now,
    },
    { merge: true }
  );
  await batch.commit();
  return requestIds;
}

async function syncMaterializedRequestPayments(proposalId: string): Promise<void> {
  const db = getDb();
  const proposalSnapshot = await db.collection(PROPOSALS_COLLECTION).doc(proposalId).get();
  const proposal = proposalSnapshot.data() as ProposalDocument | undefined;
  const requestIds = proposal?.materializedRequestIds ?? [];
  if (!proposal || requestIds.length === 0) return;

  const requestRefs = requestIds.map(id => db.collection(REQUESTS_COLLECTION).doc(id));
  const requestSnapshots = await db.getAll(...requestRefs);
  const paidPayments = (await listPaymentDocs(proposalId))
    .filter(snapshot => (snapshot.data() as PaymentDocument).status === 'paid')
    .map(snapshot => ({ id: snapshot.id, data: snapshot.data() as PaymentDocument }));
  const requestTotals = requestSnapshots.map(snapshot => {
    const data = snapshot.data() as { totalAmount?: number } | undefined;
    return data?.totalAmount ?? 0;
  });
  const allocations = requestIds.map(() => [] as Array<{
    paymentId: string;
    amount: number;
    method: ProposalPaymentProvider;
  }>);
  const paidByRequest = requestIds.map(() => 0);
  let requestIndex = 0;

  paidPayments.forEach(payment => {
    let remaining = payment.data.amount;
    while (remaining > 0 && requestIndex < requestIds.length) {
      const available = Math.max(0, requestTotals[requestIndex] - paidByRequest[requestIndex]);
      if (available === 0) {
        requestIndex += 1;
        continue;
      }
      const amount = Math.min(available, remaining);
      allocations[requestIndex].push({
        paymentId: payment.id,
        amount,
        method: payment.data.provider,
      });
      paidByRequest[requestIndex] += amount;
      remaining -= amount;
      if (paidByRequest[requestIndex] >= requestTotals[requestIndex]) requestIndex += 1;
    }
  });

  const batch = db.batch();
  const now = admin.firestore.FieldValue.serverTimestamp();
  requestRefs.forEach((requestRef, index) => {
    const amountPaid = paidByRequest[index];
    const balanceDue = Math.max(0, requestTotals[index] - amountPaid);
    const latestAllocation = allocations[index].at(-1);
    const latestPayment = latestAllocation
      ? paidPayments.find(payment => payment.id === latestAllocation.paymentId)
      : undefined;
    batch.set(
      requestRef,
      {
        amountPaid,
        balanceDue,
        paymentStatus:
          balanceDue === 0 ? 'paid' : amountPaid > 0 ? 'partially_paid' : 'unpaid',
        paymentIds: allocations[index].map(allocation => allocation.paymentId),
        paymentAllocations: allocations[index],
        paymentId: latestAllocation?.paymentId ?? null,
        paymentMethod: latestAllocation?.method ?? null,
        paidAt: balanceDue === 0 && amountPaid > 0 ? latestPayment?.data.paidAt ?? now : null,
        updatedAt: now,
      },
      { merge: true }
    );
  });
  await batch.commit();
}

function calculateInspectionSplit(grossRevenue: number, existing?: Record<string, unknown>) {
  const directExpenses = (existing?.directExpenses as Array<{ amount: number }> | undefined) ?? [];
  const participants =
    (existing?.participants as Array<{
      id: string;
      userId: string;
      userName: string;
      role: string;
      percentage: number;
      notes?: string;
    }> | undefined) ??
    [
      { id: 'auto_lead', userId: '', userName: '', role: 'lead', percentage: 15 },
      { id: 'auto_sales', userId: '', userName: '', role: 'sales', percentage: 10 },
      { id: 'auto_management', userId: '', userName: '', role: 'management', percentage: 25 },
      { id: 'auto_delivery', userId: '', userName: '', role: 'delivery', percentage: 50 },
    ];
  const totalExpenses = directExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const netProfit = grossRevenue - totalExpenses;
  const calculatedParticipants = participants.map(participant => ({
    ...participant,
    amount: Math.round(netProfit * (participant.percentage / 100)),
  }));
  const totalAllocatedPercentage = Number(
    calculatedParticipants.reduce((sum, participant) => sum + participant.percentage, 0).toFixed(2)
  );
  const totalAllocatedAmount = calculatedParticipants.reduce(
    (sum, participant) => sum + participant.amount,
    0
  );
  return {
    directExpenses,
    totalExpenses,
    netProfit,
    participants: calculatedParticipants,
    totalAllocatedPercentage,
    totalAllocatedAmount,
    unallocatedPercentage: Number((100 - totalAllocatedPercentage).toFixed(2)),
    unallocatedAmount: netProfit - totalAllocatedAmount,
  };
}

async function syncProfitSplitInspection(proposalId: string): Promise<void> {
  const db = getDb();
  const proposalSnapshot = await db.collection(PROPOSALS_COLLECTION).doc(proposalId).get();
  const proposal = proposalSnapshot.data() as ProposalDocument | undefined;
  if (!proposal) return;

  const existingSnapshot = await db
    .collection(PROFIT_SPLITS_COLLECTION)
    .where('pricingRequestId', '==', proposalId)
    .limit(1)
    .get();
  const splitRef =
    existingSnapshot.docs[0]?.ref ?? db.collection(PROFIT_SPLITS_COLLECTION).doc(`proposal_${proposalId}`);
  const existing = existingSnapshot.docs[0]?.data() as Record<string, unknown> | undefined;

  const paidPayments = (await listPaymentDocs(proposalId)).filter(
    snapshot => (snapshot.data() as PaymentDocument).status === 'paid'
  );
  const now = admin.firestore.FieldValue.serverTimestamp();
  const amountPaid = proposal.amountPaid ?? 0;
  const inspectedPaymentIds = paidPayments.map(payment => payment.id);
  if (amountPaid <= 0 && !existing) return;

  if (existing?.status === 'finalized') {
    await splitRef.set(
      {
        reconciliationRequired: true,
        proposalPaymentStatus: proposal.paymentStatus ?? 'pending',
        inspectedPaymentIds,
        updatedAt: now,
      },
      { merge: true }
    );
    return;
  }

  await splitRef.set(
    {
      pricingRequestId: proposalId,
      orgId: proposal.orgId,
      clientName: proposal.clientName ?? null,
      clientEmail: proposal.clientEmail ?? null,
      projectTitle: proposal.title,
      currency: proposal.currency,
      grossRevenue: amountPaid,
      ...calculateInspectionSplit(amountPaid, existing),
      status: 'draft',
      createdBy: (existing?.createdBy as string | undefined) ?? 'server',
      createdByName: (existing?.createdByName as string | undefined) ?? 'Payment reconciliation',
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      proposalPaymentStatus: proposal.paymentStatus ?? 'pending',
      inspectedPaymentIds,
    },
    { merge: true }
  );
}

async function syncProposalDerivedState(proposalId: string): Promise<void> {
  await materializeProposalRequests(proposalId);
  await syncMaterializedRequestPayments(proposalId);
  await syncProfitSplitInspection(proposalId);
}

export async function getPublicProposal(token: string): Promise<PublicPricingProposal | null> {
  const proposal = await findProposalByToken(token);
  if (!proposal || proposal.data().publicAccessEnabled !== true) {
    return null;
  }
  return sanitizeProposal(proposal);
}

export async function acceptPublicProposal(
  token: string,
  payload: AcceptPricingRequestPayload,
  audit: { ip?: string; userAgent?: string }
): Promise<PublicPricingProposal> {
  const db = getDb();
  const proposalSnapshot = await findProposalByToken(token);
  if (!proposalSnapshot || proposalSnapshot.data().publicAccessEnabled !== true) {
    throw new Error('NOT_FOUND');
  }

  await db.runTransaction(async transaction => {
    const fresh = await transaction.get(proposalSnapshot.ref);
    const proposal = fresh.data() as ProposalDocument | undefined;
    if (!proposal) throw new Error('NOT_FOUND');

    if (proposal.status === 'ACCEPTED' || proposal.status === 'PAID') {
      return;
    }
    if (proposal.status !== 'SENT') {
      throw new Error('NOT_SIGNABLE');
    }
    if (proposal.validUntil?.toDate && proposal.validUntil.toDate().getTime() < Date.now()) {
      throw new Error('EXPIRED');
    }
    if (
      !payload.termsAccepted ||
      !payload.acceptedByName.trim() ||
      !payload.signatureText.trim()
    ) {
      throw new Error('INVALID_SIGNATURE');
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    const updates: Record<string, unknown> = {
      status: 'ACCEPTED',
      acceptedAt: now,
      termsAcceptedAt: now,
      acceptedByName: payload.acceptedByName.trim(),
      acceptedByEmail: payload.acceptedByEmail?.trim().toLowerCase() || null,
      signatureText: payload.signatureText.trim(),
      acceptedIp: audit.ip || null,
      acceptedUserAgent: audit.userAgent || null,
      lockedAt: now,
      updatedAt: now,
    };

    const depositAmount = proposal.paymentRequired ? proposal.depositAmount ?? 0 : 0;
    if (depositAmount > 0) {
      const paymentRef = db.collection(PAYMENTS_COLLECTION).doc(`deposit_${fresh.id}`);
      transaction.set(
        paymentRef,
        createPaymentDocument({
          proposalId: fresh.id,
          type: 'deposit',
          label: 'Contract deposit',
          amount: depositAmount,
          currency: proposal.currency,
        }),
        { merge: true }
      );
      updates.pendingAmount = depositAmount;
      updates.paymentStatus = 'pending';
    }

    transaction.update(fresh.ref, updates);
  });

  await syncProposalDerivedState(proposalSnapshot.id);
  const accepted = await findProposalByToken(token);
  if (!accepted) throw new Error('NOT_FOUND');
  return sanitizeProposal(accepted);
}

export async function ensureProposalPublicToken(proposalId: string): Promise<string> {
  const db = getDb();
  const ref = db.collection(PROPOSALS_COLLECTION).doc(proposalId);
  return db.runTransaction(async transaction => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) throw new Error('NOT_FOUND');
    const data = snapshot.data() as ProposalDocument;
    if (data.publicToken) {
      if (data.publicAccessEnabled !== true) {
        transaction.update(ref, { publicAccessEnabled: true });
      }
      return data.publicToken;
    }
    const publicToken = randomUUID();
    transaction.update(ref, {
      publicToken,
      publicAccessEnabled: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return publicToken;
  });
}

function getProposalPublicUrl(token: string, locale: 'en' | 'he') {
  const baseUrl =
    process.env.NEXT_PUBLIC_PORTAL_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://portal.cart-shift.com';
  return `${baseUrl.replace(/\/$/, '')}/${locale}/proposal/${token}`;
}

export async function queueProposalOfferEmail(
  proposalId: string,
  locale: 'en' | 'he'
): Promise<{ queueId: string }> {
  const db = getDb();
  const proposalRef = db.collection(PROPOSALS_COLLECTION).doc(proposalId);
  const queueRef = db.collection('email_queue').doc();

  await db.runTransaction(async transaction => {
    const snapshot = await transaction.get(proposalRef);
    const proposal = snapshot.data() as ProposalDocument | undefined;
    if (!proposal) throw new Error('NOT_FOUND');
    if (proposal.status !== 'DRAFT' && proposal.status !== 'SENT') {
      throw new Error('NOT_SENDABLE');
    }

    const recipient = proposal.clientEmail?.trim().toLowerCase();
    if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
      throw new Error('INVALID_CLIENT_EMAIL');
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    const publicToken = proposal.publicToken || randomUUID();
    const totalAmount = formatCurrency(proposal.totalAmount, proposal.currency);
    const actionUrl = getProposalPublicUrl(publicToken, locale);
    const subject =
      locale === 'he'
        ? `הצעת המחיר שלך מוכנה | ${proposal.title}`
        : `Your proposal is ready | ${proposal.title}`;

    transaction.create(queueRef, {
      status: 'pending',
      to: recipient,
      subject,
      templateName: 'quote_received',
      data: {
        requestTitle: proposal.title,
        totalAmount,
        actionUrl,
        locale,
        clientName: proposal.clientName ?? null,
        validUntil: proposal.validUntil?.toDate
          ? proposal.validUntil.toDate().toLocaleDateString(locale === 'he' ? 'he-IL' : 'en-US')
          : null,
        timeframe: proposal.timeframe ?? null,
        proposalId,
        orgId: proposal.orgId,
      },
      tags: [
        { name: 'type', value: 'proposal_offer' },
        { name: 'locale', value: locale },
      ],
      createdAt: now,
    });
    transaction.update(proposalRef, {
      status: 'SENT',
      publicToken,
      publicAccessEnabled: true,
      sentAt: proposal.sentAt ?? now,
      lastSentAt: now,
      offerEmailQueueId: queueRef.id,
      offerEmailRecipient: recipient,
      updatedAt: now,
    });
  });
  return { queueId: queueRef.id };
}

export async function listProposalPayments(proposalId: string): Promise<AgencyProposalPayment[]> {
  return (await listPaymentDocs(proposalId)).map(sanitizeAgencyPayment);
}

export async function createProposalInstallment(
  proposalId: string,
  input: { amount: number; label: string; dueAt?: Date; type?: ProposalPaymentType },
  createdBy: string
): Promise<AgencyProposalPayment> {
  const db = getDb();
  const proposalRef = db.collection(PROPOSALS_COLLECTION).doc(proposalId);
  const paymentRef = db.collection(PAYMENTS_COLLECTION).doc();

  await db.runTransaction(async transaction => {
    const snapshot = await transaction.get(proposalRef);
    if (!snapshot.exists) throw new Error('NOT_FOUND');
    const proposal = snapshot.data() as ProposalDocument;
    if (proposal.status !== 'ACCEPTED') throw new Error('NOT_ACCEPTED');

    const available = (proposal.balanceDue ?? proposal.totalAmount) - (proposal.pendingAmount ?? 0);
    if (!Number.isInteger(input.amount) || input.amount < 1 || input.amount > available) {
      throw new Error('INVALID_AMOUNT');
    }
    if (!input.label.trim()) throw new Error('INVALID_LABEL');

    transaction.set(
      paymentRef,
      createPaymentDocument({
        proposalId,
        type: input.type ?? (input.amount === available ? 'final' : 'installment'),
        label: input.label,
        amount: input.amount,
        currency: proposal.currency,
        dueAt: input.dueAt,
        createdBy,
      })
    );
    transaction.update(proposalRef, {
      pendingAmount: (proposal.pendingAmount ?? 0) + input.amount,
      paymentStatus: proposal.amountPaid ? 'partially_paid' : 'pending',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  return sanitizeAgencyPayment(await paymentRef.get());
}

export async function recordManualProposalPayment(
  proposalId: string,
  input: {
    amount: number;
    label: string;
    method: ManualPaymentMethod;
    reference?: string;
    note?: string;
  },
  createdBy: string
): Promise<PublicProposalPayment> {
  const db = getDb();
  const proposalRef = db.collection(PROPOSALS_COLLECTION).doc(proposalId);
  const paymentRef = db.collection(PAYMENTS_COLLECTION).doc();

  await db.runTransaction(async transaction => {
    const snapshot = await transaction.get(proposalRef);
    if (!snapshot.exists) throw new Error('NOT_FOUND');
    const proposal = snapshot.data() as ProposalDocument;
    if (proposal.status !== 'ACCEPTED' && proposal.status !== 'PAID') {
      throw new Error('NOT_ACCEPTED');
    }
    const balanceDue = proposal.balanceDue ?? proposal.totalAmount;
    if (!Number.isInteger(input.amount) || input.amount < 1 || input.amount > balanceDue) {
      throw new Error('INVALID_AMOUNT');
    }
    if (!input.label.trim()) throw new Error('INVALID_LABEL');

    transaction.set(
      paymentRef,
      createPaymentDocument({
        proposalId,
        type:
          proposal.paymentRequired && (proposal.amountPaid ?? 0) < (proposal.depositAmount ?? 0)
            ? 'deposit'
            : input.amount === balanceDue
              ? 'final'
              : 'installment',
        label: input.label,
        amount: input.amount,
        currency: proposal.currency,
        createdBy,
        provider: 'manual',
        manualMethod: input.method,
        manualReference: input.reference,
        note: input.note,
      })
    );
  });

  await reconcileProposalPayment({ paymentId: paymentRef.id, status: 'paid' });
  return sanitizePayment(await paymentRef.get());
}

export async function cancelProposalPayment(proposalId: string, paymentId: string): Promise<void> {
  const db = getDb();
  const proposalRef = db.collection(PROPOSALS_COLLECTION).doc(proposalId);
  const paymentRef = db.collection(PAYMENTS_COLLECTION).doc(paymentId);

  await db.runTransaction(async transaction => {
    const [proposalSnapshot, paymentSnapshot] = await Promise.all([
      transaction.get(proposalRef),
      transaction.get(paymentRef),
    ]);
    const proposal = proposalSnapshot.data() as ProposalDocument | undefined;
    const payment = paymentSnapshot.data() as PaymentDocument | undefined;
    if (!proposal || !payment || payment.proposalId !== proposalId) throw new Error('NOT_FOUND');
    if (payment.status !== 'pending' && payment.status !== 'failed') throw new Error('NOT_CANCELABLE');

    transaction.update(paymentRef, {
      status: 'canceled',
      canceledAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    transaction.update(proposalRef, {
      pendingAmount:
        payment.status === 'pending'
          ? Math.max(0, (proposal.pendingAmount ?? 0) - payment.amount)
          : proposal.pendingAmount ?? 0,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
}

export async function getPublicProposalPayment(proposalToken: string, paymentToken: string) {
  const proposal = await findProposalByToken(proposalToken);
  if (!proposal || proposal.data().publicAccessEnabled !== true) return null;
  const paymentSnapshot = await getDb()
    .collection(PAYMENTS_COLLECTION)
    .where('proposalId', '==', proposal.id)
    .where('paymentToken', '==', paymentToken)
    .limit(1)
    .get();
  const payment = paymentSnapshot.docs[0];
  if (!payment) return null;
  return { proposal: await sanitizeProposal(proposal), payment: sanitizePayment(payment) };
}

export async function savePayPalOrder(paymentToken: string, orderId: string): Promise<void> {
  const db = getDb();
  const payment = await db
    .collection(PAYMENTS_COLLECTION)
    .where('paymentToken', '==', paymentToken)
    .limit(1)
    .get();
  const snapshot = payment.docs[0];
  if (!snapshot) throw new Error('NOT_FOUND');
  const status = (snapshot.data() as PaymentDocument).status;
  if (status !== 'pending' && status !== 'failed') throw new Error('NOT_PAYABLE');
  await db.runTransaction(async transaction => {
    const fresh = await transaction.get(snapshot.ref);
    const freshPayment = fresh.data() as PaymentDocument | undefined;
    if (!freshPayment) throw new Error('NOT_FOUND');
    if (freshPayment.status !== 'pending' && freshPayment.status !== 'failed') {
      throw new Error('NOT_PAYABLE');
    }
    const now = admin.firestore.FieldValue.serverTimestamp();
    const proposalRef =
      freshPayment.status === 'failed'
        ? db.collection(PROPOSALS_COLLECTION).doc(freshPayment.proposalId)
        : null;
    const proposal = proposalRef
      ? ((await transaction.get(proposalRef)).data() as ProposalDocument | undefined)
      : null;
    if (proposalRef && !proposal) throw new Error('NOT_FOUND');

    transaction.update(snapshot.ref, {
      paypalOrderId: orderId,
      status: 'pending',
      updatedAt: now,
    });
    if (proposalRef && proposal) {
      transaction.update(proposalRef, {
        pendingAmount: (proposal.pendingAmount ?? 0) + freshPayment.amount,
        paymentStatus: proposal.amountPaid ? 'partially_paid' : 'pending',
        updatedAt: now,
      });
    }
  });
}

export async function assertPayPalOrderForPayment(
  proposalToken: string,
  paymentToken: string,
  orderId: string
): Promise<void> {
  const proposal = await findProposalByToken(proposalToken);
  if (!proposal || proposal.data().publicAccessEnabled !== true) throw new Error('NOT_FOUND');
  const snapshot = await getDb()
    .collection(PAYMENTS_COLLECTION)
    .where('proposalId', '==', proposal.id)
    .where('paymentToken', '==', paymentToken)
    .where('paypalOrderId', '==', orderId)
    .limit(1)
    .get();
  if (snapshot.empty) throw new Error('NOT_FOUND');
}

export async function reconcileProposalPayment(input: {
  paymentId?: string;
  orderId?: string;
  captureId?: string;
  status: 'paid' | 'failed' | 'refunded';
}): Promise<void> {
  const db = getDb();
  const paymentRef = input.paymentId
    ? db.collection(PAYMENTS_COLLECTION).doc(input.paymentId)
    : (
        await (input.orderId
          ? db.collection(PAYMENTS_COLLECTION).where('paypalOrderId', '==', input.orderId)
          : input.captureId
            ? db.collection(PAYMENTS_COLLECTION).where('paypalCaptureId', '==', input.captureId)
            : (() => {
                throw new Error('PAYMENT_REFERENCE_REQUIRED');
              })()
        )
          .limit(1)
          .get()
      ).docs[0]?.ref;
  if (!paymentRef) throw new Error('NOT_FOUND');

  await db.runTransaction(async transaction => {
    const paymentSnapshot = await transaction.get(paymentRef);
    const payment = paymentSnapshot.data() as PaymentDocument | undefined;
    if (!payment) throw new Error('NOT_FOUND');
    const proposalRef = db.collection(PROPOSALS_COLLECTION).doc(payment.proposalId);
    const proposalSnapshot = await transaction.get(proposalRef);
    const proposal = proposalSnapshot.data() as ProposalDocument | undefined;
    if (!proposal) throw new Error('NOT_FOUND');

    const wasPaid = payment.status === 'paid';
    const now = admin.firestore.FieldValue.serverTimestamp();
    const paymentUpdates: Record<string, unknown> = {
      paypalCaptureId: input.captureId ?? payment.paypalCaptureId ?? null,
      updatedAt: now,
    };

    let amountPaid = proposal.amountPaid ?? 0;
    let pendingAmount = proposal.pendingAmount ?? 0;

    if (input.status === 'paid') {
      paymentUpdates.status = 'paid';
      paymentUpdates.paidAt = now;
      if (!wasPaid) {
        amountPaid += payment.amount;
        pendingAmount = Math.max(0, pendingAmount - payment.amount);
      }
    } else if (input.status === 'refunded') {
      paymentUpdates.status = 'refunded';
      paymentUpdates.refundedAt = now;
      if (wasPaid) amountPaid = Math.max(0, amountPaid - payment.amount);
    } else {
      paymentUpdates.status = 'failed';
      paymentUpdates.failedAt = now;
      if (!wasPaid) pendingAmount = Math.max(0, pendingAmount - payment.amount);
    }

    const balanceDue = Math.max(0, proposal.totalAmount - amountPaid);
    const paymentStatus =
      balanceDue === 0
        ? 'paid'
        : amountPaid > 0
          ? 'partially_paid'
          : input.status === 'failed'
            ? 'failed'
            : 'pending';
    const proposalUpdates: Record<string, unknown> = {
      amountPaid,
      balanceDue,
      pendingAmount,
      paymentStatus,
      updatedAt: now,
    };
    if (input.status === 'paid' && !wasPaid) {
      proposalUpdates.firstPaymentAt = proposal.firstPaymentAt ?? now;
      proposalUpdates.lastPaymentAt = now;
      proposalUpdates.paymentId = input.captureId ?? input.orderId ?? paymentRef.id;
      proposalUpdates.paymentMethod = payment.provider ?? 'paypal';
      proposalUpdates.paymentReference =
        input.captureId ?? input.orderId ?? payment.manualReference ?? paymentRef.id;
    }
    if (balanceDue === 0) {
      proposalUpdates.status = 'PAID';
      proposalUpdates.paidAt = now;
    } else if (proposal.status === 'PAID') {
      proposalUpdates.status = 'ACCEPTED';
      proposalUpdates.paidAt = null;
    }

    transaction.update(paymentRef, paymentUpdates);
    transaction.update(proposalRef, proposalUpdates);
  });
  const payment = (await paymentRef.get()).data() as PaymentDocument | undefined;
  if (payment) await syncProposalDerivedState(payment.proposalId);
}

export async function findPaymentByPayPalReference(orderId?: string, captureId?: string) {
  const db = getDb();
  let query: admin.firestore.Query = db.collection(PAYMENTS_COLLECTION);
  if (orderId) query = query.where('paypalOrderId', '==', orderId);
  else if (captureId) query = query.where('paypalCaptureId', '==', captureId);
  else return null;
  return (await query.limit(1).get()).docs[0] || null;
}
