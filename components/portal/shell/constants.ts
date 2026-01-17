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

// Define valid navigation translation keys
type NavTranslationKey =
  | 'portal.sidebar.nav.dashboard'
  | 'portal.sidebar.nav.requests'
  | 'portal.sidebar.nav.pricing'
  | 'portal.sidebar.nav.files'
  | 'portal.sidebar.nav.settings'
  | 'portal.sidebar.nav.team'
  | 'portal.sidebar.nav.consultations'
  | 'portal.sidebar.nav.review'
  | 'portal.sidebar.nav.workboard'
  | 'portal.sidebar.nav.sales'
  | 'portal.sidebar.nav.clients'
  | 'portal.sidebar.nav.pricing'
  | 'portal.sidebar.nav.testimonials'
  | 'portal.sidebar.nav.help'
  | 'portal.sidebar.nav.agency_dashboard'
  | 'portal.sidebar.nav.agency_settings';

// Type-safe translation function for navigation
interface NavTranslationFunction {
  (key: NavTranslationKey): string;
}

export const navItemVariants = cva('portal-nav-item group relative transition-all duration-200', {
  variants: {
    isActive: {
      true: 'portal-nav-item-active text-primary-600 dark:text-primary-400 font-bold bg-primary-50/50 dark:bg-primary-500/10',
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

import { PERMISSIONS } from '@/lib/utils/permissions';

export function getAgencyNavGroups(t: NavTranslationFunction): NavGroup[] {
  return [
    {
      items: [
        {
          label: t('portal.sidebar.nav.workboard'),
          icon: Kanban,
          href: getPortalPath('/agency/workboard/'),
          // Accessible by all agency members
        },
        {
          label: t('portal.sidebar.nav.sales'),
          icon: TrendingUp,
          href: getPortalPath('/agency/sales/'),
          roles: PERMISSIONS.VIEW_SALES_DASHBOARD,
        },
      ],
    },
    {
      items: [
        {
          label: t('portal.sidebar.nav.clients'),
          icon: Users,
          href: getPortalPath('/agency/clients/'),
          roles: PERMISSIONS.MANAGE_CLIENTS,
        },
        {
          label: t('portal.sidebar.nav.requests'),
          icon: ClipboardList,
          href: getPortalPath('/requests/'),
          // Accessible by all
        },
        {
          label: t('portal.sidebar.nav.consultations'),
          icon: Calendar,
          href: getPortalPath('/agency/consultations/'),
          roles: PERMISSIONS.MANAGE_CLIENTS,
        },
      ],
    },
    {
      items: [
        {
          label: t('portal.sidebar.nav.pricing'),
          icon: DollarSign,
          href: getPortalPath('/agency/pricing/'),
          roles: PERMISSIONS.MANAGE_PRICING,
        },
        {
          label: t('portal.sidebar.nav.testimonials'),
          icon: Star,
          href: getPortalPath('/agency/testimonials/'),
          roles: PERMISSIONS.MANAGE_CLIENTS,
        },
      ],
    },
    {
      items: [
        {
          label: t('portal.sidebar.nav.settings'),
          icon: Settings,
          href: getPortalPath('/agency/settings/'),
          roles: PERMISSIONS.MANAGE_SETTINGS,
        },
      ],
    },
  ];
}

export function getClientNavGroups(t: NavTranslationFunction): NavGroup[] {
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
