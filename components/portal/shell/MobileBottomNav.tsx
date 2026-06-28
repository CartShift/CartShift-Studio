'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import {
  Home,
  LayoutList,
  Users,
  FolderOpen,
  CalendarClock,
  BarChart3,
  Kanban,
  LayoutGrid,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations, useLocale } from 'next-intl';
import { getPortalPath } from '@/lib/utils/portal-paths';
import { isPortalNavActive } from '@/lib/utils/portal-nav';
import { isRTLLocale } from '@/lib/locale-config';
import { MobileNavMoreSheet } from './MobileNavMoreSheet';
import type { NavGroup } from './types';

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  badge?: number;
}

const NavItem = ({ href, icon: Icon, label, isActive, badge }: NavItemProps) => (
  <Link
    href={href}
    className={cn(
      'portal-focus-ring relative flex flex-col items-center justify-center flex-1 min-w-0 gap-1 transition-[color,transform] active:scale-[0.97] min-h-[44px] rounded-xl',
      isActive ? 'text-primary-600 dark:text-primary-400' : 'text-surface-400 dark:text-surface-500'
    )}
    aria-current={isActive ? 'page' : undefined}
  >
    {isActive && (
      <span className="absolute -top-1 inset-x-2 h-1 bg-primary-500 rounded-b-full shadow-[0_4px_14px_rgb(var(--color-primary-500)/0.55)]" />
    )}
    <span className="relative flex items-center justify-center">
      <Icon size={22} strokeWidth={isActive ? 2.25 : 1.75} aria-hidden />
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1.5 -end-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold text-white bg-rose-500 rounded-full shadow-sm">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </span>
    <span
      className={cn(
        'max-w-full truncate text-[9px] font-medium leading-tight',
        isActive && 'font-semibold'
      )}
    >
      {label}
    </span>
  </Link>
);

interface MobileBottomNavProps {
  isAgency?: boolean;
  navGroups: NavGroup[];
  badges?: {
    requests?: number;
    consultations?: number;
    clients?: number;
    workboard?: number;
    pricing?: number;
  };
}

export function MobileBottomNav({
  isAgency = false,
  navGroups,
  badges = {},
}: MobileBottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const tNav = useTranslations('portal.sidebar.nav');
  const tA11y = useTranslations('portal.accessibility');
  const navRef = useRef<HTMLElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);

  const clientNav = [
    {
      href: getPortalPath('/dashboard'),
      icon: Home,
      labelKey: 'dashboard' as const,
      badgeKey: undefined,
    },
    {
      href: getPortalPath('/requests'),
      icon: LayoutList,
      labelKey: 'requests' as const,
      badgeKey: 'requests' as const,
    },
    {
      href: getPortalPath('/files'),
      icon: FolderOpen,
      labelKey: 'files' as const,
      badgeKey: undefined,
    },
    {
      href: getPortalPath('/consultations'),
      icon: CalendarClock,
      labelKey: 'consultations' as const,
      badgeKey: 'consultations' as const,
    },
  ];

  const agencyNav = [
    {
      href: getPortalPath('/agency/workboard'),
      icon: Kanban,
      labelKey: 'workboard' as const,
      badgeKey: 'workboard' as const,
    },
    {
      href: getPortalPath('/agency/clients'),
      icon: Users,
      labelKey: 'clients' as const,
      badgeKey: 'clients' as const,
    },
    {
      href: getPortalPath('/requests'),
      icon: LayoutList,
      labelKey: 'requests' as const,
      badgeKey: 'requests' as const,
    },
    {
      href: getPortalPath('/agency/sales'),
      icon: BarChart3,
      labelKey: 'sales' as const,
      badgeKey: undefined,
    },
  ];

  const navItems = isAgency ? agencyNav : clientNav;
  const primaryHrefs = navItems.map(item => item.href);

  const overflowItems = navGroups.flatMap(g => g.items.filter(i => !primaryHrefs.includes(i.href)));
  const isMoreActive = overflowItems.some(item => isPortalNavActive(pathname, item.href));

  const currentIndex = navItems.findIndex(item => isPortalNavActive(pathname, item.href));

  const navigateToIndex = useCallback(
    (index: number) => {
      if (index >= 0 && index < navItems.length) {
        router.push(navItems[index].href);
      }
    },
    [navItems, router]
  );

  useEffect(() => {
    const navEl = navRef.current;
    if (!navEl) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (!navEl.contains(e.target as Node)) return;
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return;
      if (!navEl.contains(e.target as Node)) {
        touchStartX.current = null;
        touchStartY.current = null;
        return;
      }

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX.current;
      const deltaY = touchEndY - touchStartY.current;

      const minSwipeDistance = 80;
      const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY) * 1.5;

      if (isHorizontalSwipe && Math.abs(deltaX) > minSwipeDistance) {
        const isRTL = isRTLLocale(locale);
        const swipeLeft = deltaX < 0;
        const goNext = isRTL ? !swipeLeft : swipeLeft;

        if (goNext && currentIndex < navItems.length - 1) {
          navigateToIndex(currentIndex + 1);
        } else if (!goNext && currentIndex > 0) {
          navigateToIndex(currentIndex - 1);
        }
      }

      touchStartX.current = null;
      touchStartY.current = null;
    };

    navEl.addEventListener('touchstart', handleTouchStart, { passive: true });
    navEl.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      navEl.removeEventListener('touchstart', handleTouchStart);
      navEl.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentIndex, locale, navItems.length, navigateToIndex]);

  return (
    <>
      <nav
        ref={navRef}
        className="portal-mobile-nav fixed bottom-0 start-0 end-0 z-50 md:hidden pb-safe"
        aria-label={tA11y('mainNavigation')}
      >
        <div className="flex items-center justify-around h-[4.25rem] px-1.5">
          {navItems.map(({ href, icon, labelKey, badgeKey }) => (
            <NavItem
              key={href}
              href={href}
              icon={icon}
              label={tNav(labelKey)}
              isActive={isPortalNavActive(pathname, href)}
              badge={badgeKey ? badges[badgeKey] : undefined}
            />
          ))}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              'portal-focus-ring relative flex flex-col items-center justify-center flex-1 min-w-0 gap-1 transition-[color,transform] active:scale-[0.97] min-h-[44px] rounded-xl',
              isMoreActive || moreOpen
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-surface-400 dark:text-surface-500'
            )}
            aria-label={tA11y('moreMenu')}
            aria-expanded={moreOpen}
          >
            {(isMoreActive || moreOpen) && (
              <span className="absolute -top-1 inset-x-2 h-1 bg-primary-500 rounded-b-full shadow-[0_4px_14px_rgb(var(--color-primary-500)/0.55)]" />
            )}
            <LayoutGrid
              size={22}
              strokeWidth={isMoreActive || moreOpen ? 2.25 : 1.75}
              aria-hidden
            />
            <span
              className={cn(
                'max-w-full truncate text-[9px] font-medium leading-tight',
                (isMoreActive || moreOpen) && 'font-semibold'
              )}
            >
              {tA11y('moreNavigation')}
            </span>
          </button>
        </div>
      </nav>

      <MobileNavMoreSheet
        isOpen={moreOpen}
        onClose={() => setMoreOpen(false)}
        navGroups={navGroups}
        primaryHrefs={primaryHrefs}
      />
    </>
  );
}
