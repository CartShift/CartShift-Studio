import {
  collection,
  doc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { getFirestoreDb, waitForAuth, getFirebaseAuth } from '@/lib/firebase';
import { isLoggingOut } from './auth';
import { Notification } from '@/lib/types/portal';

const NOTIFICATIONS_COLLECTION = 'portal_notifications';

export async function getNotifications(
  userId: string,
  options?: { limit?: number }
): Promise<Notification[]> {
  await waitForAuth();
  const db = getFirestoreDb();
  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    ...(options?.limit ? [limit(options.limit)] : [])
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Notification[];
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  await waitForAuth();
  const db = getFirestoreDb();
  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    where('userId', '==', userId),
    where('read', '==', false)
  );

  const snapshot = await getDocs(q);
  return snapshot.size;
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await waitForAuth();
  const db = getFirestoreDb();
  const docRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
  await updateDoc(docRef, {
    read: true,
  });
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  await waitForAuth();
  const db = getFirestoreDb();
  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    where('userId', '==', userId),
    where('read', '==', false)
  );

  const snapshot = await getDocs(q);
  const updates = snapshot.docs.map(doc => updateDoc(doc.ref, { read: true }));

  await Promise.all(updates);
}

export function subscribeToNotifications(
  userId: string,
  callback: (notifications: Notification[]) => void,
  options?: { limit?: number }
): () => void {
  let unsubscribe: (() => void) | null = null;
  let isUnsubscribed = false;

  waitForAuth()
    .then(() => {
      if (isUnsubscribed) return;
      const db = getFirestoreDb();
      const q = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        ...(options?.limit ? [limit(options.limit)] : [])
      );

      unsubscribe = onSnapshot(
        q,
        snapshot => {
          const notifications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as Notification[];
          callback(notifications);
        },
        error => {
          // Suppress permission errors during logout
          if (error.code === 'permission-denied') {
            const auth = getFirebaseAuth();
            if (isLoggingOut() || !auth.currentUser) {
              return;
            }
          }
          console.error('Error in notifications snapshot:', error);
          callback([]);
        }
      );
    })
    .catch(error => {
      console.error('Error waiting for auth in subscribeToNotifications:', error);
      callback([]);
    });

  return () => {
    isUnsubscribed = true;
    if (unsubscribe) {
      unsubscribe();
    }
  };
}

export function subscribeToUnreadCount(
  userId: string,
  callback: (count: number) => void
): () => void {
  let unsubscribe: (() => void) | null = null;
  let isUnsubscribed = false;

  waitForAuth()
    .then(() => {
      if (isUnsubscribed) return;
      const db = getFirestoreDb();
      const q = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where('userId', '==', userId),
        where('read', '==', false)
      );

      unsubscribe = onSnapshot(
        q,
        snapshot => {
          callback(snapshot.size);
        },
        error => {
          if (error.code === 'permission-denied') {
            const auth = getFirebaseAuth();
            if (isLoggingOut() || !auth.currentUser) {
              return;
            }
          }
          console.error('Error in unread count snapshot:', error);
          callback(0);
        }
      );
    })
    .catch(error => {
      console.error('Error waiting for auth in subscribeToUnreadCount:', error);
      callback(0);
    });

  return () => {
    isUnsubscribed = true;
    if (unsubscribe) {
      unsubscribe();
    }
  };
}
