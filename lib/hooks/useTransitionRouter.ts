'use client';

import { useRouter } from '@/i18n/navigation';
import { useViewTransition, type ViewTransitionOptions } from './useViewTransition';

export function useTransitionRouter() {
  const router = useRouter();
  const { startViewTransition, isSupported } = useViewTransition();

  return {
    push: async (href: string, options?: ViewTransitionOptions) => {
      if (isSupported) {
        await startViewTransition(() => {
          router.push(href);
        }, options);
      } else {
        router.push(href);
      }
    },

    replace: async (href: string, options?: ViewTransitionOptions) => {
      if (isSupported) {
        await startViewTransition(() => {
          router.replace(href);
        }, options);
      } else {
        router.replace(href);
      }
    },

    prefetch: (href: string) => {
      router.prefetch(href);
    },

    back: async (options?: ViewTransitionOptions) => {
      if (isSupported) {
        await startViewTransition(() => {
          router.back();
        }, options);
      } else {
        router.back();
      }
    },

    refresh: async (options?: ViewTransitionOptions) => {
      if (isSupported) {
        await startViewTransition(() => {
          router.refresh();
        }, options);
      } else {
        router.refresh();
      }
    },
  };
}
