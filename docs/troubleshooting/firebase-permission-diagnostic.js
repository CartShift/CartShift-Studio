/**
 * Firebase Permission Diagnostic Tool
 *
 * Paste this entire script into your browser console to diagnose permission issues.
 * Run it while accessing your site (after any permission errors occur).
 */

(async function diagnoseCartShiftFirebase() {
  console.log('🔍 CartShift Firebase Diagnostic Tool\n');
  console.log('='.repeat(50));

  try {
    const { getAuth } = await import('https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js');
    const { getFirestore, doc, getDoc, collection, getDocs, query, where } = await import(
      'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js'
    );

    let auth, db;
    try {
      if (window.__firebaseInstances) {
        auth = window.__firebaseInstances.auth;
        db = window.__firebaseInstances.db;
      } else {
        auth = getAuth();
        db = getFirestore();
      }
    } catch (e) {
      console.error('❌ Could not access Firebase instances:', e.message);
      return;
    }

    console.log('\n1️⃣ AUTHENTICATION STATUS');
    console.log('-'.repeat(50));
    const user = auth.currentUser;

    if (!user) {
      console.error('❌ NOT AUTHENTICATED');
      console.log('👉 Action: Sign in to your CartShift account');
      return;
    }

    console.log('✅ Authenticated');
    console.log(`   User ID: ${user.uid}`);
    console.log(`   Email: ${user.email}`);

    console.log('\n2️⃣ USER DOCUMENT (portal_users)');
    console.log('-'.repeat(50));

    let userDoc;
    try {
      userDoc = await getDoc(doc(db, 'portal_users', user.uid));
      if (!userDoc.exists()) {
        console.error('❌ User document does not exist');
      } else {
        console.log('✅ User document exists');
        const data = userDoc.data();
        console.log(`   Email: ${data.email}`);
        console.log(`   Organizations: ${JSON.stringify(data.organizations || [])}`);
      }
    } catch (error) {
      console.error('❌ Cannot read user document:', error.message);
    }

    if (!userDoc?.exists()) return;

    const orgs = userDoc.data().organizations || [];
    console.log('\n3️⃣ ORGANIZATIONS & MEMBERSHIP');
    console.log('-'.repeat(50));

    if (orgs.length === 0) {
      console.error('❌ No organizations found');
      return;
    }

    for (const orgId of orgs) {
      console.log(`\n   Organization: ${orgId}`);
      const memberId = `${orgId}_${user.uid}`;
      try {
        const memberDoc = await getDoc(doc(db, 'portal_members', memberId));
        if (!memberDoc.exists()) {
          console.error(`   ❌ Member document missing (ID: ${memberId})`);
        } else {
          console.log(`   ✅ Member document exists (role: ${memberDoc.data().role})`);
        }
      } catch (e) {
        console.error(`   ❌ Cannot read member document:`, e.message);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ Diagnostic complete!');
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
  }
})();
