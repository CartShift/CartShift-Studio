import { LucideIcon } from 'lucide-react';
import { Organization } from '@/lib/types/portal';

export interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
  roles?: readonly import('@/lib/types/portal').UserRole[];
}

export type NavGroupLabelKey =
  | 'sidebar.groups.operations'
  | 'sidebar.groups.clients'
  | 'sidebar.groups.growth'
  | 'sidebar.groups.settings'
  | 'sidebar.groups.overview'
  | 'sidebar.groups.workspace'
  | 'sidebar.groups.billing';

export type NavGroupAbbrevKey =
  | 'sidebar.groupsAbbrev.operations'
  | 'sidebar.groupsAbbrev.clients'
  | 'sidebar.groupsAbbrev.growth'
  | 'sidebar.groupsAbbrev.settings'
  | 'sidebar.groupsAbbrev.overview'
  | 'sidebar.groupsAbbrev.workspace'
  | 'sidebar.groupsAbbrev.billing';

const NAV_GROUP_ABBREV: Record<NavGroupLabelKey, NavGroupAbbrevKey> = {
  'sidebar.groups.operations': 'sidebar.groupsAbbrev.operations',
  'sidebar.groups.clients': 'sidebar.groupsAbbrev.clients',
  'sidebar.groups.growth': 'sidebar.groupsAbbrev.growth',
  'sidebar.groups.settings': 'sidebar.groupsAbbrev.settings',
  'sidebar.groups.overview': 'sidebar.groupsAbbrev.overview',
  'sidebar.groups.workspace': 'sidebar.groupsAbbrev.workspace',
  'sidebar.groups.billing': 'sidebar.groupsAbbrev.billing',
};

export function getNavGroupAbbrevKey(labelKey: NavGroupLabelKey): NavGroupAbbrevKey {
  return NAV_GROUP_ABBREV[labelKey];
}

export interface NavGroup {
  id: string;
  labelKey?: NavGroupLabelKey;
  items: NavItem[];
}

export interface PortalShellProps {
  children: React.ReactNode;
  /** @deprecated orgId is now managed via OrgContext */
  orgId?: string;
  isAgency?: boolean;
}

export interface PortalSidebarProps {
  isExpanded: boolean;
  isMobileMenuOpen: boolean;
  onMobileMenuOpenChange: (open: boolean) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  children: React.ReactNode;
  viewTransitionName?: string;
  sidebarRef?: React.RefObject<HTMLElement | null>;
  mobileMenuLabel?: string;
}

export interface SidebarBrandProps {
  isExpanded: boolean;
  isAgency?: boolean;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export interface SidebarNavigationProps {
  navGroups: NavGroup[];
  isExpanded: boolean;
  isMobile: boolean;
  onItemClick: () => void;
  userRole?: import('@/lib/types/portal').UserRole;
}

export interface OrganizationSwitcherProps {
  organizations: Organization[];
  currentOrgId: string | null;
  onSwitch: (orgId: string) => void;
  isExpanded: boolean;
}

export interface NotificationPosition {
  top: number;
  right?: number;
  left?: number;
}
