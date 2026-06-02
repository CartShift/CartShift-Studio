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
    padding: '14px 28px',
    borderRadius: '10px',
    fontSize: theme.fontSize.base,
    fontWeight: '700',
    textDecoration: 'none',
    textAlign: 'center' as const,
    cursor: 'pointer',
    boxShadow: '0 8px 18px rgba(37, 99, 235, 0.20)',
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
