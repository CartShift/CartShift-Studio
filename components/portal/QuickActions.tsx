'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { Plus, Calendar, Upload, Zap, ArrowRight, LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Link } from '@/i18n/navigation';
import { useResolvedOrgId } from '@/lib/hooks/useResolvedOrgId';
import { getPortalPath } from '@/lib/utils/portal-paths';

const quickActionIconVariants = cva(
  'w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110',
  {
    variants: {
      intent: {
        blue: 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30',
        purple:
          'bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/30',
        emerald:
          'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30',
      },
    },
    defaultVariants: {
      intent: 'blue',
    },
  }
);

interface Action {
  icon: LucideIcon;
  label: string;
  href: string;
  intent: VariantProps<typeof quickActionIconVariants>['intent'];
}

export function QuickActions() {
  const t = useTranslations();
  const orgId = useResolvedOrgId();

  if (!orgId) return null;

  const actions: Action[] = [
    {
      icon: Plus,
      label: t('portal.quickActions.newRequest'),
      href: getPortalPath('/requests/new/'),
      intent: 'blue',
    },
    {
      icon: Calendar,
      label: t('portal.quickActions.schedule'),
      href: getPortalPath('/consultations?action=schedule'),
      intent: 'purple',
    },
    {
      icon: Upload,
      label: t('portal.quickActions.upload'),
      href: getPortalPath('/requests?action=upload'),
      intent: 'emerald',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div className="md:col-span-1 flex items-center">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/30">
              <Zap size={16} className="text-white fill-white" />
            </div>
            <h2 className="text-lg font-bold text-surface-900 dark:text-white font-outfit">
              {t('portal.quickActions.title')}
            </h2>
          </div>
          <p className="text-sm text-surface-500 dark:text-surface-400">
            {t('portal.quickActions.subtitle')}
          </p>
        </div>
      </div>

      <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {actions.map((action, idx) => (
          <Link key={idx} href={action.href} className="group">
            <Card variant="interactive" hoverEffect="lift" className="h-full border-glow" noPadding>
              <div className="p-3 flex items-center gap-3">
                <div
                  className={cn(
                    quickActionIconVariants({ intent: action.intent }),
                    'w-10 h-10 rounded-lg shrink-0'
                  )}
                >
                  <action.icon size={18} className="stroke-[2.5]" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-sm text-surface-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors block truncate">
                    {action.label}
                  </span>
                </div>
                <ArrowRight
                  size={14}
                  className="text-surface-300 dark:text-surface-600 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 shrink-0"
                />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
