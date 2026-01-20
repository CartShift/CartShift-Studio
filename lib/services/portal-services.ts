import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirestoreDb, waitForAuth, getFirebaseAuth } from '@/lib/firebase';
import { Service } from '@/lib/types/portal';
import { isLoggingOut } from '@/lib/services/auth';

const SERVICES_COLLECTION = 'portal_services';

export async function createService(
  data: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  await waitForAuth();
  const db = getFirestoreDb();
  const docRef = await addDoc(collection(db, SERVICES_COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateService(
  id: string,
  data: Partial<Omit<Service, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  await waitForAuth();
  const db = getFirestoreDb();
  const serviceRef = doc(db, SERVICES_COLLECTION, id);
  await updateDoc(serviceRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteService(id: string): Promise<void> {
  await waitForAuth();
  const db = getFirestoreDb();
  await deleteDoc(doc(db, SERVICES_COLLECTION, id));
}

export async function getService(id: string): Promise<Service | null> {
  await waitForAuth();
  const db = getFirestoreDb();
  const serviceSnap = await getDoc(doc(db, SERVICES_COLLECTION, id));
  if (serviceSnap.exists()) {
    return { id: serviceSnap.id, ...serviceSnap.data() } as Service;
  }
  return null;
}

export function subscribeToServices(callback: (services: Service[]) => void): () => void {
  let unsubscribe: (() => void) | null = null;
  let isUnsubscribed = false;

  waitForAuth()
    .then(() => {
      if (isUnsubscribed) return;
      const db = getFirestoreDb();
      const q = query(collection(db, SERVICES_COLLECTION), orderBy('name', 'asc'));

      unsubscribe = onSnapshot(
        q,
        snapshot => {
          const services = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as Service[];
          callback(services);
        },
        error => {
          const firestoreError = error as { code?: string; message?: string };

          if (firestoreError.code === 'permission-denied') {
            const auth = getFirebaseAuth();
            if (isLoggingOut() || !auth.currentUser) return;

            console.error('[portal-services] Permission denied accessing services');
          } else {
            console.error('[portal-services] Error in services subscription:', error);
          }
          callback([]);
        }
      );
    })
    .catch(error => {
      console.error('[portal-services] Error waiting for auth:', error);
      callback([]);
    });

  return () => {
    isUnsubscribed = true;
    if (unsubscribe) {
      unsubscribe();
    }
  };
}
