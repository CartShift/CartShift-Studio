import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { z } from 'zod';
import { getFirebaseAuth, getFirestoreDb, waitForAuth } from '@/lib/firebase';
import { getAgencyTeam } from '@/lib/services/portal-agency';
import { getOrganization } from '@/lib/services/portal-organizations';
import { getPortalUser } from '@/lib/services/portal-users';
import { PRICING_STATUS, PricingRequest } from '@/lib/types/pricing';
import {
  PROFIT_SPLIT_ROLE,
  PROFIT_SPLIT_STATUS,
  ProfitSplit,
  ProfitSplitCalculationInput,
  ProfitSplitCalculationResult,
  ProfitSplitParticipant,
  ProfitSplitStatus,
  RequestProfitSplitResponsibility,
  UpdateProfitSplitData,
} from '@/lib/types/profit-split';
import { USER_ROLE } from '@/lib/types/portal';
import { deepClean } from '@/lib/utils';
import {
  extractStoredProfitSplitResponsibilities,
  normalizeRequestProfitSplitResponsibilities,
  resolveProfitSplitResponsibilitiesFromContext,
  resolveRequestProfitSplitResponsibilities,
  responsibilitiesToParticipantInput,
} from '@/lib/utils/profit-split-responsibilities';
import { hasPermission, PERMISSIONS } from '@/lib/utils/permissions';

const PROFIT_SPLITS_COLLECTION = 'portal_profit_splits';
const PRICING_COLLECTION = 'portal_requests';

const expenseSchema = z.object({
  id: z.string().min(1),
  description: z.string(),
  amount: z.number().int().min(0),
});

const participantSchema = z.object({
  id: z.string().min(1),
  userId: z.string(),
  userName: z.string(),
  role: z.enum([
    PROFIT_SPLIT_ROLE.LEAD,
    PROFIT_SPLIT_ROLE.SALES,
    PROFIT_SPLIT_ROLE.MANAGEMENT,
    PROFIT_SPLIT_ROLE.DELIVERY,
  ]),
  percentage: z.number().min(0).max(100),
  notes: z.string().optional(),
});

const calculationSchema = z.object({
  grossRevenue: z.number().int().min(0),
  directExpenses: z.array(expenseSchema),
  participants: z.array(participantSchema),
});

function normalizeParticipant(participant: Omit<ProfitSplitParticipant, 'amount'>) {
  return {
    ...participant,
    userId: participant.userId.trim(),
    userName: participant.userName.trim(),
    notes: participant.notes?.trim() || undefined,
  };
}

async function verifyProfitSplitAccess(): Promise<{ userId: string; userName: string }> {
  const auth = getFirebaseAuth();
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error('User must be authenticated');
  }

  const userData = await getPortalUser(currentUser.uid);
  if (!userData || (userData.accountType !== 'AGENCY' && !userData.isAgency)) {
    throw new Error('Agency permissions required');
  }

  // Legacy agency owners predate agencyRole; the portal shell already treats them as owners.
  if (!hasPermission(userData.agencyRole ?? USER_ROLE.OWNER, PERMISSIONS.MANAGE_PROFIT_SPLITS)) {
    throw new Error('Profit split permissions required');
  }

  return {
    userId: currentUser.uid,
    userName: userData.name || currentUser.displayName || currentUser.email || 'Agency user',
  };
}

export function createDefaultProfitSplitParticipants(): Omit<ProfitSplitParticipant, 'amount'>[] {
  return responsibilitiesToParticipantInput(resolveRequestProfitSplitResponsibilities({}));
}

async function resolveResponsibleAgencyUserName(
  responsibleAgencyUserId?: string,
  agencyTeam?: Awaited<ReturnType<typeof getAgencyTeam>>
): Promise<string> {
  if (!responsibleAgencyUserId?.trim()) return '';
  const fromTeam = agencyTeam?.find(member => member.id === responsibleAgencyUserId);
  if (fromTeam) return fromTeam.name || fromTeam.email || '';
  const user = await getPortalUser(responsibleAgencyUserId);
  return user?.name || user?.email || '';
}

async function resolveResponsibilitiesForRequest(
  request: Pick<
    PricingRequest,
    'orgId' | 'assignedTo' | 'assignedToName' | 'profitSplitResponsibilities'
  >
): Promise<RequestProfitSplitResponsibility[]> {
  const organization = await getOrganization(request.orgId);
  const agencyTeam = await getAgencyTeam();
  const responsibleAgencyUserName = await resolveResponsibleAgencyUserName(
    organization?.responsibleAgencyUserId,
    agencyTeam
  );
  return resolveProfitSplitResponsibilitiesFromContext(
    request,
    organization,
    responsibleAgencyUserName
  );
}

