import * as React from 'react';
import { Button } from '@react-email/components';
import { theme } from '../theme';

interface ActionButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  fullWidth?: boolean;
}

export const ActionButton = ({
  href,
  children,
  variant = 'primary',
  fullWidth = false,
}: ActionButtonProps) => {
  const isPrimary = variant === 'primary';

  const buttonStyle = {
    ...styles.base,
    ...(isPrimary ? styles.primary : styles.secondary),
    ...(fullWidth ? styles.fullWidth : {}),
  };

  return (
    <Button href={href} style={buttonStyle}>
      {children}
    </Button>
  );
};

const styles = {
  base: {
    display: 'inline-block',
    padding: '12px 24px',
    borderRadius: theme.borderRadius.md,
    fontSize: theme.fontSize.base,
    fontWeight: '600',
    textDecoration: 'none',
    textAlign: 'center' as const,
    cursor: 'pointer',
  },
  primary: {
    backgroundColor: theme.colors.primary,
    color: '#ffffff',
  },
  secondary: {
    backgroundColor: '#ffffff',
    color: theme.colors.primary,
    border: `1px solid ${theme.colors.primary}`,
  },
  fullWidth: {
    display: 'block',
    width: '100%',
  },
};
