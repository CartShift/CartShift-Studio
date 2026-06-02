'use client';

import { useId, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PortalSettingsSectionProps {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function PortalSettingsSection({
  title,
  description,
  defaultOpen = false,
  icon,
  children,
  className,
}: PortalSettingsSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <section
      className={cn(
        'rounded-xl border border-surface-200 dark:border-surface-800 overflow-hidden bg-white dark:bg-surface-950',
        className
      )}
    >
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        aria-expanded={open}
        aria-controls={panelId}
        className="portal-focus-ring w-full flex items-center justify-between gap-3 p-4 text-start bg-surface-50/80 dark:bg-surface-900/40 hover:bg-surface-100 dark:hover:bg-surface-900/60 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          {icon}
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-surface-900 dark:text-white font-outfit truncate">
              {title}
            </h4>
            {description ? (
              <p className="portal-label-sm mt-0.5 line-clamp-2">{description}</p>
            ) : null}
          </div>
        </div>
        <ChevronDown
          className={cn(
            'w-5 h-5 text-surface-400 shrink-0 transition-transform duration-200',
            open && 'rotate-180'
          )}
          aria-hidden
        />
      </button>
      {open ? (
        <div
          id={panelId}
          className="p-4 sm:p-5 border-t border-surface-100 dark:border-surface-800"
        >
          {children}
        </div>
      ) : null}
    </section>
  );
}
