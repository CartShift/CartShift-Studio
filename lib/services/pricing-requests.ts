import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirestoreDb, waitForAuth, getFirebaseAuth } from '@/lib/firebase';
import { deepClean } from '@/lib/utils';
import {
  PricingRequest,
  CreatePricingRequestData,
  UpdatePricingRequestData,
  PRICING_STATUS,
  PricingStatus,
  PricingLineItem,
  AcceptPricingRequestPayload,
  PublicPricingProposal,
  calculateTotalAmount,
  generateLineItemId,
} from '@/lib/types/pricing';

const PRICING_REQUESTS_COLLECTION = 'portal_pricing_requests';

function generatePublicToken(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    return Array.from(crypto.getRandomValues(new Uint8Array(24)), byte =>
      byte.toString(16).padStart(2, '0')
    ).join('');
  }
  throw new Error('Secure public proposal links are unavailable in this browser');
}

// ============================================
// CREATE
// ============================================

export async function createPricingRequest(
  orgId: string,
  userId: string,
  userName: string,
  data: CreatePricingRequestData
): Promise<PricingRequest> {
  // Add IDs to line items
  const lineItems: PricingLineItem[] = data.lineItems.map(item => ({
    ...item,
    id: generateLineItemId(),
  }));

  const taxRate = data.taxRate ?? 0;
  const totalAmount = calculateTotalAmount(lineItems, taxRate);
  const paymentRequired = data.paymentRequired ?? false;
  const depositAmount = paymentRequired ? (data.depositAmount ?? totalAmount) : 0;

  if (paymentRequired && (depositAmount < 1 || depositAmount > totalAmount)) {
    throw new Error('Deposit amount must be between one cent and the proposal total');
  }

  const requestData = {
    orgId,
    title: data.title.trim(),
    description: data.description?.trim() || null,
    lineItems,
    totalAmount,
    taxRate,
    currency: data.currency,
    status: PRICING_STATUS.DRAFT as PricingStatus,
    proposalType: data.proposalType ?? 'work_proposal',
    terms: data.terms?.trim() || null,
    publicToken: generatePublicToken(),
    publicAccessEnabled: data.publicAccessEnabled ?? true,
    clientName: data.clientName?.trim() || null,
    clientEmail: data.clientEmail?.trim().toLowerCase() || null,
    agencyNotes: data.agencyNotes?.trim() || null,
    validUntil: data.validUntil ? Timestamp.fromDate(data.validUntil) : null,
    timeframe: data.timeframe?.trim() || null,
    workDeadline: data.workDeadline ? Timestamp.fromDate(data.workDeadline) : null,
    assignedTo: data.assignedTo?.trim() || null,
    assignedToName: data.assignedToName?.trim() || null,
    requestIds: data.requestIds || [], // Store linked request IDs
    paymentRequired,
    depositAmount,
    amountPaid: 0,
    balanceDue: totalAmount,
    billingMode: data.billingMode ?? 'manual_installments',
    paymentStatus: paymentRequired ? 'pending' : 'not_required',
    paymentProvider: paymentRequired ? 'paypal' : null,
    createdBy: userId,
    createdByName: userName,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await waitForAuth();
  const db = getFirestoreDb();
  const docRef = await addDoc(collection(db, PRICING_REQUESTS_COLLECTION), requestData);

  // Update linked requests with the pricing offer ID
  if (data.requestIds && data.requestIds.length > 0) {
    const REQUESTS_COLLECTION = 'portal_requests';
    for (const requestId of data.requestIds) {
      const requestDocRef = doc(db, REQUESTS_COLLECTION, requestId);
      await updateDoc(requestDocRef, {
        pricingOfferId: docRef.id,
        updatedAt: serverTimestamp(),
      });
    }
  }

  return {
    id: docRef.id,
    ...requestData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  } as PricingRequest;
}

// ============================================
// READ
// ============================================

export async function getPricingRequest(requestId: string): Promise<PricingRequest | null> {
  await waitForAuth();
  const db = getFirestoreDb();
  try {
    const docRef = doc(db, PRICING_REQUESTS_COLLECTION, requestId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as PricingRequest;
  } catch (error: unknown) {
    const firebaseError = error as { code?: string };
    if (firebaseError.code === 'permission-denied') {
      console.error('Permission denied accessing pricing request:', requestId);
      return null;
    }
    throw error;
  }
}

export async function getPricingRequestsByOrg(
  orgId: string,
  options?: {
    status?: PricingStatus | PricingStatus[];
    limit?: number;
    createdBy?: string;
  }
): Promise<PricingRequest[]> {
  await waitForAuth();
  const db = getFirestoreDb();
  let q = query(
    collection(db, PRICING_REQUESTS_COLLECTION),
    where('orgId', '==', orgId),
    orderBy('createdAt', 'desc')
  );

  if (options?.status) {
    const statuses = Array.isArray(options.status) ? options.status : [options.status];
    q = query(q, where('status', 'in', statuses));
  }

  if (options?.createdBy) {
    q = query(q, where('createdBy', '==', options.createdBy));
  }

  if (options?.limit) {
    q = query(q, limit(options.limit));
  }

  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as PricingRequest[];
  } catch (error: unknown) {
    const firebaseError = error as { code?: string };
    if (firebaseError.code === 'permission-denied') {
      console.error('Permission denied accessing pricing requests for org:', orgId);
      return [];
    }
    throw error;
  }
}

export async function getClientPricingRequests(orgId: string): Promise<PricingRequest[]> {
  // Get pricing requests that have been sent to the client (not drafts)
  return getPricingRequestsByOrg(orgId, {
    status: [
      PRICING_STATUS.SENT,
      PRICING_STATUS.CLIENT_EDITED,
      PRICING_STATUS.ACCEPTED,
      PRICING_STATUS.PAID,
      PRICING_STATUS.DECLINED,
    ],
  });
}

export async function getPendingClientPricingRequests(orgId: string): Promise<PricingRequest[]> {
  // Get pricing requests pending client action
  return getPricingRequestsByOrg(orgId, {
    status: [PRICING_STATUS.SENT, PRICING_STATUS.ACCEPTED],
  });
}

// ============================================
// UPDATE
// ============================================

export async function updatePricingRequest(
  requestId: string,
  data: UpdatePricingRequestData
): Promise<void> {
  await waitForAuth();
  const db = getFirestoreDb();
  const docRef = doc(db, PRICING_REQUESTS_COLLECTION, requestId);
  const existingSnapshot = await getDoc(docRef);
  if (!existingSnapshot.exists()) {
    throw new Error('Pricing request not found');
  }

  const existing = existingSnapshot.data() as PricingRequest;
  if (existing.status === PRICING_STATUS.ACCEPTED || existing.status === PRICING_STATUS.PAID) {
    throw new Error('Accepted or paid proposals are locked');
  }

  const updateData: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  if (data.title !== undefined) updateData.title = data.title.trim();
  if (data.description !== undefined) updateData.description = data.description?.trim() || null;
  if (data.lineItems !== undefined) {
    updateData.lineItems = data.lineItems;
    updateData.totalAmount = calculateTotalAmount(data.lineItems, data.taxRate ?? existing.taxRate ?? 0);
  }
  if (data.taxRate !== undefined) {
    updateData.taxRate = data.taxRate;
    updateData.totalAmount = calculateTotalAmount(data.lineItems ?? existing.lineItems, data.taxRate);
  }
  if (data.currency !== undefined) updateData.currency = data.currency;
  if (data.validUntil !== undefined) {
    updateData.validUntil = data.validUntil ? Timestamp.fromDate(data.validUntil) : null;
  }
  if (data.timeframe !== undefined) updateData.timeframe = data.timeframe?.trim() || null;
  if (data.workDeadline !== undefined) {
    updateData.workDeadline = data.workDeadline ? Timestamp.fromDate(data.workDeadline) : null;
  }
  if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo?.trim() || null;
  if (data.assignedToName !== undefined) {
    updateData.assignedToName = data.assignedToName?.trim() || null;
  }
  if (data.clientName !== undefined) updateData.clientName = data.clientName?.trim() || null;
  if (data.clientEmail !== undefined) {
    updateData.clientEmail = data.clientEmail?.trim().toLowerCase() || null;
  }
  if (data.clientNotes !== undefined) updateData.clientNotes = data.clientNotes?.trim() || null;
  if (data.agencyNotes !== undefined) updateData.agencyNotes = data.agencyNotes?.trim() || null;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.requestIds !== undefined) updateData.requestIds = data.requestIds;
  if (data.proposalType !== undefined) updateData.proposalType = data.proposalType;
  if (data.terms !== undefined) updateData.terms = data.terms?.trim() || null;
  if (data.publicAccessEnabled !== undefined) {
    updateData.publicAccessEnabled = data.publicAccessEnabled;
  }
  if (data.paymentRequired !== undefined) updateData.paymentRequired = data.paymentRequired;
  if (data.depositAmount !== undefined) updateData.depositAmount = data.depositAmount;
  if (data.billingMode !== undefined) updateData.billingMode = data.billingMode;

  const nextTotal = Number(updateData.totalAmount ?? existing.totalAmount);
  const nextPaymentRequired = data.paymentRequired ?? existing.paymentRequired ?? false;
  const nextDepositAmount = data.depositAmount ?? existing.depositAmount ?? nextTotal;
  if (nextPaymentRequired && (nextDepositAmount < 1 || nextDepositAmount > nextTotal)) {
    throw new Error('Deposit amount must be between one cent and the proposal total');
  }
  updateData.depositAmount = nextPaymentRequired ? nextDepositAmount : 0;
  updateData.balanceDue = nextTotal - (existing.amountPaid ?? 0);
  updateData.paymentStatus = nextPaymentRequired ? (existing.paymentStatus ?? 'pending') : 'not_required';
  updateData.paymentProvider = nextPaymentRequired ? 'paypal' : null;

  // Recursively clean the data to remove any undefined values (especially in nested lineItems)
  const cleanedData = deepClean(updateData);

  await updateDoc(docRef, cleanedData);
}

