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
  increment,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { getFirestoreDb, getFirebaseAuth, waitForAuth } from '@/lib/firebase';
import { isLoggingOut } from './auth';
import { getPortalUser } from './portal-users';
import {
  Request,
  CreateRequestData,
  UpdateRequestData,
  REQUEST_STATUS,
  RequestStatus,
  PricingLineItem,
  Currency,
  calculateTotalAmount,
  Milestone,
  MilestoneStatus,
  MILESTONE_STATUS,
} from '@/lib/types/portal';
import { logActivity } from './portal-activities';
import { withRetry } from '@/lib/utils/retry';

const REQUESTS_COLLECTION = 'portal_requests';

// ============================================
// CREATE
// ============================================

export async function createRequest(
  orgId: string,
  userId: string,
  userName: string,
  data: CreateRequestData
): Promise<Request> {
  return withRetry(async () => {
    await waitForAuth();
    const db = getFirestoreDb();
    const requestData = {
      orgId,
      title: data.title.trim(),
      description: data.description.trim(),
      type: data.type,
      status: REQUEST_STATUS.NEW as RequestStatus,
      priority: data.priority,
      createdBy: userId,
      createdByName: userName,
      tags: data.tags || [],
      attachmentIds: [],
      commentCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, REQUESTS_COLLECTION), requestData);

    await logActivity({
      orgId,
      requestId: docRef.id,
      userId,
      userName,
      action: 'CREATED_REQUEST',
      details: { title: data.title },
    });

    return {
      id: docRef.id,
      ...requestData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    } as Request;
  });
}

/**
 * Create a request for a client who doesn't have an account yet.
 * The clientEmail will be used to auto-link the request when they register.
 */
export async function createRequestForClient(
  orgId: string,
  userId: string,
  userName: string,
  clientEmail: string,
  data: CreateRequestData
): Promise<Request> {
  return withRetry(async () => {
    await waitForAuth();
    const db = getFirestoreDb();

    // Validate email
    const email = clientEmail.toLowerCase().trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Invalid client email address');
    }

    const requestData = {
      orgId,
      title: data.title.trim(),
      description: data.description.trim(),
      type: data.type,
      status: REQUEST_STATUS.NEW as RequestStatus,
      priority: data.priority,
      createdBy: userId,
      createdByName: userName,
      clientEmail: email, // Store client email for auto-linking
      tags: data.tags || [],
      attachmentIds: [],
      commentCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, REQUESTS_COLLECTION), requestData);

    await logActivity({
      orgId,
      requestId: docRef.id,
      userId,
      userName,
      action: 'CREATED_REQUEST',
      details: { title: data.title, clientEmail: email },
    });

    return {
      id: docRef.id,
      ...requestData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    } as Request;
  });
}

/**
 * Get all requests for a specific client email (before they register).
 * Used by admins to see what requests are assigned to a pending client.
 */
export async function getRequestsByClientEmail(
  orgId: string,
  clientEmail: string
): Promise<Request[]> {
  await waitForAuth();
  const db = getFirestoreDb();
  const email = clientEmail.toLowerCase().trim();

  const q = query(
    collection(db, REQUESTS_COLLECTION),
    where('orgId', '==', orgId),
    where('clientEmail', '==', email),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Request[];
}

// ============================================
// READ
// ============================================

export async function getRequest(requestId: string): Promise<Request | null> {
  await waitForAuth();
  const db = getFirestoreDb();
  const docRef = doc(db, REQUESTS_COLLECTION, requestId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as Request;
}

export async function getRequestsByOrg(
  orgId: string,
  options?: {
    status?: RequestStatus | RequestStatus[];
    limit?: number;
  }
): Promise<Request[]> {
  await waitForAuth();
  const auth = getFirebaseAuth();
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error('User must be authenticated to access requests');
  }

  try {
    await currentUser.getIdToken(true);
  } catch (error) {
    console.warn('[getRequestsByOrg] Error refreshing token:', error);
  }

  const db = getFirestoreDb();
  let q = query(
    collection(db, REQUESTS_COLLECTION),
    where('orgId', '==', orgId),
    orderBy('createdAt', 'desc')
  );

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
    })) as Request[];
  } catch (error: unknown) {
    const firestoreError = error as { code?: string; message?: string };
    if (firestoreError.code === 'permission-denied') {
      console.error(
        '[getRequestsByOrg] Permission denied. This usually means the user is not a member of the organization or the organization document is missing.',
        {
          orgId,
          userId: currentUser.uid,
          error: firestoreError.message,
        }
      );
      throw new Error(
        `Permission denied accessing requests for organization ${orgId}. Please check your membership.`
      );
    }
    throw error;
  }
}

