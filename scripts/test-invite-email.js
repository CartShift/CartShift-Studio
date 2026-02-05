/**
 * Test script to verify invite email system
 *
 * This script helps diagnose invite email issues by:
 * 1. Checking Firebase Functions logs for invite creation
 * 2. Checking Firestore for recent invites
 * 3. Verifying the invite document has all required fields
 *
 * Usage: node scripts/test-invite-email.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin with service account
const serviceAccountPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, '../serviceAccountKey.json');

try {
  if (!admin.apps.length) {
    // Try to initialize with service account if available
    if (require('fs').existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      // Fallback to application default credentials (for local development)
      admin.initializeApp();
    }
  }
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin:', error.message);
  console.log('\n💡 To run this script, you need:');
  console.log('1. Set GOOGLE_APPLICATION_CREDENTIALS environment variable');
  console.log('2. Or place serviceAccountKey.json in the project root');
  console.log('3. Or run from a machine with gcloud authentication\n');
  process.exit(1);
}

const db = admin.firestore();

async function checkRecentInvites() {
  console.log('\n📧 Checking Recent Team Invitations...\n');

  try {
    // Get the 5 most recent invites
    const invitesSnapshot = await db
      .collection('portal_invites')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();

    if (invitesSnapshot.empty) {
      console.log('❌ No invites found in the database.');
      return;
    }

    console.log(`✅ Found ${invitesSnapshot.size} recent invite(s):\n`);

    invitesSnapshot.forEach((doc, index) => {
      const invite = doc.data();
      console.log(`--- Invite ${index + 1} ---`);
      console.log(`ID: ${doc.id}`);
      console.log(`Email: ${invite.email}`);
      console.log(`Code: ${invite.code || '❌ MISSING (This is the problem!)'}`);
      console.log(`Status: ${invite.status}`);
      console.log(`Created: ${invite.createdAt?.toDate?.() || 'Unknown'}`);
      console.log(`Invited by: ${invite.invitedByName || 'Unknown'}`);
      console.log(`Org ID: ${invite.orgId || 'Agency invite'}`);

      // Check for org name
      if (invite.orgId) {
        db.collection('portal_organizations')
          .doc(invite.orgId)
          .get()
          .then(orgDoc => {
            if (orgDoc.exists) {
              console.log(`Org Name: ${orgDoc.data().name}`);
            }
          });
      }

      console.log('');
    });

    // Check for invites without code field
    const invitesWithoutCode = invitesSnapshot.docs.filter(doc => !doc.data().code);
    if (invitesWithoutCode.length > 0) {
      console.log('\n⚠️  WARNING: Found invites without "code" field!');
      console.log('These invites WILL NOT trigger email sending.');
      console.log('Deploy the fixed code and create a NEW invite to test.\n');
    } else {
      console.log('✅ All recent invites have the "code" field.\n');
    }

    // Provide instructions
    console.log('\n📋 Next Steps:');
    console.log('1. Deploy your code changes: firebase deploy --only functions');
    console.log('2. Create a NEW team invitation from the UI');
    console.log('3. Check Firebase Functions logs: firebase functions:log');
    console.log('4. Look for these log messages:');
    console.log('   - "[Invite] Created invite <id> with code <code> for <email>"');
    console.log('   - "[Email] ✅ Sent to <email>"');
    console.log('5. Check Resend dashboard: https://resend.com/emails');
    console.log('\n');
  } catch (error) {
    console.error('❌ Error checking invites:', error.message);
  }
}

async function checkEmailFailures() {
  console.log('\n📮 Checking Email Failures...\n');

  try {
    const failuresSnapshot = await db
      .collection('email_failures')
      .orderBy('timestamp', 'desc')
      .limit(5)
      .get();

    if (failuresSnapshot.empty) {
      console.log('✅ No recent email failures found.\n');
      return;
    }

    console.log(`⚠️  Found ${failuresSnapshot.size} recent email failure(s):\n`);

    failuresSnapshot.forEach((doc, index) => {
      const failure = doc.data();
      console.log(`--- Failure ${index + 1} ---`);
      console.log(`To: ${failure.to}`);
      console.log(`Subject: ${failure.subject}`);
      console.log(`Error: ${failure.error}`);
      console.log(`Time: ${failure.timestamp?.toDate?.() || 'Unknown'}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error checking email failures:', error.message);
  }
}

async function checkResendAPIKey() {
  console.log('\n🔑 Checking RESEND_API_KEY Configuration...\n');

  console.log('To verify your Resend API key is set:');
  console.log('1. Run: firebase functions:secrets:access RESEND_API_KEY');
  console.log('2. Or check Firebase Console > Functions > Secrets');
  console.log('3. The key should start with: re_');
  console.log('\n');
}

// Run all checks
(async () => {
  console.log('═══════════════════════════════════════════');
  console.log('🔍 Team Invitation Email Diagnostic Tool');
  console.log('═══════════════════════════════════════════');

  await checkRecentInvites();
  await checkEmailFailures();
  await checkResendAPIKey();

  console.log('═══════════════════════════════════════════');
  console.log('✅ Diagnostic Complete');
  console.log('═══════════════════════════════════════════\n');

  process.exit(0);
})();
