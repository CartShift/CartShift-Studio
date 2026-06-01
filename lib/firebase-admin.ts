import 'server-only';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  const explicitFirebaseCredentials =
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
      ? {
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }
      : null;

  try {
    admin.initializeApp({
      credential: explicitFirebaseCredentials
        ? admin.credential.cert(explicitFirebaseCredentials)
        : admin.credential.applicationDefault(),
      // Prefer Firebase-specific env vars so unrelated Google integrations cannot break Admin SDK startup.
    });
  } catch (_error) {
    if (!process.env.FIREBASE_PRIVATE_KEY && process.env.NODE_ENV === 'development') {
      // Allow deviation in dev if no creds
      console.warn('Firebase Admin not initialized: Missing credentials');
    } else {
      // Try initializing with env vars if service account not implicit
      try {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          }),
        });
      } catch (innerError) {
        console.error('Firebase admin init failed', innerError);
      }
    }
  }
}

export const adminDb = admin.apps.length ? admin.firestore() : null;
export const adminAuth = admin.apps.length ? admin.auth() : null;
