import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore';
import { getFirestoreDb, waitForAuth, getFirebaseAuth } from '@/lib/firebase';
import { isLoggingOut } from './auth';
import { ActivityLog } from '@/lib/types/portal';

const ACTIVITIES_COLLECTION = 'portal_activities';

export async function logActivity(data: Omit<ActivityLog, 'id' | 'createdAt'>): Promise<void> {
  await waitForAuth();
  const db = getFirestoreDb();
  await addDoc(collection(db, ACTIVITIES_COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function getRequestActivities(
  requestId: string,
  orgId?: string
): Promise<ActivityLog[]> {
  await waitForAuth();
  const db = getFirestoreDb();
  let q;

  if (orgId) {
    q = query(
      collection(db, ACTIVITIES_COLLECTION),
      where('requestId', '==', requestId),
      where('orgId', '==', orgId),
      orderBy('createdAt', 'desc')
    );
  } else {
    q = query(
      collection(db, ACTIVITIES_COLLECTION),
      where('requestId', '==', requestId),
      orderBy('createdAt', 'desc')
    );
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as ActivityLog[];
}

export async function getOrgActivities(
  orgId: string,
  maxItems: number = 20
): Promise<ActivityLog[]> {
  await waitForAuth();
  const auth = getFirebaseAuth();
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error('User must be authenticated to access activities');
  }

  try {
    await currentUser.getIdToken(true);
  } catch (error) {
    console.warn('[getOrgActivities] Error refreshing token:', error);
  }

  const db = getFirestoreDb();
  const q = query(
    collection(db, ACTIVITIES_COLLECTION),
    where('orgId', '==', orgId),
    orderBy('createdAt', 'desc'),
    limit(maxItems)
  );

  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ActivityLog[];
  } catch (error: unknown) {
    const firestoreError = error as { code?: string; message?: string };
    if (firestoreError.code === 'permission-denied') {
      console.error(
        '[getOrgActivities] Permission denied. User may not be a member of the organization.',
        {
          orgId,
          userId: currentUser.uid,
          error: firestoreError.message,
        }
      );
      throw new Error(
        `Permission denied accessing activities for organization ${orgId}. Please check your membership.`
      );
    }
    throw error;
  }
}

export function subscribeToOrgActivities(
  orgId: string,
  callback: (activities: ActivityLog[]) => void,
  maxItems: number = 20
): () => void {
  let unsubscribe: (() => void) | null = null;
  let isUnsubscribed = false;

  waitForAuth()
    .then(() => {
      if (isUnsubscribed) return;
      const db = getFirestoreDb();
      const q = query(
        collection(db, ACTIVITIES_COLLECTION),
        where('orgId', '==', orgId),
        orderBy('createdAt', 'desc'),
        limit(maxItems)
      );

      unsubscribe = onSnapshot(
        q,
        snapshot => {
          const activities = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as ActivityLog[];
          callback(activities);
        },
        error => {
          // Suppress permission errors during logout
          if (error.code === 'permission-denied') {
            const auth = getFirebaseAuth();
            if (isLoggingOut() || !auth.currentUser) return;

            console.error('[portal-activities] Permission denied for orgId:', orgId);
            console.error('[portal-activities] Error details:', {
              code: error.code,
              message: error.message,
              orgId,
            });
          } else {
            console.error('[portal-activities] Error in activities snapshot:', error);
          }
          callback([]);
        }
      );
    })
    .catch(error => {
      console.error('Error waiting for auth in subscribeToOrgActivities:', error);
      callback([]);
    });

  return () => {
    isUnsubscribed = true;
    if (unsubscribe) {
      unsubscribe();
    }
  };
}

export function subscribeToRequestActivities(
  requestId: string,
  callback: (activities: ActivityLog[]) => void,
  orgId?: string
): () => void {
  let unsubscribe: (() => void) | null = null;
  let isUnsubscribed = false;

  waitForAuth()
    .then(() => {
      if (isUnsubscribed) return;
      const db = getFirestoreDb();
      let q;

      if (orgId) {
        q = query(
          collection(db, ACTIVITIES_COLLECTION),
          where('requestId', '==', requestId),
          where('orgId', '==', orgId),
          orderBy('createdAt', 'desc')
        );
      } else {
        q = query(
          collection(db, ACTIVITIES_COLLECTION),
          where('requestId', '==', requestId),
          orderBy('createdAt', 'desc')
        );
      }

      unsubscribe = onSnapshot(
        q,
        snapshot => {
          const activities = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as ActivityLog[];
          callback(activities);
        },
        error => {
          // Suppress permission errors during logout
          if (error.code === 'permission-denied') {
            const auth = getFirebaseAuth();
            if (isLoggingOut() || !auth.currentUser) return;
          }
          console.error('Error in request activities snapshot:', error);
          callback([]);
        }
      );
    })
    .catch(error => {
      console.error('Error waiting for auth in subscribeToRequestActivities:', error);
      callback([]);
    });

  return () => {
    isUnsubscribed = true;
    if (unsubscribe) {
      unsubscribe();
    }
  };
}
