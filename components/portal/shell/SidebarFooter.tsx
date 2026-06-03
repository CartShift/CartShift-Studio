'use client';

import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

export function SidebarFooter() {
  return (
    <div className="flex-shrink-0 p-2.5 border-t border-surface-800/40 md:hidden">
      <div className="flex items-center gap-1.5 p-1.5 bg-surface-100/80 dark:bg-surface-800/60 rounded-2xl border border-surface-200/60 dark:border-surface-700/40 backdrop-blur-sm w-fit">
        <LanguageSwitcher />
        <div className="w-[1px] h-5 bg-surface-300/60 dark:bg-surface-600/50" />
        <ThemeToggle />
      </div>
    </div>
  );
}
