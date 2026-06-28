import 'server-only';
import { adminDb } from '@/lib/firebase-admin';

const REQUESTS = 'portal_requests';
const ALIASES = 'portal_request_aliases';
const LEGACY_PROPOSALS = 'portal_pricing_requests';

/** Resolves an old pricing proposal id without changing public or bookmarked URLs. */
export async function resolveCanonicalRequestId(id: string): Promise<string> {
  if (!adminDb) return id;
  const direct = await adminDb.collection(REQUESTS).doc(id).get();
  if (direct.exists) return id;

  const alias = await adminDb.collection(ALIASES).doc(id).get();
  const aliasedId = alias.data()?.requestId as string | undefined;
  if (aliasedId) return aliasedId;

  const legacy = await adminDb.collection(LEGACY_PROPOSALS).doc(id).get();
  return (legacy.data()?.migratedRequestId as string | undefined) ?? id;
}
