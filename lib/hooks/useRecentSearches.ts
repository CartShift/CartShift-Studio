import { useState, useEffect, useCallback } from 'react';
import { Logger } from '@/lib/logger';
import { safeParse } from '@/lib/utils/safe-parse';

const STORAGE_KEY = 'recent_searches';
const MAX_RECENT_SEARCHES = 10;

export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = safeParse<string[]>(stored);
        if (parsed && Array.isArray(parsed)) {
          setRecentSearches(parsed);
        }
      }
    } catch (error) {
      Logger.warn('Failed to load recent searches from localStorage', { error });
    }
  }, []);

  const addSearch = useCallback((query: string) => {
    if (!query.trim()) return;

    setRecentSearches(prev => {
      const filtered = prev.filter(s => s.toLowerCase() !== query.toLowerCase());
      const updated = [query, ...filtered].slice(0, MAX_RECENT_SEARCHES);

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (error) {
          Logger.warn('Failed to save recent searches to localStorage', { error });
        }
      }

      return updated;
    });
  }, []);

  const clearSearches = useCallback(() => {
    setRecentSearches([]);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        Logger.warn('Failed to clear recent searches from localStorage', { error });
      }
    }
  }, []);

  const removeFromHistory = useCallback((query: string) => {
    setRecentSearches(prev => {
      const updated = prev.filter(s => s !== query);

      if (typeof window !== 'undefined') {
        try {
          if (updated.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          } else {
            localStorage.removeItem(STORAGE_KEY);
          }
        } catch (error) {
          Logger.warn('Failed to update recent searches in localStorage', { error });
        }
      }

      return updated;
    });
  }, []);

  return { recentSearches, addSearch, clearSearches, removeFromHistory };
}
