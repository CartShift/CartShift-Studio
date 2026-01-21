'use client';

import { useRef, useCallback, useEffect } from 'react';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import {
  Home,
  LayoutList,
  Users,
  Settings,
  FolderOpen,
  CalendarClock,
  DollarSign,
  BarChart3,
  Kanban,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

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
      'relative flex flex-col items-center justify-center flex-1 min-w-0 gap-1 transition-colors active:opacity-70',
      isActive ? 'text-primary-600 dark:text-primary-400' : 'text-surface-400 dark:text-surface-500'
    )}
  >
    {isActive && <span className="absolute top-0 inset-x-4 h-0.5 bg-primary-500 rounded-full" />}
    <span className="relative flex items-center justify-center">
      <Icon size={22} strokeWidth={isActive ? 2.25 : 1.75} />
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1.5 -end-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold text-white bg-rose-500 rounded-full shadow-sm">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </span>
    <span className={cn('text-[10px] font-medium leading-tight', isActive && 'font-semibold')}>
      {label}
    </span>
  </Link>
);

interface MobileBottomNavProps {
  isAgency?: boolean;
  badges?: {
    requests?: number;
    consultations?: number;
    clients?: number;
    workboard?: number;
    pricing?: number;
  };
}

export function MobileBottomNav({ isAgency = false, badges = {} }: MobileBottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('portal.sidebar.nav');
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const isActive = (path: string) => {
    if (path === '/portal/dashboard' || path === '/portal/agency/workboard') {
      return pathname === path;
    }
    return pathname?.startsWith(path);
  };

  const clientNav = [
    { href: '/portal/dashboard', icon: Home, labelKey: 'dashboard' as const, badgeKey: undefined },
    {
      href: '/portal/requests',
      icon: LayoutList,
      labelKey: 'requests' as const,
      badgeKey: 'requests' as const,
    },
    { href: '/portal/files', icon: FolderOpen, labelKey: 'files' as const, badgeKey: undefined },
    {
      href: '/portal/consultations',
      icon: CalendarClock,
      labelKey: 'consultations' as const,
      badgeKey: 'consultations' as const,
    },
    {
      href: '/portal/settings',
      icon: Settings,
      labelKey: 'settings' as const,
      badgeKey: undefined,
    },
  ];

  const agencyNav = [
    {
      href: '/portal/agency/workboard',
      icon: Kanban,
      labelKey: 'workboard' as const,
      badgeKey: 'workboard' as const,
    },
    {
      href: '/portal/agency/clients',
      icon: Users,
      labelKey: 'clients' as const,
      badgeKey: 'clients' as const,
    },
    {
      href: '/portal/agency/pricing',
      icon: DollarSign,
      labelKey: 'pricing' as const,
      badgeKey: 'pricing' as const,
    },
    {
      href: '/portal/agency/sales',
      icon: BarChart3,
      labelKey: 'sales' as const,
      badgeKey: undefined,
    },
    {
      href: '/portal/agency/settings',
      icon: Settings,
      labelKey: 'settings' as const,
      badgeKey: undefined,
    },
  ];

  const navItems = isAgency ? agencyNav : clientNav;

  const currentIndex = navItems.findIndex(item => isActive(item.href));

  const navigateToIndex = useCallback(
    (index: number) => {
      if (index >= 0 && index < navItems.length) {
        router.push(navItems[index].href);
      }
    },
    [navItems, router]
  );

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX.current;
      const deltaY = touchEndY - touchStartY.current;

      const minSwipeDistance = 80;
      const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY) * 1.5;

      if (isHorizontalSwipe && Math.abs(deltaX) > minSwipeDistance) {
        const isRTL = document.dir === 'rtl';
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

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentIndex, navItems.length, navigateToIndex]);

  return (
    <nav className="fixed bottom-0 start-0 end-0 z-50 bg-white dark:bg-surface-950 border-t border-surface-200 dark:border-surface-800 md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ href, icon, labelKey, badgeKey }) => (
          <NavItem
            key={href}
            href={href}
            icon={icon}
            label={t(labelKey)}
            isActive={!!isActive(href)}
            badge={badgeKey ? badges[badgeKey] : undefined}
          />
        ))}
      </div>
    </nav>
  );
}
