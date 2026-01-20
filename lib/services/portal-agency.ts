import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirestoreDb, waitForAuth } from '@/lib/firebase';
import { PortalUser, ACCOUNT_TYPE } from '@/lib/types/portal';

const USERS_COLLECTION = 'portal_users';
const AGENCIES_COLLECTION = 'agencies';

export async function getAgencyTeam(): Promise<PortalUser[]> {
  await waitForAuth();
  const db = getFirestoreDb();
  const q = query(
    collection(db, USERS_COLLECTION),
    where('accountType', '==', ACCOUNT_TYPE.AGENCY),
    orderBy('name', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as PortalUser[];
}

/**
 * Fetches an agency profile by its ID.
 */
export async function getAgency(agencyId: string): Promise<any | null> {
  const db = getFirestoreDb();
  const docRef = doc(db, AGENCIES_COLLECTION, agencyId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return {
    id: docSnap.id,
    ...docSnap.data(),
  };
}

/**
 * Updates an agency profile.
 */
export async function updateAgency(agencyId: string, data: any): Promise<void> {
  const db = getFirestoreDb();
  const docRef = doc(db, AGENCIES_COLLECTION, agencyId);
  await setDoc(
    docRef,
    {
      ...data,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
