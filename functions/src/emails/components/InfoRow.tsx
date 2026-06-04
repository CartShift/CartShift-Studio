import * as React from 'react';
import { Section, Text, Column, Row } from '@react-email/components';
import { theme } from '../theme';

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
  isTotal?: boolean;
  valueAlign?: 'left' | 'right' | 'center';
}

export const InfoRow = ({ label, value, isTotal = false, valueAlign = 'right' }: InfoRowProps) => {
  return (
    <Section style={styles.row}>
      <Row>
        <Column>
          <Text style={{ ...styles.label, ...(isTotal ? styles.totalLabel : {}) }}>{label}</Text>
        </Column>
        <Column align={valueAlign}>
          <Text style={{ ...styles.value, ...(isTotal ? styles.totalValue : {}) }}>{value}</Text>
        </Column>
      </Row>
    </Section>
  );
};

const styles = {
  row: {
    padding: '11px 0',
    borderBottom: `1px solid ${theme.colors.border}`,
  },
  label: {
    margin: '0',
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: '600',
    lineHeight: '1.5',
  },
  value: {
    margin: '0',
    fontSize: theme.fontSize.base,
    color: theme.colors.text.primary,
    fontWeight: '700',
    lineHeight: '1.5',
  },
  totalLabel: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text.primary,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: theme.fontSize.xl,
    color: theme.colors.primary,
    fontWeight: '800',
  },
};
