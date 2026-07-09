'use client';

import React from 'react';
import { Menu, Bell, Command, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Avatar } from '@/components/ui/Avatar';
import { MobileSearchButton } from './MobileSearchButton';
import { GlobalSearch } from './GlobalSearch';
import { NotificationPreview } from './NotificationPreview';
import { usePortalTranslations } from '@/lib/i18n/translations';
import { ACCOUNT_TYPE, AccountType, Notification } from '@/lib/types/portal';
import { cva } from 'class-variance-authority';
import { Dropdown } from '@/components/ui/Dropdown';
import { Link, useRouter } from '@/i18n/navigation';
import { LogOut, Settings, User, ExternalLink } from 'lucide-react';
import { getPortalPath } from '@/lib/utils/portal-paths';
import { getHelpPath } from '@/lib/portal/help-topics';
import { usePlatformModifierKey } from '@/lib/hooks/usePlatformModifierKey';
import { getPortalRoleKey } from '@/lib/i18n/portal-translation-keys';

const notificationButtonVariants = cva(
  'portal-focus-ring relative min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl flex items-center justify-center transition-colors duration-200',
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
  const t = usePortalTranslations();
  const router = useRouter();
  const modifierKey = usePlatformModifierKey();
  const helpHref = getHelpPath(userData?.isAgency ?? accountType === ACCOUNT_TYPE.AGENCY);

  const profileItems = [
    {
      label: t('sidebar.help'),
      icon: <HelpCircle size={16} />,
      onClick: () => router.push(helpHref),
    },
    {
      label: t('header.visitWebsite'),
      icon: <ExternalLink size={16} />,
      onClick: () => window.open('/', '_blank'),
    },
    {
      label: t('settings.tabs.profile'),
      icon: <User size={16} />,
      onClick: () =>
        router.push(
          userData?.isAgency
            ? getPortalPath('/agency/settings?tab=profile')
            : getPortalPath('/settings?tab=profile')
        ),
    },
    {
      label: t('settings.title'),
      icon: <Settings size={16} />,
      onClick: () =>
        router.push(
          userData?.isAgency ? getPortalPath('/agency/settings') : getPortalPath('/settings')
        ),
    },
    {
      label: t('sidebar.signOut'),
      icon: <LogOut size={16} />,
      variant: 'danger' as const,
      onClick: onSignOut,
    },
  ];

  return (
    <header
      {...(viewTransitionName && { 'view-transition-name': viewTransitionName })}
      className="portal-header flex items-center justify-between px-3 md:px-5 sticky top-0 z-header h-[var(--portal-header-height)]"
    >
      <div className="flex items-center gap-3 md:gap-4">
        <button
          id="portal-mobile-menu-button"
          onClick={onMobileMenuToggle}
          className="portal-focus-ring md:hidden p-3 min-w-[44px] min-h-[44px] flex items-center justify-center text-surface-500 hover:text-surface-900 dark:hover:text-white transition-colors touch-manipulation active:scale-95 rounded-xl hover:bg-surface-100/50 dark:hover:bg-surface-800/50"
          aria-label={t('accessibility.openMenu')}
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
          aria-label={t('accessibility.commandPalette')}
          title={t('accessibility.commandPaletteHint', { modifier: modifierKey })}
        >
          <span className="hidden xl:inline">{t('header.commands')}</span>
          <kbd className="inline-flex h-5 items-center gap-1 rounded border border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800 px-1.5 font-mono text-[10px] font-medium text-surface-500 dark:text-surface-400">
            <span className="text-xs">{modifierKey}</span>K
          </kbd>
        </button>
        <button
          onClick={onOpenCommandPalette}
          className="portal-focus-ring md:hidden p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-surface-500 hover:text-surface-900 dark:hover:text-white transition-colors rounded-xl hover:bg-surface-100/50 dark:hover:bg-surface-800/50"
          aria-label={t('accessibility.commandPalette')}
        >
          <Command size={20} />
        </button>
      </div>

      <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
        <div className="flex items-center gap-2">
          {/* Controls wrapper - Language & Theme */}
          <div className="hidden sm:flex items-center gap-1.5 p-1 bg-surface-100/70 dark:bg-white/[0.045] rounded-xl border border-surface-200/60 dark:border-white/[0.07] shadow-inner">
            <LanguageSwitcher />
            <div className="w-[1px] h-5 bg-surface-300/60 dark:bg-surface-600/50" />
            <ThemeToggle />
          </div>

          {/* Help */}
          <Link
            href={helpHref}
            className="portal-focus-ring min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl flex items-center justify-center text-surface-500 hover:text-surface-900 dark:hover:text-white hover:bg-surface-100/80 dark:hover:bg-surface-800/50 transition-colors"
            aria-label={t('accessibility.helpCenter')}
          >
            <HelpCircle size={20} aria-hidden />
          </Link>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              ref={notificationButtonRef}
              data-tour="header-notifications"
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className={cn(notificationButtonVariants({ isOpen: isNotificationOpen }))}
              aria-label={t('header.notifications')}
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
                  aria-label={t('header.unreadNotifications', { count: unreadCount })}
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
              {userData?.name || t('header.authorizedMember' as never)}
            </span>
            <div className="flex items-center gap-1.5">
              {userRole ? (
                <span className="text-[10px] text-surface-500 dark:text-surface-400 font-medium">
                  {t(getPortalRoleKey(userRole))}
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
                    ? t('accountType.badge.agency' as never)
                    : t('accountType.badge.client' as never)}
                </span>
              )}
            </div>
          </div>

          <Dropdown
            align="right"
            trigger={
              <button
                className="portal-avatar portal-focus-ring group cursor-pointer hover:ring-2 hover:ring-primary-500/50 hover:ring-offset-2 dark:hover:ring-offset-surface-950 transition-all active:scale-95 rounded-full"
                aria-label={t('header.profileMenu')}
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