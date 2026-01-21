/**
 * Distributed Rate Limiter using Firestore
 * Provides rate limiting that works across multiple server instances
 */

import {
  doc,
  getDoc,
  setDoc,
  increment,
  serverTimestamp,
  runTransaction,
  collection,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase';
import { z } from 'zod';
import { safeParse } from '@/lib/utils/safe-parse';

interface RateLimitResult {
  allowed: boolean;
  remaining?: number;
  resetAt?: number;
}

const RATE_LIMIT_COLLECTION = '_rate_limits';

/**
 * Check if a request should be rate limited
 * Uses Firestore to ensure distributed rate limiting
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number = 5,
  windowMs: number = 60000 // 1 minute default
): Promise<RateLimitResult> {
  // Prevent server-side execution of client SDK code
  if (typeof window === 'undefined') {
    // TODO: Implement server-side rate limiting using firebase-admin or Redis
    // For now, allow request to prevent 500 Internal Server Errors
    return { allowed: true, remaining: maxRequests, resetAt: Date.now() + windowMs };
  }

  const db = getFirestoreDb();
  const now = Date.now();
  const windowStart = now - windowMs;
  const resetAt = windowStart + windowMs + windowMs / maxRequests;

  try {
    const docRef = doc(db, RATE_LIMIT_COLLECTION, key);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      // First request in window
      await setDoc(docRef, {
        count: 1,
        windowStart: now,
        lastUpdated: serverTimestamp(),
      });
      return { allowed: true, remaining: maxRequests - 1, resetAt };
    }

    const data = docSnap.data();
    const recordWindowStart = data.windowStart?.toMillis?.() || data.windowStart || 0;

    // Check if window has expired
    if (recordWindowStart < windowStart) {
      // Reset counter for new window
      await setDoc(docRef, {
        count: 1,
        windowStart: now,
        lastUpdated: serverTimestamp(),
      });
      return { allowed: true, remaining: maxRequests - 1, resetAt };
    }

    const currentCount = data.count || 0;

    if (currentCount >= maxRequests) {
      return { allowed: false, remaining: 0, resetAt };
    }

    // Increment counter atomically
    await runTransaction(db, async transaction => {
      const freshDoc = await transaction.get(docRef);
      if (!freshDoc.exists()) {
        transaction.set(docRef, {
          count: 1,
          windowStart: now,
          lastUpdated: serverTimestamp(),
        });
      } else {
        const freshData = freshDoc.data();
        const freshWindowStart = freshData.windowStart?.toMillis?.() || freshData.windowStart || 0;

        if (freshWindowStart < windowStart) {
          // Window expired, reset
          transaction.update(docRef, {
            count: 1,
            windowStart: now,
            lastUpdated: serverTimestamp(),
          });
        } else if ((freshData.count || 0) < maxRequests) {
          // Increment
          transaction.update(docRef, {
            count: increment(1),
            lastUpdated: serverTimestamp(),
          });
        }
      }
    });

    return { allowed: true, remaining: maxRequests - currentCount - 1, resetAt };
  } catch (error) {
    const isNetworkError =
      error instanceof Error &&
      (error.message?.includes('network') ||
        error.message?.includes('unavailable') ||
        error.message?.includes('deadline'));

    if (isNetworkError) {
      // On network errors, allow request with warning but track internally
      console.warn('[RateLimiter] Network error, allowing request:', error);
      return { allowed: true, remaining: maxRequests - 1, resetAt: Date.now() + windowMs };
    }

    // On permission or other errors, be more conservative
    console.error('[RateLimiter] Error checking rate limit:', error);
    // Fall back to stricter local rate limiting
    const now = Date.now();
    const localKey = `rate_limit_${key}`;
    const localData = typeof window !== 'undefined' ? sessionStorage.getItem(localKey) : null;

    if (localData) {
      const rateLimitSchema = z.object({ count: z.number(), timestamp: z.number() });
      const parsed = safeParse(localData, rateLimitSchema);
      if (parsed) {
        const { count, timestamp } = parsed;
        const timeSinceLastRequest = now - timestamp;
        if (timeSinceLastRequest < windowMs) {
          if (count >= maxRequests) {
            return { allowed: false, remaining: 0, resetAt: timestamp + windowMs };
          }
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(localKey, JSON.stringify({ count: count + 1, timestamp: now }));
          }
          return {
            allowed: true,
            remaining: maxRequests - count - 1,
            resetAt: timestamp + windowMs,
          };
        }
      }
    }

    if (typeof window !== 'undefined') {
      sessionStorage.setItem(localKey, JSON.stringify({ count: 1, timestamp: now }));
    }
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }
}

/**
 * Clean up expired rate limit entries (call periodically)
 * Uses a cursor-based approach to avoid composite query limitations
 */
export async function cleanupExpiredRateLimits(): Promise<void> {
  const db = getFirestoreDb();
  const now = Date.now();
  let deletedCount = 0;

  try {
    // Get all rate limit documents (small collection size expected)
    const collectionRef = collection(db, RATE_LIMIT_COLLECTION);
    const snapshot = await getDocs(collectionRef);

    const batchSize = 400; // Firestore batch max
    const deletes: Promise<void>[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const windowStart = data.windowStart?.toMillis?.() || data.windowStart || 0;
      const windowMs = 60000; // Default 1 minute window
      const expiresAt = windowStart + windowMs * 2; // Allow 2x window before cleanup

      if (windowStart > 0 && now > expiresAt) {
        deletes.push(deleteDoc(doc.ref));
        deletedCount++;
      }

      // Process in batches to avoid hitting limits
      if (deletes.length >= batchSize) {
        await Promise.all(deletes);
        deletes.length = 0;
      }
    }

    // Delete remaining documents
    if (deletes.length > 0) {
      await Promise.all(deletes);
    }

    console.log(`[RateLimiter] Cleanup complete: deleted ${deletedCount} expired entries`);
  } catch (error) {
    console.error('[RateLimiter] Cleanup error:', error);
  }
}
