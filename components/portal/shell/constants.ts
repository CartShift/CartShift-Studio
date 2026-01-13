import { cva } from 'class-variance-authority';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  FolderOpen,
  Kanban,
  DollarSign,
  Calendar,
  Star,
  Settings,
  TrendingUp,
} from 'lucide-react';
import { NavGroup } from './types';
import { getPortalPath } from '@/lib/utils/portal-paths';

export const navItemVariants = cva('portal-nav-item group relative transition-all duration-200', {
  variants: {
    isActive: {
      true: 'portal-nav-item-active text-blue-600 dark:text-blue-400 font-bold bg-blue-50/50 dark:bg-blue-500/10',
      false:
        'text-surface-600 dark:text-surface-400 hover:bg-surface-100/60 dark:hover:bg-surface-800/40 hover:text-surface-900 dark:hover:text-white',
    },
    isCollapsed: {
      true: 'md:justify-center md:px-0',
      false: '',
    },
  },
  defaultVariants: {
    isActive: false,
    isCollapsed: false,
  },
});

export function getAgencyNavGroups(t: (key: string) => string): NavGroup[] {
  return [
    {
      items: [
        {
          label: t('portal.sidebar.nav.workboard'),
          icon: Kanban,
          href: getPortalPath('/agency/workboard/'),
        },
        {
          label: t('portal.sidebar.nav.sales'),
          icon: TrendingUp,
          href: getPortalPath('/agency/sales/'),
        },
      ],
    },
    {
      items: [
        {
          label: t('portal.sidebar.nav.clients'),
          icon: Users,
          href: getPortalPath('/agency/clients/'),
        },
        {
          label: t('portal.sidebar.nav.requests'),
          icon: ClipboardList,
          href: getPortalPath('/requests/'),
        },
        {
          label: t('portal.sidebar.nav.consultations'),
          icon: Calendar,
          href: getPortalPath('/agency/consultations/'),
        },
      ],
    },
    {
      items: [
        {
          label: t('portal.sidebar.nav.pricing'),
          icon: DollarSign,
          href: getPortalPath('/agency/pricing/'),
        },
        {
          label: t('portal.sidebar.nav.testimonials'),
          icon: Star,
          href: getPortalPath('/agency/testimonials/'),
        },
      ],
    },
    {
      items: [
        {
          label: t('portal.sidebar.nav.settings'),
          icon: Settings,
          href: getPortalPath('/agency/settings/'),
        },
      ],
    },
  ];
}

export function getClientNavGroups(t: (key: string) => string): NavGroup[] {
  return [
    {
      items: [
        {
          label: t('portal.sidebar.nav.dashboard'),
          icon: LayoutDashboard,
          href: getPortalPath('/dashboard/'),
        },
        {
          label: t('portal.sidebar.nav.requests'),
          icon: ClipboardList,
          href: getPortalPath('/requests/'),
        },
      ],
    },
    {
      items: [
        {
          label: t('portal.sidebar.nav.team'),
          icon: Users,
          href: getPortalPath('/team/'),
        },
        {
          label: t('portal.sidebar.nav.files'),
          icon: FolderOpen,
          href: getPortalPath('/files/'),
        },
        {
          label: t('portal.sidebar.nav.consultations'),
          icon: Calendar,
          href: getPortalPath('/consultations/'),
        },
      ],
    },
    {
      items: [
        {
          label: t('portal.sidebar.nav.pricing'),
          icon: DollarSign,
          href: getPortalPath('/pricing/'),
        },
        {
          label: t('portal.sidebar.nav.review'),
          icon: Star,
          href: getPortalPath('/review/'),
        },
      ],
    },
    {
      items: [
        {
          label: t('portal.sidebar.nav.settings'),
          icon: Settings,
          href: getPortalPath('/settings/'),
        },
      ],
    },
  ];
}
