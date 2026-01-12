'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { navItemVariants } from './constants';
import { SidebarNavigationProps } from './types';

export function SidebarNavigation({
  navGroups,
  isExpanded,
  isMobile,
  onItemClick,
}: SidebarNavigationProps) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 overflow-y-auto overflow-x-hidden portal-scrollbar p-3 space-y-0.5 min-h-0">
      {navGroups.map((group, groupIndex) => (
        <div key={groupIndex}>
          {groupIndex > 0 && (
            <div className="mx-4 my-2 border-t border-surface-200/50 dark:border-surface-800/30" />
          )}
          {group.items.map(item => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                onClick={() => {
                  if (isMobile) onItemClick();
                }}
                className={cn(navItemVariants({ isActive, isCollapsed: !isExpanded }))}
                title={!isExpanded ? item.label : undefined}
              >
                <item.icon
                  size={18}
                  className={cn(
                    'transition-all duration-300 flex-shrink-0',
                    isActive
                      ? 'text-current'
                      : 'opacity-60 group-hover:opacity-100 group-hover:scale-110'
                  )}
                />
                {isExpanded && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm font-bold truncate flex-1"
                  >
                    {item.label}
                  </motion.span>
                )}
                {isActive && isExpanded && (
                  <motion.div
                    layoutId="nav-active-indicator"
                    className="absolute w-1 h-6 bg-blue-600 rounded-full start-0"
                  />
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
