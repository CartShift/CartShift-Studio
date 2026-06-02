import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getFirestoreDb, waitForAuth } from '@/lib/firebase';
import type { RequestPricingConfig } from '@/components/portal/pricing/RequestPricingCalculator';

function pricingConfigRef(orgId: string, requestId: string) {
  const db = getFirestoreDb();
  return doc(db, 'organizations', orgId, 'pricing-configs', requestId);
}

export async function getRequestPricingConfig(
  orgId: string,
  requestId: string
): Promise<RequestPricingConfig | null> {
  await waitForAuth();
  const snap = await getDoc(pricingConfigRef(orgId, requestId));
  return snap.exists() ? (snap.data() as RequestPricingConfig) : null;
}

export async function upsertRequestPricingConfig(
  orgId: string,
  requestId: string,
  config: Partial<RequestPricingConfig>
): Promise<RequestPricingConfig> {
  await waitForAuth();
  const docRef = pricingConfigRef(orgId, requestId);
  const snap = await getDoc(docRef);
  const existing = snap.exists() ? snap.data() : {};
  const updatedConfig = { ...existing, ...config, requestId } as RequestPricingConfig;
  await setDoc(docRef, updatedConfig, { merge: true });
  return updatedConfig;
}

export async function applyRequestPricingModifiers(
  orgId: string,
  requestIds: string[],
  modifiers: Partial<RequestPricingConfig>
): Promise<void> {
  await waitForAuth();
  await Promise.all(
    requestIds.map(requestId => updateDoc(pricingConfigRef(orgId, requestId), modifiers))
  );
}

export async function removeRequestPricingConfig(
  orgId: string,
  requestId: string
): Promise<void> {
  await waitForAuth();
  await deleteDoc(pricingConfigRef(orgId, requestId));
}
