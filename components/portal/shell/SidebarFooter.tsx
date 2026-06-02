'use client';

import { ChevronLeft, LogOut, HelpCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { getHelpPath } from '@/lib/portal/help-topics';
import { cn } from '@/lib/utils';
import { SidebarFooterProps } from './types';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { Tooltip } from '@/components/ui/Tooltip';

export function SidebarFooter({
  isExpanded,
  isSidebarOpen,
  isAgency = false,
  onToggleSidebar,
  onSignOut,
}: SidebarFooterProps) {
  const t = useTranslations('portal');
  const tA11y = useTranslations('portal.accessibility');
  const helpHref = getHelpPath(isAgency);

  const helpLink = (
    <Link
      href={helpHref}
      className={cn(
        'portal-focus-ring flex items-center gap-2 w-full px-2.5 py-2 rounded-lg text-surface-400 hover:bg-white/5 hover:text-surface-100 transition-all font-semibold text-[13px]',
        !isExpanded && 'justify-center px-0'
      )}
      aria-label={tA11y('helpCenter')}
    >
      <HelpCircle size={20} className="flex-shrink-0" aria-hidden />
      {isExpanded && <span>{t('sidebar.help')}</span>}
    </Link>
  );

  return (
    <div className="flex-shrink-0 p-2.5 border-t border-surface-800/40 space-y-1.5">
      <div className="flex md:hidden items-center gap-1.5 p-1.5 bg-surface-100/80 dark:bg-surface-800/60 rounded-2xl border border-surface-200/60 dark:border-surface-700/40 backdrop-blur-sm w-fit">
        <LanguageSwitcher />
        <div className="w-[1px] h-5 bg-surface-300/60 dark:bg-surface-600/50" />
        <ThemeToggle />
      </div>

      {!isExpanded ? (
        <Tooltip content={t('sidebar.help')} side="end" delay={0.15}>
          {helpLink}
        </Tooltip>
      ) : (
        helpLink
      )}

      <button
        onClick={onToggleSidebar}
        className={cn(
          'portal-focus-ring hidden md:flex items-center gap-3 portal-nav-item w-full touch-target-sm',
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
          'portal-focus-ring flex items-center gap-2 w-full px-2.5 py-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all font-semibold text-[13px] touch-target-sm',
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
