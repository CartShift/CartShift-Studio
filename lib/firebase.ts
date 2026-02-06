'use client';

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, initializeFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | undefined;
let authInstance: Auth | undefined;
let dbInstance: Firestore | undefined;
let storageInstance: FirebaseStorage | undefined;

/**
 * Validates that required Firebase configuration values are present
 */
function validateFirebaseConfig() {
  if (typeof window === 'undefined') {
    return; // Skip validation on server side
  }

  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const missingFields = requiredFields.filter(
    field => !firebaseConfig[field as keyof typeof firebaseConfig]
  );

  if (missingFields.length > 0) {
    console.error(
      'Firebase configuration is incomplete. Missing fields:',
      missingFields.join(', ')
    );
    console.error('Please ensure all NEXT_PUBLIC_FIREBASE_* environment variables are set.');
  }
}

function getFirebaseApp(): FirebaseApp {
  if (typeof window === 'undefined') {
    throw new Error('Firebase can only be initialized on the client side');
  }

  // Validate configuration before initializing
  validateFirebaseConfig();

  if (!app) {
    const existingApps = getApps();
    if (existingApps.length > 0) {
      app = existingApps[0];
    } else {
      // Ensure we have minimum required config before initializing
      if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
        throw new Error(
          'Firebase configuration is incomplete. Please check your environment variables: ' +
            'NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, NEXT_PUBLIC_FIREBASE_PROJECT_ID'
        );
      }
      app = initializeApp(firebaseConfig);
    }
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (typeof window === 'undefined') {
    throw new Error('Firebase Auth can only be used on the client side');
  }

  if (!authInstance) {
    const firebaseApp = getFirebaseApp();
    authInstance = getAuth(firebaseApp);
  }
  return authInstance;
}

export function getFirestoreDb(): Firestore {
  if (typeof window === 'undefined') {
    throw new Error('Firestore can only be used on the client side');
  }

  if (!dbInstance) {
    const firebaseApp = getFirebaseApp();

    try {
      dbInstance = initializeFirestore(firebaseApp, {
        ignoreUndefinedProperties: true,
      });
    } catch (_error) {
      dbInstance = getFirestore(firebaseApp);
    }
  }
  return dbInstance;
}

/**
 * Wraps Firestore operations to suppress expected permission errors
 * Use this for operations that might fail during auth transitions
 */
export function suppressFirestorePermissionError<T>(
  operation: () => T,
  context?: string
): T | null {
  try {
    return operation();
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    const isPermissionError =
      err?.code === 'permission-denied' ||
      err?.message?.includes('Missing or insufficient permissions') ||
      err?.message?.includes('permission');

    if (!isPermissionError) {
      // Re-throw non-permission errors immediately
      throw error;
    }

    // Check if we should suppress this error
    try {
      const auth = getFirebaseAuth();
      const currentUser = auth.currentUser;
      const isLoggingOutActive =
        (globalThis as Record<string, unknown>).__cartshift_logging_out === true;

      if (!currentUser || isLoggingOutActive) {
        // Expected during auth transitions - suppress
        if (context && typeof window !== 'undefined') {
          console.debug(`[${context}] Suppressed permission error during auth transition`);
        }
        return null;
      }

      // Authenticated user getting permission error - this is unexpected
      // Log but still allow operation to fail gracefully
      if (typeof window !== 'undefined') {
        console.warn(`[${context}] Unexpected permission error for authenticated user:`, {
          uid: currentUser?.uid,
          email: currentUser?.email,
          errorCode: err?.code,
        });
      }
      return null;
    } catch {
      // Auth not ready - suppress
      return null;
    }
  }
}

const WAIT_FOR_AUTH_TIMEOUT = 10000;

export async function waitForAuth(): Promise<void> {
  const auth = getFirebaseAuth();
  if (auth.currentUser) {
    try {
      await auth.currentUser.getIdToken();
      return;
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      unsubscribe();
      reject(new Error('waitForAuth timed out after ' + WAIT_FOR_AUTH_TIMEOUT + 'ms'));
    }, WAIT_FOR_AUTH_TIMEOUT);

    const unsubscribe = onAuthStateChanged(auth, async user => {
      clearTimeout(timeout);
      unsubscribe();
      if (user) {
        try {
          await user.getIdToken();
          resolve();
        } catch (error) {
          console.error('Error getting auth token after state change:', error);
          reject(error);
        }
      } else {
        resolve();
      }
    });
  });
}

export function getFirebaseStorage(): FirebaseStorage {
  if (typeof window === 'undefined') {
    throw new Error('Firebase Storage can only be used on the client side');
  }

  if (!storageInstance) {
    const firebaseApp = getFirebaseApp();
    storageInstance = getStorage(firebaseApp);
  }
  return storageInstance;
}
