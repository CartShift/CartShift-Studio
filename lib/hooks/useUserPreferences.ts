import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { updateThemePreference } from '@/lib/services/portal-users';

/**
 * Hook to sync user preferences (theme and language) with Firestore
 * Automatically updates preferences in Firestore when user changes them
 * Also applies Firestore preferences when user logs in
 */
export function useUserPreferences() {
  const { user, userData } = usePortalAuth();
  const { setTheme: setNextTheme } = useTheme();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const [appliedFirestorePrefs, setAppliedFirestorePrefs] = useState(false);

  // Apply Firestore preferences when user data loads
  useEffect(() => {
    if (!user || !userData || appliedFirestorePrefs || isSyncing) {
      return;
    }

    const prefs = (userData as any).preferences;
    if (!prefs) {
      setAppliedFirestorePrefs(true);
      return;
    }

    const applyPrefs = async () => {
      setIsSyncing(true);

      try {
        // Apply theme preference from Firestore
        if (prefs.theme) {
          setNextTheme(prefs.theme);
          console.log('[useUserPreferences] Applied Firestore theme:', prefs.theme);
        }

        // Apply language preference from Firestore
        if (prefs.language && prefs.language !== locale) {
          const newPathname = pathname.replace(`/${locale}`, `/${prefs.language}`);
          router.push(newPathname);
          console.log('[useUserPreferences] Applied Firestore language:', prefs.language);
        }

        setAppliedFirestorePrefs(true);
      } catch (error) {
        console.error('[useUserPreferences] Error applying Firestore preferences:', error);
      } finally {
        setIsSyncing(false);
      }
    };

    applyPrefs();
  }, [user, userData, appliedFirestorePrefs, setNextTheme, locale, pathname, router, isSyncing]);

  // Update theme in Firestore when it changes locally
  useEffect(() => {
    if (!user || isSyncing) {
      return;
    }

    // Wait a bit to ensure the theme change is intentional
    const timeoutId = setTimeout(async () => {
      const { theme } = document.documentElement.dataset;

      if (!theme) {
        return;
      }

      try {
        await updateThemePreference(user.uid, theme as 'light' | 'dark');
        console.log('[useUserPreferences] Synced theme to Firestore:', theme);
      } catch (error) {
        console.error('[useUserPreferences] Error syncing theme to Firestore:', error);
      }
    }, 500); // Debounce to avoid too many writes

    return () => clearTimeout(timeoutId);
  }, [user, isSyncing]);

  return {
    preferences: (userData as any)?.preferences || {},
    isSyncing,
  };
}
