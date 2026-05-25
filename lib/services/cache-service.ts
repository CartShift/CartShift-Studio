import 'server-only';

import { createHash } from 'node:crypto';
import { adminDb } from '@/lib/firebase-admin';
import { Logger } from '@/lib/logger';

const memoryCache = new Map<string, { value: unknown; expiry: number }>();
const CACHE_COLLECTION = 'analyzer_cache';

function hashCacheKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

export class CacheService {
  static async get<T>(key: string): Promise<T | null> {
    try {
      if (adminDb) {
        const docRef = adminDb.collection(CACHE_COLLECTION).doc(hashCacheKey(key));
        const snapshot = await docRef.get();
        if (!snapshot.exists) return null;

        const data = snapshot.data() as { value?: T; expiry?: number } | undefined;
        if (!data?.expiry || Date.now() > data.expiry) {
          await docRef.delete().catch(() => undefined);
          return null;
        }

        return data.value ?? null;
      }

      const item = memoryCache.get(key);
      if (!item) return null;
      if (Date.now() > item.expiry) {
        memoryCache.delete(key);
        return null;
      }
      return item.value as T;
    } catch (error) {
      Logger.error('Cache get error', error);
      return null;
    }
  }

  static async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    try {
      const expiry = Date.now() + ttlSeconds * 1000;

      if (adminDb) {
        await adminDb
          .collection(CACHE_COLLECTION)
          .doc(hashCacheKey(key))
          .set({ value, expiry, updatedAt: new Date() });
        return;
      }

      memoryCache.set(key, { value, expiry });
    } catch (error) {
      Logger.error('Cache set error', error);
    }
  }

  static async del(key: string): Promise<void> {
    try {
      if (adminDb) {
        await adminDb.collection(CACHE_COLLECTION).doc(hashCacheKey(key)).delete();
        return;
      }
      memoryCache.delete(key);
    } catch (error) {
      Logger.error('Cache del error', error);
    }
  }
}
