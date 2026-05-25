'use client';

import { ReactNode } from 'react';
import { OrgProvider } from '@/lib/context/OrgContext';
import { ImpersonationProvider } from '@/lib/context/ImpersonationContext';
import { UserPreferencesProvider } from '@/components/providers/UserPreferencesProvider';

interface PortalProvidersProps {
  children: ReactNode;
}

export function PortalProviders({ children }: PortalProvidersProps) {
  return (
    <ImpersonationProvider>
      <OrgProvider>
        <UserPreferencesProvider>{children}</UserPreferencesProvider>
      </OrgProvider>
    </ImpersonationProvider>
  );
}