export async function updateRequestProfitSplitResponsibilities(
  requestId: string,
  responsibilities: RequestProfitSplitResponsibility[]
): Promise<void> {
  await waitForAuth();
  await verifyProfitSplitAccess();

  const normalized = normalizeRequestProfitSplitResponsibilities(responsibilities);
  const db = getFirestoreDb();
  const requestRef = doc(db, PRICING_COLLECTION, requestId);
  const requestSnap = await getDoc(requestRef);
  if (!requestSnap.exists()) throw new Error('Request not found');

  const request = { id: requestSnap.id, ...requestSnap.data() } as PricingRequest;
  const organization = await getOrganization(request.orgId);
  const agencyTeam = await getAgencyTeam();
  const responsibleAgencyUserName = await resolveResponsibleAgencyUserName(
    organization?.responsibleAgencyUserId,
    agencyTeam
  );
  const resolved = resolveProfitSplitResponsibilitiesFromContext(
    {
      ...request,
      profitSplitResponsibilities: normalized,
    },
    organization,
    responsibleAgencyUserName
  );

  await updateDoc(requestRef, {
    profitSplitResponsibilities: extractStoredProfitSplitResponsibilities(resolved),
    updatedAt: serverTimestamp(),
  });

  await syncProfitSplitDraftForRequest(requestId);
}

export async function trySyncProfitSplitDraftForRequest(requestId: string): Promise<void> {
  try {
    await syncProfitSplitDraftForRequest(requestId);
  } catch {
    // Non-finance users cannot sync splits; payment reconciliation handles server-side sync.
  }
}

async function syncProfitSplitDraftForRequest(requestId: string): Promise<void> {
  const existing = await getProfitSplitByPricingRequestId(requestId);
  if (existing?.status === PROFIT_SPLIT_STATUS.FINALIZED) return;

  const db = getFirestoreDb();
  const requestSnap = await getDoc(doc(db, PRICING_COLLECTION, requestId));
  if (!requestSnap.exists()) return;

  const request = { id: requestSnap.id, ...requestSnap.data() } as PricingRequest;
  const amountPaid =
    request.amountPaid ?? (request.status === PRICING_STATUS.PAID ? request.totalAmount : 0);
  if (amountPaid <= 0 && !existing) return;

  const responsibilities = await resolveResponsibilitiesForRequest(request);
  const directExpenses = existing?.directExpenses ?? [];
  const calculation = calculateProfitSplit({
    grossRevenue: amountPaid,
    directExpenses,
    participants: responsibilitiesToParticipantInput(responsibilities),
  });

  const payload = deepClean({
    requestId,
    pricingRequestId: requestId,
    orgId: request.orgId,
    clientName: request.clientName ?? null,
    clientEmail: request.clientEmail ?? null,
    projectTitle: request.title,
    currency: request.currency,
    grossRevenue: amountPaid,
    ...calculation,
    status: PROFIT_SPLIT_STATUS.DRAFT,
    updatedAt: serverTimestamp(),
  });

  if (existing) {
    await updateDoc(doc(db, PROFIT_SPLITS_COLLECTION, existing.id), payload);
    return;
  }

  const creator = await verifyProfitSplitAccess();
  await addDoc(collection(db, PROFIT_SPLITS_COLLECTION), {
    ...payload,
    createdBy: creator.userId,
    createdByName: creator.userName,
    createdAt: serverTimestamp(),
  });
}

export function calculateProfitSplit(
  input: ProfitSplitCalculationInput
): ProfitSplitCalculationResult {
  const parsed = calculationSchema.parse({
    grossRevenue: input.grossRevenue,
    directExpenses: input.directExpenses,
    participants: input.participants.map(normalizeParticipant),
  });

  const totalExpenses = parsed.directExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const netProfit = parsed.grossRevenue - totalExpenses;
  const totalAllocatedPercentage = Number(
    parsed.participants.reduce((sum, participant) => sum + participant.percentage, 0).toFixed(2)
  );

  const rawAmounts = parsed.participants.map(participant => ({
    participant,
    rawAmount: netProfit * (participant.percentage / 100),
  }));

  let participants = rawAmounts.map(({ participant, rawAmount }) => ({
    ...participant,
    amount: Math.round(rawAmount),
  }));

  // Ensure a finalized 100% split allocates every cent deterministically.
  if (netProfit >= 0 && totalAllocatedPercentage === 100) {
    const flooredAmounts = rawAmounts.map(({ participant, rawAmount }, index) => ({
      participant,
      amount: Math.floor(rawAmount),
      remainder: rawAmount - Math.floor(rawAmount),
      index,
    }));
    let centsToAllocate =
      netProfit - flooredAmounts.reduce((sum, participant) => sum + participant.amount, 0);

    for (const participant of [...flooredAmounts].sort(
      (a, b) => b.remainder - a.remainder || a.index - b.index
    )) {
      if (centsToAllocate <= 0) break;
      participant.amount += 1;
      centsToAllocate -= 1;
    }

    participants = flooredAmounts.map(({ participant, amount }) => ({ ...participant, amount }));
  }

  const totalAllocatedAmount = participants.reduce(
    (sum, participant) => sum + participant.amount,
    0
  );
  const unallocatedPercentage = Number((100 - totalAllocatedPercentage).toFixed(2));

  return {
    directExpenses: parsed.directExpenses,
    totalExpenses,
    netProfit,
    participants,
    totalAllocatedPercentage,
    totalAllocatedAmount,
    unallocatedPercentage,
    unallocatedAmount: netProfit - totalAllocatedAmount,
  };
}

