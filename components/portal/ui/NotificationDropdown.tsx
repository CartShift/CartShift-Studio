'use client';

import React from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Bell, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Notification } from '@/lib/types/portal';
import { formatDistanceToNow } from 'date-fns';
import { getDateLocale } from '@/lib/locale-config';
import { useTranslations, useLocale } from 'next-intl';

export interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  unreadCount: number;
  onMarkAllAsRead: () => Promise<void>;
  onNotificationClick: (notification: Notification) => void;
  position: { top: number; right?: number; left?: number };
  dropdownRef: React.RefObject<HTMLDivElement | null>;
}

export function NotificationDropdown({
  isOpen,
  notifications,
  unreadCount,
  onMarkAllAsRead,
  onNotificationClick,
  position,
  dropdownRef,
}: Omit<NotificationDropdownProps, 'onClose'>) {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className="fixed max-w-80 w-[calc(100vw-2rem)] bg-white/90 dark:bg-surface-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-surface-200/60 dark:border-surface-800/50 overflow-hidden z-always-on-top"
          style={{
            top: `${position.top}px`,
            right: position.right !== undefined ? `${position.right}px` : undefined,
            left: position.left !== undefined ? `${position.left}px` : undefined,
            maxWidth: 'min(320px, calc(100vw - 2rem))',
          }}
        >
          <div className="p-6 border-b border-surface-200/50 dark:border-surface-800/30 flex items-center justify-between bg-white/50 dark:bg-surface-900/50">
            <h3 className="text-base font-black text-surface-900 dark:text-white font-outfit">
              {t('portal.header.notifications')}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1.5 hover:underline decoration-2 underline-offset-4 transition-all"
              >
                <CheckCheck size={14} />
                {t('portal.header.markAllRead')}
              </button>
            )}
          </div>

          <div className="max-h-[450px] overflow-y-auto portal-scrollbar bg-white/30 dark:bg-surface-900/10">
            {notifications.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-surface-50 dark:bg-surface-950 rounded-full flex items-center justify-center mx-auto mb-4 border border-surface-200 dark:border-surface-800">
                  <Bell size={24} className="text-surface-300 dark:text-surface-700" />
                </div>
                <p className="text-sm text-surface-500 font-bold">
                  {t('portal.header.noNotifications')}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-surface-100 dark:divide-surface-800/50">
                {notifications.map(notification => {
                  const createdAt = notification.createdAt?.toDate
                    ? notification.createdAt.toDate()
                    : new Date();
                  return (
                    <button
                      key={notification.id}
                      onClick={() => onNotificationClick(notification)}
                      className={cn(
                        'w-full p-5 text-start hover:bg-surface-50/80 dark:hover:bg-surface-800/40 transition-all flex items-start gap-4 group',
                        !notification.read && 'bg-primary-50/30 dark:bg-primary-900/10'
                      )}
                    >
                      <div
                        className={cn(
                          'w-2 h-2 rounded-full mt-2 flex-shrink-0 transition-all group-hover:scale-150',
                          !notification.read
                            ? 'bg-primary-600 shadow-[0_0_8px_rgb(var(--color-primary-600)/0.6)]'
                            : 'bg-transparent border border-surface-300 dark:border-surface-700'
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            'text-sm font-bold mb-1 font-outfit leading-tight',
                            !notification.read
                              ? 'text-surface-900 dark:text-white'
                              : 'text-surface-500'
                          )}
                        >
                          {notification.title}
                        </p>
                        <p className="text-xs text-surface-500/80 mb-3 line-clamp-2 leading-relaxed font-medium">
                          {notification.body}
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="px-2 py-0.5 rounded-md bg-surface-100 dark:bg-surface-800 text-[10px] font-black uppercase text-surface-400">
                            {formatDistanceToNow(createdAt, {
                              addSuffix: true,
                              locale: getDateLocale(locale),
                            })}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
