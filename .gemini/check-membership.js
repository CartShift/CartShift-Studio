// Run this in your browser console on the page where you see the error
// Copy and paste the entire function, then call: checkMembership('R9rA7iA7gGgrS9T0cOP4')

async function checkMembership(orgId) {
  try {
    // Get Firebase from window (if your app exposes it) or use the modules
    const { getAuth } = await import('firebase/auth');
    const { getFirestore, doc, getDoc } = await import('firebase/firestore');

    const auth = getAuth();
    const db = getFirestore();

    if (!auth.currentUser) {
      console.error('❌ Not authenticated. Please sign in first.');
      return;
    }

    const userId = auth.currentUser.uid;

    console.log('🔍 Checking membership...');
    console.log(`   User ID: ${userId}`);
    console.log(`   Org ID: ${orgId}`);

    // Check user document
    try {
      const userDocRef = doc(db, 'portal_users', userId);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('✅ User document exists');
        console.log(`   Organizations array: ${JSON.stringify(userData.organizations || [])}`);
        console.log(`   Is Agency: ${userData.isAgency || false}`);
        console.log(`   Account Type: ${userData.accountType || 'CLIENT'}`);
      } else {
        console.error('❌ User document does NOT exist');
      }
    } catch (err) {
      console.error('❌ Error checking user document:', err);
    }

    // Check membership document
    try {
      const memberId = `${orgId}_${userId}`;
      const memberDocRef = doc(db, 'portal_members', memberId);
      const memberDoc = await getDoc(memberDocRef);

      if (memberDoc.exists()) {
        const memberData = memberDoc.data();
        console.log('✅ Membership document EXISTS');
        console.log(`   Document ID: ${memberId}`);
        console.log(`   Role: ${memberData.role}`);
        console.log(`   Email: ${memberData.email}`);
        console.log(`   Full data:`, memberData);
      } else {
        console.error('❌ Membership document does NOT exist');
        console.log(`   Expected document ID: ${memberId}`);
        console.log('👉 This is why you see "Access Restricted"');
        console.log('👉 You need to be added to this organization');
      }
    } catch (err) {
      console.error('❌ Error checking membership (might be permission issue):', err);
      console.log('   Error code:', err.code);
      console.log('   Error message:', err.message);
    }

    // Check if org exists
    try {
      const orgDocRef = doc(db, 'portal_organizations', orgId);
      const orgDoc = await getDoc(orgDocRef);

      if (orgDoc.exists()) {
        const orgData = orgDoc.data();
        console.log('✅ Organization exists');
        console.log(`   Name: ${orgData.name}`);
      } else {
        console.error('❌ Organization does NOT exist');
        console.log(`   Org ID: ${orgId}`);
      }
    } catch (err) {
      console.error('❌ Error checking organization:', err);
    }
  } catch (error) {
    console.error('❌ Error running diagnostic:', error);
    console.log('👉 Make sure you run this in the browser console on the portal page');
    console.log('👉 If imports fail, try accessing Firebase through window object');
  }
}

// Usage: checkMembership('R9rA7iA7gGgrS9T0cOP4')
