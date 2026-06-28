'use client';

import { ReactNode, Suspense } from 'react';
import { OrgProvider } from '@/lib/context/OrgContext';
import { RequestPreviewProvider } from '@/lib/context/RequestPreviewContext';
import { ImpersonationProvider } from '@/lib/context/ImpersonationContext';
import { UserPreferencesProvider } from '@/components/providers/UserPreferencesProvider';

interface PortalProvidersProps {
  children: ReactNode;
}

export function PortalProviders({ children }: PortalProvidersProps) {
  return (
    <ImpersonationProvider>
      <OrgProvider>
        <Suspense fallback={null}>
          <RequestPreviewProvider>
            <UserPreferencesProvider>{children}</UserPreferencesProvider>
          </RequestPreviewProvider>
        </Suspense>
      </OrgProvider>
    </ImpersonationProvider>
  );
}
