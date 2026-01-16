import { useState, useEffect } from 'react';
import { Logger } from '@/lib/logger';

const STORAGE_KEY = 'recent_searches';
const MAX_RECENT_SEARCHES = 5;

export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (error) {
      Logger.warn('Failed to load recent searches from localStorage', { error });
    }
  }, []);

  const addSearch = (query: string) => {
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
  };

  const clearSearches = () => {
    setRecentSearches([]);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        Logger.warn('Failed to clear recent searches from localStorage', { error });
      }
    }
  };

  return { recentSearches, addSearch, clearSearches };
}
