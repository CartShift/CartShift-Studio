'use client';

import { useUserPreferences } from '@/lib/hooks/useUserPreferences';

/**
 * Provider that syncs user theme and language preferences with Firestore
 * This should be placed inside the ThemeProvider and wraps the portal-specific components
 */
export function UserPreferencesProvider({ children }: { children: React.ReactNode }) {
  // This hook handles the sync between Firestore and local preferences
  useUserPreferences();

  return <>{children}</>;
}
