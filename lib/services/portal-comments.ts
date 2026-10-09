import {
  collection,
  doc,
  writeBatch,
  updateDoc,
  runTransaction,
  getDocs,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  increment,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { getFirestoreDb, waitForAuth, getFirebaseAuth } from '@/lib/firebase';
import { isLoggingOut } from './auth';
import { Comment, CreateCommentData } from '@/lib/types/portal';

const COMMENTS_COLLECTION = 'portal_comments';
const MAX_COMMENT_LENGTH = 10000;

// ============================================
// HELPERS
// ============================================

/**
 * Sanitizes comment content to prevent XSS and enforce limits
 */
function sanitizeContent(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error('Comment content cannot be empty.');
  }
  if (trimmed.length > MAX_COMMENT_LENGTH) {
    throw new Error(`Comment content exceeds maximum length of ${MAX_COMMENT_LENGTH} characters.`);
  }
  // Basic HTML entity encoding for XSS prevention
  return trimmed
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// ============================================
// CREATE
// ============================================

export async function createComment(
  requestId: string,
  orgId: string,
  userId: string,
  userName: string,
  userPhotoUrl: string | undefined,
  data: CreateCommentData
): Promise<Comment> {
  await waitForAuth();
  const db = getFirestoreDb();

  // Validate and sanitize content
  const sanitizedContent = sanitizeContent(data.content);

  const commentData = {
    requestId,
    orgId,
    userId,
    userName,
    userPhotoUrl: userPhotoUrl || null,
    content: sanitizedContent,
    attachmentIds: data.attachmentIds || [],
    isInternal: data.isInternal || false,
    parentId: data.parentId || null,
    mentions: data.mentions || [],
    reactions: {},
    createdAt: serverTimestamp(),
  };

  try {
    // Atomic write: the comment and its parent counter either both persist
    // or neither does. This avoids orphan comments after a partial failure.
    const commentRef = doc(collection(db, COMMENTS_COLLECTION));
    const requestRef = doc(db, 'portal_requests', requestId);
    const batch = writeBatch(db);
    batch.set(commentRef, commentData);

    const requestUpdate: Record<string, unknown> = {
      commentCount: increment(1),
      updatedAt: serverTimestamp(),
    };
    if (!data.isInternal) {
      const preview = sanitizedContent.length > 100
        ? sanitizedContent.substring(0, 100) + '...'
        : sanitizedContent;
      requestUpdate.lastComment = {
        content: preview,
        userName,
        createdAt: Timestamp.now(),
      };
    }
    batch.update(requestRef, requestUpdate);
    await batch.commit();

    // Return with client-side timestamp (note: actual serverTimestamp is in Firestore)
    const now = Timestamp.now();
    return {
      id: commentRef.id,
      requestId,
      orgId,
      userId,
      userName,
      userPhotoUrl: userPhotoUrl || undefined,
      content: sanitizedContent,
      attachmentIds: data.attachmentIds || [],
      isInternal: data.isInternal || false,
      parentId: data.parentId || undefined,
      mentions: data.mentions || [],
      reactions: {},
      createdAt: now,
    };
  } catch (error: unknown) {
    const firestoreError = error as { code?: string; message?: string };
    if (firestoreError.code === 'permission-denied') {
      throw new Error(
        'Permission denied: You do not have permission to create comments on this request.'
      );
    }
    throw error;
  }
}

// ============================================
// READ
// ============================================

export async function getCommentsByRequest(
  requestId: string,
  includeInternal = false,
  orgId?: string
): Promise<Comment[]> {
  await waitForAuth();
  const db = getFirestoreDb();
  try {
    // Build query constraints array
    // Note: We are removing orderBy('createdAt') to avoid needing a composite index for every combination of filters.
    // We will sort in memory instead, which is performant enough for comment threads.
    const constraints: Parameters<typeof query>[1][] = [where('requestId', '==', requestId)];

    if (orgId) {
      constraints.push(where('orgId', '==', orgId));
    }

    if (!includeInternal) {
      constraints.push(where('isInternal', '==', false));
    }

    const q = query(collection(db, COMMENTS_COLLECTION), ...constraints);

    const snapshot = await getDocs(q);
    const comments = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        requestId: data.requestId,
        orgId: data.orgId,
        userId: data.userId,
        userName: data.userName,
        userPhotoUrl: data.userPhotoUrl,
        content: data.content,
        attachmentIds: data.attachmentIds ?? [],
        isInternal: data.isInternal ?? false,
        parentId: data.parentId,
        reactions: data.reactions || {},
        mentions: data.mentions || [],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      } as Comment;
    });

    // Sort in memory by createdAt (oldest first)
    return comments.sort((a, b) => {
      const timeA = a.createdAt?.seconds ?? 0;
      const timeB = b.createdAt?.seconds ?? 0;
      return timeA - timeB;
    });
  } catch (error: unknown) {
    const firestoreError = error as { code?: string; message?: string };
    if (firestoreError.code === 'permission-denied') {
      console.error('Permission denied accessing comments for request:', requestId);
      return [];
    }
    throw new Error(firestoreError.message || 'Failed to fetch comments');
  }
}

