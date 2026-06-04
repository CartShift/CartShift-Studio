import { Section, Text, Hr } from '@react-email/components';
import { EmailHero, FinePrint, Layout, SurfaceCard } from '../components/Layout';
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
      <EmailHero
        eyebrow="Payment confirmed"
        title="Payment successful"
        description={
          <>
            Thank you. We received your payment for <strong>{requestTitle}</strong>.
          </>
        }
      />

      <SurfaceCard>
        <Text style={styles.receiptLabel}>Receipt summary</Text>
        <InfoRow label="Amount Paid" value={totalAmount} isTotal />
        <InfoRow label="Payment ID" value={paymentId} />
        <InfoRow label="Date" value={new Date().toLocaleDateString()} />
        <Hr style={{ borderColor: theme.colors.border, margin: '16px 0' }} />
        <Text style={styles.footer}>
          An invoice PDF has been generated and is available in your portal.
        </Text>
      </SurfaceCard>

      <Section style={styles.action}>
        <ActionButton href={actionUrl}>View Invoice</ActionButton>
      </Section>

      <FinePrint>Keep this email for your records.</FinePrint>
    </Layout>
  );
};

const styles = {
  receiptLabel: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
    letterSpacing: '1.4px',
    margin: '0 0 12px',
    textTransform: 'uppercase' as const,
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
