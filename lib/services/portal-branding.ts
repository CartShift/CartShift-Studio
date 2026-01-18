import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase';
import { Organization } from '@/lib/types/portal';

const SYSTEM_SETTINGS_COLLECTION = 'system_settings';
const AGENCIES_COLLECTION = 'agencies';
const ORGANIZATIONS_COLLECTION = 'portal_organizations';

export type BrandingData = Organization['branding'];

/**
 * Fetches the global branding settings.
 */
export async function getGlobalBranding(): Promise<BrandingData | null> {
  const db = getFirestoreDb();
  const globalDoc = await getDoc(doc(db, SYSTEM_SETTINGS_COLLECTION, 'branding'));

  if (!globalDoc.exists()) {
    return null;
  }

  return globalDoc.data() as BrandingData;
}

/**
 * Updates the global branding settings.
 */
export async function updateGlobalBranding(data: BrandingData, userId: string): Promise<void> {
  const db = getFirestoreDb();
  const globalRef = doc(db, SYSTEM_SETTINGS_COLLECTION, 'branding');
  await setDoc(
    globalRef,
    {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    },
    { merge: true }
  );
}

/**
 * Fetches branding for a specific agency.
 */
export async function getAgencyBranding(agencyId: string): Promise<BrandingData | null> {
  const db = getFirestoreDb();
  const agencyDoc = await getDoc(doc(db, AGENCIES_COLLECTION, agencyId));

  if (!agencyDoc.exists()) {
    return null;
  }

  const data = agencyDoc.data();
  return data.branding || null;
}

/**
 * Fetches branding for the agency that owns a specific organization.
 */
export async function getOrganizationAgencyBranding(orgId: string): Promise<BrandingData | null> {
  const db = getFirestoreDb();
  const orgDoc = await getDoc(doc(db, ORGANIZATIONS_COLLECTION, orgId));

  if (!orgDoc.exists()) {
    return null;
  }

  const orgData = orgDoc.data();
  const agencyId = orgData.createdBy;

  if (!agencyId) {
    return null;
  }

  return getAgencyBranding(agencyId);
}
