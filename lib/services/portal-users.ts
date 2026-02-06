import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getFirestoreDb, getFirebaseAuth } from '@/lib/firebase';
import { isLoggingOut } from './auth';
import { PortalUser } from '@/lib/types/portal';
import { ACCOUNT_TYPE } from '@/lib/types/portal';

const USERS_COLLECTION = 'portal_users';

export async function getPortalUser(userId: string): Promise<PortalUser | null> {
  try {
    const db = getFirestoreDb();
    const docRef = doc(db, USERS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as PortalUser;
  } catch (error) {
    const firestoreError = error as { code?: string };
    if (firestoreError.code === 'permission-denied') {
      const auth = getFirebaseAuth();
      if (isLoggingOut() || !auth.currentUser) return null;
    }
    throw error;
  }
}

export async function updatePortalUser(userId: string, data: Partial<PortalUser>): Promise<void> {
  const db = getFirestoreDb();
  const docRef = doc(db, USERS_COLLECTION, userId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function updateNotificationPreferences(
  userId: string,
  preferences: PortalUser['notificationPreferences']
): Promise<void> {
  return updatePortalUser(userId, { notificationPreferences: preferences });
}

export async function updateThemePreference(
  userId: string,
  theme: 'light' | 'dark' | 'system'
): Promise<void> {
  return updatePortalUser(userId, {
    preferences: {
      theme,
    },
  });
}

export async function updateLanguagePreference(
  userId: string,
  language: 'en' | 'he'
): Promise<void> {
  return updatePortalUser(userId, {
    preferences: {
      language,
    },
  });
}

export async function updateOnboardingStatus(
  userId: string,
  data: { onboardingComplete: boolean; onboardingCompletedAt?: Date; onboardingSkipped?: boolean }
): Promise<void> {
  return updatePortalUser(userId, data as Partial<PortalUser>);
}

export async function repairAgencyAccount(params: {
  userId: string;
  email: string | null;
  nameFallback: string;
}): Promise<void> {
  const db = getFirestoreDb();
  const docRef = doc(db, USERS_COLLECTION, params.userId);
  const snap = await getDoc(docRef);
  const data = {
    isAgency: true,
    accountType: ACCOUNT_TYPE.AGENCY,
    updatedAt: serverTimestamp(),
  };
  if (snap.exists()) {
    await updateDoc(docRef, data);
  } else {
    await setDoc(docRef, {
      ...data,
      email: params.email ?? '',
      name: params.nameFallback,
      createdAt: serverTimestamp(),
    });
  }
}
