import 'server-only';

import { adminDb } from '@/lib/firebase-admin';
import { getServerSession } from '@/lib/auth/server-auth';

export interface PortalSessionContext {
  uid: string;
  email?: string;
  isAgency: boolean;
  orgId: string | null;
  organizations: string[];
}

export async function getPortalSessionContext(): Promise<PortalSessionContext | null | undefined> {
  const session = await getServerSession();

  if (session === undefined) {
    return undefined;
  }

  if (session === null || !adminDb) {
    return null;
  }

  const userSnapshot = await adminDb.collection('portal_users').doc(session.uid).get();
  if (!userSnapshot.exists) {
    return null;
  }

  const user = userSnapshot.data() ?? {};
  const organizations = Array.isArray(user.organizations)
    ? user.organizations.filter((orgId): orgId is string => typeof orgId === 'string')
    : [];
  const isAgency = user.isAgency === true || user.accountType === 'AGENCY';

  return {
    uid: session.uid,
    email: session.email,
    isAgency,
    orgId: isAgency ? null : organizations[0] ?? null,
    organizations,
  };
}
