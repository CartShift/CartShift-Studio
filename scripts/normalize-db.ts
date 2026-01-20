import * as admin from 'firebase-admin';
import { ACCOUNT_TYPE } from '../lib/types/portal';

const USERS_COLLECTION = 'portal_users';
const ORGS_COLLECTION = 'portal_organizations';
const MEMBERS_COLLECTION = 'portal_members';

interface NormalizationStats {
  usersFixed: number;
  orgsCreated: number;
  membersCreated: number;
  accountTypeFixed: number;
  organizationsArrayFixed: number;
  memberRecordsFixed: number;
  orgCreatedByFixed: number;
}

async function initializeAdmin() {
  if (admin.apps.length === 0) {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'cartshiftstudio';

    let credential;
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      credential = admin.credential.applicationDefault();
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      credential = admin.credential.cert(serviceAccount);
    } else {
      try {
        credential = admin.credential.applicationDefault();
      } catch (error) {
        console.error('❌ Firebase Admin initialization failed. Please set up credentials:');
        console.error('   Option 1: Set GOOGLE_APPLICATION_CREDENTIALS environment variable');
        console.error('   Option 2: Set FIREBASE_SERVICE_ACCOUNT_KEY with service account JSON');
        console.error('   Option 3: Run "gcloud auth application-default login"');
        throw error;
      }
    }

    admin.initializeApp({
      projectId,
      credential,
    });
  }
  return admin.firestore();
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function createDefaultOrganization(
  db: admin.firestore.Firestore,
  userId: string,
  userEmail: string,
  userName?: string
): Promise<string> {
  const orgName = userName ? `${userName}'s Organization` : 'My Organization';
  const slug = generateSlug(orgName);

  const orgData = {
    name: orgName,
    slug,
    createdBy: userId,
    status: 'active',
    plan: 'free',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const orgRef = await db.collection(ORGS_COLLECTION).add(orgData);
  const orgId = orgRef.id;

  const memberData = {
    orgId,
    userId,
    email: userEmail,
    name: userName || null,
    role: 'owner',
    joinedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const memberId = `${orgId}_${userId}`;
  await db.collection(MEMBERS_COLLECTION).doc(memberId).set(memberData);

  return orgId;
}

async function normalizeUsers(db: admin.firestore.Firestore): Promise<NormalizationStats> {
  const stats: NormalizationStats = {
    usersFixed: 0,
    orgsCreated: 0,
    membersCreated: 0,
    accountTypeFixed: 0,
    organizationsArrayFixed: 0,
    memberRecordsFixed: 0,
    orgCreatedByFixed: 0,
  };

  const usersSnapshot = await db.collection(USERS_COLLECTION).get();
  console.log(`\n📊 Found ${usersSnapshot.size} users to check\n`);

  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id;
    const userData = userDoc.data();
    const updates: Record<string, unknown> = {};
    let needsUpdate = false;

    console.log(`\n👤 Processing user: ${userId} (${userData.email || 'no email'})`);

    if (!userData.accountType) {
      const accountType = userData.isAgency ? ACCOUNT_TYPE.AGENCY : ACCOUNT_TYPE.CLIENT;
      updates.accountType = accountType;
      updates.isAgency = accountType === ACCOUNT_TYPE.AGENCY;
      needsUpdate = true;
      stats.accountTypeFixed++;
      console.log(`  ✓ Fixed accountType: ${accountType}`);
    } else if (userData.accountType === ACCOUNT_TYPE.AGENCY && !userData.isAgency) {
      updates.isAgency = true;
      needsUpdate = true;
      stats.accountTypeFixed++;
      console.log(`  ✓ Fixed isAgency: true`);
    } else if (userData.accountType === ACCOUNT_TYPE.CLIENT && userData.isAgency) {
      updates.isAgency = false;
      needsUpdate = true;
      stats.accountTypeFixed++;
      console.log(`  ✓ Fixed isAgency: false`);
    }

    const organizations = userData.organizations || [];

    if (organizations.length === 0) {
      console.log(`  ⚠️  User has no organizations, creating default...`);
      const orgId = await createDefaultOrganization(
        db,
        userId,
        userData.email || '',
        userData.name
      );
      updates.organizations = [orgId];
      needsUpdate = true;
      stats.orgsCreated++;
      stats.membersCreated++;
      stats.organizationsArrayFixed++;
      console.log(`  ✓ Created organization: ${orgId}`);
    } else {
      const validOrgs: string[] = [];
      for (const orgId of organizations) {
        const orgDoc = await db.collection(ORGS_COLLECTION).doc(orgId).get();
        if (orgDoc.exists) {
          validOrgs.push(orgId);

          const memberId = `${orgId}_${userId}`;
          const memberDoc = await db.collection(MEMBERS_COLLECTION).doc(memberId).get();

          if (!memberDoc.exists) {
            console.log(`  ⚠️  Missing member record for org ${orgId}, creating...`);
            const orgData = orgDoc.data();
            const memberData = {
              orgId,
              userId,
              email: userData.email || '',
              name: userData.name || null,
              role: orgData?.createdBy === userId ? 'owner' : 'member',
              joinedAt: admin.firestore.FieldValue.serverTimestamp(),
            };
            await db.collection(MEMBERS_COLLECTION).doc(memberId).set(memberData);
            stats.membersCreated++;
            stats.memberRecordsFixed++;
            console.log(`  ✓ Created member record: ${memberId}`);
          }
        } else {
          console.log(`  ⚠️  Organization ${orgId} does not exist, removing from array`);
        }
      }

      if (validOrgs.length === 0) {
        console.log(`  ⚠️  All organizations invalid, creating default...`);
        const orgId = await createDefaultOrganization(
          db,
          userId,
          userData.email || '',
          userData.name
        );
        updates.organizations = [orgId];
        needsUpdate = true;
        stats.orgsCreated++;
        stats.membersCreated++;
        stats.organizationsArrayFixed++;
        console.log(`  ✓ Created organization: ${orgId}`);
      } else if (validOrgs.length !== organizations.length) {
        updates.organizations = validOrgs;
        needsUpdate = true;
        stats.organizationsArrayFixed++;
        console.log(`  ✓ Fixed organizations array: ${validOrgs.length} valid orgs`);
      }
    }

    if (needsUpdate) {
      updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
      await db.collection(USERS_COLLECTION).doc(userId).update(updates);
      stats.usersFixed++;
      console.log(`  ✓ Updated user document`);
    } else {
      console.log(`  ✓ User is already normalized`);
    }
  }

  return stats;
}

async function normalizeOrganizations(db: admin.firestore.Firestore): Promise<NormalizationStats> {
  const stats: NormalizationStats = {
    usersFixed: 0,
    orgsCreated: 0,
    membersCreated: 0,
    accountTypeFixed: 0,
    organizationsArrayFixed: 0,
    memberRecordsFixed: 0,
    orgCreatedByFixed: 0,
  };

  const orgsSnapshot = await db.collection(ORGS_COLLECTION).get();
  console.log(`\n📊 Found ${orgsSnapshot.size} organizations to check\n`);

  for (const orgDoc of orgsSnapshot.docs) {
    const orgId = orgDoc.id;
    const orgData = orgDoc.data();
    const updates: Record<string, unknown> = {};
    let needsUpdate = false;

    console.log(`\n🏢 Processing organization: ${orgId} (${orgData.name || 'no name'})`);

    if (!orgData.createdBy) {
      const membersSnapshot = await db
        .collection(MEMBERS_COLLECTION)
        .where('orgId', '==', orgId)
        .where('role', '==', 'owner')
        .limit(1)
        .get();

      if (!membersSnapshot.empty) {
        const ownerMember = membersSnapshot.docs[0].data();
        updates.createdBy = ownerMember.userId;
        needsUpdate = true;
        stats.orgCreatedByFixed++;
        console.log(`  ✓ Fixed createdBy: ${ownerMember.userId}`);
      } else {
        console.log(`  ⚠️  No owner found for organization, cannot set createdBy`);
      }
    }

    if (!orgData.status) {
      updates.status = 'active';
      needsUpdate = true;
      stats.orgCreatedByFixed++;
      console.log(`  ✓ Added status: active`);
    }

    if (!orgData.plan) {
      updates.plan = 'free';
      needsUpdate = true;
      stats.orgCreatedByFixed++;
      console.log(`  ✓ Added plan: free`);
    }

    if (needsUpdate) {
      updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
      await db.collection(ORGS_COLLECTION).doc(orgId).update(updates);
      console.log(`  ✓ Updated organization document`);
    } else {
      console.log(`  ✓ Organization is already normalized`);
    }

    const membersSnapshot = await db
      .collection(MEMBERS_COLLECTION)
      .where('orgId', '==', orgId)
      .get();

    if (membersSnapshot.empty) {
      console.log(`  ⚠️  Organization has no members`);
      if (orgData.createdBy) {
        const userDoc = await db.collection(USERS_COLLECTION).doc(orgData.createdBy).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          const memberId = `${orgId}_${orgData.createdBy}`;
          const memberData = {
            orgId,
            userId: orgData.createdBy,
            email: userData?.email || '',
            name: userData?.name || null,
            role: 'owner',
            joinedAt: admin.firestore.FieldValue.serverTimestamp(),
          };
          await db.collection(MEMBERS_COLLECTION).doc(memberId).set(memberData);
          stats.membersCreated++;
          stats.memberRecordsFixed++;
          console.log(`  ✓ Created owner member record: ${memberId}`);
        }
      }
    }
  }

  return stats;
}

