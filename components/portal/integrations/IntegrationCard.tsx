'use client';

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface IntegrationCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconGradient?: string;
  comingSoon?: boolean;
  children?: React.ReactNode;
}

export default function IntegrationCard({
  title,
  description,
  icon: Icon,
  iconGradient = 'from-surface-400 to-surface-500',
  comingSoon = false,
  children,
}: IntegrationCardProps) {
  return (
    <div
      className={cn(
        'relative p-6 rounded-2xl border-2 transition-all',
        comingSoon
          ? 'bg-surface-50/50 dark:bg-surface-900/30 border-surface-100 dark:border-surface-800/50 opacity-60'
          : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800'
      )}
    >
      {comingSoon && (
        <span className="absolute top-4 end-4 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-surface-200 dark:bg-surface-700 text-surface-500">
          Coming Soon
        </span>
      )}

      <div className="flex items-start gap-4 mb-4">
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center shadow-md bg-gradient-to-br',
            iconGradient
          )}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-surface-900 dark:text-white font-outfit">
            {title}
          </h3>
          <p className="text-sm text-surface-500 dark:text-surface-400">{description}</p>
        </div>
      </div>

      {children}
    </div>
  );
}
