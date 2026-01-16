'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type TransitionPreset = 'default' | 'fade' | 'slide' | 'zoom' | 'flip';

export interface ViewTransitionOptions {
  duration?: number;
  easing?: string;
  preset?: TransitionPreset;
  skipTransition?: boolean;
  disableForReducedMotion?: boolean;
}

export interface UseViewTransitionResult {
  startViewTransition: (callback: () => void, options?: ViewTransitionOptions) => Promise<void>;
  isSupported: boolean;
  prefersReducedMotion: boolean;
}

const PRESET_DURATIONS: Record<TransitionPreset, number> = {
  default: 350,
  fade: 300,
  slide: 350,
  zoom: 400,
  flip: 300,
};

const PRESET_EASING: Record<TransitionPreset, string> = {
  default: 'cubic-bezier(0.4, 0, 0.2, 1)',
  fade: 'ease-out',
  slide: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  zoom: 'cubic-bezier(0.4, 0, 0.2, 1)',
  flip: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
};

export function useViewTransition(): UseViewTransitionResult {
  const isSupported = typeof document !== 'undefined' && 'startViewTransition' in document;
  const transitionPromiseRef = useRef<Promise<void> | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  useEffect(() => {
    return () => {
      transitionPromiseRef.current = null;
    };
  }, []);

  const startViewTransition = useCallback(
    async (callback: () => void, options: ViewTransitionOptions = {}) => {
      const {
        skipTransition = false,
        disableForReducedMotion = true,
        preset = 'default',
        duration: customDuration,
        easing: customEasing,
      } = options;

      // Skip if user prefers reduced motion and option is enabled
      if (prefersReducedMotion && disableForReducedMotion) {
        callback();
        return Promise.resolve();
      }

      if (skipTransition || !isSupported) {
        callback();
        return Promise.resolve();
      }

      // Get preset values or use custom values
      const finalDuration = customDuration ?? PRESET_DURATIONS[preset];
      const finalEasing = customEasing ?? PRESET_EASING[preset];

      const promise = new Promise<void>((resolve, reject) => {
        try {
          if (!document.startViewTransition) {
            callback();
            resolve();
            return;
          }

          const transition = document.startViewTransition(() => {
            // Synchronous DOM updates for best performance
            callback();
          });

          transition.finished.finally(() => {
            transitionPromiseRef.current = null;
            resolve();
          });

          if (transition.ready) {
            transition.ready
              .then(() => {
                const documentElement = document.documentElement;

                documentElement.style.setProperty(
                  '--view-transition-duration',
                  `${finalDuration}ms`
                );
                documentElement.style.setProperty('--view-transition-easing', finalEasing);
              })
              .catch(() => {
                // Gracefully handle if ready promise rejects
              });
          }
        } catch (error) {
          console.error('View transition failed:', error);
          callback();
          reject(error);
        }
      });

      transitionPromiseRef.current = promise;
      return promise;
    },
    [isSupported, prefersReducedMotion]
  );

  return {
    startViewTransition,
    isSupported,
    prefersReducedMotion,
  };
}
