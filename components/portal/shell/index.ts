// Re-export the main component for backwards compatibility
export { PortalShell } from './PortalShell';

// Export sub-components for potential reuse
export { PortalSidebar } from './PortalSidebar';
export { SidebarBrand } from './SidebarBrand';
export { SidebarNavigation } from './SidebarNavigation';
export { OrganizationSwitcher } from './OrganizationSwitcher';
export { SidebarFooter } from './SidebarFooter';
export { PortalState } from './PortalLoadingState';
export { PortalAccessDenied } from './PortalAccessDenied';

// Export types
export type {
  PortalShellProps,
  PortalSidebarProps,
  SidebarBrandProps,
  SidebarNavigationProps,
  OrganizationSwitcherProps,
  SidebarFooterProps,
  NavItem,
  NavGroup,
} from './types';

// Export constants
export { navItemVariants, getAgencyNavGroups, getClientNavGroups } from './constants';

// Export hook
export { usePortalShellState } from './hooks/usePortalShellState';
export { announcePortal } from './portal-announcer';
