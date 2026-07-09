/**
 * Firebase Permission Diagnostics Utility
 *
 * Use this in the browser console to diagnose permission issues:
 *
 * import { diagnoseFirebasePermissions } from '@/lib/utils/firebase-diagnostics';
 * diagnoseFirebasePermissions();
 */

import { getFirebaseAuth, getFirestoreDb } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function diagnoseFirebasePermissions(): Promise<void> {
  console.group('🔍 Firebase Permission Diagnostics');

  try {
    // 1. Check Authentication
    console.log('\n1️⃣  Authentication...');
    const auth = getFirebaseAuth();
    const user = auth.currentUser;

    if (!user) {
      console.error('❌ No authenticated user found');
      console.log('💡 Solution: Sign in to your account');
      console.groupEnd();
      return;
    }

    console.log('✅ User authenticated:', {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
    });

    // 2. Check Auth Token
    console.log('\n2️⃣  Auth Token...');
    try {
      const token = await user.getIdToken();
      console.log('✅ Auth token retrieved successfully');
      console.log('Token preview:', token.substring(0, 20) + '...');
    } catch (error: unknown) {
      console.error('❌ Failed to get auth token:', (error instanceof Error ? error.message : String(error)));
      console.log('💡 Solution: Sign out and sign back in');
      console.groupEnd();
      return;
    }

    // 3. Check User Document
    console.log('\n3️⃣  portal_users Document...');
    const db = getFirestoreDb();
    const userDocRef = doc(db, 'portal_users', user.uid);

    try {
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        console.log('✅ User document exists:', {
          email: data.email,
          name: data.name,
          accountType: data.accountType || (data.isAgency ? 'AGENCY' : 'CLIENT'),
          organizations: data.organizations || [],
        });

        // 4. Check Organization Membership
        const orgs = data.organizations || [];
        if (orgs.length === 0) {
          console.warn('⚠️ User has no organizations');
          console.log('💡 Solution: Create an organization or accept an invite');
        } else {
          console.log('\n4️⃣  Organization Membership...');
          for (const orgId of orgs) {
            const memberId = `${orgId}_${user.uid}`;
            const memberDocRef = doc(db, 'portal_members', memberId);

            try {
              const memberDoc = await getDoc(memberDocRef);
              if (memberDoc.exists()) {
                const memberData = memberDoc.data();
                console.log(`✅ Member document exists for org ${orgId}:`, {
                  role: memberData.role,
                  email: memberData.email,
                });
              } else {
                console.error(`❌ Member document missing for org ${orgId}`);
                console.log(`   Expected document ID: ${memberId}`);
                console.log('💡 Solution: Create member document or re-accept invite');
              }
            } catch (error: unknown) {
              if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'permission-denied') {
                console.error(`❌ Permission denied accessing member doc for org ${orgId}`);
                console.log('💡 Solution: Check Firestore rules and ensure user has access');
              } else {
                console.error(`❌ Error checking member doc:`, (error instanceof Error ? error.message : String(error)));
              }
            }

            // Check organization document
            try {
              const orgDocRef = doc(db, 'portal_organizations', orgId);
              const orgDoc = await getDoc(orgDocRef);
              if (orgDoc.exists()) {
                const orgData = orgDoc.data();
                console.log(`✅ Organization document exists:`, {
                  name: orgData.name,
                  createdBy: orgData.createdBy,
                });
              } else {
                console.error(`❌ Organization document missing: ${orgId}`);
              }
            } catch (error: unknown) {
              if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'permission-denied') {
                console.error(`❌ Permission denied accessing org ${orgId}`);
              } else {
                console.error(`❌ Error checking org doc:`, (error instanceof Error ? error.message : String(error)));
              }
            }
          }
        }
      } else {
        console.error('❌ User document does not exist in Firestore');
        console.log('💡 Solution: Complete signup or contact support');
      }
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'permission-denied') {
        console.error('❌ Permission denied accessing user document');
        console.log(
          '💡 Solution: Check Firestore rules - user should be able to read their own document'
        );
      } else {
        console.error('❌ Error accessing user document:', (error instanceof Error ? error.message : String(error)));
      }
    }

    // 5. Summary
    console.log('\n📋 Summary:');
    console.log('- Authentication:', user ? '✅' : '❌');
    console.log('- Auth Token:', user ? '✅' : '❌');
    console.log('- User Document:', 'Check above');
    console.log('- Organization Access:', 'Check above');
  } catch (error: unknown) {
    console.error('❌ Diagnostic error:', error);
    if ((error instanceof Error ? error.message : String(error))?.includes('client side')) {
      console.log('💡 This diagnostic must be run in the browser console');
    }
  }

  console.groupEnd();
}

/**
 * Quick permission check for a specific collection/document
 */
export async function checkFirestoreAccess(
  collection: string,
  documentId: string
): Promise<boolean> {
  try {
    const db = getFirestoreDb();
    const docRef = doc(db, collection, documentId);
    await getDoc(docRef);
    return true;
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'permission-denied') {
      console.error(`❌ Permission denied: ${collection}/${documentId}`);
      return false;
    }
    throw error;
  }
}
