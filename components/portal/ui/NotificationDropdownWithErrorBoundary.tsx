'use client';

import { PortalErrorBoundary } from './ErrorBoundary';
import type { NotificationDropdownProps } from './NotificationDropdown';
import { NotificationDropdown as NotificationDropdownComponent } from './NotificationDropdown';

export function NotificationDropdownWithErrorBoundary(props: NotificationDropdownProps) {
  return (
    <PortalErrorBoundary fallback={null}>
      <NotificationDropdownComponent {...props} />
    </PortalErrorBoundary>
  );
}
