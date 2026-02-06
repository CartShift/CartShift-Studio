import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { getFirebaseAuth, getFirestoreDb } from '@/lib/firebase';
import { ACCOUNT_TYPE } from '@/lib/types/portal';
import { validatePassword, isValidEmail } from '@/lib/utils/validation';
import { getPendingClientInvites, acceptClientInvite } from '@/lib/services/portal-organizations';

// Google Auth Provider instance
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

/**
 * Get the Firebase Auth instance from the centralized Firebase configuration
 * This ensures we use a single, properly configured Firebase app instance
 */
export function getAuthInstance() {
  return getFirebaseAuth();
}

export async function loginWithEmail(email: string, password: string): Promise<User> {
  try {
    // Validate inputs
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Validate email format using shared utility
    if (!isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    const authInstance = getAuthInstance();

    // Check if Firebase is properly configured
    if (!authInstance) {
      throw new Error(
        'Firebase Auth is not properly initialized. Please check your environment variables.'
      );
    }

    const userCredential = await signInWithEmailAndPassword(authInstance, email, password);
    const user = userCredential.user;

    // Check for pending client invites and auto-accept them
    try {
      const pendingInvites = await getPendingClientInvites(email);
      for (const invite of pendingInvites) {
        await acceptClientInvite(invite.id, user.uid, email, user.displayName || undefined);
        console.log(`[Login] Auto-accepted client invite ${invite.id} for ${email}`);
      }
    } catch (error) {
      console.warn('[Login] Error processing client invites:', error);
    }

    syncSessionCookie(user);
    return user;
  } catch (error: unknown) {
    const authError = error as { code?: string; message?: string };
    if (authError.code) {
      // Firebase Auth error codes
      const errorMessage = authError.message || 'Authentication failed';
      const enhancedError = new Error(errorMessage) as Error & { code: string };
      enhancedError.code = authError.code;
      throw enhancedError;
    }
    throw error;
  }
}

/**
 * Sign in with Google using Firebase popup authentication
 * Creates a portal user document if it doesn't exist (for new Google sign-ins)
 */
export async function signInWithGoogle(): Promise<User> {
  try {
    const authInstance = getAuthInstance();

    if (!authInstance) {
      throw new Error(
        'Firebase Auth is not properly initialized. Please check your environment variables.'
      );
    }

    const userCredential = await signInWithPopup(authInstance, googleProvider);
    const user = userCredential.user;

    // Ensure auth token is ready before accessing Firestore
    await user.getIdToken(true);

    // Check if portal user document exists, if not create one
    const db = getFirestoreDb();
    const userDocRef = doc(db, 'portal_users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      // Create a new portal user document for first-time Google sign-ins
      await setDoc(userDocRef, {
        email: user.email,
        name: user.displayName || null,
        photoUrl: user.photoURL || null,
        accountType: ACCOUNT_TYPE.CLIENT,
        isAgency: false,
        organizations: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // Check for pending client invites and auto-accept them
    if (user.email) {
      try {
        const pendingInvites = await getPendingClientInvites(user.email);
        for (const invite of pendingInvites) {
          await acceptClientInvite(invite.id, user.uid, user.email, user.displayName || undefined);
          console.log(`[GoogleSignIn] Auto-accepted client invite ${invite.id} for ${user.email}`);
        }
      } catch (error) {
        console.warn('[GoogleSignIn] Error processing client invites:', error);
      }
    }

    syncSessionCookie(user);
    return user;
  } catch (error: unknown) {
    const authError = error as { code?: string; message?: string };
    if (authError.code) {
      const errorMessage = authError.message || 'Google sign-in failed';
      const enhancedError = new Error(errorMessage) as Error & { code: string };
      enhancedError.code = authError.code;
      throw enhancedError;
    }
    throw error;
  }
}

export async function signUpWithEmail(
  email: string,
  password: string,
  name?: string
): Promise<User> {
  try {
    // Validate inputs using shared validation utilities
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Validate email format
    if (!isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.error || 'Password validation failed');
    }

    const authInstance = getAuthInstance();

    // Check if Firebase is properly configured
    if (!authInstance) {
      throw new Error(
        'Firebase Auth is not properly initialized. Please check your environment variables.'
      );
    }

    const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);

    // Update user profile with display name if provided
    if (name && userCredential.user) {
      await updateProfile(userCredential.user, {
        displayName: name,
      });
    }

    // Ensure auth token is ready before accessing Firestore
    const user = userCredential.user;
    await user.getIdToken(true);

    // Create portal user document
    const db = getFirestoreDb();
    await setDoc(doc(db, 'portal_users', user.uid), {
      email: user.email,
      name: name || user.displayName || null,
      photoUrl: user.photoURL || null,
      accountType: ACCOUNT_TYPE.CLIENT,
      isAgency: false,
      organizations: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Check for pending client invites and auto-accept them
    try {
      const pendingInvites = await getPendingClientInvites(email);
      for (const invite of pendingInvites) {
        await acceptClientInvite(invite.id, user.uid, email, name);
        console.log(`[SignUp] Auto-accepted client invite ${invite.id} for ${email}`);
      }
    } catch (error) {
      console.warn('[SignUp] Error processing client invites:', error);
    }

    syncSessionCookie(user);
    return user;
  } catch (error: unknown) {
    // Re-throw Firebase auth errors with more context
    const authError = error as { code?: string; message?: string };
    if (authError.code) {
      const errorMessage = authError.message || 'Registration failed';
      const enhancedError = new Error(errorMessage) as Error & { code: string };
      enhancedError.code = authError.code;
      throw enhancedError;
    }
    throw error;
  }
}

// Flag to indicate if a logout process is currently in progress
// This helps suppress spurious "permission-denied" errors from Firestore listeners
// that may trigger after the auth token is invalidated but before the listeners are detached.
// We use globalThis to ensure the state is shared across all module instances in a Next.js environment.
export async function syncSessionCookie(user: User | null): Promise<void> {
  try {
    if (user) {
      const idToken = await user.getIdToken();
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
    } else {
      await fetch('/api/auth/session', { method: 'DELETE' });
    }
  } catch {
    // Session cookie sync is best-effort; client-side auth remains the authority
  }
}

const LOGGING_OUT_KEY = '__cartshift_logging_out';

export function isLoggingOut(): boolean {
  if (typeof window === 'undefined') return false;
  return (globalThis as any)[LOGGING_OUT_KEY] === true;
}

export function setLoggingOut(value: boolean): void {
  if (typeof window !== 'undefined') {
    (globalThis as any)[LOGGING_OUT_KEY] = value;
  }
}

export async function logout(): Promise<void> {
  try {
    const authInstance = getAuthInstance();
    if (!authInstance) {
      throw new Error('Firebase Auth is not properly initialized');
    }

    setLoggingOut(true);
    await syncSessionCookie(null);
    await new Promise(resolve => setTimeout(resolve, 50));
    await signOut(authInstance);
    // Note: We don't set loggingOut back to false here because the page
    // usually redirects/reloads, and we want to keep suppressing errors
    // until the app state is completely reset.
  } catch (error: unknown) {
    setLoggingOut(false);
    console.error('Logout error:', error);
    throw error;
  }
}

export async function resetPassword(email: string): Promise<void> {
  try {
    if (!email) {
      throw new Error('Email is required');
    }

    // Validate email format using shared utility
    if (!isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    const authInstance = getAuthInstance();
    if (!authInstance) {
      throw new Error('Firebase Auth is not properly initialized');
    }
    await sendPasswordResetEmail(authInstance, email);
  } catch (error: unknown) {
    const authError = error as { code?: string; message?: string };
    if (authError.code) {
      const errorMessage = authError.message || 'Password reset failed';
      const enhancedError = new Error(errorMessage) as Error & { code: string };
      enhancedError.code = authError.code;
      throw enhancedError;
    }
    throw error;
  }
}

export function getCurrentUser(): User | null {
  try {
    const authInstance = getAuthInstance();
    return authInstance?.currentUser || null;
  } catch {
    return null;
  }
}
