'use client';

import { ReactNode } from 'react';
import { ToastProvider } from '@/components/portal/ui';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { OrgProvider } from '@/lib/context/OrgContext';
import { ImpersonationProvider } from '@/lib/context/ImpersonationContext';
import { useDirection } from '@/lib/i18n-utils';

interface PortalProvidersProps {
  children: ReactNode;
}

export function PortalProviders({ children }: PortalProvidersProps) {
  const direction = useDirection();
  const toastPosition = direction === 'rtl' ? 'bottom-left' : 'bottom-right';

  return (
    <QueryProvider>
      <ImpersonationProvider>
        <OrgProvider>
          <ToastProvider position={toastPosition} maxToasts={5}>
            {children}
          </ToastProvider>
        </OrgProvider>
      </ImpersonationProvider>
    </QueryProvider>
  );
}
