'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Notification } from '@/lib/types/portal';
import { formatDistanceToNow } from 'date-fns';
import { getDateLocale } from '@/lib/locale-config';
import { useTranslations, useLocale } from 'next-intl';

interface NotificationPreviewProps {
  notifications: Notification[];
  unreadCount: number;
  onNotificationClick: (notification: Notification) => void;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
}

export function NotificationPreview({
  notifications,
  unreadCount,
  onNotificationClick,
  buttonRef: _buttonRef,
}: NotificationPreviewProps) {
  const [isHovered, setIsHovered] = useState(false);
  const t = useTranslations();
  const locale = useLocale();

  const recentNotifications = notifications.slice(0, 3);

  return (
    <>
      <div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <AnimatePresence>
          {isHovered && recentNotifications.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute end-0 top-full mt-2 w-80 bg-white/95 dark:bg-surface-900/95 backdrop-blur-xl rounded-xl shadow-2xl border border-surface-200/60 dark:border-surface-800/50 overflow-hidden z-always-on-top"
              style={{
                transformOrigin: 'top end',
              }}
            >
              <div className="p-4 border-b border-surface-200/50 dark:border-surface-800/30">
                <div className="flex items-center gap-2">
                  <Bell size={16} className="text-surface-400" />
                  <h4 className="text-sm font-semibold text-surface-900 dark:text-white font-outfit">
                    {t('portal.header.recentNotifications')}
                  </h4>
                  {unreadCount > 0 && (
                    <span className="ms-auto text-xs font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 px-2 py-0.5 rounded-full">
                      {unreadCount} {t('portal.header.new')}
                    </span>
                  )}
                </div>
              </div>

              <div className="max-h-[300px] overflow-y-auto portal-scrollbar">
                <div className="divide-y divide-surface-100 dark:divide-surface-800/50">
                  {recentNotifications.map(notification => {
                    const createdAt = notification.createdAt?.toDate
                      ? notification.createdAt.toDate()
                      : new Date();
                    return (
                      <button
                        key={notification.id}
                        onClick={() => {
                          setIsHovered(false);
                          onNotificationClick(notification);
                        }}
                        className={cn(
                          'w-full p-4 text-start hover:bg-surface-50/80 dark:hover:bg-surface-800/40 transition-all flex items-start gap-3 group',
                          !notification.read && 'bg-primary-50/30 dark:bg-primary-900/10'
                        )}
                      >
                        <div
                          className={cn(
                            'w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 transition-all',
                            !notification.read
                              ? 'bg-primary-600 shadow-[0_0_6px_rgb(var(--color-primary-600)/0.5)]'
                              : 'bg-transparent'
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              'text-sm font-bold mb-1 font-outfit leading-tight line-clamp-1',
                              !notification.read
                                ? 'text-surface-900 dark:text-white'
                                : 'text-surface-500'
                            )}
                          >
                            {notification.title}
                          </p>
                          <p className="text-xs text-surface-500/80 mb-2 line-clamp-2 leading-relaxed">
                            {notification.body}
                          </p>
                          <div className="text-[10px] text-surface-400 font-medium">
                            {formatDistanceToNow(createdAt, {
                              addSuffix: true,
                              locale: getDateLocale(locale),
                            })}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {notifications.length > 3 && (
                <div className="p-3 border-t border-surface-200/50 dark:border-surface-800/30 bg-surface-50/50 dark:bg-surface-900/30 text-center">
                  <p className="text-xs text-surface-500 font-medium">
                    {t('portal.header.viewAllNotifications', { count: notifications.length })}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
