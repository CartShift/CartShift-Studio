import { Section, Text, Heading } from '@react-email/components';
import { Layout } from '../components/Layout';
import { ActionButton } from '../components/Button';
import { StatusBadge, StatusType } from '../components/StatusBadge';
import { theme } from '../theme';

interface StatusUpdateProps {
  requestTitle: string;
  statusLabel: string;
  statusStyle?: string; // Legacy prop, we'll try to deduce the type or ignore it
  actionUrl: string;
  requestId: string;
}

export const StatusUpdate = ({ requestTitle, statusLabel, actionUrl }: StatusUpdateProps) => {
  // Map label to visual type
  const getStatusType = (label: string): StatusType => {
    const l = label.toLowerCase();
    if (l.includes('progress')) return 'info';
    if (l.includes('review')) return 'warning';
    if (l.includes('delivered') || l.includes('paid')) return 'success';
    if (l.includes('closed')) return 'neutral';
    return 'neutral';
  };

  const statusType = getStatusType(statusLabel);

  return (
    <Layout title={`Status Update: ${requestTitle}`} preview={`Your request is now ${statusLabel}`}>
      <Heading style={styles.heading}>Status Information</Heading>

      <Section style={styles.statusContainer}>
        <Text style={styles.subheading}>Your request:</Text>
        <Text style={styles.title}>{requestTitle}</Text>
        <Text style={styles.arrow}>↓</Text>
        <StatusBadge type={statusType}>{statusLabel}</StatusBadge>
      </Section>

      <Text style={styles.message}>
        The status of your request has been updated. You can view the details and any new comments
        in the portal.
      </Text>

      <Section style={styles.action}>
        <ActionButton href={actionUrl}>View Request</ActionButton>
      </Section>
    </Layout>
  );
};

const styles = {
  heading: {
    fontSize: theme.fontSize.xxl,
    fontWeight: '700',
    textAlign: 'center' as const,
    margin: '0 0 32px',
    color: theme.colors.text.primary,
  },
  statusContainer: {
    backgroundColor: '#fff',
    border: `1px dashed ${theme.colors.border}`,
    borderRadius: theme.borderRadius.lg,
    padding: '32px',
    textAlign: 'center' as const,
    marginBottom: '32px',
  },
  subheading: {
    margin: '0 0 8px',
    color: theme.colors.text.secondary,
    fontSize: theme.fontSize.sm,
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
  },
  title: {
    margin: '0 0 16px',
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  arrow: {
    display: 'block',
    fontSize: '24px',
    color: theme.colors.text.muted,
    marginBottom: '16px',
  },
  message: {
    textAlign: 'center' as const,
    color: theme.colors.text.primary,
    fontSize: theme.fontSize.base,
    marginBottom: '32px',
    lineHeight: '1.6',
  },
  action: {
    textAlign: 'center' as const,
  },
};

export default StatusUpdate;
