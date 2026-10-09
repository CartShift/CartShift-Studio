'use client';

import { useState } from 'react';
import { LayoutGrid } from 'lucide-react';
import { Link, usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { isPortalNavActive, normalizePortalPath } from '@/lib/utils/portal-nav';
import { getPortalPath } from '@/lib/utils/portal-paths';
import { MobileNavMoreSheet } from './MobileNavMoreSheet';
import type { NavGroup } from './types';

interface MobileBottomNavProps {
  isAgency?: boolean;
  navGroups: NavGroup[];
  badges?: { requests?: number; consultations?: number; clients?: number; workboard?: number; pricing?: number };
}

/** Derive destinations from already permission-filtered sidebar groups. */
export function MobileBottomNav({ isAgency = false, navGroups, badges = {} }: MobileBottomNavProps) {
  const pathname = usePathname();
  const t = useTranslations('portal.accessibility');
  const [moreOpen, setMoreOpen] = useState(false);
  const available = navGroups.flatMap(group => group.items);
  const desired = isAgency
    ? ['/agency/dashboard', '/agency/workboard', '/agency/clients', '/requests']
    : ['/dashboard', '/requests', '/projects', '/consultations'];
  const navItems = desired.flatMap(path => {
    const matching = available.find(item => normalizePortalPath(item.href) === normalizePortalPath(getPortalPath(path)));
    return matching ? [matching] : [];
  });
  const navHrefs = navItems.map(item => item.href);
  const overflowItems = available.filter(item => !navHrefs.includes(item.href));
  const isMoreActive = overflowItems.some(item => isPortalNavActive(pathname, item.href));

  const getBadge = (href: string) => {
    if (href.includes('/workboard')) return badges.workboard;
    if (href.includes('/requests')) return badges.requests;
    if (href.includes('/clients')) return badges.clients;
    if (href.includes('/consultations')) return badges.consultations;
    if (href.includes('/pricing')) return badges.pricing;
    return undefined;
  };

  return (
    <>
      <nav className="portal-mobile-nav fixed bottom-0 start-0 end-0 z-50 md:hidden pb-safe" aria-label={t('mainNavigation')}>
        <div className="flex h-[4.25rem] items-center justify-around gap-1 px-2">
          {navItems.map(item => {
            const active = isPortalNavActive(pathname, item.href);
            const Icon = item.icon;
            const badge = getBadge(item.href);
            return (
              <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined}
                className={cn('portal-focus-ring relative flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 transition-colors',
                  active ? 'text-primary-600 dark:text-primary-400' : 'text-surface-500 dark:text-surface-400')}>
                {active && <span className="absolute inset-x-3 -top-1 h-1 rounded-b-full bg-primary-500" aria-hidden />}
                <span className="relative">
                  <Icon size={22} strokeWidth={active ? 2.2 : 1.8} aria-hidden />
                  {badge && badge > 0 && <span className="absolute -end-3 -top-2 min-w-[19px] rounded-full bg-rose-600 px-1 text-center text-[11px] font-bold text-white">{badge > 99 ? '99+' : badge}</span>}
                </span>
                <span className="max-w-full truncate text-[11px] font-medium">{item.label}</span>
              </Link>
            );
          })}
          {overflowItems.length > 0 && (
            <button type="button" onClick={() => setMoreOpen(true)}
              className={cn('portal-focus-ring relative flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1',
                isMoreActive || moreOpen ? 'text-primary-600 dark:text-primary-400' : 'text-surface-500 dark:text-surface-400')}
              aria-label={t('moreMenu')} aria-expanded={moreOpen}>
              <LayoutGrid size={22} aria-hidden />
              <span className="max-w-full truncate text-[11px] font-medium">{t('moreNavigation')}</span>
            </button>
          )}
        </div>
      </nav>
      <MobileNavMoreSheet isOpen={moreOpen} onClose={() => setMoreOpen(false)} navGroups={navGroups} primaryHrefs={navHrefs} />
    </>
  );
}
