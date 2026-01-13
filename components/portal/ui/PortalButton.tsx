'use client';

import React from 'react';
import { Button, type ButtonProps, buttonVariants } from '@/components/ui/Button';

export interface PortalButtonProps extends Omit<ButtonProps, 'loading'> {
  isLoading?: boolean;
}

export const PortalButton = React.forwardRef<HTMLButtonElement, PortalButtonProps>(
  ({ isLoading, ...props }, ref) => {
    return <Button ref={ref} loading={isLoading} {...props} />;
  }
);
PortalButton.displayName = 'PortalButton';

export { buttonVariants };
