import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { getFirebaseStorage, getFirestoreDb, getFirebaseAuth, waitForAuth } from '@/lib/firebase';
import { v4 as uuidv4 } from 'uuid';

/**
 * Construct a public Firebase Storage URL from a storage path
 * This creates a URL without auth tokens that works with public read rules
 * Firebase requires each path segment to be encoded separately
 */
function getPublicStorageUrl(storagePath: string, bucket: string): string {
  // Encode each path segment separately, then join with /
  const pathSegments = storagePath.split('/');
  const encodedSegments = pathSegments.map(segment => encodeURIComponent(segment));
  const encodedPath = encodedSegments.join('/');
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}?alt=media`;
}

/**
 * Convert any Firebase Storage URL to a public URL
 */
/**
 * Validate and ensure storage rules are properly configured
 * This helps debug permission issues by checking rule deployment
 */
export async function validateStorageRules(): Promise<boolean> {
  try {
    const storage = getFirebaseStorage();
    const bucket = storage.app.options.storageBucket;

    if (!bucket) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Storage] Storage bucket not configured');
      }
      return false;
    }

    return true;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Storage] Rules validation failed:', error);
    }
    return false;
  }
}

export function convertToPublicUrl(url: string, bucket: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/o\/(.+?)(\?|$)/);
    if (pathMatch) {
      const storagePath = decodeURIComponent(pathMatch[1]);
      const publicUrl = getPublicStorageUrl(storagePath, bucket);
      return publicUrl;
    }
    return null;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Storage] URL conversion error:', error);
    }
    return null;
  }
}

const USERS_COLLECTION = 'portal_users';
const ORGS_COLLECTION = 'portal_organizations';

// ============================================
// USER PROFILE PICTURE UPLOAD
// ============================================

/**
 * Upload a user profile picture to Firebase Storage
 * @param userId - The user's ID
 * @param file - The image file to upload
 * @returns The download URL of the uploaded image
 */
export async function uploadUserProfilePicture(userId: string, file: File): Promise<string> {
  await waitForAuth();

  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed');
  }

  // Validate file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    throw new Error('File size must be less than 2MB');
  }

  const storage = getFirebaseStorage();
  const db = getFirestoreDb();
  const auth = getFirebaseAuth();

  // Generate unique filename
  const fileId = uuidv4();
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const storagePath = `avatars/${userId}/${fileId}.${extension}`;

  // Upload to Storage
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, file);
  const downloadUrl = await getDownloadURL(storageRef);

  // Update user document in Firestore
  const userDocRef = doc(db, USERS_COLLECTION, userId);
  await updateDoc(userDocRef, {
    photoUrl: downloadUrl,
    updatedAt: serverTimestamp(),
  });

  // Also update Firebase Auth profile
  if (auth.currentUser && auth.currentUser.uid === userId) {
    await updateProfile(auth.currentUser, {
      photoURL: downloadUrl,
    });
  }

  return downloadUrl;
}

/**
 * Delete a user's profile picture
 * @param userId - The user's ID
 * @param photoUrl - The current photo URL to delete
 */
export async function deleteUserProfilePicture(userId: string, photoUrl: string): Promise<void> {
  await waitForAuth();

  const storage = getFirebaseStorage();
  const db = getFirestoreDb();
  const auth = getFirebaseAuth();

  // Try to delete from storage (extract path from URL)
  try {
    // Extract the storage path from the download URL
    const urlObj = new URL(photoUrl);
    const pathMatch = urlObj.pathname.match(/\/o\/(.+?)(\?|$)/);
    if (pathMatch) {
      const storagePath = decodeURIComponent(pathMatch[1]);
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);
    }
  } catch (error) {
    console.warn('Failed to delete old profile picture from storage:', error);
    // Continue anyway - the important thing is to update the user record
  }

  // Update user document
  const userDocRef = doc(db, USERS_COLLECTION, userId);
  await updateDoc(userDocRef, {
    photoUrl: null,
    updatedAt: serverTimestamp(),
  });

  // Update Firebase Auth profile
  if (auth.currentUser && auth.currentUser.uid === userId) {
    await updateProfile(auth.currentUser, {
      photoURL: null,
    });
  }
}

// ============================================
// ORGANIZATION LOGO UPLOAD
// ============================================

/**
 * Upload an organization logo to Firebase Storage
 * @param orgId - The organization's ID
 * @param file - The image file to upload
 * @returns The download URL of the uploaded image
 */
export async function uploadOrganizationLogo(orgId: string, file: File): Promise<string> {
  console.log('🔥 [DEBUG] uploadOrganizationLogo started', {
    orgId,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
  });

  await waitForAuth();
  console.log('🔥 [DEBUG] Auth completed');

  // Validate file type
  if (!file.type.startsWith('image/')) {
    const error = 'Only image files are allowed';
    console.error('🔥 [DEBUG] File type validation failed:', error);
    throw new Error(error);
  }

  // Validate file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    const error = 'File size must be less than 2MB';
    console.error('🔥 [DEBUG] File size validation failed:', error);
    throw new Error(error);
  }

  const storage = getFirebaseStorage();
  const db = getFirestoreDb();
  const auth = getFirebaseAuth();

  console.log('🔥 [DEBUG] Firebase services initialized', {
    userId: auth.currentUser?.uid,
    bucket: storage.app.options.storageBucket,
  });

  // Generate unique filename
  const fileId = uuidv4();
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const storagePath = `org-logos/${orgId}/${fileId}.${extension}`;

  console.log('🔥 [DEBUG] Storage path generated:', storagePath);

  // Upload to Storage
  const storageRef = ref(storage, storagePath);
  console.log('🔥 [DEBUG] About to upload file to Storage');
  try {
    await uploadBytes(storageRef, file);
    console.log('🔥 [DEBUG] File uploaded successfully to Storage');
  } catch (uploadError) {
    console.error('🔥 [DEBUG] Storage upload failed:', uploadError);
    console.error('🔥 [DEBUG] Upload error details:', {
      code:
        uploadError instanceof Error && 'code' in uploadError
          ? (uploadError as any).code
          : undefined,
      message: uploadError instanceof Error ? uploadError.message : 'Unknown error',
      serverResponse:
        uploadError instanceof Error && 'serverResponse' in uploadError
          ? (uploadError as any).serverResponse
          : undefined,
    });
    throw uploadError;
  }

  const bucket = storage.app.options.storageBucket || '';
  if (!bucket) {
    throw new Error('Firebase storage bucket not configured');
  }

  const downloadUrl = await getDownloadURL(storageRef);

  const orgDocRef = doc(db, ORGS_COLLECTION, orgId);
  await updateDoc(orgDocRef, {
    logoUrl: downloadUrl,
    updatedAt: serverTimestamp(),
  });

  return downloadUrl;
}

/**
 * Regenerate download URL for an organization logo
 * Gets a fresh download URL from Firebase Storage
 * @param orgId - The organization's ID
 * @param logoUrl - The current logo URL
 * @param updateFirestore - Whether to update Firestore with the new URL (default: true)
 * @returns The new download URL
 */
export async function regenerateOrganizationLogoUrl(
  orgId: string,
  logoUrl: string,
  updateFirestore: boolean = true
): Promise<string | null> {
  try {
    await waitForAuth();
    const storage = getFirebaseStorage();
    const db = getFirestoreDb();

    // Extract storage path from URL
    const urlObj = new URL(logoUrl);
    const pathMatch = urlObj.pathname.match(/\/o\/(.+?)(\?|$)/);
    if (pathMatch) {
      const storagePath = decodeURIComponent(pathMatch[1]);
      const storageRef = ref(storage, storagePath);
      const downloadUrl = await getDownloadURL(storageRef);

      // Update Firestore with the new URL if requested and different
      if (updateFirestore && downloadUrl !== logoUrl) {
        try {
          const orgDocRef = doc(db, ORGS_COLLECTION, orgId);
          await updateDoc(orgDocRef, {
            logoUrl: downloadUrl,
            updatedAt: serverTimestamp(),
          });
        } catch (firestoreError) {
          console.warn('Failed to update Firestore with regenerated URL:', firestoreError);
        }
      }

      return downloadUrl;
    }
    return null;
  } catch (error) {
    console.warn('Failed to regenerate organization logo URL:', error);
    return null;
  }
}

/**
 * Delete an organization's logo
 * @param orgId - The organization's ID
 * @param logoUrl - The current logo URL to delete
 */
export async function deleteOrganizationLogo(orgId: string, logoUrl: string): Promise<void> {
  await waitForAuth();

  const storage = getFirebaseStorage();
  const db = getFirestoreDb();

  // Try to delete from storage
  try {
    const urlObj = new URL(logoUrl);
    const pathMatch = urlObj.pathname.match(/\/o\/(.+?)(\?|$)/);
    if (pathMatch) {
      const storagePath = decodeURIComponent(pathMatch[1]);
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);
    }
  } catch (error) {
    console.warn('Failed to delete old organization logo from storage:', error);
  }

  // Update organization document
  const orgDocRef = doc(db, ORGS_COLLECTION, orgId);
  await updateDoc(orgDocRef, {
    logoUrl: null,
    updatedAt: serverTimestamp(),
  });
}
