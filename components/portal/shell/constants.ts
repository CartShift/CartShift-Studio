import { cva } from 'class-variance-authority';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  FolderOpen,
  Kanban,
  DollarSign,
  PieChart,
  Calendar,
  Star,
  Settings,
  TrendingUp,
  Mail,
  Calculator,
} from 'lucide-react';
import { NavGroup } from './types';
import { getPortalPath } from '@/lib/utils/portal-paths';

// Define valid navigation translation keys
type NavTranslationKey =
  | 'sidebar.nav.dashboard'
  | 'sidebar.nav.requests'
  | 'sidebar.nav.pricing'
  | 'sidebar.nav.files'
  | 'sidebar.nav.settings'
  | 'sidebar.nav.team'
  | 'sidebar.nav.consultations'
  | 'sidebar.nav.review'
  | 'sidebar.nav.workboard'
  | 'sidebar.nav.sales'
  | 'sidebar.nav.marketing'
  | 'sidebar.nav.emailPreviews'
  | 'sidebar.nav.profitSplits'
  | 'sidebar.nav.clients'
  | 'sidebar.nav.pricing'
  | 'sidebar.nav.testimonials'
  | 'sidebar.nav.calculator'
  | 'sidebar.nav.help'
  | 'sidebar.nav.agency_dashboard'
  | 'sidebar.nav.agency_settings';

// Type-safe translation function for navigation
interface NavTranslationFunction {
  (key: NavTranslationKey): string;
}

export const navItemVariants = cva(
  'portal-nav-item portal-focus-ring group relative transition-all duration-200',
  {
    variants: {
      isActive: {
        true: 'portal-nav-item-active text-primary-300 font-bold bg-primary-500/10',
        false: 'text-surface-400 hover:bg-white/5 hover:text-surface-100',
      },
      isCollapsed: {
        true: 'md:flex-col md:items-center md:justify-center md:gap-0.5 md:px-1 md:py-2 md:min-h-[52px]',
        false: '',
      },
    },
    defaultVariants: {
      isActive: false,
      isCollapsed: false,
    },
  }
);

import { PERMISSIONS } from '@/lib/utils/permissions';

export function getAgencyNavGroups(t: NavTranslationFunction): NavGroup[] {
  return [
    {
      id: 'agency-operations',
      labelKey: 'sidebar.groups.operations',
      items: [
        {
          label: t('sidebar.nav.workboard'),
          icon: Kanban,
          href: getPortalPath('/agency/workboard/'),
          // Accessible by all agency members
        },
        {
          label: t('sidebar.nav.sales'),
          icon: TrendingUp,
          href: getPortalPath('/agency/sales/'),
          roles: PERMISSIONS.VIEW_SALES_DASHBOARD,
        },
        {
          label: t('sidebar.nav.marketing'),
          icon: Mail,
          href: getPortalPath('/agency/leads/'),
          roles: PERMISSIONS.VIEW_SALES_DASHBOARD,
        },
        {
          label: t('sidebar.nav.profitSplits'),
          icon: PieChart,
          href: getPortalPath('/agency/profit-splits/'),
          roles: PERMISSIONS.VIEW_PROFIT_SPLITS,
        },
      ],
    },
    {
      id: 'agency-clients',
      labelKey: 'sidebar.groups.clients',
      items: [
        {
          label: t('sidebar.nav.clients'),
          icon: Users,
          href: getPortalPath('/agency/clients/'),
          roles: PERMISSIONS.MANAGE_CLIENTS,
        },
        {
          label: t('sidebar.nav.requests'),
          icon: ClipboardList,
          href: getPortalPath('/requests/'),
          // Accessible by all
        },
        {
          label: t('sidebar.nav.consultations'),
          icon: Calendar,
          href: getPortalPath('/agency/consultations/'),
          roles: PERMISSIONS.MANAGE_CLIENTS,
        },
      ],
    },
    {
      id: 'agency-growth',
      labelKey: 'sidebar.groups.growth',
      items: [
        {
          label: t('sidebar.nav.pricing'),
          icon: DollarSign,
          href: getPortalPath('/agency/pricing/'),
          roles: PERMISSIONS.MANAGE_PRICING,
        },
        {
          label: t('sidebar.nav.calculator'),
          icon: Calculator,
          href: getPortalPath('/agency/calculator/'),
          roles: PERMISSIONS.MANAGE_PRICING,
        },
        {
          label: t('sidebar.nav.testimonials'),
          icon: Star,
          href: getPortalPath('/agency/testimonials/'),
          roles: PERMISSIONS.MANAGE_CLIENTS,
        },
      ],
    },
    {
      id: 'agency-settings',
      labelKey: 'sidebar.groups.settings',
      items: [
        {
          label: t('sidebar.nav.settings'),
          icon: Settings,
          href: getPortalPath('/agency/settings/'),
          roles: PERMISSIONS.MANAGE_SETTINGS,
        },
        {
          label: t('sidebar.nav.emailPreviews'),
          icon: Mail,
          href: getPortalPath('/agency/email-preview/'),
          roles: PERMISSIONS.MANAGE_SETTINGS,
        },
      ],
    },
  ];
}

export function getClientNavGroups(t: NavTranslationFunction): NavGroup[] {
  return [
    {
      id: 'client-overview',
      labelKey: 'sidebar.groups.overview',
      items: [
        {
          label: t('sidebar.nav.dashboard'),
          icon: LayoutDashboard,
          href: getPortalPath('/dashboard/'),
        },
        {
          label: t('sidebar.nav.requests'),
          icon: ClipboardList,
          href: getPortalPath('/requests/'),
        },
      ],
    },
    {
      id: 'client-workspace',
      labelKey: 'sidebar.groups.workspace',
      items: [
        {
          label: t('sidebar.nav.team'),
          icon: Users,
          href: getPortalPath('/team/'),
        },
        {
          label: t('sidebar.nav.files'),
          icon: FolderOpen,
          href: getPortalPath('/files/'),
        },
        {
          label: t('sidebar.nav.consultations'),
          icon: Calendar,
          href: getPortalPath('/consultations/'),
        },
      ],
    },
    {
      id: 'client-billing',
      labelKey: 'sidebar.groups.billing',
      items: [
        {
          label: t('sidebar.nav.pricing'),
          icon: DollarSign,
          href: getPortalPath('/pricing/'),
        },
        {
          label: t('sidebar.nav.review'),
          icon: Star,
          href: getPortalPath('/review/'),
        },
      ],
    },
    {
      id: 'client-settings',
      labelKey: 'sidebar.groups.settings',
      items: [
        {
          label: t('sidebar.nav.settings'),
          icon: Settings,
          href: getPortalPath('/settings/'),
        },
      ],
    },
  ];
}
