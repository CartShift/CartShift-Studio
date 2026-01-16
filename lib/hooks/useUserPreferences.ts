import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { updateThemePreference } from '@/lib/services/portal-users';
import { Logger } from '@/lib/logger';

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
  const [is, setIs] = useState(false);
  const [appliedFirestorePrefs, setFirestorePrefs] = useState(false);

  // Apply Firestore preferences when user data loads
  useEffect(() => {
    if (!user || !userData || appliedFirestorePrefs || is) {
      return;
    }

    const prefs = (userData as any).preferences;
    if (!prefs) {
      setFirestorePrefs(true);
      return;
    }

    const applyPrefs = async () => {
      setIs(true);

      try {
        // Apply theme preference from Firestore
        if (prefs.theme) {
          setNextTheme(prefs.theme);
        }

        // Apply language preference from Firestore
        if (prefs.language && prefs.language !== locale) {
          const newPathname = pathname.replace(`/${locale}`, `/${prefs.language}`);
          router.push(newPathname);
        }

        setFirestorePrefs(true);
      } catch (error) {
        Logger.error('Error applying Firestore preferences', error);
      } finally {
        setIs(false);
      }
    };

    applyPrefs();
  }, [user, userData, appliedFirestorePrefs, setNextTheme, locale, pathname, router, is]);

  // Update theme in Firestore when it changes locally
  useEffect(() => {
    if (!user || is) {
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
      } catch (error) {
        Logger.error('Error syncing theme to Firestore', error);
      }
    }, 500); // Debounce to avoid too many writes

    return () => clearTimeout(timeoutId);
  }, [user, is]);

  return {
    preferences: (userData as any)?.preferences || {},
    is,
  };
}