export async function getAllRequests(): Promise<Request[]> {
  await waitForAuth();
  const auth = getFirebaseAuth();
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error('User must be authenticated to access all requests');
  }

  const userData = await getPortalUser(currentUser.uid);
  if (!userData) {
    throw new Error('User profile not found. Please complete your profile setup.');
  }

  const isAgency = userData.accountType === 'AGENCY' || userData.isAgency === true;
  if (!isAgency) {
    throw new Error('Agency permissions required to access all requests');
  }

  try {
    const db = getFirestoreDb();
    const q = query(collection(db, REQUESTS_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Request[];
  } catch (error: unknown) {
    const firestoreError = error as { code?: string; message?: string };
    if (firestoreError.code === 'permission-denied') {
      throw new Error(
        'Permission denied. Your user profile may not be properly configured as an agency user. Please contact support.'
      );
    }
    throw error;
  }
}

export async function getRecentRequestsByOrg(orgId: string, count = 5): Promise<Request[]> {
  return getRequestsByOrg(orgId, { limit: count });
}

export async function getActiveRequestsByOrg(orgId: string): Promise<Request[]> {
  return getRequestsByOrg(orgId, {
    status: [
      REQUEST_STATUS.NEW,
      REQUEST_STATUS.NEEDS_INFO,
      REQUEST_STATUS.QUEUED,
      REQUEST_STATUS.IN_PROGRESS,
      REQUEST_STATUS.IN_REVIEW,
    ],
  });
}

// ============================================
// UPDATE
// ============================================

export async function updateRequest(requestId: string, data: UpdateRequestData): Promise<void> {
  console.log('[updateRequest] Updating request:', { requestId, data });
  return withRetry(async () => {
    await waitForAuth();
    const db = getFirestoreDb();
    const docRef = doc(db, REQUESTS_COLLECTION, requestId);
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: serverTimestamp(),
    };

    // Handle status change to closed
    if (data.status === REQUEST_STATUS.CLOSED || data.status === REQUEST_STATUS.CANCELED) {
      updateData.closedAt = serverTimestamp();
      console.log('[updateRequest] Adding closedAt timestamp');
    }

    console.log('[updateRequest] Calling updateDoc with data:', updateData);
    await updateDoc(docRef, updateData);
    console.log('[updateRequest] Update completed successfully');
  });
}

export async function updateRequestStatus(requestId: string, status: RequestStatus): Promise<void> {
  console.log('[updateRequestStatus] Called with:', { requestId, status });
  return updateRequest(requestId, { status });
}

export async function assignRequest(
  requestId: string,
  orgId: string,
  userId: string,
  userName: string,
  assignedTo: string,
  assignedToName: string
): Promise<void> {
  await waitForAuth();
  const db = getFirestoreDb();
  const docRef = doc(db, REQUESTS_COLLECTION, requestId);
  await updateDoc(docRef, {
    assignedTo,
    assignedToName,
    updatedAt: serverTimestamp(),
  });

  await logActivity({
    orgId,
    requestId,
    userId,
    userName,
    action: 'ASSIGNED_REQUEST',
    details: { assignedTo, assignedToName },
  });
}

export async function incrementCommentCount(requestId: string): Promise<void> {
  await waitForAuth();
  const db = getFirestoreDb();
  const docRef = doc(db, REQUESTS_COLLECTION, requestId);
  await updateDoc(docRef, {
    commentCount: increment(1),
    updatedAt: serverTimestamp(),
  });
}

// ============================================
// DELETE
// ============================================

export async function deleteRequest(requestId: string): Promise<void> {
  await waitForAuth();
  const db = getFirestoreDb();
  const docRef = doc(db, REQUESTS_COLLECTION, requestId);
  await deleteDoc(docRef);
}

// ============================================
// REAL-TIME SUBSCRIPTIONS
// ============================================

