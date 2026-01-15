'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { BarChart3, X } from 'lucide-react';

interface Notification {
  id: number;
  city: string;
  country: string;
  timeAgo: string;
}

const cities = [
  { city: 'London', country: 'UK' },
  { city: 'New York', country: 'USA' },
  { city: 'Tel Aviv', country: 'Israel' },
  { city: 'Berlin', country: 'Germany' },
  { city: 'Los Angeles', country: 'USA' },
  { city: 'Toronto', country: 'Canada' },
  { city: 'Sydney', country: 'Australia' },
  { city: 'Paris', country: 'France' },
  { city: 'Amsterdam', country: 'Netherlands' },
  { city: 'Dubai', country: 'UAE' },
  { city: 'Singapore', country: 'Singapore' },
  { city: 'Miami', country: 'USA' },
];

const timeAgoOptions = [
  '2 minutes ago',
  '5 minutes ago',
  '8 minutes ago',
  '12 minutes ago',
  '15 minutes ago',
  '20 minutes ago',
  'just now',
];

export const SocialProofToast: React.FC = () => {
  const [notification, setNotification] = useState<Notification | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [showCount, setShowCount] = useState(0);

  const generateNotification = useCallback(() => {
    const randomCity = cities[Math.floor(Math.random() * cities.length)];
    const randomTime = timeAgoOptions[Math.floor(Math.random() * timeAgoOptions.length)];

    return {
      id: Date.now(),
      city: randomCity.city,
      country: randomCity.country,
      timeAgo: randomTime,
    };
  }, []);

  useEffect(() => {
    // Check if user dismissed notifications this session
    const wasDismissed = sessionStorage.getItem('socialProofDismissed');
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    // Show first notification after 15 seconds
    const initialDelay = setTimeout(() => {
      setNotification(generateNotification());
      setShowCount(1);
    }, 15000);

    return () => clearTimeout(initialDelay);
  }, [generateNotification]);

  useEffect(() => {
    if (dismissed || showCount >= 3) return;

    // Auto-hide after 6 seconds
    const hideTimer = setTimeout(() => {
      setNotification(null);
    }, 6000);

    // Show next notification after 45-90 seconds
    const nextTimer = setTimeout(
      () => {
        if (showCount < 3 && !dismissed) {
          setNotification(generateNotification());
          setShowCount(prev => prev + 1);
        }
      },
      45000 + Math.random() * 45000
    );

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(nextTimer);
    };
  }, [notification, showCount, dismissed, generateNotification]);

  const handleDismiss = () => {
    setDismissed(true);
    setNotification(null);
    sessionStorage.setItem('socialProofDismissed', 'true');
  };

  if (dismissed) return null;

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          key={notification.id}
          initial={{ opacity: 0, x: -100, y: 0 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-24 md:bottom-8 start-4 z-toast max-w-xs"
        >
          <div className="relative bg-white dark:bg-surface-800 rounded-xl shadow-2xl border border-surface-200 dark:border-surface-700 overflow-hidden">
            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="absolute top-2 end-2 p-1 rounded-full hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-3 h-3 text-surface-400" />
            </button>

            <div className="flex items-center gap-3 p-3 pe-8">
              {/* Icon */}
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-900 dark:text-white">
                  Someone from {notification.city}
                </p>
                <p className="text-xs text-surface-500 dark:text-surface-400">
                  analyzed their store {notification.timeAgo}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 6, ease: 'linear' }}
              className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500 origin-left"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
