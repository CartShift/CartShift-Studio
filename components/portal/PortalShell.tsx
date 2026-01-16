/**
 * PortalShell - Main layout shell for the client portal
 *
 * This file now re-exports from the modular shell directory.
 * The component has been decomposed into focused sub-components:
 *
 * - PortalShell.tsx - Main orchestrator
 * - PortalSidebar.tsx - Sidebar container
 * - SidebarBrand.tsx - Logo and title
 * - SidebarNavigation.tsx - Navigation items
 * - OrganizationSwitcher.tsx - Org dropdown
 * - SidebarFooter.tsx - Collapse/Logout
 * - PortalState.tsx -  spinner
 * - PortalAccessDenied.tsx - Access denied screen
 * - hooks/usePortalShellState.ts - Consolidated state logic
 * - constants.ts - Nav groups and variants
 * - types.ts - TypeScript interfaces
 *
 * @see components/portal/shell/
 */
export { PortalShell } from './shell';
