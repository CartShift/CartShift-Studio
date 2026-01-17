import { useEffect } from 'react';
import { useLocale } from 'next-intl';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { updateLanguagePreference } from '@/lib/services/portal-users';

/**
 * Hook to sync language preference to Firestore when user changes language
 * Only applies to authenticated users in the portal
 */
export function useLanguageSync() {
  const { user } = usePortalAuth();
  const locale = useLocale();

  useEffect(() => {
    if (!user) {
      return;
    }

    // Wait a bit to ensure language change is intentional
    const timeoutId = setTimeout(async () => {
      try {
        await updateLanguagePreference(user.uid, locale as 'en' | 'he');
        console.log('[useLanguageSync]  language to Firestore:', locale);
      } catch (error) {
        console.error('[useLanguageSync] Error syncing language to Firestore:', error);
      }
    }, 500); // Debounce to avoid too many writes

    return () => clearTimeout(timeoutId);
  }, [locale, user]);
}
