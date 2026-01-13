'use client';

import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion } from "@/lib/motion";

export const OfflineIndicator = () => {
  const [isOffline, setIsOffline] = useState(false);
  const t = useTranslations();

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-surface-900 text-white relative z-[100] overflow-hidden"
        >
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider">
            <WifiOff size={14} className="text-red-400" />
            <span>{t('portal.common.offline')}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
