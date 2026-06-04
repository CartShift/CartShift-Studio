import * as React from 'react';
import { Text } from '@react-email/components';
import { theme } from '../theme';

export type StatusType = 'info' | 'success' | 'warning' | 'error' | 'neutral';

interface StatusBadgeProps {
  children: React.ReactNode;
  type?: StatusType;
}

export const StatusBadge = ({ children, type = 'neutral' }: StatusBadgeProps) => {
  const style = styles[type] || styles.neutral;

  return <Text style={{ ...styles.base, ...style }}>{children}</Text>;
};

const baseStyle = {
  display: 'inline-block',
  padding: '7px 14px',
  borderRadius: theme.borderRadius.full,
  fontSize: theme.fontSize.xs,
  fontWeight: '700',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.8px',
  margin: '0',
  border: `1px solid ${theme.colors.border}`,
  lineHeight: '1.2',
};

const styles = {
  base: baseStyle,
  neutral: {
    backgroundColor: '#f1f5f9',
    color: '#475569',
    borderColor: '#cbd5e1',
  },
  info: {
    backgroundColor: theme.colors.info.bg,
    color: theme.colors.info.text,
    borderColor: theme.colors.info.border,
  },
  success: {
    backgroundColor: theme.colors.success.bg,
    color: theme.colors.success.text,
    borderColor: theme.colors.success.border,
  },
  warning: {
    backgroundColor: theme.colors.warning.bg,
    color: theme.colors.warning.text,
    borderColor: theme.colors.warning.border,
  },
  error: {
    backgroundColor: theme.colors.error.bg,
    color: theme.colors.error.text,
    borderColor: theme.colors.error.border,
  },
};
