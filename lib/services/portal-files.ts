import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { getFirebaseStorage, getFirestoreDb, waitForAuth } from '@/lib/firebase';
import { FileAttachment } from '@/lib/types/portal';
import { v4 as uuidv4 } from 'uuid';

const FILES_COLLECTION = 'portal_files';

// ============================================
// UPLOAD
// ============================================

export async function uploadFile(
  orgId: string,
  userId: string,
  userName: string,
  file: File,
  options?: {
    requestId?: string;
    commentId?: string;
    version?: number;
    previousVersionId?: string;
  }
): Promise<FileAttachment> {
  await waitForAuth();
  const storage = getFirebaseStorage();
  const db = getFirestoreDb();
  // Generate unique filename
  const fileId = uuidv4();
  const extension = file.name.split('.').pop() || '';
  const storagePath = `portal/${orgId}/${fileId}.${extension}`;

  // Upload to Storage
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  // Save metadata to Firestore
  const fileData = {
    orgId,
    requestId: options?.requestId || null,
    commentId: options?.commentId || null,
    name: fileId,
    originalName: file.name,
    mimeType: file.type,
    size: file.size,
    url,
    storagePath,
    version: options?.version || 1,
    previousVersionId: options?.previousVersionId || null,
    uploadedBy: userId,
    uploadedByName: userName,
    uploadedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, FILES_COLLECTION), fileData);

  return {
    id: docRef.id,
    ...fileData,
    uploadedAt: Timestamp.now(),
  } as FileAttachment;
}

export async function uploadMultipleFiles(
  orgId: string,
  userId: string,
  userName: string,
  files: File[],
  options?: {
    requestId?: string;
    commentId?: string;
    version?: number;
    previousVersionId?: string;
  }
): Promise<FileAttachment[]> {
  const results = await Promise.all(
    files.map((file) => uploadFile(orgId, userId, userName, file, options))
  );
  return results;
}

// ============================================
// READ
// ============================================

export async function getFilesByOrg(orgId: string): Promise<FileAttachment[]> {
  await waitForAuth();
  const db = getFirestoreDb();
  try {
    const q = query(
      collection(db, FILES_COLLECTION),
      where('orgId', '==', orgId),
      orderBy('uploadedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as FileAttachment[];
  } catch (error: unknown) {
    const firestoreError = error as { code?: string; message?: string };
    if (firestoreError.code === 'permission-denied') {
      console.error('Permission denied accessing files for org:', orgId);
      return [];
    }
    throw error;
  }
}

export async function getFilesByRequest(requestId: string): Promise<FileAttachment[]> {
  await waitForAuth();
  const db = getFirestoreDb();
  try {
    const q = query(
      collection(db, FILES_COLLECTION),
      where('requestId', '==', requestId),
      orderBy('uploadedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as FileAttachment[];
  } catch (error: unknown) {
    const firestoreError = error as { code?: string; message?: string };
    if (firestoreError.code === 'permission-denied') {
      console.error('Permission denied accessing files for request:', requestId);
      return [];
    }
    throw error;
  }
}

// ============================================
// DELETE
// ============================================

export async function deleteFile(fileId: string, storagePath: string): Promise<void> {
  await waitForAuth();
  const storage = getFirebaseStorage();
  const db = getFirestoreDb();
  // Delete from Storage
  const storageRef = ref(storage, storagePath);
  try {
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting file from storage:', error);
  }

  // Delete from Firestore
  const docRef = doc(db, FILES_COLLECTION, fileId);
  await deleteDoc(docRef);
}

// ============================================
// HELPERS
// ============================================

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'Image';
  if (mimeType.startsWith('video/')) return 'Video';
  if (mimeType.startsWith('audio/')) return 'Music';
  if (mimeType.includes('pdf')) return 'FileText';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'Table';
  if (mimeType.includes('document') || mimeType.includes('word')) return 'FileText';
  if (mimeType.includes('zip') || mimeType.includes('archive')) return 'Archive';
  return 'File';
}

export function subscribeToRequestFiles(
  requestId: string,
  callback: (files: FileAttachment[]) => void,
  orgId?: string
): () => void {
  let unsubscribe: (() => void) | null = null;
  let isUnsubscribed = false;

  waitForAuth()
    .then(() => {
      if (isUnsubscribed) return;
      const db = getFirestoreDb();
      let q;

      if (orgId) {
        q = query(
          collection(db, FILES_COLLECTION),
          where('requestId', '==', requestId),
          where('orgId', '==', orgId),
          orderBy('uploadedAt', 'desc')
        );
      } else {
        q = query(
          collection(db, FILES_COLLECTION),
          where('requestId', '==', requestId),
          orderBy('uploadedAt', 'desc')
        );
      }

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const files = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as FileAttachment[];
          callback(files);
        },
        (error) => {
          console.error('Error in request files subscription:', error);
          callback([]);
        }
      );
    })
    .catch(error => {
      console.error('Error waiting for auth in subscribeToRequestFiles:', error);
      callback([]);
    });

  return () => {
    isUnsubscribed = true;
    if (unsubscribe) {
      unsubscribe();
    }
  };
}

export async function getFreshDownloadUrl(storagePath: string): Promise<string | null> {
  try {
    await waitForAuth();
    const storage = getFirebaseStorage();
    const storageRef = ref(storage, storagePath);
    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string };
    if (firebaseError.code === 'storage/unauthorized') {
      console.error('Storage permission denied for path:', storagePath, firebaseError.message);
    } else {
      console.error('Error getting fresh download URL:', storagePath, error);
    }
    return null;
  }
}