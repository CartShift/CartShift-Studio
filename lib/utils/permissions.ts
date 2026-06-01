import { USER_ROLE, UserRole } from '@/lib/types/portal';

export const PERMISSIONS = {
  // General Access
  VIEW_AGENCY_PORTAL: [
    USER_ROLE.OWNER,
    USER_ROLE.ADMIN,
    USER_ROLE.SALES_MANAGER,
    USER_ROLE.DEVELOPER,
    USER_ROLE.MEMBER,
    USER_ROLE.VIEWER,
  ],
  VIEW_CLIENT_PORTAL: [USER_ROLE.ADMIN, USER_ROLE.MEMBER, USER_ROLE.VIEWER], // For now, simple client roles

  // Feature Areas
  MANAGE_TEAM: [USER_ROLE.OWNER, USER_ROLE.ADMIN],
  MANAGE_SETTINGS: [USER_ROLE.OWNER, USER_ROLE.ADMIN],
  VIEW_SALES_DASHBOARD: [USER_ROLE.OWNER, USER_ROLE.ADMIN, USER_ROLE.SALES_MANAGER],
  VIEW_PROFIT_SPLITS: [USER_ROLE.OWNER, USER_ROLE.ADMIN, USER_ROLE.SALES_MANAGER],
  MANAGE_PROFIT_SPLITS: [USER_ROLE.OWNER, USER_ROLE.ADMIN, USER_ROLE.SALES_MANAGER],
  MANAGE_CLIENTS: [USER_ROLE.OWNER, USER_ROLE.ADMIN, USER_ROLE.SALES_MANAGER],
  MANAGE_PRICING: [USER_ROLE.OWNER, USER_ROLE.ADMIN, USER_ROLE.SALES_MANAGER],
  VIEW_DEVELOPER_TOOLS: [USER_ROLE.OWNER, USER_ROLE.ADMIN, USER_ROLE.DEVELOPER],

  // Actions
  CREATE_REQUEST: [
    USER_ROLE.OWNER,
    USER_ROLE.ADMIN,
    USER_ROLE.SALES_MANAGER,
    USER_ROLE.DEVELOPER,
    USER_ROLE.MEMBER,
  ],
  DELETE_REQUEST: [USER_ROLE.OWNER, USER_ROLE.ADMIN],
  APPROVE_PROPOSAL: [USER_ROLE.OWNER, USER_ROLE.ADMIN], // Client side mostly
} as const;

export function hasPermission(
  role: UserRole | undefined,
  allowedRoles: readonly UserRole[]
): boolean {
  if (!role) return false;
  return allowedRoles.includes(role);
}

export function canAccessNav(role: UserRole | undefined, itemRoles?: readonly UserRole[]): boolean {
  if (!itemRoles || itemRoles.length === 0) return true;
  return hasPermission(role, itemRoles);
}
