import { Logger } from '@/lib/logger';

// In-memory fallback for development/environment without Redis
const memoryCache = new Map<string, { value: any; expiry: number }>();

export class CacheService {
  private static isRedisAvailable = false; // Set to true if you add Redis client later

  static async get<T>(key: string): Promise<T | null> {
    try {
      if (this.isRedisAvailable) {
        // Implement Redis get here
        return null;
      } else {
        const item = memoryCache.get(key);
        if (!item) return null;
        if (Date.now() > item.expiry) {
          memoryCache.delete(key);
          return null;
        }
        return item.value as T;
      }
    } catch (error) {
      Logger.error('Cache get error', error);
      return null;
    }
  }

  static async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    try {
      if (this.isRedisAvailable) {
        // Implement Redis set here
      } else {
        memoryCache.set(key, {
          value,
          expiry: Date.now() + ttlSeconds * 1000,
        });
      }
    } catch (error) {
      Logger.error('Cache set error', error);
    }
  }

  static async del(key: string): Promise<void> {
    try {
      if (this.isRedisAvailable) {
        // Implement Redis del here
      } else {
        memoryCache.delete(key);
      }
    } catch (error) {
      Logger.error('Cache del error', error);
    }
  }
}
