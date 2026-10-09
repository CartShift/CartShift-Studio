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

  const db = adminDb;
  if (session === null || !db) {
    return null;
  }

  const userSnapshot = await db.collection('portal_users').doc(session.uid).get();
  if (!userSnapshot.exists) {
    return null;
  }

  const user = userSnapshot.data() ?? {};
  // User profile arrays are UI metadata, not authorization. Verify each
  // organization against current membership so removed users never get SSR data.
  const storedOrganizations: string[] = Array.isArray(user.organizations)
    ? [...new Set<string>(user.organizations.filter(
        (id: unknown): id is string => typeof id === 'string' && id.length > 0 && !id.includes('/')
      ))]
    : [];
  const checked = await Promise.all(storedOrganizations.map(async orgId => {
    const membership = await db.collection('portal_members').doc(`${orgId}_${session.uid}`).get();
    if (membership.exists) return membership.data()?.removedAt ? null : orgId;

    // Preserve creator access when initial membership has not yet been created.
    const org = await db.collection('portal_organizations').doc(orgId).get();
    return org.data()?.createdBy === session.uid ? orgId : null;
  }));
  const organizations = checked.filter((id): id is string => Boolean(id));
  const isAgency = user.isAgency === true || user.accountType === 'AGENCY';

  return {
    uid: session.uid,
    email: session.email,
    isAgency,
    orgId: isAgency ? null : organizations[0] ?? null,
    organizations,
  };
}