// ============================================
// UPDATE
// ============================================

export async function updateComment(commentId: string, content: string): Promise<void> {
  // Sanitize content with same validation as create
  const sanitizedContent = sanitizeContent(content);

  await waitForAuth();
  const db = getFirestoreDb();
  const docRef = doc(db, COMMENTS_COLLECTION, commentId);
  await updateDoc(docRef, {
    content: sanitizedContent,
    updatedAt: serverTimestamp(),
  });
}

// ============================================
// REACTIONS
// ============================================

export async function addReaction(commentId: string, userId: string, emoji: string): Promise<void> {
  await waitForAuth();
  const db = getFirestoreDb();
  const docRef = doc(db, COMMENTS_COLLECTION, commentId);
  const fieldPath = `reactions.${emoji}`;

  await updateDoc(docRef, {
    [fieldPath]: arrayUnion(userId),
  });
}

export async function removeReaction(
  commentId: string,
  userId: string,
  emoji: string
): Promise<void> {
  await waitForAuth();
  const db = getFirestoreDb();
  const docRef = doc(db, COMMENTS_COLLECTION, commentId);
  const fieldPath = `reactions.${emoji}`;

  await updateDoc(docRef, {
    [fieldPath]: arrayRemove(userId),
  });
}

// ============================================
// DELETE
// ============================================

export async function deleteComment(commentId: string): Promise<void> {
  await waitForAuth();
  const db = getFirestoreDb();
  const commentRef = doc(db, COMMENTS_COLLECTION, commentId);

  // Transactions retry safely on contention: the comment can only be deleted
  // and its counter decremented together, never as independent writes.
  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(commentRef);
    if (!snapshot.exists()) throw new Error('Comment not found');

    const requestId = snapshot.data()?.requestId;
    transaction.delete(commentRef);

    if (typeof requestId === 'string' && requestId) {
      transaction.update(doc(db, 'portal_requests', requestId), {
        commentCount: increment(-1),
        updatedAt: serverTimestamp(),
      });
    }
  });
}

// ============================================
// REAL-TIME SUBSCRIPTIONS
// ============================================

export function subscribeToRequestComments(
  requestId: string,
  callback: (comments: Comment[]) => void,
  includeInternal = false,
  orgId?: string
): () => void {
  let unsubscribe: (() => void) | null = null;
  let isUnsubscribed = false;
  const showInternalComments = Boolean(includeInternal);

  waitForAuth()
    .then(() => {
      if (isUnsubscribed) return;
      const db = getFirestoreDb();
      // Security rules forbid client reads of internal comments. Restrict the
      // Firestore query itself: filtering the snapshot in JS is not sufficient.
      const constraints = [where('requestId', '==', requestId)];
      if (orgId) constraints.push(where('orgId', '==', orgId));
      if (!showInternalComments) constraints.push(where('isInternal', '==', false));
      const q = query(collection(db, COMMENTS_COLLECTION), ...constraints);

      unsubscribe = onSnapshot(
        q,
        snapshot => {
          let comments = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              requestId: data.requestId,
              orgId: data.orgId,
              userId: data.userId,
              userName: data.userName,
              userPhotoUrl: data.userPhotoUrl,
              content: data.content,
              attachmentIds: data.attachmentIds || [],
              isInternal: data.isInternal || false,
              parentId: data.parentId,
              reactions: data.reactions || {},
              mentions: data.mentions || [],
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
            } as Comment;
          });

          // Filter out internal comments if the user shouldn't see them
          if (!showInternalComments) {
            comments = comments.filter(c => !c.isInternal);
          }

          // Sort in memory by createdAt (oldest first)
          comments.sort((a, b) => {
            const timeA = a.createdAt?.seconds ?? 0;
            const timeB = b.createdAt?.seconds ?? 0;
            return timeA - timeB;
          });

          callback(comments);
        },
        error => {
          const firestoreError = error as { code?: string };

          // Suppress permission errors during logout
          if (firestoreError.code === 'permission-denied') {
            const auth = getFirebaseAuth();
            if (isLoggingOut() || !auth.currentUser) return;

            console.error(
              'Permission denied accessing comments. User may not have access to this request.'
            );
          } else {
            console.error('Error in comments snapshot:', error);
          }
          callback([]);
        }
      );
    })
    .catch(error => {
      console.error('Error waiting for auth in subscribeToRequestComments:', error);
      callback([]);
    });

  return () => {
    isUnsubscribed = true;
    if (unsubscribe) {
      unsubscribe();
    }
  };
}