async function normalizeMembers(db: admin.firestore.Firestore): Promise<NormalizationStats> {
  const stats: NormalizationStats = {
    usersFixed: 0,
    orgsCreated: 0,
    membersCreated: 0,
    accountTypeFixed: 0,
    organizationsArrayFixed: 0,
    memberRecordsFixed: 0,
    orgCreatedByFixed: 0,
  };

  const membersSnapshot = await db.collection(MEMBERS_COLLECTION).get();
  console.log(`\n📊 Found ${membersSnapshot.size} members to check\n`);

  for (const memberDoc of membersSnapshot.docs) {
    const memberId = memberDoc.id;
    const memberData = memberDoc.data();
    let orgId: string | undefined;
    let userId: string | undefined;

    const [idOrgId, idUserId] = memberId.split('_');

    if (idOrgId && idUserId) {
      orgId = idOrgId;
      userId = idUserId;
    } else if (memberData.orgId && memberData.userId) {
      orgId = memberData.orgId;
      userId = memberData.userId;
      console.log(`\n👥 Processing member: ${memberId} (fixing ID format)`);
      const correctMemberId = `${orgId}_${userId}`;
      if (correctMemberId !== memberId) {
        const existingDoc = await db.collection(MEMBERS_COLLECTION).doc(correctMemberId).get();
        if (existingDoc.exists) {
          console.log(`  ⚠️  Correct member ID already exists, deleting duplicate: ${memberId}`);
          await db.collection(MEMBERS_COLLECTION).doc(memberId).delete();
          stats.memberRecordsFixed++;
          console.log(`  ✓ Deleted duplicate member record`);
        } else {
          console.log(`  ⚠️  Invalid member ID format, migrating to: ${correctMemberId}`);
          await db.collection(MEMBERS_COLLECTION).doc(correctMemberId).set(memberData);
          await db.collection(MEMBERS_COLLECTION).doc(memberId).delete();
          stats.memberRecordsFixed++;
          console.log(`  ✓ Migrated member record to correct ID`);
        }
        continue;
      }
    } else {
      console.log(`\n👥 Processing member: ${memberId}`);
      console.log(`  ⚠️  Invalid member ID format and missing orgId/userId, deleting`);
      await db.collection(MEMBERS_COLLECTION).doc(memberId).delete();
      stats.memberRecordsFixed++;
      continue;
    }

    console.log(`\n👥 Processing member: ${memberId}`);

    const currentOrgId = orgId as string;
    const currentUserId = userId as string;

    const orgDoc = await db.collection(ORGS_COLLECTION).doc(currentOrgId).get();
    if (!orgDoc.exists) {
      console.log(`  ⚠️  Organization ${currentOrgId} does not exist, deleting member record`);
      await db.collection(MEMBERS_COLLECTION).doc(memberId).delete();
      stats.memberRecordsFixed++;
      continue;
    }

    const userDoc = await db.collection(USERS_COLLECTION).doc(currentUserId).get();
    if (!userDoc.exists) {
      console.log(`  ⚠️  User ${currentUserId} does not exist, deleting member record`);
      await db.collection(MEMBERS_COLLECTION).doc(memberId).delete();
      stats.memberRecordsFixed++;
      continue;
    }

    const userData = userDoc.data();
    const userOrgs = userData?.organizations || [];

    if (!userOrgs.includes(currentOrgId)) {
      console.log(`  ⚠️  User's organizations array missing ${currentOrgId}, adding...`);
      await db
        .collection(USERS_COLLECTION)
        .doc(currentUserId)
        .update({
          organizations: admin.firestore.FieldValue.arrayUnion(currentOrgId),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      stats.organizationsArrayFixed++;
      stats.usersFixed++;
      console.log(`  ✓ Added org to user's organizations array`);
    }

    if (memberData.orgId !== currentOrgId || memberData.userId !== currentUserId) {
      console.log(`  ⚠️  Member data mismatch, fixing...`);
      await db.collection(MEMBERS_COLLECTION).doc(memberId).update({
        orgId: currentOrgId,
        userId: currentUserId,
      });
      stats.memberRecordsFixed++;
      console.log(`  ✓ Fixed member data`);
    }
  }

  return stats;
}

async function main() {
  console.log('🚀 Starting database normalization...\n');

  try {
    const db = await initializeAdmin();

    const userStats = await normalizeUsers(db);
    const orgStats = await normalizeOrganizations(db);
    const memberStats = await normalizeMembers(db);

    const totalStats: NormalizationStats = {
      usersFixed: userStats.usersFixed + memberStats.usersFixed,
      orgsCreated: userStats.orgsCreated,
      membersCreated: userStats.membersCreated + orgStats.membersCreated,
      accountTypeFixed: userStats.accountTypeFixed,
      organizationsArrayFixed:
        userStats.organizationsArrayFixed + memberStats.organizationsArrayFixed,
      memberRecordsFixed:
        userStats.memberRecordsFixed + orgStats.memberRecordsFixed + memberStats.memberRecordsFixed,
      orgCreatedByFixed: orgStats.orgCreatedByFixed,
    };

    console.log('\n\n✅ Normalization complete!\n');
    console.log('📈 Summary:');
    console.log(`  - Users fixed: ${totalStats.usersFixed}`);
    console.log(`  - Organizations created: ${totalStats.orgsCreated}`);
    console.log(`  - Members created: ${totalStats.membersCreated}`);
    console.log(`  - Account types fixed: ${totalStats.accountTypeFixed}`);
    console.log(`  - Organizations arrays fixed: ${totalStats.organizationsArrayFixed}`);
    console.log(`  - Member records fixed: ${totalStats.memberRecordsFixed}`);
    console.log(`  - Organization createdBy fixed: ${totalStats.orgCreatedByFixed}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during normalization:', error);
    process.exit(1);
  }
}

main();
