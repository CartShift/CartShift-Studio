'use client';

import { ViewTransitionLink } from '@/components/ui/ViewTransitionLink';
import { usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { canAccessNav } from '@/lib/utils/permissions';
import { isPortalNavActive } from '@/lib/utils/portal-nav';
import { navItemVariants } from './constants';
import { announcePortal } from './portal-announcer';
import { SidebarNavigationProps } from './types';

export function SidebarNavigation({
  navGroups,
  isExpanded,
  isMobile,
  onItemClick,
  userRole,
}: SidebarNavigationProps) {
  const pathname = usePathname();
  const t = useTranslations('portal.accessibility');

  const filteredGroups = useMemo(() => {
    return navGroups
      .map(group => ({
        ...group,
        items: group.items.filter(item => canAccessNav(userRole, item.roles)),
      }))
      .filter(group => group.items.length > 0);
  }, [navGroups, userRole]);

  return (
    <nav
      className="flex-1 overflow-y-auto overflow-x-hidden portal-scrollbar p-2.5 space-y-0.5 min-h-0"
      aria-label={t('mainNavigation')}
    >
      {filteredGroups.map((group, groupIndex) => (
        <div key={group.id}>
          {groupIndex > 0 && (
            <div className="mx-3 my-1.5 border-t border-surface-200/50 dark:border-surface-800/30" />
          )}
          {group.items.map(item => {
            const isActive = isPortalNavActive(pathname, item.href);
            return (
              <ViewTransitionLink
                key={item.href}
                href={item.href}
                preset="slide"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => {
                  announcePortal(t('navigatedTo', { page: item.label }));
                  if (isMobile) onItemClick();
                }}
                className={cn(navItemVariants({ isActive, isCollapsed: !isExpanded }))}
                title={!isExpanded ? item.label : undefined}
              >
                <item.icon
                  size={17}
                  className={cn(
                    'transition-all duration-300 flex-shrink-0',
                    isActive
                      ? 'text-current'
                      : 'opacity-60 group-hover:opacity-100 group-hover:scale-110'
                  )}
                  aria-hidden
                />
                {isExpanded && (
                  <span className="text-[13px] font-bold truncate flex-1">{item.label}</span>
                )}
              </ViewTransitionLink>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
