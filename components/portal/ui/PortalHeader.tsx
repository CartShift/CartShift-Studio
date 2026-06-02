'use client';

import React from 'react';
import { Menu, Bell, Command } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Avatar } from '@/components/ui/Avatar';
import { MobileSearchButton } from './MobileSearchButton';
import { GlobalSearch } from './GlobalSearch';
import { NotificationPreview } from './NotificationPreview';
import { useTranslations } from 'next-intl';
import { ACCOUNT_TYPE, AccountType, Notification } from '@/lib/types/portal';
import { cva } from 'class-variance-authority';
import { Dropdown } from '@/components/ui/Dropdown';
import { useRouter } from '@/i18n/navigation';
import { LogOut, Settings, User, ExternalLink } from 'lucide-react';
import { getPortalPath } from '@/lib/utils/portal-paths';
import { usePlatformModifierKey } from '@/lib/hooks/usePlatformModifierKey';

const notificationButtonVariants = cva(
  'portal-focus-ring relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-200',
  {
    variants: {
      isOpen: {
        true: 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400',
        false:
          'text-surface-500 hover:text-surface-900 dark:hover:text-white hover:bg-surface-100/80 dark:hover:bg-surface-800/50',
      },
    },
    defaultVariants: {
      isOpen: false,
    },
  }
);

export interface HeaderUserData {
  id: string;
  email: string;
  name?: string;
  photoUrl?: string;
  accountType: AccountType;
  isAgency: boolean;
  role?: import('@/lib/types/portal').UserRole;
}

interface PortalHeaderProps {
  onMobileMenuToggle: () => void;
  onMobileSearchToggle: () => void;
  isMobileMenuOpen?: boolean;
  userData: HeaderUserData | null;
  accountType: AccountType;
  userRole?: string;
  notifications: Notification[];
  unreadCount: number;
  isNotificationOpen: boolean;
  setIsNotificationOpen: (open: boolean) => void;
  notificationRef: React.RefObject<HTMLDivElement | null>;
  notificationButtonRef: React.RefObject<HTMLButtonElement | null>;
  handleNotificationClick: (notification: Notification) => void;
  handleMarkAllAsRead: () => Promise<void>;
  orgId?: string;
  onSignOut: () => Promise<void>;
  viewTransitionName?: string;
  onOpenCommandPalette?: () => void;
}

