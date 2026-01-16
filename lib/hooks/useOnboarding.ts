import { useCallback } from 'react';
import { usePortalAuth } from './usePortalAuth';
import { updateThemePreference, updateLanguagePreference } from '@/lib/services/portal-users';
import { Logger } from '@/lib/logger';

interface UseOnboardingResult {
  handleComplete: () => Promise<void>;
  handleSkip: () => Promise<void>;
}

export function useOnboarding(
  _userId: string,
  onComplete: () => void,
  onSkip: () => void
): UseOnboardingResult {
  const { user } = usePortalAuth();

  const handleComplete = useCallback(async () => {
    if (typeof window === 'undefined') {
      Logger.warn('handleComplete called on server side, skipping');
      return;
    }

    if (!user) {
      Logger.error('No authenticated user to complete onboarding');
      return;
    }

    try {
      await updateThemePreference(user.uid, 'system');
      await updateLanguagePreference(user.uid, 'en');
      onComplete();
    } catch (error) {
      Logger.error('Failed to save onboarding status', error);
      throw error;
    }
  }, [user, onComplete]);

  const handleSkip = useCallback(async () => {
    if (typeof window === 'undefined') {
      Logger.warn('handleSkip called on server side, skipping');
      return;
    }

    if (!user) {
      Logger.error('No authenticated user to skip onboarding');
      return;
    }

    try {
      await updateThemePreference(user.uid, 'system');
      await updateLanguagePreference(user.uid, 'en');
      onSkip();
    } catch (error) {
      Logger.error('Failed to save onboarding status', error);
      throw error;
    }
  }, [user, onSkip]);

  return { handleComplete, handleSkip };
}
