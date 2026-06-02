import 'server-only';
import admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase-admin';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function createDefaultOrganization(
  uid: string,
  email: string,
  name?: string | null
): Promise<string> {
  if (!adminDb) {
    throw new Error('admin-not-configured');
  }

  const orgName = name ? `${name}'s Organization` : 'Dev Test Organization';
  const orgRef = await adminDb.collection('portal_organizations').add({
    name: orgName,
    slug: generateSlug(orgName),
    createdBy: uid,
    status: 'active',
    plan: 'free',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  const orgId = orgRef.id;
  await adminDb
    .collection('portal_members')
    .doc(`${orgId}_${uid}`)
    .set({
      orgId,
      userId: uid,
      email,
      name: name ?? null,
      role: 'owner',
      invitedBy: null,
      inviteId: null,
      joinedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

  return orgId;
}

export async function ensurePortalOwnerAccess(uid: string, email: string): Promise<void> {
  if (!adminDb) {
    throw new Error('admin-not-configured');
  }

  const userRef = adminDb.collection('portal_users').doc(uid);
  const userSnap = await userRef.get();
  const userData = userSnap.data() ?? {};
  const isAgency = userData.isAgency === true || userData.accountType === 'AGENCY';

  const updates: Record<string, unknown> = {
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (isAgency && userData.agencyRole !== 'owner') {
    updates.agencyRole = 'owner';
  }

  let orgIds = Array.isArray(userData.organizations)
    ? userData.organizations.filter((orgId): orgId is string => typeof orgId === 'string')
    : [];

  if (orgIds.length === 0) {
    const orgId = await createDefaultOrganization(uid, email, userData.name ?? null);
    orgIds = [orgId];
    updates.organizations = admin.firestore.FieldValue.arrayUnion(orgId);

    if (!userData.accountType) {
      updates.accountType = 'CLIENT';
      updates.isAgency = false;
    }
  }

  for (const orgId of orgIds) {
    const memberId = `${orgId}_${uid}`;
    const memberRef = adminDb.collection('portal_members').doc(memberId);
    const memberSnap = await memberRef.get();

    if (!memberSnap.exists) {
      await memberRef.set({
        orgId,
        userId: uid,
        email,
        name: userData.name ?? null,
        role: 'owner',
        invitedBy: null,
        inviteId: null,
        joinedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      continue;
    }

    if (memberSnap.data()?.role !== 'owner') {
      await memberRef.update({
        role: 'owner',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }

  if (Object.keys(updates).length > 1) {
    await userRef.set(updates, { merge: true });
  }
}