function assertCanFinalize(split: ProfitSplit | ProfitSplitCalculationResult): void {
  if (split.netProfit < 0) {
    throw new Error('Net profit must be non-negative before finalizing');
  }

  if (split.totalAllocatedPercentage !== 100) {
    throw new Error('Total allocation must equal 100% before finalizing');
  }

  const missingUser = split.participants.some(
    participant => !participant.userId.trim() || !participant.userName.trim()
  );
  if (missingUser) {
    throw new Error('All finalized participants must have an assigned agency user');
  }
}

export async function getPaidPricingRequestsForProfitSplits(): Promise<PricingRequest[]> {
  await waitForAuth();
  await verifyProfitSplitAccess();

  const db = getFirestoreDb();
  const q = query(collection(db, PRICING_COLLECTION));

  const snapshot = await getDocs(q);
  return (snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PricingRequest[])
    .filter(request => request.requestRole !== 'bundle_item' && Boolean(request.isBillable || request.publicToken))
    .filter(request => (request.amountPaid ?? (request.status === PRICING_STATUS.PAID ? request.totalAmount : 0)) > 0)
    .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
}

export async function createProfitSplitFromPricingRequest(
  pricingRequestId: string
): Promise<ProfitSplit> {
  await waitForAuth();
  const creator = await verifyProfitSplitAccess();
  const existing = await getProfitSplitByPricingRequestId(pricingRequestId);
  if (existing) {
    return existing;
  }

  const db = getFirestoreDb();
  const pricingDoc = await getDoc(doc(db, PRICING_COLLECTION, pricingRequestId));
  if (!pricingDoc.exists()) {
    throw new Error('Pricing request not found');
  }

  const pricingRequest = { id: pricingDoc.id, ...pricingDoc.data() } as PricingRequest;
  const recognizedRevenue =
    pricingRequest.amountPaid ??
    (pricingRequest.status === PRICING_STATUS.PAID ? pricingRequest.totalAmount : 0);
  if (recognizedRevenue <= 0) {
    throw new Error('Profit splits can only be created after a payment is recorded');
  }

  const responsibilities = await resolveResponsibilitiesForRequest(pricingRequest);
  const calculation = calculateProfitSplit({
    grossRevenue: recognizedRevenue,
    directExpenses: [],
    participants: responsibilitiesToParticipantInput(responsibilities),
  });

  const createData = deepClean({
    requestId: pricingRequestId,
    pricingRequestId,
    orgId: pricingRequest.orgId,
    clientName: pricingRequest.clientName || null,
    clientEmail: pricingRequest.clientEmail || null,
    projectTitle: pricingRequest.title,
    currency: pricingRequest.currency,
    grossRevenue: recognizedRevenue,
    ...calculation,
    status: PROFIT_SPLIT_STATUS.DRAFT,
    createdBy: creator.userId,
    createdByName: creator.userName,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const docRef = await addDoc(collection(db, PROFIT_SPLITS_COLLECTION), createData);

  return {
    id: docRef.id,
    ...createData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  } as ProfitSplit;
}

export async function getProfitSplit(id: string): Promise<ProfitSplit | null> {
  await waitForAuth();
  await verifyProfitSplitAccess();

  const db = getFirestoreDb();
  const snapshot = await getDoc(doc(db, PROFIT_SPLITS_COLLECTION, id));
  if (!snapshot.exists()) return null;

  return { id: snapshot.id, ...snapshot.data() } as ProfitSplit;
}

export async function getProfitSplitByPricingRequestId(
  pricingRequestId: string
): Promise<ProfitSplit | null> {
  await waitForAuth();
  await verifyProfitSplitAccess();

  const db = getFirestoreDb();
  let q = query(
    collection(db, PROFIT_SPLITS_COLLECTION),
    where('requestId', '==', pricingRequestId)
  );
  let snapshot = await getDocs(q);
  if (snapshot.empty) {
    q = query(
      collection(db, PROFIT_SPLITS_COLLECTION),
      where('pricingRequestId', '==', pricingRequestId)
    );
    snapshot = await getDocs(q);
  }
  const first = snapshot.docs[0];

  return first ? ({ id: first.id, ...first.data() } as ProfitSplit) : null;
}

export async function getProfitSplits(options?: {
  status?: ProfitSplitStatus;
}): Promise<ProfitSplit[]> {
  await waitForAuth();
  await verifyProfitSplitAccess();

  const db = getFirestoreDb();
  const q = query(collection(db, PROFIT_SPLITS_COLLECTION), orderBy('updatedAt', 'desc'));
  const snapshot = await getDocs(q);
  const splits = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ProfitSplit[];

  return options?.status ? splits.filter(split => split.status === options.status) : splits;
}

export async function updateProfitSplit(id: string, data: UpdateProfitSplitData): Promise<void> {
  await waitForAuth();
  await verifyProfitSplitAccess();

  const existing = await getProfitSplit(id);
  if (!existing) {
    throw new Error('Profit split not found');
  }

  if (existing.status === PROFIT_SPLIT_STATUS.FINALIZED) {
    throw new Error('Finalized profit splits cannot be edited');
  }

  const grossRevenue = existing.grossRevenue;
  const directExpenses = data.directExpenses ?? existing.directExpenses;

  const requestSnap = await getDoc(
    doc(getFirestoreDb(), PRICING_COLLECTION, existing.requestId ?? existing.pricingRequestId)
  );
  const request = requestSnap.exists()
    ? ({ id: requestSnap.id, ...requestSnap.data() } as PricingRequest)
    : null;
  const responsibilities = request ? await resolveResponsibilitiesForRequest(request) : [];
  const participants = responsibilitiesToParticipantInput(responsibilities);
  const calculation = calculateProfitSplit({ grossRevenue, directExpenses, participants });

  const updateData = deepClean({
    clientName: request?.clientName?.trim() ?? existing.clientName,
    clientEmail: request?.clientEmail?.trim().toLowerCase() ?? existing.clientEmail,
    projectTitle: request?.title?.trim() ?? existing.projectTitle,
    grossRevenue,
    ...calculation,
    updatedAt: serverTimestamp(),
  });

  const db = getFirestoreDb();
  await updateDoc(doc(db, PROFIT_SPLITS_COLLECTION, id), updateData);
}

export async function deleteProfitSplit(id: string): Promise<void> {
  await waitForAuth();
  await verifyProfitSplitAccess();

  const existing = await getProfitSplit(id);
  if (!existing) {
    throw new Error('Profit split not found');
  }

  if (existing.status === PROFIT_SPLIT_STATUS.FINALIZED) {
    throw new Error('Finalized profit splits cannot be deleted');
  }

  const db = getFirestoreDb();
  await deleteDoc(doc(db, PROFIT_SPLITS_COLLECTION, id));
}

export async function finalizeProfitSplit(id: string): Promise<void> {
  await waitForAuth();
  await verifyProfitSplitAccess();

  const split = await getProfitSplit(id);
  if (!split) {
    throw new Error('Profit split not found');
  }

  if (!split.projectTitle.trim()) {
    throw new Error('Project title is required before finalizing');
  }

  const requestId = split.requestId ?? split.pricingRequestId;
  if (!requestId) throw new Error('Profit split is not linked to a request');
  const pricingDoc = await getDoc(doc(getFirestoreDb(), PRICING_COLLECTION, requestId));
  const pricingRequest = pricingDoc.exists()
    ? ({ id: pricingDoc.id, ...pricingDoc.data() } as PricingRequest)
    : undefined;
  const recognizedRevenue =
    pricingRequest?.amountPaid ??
    (pricingRequest?.status === PRICING_STATUS.PAID ? pricingRequest.totalAmount : 0);
  if (!pricingRequest || recognizedRevenue < pricingRequest.totalAmount) {
    throw new Error('Profit splits can only be finalized after the proposal is fully paid');
  }

  const responsibilities = await resolveResponsibilitiesForRequest(pricingRequest);
  const calculation = calculateProfitSplit({
    grossRevenue: split.grossRevenue,
    directExpenses: split.directExpenses,
    participants: responsibilitiesToParticipantInput(responsibilities),
  });
  assertCanFinalize(calculation);

  const agencyTeam = await getAgencyTeam();
  const agencyUserIds = new Set(agencyTeam.map(user => user.id));
  if (calculation.participants.some(participant => !agencyUserIds.has(participant.userId))) {
    throw new Error('All finalized participants must be active agency users');
  }

  const db = getFirestoreDb();
  await updateDoc(doc(db, PROFIT_SPLITS_COLLECTION, id), {
    ...calculation,
    status: PROFIT_SPLIT_STATUS.FINALIZED,
    finalizedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
