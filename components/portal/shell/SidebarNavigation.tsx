'use client';

import { ViewTransitionLink } from '@/components/ui/ViewTransitionLink';
import { usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { canAccessNav } from '@/lib/utils/permissions';
import { isPortalNavActive } from '@/lib/utils/portal-nav';
import { isAgencyPrimaryNavHref } from '@/lib/portal/agency-nav';
import { navItemVariants } from './constants';
import { announcePortal } from './portal-announcer';
import { SidebarNavigationProps, getNavGroupAbbrevKey } from './types';
import { Tooltip } from '@/components/ui/Tooltip';
import { ChevronDown } from 'lucide-react';

const AGENCY_MORE_STORAGE_KEY = 'portal-agency-nav-more-expanded';

function getNavTourId(href: string): string | undefined {
  if (href.includes('/dashboard')) return 'nav-dashboard';
  if (href.includes('/requests')) return 'nav-requests';
  if (href.includes('/pricing')) return 'nav-pricing';
  if (href.includes('/team')) return 'nav-team';
  if (href.includes('/workboard')) return 'nav-workboard';
  return undefined;
}

export function SidebarNavigation({
  navGroups,
  isExpanded,
  isMobile,
  isAgency = false,
  onItemClick,
  userRole,
}: SidebarNavigationProps) {
  const pathname = usePathname();
  const tA11y = useTranslations('portal.accessibility');
  const t = useTranslations('portal');
  const [moreExpanded, setMoreExpanded] = useState(false);

  const filteredGroups = useMemo(() => {
    return navGroups
      .map(group => ({
        ...group,
        items: group.items.filter(item => canAccessNav(userRole, item.roles)),
      }))
      .filter(group => group.items.length > 0);
  }, [navGroups, userRole]);

  const { primaryGroups, secondaryItems } = useMemo(() => {
    if (!isAgency || !isExpanded || isMobile) {
      return { primaryGroups: filteredGroups, secondaryItems: [] as typeof filteredGroups[number]['items'] };
    }

    const secondary: typeof filteredGroups[number]['items'] = [];
    const primary = filteredGroups
      .map(group => {
        const primaryItems = group.items.filter(item => {
          if (isAgencyPrimaryNavHref(item.href)) return true;
          secondary.push(item);
          return false;
        });
        return primaryItems.length > 0 ? { ...group, items: primaryItems } : null;
      })
      .filter((group): group is (typeof filteredGroups)[number] => group !== null);

    return { primaryGroups: primary, secondaryItems: secondary };
  }, [filteredGroups, isAgency, isExpanded, isMobile]);

  const secondaryActive = useMemo(
    () => secondaryItems.some(item => isPortalNavActive(pathname, item.href)),
    [secondaryItems, pathname]
  );

  useEffect(() => {
    if (!isAgency || !isExpanded || isMobile) return;
    if (secondaryActive) {
      setMoreExpanded(true);
      return;
    }
    try {
      setMoreExpanded(localStorage.getItem(AGENCY_MORE_STORAGE_KEY) === 'true');
    } catch {
      setMoreExpanded(false);
    }
  }, [isAgency, isExpanded, isMobile, secondaryActive]);

  const toggleMore = () => {
    setMoreExpanded(prev => {
      const next = !prev;
      try {
        localStorage.setItem(AGENCY_MORE_STORAGE_KEY, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const renderNavLink = (
    item: (typeof filteredGroups)[number]['items'][number],
    isActive: boolean
  ) => {
    const tourId = getNavTourId(item.href);
    const link = (
      <ViewTransitionLink
        href={item.href}
        preset="slide"
        aria-current={isActive ? 'page' : undefined}
        data-tour={tourId}
        onClick={() => {
          announcePortal(tA11y('navigatedTo', { page: item.label }));
          if (isMobile) onItemClick();
        }}
        className={cn(navItemVariants({ isActive, isCollapsed: !isExpanded && !isMobile }))}
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
        {isExpanded || isMobile ? (
          <span className="text-[13px] font-bold truncate flex-1">{item.label}</span>
        ) : (
          <span className="hidden md:block text-[10px] leading-snug font-semibold text-center max-w-[68px] line-clamp-2 w-full text-surface-400 group-hover:text-surface-200">
            {item.label}
          </span>
        )}
      </ViewTransitionLink>
    );

    if (!isExpanded && !isMobile) {
      return (
        <Tooltip content={item.label} side="end" delay={0.15}>
          <span className="block w-full">{link}</span>
        </Tooltip>
      );
    }

    return link;
  };

  const renderGroup = (group: (typeof filteredGroups)[number], groupIndex: number) => (
    <div key={group.id} className="space-y-0.5">
      {isExpanded && group.labelKey && (
        <p className="portal-nav-section-title">{t(group.labelKey)}</p>
      )}
      {!isExpanded && !isMobile && group.labelKey && (
        <>
          {groupIndex > 0 && (
            <div className="hidden md:block mx-auto my-1 h-px w-8 bg-surface-800/80" aria-hidden />
          )}
          <p className="portal-nav-group-abbrev" title={t(group.labelKey)}>
            {t(getNavGroupAbbrevKey(group.labelKey))}
          </p>
        </>
      )}
      {group.items.map(item => {
        const isActive = isPortalNavActive(pathname, item.href);
        return <div key={item.href}>{renderNavLink(item, isActive)}</div>;
      })}
    </div>
  );

  const groupsToRender =
    isAgency && isExpanded && !isMobile ? primaryGroups : filteredGroups;

  return (
    <nav
      className="flex-1 overflow-y-auto overflow-x-hidden portal-scrollbar p-2.5 space-y-1 min-h-0"
      aria-label={tA11y('mainNavigation')}
    >
      {groupsToRender.map((group, groupIndex) => renderGroup(group, groupIndex))}

      {isAgency && isExpanded && !isMobile && secondaryItems.length > 0 && (
        <div className="space-y-0.5 pt-1">
          <button
            type="button"
            onClick={toggleMore}
            aria-expanded={moreExpanded}
            aria-controls="portal-sidebar-more"
            className="portal-focus-ring portal-nav-section-title flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-start hover:bg-white/5 touch-target-sm"
          >
            <span>{t('sidebar.nav.more')}</span>
            <ChevronDown
              size={14}
              className={cn('shrink-0 transition-transform', moreExpanded && 'rotate-180')}
              aria-hidden
            />
          </button>
          {moreExpanded && (
            <div id="portal-sidebar-more" className="space-y-0.5">
              {secondaryItems.map(item => {
                const isActive = isPortalNavActive(pathname, item.href);
                return <div key={item.href}>{renderNavLink(item, isActive)}</div>;
              })}
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
