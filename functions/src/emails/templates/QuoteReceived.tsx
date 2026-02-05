import { Section, Text, Heading, Hr } from '@react-email/components';
import { Layout } from '../components/Layout';
import { ActionButton } from '../components/Button';
import { theme } from '../theme';

interface QuoteReceivedProps {
  requestTitle: string;
  totalAmount: string;
  actionUrl: string;
}

export const QuoteReceived = ({ requestTitle, totalAmount, actionUrl }: QuoteReceivedProps) => {
  return (
    <Layout title="New Quote" preview={`You received a quote for ${requestTitle}`}>
      <Heading style={styles.heading}>Quote Ready for Review</Heading>

      <Text style={styles.intro}>
        We have prepared a quote for your request <strong>{requestTitle}</strong>.
      </Text>

      <Section style={styles.card}>
        <Text style={styles.amountLabel}>TOTAL ESTIMATE</Text>
        <Text style={styles.amount}>{totalAmount}</Text>
        <Hr style={styles.divider} />
        <Text style={styles.note}>
          This quote includes all deliverables discussed. Please review and approve to proceed.
        </Text>
      </Section>

      <Section style={styles.action}>
        <ActionButton href={actionUrl} variant="primary">
          Review & Approve
        </ActionButton>
      </Section>
    </Layout>
  );
};

const styles = {
  heading: {
    fontSize: theme.fontSize.xxl,
    fontWeight: '700',
    textAlign: 'center' as const,
    margin: '0 0 24px',
    color: theme.colors.text.primary,
  },
  intro: {
    textAlign: 'center' as const,
    fontSize: theme.fontSize.base,
    color: theme.colors.text.primary,
    marginBottom: '32px',
  },
  card: {
    backgroundColor: '#fff',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.lg,
    padding: '32px',
    textAlign: 'center' as const,
    marginBottom: '32px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
  },
  amountLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    letterSpacing: '1px',
    marginBottom: '8px',
  },
  amount: {
    fontSize: '36px',
    fontWeight: '800',
    color: theme.colors.primary,
    margin: '0 0 24px',
    letterSpacing: '-1px',
  },
  divider: {
    borderColor: theme.colors.border,
    margin: '0 auto 16px',
    width: '40px',
  },
  note: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    margin: '0',
    lineHeight: '1.5',
  },
  action: {
    textAlign: 'center' as const,
  },
};

export default QuoteReceived;