export function subscribeToRequest(
  requestId: string,
  callback: (request: Request | null, error?: { code: string; message: string }) => void
): () => void {
  let unsubscribe: (() => void) | null = null;
  let isUnsubscribed = false;

  waitForAuth()
    .then(() => {
      if (isUnsubscribed) return;
      const db = getFirestoreDb();
      const docRef = doc(db, REQUESTS_COLLECTION, requestId);
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
          } as Request);
        },
        error => {
          const firestoreError = error as { code?: string; message?: string };

          // Suppress permission errors during logout
          if (firestoreError.code === 'permission-denied') {
            const auth = getFirebaseAuth();
            if (isLoggingOut() || !auth.currentUser) return;
          }

          console.error('Error in request snapshot:', error);
          if (firestoreError.code === 'permission-denied') {
            callback(null, {
              code: 'permission-denied',
              message:
                'You do not have permission to view this request. You may not be a member of this organization.',
            });
          } else {
            callback(null, {
              code: firestoreError.code || 'unknown',
              message: firestoreError.message || 'Failed to load request',
            });
          }
        }
      );
    })
    .catch(error => {
      console.error('Error waiting for auth in subscribeToRequest:', error);
      callback(null, {
        code: 'auth-error',
        message: 'Authentication error. Please try logging in again.',
      });
    });

  return () => {
    isUnsubscribed = true;
    if (unsubscribe) {
      unsubscribe();
    }
  };
}

export function subscribeToOrgRequests(
  orgId: string,
  callback: (requests: Request[]) => void
): () => void {
  let unsubscribe: (() => void) | null = null;
  let isUnsubscribed = false;

  waitForAuth()
    .then(() => {
      if (isUnsubscribed) return;
      const db = getFirestoreDb();
      const q = query(
        collection(db, REQUESTS_COLLECTION),
        where('orgId', '==', orgId),
        orderBy('createdAt', 'desc')
      );

      unsubscribe = onSnapshot(
        q,
        snapshot => {
          const requests = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as Request[];
          callback(requests);
        },
        error => {
          // Suppress permission errors during logout
          if (error.code === 'permission-denied') {
            const auth = getFirebaseAuth();
            if (isLoggingOut() || !auth.currentUser) return;

            console.error('[portal-requests] Permission denied for orgId:', orgId);
            console.error('[portal-requests] Error details:', {
              code: error.code,
              message: error.message,
              orgId,
            });
            console.error(
              '[portal-requests] User may not be a member of this organization or rules may not have propagated yet.'
            );
          } else {
            console.error('[portal-requests] Error in org requests snapshot:', error);
          }
          callback([]);
        }
      );
    })
    .catch(error => {
      console.error('Error waiting for auth in subscribeToOrgRequests:', error);
      callback([]);
    });

  return () => {
    isUnsubscribed = true;
    if (unsubscribe) {
      unsubscribe();
    }
  };
}

