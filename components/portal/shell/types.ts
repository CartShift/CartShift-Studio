import { LucideIcon } from 'lucide-react';
import { Organization } from '@/lib/types/portal';

export interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
  roles?: readonly import('@/lib/types/portal').UserRole[];
}

export interface NavGroup {
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
  onClose: () => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  children: React.ReactNode;
}

export interface SidebarBrandProps {
  isExpanded: boolean;
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

export interface SidebarFooterProps {
  isExpanded: boolean;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onSignOut: () => void;
}

export interface NotificationPosition {
  top: number;
  right?: number;
  left?: number;
}
