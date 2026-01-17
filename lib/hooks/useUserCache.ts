import { useCallback, useEffect, useRef } from 'react';
import { safeLocalStorageGet } from '@/lib/utils/safe-parse';
import type { UserData } from './useFirestoreUser';

const CACHE_KEY = 'portal_user_data';
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CachedUserData {
  id: string;
  name?: string;
  accountType: string;
  isAgency: boolean;
  onboardingComplete?: boolean;
  _cacheTime: number;
}

interface UseUserCacheResult {
  /** Get cached user data (returns null if expired or not found) */
  getCachedUserData: () => Partial<UserData> | null;
  /** Update the cache with minimal, non-sensitive data */
  updateCache: (userData: UserData) => void;
  /** Clear the user data cache */
  clearCache: () => void;
}

/**
 * Hook for managing user data cache in localStorage.
 * Provides minimal caching to prevent UI flicker on page loads.
 */
export function useUserCache(): UseUserCacheResult {
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const getCachedUserData = useCallback((): Partial<UserData> | null => {
    if (typeof window === 'undefined') return null;

    const cached = safeLocalStorageGet<CachedUserData>(CACHE_KEY);
    if (!cached) return null;

    // Check cache expiration
    if (cached._cacheTime && Date.now() - cached._cacheTime > CACHE_MAX_AGE_MS) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return {
      id: cached.id,
      name: cached.name,
      accountType: cached.accountType as UserData['accountType'],
      isAgency: cached.isAgency,
      onboardingComplete: cached.onboardingComplete,
    };
  }, []);

  const updateCache = useCallback((userData: UserData) => {
    if (typeof window === 'undefined') return;

    const minimalCacheData: CachedUserData = {
      id: userData.id,
      name: userData.name,
      accountType: userData.accountType,
      isAgency: userData.isAgency,
      onboardingComplete: userData.onboardingComplete,
      _cacheTime: Date.now(),
    };

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(minimalCacheData));
    } catch (err) {
      console.warn('[useUserCache] Failed to update cache:', err);
    }
  }, []);

  const clearCache = useCallback(() => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(CACHE_KEY);
  }, []);

  return {
    getCachedUserData,
    updateCache,
    clearCache,
  };
}

/**
 * Get initial cached user data synchronously (for useState initialization)
 */
export function getInitialCachedUserData(): Partial<UserData> | null {
  if (typeof window === 'undefined') return null;

  const cached = safeLocalStorageGet<CachedUserData>(CACHE_KEY);
  if (!cached) return null;

  // Check cache expiration
  if (cached._cacheTime && Date.now() - cached._cacheTime > CACHE_MAX_AGE_MS) {
    return null;
  }

  return {
    id: cached.id,
    name: cached.name,
    accountType: cached.accountType as UserData['accountType'],
    isAgency: cached.isAgency,
    onboardingComplete: cached.onboardingComplete,
  };
}
