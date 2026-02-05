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
  padding: '6px 16px',
  borderRadius: theme.borderRadius.full,
  fontSize: theme.fontSize.sm,
  fontWeight: '700',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0',
};

const styles = {
  base: baseStyle,
  neutral: {
    backgroundColor: '#f1f5f9',
    color: '#475569',
  },
  info: theme.colors.info,
  success: theme.colors.success,
  warning: theme.colors.warning,
  error: theme.colors.error,
};
