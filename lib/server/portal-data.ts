import 'server-only';

import { adminDb } from '@/lib/firebase-admin';
import type { ActivityLog, Invite, Organization, OrganizationMember, Request } from '@/lib/types/portal';
import { serializeFirestoreDoc } from '@/lib/server/portal-serialize';

const REQUESTS_COLLECTION = 'portal_requests';
const ACTIVITIES_COLLECTION = 'portal_activities';
const ORGS_COLLECTION = 'portal_organizations';
const MEMBERS_COLLECTION = 'portal_members';
const INVITES_COLLECTION = 'portal_invites';

function getDb() {
  if (!adminDb) {
    throw new Error('Firebase Admin is not configured');
  }
  return adminDb;
}

export async function serverGetAllRequests(): Promise<Request[]> {
  const snapshot = await getDb()
    .collection(REQUESTS_COLLECTION)
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map(doc => serializeFirestoreDoc<Request>(doc.id, doc.data()) as Request);
}

export async function serverGetRequestsByOrg(orgId: string): Promise<Request[]> {
  const snapshot = await getDb()
    .collection(REQUESTS_COLLECTION)
    .where('orgId', '==', orgId)
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map(doc => serializeFirestoreDoc<Request>(doc.id, doc.data()) as Request);
}

export async function serverGetRequest(requestId: string): Promise<Request | null> {
  const snapshot = await getDb().collection(REQUESTS_COLLECTION).doc(requestId).get();
  if (!snapshot.exists) {
    return null;
  }

  return serializeFirestoreDoc<Request>(snapshot.id, snapshot.data());
}

export async function serverGetOrgActivities(orgId: string, maxItems = 20): Promise<ActivityLog[]> {
  const snapshot = await getDb()
    .collection(ACTIVITIES_COLLECTION)
    .where('orgId', '==', orgId)
    .orderBy('createdAt', 'desc')
    .limit(maxItems)
    .get();

  return snapshot.docs.map(
    doc => serializeFirestoreDoc<ActivityLog>(doc.id, doc.data()) as ActivityLog
  );
}

export async function serverGetRequestActivities(requestId: string): Promise<ActivityLog[]> {
  const snapshot = await getDb()
    .collection(ACTIVITIES_COLLECTION)
    .where('requestId', '==', requestId)
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map(
    doc => serializeFirestoreDoc<ActivityLog>(doc.id, doc.data()) as ActivityLog
  );
}

export async function serverGetOrganization(orgId: string): Promise<Organization | null> {
  const snapshot = await getDb().collection(ORGS_COLLECTION).doc(orgId).get();
  if (!snapshot.exists) return null;
  return serializeFirestoreDoc<Organization>(snapshot.id, snapshot.data()) as Organization;
}

export async function serverGetOrgMembers(orgId: string): Promise<OrganizationMember[]> {
  const snapshot = await getDb()
    .collection(MEMBERS_COLLECTION)
    .where('orgId', '==', orgId)
    .get();

  return snapshot.docs.map(
    doc => serializeFirestoreDoc<OrganizationMember>(doc.id, doc.data()) as OrganizationMember
  );
}

export async function serverGetOrgInvites(orgId: string): Promise<Invite[]> {
  const snapshot = await getDb()
    .collection(INVITES_COLLECTION)
    .where('orgId', '==', orgId)
    .get();

  return snapshot.docs.map(doc => serializeFirestoreDoc<Invite>(doc.id, doc.data()) as Invite);
}
