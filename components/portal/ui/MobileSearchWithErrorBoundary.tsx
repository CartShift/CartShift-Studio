'use client';

import { PortalErrorBoundary } from './ErrorBoundary';
import type { MobileSearchProps } from './MobileSearch';
import { MobileSearch as MobileSearchComponent } from './MobileSearch';

export function MobileSearchWithErrorBoundary(props: MobileSearchProps) {
  return (
    <PortalErrorBoundary fallback={null}>
      <MobileSearchComponent {...props} />
    </PortalErrorBoundary>
  );
}
