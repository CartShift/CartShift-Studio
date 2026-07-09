'use client';

import { cn } from '@/lib/utils';
import { usePortalTranslations } from '@/lib/i18n/translations';
import {
  Plus,
  Calendar,
  Upload,
  Zap,
  ArrowRight,
  LucideIcon,
  Users,
  BarChart,
  FilePlus,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Link } from '@/i18n/navigation';
import { useResolvedOrgId } from '@/lib/hooks/useResolvedOrgId';
import { getPortalPath } from '@/lib/utils/portal-paths';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { portalIconSurfaceVariants, type PortalIconSurfaceTone } from '@/lib/utils/portal-visual';

interface Action {
  icon: LucideIcon;
  label: string;
  href: string;
  tone: PortalIconSurfaceTone;
}

export function QuickActions() {
  const t = usePortalTranslations();
  const orgId = useResolvedOrgId();
  const { isAgency } = usePortalAuth();

  if (!orgId) return null;

  const clientActions: Action[] = [
    {
      icon: Plus,
      label: t('quickActions.newRequest'),
      href: getPortalPath('/requests/new/'),
      tone: 'primary',
    },
    {
      icon: Calendar,
      label: t('quickActions.schedule'),
      href: getPortalPath('/consultations?action=schedule'),
      tone: 'accent',
    },
    {
      icon: Upload,
      label: t('quickActions.upload'),
      href: getPortalPath('/requests?action=upload'),
      tone: 'success',
    },
  ];

  const agencyActions: Action[] = [
    {
      icon: Users,
      label: t('quickActions.addClient'),
      href: getPortalPath('/agency/clients/new'),
      tone: 'primary',
    },
    {
      icon: FilePlus,
      label: t('quickActions.createProposal'),
      href: getPortalPath('/requests/new'),
      tone: 'accent',
    },
    {
      icon: BarChart,
      label: t('quickActions.viewReports'),
      href: getPortalPath('/agency/sales'),
      tone: 'success',
    },
  ];

  const actions = isAgency ? agencyActions : clientActions;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 mb-5">
      <div className="md:col-span-1 flex items-center">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className={cn(portalIconSurfaceVariants({ tone: 'warning', size: 'sm' }))}>
              <Zap size={16} className="text-white fill-white" />
            </div>
            <h2 className="text-lg font-semibold text-surface-900 dark:text-white font-outfit">
              {t('quickActions.title')}
            </h2>
          </div>
          <p className="text-sm text-surface-500 dark:text-surface-400">
            {t('quickActions.subtitle')}
          </p>
        </div>
      </div>

      <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {actions.map(action => (
          <Link
            key={action.href}
            href={action.href}
            className="group rounded-xl portal-focus-ring focus-visible:rounded-xl"
          >
            <Card variant="interactive" hoverEffect="lift" className="h-full" noPadding>
              <div className="p-3 flex items-center gap-3">
                <div className={cn(portalIconSurfaceVariants({ tone: action.tone, size: 'lg' }))}>
                  <action.icon size={18} className="stroke-[2.5]" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="font-semibold text-sm text-surface-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors block truncate">
                    {action.label}
                  </span>
                </div>
                <ArrowRight
                  size={14}
                  className="text-surface-300 dark:text-surface-600 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 rtl:translate-x-2 rtl:group-hover:translate-x-0 rtl:rotate-180 shrink-0"
                />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
