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
import { getFirestoreDb, waitForAuth } from '@/lib/firebase';
import {
  Consultation,
  ConsultationType,
  ConsultationStatus,
  Currency,
  CONSULTATION_STATUS,
} from '@/lib/types/portal';
import { logActivity } from './portal-activities';

const CONSULTATIONS_COLLECTION = 'portal_consultations';

// ============================================
// CREATE
// ============================================

export interface CreateConsultationData {
  orgId: string;
  type: ConsultationType;
  title: string;
  description?: string;
  scheduledAt: Date;
  duration: number; // minutes
  participants?: string[];
  externalCalendarLink?: string;
  agendaItems?: string[];
  isBillable?: boolean;
  hourlyRate?: number;
  currency?: Currency;
  externalEventId?: string; // Google Calendar Event ID
}

export async function createConsultation(
  userId: string,
  userName: string,
  data: CreateConsultationData
): Promise<Consultation> {
  const consultationData: Record<string, unknown> = {
    orgId: data.orgId,
    type: data.type,
    status: CONSULTATION_STATUS.SCHEDULED,
    title: data.title,
    description: data.description || '',
    scheduledAt: Timestamp.fromDate(data.scheduledAt),
    duration: data.duration,
    participants: data.participants || [userId],
    createdBy: userId,
    createdByName: userName,
    agendaItems: data.agendaItems || [],
    actionItems: [],
    isBillable: data.isBillable || false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (data.externalCalendarLink) {
    consultationData.externalCalendarLink = data.externalCalendarLink;
  }

  if (data.externalEventId) {
    consultationData.externalEventId = data.externalEventId;
  }

  if (data.hourlyRate !== undefined) {
    consultationData.hourlyRate = data.hourlyRate;
  }

  if (data.currency) {
    consultationData.currency = data.currency;
  }

  await waitForAuth();
  const db = getFirestoreDb();
  const docRef = await addDoc(collection(db, CONSULTATIONS_COLLECTION), consultationData);

  // Log activity
  await logActivity({
    orgId: data.orgId,
    userId,
    userName,
    action: 'scheduled_consultation',
    details: {
      consultationId: docRef.id,
      type: data.type,
      title: data.title,
      scheduledAt: data.scheduledAt.toISOString(),
    },
  });

  return {
    id: docRef.id,
    ...consultationData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  } as Consultation;
}

// ============================================
// READ
// ============================================

export async function getConsultation(consultationId: string): Promise<Consultation | null> {
  await waitForAuth();
  const db = getFirestoreDb();
  const docRef = doc(db, CONSULTATIONS_COLLECTION, consultationId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return { id: docSnap.id, ...docSnap.data() } as Consultation;
}

export async function getConsultationsByOrg(
  orgId: string,
  options?: {
    status?: ConsultationStatus | ConsultationStatus[];
    limit?: number;
    upcoming?: boolean;
  }
): Promise<Consultation[]> {
  await waitForAuth();
  const db = getFirestoreDb();
  let q = query(
    collection(db, CONSULTATIONS_COLLECTION),
    where('orgId', '==', orgId),
    orderBy('scheduledAt', 'desc')
  );

  if (options?.status) {
    const statuses = Array.isArray(options.status) ? options.status : [options.status];
    q = query(q, where('status', 'in', statuses));
  }

  if (options?.upcoming) {
    q = query(
      collection(db, CONSULTATIONS_COLLECTION),
      where('orgId', '==', orgId),
      where('scheduledAt', '>=', Timestamp.now()),
      where('status', '==', CONSULTATION_STATUS.SCHEDULED),
      orderBy('scheduledAt', 'asc')
    );
  }

  if (options?.limit) {
    q = query(q, limit(options.limit));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as Consultation);
}

export async function getAllConsultations(options?: {
  status?: ConsultationStatus | ConsultationStatus[];
  limit?: number;
}): Promise<Consultation[]> {
  await waitForAuth();
  const db = getFirestoreDb();
  let q = query(collection(db, CONSULTATIONS_COLLECTION), orderBy('scheduledAt', 'desc'));

  if (options?.status) {
    const statuses = Array.isArray(options.status) ? options.status : [options.status];
    q = query(q, where('status', 'in', statuses));
  }

  if (options?.limit) {
    q = query(q, limit(options.limit));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as Consultation);
}

export async function getUpcomingConsultations(orgId?: string, count = 5): Promise<Consultation[]> {
  await waitForAuth();
  const db = getFirestoreDb();
  let q = query(
    collection(db, CONSULTATIONS_COLLECTION),
    where('scheduledAt', '>=', Timestamp.now()),
    where('status', '==', CONSULTATION_STATUS.SCHEDULED),
    orderBy('scheduledAt', 'asc'),
    limit(count)
  );

  if (orgId) {
    q = query(
      collection(db, CONSULTATIONS_COLLECTION),
      where('orgId', '==', orgId),
      where('scheduledAt', '>=', Timestamp.now()),
      where('status', '==', CONSULTATION_STATUS.SCHEDULED),
      orderBy('scheduledAt', 'asc'),
      limit(count)
    );
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as Consultation);
}

// ============================================
// UPDATE
// ============================================

export interface UpdateConsultationData {
  title?: string;
  description?: string;
  scheduledAt?: Date;
  duration?: number;
  participants?: string[];
  externalCalendarLink?: string;
  agendaItems?: string[];
  meetingNotes?: string;
  actionItems?: string[];
  isBillable?: boolean;
  hourlyRate?: number;
  currency?: Currency;
}

export async function updateConsultation(
  consultationId: string,
  data: UpdateConsultationData
): Promise<void> {
  await waitForAuth();
  const db = getFirestoreDb();
  const docRef = doc(db, CONSULTATIONS_COLLECTION, consultationId);

  const updateData: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.scheduledAt) updateData.scheduledAt = Timestamp.fromDate(data.scheduledAt);
  if (data.duration !== undefined) updateData.duration = data.duration;
  if (data.participants !== undefined) updateData.participants = data.participants;
  if (data.externalCalendarLink !== undefined)
    updateData.externalCalendarLink = data.externalCalendarLink;
  if (data.agendaItems !== undefined) updateData.agendaItems = data.agendaItems;
  if (data.meetingNotes !== undefined) updateData.meetingNotes = data.meetingNotes;
  if (data.actionItems !== undefined) updateData.actionItems = data.actionItems;
  if (data.isBillable !== undefined) updateData.isBillable = data.isBillable;
  if (data.hourlyRate !== undefined) updateData.hourlyRate = data.hourlyRate;
  if (data.currency !== undefined) updateData.currency = data.currency;

  await updateDoc(docRef, updateData);
}

export async function completeConsultation(
  consultationId: string,
  orgId: string,
  userId: string,
  userName: string,
  meetingNotes?: string,
  actionItems?: string[]
): Promise<void> {
  await waitForAuth();
  const db = getFirestoreDb();
  const docRef = doc(db, CONSULTATIONS_COLLECTION, consultationId);

  await updateDoc(docRef, {
    status: CONSULTATION_STATUS.COMPLETED,
    meetingNotes: meetingNotes || null,
    actionItems: actionItems || [],
    completedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Log activity
  await logActivity({
    orgId,
    userId,
    userName,
    action: 'completed_consultation',
    details: { consultationId },
  });
}

export async function cancelConsultation(
  consultationId: string,
  orgId: string,
  userId: string,
  userName: string,
  reason?: string
): Promise<void> {
  await waitForAuth();
  const db = getFirestoreDb();
  const docRef = doc(db, CONSULTATIONS_COLLECTION, consultationId);

  await updateDoc(docRef, {
    status: CONSULTATION_STATUS.CANCELED,
    meetingNotes: reason ? `Cancellation reason: ${reason}` : null,
    updatedAt: serverTimestamp(),
  });

  // Log activity
  await logActivity({
    orgId,
    userId,
    userName,
    action: 'canceled_consultation',
    details: {
      consultationId,
      ...(reason && { reason }),
    },
  });
}

export async function markNoShow(
  consultationId: string,
  orgId: string,
  userId: string,
  userName: string
): Promise<void> {
  await waitForAuth();
  const db = getFirestoreDb();
  const docRef = doc(db, CONSULTATIONS_COLLECTION, consultationId);

  await updateDoc(docRef, {
    status: CONSULTATION_STATUS.NO_SHOW,
    updatedAt: serverTimestamp(),
  });

  // Log activity
  await logActivity({
    orgId,
    userId,
    userName,
    action: 'marked_no_show',
    details: { consultationId },
  });
}

// ============================================
// DELETE
// ============================================

export async function deleteConsultation(consultationId: string): Promise<void> {
  await waitForAuth();
  const db = getFirestoreDb();
  const docRef = doc(db, CONSULTATIONS_COLLECTION, consultationId);
  await deleteDoc(docRef);
}

// ============================================
// REAL-TIME SUBSCRIPTIONS
// ============================================

export function subscribeToOrgConsultations(
  orgId: string,
  callback: (consultations: Consultation[]) => void,
  options?: {
    status?: ConsultationStatus[];
    upcoming?: boolean;
  }
): () => void {
  let unsubscribe: (() => void) | null = null;
  let isUnsubscribed = false;

  if (!orgId || orgId === 'template') {
    callback([]);
    return () => {};
  }

  waitForAuth()
    .then(() => {
      if (isUnsubscribed) return;
      const db = getFirestoreDb();
      let q = query(
        collection(db, CONSULTATIONS_COLLECTION),
        where('orgId', '==', orgId),
        orderBy('scheduledAt', 'desc')
      );

      if (options?.status && options.status.length > 0) {
        q = query(q, where('status', 'in', options.status));
      }

      if (options?.upcoming) {
        q = query(
          collection(db, CONSULTATIONS_COLLECTION),
          where('orgId', '==', orgId),
          where('scheduledAt', '>=', Timestamp.now()),
          where('status', '==', CONSULTATION_STATUS.SCHEDULED),
          orderBy('scheduledAt', 'asc')
        );
      }

      unsubscribe = onSnapshot(
        q,
        snapshot => {
          const consultations = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data(),
          })) as Consultation[];
          callback(consultations);
        },
        error => {
          console.error('[portal-consultations] Subscription error:', error);
          if (error.code === 'permission-denied') {
            console.error(
              'Permission denied. User may not be a member of this organization or rules may not have propagated yet.'
            );
            console.error('Organization ID:', orgId);
          }
          callback([]);
        }
      );
    })
    .catch(error => {
      console.error('Error waiting for auth in subscribeToOrgConsultations:', error);
      callback([]);
    });

  return () => {
    isUnsubscribed = true;
    if (unsubscribe) {
      unsubscribe();
    }
  };
}

