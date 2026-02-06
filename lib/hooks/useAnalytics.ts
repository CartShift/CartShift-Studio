'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { trackEvent, trackOutboundLink } from '@/lib/analytics';

export function useScrollDepthTracking(enabled = true, thresholds = [25, 50, 75, 100]) {
  const trackedRef = useRef<Set<number>>(new Set());
  const pathname = usePathname();

  useEffect(() => {
    if (!enabled) return;
    trackedRef.current.clear();

    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;

      const scrollPercent = Math.round((window.scrollY / docHeight) * 100);

      thresholds.forEach(threshold => {
        if (scrollPercent >= threshold && !trackedRef.current.has(threshold)) {
          trackedRef.current.add(threshold);
          trackEvent('scroll_depth', { percent: threshold, page_path: pathname });
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [enabled, pathname, thresholds]);
}

export function useOutboundLinkTracking(enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest('a');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href || href.startsWith('/') || href.startsWith('#')) return;

      try {
        const url = new URL(href, window.location.origin);
        if (url.hostname !== window.location.hostname) {
          trackOutboundLink(href, link.textContent?.trim());
        }
      } catch {
        // Invalid URL, skip tracking
      }
    };

    document.addEventListener('click', handleClick, { capture: true });
    return () => document.removeEventListener('click', handleClick, { capture: true });
  }, [enabled]);
}

export function useEngagementTracking(enabled = true) {
  const startTimeRef = useRef<number>(Date.now());
  const pathname = usePathname();

  useEffect(() => {
    if (!enabled) return;
    startTimeRef.current = Date.now();

    return () => {
      const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
      if (timeSpent >= 5) {
        trackEvent('page_engagement', { page_path: pathname, time_seconds: timeSpent });
      }
    };
  }, [enabled, pathname]);
}

export function useTrackClick(eventName: string, params?: Record<string, string>) {
  return useCallback(() => {
    trackEvent(eventName, params);
  }, [eventName, params]);
}
