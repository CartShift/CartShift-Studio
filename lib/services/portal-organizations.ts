import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { getFirestoreDb, getFirebaseAuth, waitForAuth } from '@/lib/firebase';
import { isLoggingOut } from './auth';
import { getPortalUser } from './portal-users';
import {
  Organization,
  OrganizationMember,
  Invite,
  InviteMemberData,
  USER_ROLE,
  UserRole,
  ACCOUNT_TYPE,
} from '@/lib/types/portal';

const ORGS_COLLECTION = 'portal_organizations';
const MEMBERS_COLLECTION = 'portal_members';
const INVITES_COLLECTION = 'portal_invites';
const USERS_COLLECTION = 'portal_users';

// ============================================
// ORGANIZATIONS
// ============================================

export async function createOrganization(
  name: string,
  userId: string,
  userEmail: string,
  userName?: string
): Promise<Organization> {
  await waitForAuth();
  const db = getFirestoreDb();
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const orgData = {
    name: name.trim(),
    slug,
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, ORGS_COLLECTION), orgData);
  const orgId = docRef.id;

  // Add creator as owner
  await addMember(orgId, userId, userEmail, USER_ROLE.OWNER, userName);

  // Update user's organizations array
  const userRef = doc(db, USERS_COLLECTION, userId);
  await setDoc(
    userRef,
    {
      email: userEmail,
      name: userName || null,
      organizations: arrayUnion(orgId),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return {
    id: orgId,
    ...orgData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  } as Organization;
}

export async function getOrganization(orgId: string): Promise<Organization | null> {
  try {
    const db = getFirestoreDb();
    const docRef = doc(db, ORGS_COLLECTION, orgId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Organization;
  } catch (error) {
    const firestoreError = error as { code?: string };
    if (firestoreError.code === 'permission-denied') {
      const auth = getFirebaseAuth();
      if (isLoggingOut() || !auth.currentUser) return null;
    }
    throw error;
  }
}

export async function getUserOrganizations(userId: string): Promise<Organization[]> {
  await waitForAuth();
  const db = getFirestoreDb();
  // Get user's org IDs
  const userRef = doc(db, USERS_COLLECTION, userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return [];
  }

  const userData = userSnap.data();
  const orgIds = userData.organizations || [];

  if (orgIds.length === 0) {
    return [];
  }

  // Fetch all organizations
  const orgs: Organization[] = [];
  for (const orgId of orgIds) {
    const org = await getOrganization(orgId);
    if (org) {
      orgs.push(org);
    }
  }

  return orgs;
}

export async function getAllOrganizations(): Promise<Organization[]> {
  await waitForAuth();
  const auth = getFirebaseAuth();
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error('User must be authenticated to access all organizations');
  }

  const userData = await getPortalUser(currentUser.uid);
  if (!userData || (userData.accountType !== 'AGENCY' && !userData.isAgency)) {
    throw new Error('Agency permissions required to access all organizations');
  }

  const db = getFirestoreDb();
  const q = query(collection(db, ORGS_COLLECTION), orderBy('name', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Organization[];
}

export async function updateOrganization(
  orgId: string,
  data: {
    name?: string;
    logoUrl?: string;
    website?: string;
    industry?: string;
    bio?: string;
    // Shopify integration fields
    shopifyDomain?: string;
    shopifyCollaboratorCode?: string;
    shopifyAccessStatus?: 'pending' | 'requested' | 'connected' | 'revoked';
    shopifyAccessRequestedAt?: import('firebase/firestore').Timestamp;
    shopifyConnectedAt?: import('firebase/firestore').Timestamp;
    responsibleAgencyUserId?: string | null;
  }
): Promise<void> {
  await waitForAuth();
  const db = getFirestoreDb();
  const docRef = doc(db, ORGS_COLLECTION, orgId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteOrganization(orgId: string): Promise<void> {
  await waitForAuth();
  const db = getFirestoreDb();
  // Soft delete
  const docRef = doc(db, ORGS_COLLECTION, orgId);
  await updateDoc(docRef, {
    status: 'inactive',
    removedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Get all organizations with their member and request counts
 */
export async function getOrganizationsWithStats(): Promise<
  (Organization & { memberCount: number; requestCount: number })[]
> {
  const db = getFirestoreDb();
  const orgs = await getAllOrganizations();

  // Get all members and requests to count them
  const requestsSnap = await getDocs(collection(db, 'portal_requests'));
  const membersSnap = await getDocs(collection(db, MEMBERS_COLLECTION));

  const requestCounts: Record<string, number> = {};
  requestsSnap.forEach(doc => {
    const orgId = doc.data().orgId;
    if (orgId) {
      requestCounts[orgId] = (requestCounts[orgId] || 0) + 1;
    }
  });

  const memberCounts: Record<string, number> = {};
  membersSnap.forEach(doc => {
    const data = doc.data();
    const orgId = data.orgId;
    if (orgId && !data.removedAt) {
      memberCounts[orgId] = (memberCounts[orgId] || 0) + 1;
    }
  });

  return orgs.map(org => ({
    ...org,
    memberCount: memberCounts[org.id] || 0,
    requestCount: requestCounts[org.id] || 0,
  }));
}

// ============================================
// MEMBERS
// ============================================

async function addMember(
  orgId: string,
  userId: string,
  email: string,
  role: UserRole,
  name?: string,
  invitedBy?: string,
  inviteId?: string
): Promise<OrganizationMember> {
  const db = getFirestoreDb();
  const memberData = {
    orgId,
    userId,
    email,
    name: name || null,
    role,
    invitedBy: invitedBy || null,
    inviteId: inviteId || null,
    joinedAt: serverTimestamp(),
  };

  const memberId = `${orgId}_${userId}`;
  const docRef = doc(db, MEMBERS_COLLECTION, memberId);
  await setDoc(docRef, memberData);

  return {
    id: memberId,
    ...memberData,
    joinedAt: Timestamp.now(),
  } as OrganizationMember;
}

export async function getOrganizationMembers(orgId: string): Promise<OrganizationMember[]> {
  await waitForAuth();
  const db = getFirestoreDb();
  const q = query(
    collection(db, MEMBERS_COLLECTION),
    where('orgId', '==', orgId),
    orderBy('joinedAt', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))
    .filter(m => !(m as any).removedAt) as OrganizationMember[];
}

export async function getMemberByUserId(
  orgId: string,
  userId: string
): Promise<OrganizationMember | null> {
  const db = getFirestoreDb();
  try {
    const memberId = `${orgId}_${userId}`;
    const memberRef = doc(db, MEMBERS_COLLECTION, memberId);
    const memberSnap = await getDoc(memberRef);

    if (!memberSnap.exists()) {
      return null;
    }

    return {
      id: memberSnap.id,
      ...memberSnap.data(),
    } as OrganizationMember;
  } catch (error: unknown) {
    const firestoreError = error as { code?: string; message?: string };
    if (firestoreError.code === 'permission-denied') {
      console.warn(
        `[getMemberByUserId] Permission denied - treating as no membership. orgId: ${orgId}, userId: ${userId}`
      );
      return null;
    }
    console.error(`[getMemberByUserId] Error checking membership:`, error);
    throw error;
  }
}

export async function ensureMembership(
  orgId: string,
  userId: string,
  userEmail: string,
  userName?: string
): Promise<OrganizationMember | null> {
  let member = await getMemberByUserId(orgId, userId);

  if (member) {
    return member;
  }

  let org: Organization | null = null;
  try {
    org = await getOrganization(orgId);
  } catch (error: unknown) {
    const firestoreError = error as { code?: string; message?: string };
    if (firestoreError.code === 'permission-denied') {
      console.warn(`[ensureMembership] Permission denied reading organization: ${orgId}`);
    } else {
      console.error(`[ensureMembership] Error reading organization:`, error);
    }
  }

  if (!org) {
    console.warn(`[ensureMembership] Organization not found or not accessible: ${orgId}`);
    return null;
  }

  const isCreator = org.createdBy === userId;
  if (isCreator) {
    console.log(
      `[ensureMembership] User is creator, creating owner membership for orgId: ${orgId}, userId: ${userId}`
    );
    try {
      member = await addMember(orgId, userId, userEmail, USER_ROLE.OWNER, userName);

      const db = getFirestoreDb();
      const userRef = doc(db, USERS_COLLECTION, userId);
      await setDoc(
        userRef,
        {
          organizations: arrayUnion(orgId),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      return member;
    } catch (error) {
      console.error(`[ensureMembership] Failed to create owner membership:`, error);
      return null;
    }
  }

  const userData = await getPortalUser(userId);
  if (!userData) {
    console.warn(`[ensureMembership] User not found: ${userId}`);
    return null;
  }

  const hasOrgInList = userData.organizations?.includes(orgId);
  if (!hasOrgInList) {
    console.warn(
      `[ensureMembership] User doesn't have orgId in organizations array. orgId: ${orgId}, userId: ${userId}, userOrgs: ${JSON.stringify(userData.organizations)}`
    );
    return null;
  }

  const role = USER_ROLE.MEMBER;

  try {
    member = await addMember(orgId, userId, userEmail, role, userName);
    console.log(
      `[ensureMembership] Repaired missing membership for orgId: ${orgId}, userId: ${userId}, role: ${role}`
    );
    return member;
  } catch (error) {
    console.error(`[ensureMembership] Failed to repair membership:`, error);
    return null;
  }
}

export async function updateMemberRole(memberId: string, role: UserRole): Promise<void> {
  const db = getFirestoreDb();
  const docRef = doc(db, MEMBERS_COLLECTION, memberId);
  await updateDoc(docRef, { role });
}

export async function removeMember(memberId: string, orgId: string, userId: string): Promise<void> {
  const db = getFirestoreDb();
  // Remove from members
  const memberRef = doc(db, MEMBERS_COLLECTION, memberId);
  await updateDoc(memberRef, { removedAt: serverTimestamp() });

  // Remove org from user's list
  const userRef = doc(db, USERS_COLLECTION, userId);
  await setDoc(
    userRef,
    {
      organizations: arrayRemove(orgId),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

// ============================================
// INVITES
// ============================================

export async function createInvite(
  orgId: string | undefined,
  invitedBy: string,
  invitedByName: string,
  data: InviteMemberData
): Promise<Invite> {
  await waitForAuth();
  // Check if already a member if orgId exists
  if (orgId) {
    const existingMembers = await getOrganizationMembers(orgId);
    if (existingMembers.some(m => m.email === data.email)) {
      throw new Error('This user is already a member of this organization');
    }
  }

  // Check for existing pending invite
  const db = getFirestoreDb();
  const qInvite = orgId
    ? query(
        collection(db, INVITES_COLLECTION),
        where('orgId', '==', orgId),
        where('email', '==', data.email.toLowerCase().trim()),
        where('status', '==', 'pending')
      )
    : query(
        collection(db, INVITES_COLLECTION),
        where('isAgency', '==', true),
        where('email', '==', data.email.toLowerCase().trim()),
        where('status', '==', 'pending')
      );

  const existingInviteSnap = await getDocs(qInvite);
  if (!existingInviteSnap.empty) {
    throw new Error('An invite has already been sent to this email');
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 day expiry

  // Generate unique invite code
  const inviteCode =
    Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  const inviteData = {
    orgId: orgId || null,
    email: data.email.toLowerCase().trim(),
    role: data.role,
    isAgency: data.isAgency || false,
    invitedBy,
    invitedByName,
    code: inviteCode,
    status: 'pending' as const,
    expiresAt: Timestamp.fromDate(expiresAt),
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, INVITES_COLLECTION), inviteData);

  console.log(`[Invite] Created invite ${docRef.id} with code ${inviteCode} for ${data.email}`);

  return {
    id: docRef.id,
    ...inviteData,
    createdAt: Timestamp.now(),
  } as Invite;
}

/**
 * Fetches an invite by its code or ID.
 * First tries to fetch by code (for invite URLs), then falls back to ID.
 */
export async function getInvite(codeOrId: string): Promise<Invite | null> {
  const db = getFirestoreDb();

  // Try fetching by code first (for invite URLs)
  const qByCode = query(
    collection(db, INVITES_COLLECTION),
    where('code', '==', codeOrId),
    limit(1)
  );

  const codeSnapshot = await getDocs(qByCode);

  if (!codeSnapshot.empty) {
    const docSnap = codeSnapshot.docs[0];
    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Invite;
  }

  // Fallback: try fetching by document ID
  const docRef = doc(db, INVITES_COLLECTION, codeOrId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as Invite;
}

export async function getPendingInviteByEmail(
  orgId: string,
  email: string
): Promise<Invite | null> {
  const db = getFirestoreDb();
  const q = query(
    collection(db, INVITES_COLLECTION),
    where('orgId', '==', orgId),
    where('email', '==', email.toLowerCase()),
    where('status', '==', 'pending')
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
  } as Invite;
}

export async function getInvitesByOrg(orgId: string): Promise<Invite[]> {
  const db = getFirestoreDb();
  const q = query(
    collection(db, INVITES_COLLECTION),
    where('orgId', '==', orgId),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Invite[];
}

export async function getInvitesByEmail(email: string): Promise<Invite[]> {
  const db = getFirestoreDb();
  const q = query(
    collection(db, INVITES_COLLECTION),
    where('email', '==', email.toLowerCase()),
    where('status', '==', 'pending')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Invite[];
}

export async function acceptInvite(
  inviteId: string,
  userId: string,
  userName?: string
): Promise<void> {
  const db = getFirestoreDb();
  const inviteRef = doc(db, INVITES_COLLECTION, inviteId);
  const inviteSnap = await getDoc(inviteRef);

  if (!inviteSnap.exists()) {
    throw new Error('Invite not found');
  }

  const invite = inviteSnap.data() as Invite;

  if (invite.status !== 'pending') {
    throw new Error('This invite has already been used');
  }

  // Check if expired
  if (invite.expiresAt.toDate() < new Date()) {
    await updateDoc(inviteRef, { status: 'expired' });
    throw new Error('This invite has expired');
  }

  // Check email mismatch
  const auth = getFirebaseAuth();
  const currentUser = auth.currentUser;
  if (invite.email.toLowerCase() !== currentUser?.email?.toLowerCase()) {
    throw new Error('Email mismatch: This invite was sent to another email address');
  }

  // Handle based on invite type
  if (invite.isAgency) {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await setDoc(
      userRef,
      {
        email: invite.email,
        name: userName || null,
        accountType: ACCOUNT_TYPE.AGENCY,
        isAgency: true,
        agencyRole: invite.role, // Save the role assigned in the invite
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } else if (invite.orgId) {
    // Add as member of organization
    await addMember(
      invite.orgId,
      userId,
      invite.email,
      invite.role,
      userName || 'User',
      invite.invitedBy,
      inviteId
    );

    // Update user's organizations
    const userRef = doc(db, USERS_COLLECTION, userId);
    await setDoc(
      userRef,
      {
        email: invite.email,
        name: userName || null,
        organizations: arrayUnion(invite.orgId),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  // Mark invite as accepted
  await updateDoc(inviteRef, {
    status: 'accepted',
    acceptedAt: serverTimestamp(),
  });
}

export async function cancelInvite(inviteId: string): Promise<void> {
  const db = getFirestoreDb();
  const inviteRef = doc(db, INVITES_COLLECTION, inviteId);
  await updateDoc(inviteRef, { status: 'expired' });
}

/**
 * Helper function to invite a team member
 */
export async function inviteTeamMember(
  orgId: string,
  email: string,
  role: UserRole,
  invitedBy: string = 'current-user-id',
  invitedByName: string = 'Current User'
): Promise<Invite> {
  return createInvite(orgId, invitedBy, invitedByName, {
    email,
    role,
  });
}

export async function inviteAgencyMember(
  email: string,
  role: UserRole,
  invitedBy: string,
  invitedByName: string
): Promise<Invite> {
  return createInvite(undefined, invitedBy, invitedByName, {
    email,
    role,
    isAgency: true,
  });
}

export function subscribeToInvites(
  orgId: string,
  callback: (invites: Invite[]) => void
): () => void {
  const db = getFirestoreDb();
  const q = query(
    collection(db, INVITES_COLLECTION),
    where('orgId', '==', orgId),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    snapshot => {
      const invites = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Invite[];
      callback(invites);
    },
    error => {
      if (error.code === 'permission-denied') {
        const auth = getFirebaseAuth();
        if (isLoggingOut() || !auth.currentUser) return;
      }
      console.error('Error in invites snapshot:', error);
      callback([]);
    }
  );
}

export function subscribeToAgencyInvites(callback: (invites: Invite[]) => void): () => void {
  const db = getFirestoreDb();
  const q = query(
    collection(db, INVITES_COLLECTION),
    where('isAgency', '==', true),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    snapshot => {
      const invites = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Invite[];
      callback(invites);
    },
    error => {
      if (error.code === 'permission-denied') {
        const auth = getFirebaseAuth();
        if (isLoggingOut() || !auth.currentUser) return;
      }
      console.error('Error in agency invites snapshot:', error);
      callback([]);
    }
  );
}

export function subscribeToMembers(
  orgId: string,
  callback: (members: OrganizationMember[]) => void
): () => void {
  const db = getFirestoreDb();
  const q = query(
    collection(db, MEMBERS_COLLECTION),
    where('orgId', '==', orgId),
    orderBy('joinedAt', 'asc')
  );

  return onSnapshot(
    q,
    snapshot => {
      const members = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter(m => !(m as any).removedAt) as OrganizationMember[];
      callback(members);
    },
    error => {
      if (error.code === 'permission-denied') {
        const auth = getFirebaseAuth();
        if (isLoggingOut() || !auth.currentUser) return;
      }
      console.error('Error in members snapshot:', error);
      callback([]);
    }
  );
}

export function subscribeToOrganization(
  orgId: string,
  callback: (org: Organization | null) => void
): () => void {
  const db = getFirestoreDb();
  const docRef = doc(db, ORGS_COLLECTION, orgId);
  return onSnapshot(
    docRef,
    snapshot => {
      if (snapshot.exists()) {
        callback({
          id: snapshot.id,
          ...snapshot.data(),
        } as Organization);
      } else {
        callback(null);
      }
    },
    error => {
      if (error.code === 'permission-denied') {
        const auth = getFirebaseAuth();
        if (isLoggingOut() || !auth.currentUser) return;
      }
      console.error('Error in organization snapshot:', error);
      callback(null);
    }
  );
}

// ============================================
// CLIENT INVITATIONS
// ============================================

/**
 * Invite a client to the portal. Creates an invitation that links to pre-created requests.
 * When the client registers, they'll automatically get access to their requests.
 */
export async function inviteClient(
  orgId: string,
  clientEmail: string,
  invitedBy: string,
  invitedByName: string,
  requestIds: string[] = []
): Promise<Invite> {
  await waitForAuth();
  const db = getFirestoreDb();

  // Validate email
  const email = clientEmail.toLowerCase().trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Invalid email address');
  }

  // Check if user already exists with this email
  const usersQuery = query(collection(db, USERS_COLLECTION), where('email', '==', email), limit(1));
  const existingUsers = await getDocs(usersQuery);

  if (!existingUsers.empty) {
    const existingUser = existingUsers.docs[0];
    const userData = existingUser.data();

    // If user exists, check if they're already a member
    if (userData.organizations?.includes(orgId)) {
      throw new Error('This user is already a member of your organization');
    }

    // If user exists but not a member, create team invite instead
    throw new Error('This email is already registered. Please use the team invitation instead.');
  }

  // Check for existing pending client invite
  const existingInviteQuery = query(
    collection(db, INVITES_COLLECTION),
    where('email', '==', email),
    where('orgId', '==', orgId),
    where('isClientInvite', '==', true),
    where('status', '==', 'pending')
  );
  const existingInvites = await getDocs(existingInviteQuery);

  if (!existingInvites.empty) {
    throw new Error('An invitation has already been sent to this email');
  }

  // Generate unique invite code
  const inviteCode =
    Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 day expiry for client invites

  const inviteData = {
    orgId,
    email,
    role: USER_ROLE.MEMBER, // Clients get member role by default
    isClientInvite: true,
    isAgency: false,
    invitedBy,
    invitedByName,
    code: inviteCode,
    status: 'pending' as const,
    linkedRequestIds: requestIds,
    expiresAt: Timestamp.fromDate(expiresAt),
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, INVITES_COLLECTION), inviteData);

  console.log(
    `[ClientInvite] Created client invite ${docRef.id} with code ${inviteCode} for ${email}`
  );

  return {
    id: docRef.id,
    ...inviteData,
    createdAt: Timestamp.now(),
  } as Invite;
}

/**
 * Accept a client invitation and link pre-created requests to the user.
 * Called during registration/login flow.
 */
export async function acceptClientInvite(
  inviteId: string,
  userId: string,
  userEmail: string,
  userName?: string
): Promise<{ orgId: string; linkedRequestCount: number }> {
  const db = getFirestoreDb();
  const inviteRef = doc(db, INVITES_COLLECTION, inviteId);
  const inviteSnap = await getDoc(inviteRef);

  if (!inviteSnap.exists()) {
    throw new Error('Invite not found');
  }

  const invite = inviteSnap.data() as Invite;

  if (invite.status !== 'pending') {
    throw new Error('This invite has already been used');
  }

  if (invite.expiresAt.toDate() < new Date()) {
    await updateDoc(inviteRef, { status: 'expired' });
    throw new Error('This invite has expired');
  }

  if (!invite.isClientInvite) {
    throw new Error('This is not a client invitation');
  }

  if (invite.email.toLowerCase() !== userEmail.toLowerCase()) {
    throw new Error('Email mismatch: This invite was sent to another email address');
  }

  if (!invite.orgId) {
    throw new Error('Invalid invite: No organization specified');
  }

  // Add user as member of organization
  await addMember(
    invite.orgId,
    userId,
    userEmail,
    invite.role || USER_ROLE.MEMBER,
    userName,
    invite.invitedBy,
    inviteId
  );

  // Update user's organizations array
  const userRef = doc(db, USERS_COLLECTION, userId);
  await setDoc(
    userRef,
    {
      email: userEmail,
      name: userName || null,
      organizations: arrayUnion(invite.orgId),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  // Link pre-created requests to this user
  let linkedCount = 0;
  if (invite.linkedRequestIds && invite.linkedRequestIds.length > 0) {
    const REQUESTS_COLLECTION = 'portal_requests';

    for (const requestId of invite.linkedRequestIds) {
      try {
        const requestRef = doc(db, REQUESTS_COLLECTION, requestId);
        const requestSnap = await getDoc(requestRef);

        if (requestSnap.exists()) {
          const requestData = requestSnap.data();

          // Only link if the request was created for this client email
          if (requestData.clientEmail?.toLowerCase() === userEmail.toLowerCase()) {
            await updateDoc(requestRef, {
              clientUserId: userId,
              updatedAt: serverTimestamp(),
            });
            linkedCount++;
          }
        }
      } catch (error) {
        console.error(`Error linking request ${requestId}:`, error);
      }
    }
  }

  // Mark invite as accepted
  await updateDoc(inviteRef, {
    status: 'accepted',
    acceptedAt: serverTimestamp(),
  });

  console.log(
    `[ClientInvite] Accepted invite ${inviteId} for ${userEmail}, linked ${linkedCount} requests`
  );

  return {
    orgId: invite.orgId,
    linkedRequestCount: linkedCount,
  };
}

/**
 * Check for pending client invitations by email.
 * Used during registration/login to automatically process invites.
 */
export async function getPendingClientInvites(email: string): Promise<Invite[]> {
  const db = getFirestoreDb();
  const normalizedEmail = email.toLowerCase().trim();

  const q = query(
    collection(db, INVITES_COLLECTION),
    where('email', '==', normalizedEmail),
    where('isClientInvite', '==', true),
    where('status', '==', 'pending')
  );

  const snapshot = await getDocs(q);
  const invites: Invite[] = [];

  for (const doc of snapshot.docs) {
    const invite = { id: doc.id, ...doc.data() } as Invite;

    // Filter out expired invites
    if (invite.expiresAt.toDate() > new Date()) {
      invites.push(invite);
    } else {
      // Mark as expired
      await updateDoc(doc.ref, { status: 'expired' });
    }
  }

  return invites;
}