export function subscribeToAllConsultations(
  callback: (consultations: Consultation[]) => void,
  options?: {
    status?: ConsultationStatus[];
  }
): () => void {
  let unsubscribe: (() => void) | null = null;
  let isUnsubscribed = false;

  waitForAuth()
    .then(() => {
      if (isUnsubscribed) return;
      const db = getFirestoreDb();
      let q = query(collection(db, CONSULTATIONS_COLLECTION), orderBy('scheduledAt', 'desc'));

      if (options?.status && options.status.length > 0) {
        q = query(q, where('status', 'in', options.status));
      }

      unsubscribe = onSnapshot(
        q,
        snapshot => {
          const consultations = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data(),
          })) as Consultation[];
          callback(consultations);
        },
        error => {
          console.error('[portal-consultations] Subscription error:', error);
          callback([]);
        }
      );
    })
    .catch(error => {
      console.error('Error waiting for auth in subscribeToAllConsultations:', error);
      callback([]);
    });

  return () => {
    isUnsubscribed = true;
    if (unsubscribe) {
      unsubscribe();
    }
  };
}

export function subscribeToConsultation(
  consultationId: string,
  callback: (consultation: Consultation | null) => void
): () => void {
  let unsubscribe: (() => void) | null = null;
  let isUnsubscribed = false;

  waitForAuth()
    .then(() => {
      if (isUnsubscribed) return;
      const db = getFirestoreDb();
      const docRef = doc(db, CONSULTATIONS_COLLECTION, consultationId);

      unsubscribe = onSnapshot(
        docRef,
        snapshot => {
          if (!snapshot.exists()) {
            callback(null);
            return;
          }
          callback({ id: snapshot.id, ...snapshot.data() } as Consultation);
        },
        error => {
          console.error('[portal-consultations] Subscription error:', error);
          callback(null);
        }
      );
    })
    .catch(error => {
      console.error('Error waiting for auth in subscribeToConsultation:', error);
      callback(null);
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

export async function getConsultationStats(orgId?: string): Promise<{
  total: number;
  scheduled: number;
  completed: number;
  canceled: number;
}> {
  await waitForAuth();
  const db = getFirestoreDb();
  let q = query(collection(db, CONSULTATIONS_COLLECTION));

  if (orgId) {
    q = query(q, where('orgId', '==', orgId));
  }

  const snapshot = await getDocs(q);
  const consultations = snapshot.docs.map(d => d.data()) as Consultation[];

  return {
    total: consultations.length,
    scheduled: consultations.filter(c => c.status === CONSULTATION_STATUS.SCHEDULED).length,
    completed: consultations.filter(c => c.status === CONSULTATION_STATUS.COMPLETED).length,
    canceled: consultations.filter(c => c.status === CONSULTATION_STATUS.CANCELED).length,
  };
}