export function PortalHeader({
  onMobileMenuToggle,
  onMobileSearchToggle,
  isMobileMenuOpen = false,
  userData,
  accountType,
  userRole,
  notifications,
  unreadCount,
  isNotificationOpen,
  setIsNotificationOpen,
  notificationRef,
  notificationButtonRef,
  handleNotificationClick,
  orgId,
  onSignOut,
  viewTransitionName,
  onOpenCommandPalette,
}: PortalHeaderProps) {
  const t = useTranslations();
  const tA11y = useTranslations('portal.accessibility');
  const router = useRouter();
  const modifierKey = usePlatformModifierKey();

  const profileItems = [
    {
      label: t('portal.header.visitWebsite'),
      icon: <ExternalLink size={16} />,
      onClick: () => window.open('/', '_blank'),
    },
    {
      label: t('portal.settings.tabs.profile'),
      icon: <User size={16} />,
      onClick: () =>
        router.push(
          userData?.isAgency
            ? getPortalPath('/agency/settings?tab=profile')
            : getPortalPath('/settings?tab=profile')
        ),
    },
    {
      label: t('portal.settings.title'),
      icon: <Settings size={16} />,
      onClick: () =>
        router.push(
          userData?.isAgency ? getPortalPath('/agency/settings') : getPortalPath('/settings')
        ),
    },
    {
      label: t('portal.sidebar.signOut'),
      icon: <LogOut size={16} />,
      variant: 'danger' as const,
      onClick: onSignOut,
    },
  ];

  return (
    <header
      {...(viewTransitionName && { 'view-transition-name': viewTransitionName })}
      className="portal-header flex items-center justify-between px-4 md:px-5 bg-white dark:bg-surface-950 border-b border-surface-200 dark:border-surface-800 sticky top-0 z-header h-14 md:h-[68px]"
    >
      <div className="flex items-center gap-3 md:gap-4">
        <button
          id="portal-mobile-menu-button"
          onClick={onMobileMenuToggle}
          className="portal-focus-ring md:hidden p-3 min-w-[44px] min-h-[44px] flex items-center justify-center text-surface-500 hover:text-surface-900 dark:hover:text-white transition-colors touch-manipulation active:scale-95 rounded-xl hover:bg-surface-100/50 dark:hover:bg-surface-800/50"
          aria-label={tA11y('openMenu')}
          aria-expanded={isMobileMenuOpen}
        >
          <Menu size={24} />
        </button>
        <MobileSearchButton onClickAction={onMobileSearchToggle} className="lg:hidden" />
        <GlobalSearch
          orgId={orgId}
          isAgency={accountType === ACCOUNT_TYPE.AGENCY}
          className="hidden lg:block w-64 xl:w-80"
        />
        <button
          onClick={onOpenCommandPalette}
          className="portal-focus-ring hidden md:flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-surface-500 hover:text-surface-900 dark:hover:text-white bg-surface-100/50 hover:bg-surface-100 dark:bg-surface-800/30 dark:hover:bg-surface-800 rounded-lg transition-colors border border-transparent hover:border-surface-200 dark:hover:border-surface-700"
          aria-label={tA11y('commandPalette')}
          title={tA11y('commandPaletteHint', { modifier: modifierKey })}
        >
          <span className="hidden xl:inline">{t('portal.header.commands')}</span>
          <kbd className="inline-flex h-5 items-center gap-1 rounded border border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800 px-1.5 font-mono text-[10px] font-medium text-surface-500 dark:text-surface-400">
            <span className="text-xs">{modifierKey}</span>K
          </kbd>
        </button>
        <button
          onClick={onOpenCommandPalette}
          className="portal-focus-ring md:hidden p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-surface-500 hover:text-surface-900 dark:hover:text-white transition-colors rounded-xl hover:bg-surface-100/50 dark:hover:bg-surface-800/50"
          aria-label={tA11y('commandPalette')}
        >
          <Command size={20} />
        </button>
      </div>

      <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
        <div className="flex items-center gap-2">
          {/* Controls wrapper - Language & Theme */}
          <div className="hidden sm:flex items-center gap-1.5 p-1.5 bg-surface-100/80 dark:bg-surface-800/60 rounded-2xl border border-surface-200/60 dark:border-surface-700/40">
            <LanguageSwitcher />
            <div className="w-[1px] h-5 bg-surface-300/60 dark:bg-surface-600/50" />
            <ThemeToggle />
          </div>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              ref={notificationButtonRef}
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className={cn(notificationButtonVariants({ isOpen: isNotificationOpen }))}
              aria-label={t('portal.header.notifications')}
              aria-expanded={isNotificationOpen}
              aria-haspopup="true"
            >
              <Bell
                size={20}
                className="transition-transform group-hover:scale-110"
                aria-hidden="true"
              />
              {unreadCount > 0 && (
                <span
                  className="absolute top-2.5 end-2.5 w-2.5 h-2.5 bg-primary-600 rounded-full ring-2 ring-white dark:ring-surface-950 motion-safe:animate-pulse"
                  aria-label={t('portal.header.unreadNotifications', { count: unreadCount })}
                />
              )}
            </button>
            <NotificationPreview
              notifications={notifications}
              unreadCount={unreadCount}
              onNotificationClick={handleNotificationClick}
              buttonRef={notificationButtonRef}
            />
          </div>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-2.5 border-s border-surface-200 dark:border-surface-800 ps-3 md:ps-4">
          <div className="hidden sm:flex flex-col items-end leading-none gap-1">
            <span className="text-[13px] font-semibold text-surface-900 dark:text-white font-outfit truncate max-w-[140px]">
              {userData?.name || t('portal.header.authorizedMember' as never)}
            </span>
            <div className="flex items-center gap-1.5">
              {userRole ? (
                <span className="text-[10px] text-surface-500 dark:text-surface-400 font-medium">
                  {t(`portal.roles.${userRole}` as any)}
                </span>
              ) : (
                <span
                  className={cn(
                    'text-[10px] font-semibold',
                    accountType === ACCOUNT_TYPE.AGENCY
                      ? 'text-accent-600 dark:text-accent-400'
                      : 'text-primary-600 dark:text-primary-400'
                  )}
                >
                  {accountType === ACCOUNT_TYPE.AGENCY
                    ? t('portal.accountType.badge.agency' as never)
                    : t('portal.accountType.badge.client' as never)}
                </span>
              )}
            </div>
          </div>

          <Dropdown
            align="right"
            trigger={
              <button
                className="portal-avatar portal-focus-ring group cursor-pointer hover:ring-2 hover:ring-primary-500/50 hover:ring-offset-2 dark:hover:ring-offset-surface-950 transition-all active:scale-95 rounded-full"
                aria-label={t('portal.header.profileMenu' as any)}
              >
                <Avatar
                  name={userData?.name}
                  src={userData?.photoUrl}
                  size="md"
                  className="w-8 h-8 group-hover:scale-110 transition-transform"
                />
              </button>
            }
            items={profileItems}
          />
        </div>
      </div>
    </header>
  );
}
