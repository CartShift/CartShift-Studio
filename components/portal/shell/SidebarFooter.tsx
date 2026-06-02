'use client';

import { ChevronLeft, LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { SidebarFooterProps } from './types';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

export function SidebarFooter({
  isExpanded,
  isSidebarOpen,
  onToggleSidebar,
  onSignOut,
}: SidebarFooterProps) {
  const t = useTranslations('portal');
  const tA11y = useTranslations('portal.accessibility');

  return (
    <div className="flex-shrink-0 p-2.5 border-t border-surface-200/50 dark:border-surface-800/30 space-y-1.5">
      {/* Language & Theme Controls - Mobile only */}
      <div className="flex md:hidden items-center gap-1.5 p-1.5 bg-surface-100/80 dark:bg-surface-800/60 rounded-2xl border border-surface-200/60 dark:border-surface-700/40 backdrop-blur-sm w-fit">
        <LanguageSwitcher />
        <div className="w-[1px] h-5 bg-surface-300/60 dark:bg-surface-600/50" />
        <ThemeToggle />
      </div>

      <button
        onClick={onToggleSidebar}
        className={cn(
          'portal-focus-ring hidden md:flex items-center gap-3 portal-nav-item w-full',
          !isExpanded && 'justify-center px-0'
        )}
        aria-label={isSidebarOpen ? tA11y('collapseSidebar') : tA11y('expandSidebar')}
      >
        <div className="transition-transform duration-500">
          <ChevronLeft size={20} className="rtl:rotate-180" />
        </div>
        {isExpanded && <span className="text-[13px] font-bold">{t('sidebar.collapse')}</span>}
      </button>

      <button
        onClick={onSignOut}
        className={cn(
          'portal-focus-ring flex items-center gap-2 w-full px-2.5 py-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all font-semibold text-[13px]',
          !isExpanded && 'justify-center px-0'
        )}
        aria-label={tA11y('signOut')}
      >
        <LogOut
          size={20}
          className="flex-shrink-0 group-hover:ltr:translate-x-1 group-hover:rtl:-translate-x-1 transition-transform"
        />
        {isExpanded && <span>{t('sidebar.signOut')}</span>}
      </button>
    </div>
  );
}
