import { Section, Text, Heading, Hr } from '@react-email/components';
import { Layout } from '../components/Layout';
import { ActionButton } from '../components/Button';
import { InfoRow } from '../components/InfoRow';
import { theme } from '../theme';

interface PaymentReceiptProps {
  requestTitle: string;
  totalAmount: string;
  paymentId: string;
  actionUrl: string;
}

export const PaymentReceipt = ({
  requestTitle,
  totalAmount,
  paymentId,
  actionUrl,
}: PaymentReceiptProps) => {
  return (
    <Layout title="Payment Receipt" preview={`Receipt for ${requestTitle}`}>
      <Section style={styles.iconContainer}>
        <Text style={styles.icon}>✅</Text>
      </Section>

      <Heading style={styles.heading}>Payment Successful</Heading>

      <Text style={styles.intro}>
        Thank you! We have received your payment for <strong>{requestTitle}</strong>.
      </Text>

      <Section style={styles.receipt}>
        <InfoRow label="Amount Paid" value={totalAmount} isTotal />
        <InfoRow label="Payment ID" value={paymentId} />
        <InfoRow label="Date" value={new Date().toLocaleDateString()} />
        <Hr style={{ borderColor: theme.colors.border, margin: '16px 0' }} />
        <Text style={styles.footer}>
          An invoice PDF has been generated and is available in your portal.
        </Text>
      </Section>

      <Section style={styles.action}>
        <ActionButton href={actionUrl}>View Invoice</ActionButton>
      </Section>
    </Layout>
  );
};

const styles = {
  iconContainer: {
    textAlign: 'center' as const,
    marginBottom: '16px',
  },
  icon: {
    fontSize: '48px',
    margin: '0',
  },
  heading: {
    fontSize: theme.fontSize.xxl,
    fontWeight: '700',
    textAlign: 'center' as const,
    margin: '0 0 16px',
    color: theme.colors.text.primary,
  },
  intro: {
    textAlign: 'center' as const,
    fontSize: theme.fontSize.base,
    color: theme.colors.text.secondary,
    marginBottom: '32px',
  },
  receipt: {
    backgroundColor: '#fff',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.md,
    padding: '24px',
    marginBottom: '32px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  footer: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.muted,
    fontStyle: 'italic' as const,
    margin: '0',
  },
  action: {
    textAlign: 'center' as const,
    marginBottom: '8px',
  },
};

export default PaymentReceipt;
