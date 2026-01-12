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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
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
    return userCredential.user;
  } catch (error: unknown) {
    // Re-throw Firebase auth errors with more context
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
    // Validate inputs
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    // Validate password strength: at least 6 characters with both letters and numbers
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Check for letters (both uppercase and lowercase)
    const hasLetters = /[a-zA-Z]/.test(password);
    // Check for numbers
    const hasNumbers = /[0-9]/.test(password);

    if (!hasLetters || !hasNumbers) {
      throw new Error('Password must contain both letters and numbers');
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
// Flag to indicate if a logout process is currently in progress
// This helps suppress spurious "permission-denied" errors from Firestore listeners
// that may trigger after the auth token is invalidated but before the listeners are detached.
// We use globalThis to ensure the state is shared across all module instances in a Next.js environment.
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
    // Give a small grace period for the flag to propagate and for UI to react
    // before the auth token is actually invalidated.
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
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
