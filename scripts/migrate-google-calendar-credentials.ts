/**
 * One-time OAuth credential migration. DRY RUN by default.
 *
 * Run with server Firebase credentials available:
 *   pnpm exec tsx scripts/migrate-google-calendar-credentials.ts
 *   pnpm exec tsx scripts/migrate-google-calendar-credentials.ts --apply
 *
 * This script never logs credentials, identities, or document contents.
 * Deploy the new Vercel backend before running --apply.
 */
import * as admin from 'firebase-admin';

async function main() {
  const apply = process.argv.includes('--apply');
  if (!admin.apps.length) {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    admin.initializeApp({
      credential: projectId && clientEmail && privateKey
        ? admin.credential.cert({ projectId, clientEmail, privateKey })
        : admin.credential.applicationDefault(),
    });
  }
  const db = admin.firestore();
  let cursor: FirebaseFirestore.QueryDocumentSnapshot | undefined;
  const tally = { inspected: 0, withLegacyTokens: 0, migrated: 0, skippedIncomplete: 0 };
  do {
    let query: FirebaseFirestore.Query = db.collection('agency_integrations')
      .orderBy(admin.firestore.FieldPath.documentId()).limit(100);
    if (cursor) query = query.startAfter(cursor);
    const page = await query.get();
    if (page.empty) break;
    for (const doc of page.docs) {
      tally.inspected++;
      const data = doc.data();
      if (data.provider !== 'google_calendar' && !doc.id.endsWith('_google_calendar')) continue;
      if (!data.accessToken && !data.refreshToken) continue;
      tally.withLegacyTokens++;
      if (!data.accessToken || !data.refreshToken || !data.userId) {
        tally.skippedIncomplete++;
        continue;
      }
      if (!apply) continue;
      const secretRef = db.collection('private_integration_credentials').doc(doc.id);
      await db.runTransaction(async tx => {
        const [legacy, existing] = await Promise.all([tx.get(doc.ref), tx.get(secretRef)]);
        const latest = legacy.data();
        if (!latest?.accessToken && !latest?.refreshToken) return;
        if (!existing.exists) {
          if (!latest?.accessToken || !latest?.refreshToken) return;
          tx.set(secretRef, {
            userId: latest.userId,
            provider: 'google_calendar',
            accessToken: latest.accessToken,
            refreshToken: latest.refreshToken,
            tokenExpiry: latest.tokenExpiry || admin.firestore.Timestamp.fromMillis(0),
            migratedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
        tx.update(doc.ref, {
          accessToken: admin.firestore.FieldValue.delete(),
          refreshToken: admin.firestore.FieldValue.delete(),
        });
        tally.migrated++;
      });
    }
    cursor = page.docs[page.docs.length - 1];
  } while (cursor);
  console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', ...tally }));
  if (tally.skippedIncomplete) {
    throw new Error('Incomplete legacy credential documents remain; investigate without logging secrets.');
  }
}

main().catch(error => {
  console.error('Google credential migration failed:', error.message);
  process.exitCode = 1;
});