export async function sendPricingRequest(requestId: string): Promise<void> {
  await waitForAuth();
  const token = await getFirebaseAuth().currentUser?.getIdToken();
  if (!token) throw new Error('Unauthenticated');
  const locale =
    typeof document !== 'undefined' && document.documentElement.lang === 'he' ? 'he' : 'en';
  const response = await fetch(`/api/portal/proposals/${encodeURIComponent(requestId)}/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ locale }),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error || 'Failed to queue proposal email');
  }
}

export async function acceptPricingRequest(requestId: string, clientNotes?: string): Promise<void> {
  await waitForAuth();
  const db = getFirestoreDb();
  const docRef = doc(db, PRICING_REQUESTS_COLLECTION, requestId);
  const updateData: Record<string, unknown> = {
    status: PRICING_STATUS.ACCEPTED,
    acceptedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (clientNotes !== undefined) {
    updateData.clientNotes = clientNotes.trim() || null;
  }

  await updateDoc(docRef, updateData);
}

export async function getPricingRequestByPublicToken(token: string): Promise<PublicPricingProposal> {
  const response = await fetch(`/api/proposals/${encodeURIComponent(token)}`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Proposal not found');
  }
  return response.json();
}

export async function acceptPricingRequestWithSignature(
  token: string,
  payload: AcceptPricingRequestPayload
): Promise<PublicPricingProposal> {
  const response = await fetch(`/api/proposals/${encodeURIComponent(token)}/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to accept proposal');
  }
  return response.json();
}

