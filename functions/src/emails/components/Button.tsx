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
  const buttonStyle = {
    ...styles.base,
    ...styles[variant],
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
    padding: '15px 30px',
    borderRadius: '12px',
    fontSize: theme.fontSize.base,
    fontWeight: '700',
    textDecoration: 'none',
    textAlign: 'center' as const,
    cursor: 'pointer',
    lineHeight: '1.2',
    boxShadow: '0 14px 26px rgba(37, 99, 235, 0.24)',
  },
  primary: {
    backgroundColor: theme.colors.primary,
    color: '#ffffff',
    border: `1px solid ${theme.colors.primaryDark}`,
  },
  secondary: {
    backgroundColor: theme.colors.primarySoft,
    color: theme.colors.primary,
    border: `1px solid ${theme.colors.info.border}`,
    boxShadow: 'none',
  },
  outline: {
    backgroundColor: '#ffffff',
    color: theme.colors.text.primary,
    border: `1px solid ${theme.colors.borderStrong}`,
    boxShadow: 'none',
  },
  fullWidth: {
    display: 'block',
    width: '100%',
  },
};