export function subscribeToAllRequests(callback: (requests: Request[]) => void): () => void {
  let unsubscribe: (() => void) | null = null;
  let isUnsubscribed = false;

  waitForAuth()
    .then(() => {
      if (isUnsubscribed) return;
      const db = getFirestoreDb();
      const q = query(collection(db, REQUESTS_COLLECTION), orderBy('createdAt', 'desc'));

      unsubscribe = onSnapshot(
        q,
        snapshot => {
          const requests = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as Request[];
          callback(requests);
        },
        error => {
          const firestoreError = error as { code?: string; message?: string };

          // Suppress permission errors during logout
          if (firestoreError.code === 'permission-denied') {
            const auth = getFirebaseAuth();
            if (isLoggingOut() || !auth.currentUser) return;

            console.error(
              '[portal-requests] Permission denied. This query requires agency permissions.',
              {
                error: firestoreError.message,
              }
            );
          } else {
            console.error('[portal-requests] Error in all requests snapshot:', error);
          }
          callback([]);
        }
      );
    })
    .catch(error => {
      console.error('Error waiting for auth in subscribeToAllRequests:', error);
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

export async function getRequestStats(orgId: string): Promise<{
  total: number;
  active: number;
  inReview: number;
  completed: number;
}> {
  const requests = await getRequestsByOrg(orgId);

  return {
    total: requests.length,
    active: requests.filter(r =>
      (
        [REQUEST_STATUS.NEW, REQUEST_STATUS.QUEUED, REQUEST_STATUS.IN_PROGRESS] as RequestStatus[]
      ).includes(r.status)
    ).length,
    inReview: requests.filter(r => r.status === REQUEST_STATUS.IN_REVIEW).length,
    completed: requests.filter(r =>
      (
        [REQUEST_STATUS.DELIVERED, REQUEST_STATUS.CLOSED, REQUEST_STATUS.PAID] as RequestStatus[]
      ).includes(r.status)
    ).length,
  };
}

// ============================================
// PRICING & BILLING
// ============================================

export interface AddPricingData {
  lineItems: PricingLineItem[];
  currency: Currency;
  validUntil?: Date;
}

/**
 * Agency adds pricing to a request (converts to billable)
 */
export async function addPricingToRequest(
  requestId: string,
  orgId: string,
  userId: string,
  userName: string,
  data: AddPricingData
): Promise<void> {
  const totalAmount = calculateTotalAmount(data.lineItems);

  await waitForAuth();
  const db = getFirestoreDb();
  await updateDoc(doc(db, REQUESTS_COLLECTION, requestId), {
    isBillable: true,
    lineItems: data.lineItems,
    totalAmount,
    currency: data.currency,
    validUntil: data.validUntil ? Timestamp.fromDate(data.validUntil) : null,
    quotedAt: serverTimestamp(),
    status: REQUEST_STATUS.QUOTED,
    updatedAt: serverTimestamp(),
  });

  await logActivity({
    orgId,
    requestId,
    userId,
    userName,
    action: 'ADDED_PRICING',
    details: { totalAmount, currency: data.currency },
  });
}

/**
 * Agency marks a request as free (no billing) and moves it directly to IN_PROGRESS
 */
export async function markRequestAsFree(
  requestId: string,
  orgId: string,
  userId: string,
  userName: string
): Promise<void> {
  await waitForAuth();
  const db = getFirestoreDb();
  await updateDoc(doc(db, REQUESTS_COLLECTION, requestId), {
    isBillable: false,
    isFree: true,
    lineItems: [],
    totalAmount: 0,
    status: REQUEST_STATUS.IN_PROGRESS,
    markedFreeAt: serverTimestamp(),
    markedFreeBy: userId,
    updatedAt: serverTimestamp(),
  });

  await logActivity({
    orgId,
    requestId,
    userId,
    userName,
    action: 'MARKED_AS_FREE',
  });
}

/**
 * Client accepts the quoted price
 */
export async function acceptRequest(
  requestId: string,
  orgId: string,
  userId: string,
  userName: string,
  clientNotes?: string
): Promise<void> {
  return withRetry(async () => {
    const updateData: Record<string, unknown> = {
      status: REQUEST_STATUS.ACCEPTED,
      acceptedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (clientNotes) {
      updateData.clientNotes = clientNotes;
    }

    await waitForAuth();
    const db = getFirestoreDb();
    await updateDoc(doc(db, REQUESTS_COLLECTION, requestId), updateData);

    await logActivity({
      orgId,
      requestId,
      userId,
      userName,
      action: 'ACCEPTED_QUOTE',
    });
  });
}

/**
 * Client declines the quoted price
 */
export async function declineRequest(
  requestId: string,
  orgId: string,
  userId: string,
  userName: string,
  clientNotes?: string
): Promise<void> {
  const updateData: Record<string, unknown> = {
    status: REQUEST_STATUS.DECLINED,
    declinedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (clientNotes) {
    updateData.clientNotes = clientNotes;
  }

  await waitForAuth();
  const db = getFirestoreDb();
  await updateDoc(doc(db, REQUESTS_COLLECTION, requestId), updateData);

  await logActivity({
    orgId,
    requestId,
    userId,
    userName,
    action: 'DECLINED_QUOTE',
  });
}

/**
 * Agency starts work on the request
 */
export async function startRequestWork(
  requestId: string,
  orgId: string,
  userId: string,
  userName: string
): Promise<void> {
  await waitForAuth();
  const db = getFirestoreDb();
  await updateDoc(doc(db, REQUESTS_COLLECTION, requestId), {
    status: REQUEST_STATUS.IN_PROGRESS,
    updatedAt: serverTimestamp(),
  });

  await logActivity({
    orgId,
    requestId,
    userId,
    userName,
    action: 'STARTED_WORK',
  });
}

/**
 * Mark request as paid after successful payment
 */
export async function markRequestPaid(
  requestId: string,
  orgId: string,
  userId: string,
  userName: string,
  paymentId: string,
  paymentMethod: 'paypal' = 'paypal'
): Promise<void> {
  await waitForAuth();
  const db = getFirestoreDb();
  await updateDoc(doc(db, REQUESTS_COLLECTION, requestId), {
    status: REQUEST_STATUS.PAID,
    paymentId,
    paymentMethod,
    paidAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await logActivity({
    orgId,
    requestId,
    userId,
    userName,
    action: 'PAID_REQUEST',
    details: { paymentId, paymentMethod },
  });
}

// ============================================
// MILESTONES
// ============================================

/**
 * Update all milestones for a request
 */
export async function updateRequestMilestones(
  requestId: string,
  milestones: Milestone[]
): Promise<void> {
  // Find the current milestone (first non-completed, non-pending)
  const sortedMilestones = [...milestones].sort((a, b) => a.order - b.order);
  const currentMilestone =
    sortedMilestones.find(m => m.status === MILESTONE_STATUS.IN_PROGRESS) ||
    sortedMilestones.find(m => m.status === MILESTONE_STATUS.PENDING);

  await waitForAuth();
  const db = getFirestoreDb();
  await updateDoc(doc(db, REQUESTS_COLLECTION, requestId), {
    milestones,
    currentMilestoneId: currentMilestone?.id || null,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Update a single milestone's status
 */
export async function updateMilestoneStatus(
  requestId: string,
  milestoneId: string,
  status: MilestoneStatus,
  completedBy?: string
): Promise<void> {
  const request = await getRequest(requestId);
  if (!request?.milestones) return;

  const updatedMilestones = request.milestones.map(m => {
    if (m.id === milestoneId) {
      const updates: Partial<Milestone> = {
        status,
        updatedAt: Timestamp.now(),
      };

      if (status === MILESTONE_STATUS.COMPLETED) {
        updates.completedAt = Timestamp.now();
        updates.completedBy = completedBy;
      }

      return { ...m, ...updates };
    }
    return m;
  });

  await updateRequestMilestones(requestId, updatedMilestones);
}

/**
 * Calculate milestone progress percentage
 */
export function calculateMilestoneProgress(milestones: Milestone[]): number {
  if (!milestones || milestones.length === 0) return 0;
  const completed = milestones.filter(m => m.status === MILESTONE_STATUS.COMPLETED).length;
  return Math.round((completed / milestones.length) * 100);
}

/**
 * Client requests a revision
 */
export async function requestRevision(
  requestId: string,
  orgId: string,
  userId: string,
  userName: string,
  revisionNotes: string
): Promise<void> {
  await waitForAuth();
  const db = getFirestoreDb();
  await updateDoc(doc(db, REQUESTS_COLLECTION, requestId), {
    status: REQUEST_STATUS.IN_PROGRESS,
    updatedAt: serverTimestamp(),
  });

  // Log activity
  await logActivity({
    orgId,
    requestId,
    userId,
    userName,
    action: 'REQUESTED_REVISION',
    details: { notes: revisionNotes },
  });
}

// ============================================
// PIN/UNPIN REQUESTS
// ============================================

/**
 * Toggle pin status for a request (per user)
 * Returns the new pinned state
 */
export async function togglePinRequest(requestId: string, userId: string): Promise<boolean> {
  await waitForAuth();
  const db = getFirestoreDb();
  const docRef = doc(db, REQUESTS_COLLECTION, requestId);

  // Get current request to check if user has pinned it
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    throw new Error('Request not found');
  }

  const request = docSnap.data() as Request;
  const isPinned = request.pinnedBy?.includes(userId) ?? false;

  if (isPinned) {
    // Unpin: remove userId from pinnedBy array
    await updateDoc(docRef, {
      pinnedBy: arrayRemove(userId),
      updatedAt: serverTimestamp(),
    });
    return false;
  } else {
    // Pin: add userId to pinnedBy array
    await updateDoc(docRef, {
      pinnedBy: arrayUnion(userId),
      updatedAt: serverTimestamp(),
    });
    return true;
  }
}

/**
 * Check if a request is pinned by a specific user
 */
export function isRequestPinnedByUser(request: Request, userId: string): boolean {
  return request.pinnedBy?.includes(userId) ?? false;
}