export async function declinePricingRequest(requestId: string, reason?: string): Promise<void> {
  await waitForAuth();
  const db = getFirestoreDb();
  const docRef = doc(db, PRICING_REQUESTS_COLLECTION, requestId);
  const updateData: Record<string, unknown> = {
    status: PRICING_STATUS.DECLINED,
    declinedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (reason !== undefined) {
    updateData.clientNotes = reason.trim() || null;
  }

  await updateDoc(docRef, updateData);
}

export async function submitClientEdits(
  requestId: string,
  lineItems: PricingLineItem[],
  clientNotes?: string
): Promise<void> {
  await waitForAuth();
  const db = getFirestoreDb();
  const docRef = doc(db, PRICING_REQUESTS_COLLECTION, requestId);

  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    throw new Error('Pricing request not found');
  }

  const existingData = docSnap.data() as PricingRequest;
  const taxRate = existingData.taxRate || 0;

  await updateDoc(docRef, {
    status: PRICING_STATUS.CLIENT_EDITED,
    lineItems,
    totalAmount: calculateTotalAmount(lineItems, taxRate),
    clientNotes: clientNotes?.trim() || null,
    updatedAt: serverTimestamp(),
  });
}

export async function markPricingRequestPaid(
  pricingRequestId: string,
  paymentId: string,
  paymentMethod: 'paypal' | 'manual' = 'paypal'
): Promise<void> {
  await waitForAuth();
  const db = getFirestoreDb();
  const docRef = doc(db, PRICING_REQUESTS_COLLECTION, pricingRequestId);

  // First, get the pricing request to access linked request IDs
  const pricingDoc = await getDoc(docRef);
  const pricingData = pricingDoc.data() as PricingRequest | undefined;

  // Update the pricing request status
  await updateDoc(docRef, {
    status: PRICING_STATUS.PAID,
    paymentId,
    paymentMethod,
    paidAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Update all linked requests to PAID status
  if (pricingData?.requestIds && pricingData.requestIds.length > 0) {
    const REQUESTS_COLLECTION = 'portal_requests';
    for (const requestId of pricingData.requestIds) {
      const requestDocRef = doc(db, REQUESTS_COLLECTION, requestId);
      await updateDoc(requestDocRef, {
        status: 'PAID',
        paymentId,
        paymentMethod,
        paidAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  }
}

export async function cancelPricingRequest(requestId: string): Promise<void> {
  await waitForAuth();
  const db = getFirestoreDb();
  const docRef = doc(db, PRICING_REQUESTS_COLLECTION, requestId);
  await updateDoc(docRef, {
    status: PRICING_STATUS.CANCELED,
    updatedAt: serverTimestamp(),
  });
}

// ============================================
// DELETE
// ============================================

export async function deletePricingRequest(requestId: string): Promise<void> {
  await waitForAuth();
  const db = getFirestoreDb();
  const docRef = doc(db, PRICING_REQUESTS_COLLECTION, requestId);
  await deleteDoc(docRef);
}

// ============================================
// REAL-TIME SUBSCRIPTIONS
// ============================================

export function subscribeToPricingRequest(
  requestId: string,
  callback: (request: PricingRequest | null) => void
): () => void {
  let unsubscribe: (() => void) | null = null;
  let isUnsubscribed = false;

  waitForAuth()
    .then(() => {
      if (isUnsubscribed) return;
      const db = getFirestoreDb();
      const docRef = doc(db, PRICING_REQUESTS_COLLECTION, requestId);
      unsubscribe = onSnapshot(
        docRef,
        snapshot => {
          if (!snapshot.exists()) {
            callback(null);
            return;
          }
          callback({
            id: snapshot.id,
            ...snapshot.data(),
          } as PricingRequest);
        },
        error => {
          console.error('Error in pricing request snapshot:', error);
          callback(null);
        }
      );
    })
    .catch(error => {
      console.error('Error waiting for auth in subscribeToPricingRequest:', error);
      callback(null);
    });

  return () => {
    isUnsubscribed = true;
    if (unsubscribe) {
      unsubscribe();
    }
  };
}

export function subscribeToOrgPricingRequests(
  orgId: string,
  callback: (requests: PricingRequest[]) => void,
  options?: {
    status?: PricingStatus[];
    excludeDrafts?: boolean;
  }
): () => void {
  let unsubscribe: (() => void) | null = null;
  let isUnsubscribed = false;

  waitForAuth()
    .then(() => {
      if (isUnsubscribed) return;
      const db = getFirestoreDb();
      let q = query(
        collection(db, PRICING_REQUESTS_COLLECTION),
        where('orgId', '==', orgId),
        orderBy('createdAt', 'desc')
      );

      // For clients, exclude drafts
      if (options?.excludeDrafts) {
        q = query(
          collection(db, PRICING_REQUESTS_COLLECTION),
          where('orgId', '==', orgId),
          where('status', '!=', PRICING_STATUS.DRAFT),
          orderBy('status'),
          orderBy('createdAt', 'desc')
        );
      }

      unsubscribe = onSnapshot(
        q,
        snapshot => {
          let requests = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as PricingRequest[];

          // Client-side filtering for status if needed
          if (options?.status && options.status.length > 0) {
            requests = requests.filter(r => options.status!.includes(r.status));
          }

          callback(requests);
        },
        error => {
          console.error('Error in org pricing requests snapshot:', error);
          callback([]);
        }
      );
    })
    .catch(error => {
      console.error('Error waiting for auth in subscribeToOrgPricingRequests:', error);
      callback([]);
    });

  return () => {
    isUnsubscribed = true;
    if (unsubscribe) {
      unsubscribe();
    }
  };
}

// ============================================
// STATS
// ============================================

export async function getPricingStats(orgId: string): Promise<{
  total: number;
  draft: number;
  pending: number;
  accepted: number;
  paid: number;
  totalRevenue: number;
}> {
  const requests = await getPricingRequestsByOrg(orgId);

  const paidRequests = requests.filter(r => r.status === PRICING_STATUS.PAID);
  const totalRevenue = paidRequests.reduce((sum, r) => sum + r.totalAmount, 0);

  return {
    total: requests.length,
    draft: requests.filter(r => r.status === PRICING_STATUS.DRAFT).length,
    pending: requests.filter(r =>
      (
        [
          PRICING_STATUS.SENT,
          PRICING_STATUS.CLIENT_EDITED,
          PRICING_STATUS.ACCEPTED,
        ] as PricingStatus[]
      ).includes(r.status)
    ).length,
    accepted: requests.filter(r => r.status === PRICING_STATUS.ACCEPTED).length,
    paid: paidRequests.length,
    totalRevenue,
  };
}

// ============================================
// AGENCY FUNCTIONS (ALL ORGS)
// ============================================

/**
 * Get all pricing requests across all organizations (for agency use)
 */
export async function getAllPricingRequests(options?: {
  status?: PricingStatus | PricingStatus[];
  limit?: number;
}): Promise<PricingRequest[]> {
  await waitForAuth();
  const db = getFirestoreDb();
  let q = query(collection(db, PRICING_REQUESTS_COLLECTION), orderBy('createdAt', 'desc'));

  if (options?.status) {
    const statuses = Array.isArray(options.status) ? options.status : [options.status];
    q = query(q, where('status', 'in', statuses));
  }

  if (options?.limit) {
    q = query(q, limit(options.limit));
  }

  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as PricingRequest[];
  } catch (error: unknown) {
    const firebaseError = error as { code?: string };
    if (firebaseError.code === 'permission-denied') {
      console.error('Permission denied accessing all pricing requests');
      return [];
    }
    throw error;
  }
}

/**
 * Subscribe to all pricing requests across all organizations (for agency use)
 */
export function subscribeToAllPricingRequests(
  callback: (requests: PricingRequest[]) => void,
  options?: {
    status?: PricingStatus[];
  }
): () => void {
  let unsubscribe: (() => void) | null = null;
  let isUnsubscribed = false;

  waitForAuth()
    .then(() => {
      if (isUnsubscribed) return;

      const auth = getFirebaseAuth();
      if (!auth.currentUser) {
        callback([]);
        return;
      }

      const db = getFirestoreDb();
      const q = query(collection(db, PRICING_REQUESTS_COLLECTION), orderBy('createdAt', 'desc'));

      unsubscribe = onSnapshot(
        q,
        snapshot => {
          let requests = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as PricingRequest[];

          // Client-side filtering for status if needed
          if (options?.status && options.status.length > 0) {
            requests = requests.filter(r => options.status!.includes(r.status));
          }

          callback(requests);
        },
        error => {
          // If permission denied, standard auth guards should have caught this,
          // but return empty list gracefully
          console.error('Error in all pricing requests snapshot:', error);
          callback([]);
        }
      );
    })
    .catch(error => {
      console.error('Error waiting for auth in subscribeToAllPricingRequests:', error);
      callback([]);
    });

  return () => {
    isUnsubscribed = true;
    if (unsubscribe) {
      unsubscribe();
    }
  };
}

// ============================================
// REQUEST-PRICING RELATIONSHIPS
// ============================================

/**
 * Get pricing offer that contains a specific request
 */
export async function getPricingOfferForRequest(requestId: string): Promise<PricingRequest | null> {
  await waitForAuth();
  const db = getFirestoreDb();
  try {
    // Query for pricing requests that contain this requestId
    // Note: Firestore doesn't support 'array-contains' with composite indexes well,
    // so we fetch all non-canceled/non-paid for the org and filter client-side
    const q = query(
      collection(db, PRICING_REQUESTS_COLLECTION),
      where('requestIds', 'array-contains', requestId)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return null;
    }

    // Return the first match (should only be one active offer per request)
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as PricingRequest;
  } catch (error) {
    console.error('Error getting pricing offer for request:', error);
    return null;
  }
}

/**
 * Check if a request is in any active (non-paid, non-canceled, non-declined) pricing offer
 */
export async function isRequestInActivePricingOffer(requestId: string): Promise<boolean> {
  const offer = await getPricingOfferForRequest(requestId);
  if (!offer) return false;

  // Active = not paid, not canceled, not declined, not expired
  const inactiveStatuses: PricingStatus[] = [
    PRICING_STATUS.PAID,
    PRICING_STATUS.CANCELED,
    PRICING_STATUS.DECLINED,
    PRICING_STATUS.EXPIRED,
  ];

  return !inactiveStatuses.includes(offer.status);
}
